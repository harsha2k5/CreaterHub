/**
 * CreaterHub - Production Instagram Insights Service
 * 
 * Interacts with the official Meta Instagram Insights API.
 * Dynamically handles metric availability based on account tier and permissions.
 * Computes historical growth and trends exclusively from stored historical data points.
 */

const { query, queryOne, run } = require('../db/database.cjs');
const InstagramValidationService = require('./InstagramValidationService.cjs');

class InstagramInsightsService {
    /**
     * Query official Meta Graph Insights API for the connected account
     */
    static async fetchInsightsFromMeta(accessToken, instagramUserId) {
        const supportedMetrics = ['reach', 'impressions', 'profile_views'];
        const metricParam = supportedMetrics.join(',');
        const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(instagramUserId)}/insights?metric=${metricParam}&period=day&access_token=${encodeURIComponent(accessToken)}`;

        try {
            console.log(`[Instagram Insights] Querying insights for ${instagramUserId}`);
            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok || data.error) {
                console.warn('[Instagram Insights Notice]', data.error?.message || 'Insights unavailable for account tier');
                return {
                    reach: null,
                    impressions: null,
                    profile_views: null
                };
            }

            const results = { reach: null, impressions: null, profile_views: null };
            if (Array.isArray(data.data)) {
                for (const item of data.data) {
                    const val = item.values?.[0]?.value;
                    if (item.name === 'reach') results.reach = InstagramValidationService.parseNullableInt(val);
                    if (item.name === 'impressions') results.impressions = InstagramValidationService.parseNullableInt(val);
                    if (item.name === 'profile_views') results.profile_views = InstagramValidationService.parseNullableInt(val);
                }
            }

            return results;
        } catch (err) {
            console.warn('[Instagram Insights Warning] Transient insights query failure:', err.message);
            return { reach: null, impressions: null, profile_views: null };
        }
    }

    /**
     * Retrieve historical metric snapshots and calculate percentage change
     * ONLY calculates percentage change if at least 2 real historical records exist.
     */
    static getHistoricalTrends(instagramAccountId, days = 30) {
        const snapshots = query(
            `SELECT followers_count, following_count, media_count,
                    reach, impressions, engagement_rate, data_source, recorded_at
             FROM instagram_metrics
             WHERE instagram_account_id = ?
             ORDER BY recorded_at ASC
             LIMIT ?`,
            [instagramAccountId, days]
        );

        let followerChangePercent = null;
        let engagementChangePercent = null;

        if (snapshots.length >= 2) {
            const first = snapshots[0];
            const latest = snapshots[snapshots.length - 1];

            if (first.followers_count !== null && latest.followers_count !== null && first.followers_count > 0) {
                const diff = latest.followers_count - first.followers_count;
                followerChangePercent = Number(((diff / first.followers_count) * 100).toFixed(1));
            }

            if (first.engagement_rate !== null && latest.engagement_rate !== null && first.engagement_rate > 0) {
                const diff = latest.engagement_rate - first.engagement_rate;
                engagementChangePercent = Number(((diff / first.engagement_rate) * 100).toFixed(1));
            }
        }

        return {
            snapshots: snapshots.map(s => ({
                date: s.recorded_at ? s.recorded_at.split('T')[0] : '',
                followers: s.followers_count,
                following: s.following_count,
                engagementRate: s.engagement_rate,
                reach: s.reach,
                impressions: s.impressions,
                dataSource: s.data_source || 'Instagram'
            })),
            trends: {
                hasSufficientHistory: snapshots.length >= 2,
                followerChangePercent,
                followerGrowthPercentage: followerChangePercent,
                engagementChangePercent,
                engagementGrowthPercentage: engagementChangePercent
            }
        };
    }
}

module.exports = InstagramInsightsService;
