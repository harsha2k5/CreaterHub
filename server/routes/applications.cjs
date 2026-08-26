const express = require('express');
const router = express.Router();
const { Application, Campaign, Brand, Creator, Collaboration, Conversation, Message, Notification } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');
const { processCreatorRecord } = require('./creators.cjs');

// GET /api/applications
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'brand') {
            const brand = await Brand.findOne({ user_id: req.user.id }).lean();
            if (!brand) return res.json({ success: true, applications: [] });

            const campaigns = await Campaign.find({ brand_id: brand.id }).lean();
            const campaignIds = campaigns.map(c => c.id);
            const campaignMap = {};
            campaigns.forEach(c => { campaignMap[c.id] = c; });

            // Find apps for brand's campaigns OR direct pitches sent by brand
            const rawApps = await Application.find({
                $or: [
                    { campaign_id: { $in: campaignIds } },
                    { brand_id: brand.id }
                ]
            }).sort({ applied_at: -1 }).lean();

            const creatorIds = [...new Set(rawApps.map(a => a.creator_id))];
            const rawCreators = await Creator.find({ id: { $in: creatorIds } }).lean();
            const creatorMap = {};
            rawCreators.forEach(cr => { creatorMap[cr.id] = processCreatorRecord(cr); });

            const apps = rawApps.map(a => {
                const campaign = campaignMap[a.campaign_id] || {};
                const creator = creatorMap[a.creator_id] || {};
                return {
                    ...a,
                    campaign_title: a.custom_title || campaign.title || 'Direct Pitch',
                    reward_per_creator: a.custom_budget || campaign.reward_per_creator || 0,
                    platform: campaign.platform || 'Instagram',
                    creator_name: creator.full_name || '',
                    creator_username: creator.username || '',
                    creator_avatar: creator.avatar_url || '',
                    creator_followers: creator.followers || 0,
                    creator_engagement: creator.engagement_rate || 0,
                    creator_city: creator.city || '',
                    creator_rating: creator.rating || 5.0
                };
            });

            return res.json({ success: true, count: apps.length, applications: apps });

        } else if (req.user.role === 'creator') {
            const creator = await Creator.findOne({ user_id: req.user.id }).lean();
            if (!creator) return res.json({ success: true, applications: [] });

            const rawApps = await Application.find({ creator_id: creator.id }).sort({ applied_at: -1 }).lean();

            const campaignIds = [...new Set(rawApps.map(a => a.campaign_id).filter(Boolean))];
            const campaigns = await Campaign.find({ id: { $in: campaignIds } }).lean();
            const campaignMap = {};
            campaigns.forEach(c => { campaignMap[c.id] = c; });

            // Gather brand IDs from campaign or application.brand_id
            const brandIds = [...new Set([
                ...campaigns.map(c => c.brand_id),
                ...rawApps.map(a => a.brand_id).filter(Boolean)
            ])];

            const brands = await Brand.find({ id: { $in: brandIds } }).lean();
            const brandMap = {};
            brands.forEach(b => { brandMap[b.id] = b; });

            const apps = rawApps.map(a => {
                const campaign = campaignMap[a.campaign_id] || {};
                const targetBrandId = a.brand_id || campaign.brand_id;
                const brand = brandMap[targetBrandId] || {};
                return {
                    ...a,
                    campaign_title: a.custom_title || campaign.title || 'Direct Pitch',
                    location_name: campaign.location_name || brand.city || 'Remote',
                    reward_per_creator: a.custom_budget || campaign.reward_per_creator || 0,
                    platform: campaign.platform || 'Instagram',
                    brand_name: brand.company_name || 'Brand',
                    brand_logo: brand.logo_url || ''
                };
            });

            return res.json({ success: true, count: apps.length, applications: apps });
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized role.' });
        }
    } catch (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
    }
});

// PUT /api/applications/:id/status (Accept or Reject)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status. Must be accepted or rejected.' });
        }

        const app = await Application.findOne({ id: req.params.id }).lean();
        if (!app) {
            return res.status(404).json({ success: false, error: 'Application not found.' });
        }

        const campaign = app.campaign_id ? await Campaign.findOne({ id: app.campaign_id }).lean() : null;
        const creator = await Creator.findOne({ id: app.creator_id }).lean();
        const brandId = app.brand_id || (campaign ? campaign.brand_id : null);
        const brand = brandId ? await Brand.findOne({ id: brandId }).lean() : null;

        // Update application status
        await Application.updateOne({ id: app.id }, { status });

        if (status === 'accepted' && creator && brand) {
            // Check if collaboration already exists
            const existingCollab = await Collaboration.findOne({ application_id: app.id }).lean();
            let collabId = existingCollab ? existingCollab.id : 'collab_' + Date.now();

            if (!existingCollab) {
                await Collaboration.create({
                    id: collabId,
                    campaign_id: app.campaign_id || 'direct_pitch',
                    application_id: app.id,
                    brand_id: brand.id,
                    creator_id: app.creator_id,
                    status: 'active',
                    current_step: 2
                });

                if (app.campaign_id) {
                    await Campaign.updateOne({ id: app.campaign_id }, { $inc: { creators_hired: 1 } });
                }

                // Create or find Conversation
                const existingConv = await Conversation.findOne({ brand_id: brand.id, creator_id: app.creator_id }).lean();
                let convId = existingConv ? existingConv.id : 'conv_' + Date.now();

                if (!existingConv) {
                    await Conversation.create({
                        id: convId,
                        brand_id: brand.id,
                        creator_id: app.creator_id,
                        collaboration_id: collabId,
                        last_message: 'Collaboration accepted! Let us begin.'
                    });
                }

                // Notification to Brand
                if (brand.user_id) {
                    await Notification.create({
                        id: 'notif_' + Date.now(),
                        user_id: brand.user_id,
                        title: '🎉 Pitch Accepted!',
                        message: `${creator.full_name} accepted your pitch for "${app.custom_title || (campaign ? campaign.title : 'Direct Pitch')}".`,
                        link: '/collaborations'
                    });
                }
            }

            // Notification to Creator
            if (creator.user_id) {
                await Notification.create({
                    id: 'notif_' + Date.now(),
                    user_id: creator.user_id,
                    title: '🎉 Application / Pitch Accepted!',
                    message: `Collaboration for "${app.custom_title || (campaign ? campaign.title : 'Direct Pitch')}" is now active.`,
                    link: '/collaborations'
                });
            }
        } else if (status === 'rejected' && brand) {
            if (brand.user_id) {
                await Notification.create({
                    id: 'notif_' + Date.now(),
                    user_id: brand.user_id,
                    title: 'Pitch Declined',
                    message: `${creator ? creator.full_name : 'Creator'} declined the pitch for "${app.custom_title || (campaign ? campaign.title : 'Direct Pitch')}".`,
                    link: '/brand-dashboard'
                });
            }
        }

        return res.json({ success: true, message: `Application / Pitch ${status} successfully.` });
    } catch (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ success: false, error: 'Failed to update status.' });
    }
});

module.exports = router;
