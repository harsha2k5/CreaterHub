/**
 * CreaterHub - Instagram Data Collector Service
 * Layer 1 of the Creator Analytics Engine Pipeline:
 * [Instagram API / Benchmark Fallback] -> Data Collector -> Normalizer -> Analytics Engine
 * 
 * Complies strictly with Meta Platform Policies:
 * - Direct official Meta Graph API v19.0 calls when authorized
 * - Never scrapes Instagram
 * - Explicitly tags the origin of all collected data (API vs Benchmark Fallback)
 */

const META_GRAPH_VERSION = 'v19.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Collect live data from Official Meta Graph API
 * @param {string} accessToken - Valid Meta User / Page Access Token
 * @param {string} igUserId - Connected Instagram Business / Creator Account ID
 */
async function collectFromMetaAPI(accessToken, igUserId) {
    const isLiveToken = Boolean(accessToken && (accessToken.startsWith('EAA') || accessToken.startsWith('EAAG')));
    if (!isLiveToken || !igUserId) {
        throw new Error('Valid Meta access token and Instagram User ID are required for live collection.');
    }

    // 1. Fetch User Profile & Basic Counts
    const profileUrl = `${GRAPH_BASE_URL}/${igUserId}?fields=id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count&access_token=${accessToken}`;
    const profileRes = await fetch(profileUrl);
    if (!profileRes.ok) {
        const err = await profileRes.json();
        throw new Error(err.error?.message || 'Failed to fetch Instagram profile from Graph API');
    }
    const profileData = await profileRes.json();

    // 2. Fetch Recent Media Items (Feed & Reels)
    const mediaUrl = `${GRAPH_BASE_URL}/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&limit=25&access_token=${accessToken}`;
    const mediaRes = await fetch(mediaUrl);
    let mediaData = [];
    if (mediaRes.ok) {
        const json = await mediaRes.json();
        mediaData = json.data || [];
    }

    // 3. Fetch Insights if authorized
    let audienceCity = [];
    let audienceCountry = [];
    let audienceGenderAge = [];
    try {
        const insightsUrl = `${GRAPH_BASE_URL}/${igUserId}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${accessToken}`;
        const insightsRes = await fetch(insightsUrl);
        if (insightsRes.ok) {
            const json = await insightsRes.json();
            const metrics = json.data || [];
            const cityMetric = metrics.find(m => m.name === 'audience_city');
            const countryMetric = metrics.find(m => m.name === 'audience_country');
            const gaMetric = metrics.find(m => m.name === 'audience_gender_age');
            if (cityMetric?.values?.[0]?.value) audienceCity = cityMetric.values[0].value;
            if (countryMetric?.values?.[0]?.value) audienceCountry = countryMetric.values[0].value;
            if (gaMetric?.values?.[0]?.value) audienceGenderAge = gaMetric.values[0].value;
        }
    } catch (e) {
        console.warn('Live insights metric warning (demographics restricted):', e.message);
    }

    return {
        is_official_api: true,
        collector_source: 'META_GRAPH_API_V19',
        collected_at: new Date().toISOString(),
        profile: {
            id: profileData.id,
            username: profileData.username,
            name: profileData.name,
            avatar_url: profileData.profile_picture_url,
            bio: profileData.biography,
            followers_count: profileData.followers_count || 0,
            follows_count: profileData.follows_count || 0,
            media_count: profileData.media_count || 0
        },
        raw_media: mediaData,
        raw_insights: {
            audience_city: audienceCity,
            audience_country: audienceCountry,
            audience_gender_age: audienceGenderAge
        }
    };
}

/**
 * Collect data via deterministic benchmark provider (for development / unauthenticated mode)
 * Scoped strictly to the authenticated creator and their specific connected account.
 * @param {Object} creatorRecord - MongoDB Creator document
 * @param {Object} [connectionRecord] - MongoDB InstagramConnection document
 */
async function collectFromBenchmark(creatorRecord, connectionRecord = null) {
    // Determine exact follower count from connection or creator profile - never global/hardcoded numbers
    const followers = Number(connectionRecord?.followers_count ?? (creatorRecord?.followers !== undefined ? creatorRecord.followers : 0));
    const following = Number(connectionRecord?.follows_count ?? (creatorRecord?.following !== undefined ? creatorRecord.following : 0));
    const postsCount = Number(connectionRecord?.media_count ?? (creatorRecord?.posts_count !== undefined ? creatorRecord.posts_count : 0));
    const username = connectionRecord?.username || creatorRecord?.username || 'creator';

    return {
        is_official_api: false,
        collector_source: 'CREATERHUB_BENCHMARK_COLLECTOR',
        collected_at: new Date().toISOString(),
        profile: {
            id: connectionRecord?.instagram_user_id || ('ig_' + creatorRecord?.id),
            username: username,
            name: connectionRecord?.full_name || creatorRecord?.full_name || username,
            avatar_url: connectionRecord?.profile_picture_url || creatorRecord?.avatar_url,
            bio: connectionRecord?.bio || creatorRecord?.bio || `Digital Creator @${username}`,
            followers_count: followers,
            follows_count: following,
            media_count: postsCount
        },
        raw_media: [], // Will be generated & enriched in Normalizer
        raw_insights: {
            audience_city: { 'Bengaluru': 0.42, 'Mumbai': 0.26, 'Delhi NCR': 0.18, 'Hyderabad': 0.14 },
            audience_country: { 'India': 0.89, 'United States': 0.06, 'United Arab Emirates': 0.05 },
            audience_gender_age: {
                'F.18-24': 0.28,
                'F.25-34': 0.25,
                'F.35-44': 0.09,
                'M.18-24': 0.16,
                'M.25-34': 0.14,
                'M.35-44': 0.08
            }
        }
    };
}

module.exports = {
    collectFromMetaAPI,
    collectFromBenchmark
};
