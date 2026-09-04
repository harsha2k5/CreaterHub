const express = require('express');
const router = express.Router();
const { query, queryOne, run, transaction } = require('../db/database.cjs');
const { authenticateToken, requireCreator, requireBrand } = require('../middleware/auth.cjs');
const { calculateMatchScore } = require('../services/MatchingService.cjs');

function generateId(prefix = 'app') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// POST /api/applications/apply - Creator applies to campaign
router.post('/apply', authenticateToken, requireCreator, async (req, res) => {
    try {
        const creator = queryOne('SELECT * FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(403).json({ success: false, error: 'Creator profile not found.' });

        const {
            campaign_id,
            pitch,
            relevant_experience,
            content_idea,
            sample_links,
            proposed_budget,
            proposed_deliverables,
            availability = 'immediate'
        } = req.body;

        if (!campaign_id || !pitch) {
            return res.status(400).json({ success: false, error: 'Campaign ID and pitch are required.' });
        }

        const campaign = queryOne('SELECT * FROM campaigns WHERE id = ?', [campaign_id]);
        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }

        if (campaign.status !== 'PUBLISHED' && campaign.status !== 'APPLICATIONS_OPEN') {
            return res.status(400).json({ success: false, error: 'This campaign is no longer accepting applications.' });
        }

        // Check if already applied
        const existing = queryOne(
            'SELECT id FROM campaign_applications WHERE campaign_id = ? AND creator_id = ?',
            [campaign_id, creator.id]
        );
        if (existing) {
            return res.status(409).json({ success: false, error: 'You have already applied to this campaign.' });
        }

        const appId = generateId('app');
        run(
            `INSERT INTO campaign_applications (
                id, campaign_id, creator_id, brand_id, pitch,
                relevant_experience, content_idea, sample_links,
                proposed_budget, proposed_deliverables, availability, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [
                appId, campaign.id, creator.id, campaign.brand_id, pitch.trim(),
                relevant_experience || '', content_idea || '', sample_links || '',
                proposed_budget ? Number(proposed_budget) : campaign.reward_per_creator,
                proposed_deliverables || '', availability
            ]
        );

        // Create notification for brand
        const brandUser = queryOne('SELECT user_id FROM brand_profiles WHERE id = ?', [campaign.brand_id]);
        if (brandUser) {
            run(
                `INSERT INTO notifications (id, user_id, title, message, link)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    generateId('notif'),
                    brandUser.user_id,
                    'New Creator Application',
                    `${creator.full_name} applied to "${campaign.title}"`,
                    `/brand/applications`
                ]
            );
        }

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully.',
            application_id: appId
        });
    } catch (err) {
        console.error('Error applying to campaign:', err);
        return res.status(500).json({ success: false, error: 'Failed to submit application: ' + err.message });
    }
});

// GET /api/applications - List applications (role-aware)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'creator') {
            const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
            if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

            const apps = query(`
                SELECT a.*, c.title as campaign_title, c.category as campaign_category,
                       c.reward_per_creator, c.image_url as campaign_image,
                       b.company_name as brand_name, b.logo_url as brand_logo
                FROM campaign_applications a
                JOIN campaigns c ON a.campaign_id = c.id
                JOIN brand_profiles b ON a.brand_id = b.id
                WHERE a.creator_id = ?
                ORDER BY a.applied_at DESC
            `, [creator.id]);

            return res.json({ success: true, count: apps.length, applications: apps });
        } else if (req.user.role === 'brand') {
            const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
            if (!brand) return res.status(404).json({ success: false, error: 'Brand not found.' });

            const { campaign_id, status } = req.query;
            let sql = `
                SELECT a.*, c.title as campaign_title, c.reward_per_creator, c.lat as campaign_lat, c.lng as campaign_lng,
                       cr.full_name as creator_name, cr.username as creator_username,
                       cr.avatar_url as creator_avatar, cr.city as creator_city, cr.area as creator_area,
                       cr.categories_json as creator_categories, cr.lat as creator_lat, cr.lng as creator_lng,
                       COALESCE(i.followers_count, 0) as ig_followers,
                       COALESCE(i.engagement_rate, 0.0) as ig_engagement,
                       ai.overall_score as ai_score
                FROM campaign_applications a
                JOIN campaigns c ON a.campaign_id = c.id
                JOIN creator_profiles cr ON a.creator_id = cr.id
                LEFT JOIN instagram_accounts ia ON cr.id = ia.creator_id AND ia.is_connected = 1
                LEFT JOIN instagram_metrics i ON ia.id = i.instagram_account_id
                LEFT JOIN ai_creator_analyses ai ON cr.id = ai.creator_id
                WHERE a.brand_id = ?
            `;
            const params = [brand.id];

            if (campaign_id) {
                sql += ` AND a.campaign_id = ?`;
                params.push(campaign_id);
            }
            if (status) {
                sql += ` AND a.status = ?`;
                params.push(status);
            }

            sql += ` ORDER BY a.applied_at DESC`;

            const apps = query(sql, params);

            const enriched = apps.map(app => {
                let categories = [];
                try { categories = JSON.parse(app.creator_categories || '[]'); } catch {}
                const campaignStub = {
                    lat: app.campaign_lat,
                    lng: app.campaign_lng,
                    radius_km: 10
                };
                const creatorStub = {
                    lat: app.creator_lat,
                    lng: app.creator_lng,
                    categories
                };
                const metrics = {
                    followers_count: app.ig_followers,
                    engagement_rate: app.ig_engagement
                };
                const match = calculateMatchScore(campaignStub, creatorStub, metrics);

                return {
                    ...app,
                    creator_categories: categories,
                    match_score: match.match_score,
                    distance_km: match.distance_km
                };
            });

            return res.json({ success: true, count: enriched.length, applications: enriched });
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized role.' });
        }
    } catch (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve applications.' });
    }
});

// PATCH /api/applications/:id/status - Brand accepts, shortlists, or rejects an application
router.patch('/:id/status', authenticateToken, requireBrand, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACCEPTED' | 'SHORTLISTED' | 'REJECTED'

        if (!['ACCEPTED', 'SHORTLISTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status. Must be ACCEPTED, SHORTLISTED, or REJECTED.' });
        }

        const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(403).json({ success: false, error: 'Unauthorized.' });

        const app = queryOne('SELECT * FROM campaign_applications WHERE id = ? AND brand_id = ?', [id, brand.id]);
        if (!app) return res.status(404).json({ success: false, error: 'Application not found or unauthorized.' });

        transaction(() => {
            run('UPDATE campaign_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

            if (status === 'ACCEPTED') {
                // Check if collaboration already exists
                const existingCollab = queryOne('SELECT id FROM collaborations WHERE application_id = ?', [id]);
                let collabId = existingCollab?.id;

                if (!existingCollab) {
                    collabId = generateId('collab');
                    run(
                        `INSERT INTO collaborations (id, campaign_id, application_id, brand_id, creator_id, status, current_step)
                         VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1)`,
                        [collabId, app.campaign_id, app.id, brand.id, app.creator_id]
                    );

                    // Increment hired count
                    run('UPDATE campaigns SET creators_hired = creators_hired + 1 WHERE id = ?', [app.campaign_id]);

                    // Initialize simulated escrow payment record
                    const campaign = queryOne('SELECT reward_per_creator, title FROM campaigns WHERE id = ?', [app.campaign_id]);
                    const amount = app.proposed_budget || campaign?.reward_per_creator || 5000;
                    run(
                        `INSERT INTO payments (id, collaboration_id, brand_id, creator_id, amount, status, is_simulated, transaction_ref)
                         VALUES (?, ?, ?, ?, ?, 'HELD_IN_ESCROW', 1, ?)`,
                        [generateId('pay'), collabId, brand.id, app.creator_id, amount, 'TXN_ESCROW_' + Date.now()]
                    );

                    // Initialize conversation if not already present
                    const existingConv = queryOne('SELECT id FROM conversations WHERE brand_id = ? AND creator_id = ?', [brand.id, app.creator_id]);
                    if (!existingConv) {
                        const convId = generateId('conv');
                        run(
                            `INSERT INTO conversations (id, brand_id, creator_id, campaign_id, last_message)
                             VALUES (?, ?, ?, ?, ?)`,
                            [convId, brand.id, app.creator_id, app.campaign_id, `Congratulations! Your application to "${campaign?.title || 'the campaign'}" has been accepted.`]
                        );

                        run(
                            `INSERT INTO messages (id, conversation_id, sender_id, text, read_status)
                             VALUES (?, ?, ?, ?, 0)`,
                            [generateId('msg'), convId, req.user.id, `Congratulations! Your application to "${campaign?.title || 'the campaign'}" has been accepted.`]
                        );
                    }
                }

                // Notify creator
                const creatorUser = queryOne('SELECT user_id FROM creator_profiles WHERE id = ?', [app.creator_id]);
                if (creatorUser) {
                    run(
                        `INSERT INTO notifications (id, user_id, title, message, link)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            generateId('notif'),
                            creatorUser.user_id,
                            'Application Accepted! 🎉',
                            `Your application has been accepted! You can now begin work on your deliverables.`,
                            `/creator/collaborations`
                        ]
                    );
                }
            }
        });

        return res.json({ success: true, message: `Application status updated to ${status}.` });
    } catch (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ success: false, error: 'Failed to update application status: ' + err.message });
    }
});

module.exports = router;
