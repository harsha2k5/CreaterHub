/**
 * CreaterHub - Geospatial & Multi-Factor Matching Service
 * Computes Haversine distance and calibrated match score between campaigns and creators.
 */

// Haversine spatial distance calculation in kilometers
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
        return null;
    }
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

/**
 * Calculates a 0-100% composite match score with itemized breakdown
 * Weights:
 * - Location: 25%
 * - Niche/Category: 25%
 * - Audience/Followers: 20%
 * - Engagement: 20%
 * - Budget/Suitability: 10%
 */
function calculateMatchScore(campaign, creator, instagramMetrics = null) {
    if (!campaign || !creator) {
        return {
            match_score: 50,
            distance_km: null,
            is_within_radius: false,
            breakdown: {},
            reasons: []
        };
    }

    const cLat = campaign.lat ?? 12.9716;
    const cLng = campaign.lng ?? 77.5946;
    const crLat = creator.lat ?? 12.9716;
    const crLng = creator.lng ?? 77.5946;

    const distanceKm = getHaversineDistance(cLat, cLng, crLat, crLng);
    const radius = Number(campaign.radius_km) || 10.0;
    const isWithinRadius = distanceKm !== null && distanceKm <= radius;

    const reasons = [];

    // 1. Location Match (25 Points)
    let locationScore = 5;
    if (distanceKm !== null) {
        if (distanceKm <= radius) {
            locationScore = 25;
            reasons.push(`Directly within campaign radius (${distanceKm} km vs ${radius} km radius)`);
        } else if (distanceKm <= radius * 1.5) {
            locationScore = 18;
            reasons.push(`In close vicinity to brand location (${distanceKm} km away)`);
        } else if (creator.city && campaign.city && creator.city.toLowerCase() === campaign.city.toLowerCase()) {
            locationScore = 14;
            reasons.push(`Same metropolitan area (${creator.city})`);
        } else {
            locationScore = 6;
            reasons.push(`Outside campaign target radius (${distanceKm} km away)`);
        }
    }

    // 2. Niche / Category Match (25 Points)
    let nicheScore = 6;
    const campCat = (campaign.category || '').toLowerCase();
    const reqCats = Array.isArray(campaign.req_categories) ? campaign.req_categories : [];
    const creatorCats = (Array.isArray(creator.categories) ? creator.categories : []).map(c => String(c).toLowerCase());

    const exactMatch = creatorCats.some(c => c.includes(campCat) || campCat.includes(c));
    const reqMatch = reqCats.some(rc => creatorCats.some(c => c.includes(String(rc).toLowerCase())));

    if (exactMatch || reqMatch) {
        nicheScore = 25;
        reasons.push(`High affinity for ${campaign.category} category`);
    } else if (creatorCats.includes('lifestyle') || creatorCats.includes('vlogs') || creatorCats.includes('culture')) {
        nicheScore = 17;
        reasons.push(`Complementary Lifestyle and Culture audience fit`);
    } else {
        nicheScore = 8;
        reasons.push(`Different creator niche`);
    }

    // 3. Audience / Follower Match (20 Points)
    let audienceScore = 8;
    const minFollowers = Number(campaign.min_followers) || 1000;
    const maxFollowers = Number(campaign.max_followers) || 500000;
    const creatorFollowers = Number(instagramMetrics?.followers_count || creator.followers || 0);

    if (creatorFollowers > 0) {
        if (creatorFollowers >= minFollowers && creatorFollowers <= maxFollowers) {
            audienceScore = 20;
            reasons.push(`Audience size (${creatorFollowers.toLocaleString()} followers) fits campaign bracket`);
        } else if (creatorFollowers >= minFollowers * 0.7 && creatorFollowers <= maxFollowers * 1.5) {
            audienceScore = 14;
            reasons.push(`Audience size close to target bracket`);
        } else {
            audienceScore = 7;
        }
    } else {
        audienceScore = 10; // Default when unauthenticated
    }

    // 4. Engagement Match (20 Points)
    let engagementScore = 10;
    const reqEngagement = Number(campaign.req_engagement) || 2.0;
    const creatorEngagement = Number(instagramMetrics?.engagement_rate || creator.engagement_rate || 0);

    if (creatorEngagement > 0) {
        if (creatorEngagement >= reqEngagement * 1.5) {
            engagementScore = 20;
            reasons.push(`Strong engagement rate (${creatorEngagement}% vs ${reqEngagement}% req)`);
        } else if (creatorEngagement >= reqEngagement) {
            engagementScore = 16;
            reasons.push(`Meets minimum engagement threshold (${creatorEngagement}%)`);
        } else {
            engagementScore = 8;
        }
    }

    // 5. Budget & Commercial Suitability (10 Points)
    let budgetScore = 8;
    const reward = Number(campaign.reward_per_creator) || 0;
    const minBudget = Number(creator.min_budget) || 0;

    if (reward >= minBudget && minBudget > 0) {
        budgetScore = 10;
        reasons.push(`Reward (₹${reward.toLocaleString()}) meets creator expectation`);
    } else if (reward > 0) {
        budgetScore = 7;
    }

    const totalScore = Math.min(100, Math.max(15, locationScore + nicheScore + audienceScore + engagementScore + budgetScore));

    return {
        match_score: totalScore,
        distance_km: distanceKm,
        is_within_radius: isWithinRadius,
        breakdown: {
            location: { score: locationScore, max: 25 },
            niche: { score: nicheScore, max: 25 },
            audience: { score: audienceScore, max: 20 },
            engagement: { score: engagementScore, max: 20 },
            budget: { score: budgetScore, max: 10 }
        },
        reasons
    };
}

module.exports = {
    getHaversineDistance,
    calculateMatchScore
};
