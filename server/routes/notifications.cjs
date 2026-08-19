const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
        const unreadCount = await Notification.countDocuments({ user_id: req.user.id, read_status: 0 });

        return res.json({ success: true, unreadCount, notifications });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load notifications.' });
    }
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.updateMany({ user_id: req.user.id }, { read_status: 1 });
        return res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update notifications.' });
    }
});

module.exports = router;
