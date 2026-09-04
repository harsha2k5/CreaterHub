const assert = require('assert');
const { getHaversineDistance, calculateMatchScore } = require('../services/MatchingService.cjs');

async function testCampaignMatching() {
    console.log('🧪 Running Test: Haversine Geospatial Calculation & Matching Engine...');

    // 1. Haversine Distance Test (Indiranagar to Koramangala in Bengaluru is ~5.2 km)
    const indiranagar = { lat: 12.9784, lng: 77.6408 };
    const koramangala = { lat: 12.9352, lng: 77.6245 };
    const dist = getHaversineDistance(indiranagar.lat, indiranagar.lng, koramangala.lat, koramangala.lng);

    console.log(`  Distance between Indiranagar and Koramangala: ${dist} km`);
    assert(dist >= 4.5 && dist <= 6.0, `Expected distance ~5.2 km, got ${dist}`);

    // Distance to same point is 0 km
    const zeroDist = getHaversineDistance(indiranagar.lat, indiranagar.lng, indiranagar.lat, indiranagar.lng);
    assert.strictEqual(zeroDist, 0, 'Distance to same coordinate must be 0 km');

    // 2. Creator-Brand Match Score Test
    const campaign = {
        lat: 12.9784,
        lng: 77.6408,
        radius_km: 10,
        category: 'Food & Beverage',
        min_followers: 1000,
        max_followers: 50000,
        req_engagement: 2.0,
        reward_per_creator: 6000
    };

    const nearbyFoodCreator = {
        lat: 12.9719,
        lng: 77.6412,
        categories: ['Food & Dining', 'Coffee', 'Lifestyle'],
        city: 'Bengaluru',
        min_budget: 4000
    };

    const metrics = {
        followers_count: 8500,
        engagement_rate: 3.8
    };

    const highMatch = calculateMatchScore(campaign, nearbyFoodCreator, metrics);
    console.log(`  High match score calculated: ${highMatch.match_score}%`);
    assert(highMatch.match_score >= 80, `Expected high match score >= 80%, got ${highMatch.match_score}%`);
    assert.strictEqual(highMatch.is_within_radius, true, 'Nearby creator must be within 10km radius');

    // 3. Test Distant Creator
    const distantTechCreator = {
        lat: 19.0760, // Mumbai coordinates
        lng: 72.8777,
        categories: ['Technology', 'Gadgets'],
        city: 'Mumbai',
        min_budget: 15000
    };

    const lowMatch = calculateMatchScore(campaign, distantTechCreator, { followers_count: 500, engagement_rate: 1.0 });
    console.log(`  Distant tech creator match score: ${lowMatch.match_score}%`);
    assert(lowMatch.match_score < 50, `Expected low match score < 50%, got ${lowMatch.match_score}%`);
    assert.strictEqual(lowMatch.is_within_radius, false, 'Mumbai creator must not be within Bengaluru radius');

    console.log('✅ Haversine Calculation & Creator Matching Engine Test Passed!');
}

if (require.main === module) {
    testCampaignMatching().catch(err => {
        console.error('❌ Matching test failed:', err);
        process.exit(1);
    });
}

module.exports = testCampaignMatching;
