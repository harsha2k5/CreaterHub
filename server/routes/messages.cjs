const express = require('express');
const router = express.Router();
const { Conversation, Message, Brand, Creator, Collaboration, Campaign } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/messages/conversations
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        let conversations = [];

        if (req.user.role === 'brand') {
            const brand = await Brand.findOne({ user_id: req.user.id }).lean();
            if (!brand) return res.json({ success: true, conversations: [] });

            const rawConvs = await Conversation.find({ brand_id: brand.id }).sort({ updated_at: -1 }).lean();

            const creatorIds = [...new Set(rawConvs.map(c => c.creator_id))];
            const collabIds = rawConvs.map(c => c.collaboration_id).filter(Boolean);

            const [creators, collabs] = await Promise.all([
                Creator.find({ id: { $in: creatorIds } }).lean(),
                Collaboration.find({ id: { $in: collabIds } }).lean()
            ]);

            const campaignIds = [...new Set(collabs.map(c => c.campaign_id))];
            const campaigns = await Campaign.find({ id: { $in: campaignIds } }).lean();

            const creatorMap = {}; creators.forEach(cr => creatorMap[cr.id] = cr);
            const collabMap = {}; collabs.forEach(col => collabMap[col.id] = col);
            const campaignMap = {}; campaigns.forEach(camp => campaignMap[camp.id] = camp);

            conversations = rawConvs.map(conv => {
                const cr = creatorMap[conv.creator_id] || {};
                const col = collabMap[conv.collaboration_id] || {};
                const camp = campaignMap[col.campaign_id] || {};

                return {
                    ...conv,
                    other_party_name: cr.full_name || 'Creator',
                    other_party_avatar: cr.avatar_url || '',
                    other_party_handle: cr.username || '',
                    campaign_title: camp.title || ''
                };
            });

        } else if (req.user.role === 'creator') {
            const creator = await Creator.findOne({ user_id: req.user.id }).lean();
            if (!creator) return res.json({ success: true, conversations: [] });

            const rawConvs = await Conversation.find({ creator_id: creator.id }).sort({ updated_at: -1 }).lean();

            const brandIds = [...new Set(rawConvs.map(c => c.brand_id))];
            const collabIds = rawConvs.map(c => c.collaboration_id).filter(Boolean);

            const [brands, collabs] = await Promise.all([
                Brand.find({ id: { $in: brandIds } }).lean(),
                Collaboration.find({ id: { $in: collabIds } }).lean()
            ]);

            const campaignIds = [...new Set(collabs.map(c => c.campaign_id))];
            const campaigns = await Campaign.find({ id: { $in: campaignIds } }).lean();

            const brandMap = {}; brands.forEach(b => brandMap[b.id] = b);
            const collabMap = {}; collabs.forEach(col => collabMap[col.id] = col);
            const campaignMap = {}; campaigns.forEach(camp => campaignMap[camp.id] = camp);

            conversations = rawConvs.map(conv => {
                const b = brandMap[conv.brand_id] || {};
                const col = collabMap[conv.collaboration_id] || {};
                const camp = campaignMap[col.campaign_id] || {};

                return {
                    ...conv,
                    other_party_name: b.company_name || 'Brand',
                    other_party_avatar: b.logo_url || '',
                    campaign_title: camp.title || ''
                };
            });
        }

        return res.json({ success: true, count: conversations.length, conversations });
    } catch (err) {
        console.error('Error fetching conversations:', err);
        return res.status(500).json({ success: false, error: 'Failed to load chat conversations.' });
    }
});

// GET /api/messages/:conversationId
router.get('/:conversationId', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = await Message.find({ conversation_id: conversationId }).sort({ created_at: 1 }).lean();

        // Mark unread messages as read
        await Message.updateMany(
            { conversation_id: conversationId, sender_id: { $ne: req.user.id } },
            { read_status: 1 }
        );

        return res.json({ success: true, count: messages.length, messages });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load message thread.' });
    }
});

// POST /api/messages/:conversationId
router.post('/:conversationId', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const { text, attachment_url } = req.body;

        if (!text && !attachment_url) {
            return res.status(400).json({ success: false, error: 'Message text or attachment required.' });
        }

        const msgId = 'msg_' + Date.now();
        await Message.create({
            id: msgId,
            conversation_id: conversationId,
            sender_id: req.user.id,
            text: text || '',
            attachment_url: attachment_url || '',
            read_status: 0
        });

        // Update last message in conversation
        await Conversation.updateOne(
            { id: conversationId },
            { last_message: text || 'Attachment sent', updated_at: new Date() }
        );

        return res.status(201).json({ success: true, messageId: msgId, text, created_at: new Date().toISOString() });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
});

module.exports = router;
