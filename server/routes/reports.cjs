const express = require('express');
const router = express.Router();
const { Report } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// POST /api/reports
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { reported_id, target_type, reason, description } = req.body;

        if (!reported_id || !target_type || !reason) {
            return res.status(400).json({ success: false, error: 'Reported ID, target type, and reason required.' });
        }

        const reportId = 'rep_' + Date.now();
        await Report.create({
            id: reportId,
            reporter_id: req.user.id,
            reported_id,
            target_type,
            reason,
            description: description || '',
            status: 'pending'
        });

        return res.status(201).json({ success: true, message: 'Report submitted for admin review.', reportId });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to submit report.' });
    }
});

module.exports = router;
