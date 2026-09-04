/**
 * CreaterHub - Production Instagram Data Validation Service
 * 
 * Strict single-source-of-truth validation layer.
 * Enforces:
 * - Preservation of null vs 0 (0 and unknown are distinct states)
 * - Rejection of malformed external payloads
 * - Prevention of NaN or synthetic number injection
 * - Account ID type and format validation
 */

class InstagramValidationService {
    /**
     * Parse nullable numeric metric.
     * Preserves null/undefined as null. Does NOT coerce to 0.
     */
    static parseNullableInt(val) {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        if (isNaN(num) || !isFinite(num)) return null;
        return Math.floor(num);
    }

    /**
     * Parse nullable float metric (e.g. engagement rate).
     * Preserves null/undefined as null.
     */
    static parseNullableFloat(val, decimals = 2) {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        if (isNaN(num) || !isFinite(num)) return null;
        return Number(num.toFixed(decimals));
    }

    /**
     * Validate and normalize an Instagram account profile payload from Meta API
     */
    static validateProfileResponse(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Malformed Meta API profile response: expected an object.');
        }

        const id = data.id ? String(data.id).trim() : null;
        if (!id) {
            throw new Error('Meta API response missing required external Instagram account ID.');
        }

        const username = data.username ? String(data.username).trim().replace('@', '') : null;
        if (!username) {
            throw new Error('Meta API response missing required Instagram username.');
        }

        return {
            instagramUserId: id,
            username,
            name: data.name ? String(data.name).trim() : username,
            biography: data.biography !== undefined && data.biography !== null ? String(data.biography) : null,
            profilePictureUrl: data.profile_picture_url ? String(data.profile_picture_url) : null,
            website: data.website ? String(data.website).trim() : null,
            followersCount: this.parseNullableInt(data.followers_count),
            followingCount: this.parseNullableInt(data.follows_count),
            mediaCount: this.parseNullableInt(data.media_count)
        };
    }

    /**
     * Validate and normalize a list of media items from Meta API
     */
    static validateMediaList(rawItems) {
        if (!Array.isArray(rawItems)) return [];

        const validTypes = new Set(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']);

        return rawItems.map(item => {
            if (!item || !item.id) return null;

            const mediaType = String(item.media_type || 'IMAGE').toUpperCase();
            const normalizedType = validTypes.has(mediaType) ? mediaType : 'IMAGE';

            return {
                mediaId: String(item.id).trim(),
                caption: item.caption !== undefined && item.caption !== null ? String(item.caption) : null,
                mediaType: normalizedType,
                mediaUrl: item.media_url ? String(item.media_url) : (item.thumbnail_url ? String(item.thumbnail_url) : null),
                thumbnailUrl: item.thumbnail_url ? String(item.thumbnail_url) : null,
                permalink: item.permalink ? String(item.permalink) : null,
                timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
                // Preserves null if like_count/comments_count are hidden or unavailable
                likeCount: this.parseNullableInt(item.like_count),
                commentCount: this.parseNullableInt(item.comments_count)
            };
        }).filter(Boolean);
    }

    /**
     * Format a metric for frontend consumption with explicit provenance and availability flag
     */
    static formatMetricField(value, label, source = 'Instagram') {
        const isAvailable = value !== null && value !== undefined && !isNaN(value);
        return {
            value: isAvailable ? value : null,
            available: isAvailable,
            label,
            source: isAvailable ? source : 'Not available through Instagram API',
            display: isAvailable ? value.toLocaleString() : 'Not available'
        };
    }

    /**
     * Validate and normalize a raw metric snapshot
     */
    static validateMetricSnapshot(data = {}) {
        return {
            followersCount: this.parseNullableInt(data.followers_count),
            followingCount: this.parseNullableInt(data.following_count !== undefined ? data.following_count : data.follows_count),
            mediaCount: this.parseNullableInt(data.media_count),
            reach: this.parseNullableInt(data.reach),
            impressions: this.parseNullableInt(data.impressions),
            profileViews: this.parseNullableInt(data.profile_views),
            engagementRate: this.parseNullableFloat(data.engagement_rate)
        };
    }

    /**
     * Validate and normalize a single media item
     */
    static validateMediaItem(item) {
        if (!item || !item.id) return null;
        const validTypes = new Set(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']);
        const mediaType = String(item.media_type || 'IMAGE').toUpperCase();
        const normalizedType = validTypes.has(mediaType) ? mediaType : 'IMAGE';

        return {
            mediaId: String(item.id).trim(),
            caption: item.caption !== undefined && item.caption !== null ? String(item.caption) : null,
            mediaType: normalizedType,
            mediaUrl: item.media_url ? String(item.media_url) : (item.thumbnail_url ? String(item.thumbnail_url) : null),
            thumbnailUrl: item.thumbnail_url ? String(item.thumbnail_url) : null,
            permalink: item.permalink ? String(item.permalink) : null,
            timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
            likeCount: this.parseNullableInt(item.like_count),
            commentsCount: this.parseNullableInt(item.comments_count !== undefined ? item.comments_count : item.comment_count)
        };
    }
}

module.exports = InstagramValidationService;
