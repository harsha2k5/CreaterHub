const express = require('express');
const router = express.Router();
const { User, Brand, Creator, Campaign, Collaboration, Payment, Report } = require('../models/index.cjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth.cjs');

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            totalBrands,
            totalCreators,
            activeCampaigns,
            completedCampaigns,
            collaborations,
            payments,
            pendingReports
        ] = await Promise.all([
            User.countDocuments({}),
            Brand.countDocuments({}),
            Creator.countDocuments({}),
            Campaign.countDocuments({ status: 'published' }),
            Campaign.countDocuments({ status: 'closed' }),
            Collaboration.find({}).lean(),
            Payment.find({ status: 'paid' }).lean(),
            Report.countDocuments({ status: 'pending' })
        ]);

        const totalVolume = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
        const workedTogetherCount = collaborations.length;

        return res.json({
            success: true,
            stats: {
                totalUsers,
                totalBrands,
                totalCreators,
                activeCampaigns,
                completedCampaigns,
                workedTogetherCount,
                totalVolume,
                pendingReports
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load admin stats.' });
    }
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const rawUsers = await User.find({}).sort({ created_at: -1 }).lean();

        const userIds = rawUsers.map(u => u.id);
        const [brands, creators] = await Promise.all([
            Brand.find({ user_id: { $in: userIds } }).lean(),
            Creator.find({ user_id: { $in: userIds } }).lean()
        ]);

        const brandMap = {}; brands.forEach(b => brandMap[b.user_id] = b);
        const creatorMap = {}; creators.forEach(cr => creatorMap[cr.user_id] = cr);

        const users = rawUsers.map(u => {
            const b = brandMap[u.id] || {};
            const cr = creatorMap[u.id] || {};
            return {
                id: u.id,
                email: u.email,
                role: u.role,
                is_verified: u.is_verified,
                created_at: u.created_at,
                brand_name: b.company_name || null,
                creator_name: cr.full_name || null
            };
        });

        return res.json({ success: true, count: users.length, users });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to load users list.' });
    }
});

// PUT /api/admin/verify-user/:id
router.put('/verify-user/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findOne({ id: userId }).lean();
        if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

        const nextStatus = user.is_verified ? 0 : 1;
        await User.updateOne({ id: userId }, { is_verified: nextStatus });

        if (user.role === 'brand') {
            await Brand.updateOne({ user_id: userId }, { verified: nextStatus });
        } else if (user.role === 'creator') {
            await Creator.updateOne({ user_id: userId }, { verified: nextStatus });
        }

        return res.json({ success: true, message: `Verification updated to ${nextStatus ? 'Verified' : 'Unverified'}.` });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to update user verification.' });
    }
});

// GET /api/admin/collaborations (Brand x Creator Working Partnerships & Financial Payouts)
router.get('/collaborations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const rawCollabs = await Collaboration.find({}).sort({ created_at: -1 }).lean();

        const campaignIds = [...new Set(rawCollabs.map(c => c.campaign_id))];
        const brandIds = [...new Set(rawCollabs.map(c => c.brand_id))];
        const creatorIds = [...new Set(rawCollabs.map(c => c.creator_id))];
        const collabIds = rawCollabs.map(c => c.id);

        const [campaigns, brands, creators, payments] = await Promise.all([
            Campaign.find({ id: { $in: campaignIds } }).lean(),
            Brand.find({ id: { $in: brandIds } }).lean(),
            Creator.find({ id: { $in: creatorIds } }).lean(),
            Payment.find({ collaboration_id: { $in: collabIds } }).lean()
        ]);

        const campaignMap = {}; campaigns.forEach(c => campaignMap[c.id] = c);
        const brandMap = {}; brands.forEach(b => brandMap[b.id] = b);
        const creatorMap = {}; creators.forEach(cr => creatorMap[cr.id] = cr);
        const paymentMap = {}; payments.forEach(p => paymentMap[p.collaboration_id] = p);

        const collaborations = rawCollabs.map(col => {
            const camp = campaignMap[col.campaign_id] || {};
            const brand = brandMap[col.brand_id] || {};
            const creator = creatorMap[col.creator_id] || {};
            const payment = paymentMap[col.id] || {};

            const rewardAmount = camp.reward_per_creator || 0;
            const paidAmount = payment.amount || (payment.status === 'paid' || col.current_step >= 5 ? rewardAmount : 0);

            return {
                id: col.id,
                brand_name: brand.company_name || 'Brand Partner',
                brand_logo: brand.logo_url || '',
                creator_name: creator.full_name || 'Creator Partner',
                creator_username: creator.username || '',
                creator_avatar: creator.avatar_url || '',
                campaign_title: camp.title || 'Sponsorship Campaign',
                reward_amount: rewardAmount,
                paid_amount: paidAmount,
                payment_status: payment.status || (col.current_step >= 5 ? 'paid' : 'escrow_locked'),
                status: col.status,
                current_step: col.current_step,
                created_at: col.created_at
            };
        });

        const totalPaidOut = collaborations.reduce((sum, item) => sum + (item.paid_amount || 0), 0);

        return res.json({
            success: true,
            count: collaborations.length,
            totalPaidOut,
            collaborations
        });
    } catch (err) {
        console.error('Error fetching admin collaborations:', err);
        return res.status(500).json({ success: false, error: 'Failed to load collaborations.' });
    }
});

module.exports = router;

