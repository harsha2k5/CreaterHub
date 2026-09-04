const express = require('express');
const router = express.Router();
const { queryOne, run } = require('../db/database.cjs');
const { authenticateToken, requireCreator } = require('../middleware/auth.cjs');
const InstagramService = require('../services/InstagramService.cjs');

// GET /api/instagram/connect-url
router.get('/connect-url', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const result = InstagramService.getAuthorizationUrl(creator.id);
        return res.json({
            success: true,
            is_configured: result.configured,
            auth_url: result.url,
            message: result.message
        });
    } catch (err) {
        console.error('Error generating connect URL:', err);
        return res.status(500).json({ success: false, error: 'Failed to generate connection URL.' });
    }
});

// POST /api/instagram/callback
router.post('/callback', authenticateToken, requireCreator, async (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, error: 'OAuth authorization code is required.' });
        }

        const syncResult = await InstagramService.connectAccount({
            creatorId: creator.id,
            userId: req.user.id,
            code
        });

        return res.json({
            success: true,
            message: 'Instagram account connected successfully via Meta Graph API.',
            data: syncResult
        });
    } catch (err) {
        console.error('Instagram callback error:', err);
        return res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/instagram/sandbox-connect (Developer Sandbox Mode for local testing)
router.post('/sandbox-connect', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const result = InstagramService.connectSandboxAccount(creator.id, req.body);
        return res.json({ success: true, ...result });
    } catch (err) {
        console.error('Error connecting Sandbox Instagram:', err);
        return res.status(500).json({ success: false, error: 'Failed to connect sandbox mode: ' + err.message });
    }
});

// GET /api/instagram/status
router.get('/status', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const status = InstagramService.getStatus(creator.id);
        return res.json({ success: true, ...status });
    } catch (err) {
        console.error('Error getting Instagram status:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve Instagram status.' });
    }
});

// GET /api/instagram/analytics
router.get('/analytics', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const analytics = InstagramService.getStatus(creator.id);
        return res.json({ success: true, ...analytics });
    } catch (err) {
        console.error('Error fetching Instagram analytics:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch Instagram analytics.' });
    }
});

// POST /api/instagram/sync - Refresh data from Instagram
router.post('/sync', authenticateToken, requireCreator, async (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const account = queryOne('SELECT access_token, instagram_user_id, account_type FROM instagram_accounts WHERE creator_id = ? AND is_connected = 1', [creator.id]);
        if (!account) {
            return res.status(400).json({ success: false, error: 'No Instagram account currently connected.' });
        }

        // Handle Developer Sandbox Mode refresh without calling external Graph API
        if (account.account_type === 'SANDBOX_DEV_MODE') {
            run('UPDATE instagram_accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE creator_id = ?', [creator.id]);
            return res.json({
                success: true,
                is_sandbox: true,
                message: 'Sandbox Instagram data refreshed successfully.',
                last_synced_at: new Date().toISOString()
            });
        }

        // Fetch fresh profile and media using stored access token
        const igData = await InstagramService.findConnectedInstagramAccount(account.access_token);
        const mediaList = await InstagramService.fetchMediaItems(account.access_token, account.instagram_user_id);

        let totalLikes = 0;
        let totalComments = 0;
        for (const m of mediaList) {
            totalLikes += Number(m.like_count) || 0;
            totalComments += Number(m.comments_count) || 0;
        }
        const followers = Number(igData.followers_count) || 0;
        const measured = mediaList.length;
        const realEngagement = (measured > 0 && followers > 0)
            ? Number((((totalLikes + totalComments) / (measured * followers)) * 100).toFixed(2))
            : 0.0;

        // Record refreshed metrics
        const metricId = `met_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        run(
            `INSERT INTO instagram_metrics (
                id, instagram_account_id, creator_id, followers_count,
                follows_count, media_count, engagement_rate, source
            ) VALUES (?, (SELECT id FROM instagram_accounts WHERE creator_id = ?), ?, ?, ?, ?, ?, 'LIVE_API')`,
            [metricId, creator.id, creator.id, followers, Number(igData.follows_count) || 0, Number(igData.media_count) || 0, realEngagement]
        );

        run('UPDATE instagram_accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE creator_id = ?', [creator.id]);

        return res.json({
            success: true,
            message: 'Instagram data refreshed successfully from Meta API.',
            last_synced_at: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error refreshing Instagram sync:', err);
        return res.status(500).json({ success: false, error: 'Failed to refresh Instagram data: ' + err.message });
    }
});

// POST /api/instagram/disconnect
router.post('/disconnect', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        const result = InstagramService.disconnect(creator.id);
        return res.json(result);
    } catch (err) {
        console.error('Error disconnecting Instagram:', err);
        return res.status(500).json({ success: false, error: 'Failed to disconnect Instagram account.' });
    }
});

// GET /api/instagram/config-status - Developer / Admin diagnostic endpoint
router.get('/config-status', (req, res) => {
    const diagnostics = InstagramService.getConfigDiagnostics();
    return res.json({ success: true, diagnostics });
});

module.exports = router;
