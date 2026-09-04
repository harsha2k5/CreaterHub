/**
 * CreaterHub - Production Meta / Instagram Integration Service
 * 
 * Strict "Real Data First. Single Source of Truth" Architecture:
 * - Meta Graph API v19.0 with Instagram Login
 * - Cryptographically random state validation against CSRF
 * - Server-side AES-256 token encryption (never exposed to client)
 * - Account identity permanently bound to instagram_user_id
 * - Preserves null values (never defaults missing metrics to 0)
 * - Structured audit logging in instagram_sync_logs
 * - Zero scraping, zero password storage, zero fake metrics
 */

const crypto = require('crypto');
const { query, queryOne, run, transaction } = require('../db/database.cjs');
const TokenEncryptionService = require('./TokenEncryptionService.cjs');
const InstagramValidationService = require('./InstagramValidationService.cjs');
const InstagramMediaSyncService = require('./InstagramMediaSyncService.cjs');
const InstagramInsightsService = require('./InstagramInsightsService.cjs');
const MockInstagramService = require('./MockInstagramService.cjs');

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:5173/creator/dashboard';
const USE_INSTAGRAM_MOCK = process.env.USE_INSTAGRAM_MOCK === 'true';

class InstagramService {
    /**
     * Check if Meta Developer App credentials are fully configured
     */
    static isConfigured() {
        return Boolean(META_APP_ID && META_APP_SECRET);
    }

    /**
     * Check if mock mode is enabled in development
     */
    static isMockEnabled() {
        return process.env.NODE_ENV !== 'production' && USE_INSTAGRAM_MOCK;
    }

    /**
     * Generate secure OAuth authorization URL with cryptographic CSRF state
     */
    static getAuthorizationUrl(creatorId) {
        if (!creatorId) throw new Error('creatorId is required to initiate Instagram OAuth.');

        if (!this.isConfigured()) {
            return {
                configured: false,
                is_mock_available: this.isMockEnabled(),
                url: null,
                message: 'META_APP_ID and META_APP_SECRET are not configured in .env. Real Meta OAuth requires a registered Meta Developer App.'
            };
        }

        // Generate cryptographically random 32-byte state token
        const stateToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minute expiration

        // Store state against creator in database
        const stateId = `st_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        run(
            `INSERT INTO oauth_states (id, creator_id, state_token, expires_at)
             VALUES (?, ?, ?, ?)`,
            [stateId, creatorId, stateToken, expiresAt]
        );

        const scope = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement';
        const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(stateToken)}&response_type=code`;

        return {
            configured: true,
            is_mock_available: false,
            url,
            stateToken,
            message: 'Official Meta OAuth authorization URL generated.'
        };
    }

    /**
     * Validate and consume OAuth state (one-time use, prevents CSRF & replay)
     */
    static validateOAuthState(creatorId, stateToken) {
        if (!stateToken || typeof stateToken !== 'string') {
            throw new Error('Invalid OAuth state: state parameter is missing.');
        }

        const record = queryOne(
            `SELECT id, expires_at FROM oauth_states
             WHERE creator_id = ? AND state_token = ?`,
            [creatorId, stateToken]
        );

        if (!record) {
            throw new Error('Invalid OAuth state: CSRF verification failed or state does not match.');
        }

        // Check expiration
        if (new Date(record.expires_at) < new Date()) {
            run('DELETE FROM oauth_states WHERE id = ?', [record.id]);
            throw new Error('OAuth authorization state expired. Please restart the connection flow.');
        }

        // Consume state (delete so it cannot be reused)
        run('DELETE FROM oauth_states WHERE id = ?', [record.id]);
        return true;
    }

    /**
     * Exchange OAuth Code for a 60-day Long-Lived Token
     */
    static async exchangeCodeForLongLivedToken(code) {
        if (!this.isConfigured()) {
            throw new Error('Meta developer app credentials (META_APP_ID, META_APP_SECRET) are missing.');
        }

        console.log('[Instagram OAuth Started] Exchanging authorization code...');

        // Step 1: Exchange code for short-lived token
        const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(META_APP_ID)}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${encodeURIComponent(META_APP_SECRET)}&code=${encodeURIComponent(code)}`;
        const tokenRes = await fetch(exchangeUrl);
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || tokenData.error) {
            const msg = tokenData.error?.message || 'Failed to exchange authorization code with Meta Graph API.';
            console.error('[Instagram API Error] Token exchange failed:', msg);
            throw new Error(msg);
        }

        const shortLivedToken = tokenData.access_token;

        // Step 2: Exchange for 60-day long-lived token
        const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(META_APP_ID)}&client_secret=${encodeURIComponent(META_APP_SECRET)}&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;
        const longRes = await fetch(longLivedUrl);
        const longData = await longRes.json();

        if (!longRes.ok || longData.error) {
            console.warn('[Instagram API Warning] Long-lived exchange warning, using initial token:', longData.error?.message);
            return {
                accessToken: shortLivedToken,
                expiresIn: tokenData.expires_in || 5184000 // default ~60 days in seconds
            };
        }

        return {
            accessToken: longData.access_token,
            expiresIn: longData.expires_in || 5184000
        };
    }

    /**
     * Discover linked Instagram Professional Account via Meta Pages endpoint
     */
    static async discoverInstagramAccount(accessToken) {
        const fields = 'id,name,instagram_business_account{id,username,name,biography,profile_picture_url,website,followers_count,follows_count,media_count}';
        const url = `https://graph.facebook.com/v19.0/me/accounts?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error?.message || 'Failed to inspect linked Facebook Pages for Instagram accounts.');
        }

        if (Array.isArray(data.data)) {
            for (const page of data.data) {
                if (page.instagram_business_account && page.instagram_business_account.id) {
                    return InstagramValidationService.validateProfileResponse(page.instagram_business_account);
                }
            }
        }

        // If no linked professional business account is found
        throw new Error("Your Instagram account cannot currently be connected through Meta's Instagram API. Please make sure you are using an eligible professional Instagram account.");
    }

    /**
     * Connect account via official Meta OAuth flow
     */
    static async connectAccount({ creatorId, userId, code, stateToken }) {
        if (!creatorId || !userId || !code) {
            throw new Error('creatorId, userId, and authorization code are required.');
        }

        // Validate state token if supplied
        if (stateToken) {
            this.validateOAuthState(creatorId, stateToken);
        }

        const startTime = Date.now();

        // 1. Exchange code for long-lived access token
        const { accessToken, expiresIn } = await this.exchangeCodeForLongLivedToken(code);
        const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
        const encryptedToken = TokenEncryptionService.encrypt(accessToken);

        // 2. Discover Instagram Professional account
        const profile = await this.discoverInstagramAccount(accessToken);

        // 3. Prevent duplicate account takeover (1 IG Account belongs to 1 Creator)
        const duplicateClaim = queryOne(
            `SELECT creator_id FROM instagram_accounts
             WHERE instagram_user_id = ? AND creator_id != ? AND is_connected = 1`,
            [profile.instagramUserId, creatorId]
        );
        if (duplicateClaim) {
            throw new Error('This Instagram account is already connected to another CreaterHub profile.');
        }

        let accountRecordId = null;

        transaction(() => {
            const existing = queryOne('SELECT id FROM instagram_accounts WHERE creator_id = ?', [creatorId]);

            if (existing) {
                accountRecordId = existing.id;
                run(
                    `UPDATE instagram_accounts
                     SET instagram_user_id = ?, instagram_username = ?, username = ?,
                         full_name = ?, profile_picture_url = ?, biography = ?, bio = ?,
                         website = ?, account_type = 'BUSINESS', encrypted_access_token = ?,
                         access_token = ?, token_expires_at = ?, is_connected = 1,
                         connection_status = 'CONNECTED', last_synced_at = CURRENT_TIMESTAMP,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [
                        profile.instagramUserId, profile.username, profile.username,
                        profile.name, profile.profilePictureUrl, profile.biography, profile.biography,
                        profile.website, encryptedToken, encryptedToken, tokenExpiresAt, accountRecordId
                    ]
                );
            } else {
                accountRecordId = `iga_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                run(
                    `INSERT INTO instagram_accounts (
                        id, creator_id, user_id, instagram_user_id, instagram_username,
                        username, full_name, profile_picture_url, biography, bio,
                        website, account_type, encrypted_access_token, access_token,
                        token_expires_at, is_connected, connection_status, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BUSINESS', ?, ?, ?, 1, 'CONNECTED', CURRENT_TIMESTAMP)`,
                    [
                        accountRecordId, creatorId, userId, profile.instagramUserId,
                        profile.username, profile.username, profile.name, profile.profilePictureUrl,
                        profile.biography, profile.biography, profile.website, encryptedToken,
                        encryptedToken, tokenExpiresAt
                    ]
                );
            }
        });

        // 4. Synchronize initial media and insights
        let mediaResult = { recordsUpdated: 0, totalLikes: 0, totalComments: 0, measurableCount: 0 };
        let insights = { reach: null, impressions: null, profile_views: null };

        try {
            const mediaList = await InstagramMediaSyncService.fetchFromMeta(accessToken, profile.instagramUserId);
            mediaResult = InstagramMediaSyncService.syncMediaCollection({
                instagramAccountId: accountRecordId,
                creatorId,
                mediaList
            });
        } catch (mediaErr) {
            console.warn('[Instagram Sync Warning] Initial media sync partial failure:', mediaErr.message);
        }

        try {
            insights = await InstagramInsightsService.fetchInsightsFromMeta(accessToken, profile.instagramUserId);
        } catch (insightsErr) {
            console.warn('[Instagram Sync Warning] Initial insights partial failure:', insightsErr.message);
        }

        // 5. Calculate real engagement rate strictly from measurable items (never invent)
        let engagementRate = null;
        if (profile.followersCount !== null && profile.followersCount > 0 && mediaResult.measurableCount > 0) {
            const totalInteractions = mediaResult.totalLikes + mediaResult.totalComments;
            engagementRate = Number(((totalInteractions / (mediaResult.measurableCount * profile.followersCount)) * 100).toFixed(2));
        }

        // 6. Record metrics snapshot
        const metricId = `met_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        run(
            `INSERT INTO instagram_metrics (
                id, instagram_account_id, creator_id, followers_count,
                following_count, media_count, reach, impressions,
                profile_views, engagement_rate, data_source, source, recorded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Instagram', 'LIVE_API', CURRENT_TIMESTAMP)`,
            [
                metricId, accountRecordId, creatorId, profile.followersCount,
                profile.followingCount, profile.mediaCount, insights.reach,
                insights.impressions, insights.profile_views, engagementRate
            ]
        );

        // 7. Record sync log
        const logId = `synclog_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        run(
            `INSERT INTO instagram_sync_logs (
                id, instagram_account_id, creator_id, started_at, completed_at,
                status, records_updated
            ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'SUCCESS', ?)`,
            [
                logId, accountRecordId, creatorId,
                new Date(startTime).toISOString(), mediaResult.recordsUpdated
            ]
        );

        console.log(`[Instagram Sync Completed] Account linked: @${profile.username} (ID: ${profile.instagramUserId})`);

        return {
            success: true,
            account: {
                instagramUserId: profile.instagramUserId,
                username: profile.username,
                fullName: profile.name,
                accountType: 'BUSINESS',
                followersCount: profile.followersCount,
                mediaCount: profile.mediaCount,
                engagementRate
            }
        };
    }

    /**
     * Synchronize latest account data (Manual Refresh / Background Sync)
     * Resilient Failure Handling: Never overwrites existing valid data with zeros on failure.
     */
    static async syncAccount(creatorId) {
        const startTime = Date.now();
        const account = queryOne(
            `SELECT id, user_id, instagram_user_id, encrypted_access_token,
                    access_token, token_expires_at, account_type
             FROM instagram_accounts
             WHERE creator_id = ? AND is_connected = 1`,
            [creatorId]
        );

        if (!account) {
            throw new Error('No active Instagram account connected for this creator.');
        }

        // Handle Development Mock Account refresh
        if (account.account_type === 'MOCK_DEVELOPMENT' || account.account_type === 'SANDBOX_DEV_MODE') {
            run('UPDATE instagram_accounts SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?', [account.id]);
            return {
                success: true,
                is_mock: true,
                data_source: 'DEMO DATA',
                message: 'Development account data refreshed.',
                last_synced_at: new Date().toISOString()
            };
        }

        // Check token expiration
        if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
            run("UPDATE instagram_accounts SET connection_status = 'TOKEN_EXPIRED' WHERE id = ?", [account.id]);
            throw new Error('Instagram connection needs attention. Token expired. Please reconnect Instagram.');
        }

        // Decrypt access token securely
        const tokenCipher = account.encrypted_access_token || account.access_token;
        const accessToken = TokenEncryptionService.decrypt(tokenCipher);

        if (!accessToken) {
            run("UPDATE instagram_accounts SET connection_status = 'REAUTH_REQUIRED' WHERE id = ?", [account.id]);
            throw new Error('Secure credentials could not be decrypted. Re-authorization required.');
        }

        try {
            // 1. Fetch fresh profile
            const profileUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(account.instagram_user_id)}?fields=id,username,name,biography,profile_picture_url,website,followers_count,follows_count,media_count&access_token=${encodeURIComponent(accessToken)}`;
            const profRes = await fetch(profileUrl);
            const profData = await profRes.json();

            if (!profRes.ok || profData.error) {
                const errMsg = profData.error?.message || 'Meta profile refresh request failed.';
                if (profData.error?.code === 190) { // OAuthException / Invalid token
                    run("UPDATE instagram_accounts SET connection_status = 'TOKEN_EXPIRED' WHERE id = ?", [account.id]);
                }
                throw new Error(errMsg);
            }

            const validatedProfile = InstagramValidationService.validateProfileResponse(profData);

            // 2. Fetch fresh media
            const mediaList = await InstagramMediaSyncService.fetchFromMeta(accessToken, account.instagram_user_id);
            const mediaResult = InstagramMediaSyncService.syncMediaCollection({
                instagramAccountId: account.id,
                creatorId,
                mediaList
            });

            // 3. Fetch insights
            const insights = await InstagramInsightsService.fetchInsightsFromMeta(accessToken, account.instagram_user_id);

            // 4. Calculate real engagement rate
            let engagementRate = null;
            if (validatedProfile.followersCount !== null && validatedProfile.followersCount > 0 && mediaResult.measurableCount > 0) {
                const totalInteractions = mediaResult.totalLikes + mediaResult.totalComments;
                engagementRate = Number(((totalInteractions / (mediaResult.measurableCount * validatedProfile.followersCount)) * 100).toFixed(2));
            }

            // 5. Update account metadata
            run(
                `UPDATE instagram_accounts
                 SET instagram_username = ?, username = ?, full_name = ?,
                     profile_picture_url = ?, biography = ?, bio = ?,
                     website = ?, last_synced_at = CURRENT_TIMESTAMP,
                     connection_status = 'CONNECTED'
                 WHERE id = ?`,
                [
                    validatedProfile.username, validatedProfile.username, validatedProfile.name,
                    validatedProfile.profilePictureUrl, validatedProfile.biography, validatedProfile.biography,
                    validatedProfile.website, account.id
                ]
            );

            // 6. Record metrics snapshot
            const metricId = `met_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
            run(
                `INSERT INTO instagram_metrics (
                    id, instagram_account_id, creator_id, followers_count,
                    following_count, media_count, reach, impressions,
                    profile_views, engagement_rate, data_source, source, recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Instagram', 'LIVE_API', CURRENT_TIMESTAMP)`,
                [
                    metricId, account.id, creatorId, validatedProfile.followersCount,
                    validatedProfile.followingCount, validatedProfile.mediaCount,
                    insights.reach, insights.impressions, insights.profile_views,
                    engagementRate
                ]
            );

            // 7. Record sync log
            run(
                `INSERT INTO instagram_sync_logs (
                    id, instagram_account_id, creator_id, started_at, completed_at,
                    status, records_updated
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'SUCCESS', ?)`,
                [
                    `synclog_${Date.now()}`, account.id, creatorId,
                    new Date(startTime).toISOString(), mediaResult.recordsUpdated
                ]
            );

            return {
                success: true,
                message: 'Instagram data refreshed successfully from official Meta API.',
                last_synced_at: new Date().toISOString()
            };
        } catch (err) {
            // Record failure in audit log WITHOUT zeroing existing data
            run(
                `INSERT INTO instagram_sync_logs (
                    id, instagram_account_id, creator_id, started_at, completed_at,
                    status, error_message
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'FAILED', ?)`,
                [`synclog_${Date.now()}`, account.id, creatorId, new Date(startTime).toISOString(), err.message]
            );

            console.error('[Instagram Sync Exception]', err.message);
            // Re-throw so caller can display: "Instagram synchronization failed. Showing last successfully synchronized data."
            throw err;
        }
    }

    /**
     * Retrieve authoritative status, validated metrics, snapshots, and media for creator
     */
    static getStatus(creatorId) {
        if (!creatorId) return { is_connected: false, connection_status: 'NOT_CONNECTED' };

        const account = queryOne(
            `SELECT id, instagram_user_id, instagram_username, username,
                    full_name, profile_picture_url, biography, bio, website,
                    account_type, connection_status, is_connected, token_expires_at,
                    last_synced_at
             FROM instagram_accounts
             WHERE creator_id = ? AND is_connected = 1`,
            [creatorId]
        );

        if (!account) {
            return {
                is_connected: false,
                connection_status: 'NOT_CONNECTED',
                account: null,
                metrics: null,
                media: [],
                snapshots: []
            };
        }

        const isExpired = account.token_expires_at && new Date(account.token_expires_at) < new Date();
        const effectiveStatus = isExpired ? 'TOKEN_EXPIRED' : (account.connection_status || 'CONNECTED');
        const isMock = account.account_type === 'MOCK_DEVELOPMENT' || account.account_type === 'SANDBOX_DEV_MODE';
        const defaultSource = isMock ? 'SANDBOX_DEV_MODE' : 'Instagram';

        // Authoritative latest metric snapshot
        const latestMetric = queryOne(
            `SELECT followers_count, following_count, media_count, reach,
                    impressions, profile_views, website_clicks, engagement_rate,
                    data_source, source, recorded_at
             FROM instagram_metrics
             WHERE instagram_account_id = ?
             ORDER BY recorded_at DESC
             LIMIT 1`,
            [account.id]
        );

        // Historical snapshots for growth calculations
        const historical = InstagramInsightsService.getHistoricalTrends(account.id);

        // Synced media items
        const media = InstagramMediaSyncService.getCreatorMedia(creatorId, 12);

        return {
            is_connected: true,
            is_mock: isMock,
            is_sandbox: isMock,
            mock_badge: isMock ? 'DEMO DATA' : null,
            sandbox_badge: isMock ? 'SANDBOX / DEV MODE — NOT REAL DATA' : null,
            connection_status: effectiveStatus,
            account: {
                instagram_user_id: account.instagram_user_id,
                username: account.instagram_username || account.username,
                full_name: account.full_name,
                profile_picture_url: account.profile_picture_url,
                biography: account.biography || account.bio,
                website: account.website,
                account_type: account.account_type,
                last_synced_at: account.last_synced_at
            },
            metrics: latestMetric ? {
                followers: InstagramValidationService.formatMetricField(latestMetric.followers_count, 'Followers', latestMetric.source || latestMetric.data_source || defaultSource),
                following: InstagramValidationService.formatMetricField(latestMetric.following_count, 'Following', latestMetric.source || latestMetric.data_source || defaultSource),
                media_count: InstagramValidationService.formatMetricField(latestMetric.media_count, 'Posts', latestMetric.source || latestMetric.data_source || defaultSource),
                reach: InstagramValidationService.formatMetricField(latestMetric.reach, 'Reach', latestMetric.source || latestMetric.data_source || defaultSource),
                impressions: InstagramValidationService.formatMetricField(latestMetric.impressions, 'Impressions', latestMetric.source || latestMetric.data_source || defaultSource),
                engagement_rate: {
                    value: latestMetric.engagement_rate,
                    available: latestMetric.engagement_rate !== null,
                    label: 'Engagement Rate',
                    source: isMock ? 'SANDBOX_DEV_MODE' : 'CreaterHub Analytics',
                    display: latestMetric.engagement_rate !== null ? `${latestMetric.engagement_rate}%` : 'Not available'
                },
                recorded_at: latestMetric.recorded_at
            } : null,
            trends: historical.trends,
            snapshots: historical.snapshots,
            media,
            has_sufficient_chart_data: historical.trends.hasSufficientHistory
        };
    }

    /**
     * Disconnect Instagram Account safely
     */
    static disconnect(creatorId) {
        if (!creatorId) throw new Error('creatorId is required to disconnect Instagram account.');

        run(
            `UPDATE instagram_accounts
             SET is_connected = 0, connection_status = 'DISCONNECTED',
                 encrypted_access_token = '', access_token = '',
                 updated_at = CURRENT_TIMESTAMP
             WHERE creator_id = ?`,
            [creatorId]
        );

        return {
            success: true,
            message: 'Instagram account disconnected successfully.'
        };
    }

    /**
     * Developer sandbox connector (delegates to MockInstagramService with production check)
     */
    static connectSandboxAccount(creatorId, customData = {}) {
        return MockInstagramService.connectMockAccount(creatorId, customData);
    }

    /**
     * Diagnostic report for developers and admins
     */
    static getConfigDiagnostics() {
        const stats = queryOne('SELECT count(*) as total, sum(case when is_connected = 1 then 1 else 0 end) as connected FROM instagram_accounts');
        return {
            is_configured: this.isConfigured(),
            app_id_present: Boolean(META_APP_ID),
            app_secret_present: Boolean(META_APP_SECRET),
            redirect_uri: META_REDIRECT_URI,
            mock_mode_available: this.isMockEnabled(),
            environment: process.env.NODE_ENV || 'development',
            sync_statistics: {
                total_accounts: stats?.total || 0,
                active_connections: stats?.connected || 0
            }
        };
    }
}

module.exports = InstagramService;
