const express = require('express');
const router = express.Router();
const { queryOne } = require('../db/database.cjs');
const { authenticateToken, requireCreator, requireBrand } = require('../middleware/auth.cjs');
const PaymentService = require('../services/PaymentService.cjs');

// GET /api/payments/earnings - Creator earnings ledger
router.get('/earnings', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const data = PaymentService.getCreatorEarnings(creator.id);
        return res.json({ success: true, ...data });
    } catch (err) {
        console.error('Error fetching earnings:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve earnings.' });
    }
});

// POST /api/payments/release/:collabId - Brand manually releases escrow
router.post('/release/:collabId', authenticateToken, requireBrand, async (req, res) => {
    try {
        const { collabId } = req.params;
        const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(403).json({ success: false, error: 'Unauthorized.' });

        const collab = queryOne('SELECT * FROM collaborations WHERE id = ? AND brand_id = ?', [collabId, brand.id]);
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found or unauthorized.' });

        const result = await PaymentService.releaseEscrow(collabId);
        return res.json({ success: true, message: 'Escrow payment released successfully.', result });
    } catch (err) {
        console.error('Error releasing escrow:', err);
        return res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
