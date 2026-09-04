/**
 * CreaterHub - Official Meta / Instagram Graph API Service
 * 
 * Strict "Real Data First. No Fake Data" implementation.
 * - Handles official OAuth authorization code exchange
 * - Server-side token storage with 60-day long-lived token exchange
 * - Fetches live profile, official metrics, and published media
 * - Structured audit logging (never logs tokens/secrets)
 * - Zero fallback to fake benchmark data
 */

const { query, queryOne, run, transaction } = require('../db/database.cjs');

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:5173/creator/dashboard';

class InstagramService {
    /**
     * Check if Meta developer app credentials are configured
     */
    static isConfigured() {
        return Boolean(META_APP_ID && META_APP_SECRET);
    }

    /**
     * Generate the official Meta OAuth Authorization URL
     */
    static getAuthorizationUrl(creatorId) {
        if (!this.isConfigured()) {
            return {
                configured: false,
                url: null,
                message: 'META_APP_ID and META_APP_SECRET are not configured in .env. Real Meta OAuth requires a registered Meta Developer App.'
            };
        }

        const scope = 'instagram_basic,instagram_manage_insights,pages_read_engagement,pages_show_list';
        const state = Buffer.from(JSON.stringify({ creatorId, timestamp: Date.now() })).toString('base64');
        const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&scope=${scope}&state=${state}&response_type=code`;

        return {
            configured: true,
            url,
            message: 'Official Meta OAuth URL generated.'
        };
    }

    /**
     * Exchange OAuth Code for a Long-Lived User Access Token
     */
    static async exchangeCodeForToken(code) {
        if (!this.isConfigured()) {
            throw new Error('Meta App credentials (META_APP_ID, META_APP_SECRET) are missing.');
        }

        console.log('[Instagram Sync Started] Exchanging OAuth authorization code...');

        // Step 1: Exchange code for short-lived access token
        const tokenExchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`;
        const tokenRes = await fetch(tokenExchangeUrl);
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || tokenData.error) {
            const errMsg = tokenData.error?.message || 'Failed to exchange authorization code with Meta Graph API.';
            console.error('[Instagram API Error] Token exchange failed:', errMsg);
            throw new Error(errMsg);
        }

        const shortLivedToken = tokenData.access_token;

        // Step 2: Exchange for a 60-day long-lived access token
        const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
        let longLivedToken = shortLivedToken;
        let expiresInSeconds = tokenData.expires_in || (60 * 86400);

        try {
            const longRes = await fetch(longLivedUrl);
            const longData = await longRes.json();
            if (longRes.ok && longData.access_token) {
                longLivedToken = longData.access_token;
                expiresInSeconds = longData.expires_in || (60 * 86400);
            }
        } catch (e) {
            console.warn('[Instagram Warning] Long-lived token exchange warning, using short-lived token:', e.message);
        }

        const expiresAt = new Date(Date.now() + (expiresInSeconds * 1000)).toISOString();
        return { token: longLivedToken, expiresAt };
    }

    /**
     * Locate Connected Instagram Business/Creator Account via Facebook Page
     */
    static async findConnectedInstagramAccount(accessToken) {
        const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography}&access_token=${accessToken}`;
        const res = await fetch(accountsUrl);
        const data = await res.json();

        if (!res.ok || data.error) {
            throw new Error(data.error?.message || 'Failed to fetch Facebook pages and linked Instagram accounts.');
        }

        const pageWithIg = data.data?.find(p => p.instagram_business_account);
        if (!pageWithIg || !pageWithIg.instagram_business_account) {
            throw new Error('No Instagram Professional/Business account is linked to your Facebook pages. Please ensure your Instagram is connected to a Facebook page.');
        }

        return pageWithIg.instagram_business_account;
    }

    /**
     * Fetch Live Media Items from Instagram
     */
    static async fetchMediaItems(accessToken, igUserId) {
        try {
            const mediaUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=15&access_token=${accessToken}`;
            const res = await fetch(mediaUrl);
            if (!res.ok) return [];
            const data = await res.json();
            return data.data || [];
        } catch (err) {
            console.warn('[Instagram Warning] Failed to fetch media items:', err.message);
            return [];
        }
    }

    /**
     * Connect and Sync an Instagram Account for a Creator
     */
    static async connectAccount({ creatorId, userId, code }) {
        const startTime = Date.now();
        console.log(`[Instagram Sync Started] User ID: ${userId}, Creator ID: ${creatorId}`);

        try {
            const { token, expiresAt } = await this.exchangeCodeForToken(code);
            const igAccount = await this.findConnectedInstagramAccount(token);

            const igUserId = igAccount.id;
            const username = igAccount.username || 'instagram_user';
            const fullName = igAccount.name || username;
            const profilePic = igAccount.profile_picture_url || '';
            const bio = igAccount.biography || '';
            const followers = Number(igAccount.followers_count) || 0;
            const follows = Number(igAccount.follows_count) || 0;
            const mediaCount = Number(igAccount.media_count) || 0;

            // Fetch live recent media
            const mediaList = await this.fetchMediaItems(token, igUserId);

            // Compute engagement rate purely from real media
            let totalLikes = 0;
            let totalComments = 0;
            for (const m of mediaList) {
                totalLikes += Number(m.like_count) || 0;
                totalComments += Number(m.comments_count) || 0;
            }
            const measuredPosts = mediaList.length;
            const realEngagementRate = (measuredPosts > 0 && followers > 0)
                ? Number((((totalLikes + totalComments) / (measuredPosts * followers)) * 100).toFixed(2))
                : 0.0;

            const accountRecordId = `ig_${creatorId}`;

            transaction(() => {
                // Upsert instagram_accounts record
                const existing = queryOne('SELECT id FROM instagram_accounts WHERE creator_id = ?', [creatorId]);
                if (existing) {
                    run(
                        `UPDATE instagram_accounts
                         SET instagram_user_id = ?, username = ?, full_name = ?, profile_picture_url = ?,
                             bio = ?, access_token = ?, token_expires_at = ?, connection_status = 'CONNECTED',
                             is_connected = 1, last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                         WHERE creator_id = ?`,
                        [igUserId, username, fullName, profilePic, bio, token, expiresAt, creatorId]
                    );
                } else {
                    run(
                        `INSERT INTO instagram_accounts (
                            id, creator_id, user_id, instagram_user_id, username,
                            full_name, profile_picture_url, bio, access_token,
                            token_expires_at, connection_status, is_connected, last_synced_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONNECTED', 1, CURRENT_TIMESTAMP)`,
                        [accountRecordId, creatorId, userId, igUserId, username, fullName, profilePic, bio, token, expiresAt]
                    );
                }

                // Insert snapshot into instagram_metrics
                const metricId = `met_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                run(
                    `INSERT INTO instagram_metrics (
                        id, instagram_account_id, creator_id, followers_count,
                        follows_count, media_count, engagement_rate, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'LIVE_API')`,
                    [metricId, accountRecordId, creatorId, followers, follows, mediaCount, realEngagementRate]
                );

                // Insert media items
                for (const m of mediaList) {
                    const existingMedia = queryOne('SELECT id FROM instagram_media WHERE media_id = ? AND creator_id = ?', [m.id, creatorId]);
                    if (!existingMedia) {
                        run(
                            `INSERT INTO instagram_media (
                                id, instagram_account_id, creator_id, media_id, caption,
                                media_type, media_url, thumbnail_url, permalink, like_count,
                                comments_count, timestamp
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                                accountRecordId, creatorId, m.id, m.caption || '',
                                m.media_type || 'IMAGE', m.media_url || '', m.thumbnail_url || '',
                                m.permalink || '', Number(m.like_count) || 0, Number(m.comments_count) || 0,
                                m.timestamp || new Date().toISOString()
                            ]
                        );
                    }
                }
            });

            const durationMs = Date.now() - startTime;
            // Record audit log
            run(
                `INSERT INTO refresh_logs (id, creator_id, instagram_account_id, status, metrics_updated_count, sync_duration_ms)
                 VALUES (?, ?, ?, 'SUCCESS', ?, ?)`,
                [`log_${Date.now()}`, creatorId, accountRecordId, mediaList.length, durationMs]
            );

            console.log(`[Instagram Sync Completed] Creator ID: ${creatorId}, Followers: ${followers}, Media count: ${mediaCount}`);

            return {
                success: true,
                username,
                followers_count: followers,
                follows_count: follows,
                media_count: mediaCount,
                engagement_rate: realEngagementRate,
                last_synced_at: new Date().toISOString()
            };
        } catch (err) {
            const durationMs = Date.now() - startTime;
            run(
                `INSERT INTO refresh_logs (id, creator_id, status, error_message, sync_duration_ms)
                 VALUES (?, ?, 'FAILED', ?, ?)`,
                [`log_${Date.now()}`, creatorId, err.message, durationMs]
            );
            console.error('[Instagram Sync Failed]', err.message);
            throw err;
        }
    }

    /**
     * Get Authoritative Instagram Status & Metrics for a Creator
     */
    static getStatus(creatorId) {
        const account = queryOne(
            `SELECT id, instagram_user_id, username, full_name, profile_picture_url,
                    bio, account_type, connection_status, is_connected, last_synced_at,
                    token_expires_at
             FROM instagram_accounts
             WHERE creator_id = ?`,
            [creatorId]
        );

        if (!account || account.is_connected === 0) {
            return {
                is_connected: false,
                connection_status: 'NOT_CONNECTED',
                message: 'No Instagram account connected. Connect an account to unlock real analytics.',
                metrics: null,
                snapshots: [],
                media: [],
                has_sufficient_chart_data: false
            };
        }

        // Check token expiration
        const isExpired = account.token_expires_at && new Date(account.token_expires_at) < new Date();
        const effectiveStatus = isExpired ? 'TOKEN_EXPIRED' : (account.connection_status || 'CONNECTED');

        // Latest recorded metrics
        const latestMetric = queryOne(
            `SELECT followers_count, follows_count, media_count, reach, impressions, engagement_rate, source, recorded_at
             FROM instagram_metrics
             WHERE instagram_account_id = ?
             ORDER BY recorded_at DESC
             LIMIT 1`,
            [account.id]
        );

        // Historical snapshots (for real trend visualization)
        const snapshots = query(
            `SELECT followers_count, follows_count, media_count, engagement_rate, recorded_at
             FROM instagram_metrics
             WHERE instagram_account_id = ?
             ORDER BY recorded_at ASC
             LIMIT 30`,
            [account.id]
        );

        // Real media items
        const media = query(
            `SELECT media_id, caption, media_type, media_url, thumbnail_url, permalink, like_count, comments_count, timestamp
             FROM instagram_media
             WHERE instagram_account_id = ?
             ORDER BY timestamp DESC
             LIMIT 12`,
            [account.id]
        );

        const isSandbox = account.account_type === 'SANDBOX_DEV_MODE';

        return {
            is_connected: true,
            is_sandbox: isSandbox,
            sandbox_badge: isSandbox ? 'SANDBOX / DEV MODE — NOT REAL DATA' : null,
            connection_status: effectiveStatus,
            account: {
                username: account.username,
                full_name: account.full_name,
                profile_picture_url: account.profile_picture_url,
                bio: account.bio,
                account_type: account.account_type,
                last_synced_at: account.last_synced_at
            },
            metrics: latestMetric ? {
                followers: { value: latestMetric.followers_count, source: isSandbox ? 'SANDBOX_DEV_MODE' : (latestMetric.source || 'LIVE_API'), label: 'Followers' },
                following: { value: latestMetric.follows_count, source: isSandbox ? 'SANDBOX_DEV_MODE' : (latestMetric.source || 'LIVE_API'), label: 'Following' },
                media_count: { value: latestMetric.media_count, source: isSandbox ? 'SANDBOX_DEV_MODE' : (latestMetric.source || 'LIVE_API'), label: 'Posts' },
                engagement_rate: { value: latestMetric.engagement_rate, source: isSandbox ? 'SANDBOX_DEV_MODE' : 'CALCULATED', label: 'Engagement Rate' },
                recorded_at: latestMetric.recorded_at
            } : null,
            snapshots,
            media,
            has_sufficient_chart_data: snapshots.length >= 2
        };
    }

    /**
     * Connect via Developer Sandbox Mode for local testing
     * (Strictly watermarked as SANDBOX_DEV_MODE)
     */
    static connectSandboxAccount(creatorId, customOptions = {}) {
        const creator = queryOne('SELECT user_id, full_name, username, avatar_url, bio FROM creator_profiles WHERE id = ?', [creatorId]);
        const userId = creator?.user_id || 'usr_dev';
        const cleanUsername = (customOptions.username || creator?.username || 'creator_dev').replace('@', '').trim();
        const fullName = (customOptions.fullName || creator?.full_name || 'Verified Creator').trim();
        const avatar = customOptions.avatarUrl || creator?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop';
        const bio = (customOptions.bio || creator?.bio || 'Bengaluru content creator & storyteller. Connected via Sandbox Test Mode.').trim();
        const followers = Number(customOptions.followersCount) || 18400;
        const follows = Number(customOptions.followingCount) || 520;
        const mediaCount = Number(customOptions.mediaCount) || 42;
        const engagementRate = Number(customOptions.engagementRate) || 4.35;

        transaction(() => {
            const existing = queryOne('SELECT id FROM instagram_accounts WHERE creator_id = ?', [creatorId]);
            let accountId = existing?.id;

            if (existing) {
                run(
                    `UPDATE instagram_accounts
                     SET username = ?, full_name = ?, profile_picture_url = ?, bio = ?,
                         account_type = 'SANDBOX_DEV_MODE', access_token = 'sandbox_test_token',
                         is_connected = 1, connection_status = 'CONNECTED',
                         last_synced_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [cleanUsername, fullName, avatar, bio, accountId]
                );
            } else {
                accountId = `iga_${Date.now()}_sandbox`;
                run(
                    `INSERT INTO instagram_accounts (
                        id, creator_id, user_id, instagram_user_id, username, full_name,
                        profile_picture_url, bio, account_type, access_token, is_connected, connection_status, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SANDBOX_DEV_MODE', 'sandbox_test_token', 1, 'CONNECTED', CURRENT_TIMESTAMP)`,
                    [accountId, creatorId, userId, `sandbox_${Date.now()}`, cleanUsername, fullName, avatar, bio]
                );
            }

            // Insert metrics
            const metricId = `met_${Date.now()}_sandbox`;
            run(
                `INSERT INTO instagram_metrics (
                    id, instagram_account_id, creator_id, followers_count,
                    follows_count, media_count, engagement_rate, source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SANDBOX_DEV_MODE')`,
                [metricId, accountId, creatorId, followers, follows, mediaCount, engagementRate]
            );

            // Insert 4 historical snapshots for trend charts
            const snapshotsData = [
                { daysAgo: 30, followers: 16200, eng: 4.1 },
                { daysAgo: 20, followers: 16900, eng: 4.2 },
                { daysAgo: 10, followers: 17600, eng: 4.3 },
                { daysAgo: 0, followers: 18400, eng: 4.35 }
            ];

            for (const s of snapshotsData) {
                const date = new Date(Date.now() - s.daysAgo * 86400000).toISOString();
                run(
                    `INSERT INTO instagram_metrics (
                        id, instagram_account_id, creator_id, followers_count,
                        follows_count, media_count, engagement_rate, recorded_at, source
                    ) VALUES (?, ?, ?, ?, 520, 42, ?, ?, 'SANDBOX_DEV_MODE')`,
                    [`snap_${Date.now()}_${s.daysAgo}`, accountId, creatorId, s.followers, s.eng, date]
                );
            }

            // Clear old sandbox media if any to avoid duplication
            run('DELETE FROM instagram_media WHERE creator_id = ?', [creatorId]);

            const sampleMedia = [
                {
                    id: `med_sbx_1`,
                    caption: 'Golden hour pour-over at Third Wave Indiranagar. Rich notes of dark chocolate and orange zest. ☕✨ #BangaloreCafes #SpecialtyCoffee',
                    type: 'VIDEO',
                    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop',
                    likes: 1240,
                    comments: 86
                },
                {
                    id: `med_sbx_2`,
                    caption: 'Weekend aesthetic exploration in Church Street. Streets, books, and cold brew vibes. 📸 #NammaBengaluru #CityVibes',
                    type: 'IMAGE',
                    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop',
                    likes: 980,
                    comments: 54
                },
                {
                    id: `med_sbx_3`,
                    caption: 'Behind the scenes at the morning roastery session. The aroma of freshly cracked beans never gets old! 🌿',
                    type: 'CAROUSEL_ALBUM',
                    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=600&fit=crop',
                    likes: 1450,
                    comments: 112
                },
                {
                    id: `med_sbx_4`,
                    caption: 'Sundowner vibes & handcrafted cocktails with good company. The city comes alive after dark. 🍸🌃',
                    type: 'VIDEO',
                    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop',
                    likes: 890,
                    comments: 42
                }
            ];

            for (const m of sampleMedia) {
                run(
                    `INSERT INTO instagram_media (
                        id, instagram_account_id, creator_id, media_id, caption,
                        media_type, media_url, permalink, like_count, comments_count, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        `med_${Date.now()}_${m.id}`,
                        accountId,
                        creatorId,
                        m.id,
                        m.caption,
                        m.type,
                        m.url,
                        `https://instagram.com/p/${m.id}`,
                        m.likes,
                        m.comments
                    ]
                );
            }
        });

        return {
            success: true,
            is_sandbox: true,
            message: 'Connected via Developer Sandbox Mode for local testing.',
            username: cleanUsername,
            followers_count: 18400,
            engagement_rate: 4.35
        };
    }

    /**
     * Disconnect Instagram Account
     */
    static disconnect(creatorId) {
        run(
            `UPDATE instagram_accounts
             SET is_connected = 0, connection_status = 'NOT_CONNECTED', access_token = ''
             WHERE creator_id = ?`,
            [creatorId]
        );
        return { success: true, message: 'Instagram account disconnected.' };
    }

    /**
     * Get Developer Diagnostics / Configuration Status
     */
    static getConfigDiagnostics() {
        const totalConnected = queryOne('SELECT COUNT(*) as count FROM instagram_accounts WHERE is_connected = 1')?.count || 0;
        const totalLogs = query('SELECT * FROM refresh_logs ORDER BY logged_at DESC LIMIT 10');
        const failedSyncs = queryOne("SELECT COUNT(*) as count FROM refresh_logs WHERE status = 'FAILED'")?.count || 0;
        const successSyncs = queryOne("SELECT COUNT(*) as count FROM refresh_logs WHERE status = 'SUCCESS'")?.count || 0;

        return {
            is_configured: this.isConfigured(),
            meta_app_id_present: Boolean(META_APP_ID),
            redirect_uri: META_REDIRECT_URI,
            total_connected_accounts: totalConnected,
            sync_statistics: {
                total_successful: successSyncs,
                total_failed: failedSyncs
            },
            recent_logs: totalLogs
        };
    }
}

module.exports = InstagramService;
