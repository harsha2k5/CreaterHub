const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
    try {
        const notifications = db.prepare(`
            SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
        `).all(req.user.id);

        const unreadCount = db.prepare(`
            SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_status = 0
        `).get(req.user.id).count;

        return res.json({ success: true, unreadCount, notifications });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load notifications.' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, (req, res) => {
    try {
        db.prepare('UPDATE notifications SET read_status = 1 WHERE user_id = ?').run(req.user.id);
        return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update notifications.' });
    }
});

module.exports = router;
