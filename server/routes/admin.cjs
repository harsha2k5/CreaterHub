const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    try {
        const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
        const totalBrands = db.prepare('SELECT COUNT(*) AS count FROM brands').get().count;
        const totalCreators = db.prepare('SELECT COUNT(*) AS count FROM creators').get().count;
        const activeCampaigns = db.prepare('SELECT COUNT(*) AS count FROM campaigns WHERE status = "published"').get().count;
        const completedCampaigns = db.prepare('SELECT COUNT(*) AS count FROM campaigns WHERE status = "closed"').get().count;
        const totalVolume = db.prepare('SELECT SUM(amount) AS total FROM payments WHERE status = "paid"').get().total || 0;

        const pendingReports = db.prepare('SELECT COUNT(*) AS count FROM reports WHERE status = "pending"').get().count;

        return res.json({
            success: true,
            stats: {
                totalUsers,
                totalBrands,
                totalCreators,
                activeCampaigns,
                completedCampaigns,
                totalVolume,
                pendingReports
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load admin stats.' });
    }
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    try {
        const users = db.prepare(`
            SELECT u.id, u.email, u.role, u.is_verified, u.created_at,
                   b.company_name AS brand_name, cr.full_name AS creator_name
            FROM users u
            LEFT JOIN brands b ON b.user_id = u.id
            LEFT JOIN creators cr ON cr.user_id = u.id
            ORDER BY u.created_at DESC
        `).all();

        return res.json({ success: true, count: users.length, users });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load users list.' });
    }
});

// PUT /api/admin/verify-user/:id
router.put('/verify-user/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const userId = req.params.id;
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        const nextStatus = user.is_verified ? 0 : 1;
        db.prepare('UPDATE users SET is_verified = ? WHERE id = ?').run(nextStatus, userId);

        if (user.role === 'brand') {
            db.prepare('UPDATE brands SET verified = ? WHERE user_id = ?').run(nextStatus, userId);
        } else if (user.role === 'creator') {
            db.prepare('UPDATE creators SET verified = ? WHERE user_id = ?').run(nextStatus, userId);
        }

        return res.json({ success: true, message: `Verification updated to ${nextStatus ? 'Verified' : 'Unverified'}.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update user verification.' });
    }
});

// GET /api/admin/reports
router.get('/reports', authenticateToken, requireAdmin, (req, res) => {
    try {
        const reports = db.prepare(`
            SELECT rep.*, u.email AS reporter_email
            FROM reports rep
            JOIN users u ON rep.reporter_id = u.id
            ORDER BY rep.created_at DESC
        `).all();

        return res.json({ success: true, count: reports.length, reports });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load reports.' });
    }
});

module.exports = router;
