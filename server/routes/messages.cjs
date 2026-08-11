const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/messages/conversations
router.get('/conversations', authenticateToken, (req, res) => {
    try {
        let conversations = [];

        if (req.user.role === 'brand') {
            const brand = db.prepare('SELECT id FROM brands WHERE user_id = ?').get(req.user.id);
            if (!brand) return res.json({ success: true, conversations: [] });

            conversations = db.prepare(`
                SELECT conv.*, cr.full_name AS other_party_name, cr.avatar_url AS other_party_avatar, cr.username AS other_party_handle,
                       c.title AS campaign_title
                FROM conversations conv
                JOIN creators cr ON conv.creator_id = cr.id
                LEFT JOIN collaborations col ON conv.collaboration_id = col.id
                LEFT JOIN campaigns c ON col.campaign_id = c.id
                WHERE conv.brand_id = ?
                ORDER BY conv.updated_at DESC
            `).all(brand.id);

        } else if (req.user.role === 'creator') {
            const creator = db.prepare('SELECT id FROM creators WHERE user_id = ?').get(req.user.id);
            if (!creator) return res.json({ success: true, conversations: [] });

            conversations = db.prepare(`
                SELECT conv.*, b.company_name AS other_party_name, b.logo_url AS other_party_avatar,
                       c.title AS campaign_title
                FROM conversations conv
                JOIN brands b ON conv.brand_id = b.id
                LEFT JOIN collaborations col ON conv.collaboration_id = col.id
                LEFT JOIN campaigns c ON col.campaign_id = c.id
                WHERE conv.creator_id = ?
                ORDER BY conv.updated_at DESC
            `).all(creator.id);
        }

        return res.json({ success: true, count: conversations.length, conversations });
    } catch (err) {
        console.error('Error fetching conversations:', err);
        return res.status(500).json({ success: false, error: 'Failed to load chat conversations.' });
    }
});

// GET /api/messages/:conversationId
router.get('/:conversationId', authenticateToken, (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = db.prepare(`
            SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
        `).all(conversationId);

        // Mark unread messages as read
        db.prepare(`
            UPDATE messages SET read_status = 1 WHERE conversation_id = ? AND sender_id != ?
        `).run(conversationId, req.user.id);

        return res.json({ success: true, count: messages.length, messages });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load message thread.' });
    }
});

// POST /api/messages/:conversationId
router.post('/:conversationId', authenticateToken, (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const { text, attachment_url } = req.body;

        if (!text && !attachment_url) {
            return res.status(400).json({ success: false, error: 'Message text or attachment required.' });
        }

        const msgId = 'msg_' + Date.now();
        db.prepare(`
            INSERT INTO messages (id, conversation_id, sender_id, text, attachment_url, read_status)
            VALUES (?, ?, ?, ?, ?, 0)
        `).run(msgId, conversationId, req.user.id, text || '', attachment_url || '');

        // Update last message in conversation
        db.prepare(`
            UPDATE conversations SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(text || 'Attachment sent', conversationId);

        return res.status(201).json({ success: true, messageId: msgId, text, created_at: new Date().toISOString() });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
});

module.exports = router;
