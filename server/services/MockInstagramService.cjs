/**
 * CreaterHub - Development Mock Instagram Service
 * 
 * STRICT ARCHITECTURAL RULE:
 * This service is enabled ONLY during development when USE_INSTAGRAM_MOCK=true.
 * It contains hard runtime guards that throw a fatal exception if executed in production.
 * All generated data is explicitly tagged with data_source = 'DEMO DATA'.
 */

const { query, queryOne, run, transaction } = require('../db/database.cjs');

class MockInstagramService {
    /**
     * Enforce strict production barrier
     */
    static enforceEnvironmentSafety() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('SECURITY VIOLATION: MockInstagramService is strictly forbidden in production mode. Set USE_INSTAGRAM_MOCK=false.');
        }
    }

    /**
     * Connect a realistic development mock account for local UI testing
     */
    static connectMockAccount(creatorId, customData = {}) {
        this.enforceEnvironmentSafety();

        const creator = queryOne('SELECT user_id, full_name, username, avatar_url, bio FROM creator_profiles WHERE id = ?', [creatorId]);
        if (!creator) throw new Error('Creator profile not found.');

        const username = (customData.username || creator.username || 'creator_demo').replace('@', '').trim();
        const fullName = (customData.fullName || creator.full_name || 'Demo Creator').trim();
        const bio = (customData.bio || creator.bio || 'Local Bengaluru storyteller. Mock test account for interface evaluation.').trim();
        const avatar = customData.avatarUrl || creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop';
        const followers = Number(customData.followersCount) || 24500;
        const following = Number(customData.followingCount) || 680;
        const mediaCount = Number(customData.mediaCount) || 54;
        const engagementRate = Number(customData.engagementRate) || 4.25;

        transaction(() => {
            const existing = queryOne('SELECT id FROM instagram_accounts WHERE creator_id = ?', [creatorId]);
            let accountId = existing?.id;

            if (existing) {
                run(
                    `UPDATE instagram_accounts
                     SET instagram_user_id = ?, instagram_username = ?, username = ?,
                         full_name = ?, profile_picture_url = ?, biography = ?, bio = ?,
                         account_type = 'MOCK_DEVELOPMENT', access_token = 'mock_demo_token',
                         is_connected = 1, connection_status = 'CONNECTED',
                         last_synced_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [`mock_ig_${creatorId}`, username, username, fullName, avatar, bio, bio, accountId]
                );
            } else {
                accountId = `iga_${Date.now()}_mock`;
                run(
                    `INSERT INTO instagram_accounts (
                        id, creator_id, user_id, instagram_user_id, instagram_username,
                        username, full_name, profile_picture_url, biography, bio,
                        account_type, access_token, is_connected, connection_status, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MOCK_DEVELOPMENT', 'mock_demo_token', 1, 'CONNECTED', CURRENT_TIMESTAMP)`,
                    [
                        accountId, creatorId, creator.user_id, `mock_ig_${creatorId}`,
                        username, username, fullName, avatar, bio, bio
                    ]
                );
            }

            // Insert metrics with explicit DEMO DATA label
            const metricId = `met_${Date.now()}_mock`;
            run(
                `INSERT INTO instagram_metrics (
                    id, instagram_account_id, creator_id, followers_count,
                    following_count, media_count, reach, impressions,
                    engagement_rate, data_source, source, recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEMO DATA', 'SANDBOX_DEV_MODE', CURRENT_TIMESTAMP)`,
                [
                    metricId, accountId, creatorId, followers, following,
                    mediaCount, Math.round(followers * 2.8), Math.round(followers * 4.5),
                    engagementRate
                ]
            );

            // Seed snapshots for trend chart evaluation
            const snapshots = [
                { daysAgo: 30, followers: Math.round(followers * 0.88), eng: 3.9 },
                { daysAgo: 20, followers: Math.round(followers * 0.92), eng: 4.0 },
                { daysAgo: 10, followers: Math.round(followers * 0.96), eng: 4.15 },
                { daysAgo: 0, followers, eng: engagementRate }
            ];

            for (const s of snapshots) {
                const date = new Date(Date.now() - s.daysAgo * 86400000).toISOString();
                run(
                    `INSERT INTO instagram_metrics (
                        id, instagram_account_id, creator_id, followers_count,
                        following_count, media_count, reach, impressions,
                        engagement_rate, data_source, source, recorded_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEMO DATA', 'SANDBOX_DEV_MODE', ?)`,
                    [
                        `snap_${Date.now()}_${s.daysAgo}`, accountId, creatorId,
                        s.followers, following, mediaCount, Math.round(s.followers * 2.5),
                        Math.round(s.followers * 4.0), s.eng, date
                    ]
                );
            }

            // Clear old mock media and seed fresh items
            run('DELETE FROM instagram_media WHERE creator_id = ?', [creatorId]);

            const mockMedia = [
                {
                    id: 'med_mock_1',
                    caption: 'Morning brew perfection in Indiranagar. Rich aromas and single-origin notes. ☕✨ #BangaloreCoffee',
                    type: 'VIDEO',
                    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&h=600&fit=crop',
                    likes: 1350,
                    comments: 92
                },
                {
                    id: 'med_mock_2',
                    caption: 'Weekend pop-up showcase at Church Street. City vibes and aesthetic streetwear. 📸 #NammaBengaluru',
                    type: 'IMAGE',
                    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop',
                    likes: 1080,
                    comments: 64
                },
                {
                    id: 'med_mock_3',
                    caption: 'Behind the scenes at the wellness & activewear shoot. Hydration, endurance, and consistency. 🌿⚡',
                    type: 'CAROUSEL_ALBUM',
                    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop',
                    likes: 1720,
                    comments: 128
                }
            ];

            for (const m of mockMedia) {
                run(
                    `INSERT INTO instagram_media (
                        id, instagram_account_id, creator_id, instagram_media_id, media_id,
                        caption, media_type, media_url, permalink, like_count, comments_count,
                        comment_count, data_source, source, last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEMO DATA', 'SANDBOX_DEV_MODE', CURRENT_TIMESTAMP)`,
                    [
                        `med_${Date.now()}_${m.id}`, accountId, creatorId, m.id, m.id,
                        m.caption, m.type, m.url, `https://instagram.com/p/${m.id}`,
                        m.likes, m.comments, m.comments
                    ]
                );
            }
        });

        return {
            success: true,
            is_mock: true,
            is_sandbox: true,
            sandbox_badge: 'SANDBOX / DEV MODE — NOT REAL DATA',
            mock_badge: 'DEMO DATA',
            data_source: 'DEMO DATA',
            message: 'Development Mock Account connected successfully for UI evaluation.',
            account: {
                username,
                fullName,
                followersCount: followers,
                engagementRate
            }
        };
    }
}

module.exports = MockInstagramService;
