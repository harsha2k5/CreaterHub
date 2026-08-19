const express = require('express');
const router = express.Router();
const { Application, Campaign, Brand, Creator, Collaboration, Conversation, Message, Notification } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

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

            const rawApps = await Application.find({ campaign_id: { $in: campaignIds } }).sort({ applied_at: -1 }).lean();

            const creatorIds = [...new Set(rawApps.map(a => a.creator_id))];
            const creators = await Creator.find({ id: { $in: creatorIds } }).lean();
            const creatorMap = {};
            creators.forEach(cr => { creatorMap[cr.id] = cr; });

            const apps = rawApps.map(a => {
                const campaign = campaignMap[a.campaign_id] || {};
                const creator = creatorMap[a.creator_id] || {};
                return {
                    ...a,
                    campaign_title: campaign.title || '',
                    reward_per_creator: campaign.reward_per_creator || 0,
                    platform: campaign.platform || '',
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

            const campaignIds = [...new Set(rawApps.map(a => a.campaign_id))];
            const campaigns = await Campaign.find({ id: { $in: campaignIds } }).lean();
            const campaignMap = {};
            campaigns.forEach(c => { campaignMap[c.id] = c; });

            const brandIds = [...new Set(campaigns.map(c => c.brand_id))];
            const brands = await Brand.find({ id: { $in: brandIds } }).lean();
            const brandMap = {};
            brands.forEach(b => { brandMap[b.id] = b; });

            const apps = rawApps.map(a => {
                const campaign = campaignMap[a.campaign_id] || {};
                const brand = brandMap[campaign.brand_id] || {};
                return {
                    ...a,
                    campaign_title: campaign.title || '',
                    location_name: campaign.location_name || '',
                    reward_per_creator: campaign.reward_per_creator || 0,
                    platform: campaign.platform || '',
                    brand_name: brand.company_name || '',
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

        const campaign = await Campaign.findOne({ id: app.campaign_id }).lean();
        const creator = await Creator.findOne({ id: app.creator_id }).lean();

        // Update application status
        await Application.updateOne({ id: app.id }, { status });

        if (status === 'accepted' && campaign && creator) {
            // Check if collaboration already exists
            const existingCollab = await Collaboration.findOne({ application_id: app.id }).lean();
            let collabId = existingCollab ? existingCollab.id : 'collab_' + Date.now();

            if (!existingCollab) {
                await Collaboration.create({
                    id: collabId,
                    campaign_id: app.campaign_id,
                    application_id: app.id,
                    brand_id: campaign.brand_id,
                    creator_id: app.creator_id,
                    status: 'active',
                    current_step: 2
                });

                // Update campaign hired count
                await Campaign.updateOne({ id: app.campaign_id }, { $inc: { creators_hired: 1 } });

                // Create or find Conversation
                const existingConv = await Conversation.findOne({ brand_id: campaign.brand_id, creator_id: app.creator_id }).lean();
                let convId = existingConv ? existingConv.id : 'conv_' + Date.now();

                if (!existingConv) {
                    await Conversation.create({
                        id: convId,
                        brand_id: campaign.brand_id,
                        creator_id: app.creator_id,
                        collaboration_id: collabId,
                        last_message: 'Collaboration accepted! Let us begin.'
                    });
                }

                // Initial Message
                const brand = await Brand.findOne({ id: campaign.brand_id }).lean();
                if (brand) {
                    await Message.create({
                        id: 'msg_' + Date.now(),
                        conversation_id: convId,
                        sender_id: brand.user_id,
                        text: `Congratulations! Your application for "${campaign.title}" has been accepted. Let us coordinate content creation!`,
                        read_status: 0
                    });
                }
            }

            // Send Notification to Creator
            if (creator.user_id) {
                await Notification.create({
                    id: 'notif_' + Date.now(),
                    user_id: creator.user_id,
                    title: '🎉 Application Accepted!',
                    message: `Your application for "${campaign.title}" has been accepted.`,
                    link: '/collaborations'
                });
            }
        }

        return res.json({ success: true, message: `Application ${status} successfully.` });
    } catch (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ success: false, error: 'Failed to update application status.' });
    }
});

module.exports = router;
