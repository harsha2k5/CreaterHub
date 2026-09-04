const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database.cjs');
const { authenticateToken, requireBrand } = require('../middleware/auth.cjs');

// GET /api/brands/analytics - Brand Dashboard Overview Cards
router.get('/analytics', authenticateToken, requireBrand, (req, res) => {
    try {
        const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(404).json({ success: false, error: 'Brand not found.' });

        const activeCampaignsCount = queryOne(
            "SELECT COUNT(*) as count FROM campaigns WHERE brand_id = ? AND status = 'PUBLISHED'",
            [brand.id]
        )?.count || 0;

        const totalAppsCount = queryOne(
            'SELECT COUNT(*) as count FROM campaign_applications WHERE brand_id = ?',
            [brand.id]
        )?.count || 0;

        const hiredCreatorsCount = queryOne(
            "SELECT COUNT(*) as count FROM collaborations WHERE brand_id = ? AND status IN ('ACTIVE', 'COMPLETED')",
            [brand.id]
        )?.count || 0;

        const completedCollabs = queryOne(
            "SELECT COUNT(*) as count FROM collaborations WHERE brand_id = ? AND status = 'COMPLETED'",
            [brand.id]
        )?.count || 0;

        const spendResult = queryOne(
            "SELECT SUM(amount) as total FROM payments WHERE brand_id = ? AND status IN ('HELD_IN_ESCROW', 'RELEASED')",
            [brand.id]
        );
        const totalSpend = spendResult?.total || 0;

        // Estimated Reach based on hired creators' actual verified followers
        const reachResult = queryOne(
            `SELECT SUM(im.followers_count) as total_reach
             FROM collaborations col
             JOIN creator_profiles cr ON col.creator_id = cr.id
             LEFT JOIN instagram_accounts ia ON cr.id = ia.creator_id AND ia.is_connected = 1
             LEFT JOIN (
                 SELECT instagram_account_id, followers_count
                 FROM instagram_metrics
                 ORDER BY recorded_at DESC
                 LIMIT 1
             ) im ON ia.id = im.instagram_account_id
             WHERE col.brand_id = ?`,
            [brand.id]
        );
        const estimatedReach = reachResult?.total_reach || 0;

        return res.json({
            success: true,
            analytics: {
                active_campaigns: activeCampaignsCount,
                total_applications: totalAppsCount,
                selected_creators: hiredCreatorsCount,
                completed_campaigns: completedCollabs,
                total_spend: totalSpend,
                estimated_reach: estimatedReach
            }
        });
    } catch (err) {
        console.error('Error fetching brand analytics:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve analytics.' });
    }
});

// GET /api/brands/:id - Public Brand Profile
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const brand = queryOne('SELECT * FROM brand_profiles WHERE id = ?', [id]);
        if (!brand) return res.status(404).json({ success: false, error: 'Brand not found.' });

        const campaigns = query(
            "SELECT * FROM campaigns WHERE brand_id = ? AND status = 'PUBLISHED' ORDER BY created_at DESC",
            [id]
        );

        const reviews = query(`
            SELECT r.*, u.email as reviewer_email, c.full_name as reviewer_creator, c.avatar_url as reviewer_avatar
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            LEFT JOIN creator_profiles c ON u.id = c.user_id
            WHERE r.reviewee_id = ?
            ORDER BY r.created_at DESC
        `, [brand.user_id]);

        return res.json({
            success: true,
            brand: {
                ...brand,
                campaigns,
                reviews
            }
        });
    } catch (err) {
        console.error('Error fetching brand profile:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve brand profile.' });
    }
});

// PUT /api/brands/profile - Update Brand Details
router.put('/profile', authenticateToken, requireBrand, (req, res) => {
    try {
        const {
            company_name,
            phone,
            category,
            website,
            location_name,
            address,
            city,
            logo_url,
            description
        } = req.body;

        const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(404).json({ success: false, error: 'Brand profile not found.' });

        run(
            `UPDATE brand_profiles
             SET company_name = COALESCE(?, company_name),
                 phone = COALESCE(?, phone),
                 category = COALESCE(?, category),
                 website = COALESCE(?, website),
                 location_name = COALESCE(?, location_name),
                 address = COALESCE(?, address),
                 city = COALESCE(?, city),
                 logo_url = COALESCE(?, logo_url),
                 description = COALESCE(?, description),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [company_name, phone, category, website, location_name, address, city, logo_url, description, brand.id]
        );

        return res.json({ success: true, message: 'Brand profile updated successfully.' });
    } catch (err) {
        console.error('Error updating brand profile:', err);
        return res.status(500).json({ success: false, error: 'Failed to update profile: ' + err.message });
    }
});

module.exports = router;
