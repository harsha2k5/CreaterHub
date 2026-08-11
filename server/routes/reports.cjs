const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// POST /api/reports
router.post('/', authenticateToken, (req, res) => {
    try {
        const { reported_id, target_type, reason, description } = req.body;

        if (!reported_id || !target_type || !reason) {
            return res.status(400).json({ success: false, error: 'Reported ID, target type, and reason required.' });
        }

        const reportId = 'rep_' + Date.now();
        db.prepare(`
            INSERT INTO reports (id, reporter_id, reported_id, target_type, reason, description, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `).run(
            reportId,
            req.user.id,
            reported_id,
            target_type,
            reason,
            description || ''
        );

        return res.status(201).json({ success: true, message: 'Report submitted for admin review.', reportId });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to submit report.' });
    }
});

module.exports = router;
