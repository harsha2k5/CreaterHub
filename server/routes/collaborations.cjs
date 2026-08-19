const express = require('express');
const router = express.Router();
const { Collaboration, Campaign, Brand, Creator, Payment, ContentSubmission, Notification } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/collaborations
router.get('/', authenticateToken, async (req, res) => {
    try {
        let collabs = [];

        if (req.user.role === 'brand') {
            const brand = await Brand.findOne({ user_id: req.user.id }).lean();
            if (!brand) return res.json({ success: true, collaborations: [] });

            const rawCollabs = await Collaboration.find({ brand_id: brand.id }).sort({ created_at: -1 }).lean();

            const campaignIds = [...new Set(rawCollabs.map(c => c.campaign_id))];
            const creatorIds = [...new Set(rawCollabs.map(c => c.creator_id))];
            const collabIds = rawCollabs.map(c => c.id);

            const [campaigns, creators, payments, submissions] = await Promise.all([
                Campaign.find({ id: { $in: campaignIds } }).lean(),
                Creator.find({ id: { $in: creatorIds } }).lean(),
                Payment.find({ collaboration_id: { $in: collabIds } }).lean(),
                ContentSubmission.find({ collaboration_id: { $in: collabIds } }).lean()
            ]);

            const campaignMap = {}; campaigns.forEach(c => campaignMap[c.id] = c);
            const creatorMap = {}; creators.forEach(cr => creatorMap[cr.id] = cr);
            const paymentMap = {}; payments.forEach(p => paymentMap[p.collaboration_id] = p);
            const subMap = {}; submissions.forEach(s => subMap[s.collaboration_id] = s);

            collabs = rawCollabs.map(col => {
                const c = campaignMap[col.campaign_id] || {};
                const cr = creatorMap[col.creator_id] || {};
                const p = paymentMap[col.id] || {};
                const cs = subMap[col.id] || {};
                return {
                    ...col,
                    campaign_title: c.title || '',
                    reward_per_creator: c.reward_per_creator || 0,
                    platform: c.platform || '',
                    location_name: c.location_name || '',
                    creator_name: cr.full_name || '',
                    creator_username: cr.username || '',
                    creator_avatar: cr.avatar_url || '',
                    payment_status: p.status || null,
                    amount_paid: p.amount || null,
                    transaction_id: p.transaction_id || null,
                    content_url: cs.content_url || null,
                    submitted_caption: cs.caption || null,
                    screenshot_url: cs.screenshot_url || null,
                    submission_notes: cs.notes || null,
                    brand_feedback: cs.brand_feedback || null
                };
            });

        } else if (req.user.role === 'creator') {
            const creator = await Creator.findOne({ user_id: req.user.id }).lean();
            if (!creator) return res.json({ success: true, collaborations: [] });

            const rawCollabs = await Collaboration.find({ creator_id: creator.id }).sort({ created_at: -1 }).lean();

            const campaignIds = [...new Set(rawCollabs.map(c => c.campaign_id))];
            const brandIds = [...new Set(rawCollabs.map(c => c.brand_id))];
            const collabIds = rawCollabs.map(c => c.id);

            const [campaigns, brands, payments, submissions] = await Promise.all([
                Campaign.find({ id: { $in: campaignIds } }).lean(),
                Brand.find({ id: { $in: brandIds } }).lean(),
                Payment.find({ collaboration_id: { $in: collabIds } }).lean(),
                ContentSubmission.find({ collaboration_id: { $in: collabIds } }).lean()
            ]);

            const campaignMap = {}; campaigns.forEach(c => campaignMap[c.id] = c);
            const brandMap = {}; brands.forEach(b => brandMap[b.id] = b);
            const paymentMap = {}; payments.forEach(p => paymentMap[p.collaboration_id] = p);
            const subMap = {}; submissions.forEach(s => subMap[s.collaboration_id] = s);

            collabs = rawCollabs.map(col => {
                const c = campaignMap[col.campaign_id] || {};
                const b = brandMap[col.brand_id] || {};
                const p = paymentMap[col.id] || {};
                const cs = subMap[col.id] || {};
                return {
                    ...col,
                    campaign_title: c.title || '',
                    reward_per_creator: c.reward_per_creator || 0,
                    platform: c.platform || '',
                    location_name: c.location_name || '',
                    brand_name: b.company_name || '',
                    brand_logo: b.logo_url || '',
                    payment_status: p.status || null,
                    amount_paid: p.amount || null,
                    transaction_id: p.transaction_id || null,
                    content_url: cs.content_url || null,
                    submitted_caption: cs.caption || null,
                    screenshot_url: cs.screenshot_url || null,
                    submission_notes: cs.notes || null,
                    brand_feedback: cs.brand_feedback || null
                };
            });
        }

        return res.json({ success: true, count: collabs.length, collaborations: collabs });
    } catch (err) {
        console.error('Error fetching collaborations:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch collaborations.' });
    }
});

// GET /api/collaborations/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const collab = await Collaboration.findOne({ id: req.params.id }).lean();

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        const campaign = await Campaign.findOne({ id: collab.campaign_id }).lean();
        const brand = await Brand.findOne({ id: collab.brand_id }).lean();
        const creator = await Creator.findOne({ id: collab.creator_id }).lean();

        if (campaign) {
            collab.campaign_title = campaign.title;
            collab.campaign_description = campaign.description;
            collab.deliverables = Array.isArray(campaign.deliverables) ? campaign.deliverables : (typeof campaign.deliverables === 'string' ? JSON.parse(campaign.deliverables || '[]') : []);
            collab.reward_per_creator = campaign.reward_per_creator;
            collab.platform = campaign.platform;
            collab.location_name = campaign.location_name;
            collab.guidelines = campaign.guidelines;
        }

        if (brand) {
            collab.brand_name = brand.company_name;
            collab.brand_logo = brand.logo_url;
        }

        if (creator) {
            collab.creator_name = creator.full_name;
            collab.creator_avatar = creator.avatar_url;
            collab.creator_user_id = creator.user_id;
        }

        const submissions = await ContentSubmission.find({ collaboration_id: collab.id }).sort({ submitted_at: -1 }).lean();
        const payment = await Payment.findOne({ collaboration_id: collab.id }).lean();

        return res.json({ success: true, collaboration: collab, submissions, payment });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching collaboration details.' });
    }
});

// POST /api/collaborations/:id/submit (Creator Submits Content Proof)
router.post('/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { content_url, platform, caption, screenshot_url, notes } = req.body;

        const collab = await Collaboration.findOne({ id: req.params.id }).lean();

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        const campaign = await Campaign.findOne({ id: collab.campaign_id }).lean();
        const brand = await Brand.findOne({ id: collab.brand_id }).lean();

        let formattedUrl = (content_url || '').trim();
        if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl;
        }

        let formattedScreenshot = (screenshot_url || '').trim();
        if (formattedScreenshot && !formattedScreenshot.startsWith('http://') && !formattedScreenshot.startsWith('https://')) {
            formattedScreenshot = 'https://' + formattedScreenshot;
        }

        // Remove old submission for clean state
        await ContentSubmission.deleteMany({ collaboration_id: collab.id });

        const subId = 'sub_' + Date.now();
        await ContentSubmission.create({
            id: subId,
            collaboration_id: collab.id,
            content_url: formattedUrl,
            platform: platform || 'Instagram',
            caption: caption || '',
            screenshot_url: formattedScreenshot || '',
            notes: notes || '',
            status: 'submitted'
        });

        // Update collaboration status step to content_submitted (Step 4)
        await Collaboration.updateOne({ id: collab.id }, { status: 'content_submitted', current_step: 4 });

        // Notify Brand
        if (brand && brand.user_id) {
            await Notification.create({
                id: 'notif_' + Date.now(),
                user_id: brand.user_id,
                title: '📸 Content Proof Submitted',
                message: `Creator submitted content for "${campaign ? campaign.title : 'Campaign'}"`,
                link: '/collaborations'
            });
        }

        return res.status(201).json({ success: true, message: 'Content proof submitted successfully!', submissionId: subId });
    } catch (err) {
        console.error('Error submitting content:', err);
        return res.status(500).json({ success: false, error: 'Submission failed. ' + err.message });
    }
});

// PUT /api/collaborations/:id/review (Brand Approves or Requests Revision)
router.put('/:id/review', authenticateToken, async (req, res) => {
    try {
        const { action, feedback } = req.body; // 'approve' or 'revision'

        const collab = await Collaboration.findOne({ id: req.params.id }).lean();

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        const campaign = await Campaign.findOne({ id: collab.campaign_id }).lean();
        const creator = await Creator.findOne({ id: collab.creator_id }).lean();

        const campaignTitle = campaign ? campaign.title : 'Campaign';
        const creatorUserId = creator ? creator.user_id : null;

        if (action === 'approve') {
            await Collaboration.updateOne({ id: collab.id }, { status: 'approved', current_step: 5 });
            await ContentSubmission.updateOne({ collaboration_id: collab.id }, { status: 'approved', brand_feedback: feedback || 'Approved!' });

            if (creatorUserId) {
                await Notification.create({
                    id: 'notif_' + Date.now(),
                    user_id: creatorUserId,
                    title: '✅ Content Approved!',
                    message: `Brand approved your content for "${campaignTitle}". Payment release pending.`,
                    link: '/collaborations'
                });
            }

            return res.json({ success: true, message: 'Content approved successfully!' });
        } else if (action === 'revision') {
            await Collaboration.updateOne({ id: collab.id }, { status: 'revision_requested', current_step: 3 });
            await ContentSubmission.updateOne({ collaboration_id: collab.id }, { status: 'revision_requested', brand_feedback: feedback || 'Revision requested.' });

            if (creatorUserId) {
                await Notification.create({
                    id: 'notif_' + Date.now(),
                    user_id: creatorUserId,
                    title: '✏️ Revision Requested',
                    message: `Brand requested revision for "${campaignTitle}": ${feedback || 'Check notes.'}`,
                    link: '/collaborations'
                });
            }

            return res.json({ success: true, message: 'Revision requested.' });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid review action.' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Review action failed.' });
    }
});

// POST /api/collaborations/:id/release-payment (Brand Releases Escrow Payment)
router.post('/:id/release-payment', authenticateToken, async (req, res) => {
    try {
        const collab = await Collaboration.findOne({ id: req.params.id }).lean();

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        const campaign = await Campaign.findOne({ id: collab.campaign_id }).lean();
        const creator = await Creator.findOne({ id: collab.creator_id }).lean();

        const existingPayment = await Payment.findOne({ collaboration_id: collab.id });
        if (existingPayment) {
            return res.status(400).json({ success: false, error: 'Payment already released for this collaboration.' });
        }

        const paymentId = 'pay_' + Date.now();
        const txnId = 'TXN_ESCROW_' + Math.floor(100000 + Math.random() * 900000);

        const reward = campaign ? campaign.reward_per_creator : 0;
        const campaignTitle = campaign ? campaign.title : 'Campaign';

        await Payment.create({
            id: paymentId,
            collaboration_id: collab.id,
            brand_id: collab.brand_id,
            creator_id: collab.creator_id,
            amount: reward,
            payment_type: 'Escrow Release',
            status: 'paid',
            transaction_id: txnId
        });

        // Update collaboration to completed (Step 6)
        await Collaboration.updateOne({ id: collab.id }, { status: 'completed', current_step: 6 });

        // Notify Creator
        if (creator && creator.user_id) {
            await Notification.create({
                id: 'notif_' + Date.now(),
                user_id: creator.user_id,
                title: '💸 Payment Released!',
                message: `₹${reward.toLocaleString()} transferred to your account for "${campaignTitle}".`,
                link: '/earnings'
            });
        }

        return res.json({
            success: true,
            message: `Payment of ₹${reward.toLocaleString()} released successfully!`,
            transactionId: txnId
        });
    } catch (err) {
        console.error('Error releasing payment:', err);
        return res.status(500).json({ success: false, error: 'Payment release failed.' });
    }
});

module.exports = router;
