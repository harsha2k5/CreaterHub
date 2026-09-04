const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

function generateId(prefix = 'msg') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/messages/conversations - List conversations for user
router.get('/conversations', authenticateToken, (req, res) => {
    try {
        let sql = '';
        let params = [];

        if (req.user.role === 'creator') {
            const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
            if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

            sql = `
                SELECT conv.*, b.company_name as other_name, b.logo_url as other_avatar,
                       b.category as other_subtitle,
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conv.id AND m.sender_id != ? AND m.read_status = 0) as unread_count
                FROM conversations conv
                JOIN brand_profiles b ON conv.brand_id = b.id
                WHERE conv.creator_id = ?
                ORDER BY conv.updated_at DESC
            `;
            params = [req.user.id, creator.id];
        } else if (req.user.role === 'brand') {
            const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
            if (!brand) return res.status(404).json({ success: false, error: 'Brand not found.' });

            sql = `
                SELECT conv.*, cr.full_name as other_name, cr.avatar_url as other_avatar,
                       cr.username as other_subtitle,
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conv.id AND m.sender_id != ? AND m.read_status = 0) as unread_count
                FROM conversations conv
                JOIN creator_profiles cr ON conv.creator_id = cr.id
                WHERE conv.brand_id = ?
                ORDER BY conv.updated_at DESC
            `;
            params = [req.user.id, brand.id];
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized.' });
        }

        const convs = query(sql, params);
        return res.json({ success: true, conversations: convs });
    } catch (err) {
        console.error('Error fetching conversations:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve conversations.' });
    }
});

// GET /api/messages/:conversationId - Get thread messages
router.get('/:conversationId', authenticateToken, (req, res) => {
    try {
        const { conversationId } = req.params;
        const conv = queryOne('SELECT * FROM conversations WHERE id = ?', [conversationId]);
        if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found.' });

        // Verify authorization
        let isAuthorized = req.user.role === 'admin';
        if (!isAuthorized) {
            if (req.user.role === 'creator') {
                const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
                isAuthorized = creator && creator.id === conv.creator_id;
            } else if (req.user.role === 'brand') {
                const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
                isAuthorized = brand && brand.id === conv.brand_id;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, error: 'You are not authorized to view this conversation.' });
        }

        // Mark incoming messages as read
        run(
            'UPDATE messages SET read_status = 1 WHERE conversation_id = ? AND sender_id != ?',
            [conversationId, req.user.id]
        );

        const msgs = query(
            'SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC',
            [conversationId]
        );

        return res.json({ success: true, messages: msgs });
    } catch (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve messages.' });
    }
});

// POST /api/messages/:conversationId - Send message
router.post('/:conversationId', authenticateToken, (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text, attachment_url } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Message text cannot be empty.' });
        }

        const conv = queryOne('SELECT * FROM conversations WHERE id = ?', [conversationId]);
        if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found.' });

        // Authorization check
        let isAuthorized = req.user.role === 'admin';
        if (!isAuthorized) {
            if (req.user.role === 'creator') {
                const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
                isAuthorized = creator && creator.id === conv.creator_id;
            } else if (req.user.role === 'brand') {
                const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
                isAuthorized = brand && brand.id === conv.brand_id;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, error: 'You are not authorized to send messages in this thread.' });
        }

        const msgId = generateId('msg');
        const cleanText = text.trim();

        run(
            'INSERT INTO messages (id, conversation_id, sender_id, text, attachment_url, read_status) VALUES (?, ?, ?, ?, ?, 0)',
            [msgId, conversationId, req.user.id, cleanText, attachment_url || null]
        );

        run(
            'UPDATE conversations SET last_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [cleanText, conversationId]
        );

        const newMsg = queryOne('SELECT * FROM messages WHERE id = ?', [msgId]);

        return res.status(201).json({ success: true, message: newMsg });
    } catch (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
});

module.exports = router;
