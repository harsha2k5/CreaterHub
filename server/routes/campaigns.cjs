const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
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
router.get('/', (req, res) => {
    try {
        const { lat, lng, radius, category, platform, min_reward, search, sort } = req.query;

        let query = `
            SELECT c.*, b.company_name AS brand_name, b.logo_url AS brand_logo, b.verified AS brand_verified
            FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE c.status = 'published'
        `;
        const params = [];

        if (category && category !== 'All') {
            query += ` AND c.category LIKE ?`;
            params.push(`%${category}%`);
        }

        if (platform && platform !== 'All') {
            query += ` AND c.platform LIKE ?`;
            params.push(`%${platform}%`);
        }

        if (min_reward) {
            query += ` AND c.reward_per_creator >= ?`;
            params.push(Number(min_reward));
        }

        if (search) {
            query += ` AND (c.title LIKE ? OR c.description LIKE ? OR c.location_name LIKE ? OR b.company_name LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY c.start_date DESC`;

        const campaigns = db.prepare(query).all(...params);

        // Process distance and Parse JSON fields
        const processed = campaigns.map(c => {
            let distanceKm = null;
            if (lat && lng) {
                distanceKm = parseFloat(getHaversineDistance(parseFloat(lat), parseFloat(lng), c.lat, c.lng).toFixed(1));
            } else {
                distanceKm = 2.4; // Default demo distance
            }

            return {
                ...c,
                deliverables: JSON.parse(c.deliverables || '[]'),
                req_categories: JSON.parse(c.req_categories || '[]'),
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
router.get('/:id', (req, res) => {
    try {
        const campaign = db.prepare(`
            SELECT c.*, b.company_name AS brand_name, b.logo_url AS brand_logo, b.description AS brand_description, b.verified AS brand_verified, b.rating AS brand_rating
            FROM campaigns c
            JOIN brands b ON c.brand_id = b.id
            WHERE c.id = ?
        `).get(req.params.id);

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }

        campaign.deliverables = JSON.parse(campaign.deliverables || '[]');
        campaign.req_categories = JSON.parse(campaign.req_categories || '[]');

        return res.json({ success: true, campaign });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching campaign details.' });
    }
});

// POST /api/campaigns (Brand Creates Campaign)
router.post('/', authenticateToken, requireBrand, (req, res) => {
    try {
        const brand = db.prepare('SELECT id FROM brands WHERE user_id = ?').get(req.user.id);
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

        db.prepare(`
            INSERT INTO campaigns (
                id, brand_id, title, description, objective, category, location_name, outlet_name,
                address, city, state, pin_code, lat, lng, radius_km, min_followers, max_followers,
                req_categories, req_gender, req_language, req_engagement, platform, deliverables,
                budget_total, reward_per_creator, creators_required, creators_hired, payment_type,
                start_date, end_date, app_deadline, content_deadline, hashtags, mentions, guidelines,
                dos, donts, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
        `).run(
            campaignId,
            brand.id,
            title,
            description,
            objective || '',
            category,
            location_name,
            outlet_name || location_name,
            address || '',
            city || 'Bengaluru',
            state || 'Karnataka',
            pin_code || '',
            lat || 12.9716,
            lng || 77.5946,
            radius_km || 10.0,
            min_followers || 1000,
            max_followers || 500000,
            JSON.stringify(req_categories || [category]),
            req_gender || 'Any',
            req_language || 'English',
            req_engagement || 2.0,
            platform || 'Instagram',
            JSON.stringify(deliverables || ['1 Reel']),
            budget_total || (reward_per_creator * creators_required),
            reward_per_creator,
            creators_required,
            payment_type || 'Fixed Payment',
            start_date || '2026-08-15',
            end_date || '2026-09-15',
            app_deadline || '2026-08-25',
            content_deadline || '2026-09-05',
            hashtags || '',
            mentions || '',
            guidelines || '',
            dos || '',
            donts || ''
        );

        return res.status(201).json({ success: true, message: 'Campaign created successfully!', campaignId });
    } catch (err) {
        console.error('Error creating campaign:', err);
        return res.status(500).json({ success: false, error: 'Failed to create campaign. ' + err.message });
    }
});

// POST /api/campaigns/:id/apply (Creator Submits Application)
router.post('/:id/apply', authenticateToken, requireCreator, (req, res) => {
    try {
        const creator = db.prepare('SELECT id, full_name FROM creators WHERE user_id = ?').get(req.user.id);
        if (!creator) {
            return res.status(400).json({ success: false, error: 'Creator profile required.' });
        }

        const campaignId = req.params.id;
        const campaign = db.prepare('SELECT id, brand_id, title FROM campaigns WHERE id = ?').get(campaignId);

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }

        const existingApp = db.prepare('SELECT id FROM applications WHERE campaign_id = ? AND creator_id = ?').get(campaignId, creator.id);
        if (existingApp) {
            return res.status(400).json({ success: false, error: 'You have already applied to this campaign.' });
        }

        const { pitch, relevant_experience, content_idea, sample_links, expected_date } = req.body;

        if (!pitch || !content_idea) {
            return res.status(400).json({ success: false, error: 'Pitch and proposed content idea are required.' });
        }

        const appId = 'app_' + Date.now();

        db.prepare(`
            INSERT INTO applications (id, campaign_id, creator_id, pitch, relevant_experience, content_idea, sample_links, expected_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
        `).run(
            appId,
            campaignId,
            creator.id,
            pitch,
            relevant_experience || '',
            content_idea,
            sample_links || '',
            expected_date || 'In 7 Days'
        );

        // Notify Brand user
        const brandUser = db.prepare('SELECT user_id FROM brands WHERE id = ?').get(campaign.brand_id);
        if (brandUser) {
            db.prepare(`
                INSERT INTO notifications (id, user_id, title, message, link)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                'notif_' + Date.now(),
                brandUser.user_id,
                '📥 New Creator Application',
                `${creator.full_name} applied for "${campaign.title}"`,
                '/applications'
            );
        }

        return res.status(201).json({ success: true, message: 'Application submitted successfully!', applicationId: appId });
    } catch (err) {
        console.error('Error applying to campaign:', err);
        return res.status(500).json({ success: false, error: 'Application failed.' });
    }
});

module.exports = router;
