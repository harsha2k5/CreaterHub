const express = require('express');
const router = express.Router();
const { Campaign, Brand, Creator, Application, User, Notification } = require('../models/index.cjs');
const { authenticateToken, requireBrand, requireCreator } = require('../middleware/auth.cjs');

// Haversine spatial distance calculation in kilometers
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// GET /api/campaigns (Discovery & Location Filtering)
router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius, category, platform, min_reward, search } = req.query;

        const filter = { status: 'published' };

        if (category && category !== 'All') {
            filter.category = new RegExp(category, 'i');
        }

        if (platform && platform !== 'All') {
            filter.platform = new RegExp(platform, 'i');
        }

        if (min_reward) {
            filter.reward_per_creator = { $gte: Number(min_reward) };
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { location_name: searchRegex }
            ];
        }

        const rawCampaigns = await Campaign.find(filter).sort({ _id: -1 }).lean();

        // Fetch brands to populate brand metadata
        const brandIds = [...new Set(rawCampaigns.map(c => c.brand_id))];
        const brands = await Brand.find({ id: { $in: brandIds } }).lean();
        const brandMap = {};
        brands.forEach(b => { brandMap[b.id] = b; });

        // Process distance and Parse JSON/array fields safely
        const processed = rawCampaigns.map(c => {
            const brand = brandMap[c.brand_id] || {};
            let distanceKm = null;
            if (lat && lng) {
                distanceKm = parseFloat(getHaversineDistance(parseFloat(lat), parseFloat(lng), c.lat, c.lng).toFixed(1));
            } else {
                distanceKm = 2.4; // Default demo distance
            }

            let deliverables = [];
            let req_categories = [];
            try {
                deliverables = Array.isArray(c.deliverables) ? c.deliverables : (typeof c.deliverables === 'string' ? JSON.parse(c.deliverables) : (c.deliverables || []));
            } catch (e) {
                deliverables = [c.deliverables || '1 Reel'];
            }
            try {
                req_categories = Array.isArray(c.req_categories) ? c.req_categories : (typeof c.req_categories === 'string' ? JSON.parse(c.req_categories) : (c.req_categories || []));
            } catch (e) {
                req_categories = [c.category || 'General'];
            }

            return {
                ...c,
                brand_name: brand.company_name || 'Brand',
                brand_logo: brand.logo_url || '',
                brand_verified: brand.verified || 1,
                deliverables,
                req_categories,
                distanceKm,
                is_within_radius: radius ? distanceKm <= parseFloat(radius) : true
            };
        });

        // Filter by radius if requested
        const finalResults = radius
            ? processed.filter(c => c.is_within_radius)
            : processed;

        return res.json({ success: true, count: finalResults.length, campaigns: finalResults });
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        return res.status(500).json({ success: false, error: 'Error loading campaigns.' });
    }
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findOne({ id: req.params.id }).lean();

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }

        const brand = await Brand.findOne({ id: campaign.brand_id }).lean();
        if (brand) {
            campaign.brand_name = brand.company_name;
            campaign.brand_logo = brand.logo_url;
            campaign.brand_description = brand.description;
            campaign.brand_verified = brand.verified;
            campaign.brand_rating = brand.rating;
        }

        try {
            campaign.deliverables = Array.isArray(campaign.deliverables) ? campaign.deliverables : (typeof campaign.deliverables === 'string' ? JSON.parse(campaign.deliverables) : (campaign.deliverables || []));
        } catch (e) {
            campaign.deliverables = [campaign.deliverables || '1 Reel'];
        }
        try {
            campaign.req_categories = Array.isArray(campaign.req_categories) ? campaign.req_categories : (typeof campaign.req_categories === 'string' ? JSON.parse(campaign.req_categories) : (campaign.req_categories || []));
        } catch (e) {
            campaign.req_categories = [campaign.category || 'General'];
        }

        return res.json({ success: true, campaign });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching campaign details.' });
    }
});

// POST /api/campaigns (Brand Creates Campaign)
router.post('/', authenticateToken, requireBrand, async (req, res) => {
    try {
        const brand = await Brand.findOne({ user_id: req.user.id }).lean();
        if (!brand) {
            return res.status(400).json({ success: false, error: 'Brand profile required to create campaigns.' });
        }

        const {
            title, description, objective, category, location_name, outlet_name,
            address, city, state, pin_code, lat, lng, radius_km, min_followers,
            max_followers, req_categories, req_gender, req_language, req_engagement,
            platform, deliverables, budget_total, reward_per_creator, creators_required,
            payment_type, start_date, end_date, app_deadline, content_deadline,
            hashtags, mentions, guidelines, dos, donts
        } = req.body;

        if (!title || !description || !category || !location_name || !reward_per_creator || !creators_required) {
            return res.status(400).json({ success: false, error: 'Title, description, category, location, and budget fields are required.' });
        }

        const campaignId = 'camp_' + Date.now();

        await Campaign.create({
            id: campaignId,
            brand_id: brand.id,
            title,
            description,
            objective: objective || '',
            category,
            location_name,
            outlet_name: outlet_name || location_name || brand.company_name || 'Main Outlet',
            address: address || location_name || brand.address || brand.city || 'Bengaluru',
            city: city || brand.city || 'Bengaluru',
            state: state || brand.state || 'Karnataka',
            pin_code: pin_code || brand.pin_code || '',
            lat: lat || brand.lat || 12.9716,
            lng: lng || brand.lng || 77.5946,
            radius_km: radius_km || 10.0,
            min_followers: min_followers || 1000,
            max_followers: max_followers || 500000,
            req_categories: req_categories || [category],
            req_gender: req_gender || 'Any',
            req_language: req_language || 'English',
            req_engagement: req_engagement || 2.0,
            platform: platform || 'Instagram',
            deliverables: deliverables || ['1 Reel'],
            budget_total: budget_total || (reward_per_creator * creators_required),
            reward_per_creator,
            creators_required,
            creators_hired: 0,
            payment_type: payment_type || 'Fixed Payment',
            start_date: start_date || '2026-08-15',
            end_date: end_date || '2026-09-15',
            app_deadline: app_deadline || '2026-08-25',
            content_deadline: content_deadline || '2026-09-05',
            hashtags: hashtags || '',
            mentions: mentions || '',
            guidelines: guidelines || '',
            dos: dos || '',
            donts: donts || '',
            status: 'published'
        });

        return res.status(201).json({ success: true, message: 'Campaign created successfully!', campaignId });
    } catch (err) {
        console.error('Error creating campaign:', err);
        return res.status(500).json({ success: false, error: 'Failed to create campaign. ' + err.message });
    }
});

// POST /api/campaigns/:id/apply (Creator Submits Application)
router.post('/:id/apply', authenticateToken, requireCreator, async (req, res) => {
    try {
        let creator = await Creator.findOne({ user_id: req.user.id }).lean();
        if (!creator) {
            // Auto-create creator profile fallback
            const creatorId = 'creator_' + Date.now();
            const u = await User.findOne({ id: req.user.id }).lean();
            const uname = 'user_' + Math.floor(Math.random() * 10000);
            creator = await Creator.create({
                id: creatorId,
                user_id: req.user.id,
                full_name: u ? u.email.split('@')[0] : 'Creator Profile',
                username: uname,
                phone: '',
                location_name: 'Bengaluru',
                city: 'Bengaluru',
                state: 'Karnataka',
                bio: '',
                categories: ['Lifestyle'],
                languages: ['English'],
                verified: 1
            });
        }

        const campaignId = req.params.id;
        const campaign = await Campaign.findOne({ id: campaignId }).lean();

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }

        const existingApp = await Application.findOne({ campaign_id: campaignId, creator_id: creator.id });
        if (existingApp) {
            return res.status(400).json({ success: false, error: 'You have already applied to this campaign.' });
        }

        const { pitch, relevant_experience, content_idea, sample_links, expected_date } = req.body;

        if (!pitch || !content_idea) {
            return res.status(400).json({ success: false, error: 'Pitch and proposed content idea are required.' });
        }

        const appId = 'app_' + Date.now();

        await Application.create({
            id: appId,
            campaign_id: campaignId,
            creator_id: creator.id,
            pitch,
            relevant_experience: relevant_experience || '',
            content_idea,
            sample_links: sample_links || '',
            expected_date: expected_date || 'In 7 Days',
            status: 'submitted'
        });

        // Notify Brand user
        const brand = await Brand.findOne({ id: campaign.brand_id }).lean();
        if (brand) {
            await Notification.create({
                id: 'notif_' + Date.now(),
                user_id: brand.user_id,
                title: '📥 New Creator Application',
                message: `${creator.full_name} applied for "${campaign.title}"`,
                link: '/applications'
            });
        }

        return res.status(201).json({ success: true, message: 'Application submitted successfully!', applicationId: appId });
    } catch (err) {
        console.error('Error applying to campaign:', err);
        return res.status(500).json({ success: false, error: 'Application failed.' });
    }
});

module.exports = router;
