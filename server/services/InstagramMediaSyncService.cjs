/**
 * CreaterHub - Production Instagram Media Synchronization Service
 * 
 * Synchronizes recent media items from Meta Graph API.
 * Preserves null values for hidden or unavailable metrics.
 */

const { query, queryOne, run, transaction } = require('../db/database.cjs');
const InstagramValidationService = require('./InstagramValidationService.cjs');

class InstagramMediaSyncService {
    /**
     * Fetch media items directly from Meta Graph API
     */
    static async fetchFromMeta(accessToken, instagramUserId, limit = 25) {
        const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
        const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(instagramUserId)}/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`;
        
        console.log(`[Instagram Media Sync] Fetching recent media for Instagram User: ${instagramUserId}`);
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.error) {
            const errorMsg = data.error?.message || `Meta Media API error: HTTP ${res.status}`;
            console.error('[Instagram Media Sync Error]', errorMsg);
            throw new Error(errorMsg);
        }

        return InstagramValidationService.validateMediaList(data.data || []);
    }

    /**
     * Synchronize and upsert validated media collection into database
     */
    static syncMediaCollection({ instagramAccountId, creatorId, mediaList }) {
        if (!instagramAccountId || !creatorId || !Array.isArray(mediaList)) {
            return { recordsUpdated: 0, totalLikes: 0, totalComments: 0, measurableCount: 0 };
        }

        let recordsUpdated = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let measurableCount = 0;

        transaction(() => {
            for (const item of mediaList) {
                const existing = queryOne(
                    'SELECT id FROM instagram_media WHERE (instagram_media_id = ? OR media_id = ?) AND creator_id = ?',
                    [item.mediaId, item.mediaId, creatorId]
                );

                if (existing) {
                    run(
                        `UPDATE instagram_media
                         SET caption = ?, media_type = ?, media_url = ?, thumbnail_url = ?,
                             permalink = ?, timestamp = ?, like_count = ?, comments_count = ?,
                             comment_count = ?, last_synced_at = CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [
                            item.caption, item.mediaType, item.mediaUrl, item.thumbnailUrl,
                            item.permalink, item.timestamp, item.likeCount, item.commentCount,
                            item.commentCount, existing.id
                        ]
                    );
                } else {
                    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    run(
                        `INSERT INTO instagram_media (
                            id, instagram_account_id, creator_id, instagram_media_id, media_id,
                            caption, media_type, media_url, thumbnail_url, permalink, timestamp,
                            like_count, comments_count, comment_count, last_synced_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                        [
                            id, instagramAccountId, creatorId, item.mediaId, item.mediaId,
                            item.caption, item.mediaType, item.mediaUrl, item.thumbnailUrl,
                            item.permalink, item.timestamp, item.likeCount, item.commentCount,
                            item.commentCount
                        ]
                    );
                }

                recordsUpdated++;

                // Track measurable engagement metrics where permission permits
                if (item.likeCount !== null || item.commentCount !== null) {
                    totalLikes += (item.likeCount || 0);
                    totalComments += (item.commentCount || 0);
                    measurableCount++;
                }
            }
        });

        return {
            recordsUpdated,
            totalLikes,
            totalComments,
            measurableCount
        };
    }

    /**
     * Retrieve synchronized media items for creator with ownership check
     */
    static getCreatorMedia(creatorId, limit = 12) {
        return query(
            `SELECT instagram_media_id as id, media_type, media_url, thumbnail_url,
                    permalink, caption, timestamp, like_count, comments_count,
                    reach, impressions
             FROM instagram_media
             WHERE creator_id = ?
             ORDER BY timestamp DESC
             LIMIT ?`,
            [creatorId, limit]
        ).map(item => ({
            ...item,
            like_count: item.like_count !== null ? item.like_count : null,
            comments_count: item.comments_count !== null ? item.comments_count : null
        }));
    }
}

module.exports = InstagramMediaSyncService;
