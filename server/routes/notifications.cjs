const express = require('express');
const router = express.Router();
const { query, run } = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/notifications
router.get('/', authenticateToken, (req, res) => {
    try {
        const notifs = query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
            [req.user.id]
        );
        const unreadCount = notifs.filter(n => n.read_status === 0).length;

        return res.json({ success: true, count: notifs.length, unread_count: unreadCount, notifications: notifs });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve notifications.' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, (req, res) => {
    try {
        run('UPDATE notifications SET read_status = 1 WHERE user_id = ?', [req.user.id]);
        return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        return res.status(500).json({ success: false, error: 'Failed to mark notifications.' });
    }
});

module.exports = router;
