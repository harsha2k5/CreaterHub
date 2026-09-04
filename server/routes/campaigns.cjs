const express = require('express');
const router = express.Router();
const { query, queryOne, run, transaction } = require('../db/database.cjs');
const { authenticateToken, requireBrand } = require('../middleware/auth.cjs');
const { getHaversineDistance, calculateMatchScore } = require('../services/MatchingService.cjs');

function generateId(prefix = 'cmp') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// Parse campaign row helper
function formatCampaign(c, creatorLocation = null) {
    let deliverables = [];
    try {
        deliverables = JSON.parse(c.deliverables_json || '[]');
    } catch {
        deliverables = [];
    }

    let reqCategories = [];
    try {
        reqCategories = JSON.parse(c.req_categories_json || '[]');
    } catch {
        reqCategories = [];
    }

    let distanceKm = null;
    let isWithinRadius = true;

    if (creatorLocation && creatorLocation.lat && creatorLocation.lng) {
        distanceKm = getHaversineDistance(
            Number(c.lat), Number(c.lng),
            Number(creatorLocation.lat), Number(creatorLocation.lng)
        );
        if (distanceKm !== null && c.radius_km) {
            isWithinRadius = distanceKm <= Number(c.radius_km);
        }
    }

    return {
        id: c.id,
        brand_id: c.brand_id,
        brand_name: c.company_name,
        brand_logo: c.logo_url,
        brand_category: c.brand_category,
        brand_verified: Boolean(c.brand_verified),
        title: c.title,
        description: c.description,
        objective: c.objective,
        category: c.category,
        image_url: c.image_url,
        location_name: c.location_name,
        address: c.address,
        city: c.city,
        state: c.state,
        lat: c.lat,
        lng: c.lng,
        radius_km: c.radius_km,
        min_followers: c.min_followers,
        max_followers: c.max_followers,
        req_categories: reqCategories,
        req_engagement: c.req_engagement,
        deliverables,
        budget_total: c.budget_total,
        reward_per_creator: c.reward_per_creator,
        creators_required: c.creators_required,
        creators_hired: c.creators_hired || 0,
        platform: c.platform,
        start_date: c.start_date,
        end_date: c.end_date,
        app_deadline: c.app_deadline,
        status: c.status,
        distance_km: distanceKm,
        is_within_radius: isWithinRadius,
        created_at: c.created_at
    };
}

// GET /api/campaigns - Public / Filterable Campaign Feed
router.get('/', async (req, res) => {
    try {
        const {
            category,
            city,
            radius,
            lat,
            lng,
            search,
            min_reward,
            status = 'PUBLISHED',
            brand_id,
            limit = 50,
            page = 1
        } = req.query;

        let sql = `
            SELECT c.*, b.company_name, b.logo_url, b.category as brand_category, b.verified as brand_verified
            FROM campaigns c
            JOIN brand_profiles b ON c.brand_id = b.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'ALL') {
            sql += ` AND c.status = ?`;
            params.push(status);
        }

        if (brand_id) {
            sql += ` AND c.brand_id = ?`;
            params.push(brand_id);
        }

        if (category && category !== 'All') {
            sql += ` AND (c.category LIKE ? OR c.req_categories_json LIKE ?)`;
            params.push(`%${category}%`, `%${category}%`);
        }

        if (city && city !== 'All') {
            sql += ` AND c.city LIKE ?`;
            params.push(`%${city}%`);
        }

        if (min_reward) {
            sql += ` AND c.reward_per_creator >= ?`;
            params.push(Number(min_reward));
        }

        if (search) {
            sql += ` AND (c.title LIKE ? OR c.description LIKE ? OR b.company_name LIKE ? OR c.location_name LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        sql += ` ORDER BY c.created_at DESC`;

        const rows = query(sql, params);

        let creatorLocation = null;
        if (lat && lng) {
            creatorLocation = { lat: Number(lat), lng: Number(lng) };
        }

        let formatted = rows.map(r => formatCampaign(r, creatorLocation));

        // Filter by radius if requested and coordinates provided
        if (creatorLocation && radius && radius !== 'all') {
            const maxDist = Number(radius);
            if (!isNaN(maxDist) && maxDist > 0) {
                formatted = formatted.filter(f => f.distance_km === null || f.distance_km <= maxDist);
            }
        }

        // Sort by distance if location provided
        if (creatorLocation) {
            formatted.sort((a, b) => {
                if (a.distance_km === null) return 1;
                if (b.distance_km === null) return -1;
                return a.distance_km - b.distance_km;
            });
        }

        const total = formatted.length;
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 50;
        const paginated = formatted.slice((pageNum - 1) * pageSize, pageNum * pageSize);

        return res.json({
            success: true,
            count: total,
            campaigns: paginated
        });
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch campaigns: ' + err.message });
    }
});

// GET /api/campaigns/:id - Detailed Campaign View
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const row = queryOne(`
            SELECT c.*, b.company_name, b.logo_url, b.category as brand_category, b.verified as brand_verified,
                   b.description as brand_desc, b.website as brand_website, b.address as brand_address,
                   b.business_email
            FROM campaigns c
            JOIN brand_profiles b ON c.brand_id = b.id
            WHERE c.id = ?
        `, [id]);

        if (!row) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }

        // Check applicant count
        const appCountRow = queryOne('SELECT COUNT(*) as count FROM campaign_applications WHERE campaign_id = ?', [id]);
        const applicantCount = appCountRow ? appCountRow.count : 0;

        const campaign = formatCampaign(row);
        campaign.applicant_count = applicantCount;
        campaign.brand = {
            id: row.brand_id,
            company_name: row.company_name,
            logo_url: row.logo_url,
            category: row.brand_category,
            description: row.brand_desc,
            website: row.brand_website,
            address: row.brand_address,
            verified: Boolean(row.brand_verified)
        };

        return res.json({ success: true, campaign });
    } catch (err) {
        console.error('Error fetching campaign detail:', err);
        return res.status(500).json({ success: false, error: 'Failed to load campaign.' });
    }
});

// POST /api/campaigns - Brand Creates Campaign
router.post('/', authenticateToken, requireBrand, async (req, res) => {
    try {
        const brand = queryOne('SELECT * FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) {
            return res.status(403).json({ success: false, error: 'Brand profile not found.' });
        }

        const {
            title,
            description,
            objective,
            category,
            image_url,
            location_name,
            address,
            city,
            lat,
            lng,
            radius_km,
            min_followers,
            max_followers,
            req_categories,
            req_engagement,
            deliverables,
            budget_total,
            reward_per_creator,
            creators_required,
            platform = 'Instagram',
            start_date,
            end_date,
            app_deadline
        } = req.body;

        if (!title || !description || !category || !reward_per_creator || !creators_required) {
            return res.status(400).json({
                success: false,
                error: 'Title, description, category, reward per creator, and creators required are mandatory.'
            });
        }

        const campaignId = generateId('cmp');
        const numCreators = Number(creators_required) || 1;
        const reward = Number(reward_per_creator) || 5000;
        const totalBudget = Number(budget_total) || (reward * numCreators);

        const deliverablesJson = JSON.stringify(Array.isArray(deliverables) && deliverables.length > 0 ? deliverables : [
            { type: 'Reel', count: 1, requirement: '1x 30s High Quality Video Reel' },
            { type: 'Story', count: 2, requirement: '2x Stories with outlet tag' }
        ]);

        const reqCategoriesJson = JSON.stringify(Array.isArray(req_categories) ? req_categories : [category]);

        run(
            `INSERT INTO campaigns (
                id, brand_id, title, description, objective, category, image_url,
                location_name, address, city, lat, lng, radius_km,
                min_followers, max_followers, req_categories_json, req_engagement,
                deliverables_json, budget_total, reward_per_creator, creators_required,
                platform, start_date, end_date, app_deadline, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
            [
                campaignId, brand.id, title.trim(), description.trim(), objective || '',
                category, image_url || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800',
                location_name || brand.location_name || city || 'Bengaluru',
                address || brand.address || '',
                city || brand.city || 'Bengaluru',
                Number(lat) || brand.lat || 12.9716,
                Number(lng) || brand.lng || 77.5946,
                Number(radius_km) || 10.0,
                Number(min_followers) || 1000,
                Number(max_followers) || 500000,
                reqCategoriesJson,
                Number(req_engagement) || 2.0,
                deliverablesJson,
                totalBudget,
                reward,
                numCreators,
                platform,
                start_date || new Date().toISOString().split('T')[0],
                end_date || '',
                app_deadline || ''
            ]
        );

        const newCampaign = queryOne('SELECT * FROM campaigns WHERE id = ?', [campaignId]);

        return res.status(201).json({
            success: true,
            message: 'Campaign created successfully.',
            campaign: formatCampaign(newCampaign)
        });
    } catch (err) {
        console.error('Error creating campaign:', err);
        return res.status(500).json({ success: false, error: 'Failed to create campaign: ' + err.message });
    }
});

// PATCH /api/campaigns/:id/status - Update campaign state (DRAFT, PUBLISHED, PAUSED, COMPLETED)
router.patch('/:id/status', authenticateToken, requireBrand, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(403).json({ success: false, error: 'Unauthorized.' });

        const campaign = queryOne('SELECT * FROM campaigns WHERE id = ? AND brand_id = ?', [id, brand.id]);
        if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found or unauthorized.' });

        run('UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

        return res.json({ success: true, message: `Campaign status updated to ${status}.` });
    } catch (err) {
        console.error('Error updating campaign status:', err);
        return res.status(500).json({ success: false, error: 'Failed to update campaign status.' });
    }
});

// GET /api/campaigns/:id/matches - Find & Score Creators for this campaign
router.get('/:id/matches', authenticateToken, requireBrand, async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = queryOne('SELECT * FROM campaigns WHERE id = ?', [id]);
        if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found.' });

        // Retrieve creators with active profile
        const creators = query(`
            SELECT c.*, u.email,
                   COALESCE(i.followers_count, 0) as ig_followers,
                   COALESCE(i.engagement_rate, 0.0) as ig_engagement,
                   COALESCE(i.media_count, 0) as ig_posts,
                   COALESCE(i.source, 'UNVERIFIED') as ig_source,
                   a.overall_score as ai_score
            FROM creator_profiles c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN instagram_accounts ia ON c.id = ia.creator_id AND ia.is_connected = 1
            LEFT JOIN instagram_metrics i ON ia.id = i.instagram_account_id
            LEFT JOIN ai_creator_analyses a ON c.id = a.creator_id
            WHERE u.is_active = 1
        `);

        const scored = creators.map(cr => {
            cr.categories = JSON.parse(cr.categories_json || '[]');
            const metrics = {
                followers_count: cr.ig_followers,
                engagement_rate: cr.ig_engagement,
                media_count: cr.ig_posts
            };
            const matchResult = calculateMatchScore(campaign, cr, metrics);
            return {
                creator_id: cr.id,
                full_name: cr.full_name,
                username: cr.username,
                avatar_url: cr.avatar_url,
                city: cr.city,
                area: cr.area,
                categories: cr.categories,
                followers: cr.ig_followers,
                engagement_rate: cr.ig_engagement,
                ai_score: cr.ai_score,
                is_instagram_connected: cr.ig_source !== 'UNVERIFIED',
                match_score: matchResult.match_score,
                distance_km: matchResult.distance_km,
                is_within_radius: matchResult.is_within_radius,
                breakdown: matchResult.breakdown,
                reasons: matchResult.reasons
            };
        });

        scored.sort((a, b) => b.match_score - a.match_score);

        return res.json({ success: true, count: scored.length, matches: scored });
    } catch (err) {
        console.error('Error finding creator matches:', err);
        return res.status(500).json({ success: false, error: 'Failed to compute matches.' });
    }
});

module.exports = router;
