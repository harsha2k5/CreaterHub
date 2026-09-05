const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database.cjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');
const InstagramService = require('../services/InstagramService.cjs');

// All admin routes require authenticated admin
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - High level platform metrics
router.get('/stats', (req, res) => {
    try {
        const totalUsers = queryOne('SELECT COUNT(*) as count FROM users')?.count || 0;
        const totalCreators = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'creator'")?.count || 0;
        const totalBrands = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'brand'")?.count || 0;
        const totalCampaigns = queryOne('SELECT COUNT(*) as count FROM campaigns')?.count || 0;
        const activeCampaigns = queryOne("SELECT COUNT(*) as count FROM campaigns WHERE status = 'PUBLISHED'")?.count || 0;
        const completedCollabs = queryOne("SELECT COUNT(*) as count FROM collaborations WHERE status = 'COMPLETED'")?.count || 0;
        const totalApps = queryOne('SELECT COUNT(*) as count FROM campaign_applications')?.count || 0;

        const gmvResult = queryOne("SELECT SUM(amount) as total FROM payments WHERE status = 'RELEASED'");
        const totalGMV = gmvResult?.total || 0;

        const escrowResult = queryOne("SELECT SUM(amount) as total FROM payments WHERE status = 'HELD_IN_ESCROW'");
        const totalEscrow = escrowResult?.total || 0;

        const igConnected = queryOne('SELECT COUNT(*) as count FROM instagram_accounts WHERE is_connected = 1')?.count || 0;

        return res.json({
            success: true,
            stats: {
                total_users: totalUsers,
                total_creators: totalCreators,
                total_brands: totalBrands,
                total_campaigns: totalCampaigns,
                active_campaigns: activeCampaigns,
                completed_collaborations: completedCollabs,
                total_applications: totalApps,
                total_gmv: totalGMV,
                held_in_escrow: totalEscrow,
                instagram_connected_count: igConnected
            }
        });
    } catch (err) {
        console.error('Error fetching admin stats:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve admin stats.' });
    }
});

// GET /api/admin/users - User directory with financial earnings & spending data
router.get('/users', (req, res) => {
    try {
        const users = query(`
            SELECT 
                u.id, 
                u.email, 
                u.role, 
                u.is_verified, 
                u.is_active, 
                u.created_at,
                c.id as creator_id, 
                c.full_name as creator_name, 
                c.username as creator_username, 
                c.subscription_tier, 
                c.city as creator_city, 
                c.area as creator_area,
                c.avatar_url as creator_avatar,
                c.verified as creator_verified,
                b.id as brand_id, 
                b.company_name as brand_name, 
                b.city as brand_city, 
                b.logo_url as brand_logo, 
                b.verified as brand_verified,
                ia.is_connected as ig_connected,
                COALESCE(cr_earn.total, 0) as creator_earned,
                COALESCE(cr_esc.total, 0) as creator_escrow,
                COALESCE(br_spent.total, 0) as brand_spent,
                COALESCE(br_esc.total, 0) as brand_escrow,
                COALESCE(camp_cnt.cnt, 0) as brand_campaigns,
                COALESCE(col_cnt.cnt, 0) as completed_deals
            FROM users u
            LEFT JOIN creator_profiles c ON u.id = c.user_id
            LEFT JOIN brand_profiles b ON u.id = b.user_id
            LEFT JOIN instagram_accounts ia ON c.id = ia.creator_id AND ia.is_connected = 1
            LEFT JOIN (
                SELECT creator_id, SUM(amount) as total 
                FROM payments 
                WHERE status = 'RELEASED' 
                GROUP BY creator_id
            ) cr_earn ON c.id = cr_earn.creator_id
            LEFT JOIN (
                SELECT creator_id, SUM(amount) as total 
                FROM payments 
                WHERE status = 'HELD_IN_ESCROW' 
                GROUP BY creator_id
            ) cr_esc ON c.id = cr_esc.creator_id
            LEFT JOIN (
                SELECT brand_id, SUM(amount) as total 
                FROM payments 
                WHERE status = 'RELEASED' 
                GROUP BY brand_id
            ) br_spent ON b.id = br_spent.brand_id
            LEFT JOIN (
                SELECT brand_id, SUM(amount) as total 
                FROM payments 
                WHERE status = 'HELD_IN_ESCROW' 
                GROUP BY brand_id
            ) br_esc ON b.id = br_esc.brand_id
            LEFT JOIN (
                SELECT brand_id, COUNT(*) as cnt 
                FROM campaigns 
                GROUP BY brand_id
            ) camp_cnt ON b.id = camp_cnt.brand_id
            LEFT JOIN (
                SELECT creator_id, COUNT(*) as cnt 
                FROM collaborations 
                WHERE status = 'COMPLETED' 
                GROUP BY creator_id
            ) col_cnt ON c.id = col_cnt.creator_id
            ORDER BY (COALESCE(cr_earn.total, 0) + COALESCE(br_spent.total, 0)) DESC, u.created_at DESC
        `);

        return res.json({ success: true, count: users.length, users });
    } catch (err) {
        console.error('Error listing users:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve users.' });
    }
});

// PUT /api/admin/users/:userId/suspend - Suspend or activate user
router.put('/users/:userId/suspend', (req, res) => {
    try {
        const { userId } = req.params;
        const user = queryOne('SELECT is_active FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        const newStatus = user.is_active === 1 ? 0 : 1;
        run('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, userId]);

        return res.json({
            success: true,
            message: `User ${newStatus === 1 ? 'activated' : 'suspended'} successfully.`,
            is_active: newStatus
        });
    } catch (err) {
        console.error('Error updating user status:', err);
        return res.status(500).json({ success: false, error: 'Failed to update user status.' });
    }
});

// PUT /api/admin/creators/:creatorId/verify - Toggle verified badge
router.put('/creators/:creatorId/verify', (req, res) => {
    try {
        const { creatorId } = req.params;
        const creator = queryOne('SELECT verified FROM creator_profiles WHERE id = ?', [creatorId]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const newStatus = creator.verified === 1 ? 0 : 1;
        run('UPDATE creator_profiles SET verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, creatorId]);

        return res.json({
            success: true,
            message: `Creator badge ${newStatus === 1 ? 'verified' : 'unverified'} successfully.`,
            verified: newStatus
        });
    } catch (err) {
        console.error('Error updating verification:', err);
        return res.status(500).json({ success: false, error: 'Failed to update verification.' });
    }
});

// GET /api/admin/campaigns - Moderate campaigns
router.get('/campaigns', (req, res) => {
    try {
        const campaigns = query(`
            SELECT c.*, b.company_name as brand_name, b.logo_url as brand_logo
            FROM campaigns c
            JOIN brand_profiles b ON c.brand_id = b.id
            ORDER BY c.created_at DESC
        `);

        return res.json({ success: true, count: campaigns.length, campaigns });
    } catch (err) {
        console.error('Error fetching admin campaigns:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve campaigns.' });
    }
});

// PATCH /api/admin/campaigns/:id/moderate - Moderate campaign
router.patch('/campaigns/:id/moderate', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        run('UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
        return res.json({ success: true, message: `Campaign status updated to ${status}.` });
    } catch (err) {
        console.error('Error moderating campaign:', err);
        return res.status(500).json({ success: false, error: 'Failed to moderate campaign.' });
    }
});

// GET /api/admin/instagram-health - Diagnostic Health Console
router.get('/instagram-health', (req, res) => {
    try {
        const diagnostics = InstagramService.getConfigDiagnostics();
        return res.json({ success: true, diagnostics });
    } catch (err) {
        console.error('Error fetching Instagram health diagnostics:', err);
        return res.status(500).json({ success: false, error: 'Failed to load diagnostics.' });
    }
});

module.exports = router;
