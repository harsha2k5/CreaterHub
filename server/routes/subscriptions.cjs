const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database.cjs');
const { authenticateToken, requireCreator } = require('../middleware/auth.cjs');

const SUBSCRIPTION_PLANS = {
    free: {
        id: 'free',
        name: 'Free Starter',
        price_monthly: 0,
        price_yearly: 0,
        application_limit: 3,
        max_campaign_reward: 5000,
        badge_name: 'Free Plan',
        badge_color: 'slate',
        perks: [
            '3 campaign applications per month',
            'Access to briefs up to ₹5,000',
            'Standard public directory listing',
            'Standard escrow payout processing'
        ]
    },
    silver: {
        id: 'silver',
        name: 'Silver Growth',
        price_monthly: 499,
        price_yearly: 4990,
        application_limit: 15,
        max_campaign_reward: 15000,
        badge_name: 'Silver Pro',
        badge_color: 'slate',
        badge_icon: 'Sparkles',
        perks: [
            '15 campaign applications per month (5x more)',
            'Unlock high-paying campaigns up to ₹15,000',
            '24h Early Access to newly published briefs',
            'Silver Verified Profile Badge',
            'Priority brand application review'
        ]
    },
    gold: {
        id: 'gold',
        name: 'Gold Pro',
        price_monthly: 999,
        price_yearly: 9990,
        application_limit: 40,
        max_campaign_reward: 50000,
        badge_name: 'Gold VIP',
        badge_color: 'amber',
        badge_icon: 'Crown',
        popular: true,
        perks: [
            '40 campaign applications per month (13x more)',
            'Unlock premium brand campaigns up to ₹50,000',
            'AI Pitch Assistant for tailored winning proposals',
            'Top 3 ranking in Brand Creator Matchmaker',
            'Gold Pro Influencer Badge',
            'Direct brand invitations spotlight'
        ]
    },
    diamond: {
        id: 'diamond',
        name: 'Diamond VIP',
        price_monthly: 1999,
        price_yearly: 19990,
        application_limit: 999999,
        max_campaign_reward: 999999999,
        badge_name: 'Diamond Elite',
        badge_color: 'purple',
        badge_icon: 'Gem',
        perks: [
            'Unlimited campaign applications every month',
            'Access to all Mega-Budget Campaigns (₹50,000+)',
            '0% Platform Commission fee on all collaborations',
            'VIP Direct Brand Pitch Spotlight',
            'Dedicated Creator Success Manager',
            'Diamond Elite Verification Badge'
        ]
    }
};

// GET /api/subscriptions/plans - Public list of available subscription plans
router.get('/plans', (req, res) => {
    return res.json({
        success: true,
        plans: SUBSCRIPTION_PLANS
    });
});

// GET /api/subscriptions/current - Creator's current subscription & quota status
router.get('/current', authenticateToken, requireCreator, async (req, res) => {
    try {
        const creator = queryOne('SELECT * FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator profile not found.' });

        let tier = (creator.subscription_tier || 'free').toLowerCase();
        let expiresAt = creator.subscription_expires_at;

        // Check expiration
        if (expiresAt && new Date(expiresAt) < new Date()) {
            tier = 'free';
            run(
                "UPDATE creator_profiles SET subscription_tier = 'free', subscription_expires_at = NULL, subscription_updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [creator.id]
            );
        }

        const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;

        // Calculate applications used this calendar month
        const usageRow = queryOne(
            `SELECT COUNT(*) as count FROM campaign_applications
             WHERE creator_id = ? AND applied_at >= datetime('now', 'start of month')`,
            [creator.id]
        );
        const applicationsUsed = usageRow ? usageRow.count : 0;
        const applicationLimit = plan.application_limit;
        const applicationsRemaining = Math.max(0, applicationLimit - applicationsUsed);

        // Get past subscription transactions
        const history = query(
            'SELECT * FROM creator_subscriptions WHERE creator_id = ? ORDER BY created_at DESC LIMIT 5',
            [creator.id]
        );

        return res.json({
            success: true,
            subscription: {
                tier,
                tier_name: plan.name,
                badge_name: plan.badge_name,
                expires_at: expiresAt,
                is_active: tier !== 'free',
                applications_used: applicationsUsed,
                application_limit: applicationLimit,
                applications_remaining: applicationsRemaining,
                max_campaign_reward: plan.max_campaign_reward,
                plan_details: plan,
                history
            }
        });
    } catch (err) {
        console.error('Error fetching subscription status:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve subscription status.' });
    }
});

// POST /api/subscriptions/upgrade - Creator upgrades to Silver, Gold, or Diamond
router.post('/upgrade', authenticateToken, requireCreator, async (req, res) => {
    try {
        const { tier, billing_cycle = 'monthly', payment_method = 'UPI' } = req.body;
        const targetTier = (tier || '').toLowerCase();

        if (!['silver', 'gold', 'diamond'].includes(targetTier)) {
            return res.status(400).json({ success: false, error: 'Invalid subscription tier selected.' });
        }

        const creator = queryOne('SELECT * FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator profile not found.' });

        const plan = SUBSCRIPTION_PLANS[targetTier];
        const price = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

        // Calculate new expiration date (30 days or 365 days from now)
        const daysToAdd = billing_cycle === 'yearly' ? 365 : 30;
        const expiresDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
        const expiresIso = expiresDate.toISOString();

        const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const txRef = `TXN_CH_${Date.now()}`;

        // Insert into creator_subscriptions
        run(
            `INSERT INTO creator_subscriptions (
                id, creator_id, tier, price, billing_cycle, status,
                payment_method, transaction_ref, started_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, ?)`,
            [subId, creator.id, targetTier, price, billing_cycle, payment_method, txRef, expiresIso]
        );

        // Update creator profile
        run(
            `UPDATE creator_profiles
             SET subscription_tier = ?, subscription_expires_at = ?, subscription_updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [targetTier, expiresIso, creator.id]
        );

        // Create in-app notification
        run(
            `INSERT INTO notifications (id, user_id, title, message, link) VALUES (?, ?, ?, ?, ?)`,
            [
                `notif_${Date.now()}`,
                creator.user_id,
                `👑 Upgraded to ${plan.name}!`,
                `Your membership is now active. You unlocked campaigns up to ₹${plan.max_campaign_reward === 999999999 ? 'Unlimited' : plan.max_campaign_reward.toLocaleString()} and ${plan.application_limit === 999999 ? 'Unlimited' : plan.application_limit} monthly applications.`,
                `/creator/dashboard`
            ]
        );

        return res.json({
            success: true,
            message: `Congratulations! You are now upgraded to ${plan.name}.`,
            tier: targetTier,
            expires_at: expiresIso,
            plan
        });
    } catch (err) {
        console.error('Error upgrading subscription:', err);
        return res.status(500).json({ success: false, error: 'Failed to complete subscription upgrade: ' + err.message });
    }
});

module.exports = { router, SUBSCRIPTION_PLANS };
