const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');

// GET /api/brands
router.get('/', (req, res) => {
    try {
        const brands = db.prepare('SELECT * FROM brands ORDER BY rating DESC').all();
        return res.json({ success: true, count: brands.length, brands });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching brands.' });
    }
});

// GET /api/brands/:id
router.get('/:id', (req, res) => {
    try {
        const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
        if (!brand) {
            return res.status(404).json({ success: false, error: 'Brand not found.' });
        }

        const activeCampaigns = db.prepare('SELECT * FROM campaigns WHERE brand_id = ? AND status = "published"').all(brand.id);
        const reviews = db.prepare(`
            SELECT r.*, cr.full_name AS reviewer_name, cr.avatar_url AS reviewer_avatar
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            LEFT JOIN creators cr ON cr.user_id = u.id
            WHERE r.reviewee_id = ?
            ORDER BY r.created_at DESC
        `).all(brand.user_id);

        return res.json({ success: true, brand, activeCampaigns, reviews });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error loading brand profile.' });
    }
});

module.exports = router;
