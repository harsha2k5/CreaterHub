const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database.cjs');
const { authenticateToken, requireCreator, requireBrand } = require('../middleware/auth.cjs');

function formatCreator(c) {
    let categories = [];
    let languages = [];
    let rateCard = { reel: 6500, story: 2500, post: 4000, combo: 11000 };

    try { categories = JSON.parse(c.categories_json || '[]'); } catch {}
    try { languages = JSON.parse(c.languages_json || '[]'); } catch {}
    try { rateCard = JSON.parse(c.rate_card_json || '{}'); } catch {}

    const isConnected = Boolean(c.ig_connected && c.ig_connected === 1);

    return {
        id: c.id,
        user_id: c.user_id,
        full_name: c.full_name,
        username: c.username,
        city: c.city,
        area: c.area,
        lat: c.lat,
        lng: c.lng,
        bio: c.bio,
        avatar_url: c.avatar_url,
        categories,
        languages,
        min_budget: c.min_budget,
        radius_km: c.radius_km,
        rate_card: rateCard,
        availability: c.availability || 'available',
        verified: Boolean(c.verified),
        subscription_tier: c.subscription_tier || 'free',
        subscription_expires_at: c.subscription_expires_at || null,
        instagram: {
            is_connected: isConnected,
            username: isConnected ? c.ig_username : null,
            followers_count: isConnected ? (c.ig_followers || 0) : null,
            following_count: isConnected ? (c.ig_following || 0) : null,
            media_count: isConnected ? (c.ig_media_count || 0) : null,
            engagement_rate: isConnected ? (c.ig_engagement_rate || 0) : null,
            source: isConnected ? 'LIVE_API' : 'NOT_CONNECTED',
            last_synced_at: isConnected ? c.ig_synced_at : null
        },
        ai_score: c.ai_overall_score || null
    };
}

// GET /api/creators - Search / Directory
router.get('/', async (req, res) => {
    try {
        const { category, city, search, sort = 'followers', limit = 50, page = 1 } = req.query;

        let sql = `
            SELECT c.*,
                   ia.is_connected as ig_connected, ia.username as ig_username, ia.last_synced_at as ig_synced_at,
                   im.followers_count as ig_followers, im.follows_count as ig_following,
                   im.media_count as ig_media_count, im.engagement_rate as ig_engagement_rate,
                   ai.overall_score as ai_overall_score
            FROM creator_profiles c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN instagram_accounts ia ON c.id = ia.creator_id AND ia.is_connected = 1
            LEFT JOIN (
                SELECT m1.instagram_account_id, m1.followers_count,
                       COALESCE(m1.following_count, m1.follows_count) as follows_count,
                       m1.media_count, m1.engagement_rate
                FROM instagram_metrics m1
                WHERE m1.rowid = (
                    SELECT m2.rowid FROM instagram_metrics m2
                    WHERE m2.instagram_account_id = m1.instagram_account_id
                    ORDER BY datetime(m2.recorded_at) DESC, m2.rowid DESC
                    LIMIT 1
                )
            ) im ON ia.id = im.instagram_account_id
            LEFT JOIN ai_creator_analyses ai ON c.id = ai.creator_id
            WHERE u.is_active = 1
        `;
        const params = [];

        if (category && category !== 'All') {
            sql += ` AND c.categories_json LIKE ?`;
            params.push(`%${category}%`);
        }

        if (city && city !== 'All') {
            sql += ` AND c.city LIKE ?`;
            params.push(`%${city}%`);
        }

        if (search) {
            sql += ` AND (c.full_name LIKE ? OR c.username LIKE ? OR c.bio LIKE ? OR c.area LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        const rows = query(sql, params);
        let formatted = rows.map(formatCreator);

        // Sorting
        if (sort === 'engagement') {
            formatted.sort((a, b) => (b.instagram.engagement_rate || 0) - (a.instagram.engagement_rate || 0));
        } else if (sort === 'score') {
            formatted.sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));
        } else {
            formatted.sort((a, b) => (b.instagram.followers_count || 0) - (a.instagram.followers_count || 0));
        }

        const total = formatted.length;
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 50;
        const paginated = formatted.slice((pageNum - 1) * pageSize, pageNum * pageSize);

        return res.json({ success: true, count: total, creators: paginated });
    } catch (err) {
        console.error('Error querying creators:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve creators.' });
    }
});

// GET /api/creators/:id - Public Creator Profile View
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const row = queryOne(`
            SELECT c.*,
                   ia.is_connected as ig_connected, ia.username as ig_username, ia.last_synced_at as ig_synced_at,
                   im.followers_count as ig_followers, im.follows_count as ig_following,
                   im.media_count as ig_media_count, im.engagement_rate as ig_engagement_rate,
                   ai.overall_score as ai_overall_score, ai.summary as ai_summary,
                   ai.strengths_json, ai.recommendations_json
            FROM creator_profiles c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN instagram_accounts ia ON c.id = ia.creator_id AND ia.is_connected = 1
            LEFT JOIN (
                SELECT m1.instagram_account_id, m1.followers_count,
                       COALESCE(m1.following_count, m1.follows_count) as follows_count,
                       m1.media_count, m1.engagement_rate
                FROM instagram_metrics m1
                WHERE m1.rowid = (
                    SELECT m2.rowid FROM instagram_metrics m2
                    WHERE m2.instagram_account_id = m1.instagram_account_id
                    ORDER BY datetime(m2.recorded_at) DESC, m2.rowid DESC
                    LIMIT 1
                )
            ) im ON ia.id = im.instagram_account_id
            LEFT JOIN ai_creator_analyses ai ON c.id = ai.creator_id
            WHERE c.id = ? AND u.is_active = 1
        `, [id]);

        if (!row) {
            return res.status(404).json({ success: false, error: 'Creator not found.' });
        }

        const creator = formatCreator(row);

        // Fetch recent reviews
        const reviews = query(`
            SELECT r.*, u.email as reviewer_email, b.company_name as reviewer_brand
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            LEFT JOIN brand_profiles b ON u.id = b.user_id
            WHERE r.reviewee_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [row.user_id]);

        // Fetch completed collaborations count
        const completedCount = queryOne(
            "SELECT COUNT(*) as count FROM collaborations WHERE creator_id = ? AND status = 'COMPLETED'",
            [id]
        )?.count || 0;

        return res.json({
            success: true,
            creator: {
                ...creator,
                completed_campaigns: completedCount,
                reviews,
                ai_analysis: row.ai_overall_score ? {
                    overall_score: row.ai_overall_score,
                    summary: row.ai_summary,
                    strengths: JSON.parse(row.strengths_json || '[]'),
                    recommendations: JSON.parse(row.recommendations_json || '[]')
                } : null
            }
        });
    } catch (err) {
        console.error('Error fetching creator detail:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve creator profile.' });
    }
});

// POST /api/creators/profile - Update Creator Profile
router.post('/profile', authenticateToken, requireCreator, async (req, res) => {
    try {
        const {
            full_name,
            bio,
            avatar_url,
            city,
            area,
            categories,
            languages,
            min_budget,
            rate_card
        } = req.body;

        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        run(
            `UPDATE creator_profiles
             SET full_name = COALESCE(?, full_name),
                 bio = COALESCE(?, bio),
                 avatar_url = COALESCE(?, avatar_url),
                 city = COALESCE(?, city),
                 area = COALESCE(?, area),
                 categories_json = COALESCE(?, categories_json),
                 languages_json = COALESCE(?, languages_json),
                 min_budget = COALESCE(?, min_budget),
                 rate_card_json = COALESCE(?, rate_card_json),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                full_name,
                bio,
                avatar_url,
                city,
                area,
                categories ? JSON.stringify(categories) : null,
                languages ? JSON.stringify(languages) : null,
                min_budget ? Number(min_budget) : null,
                rate_card ? JSON.stringify(rate_card) : null,
                creator.id
            ]
        );

        return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Error updating creator profile:', err);
        return res.status(500).json({ success: false, error: 'Failed to update profile: ' + err.message });
    }
});

// POST /api/creators/:id/pitch - Brand sends a direct pitch to creator
router.post('/:id/pitch', authenticateToken, requireBrand, async (req, res) => {
    try {
        const { id } = req.params;
        const pitchText = (req.body.pitch || req.body.message || '').trim();
        const campaignId = req.body.campaign_id || null;
        let customTitle = (req.body.custom_title || '').trim();
        let proposedBudget = Number(req.body.custom_budget || req.body.proposed_budget || req.body.budget || 0);
        let deliverables = (req.body.custom_deliverables || req.body.deliverables || '').trim();

        if (!pitchText) {
            return res.status(400).json({ success: false, error: 'A pitch message is required.' });
        }

        const brand = queryOne('SELECT * FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(403).json({ success: false, error: 'Brand profile not found.' });

        const creator = queryOne('SELECT * FROM creator_profiles WHERE id = ?', [id]);
        if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

        // If campaign_id is provided, look up campaign details
        let campaign = null;
        if (campaignId) {
            campaign = queryOne('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
            if (campaign) {
                if (!customTitle) customTitle = campaign.title;
                if (!proposedBudget) proposedBudget = Number(campaign.reward_per_creator || 5000);
                if (!deliverables) {
                    try {
                        const parsed = JSON.parse(campaign.deliverables_json || '[]');
                        deliverables = Array.isArray(parsed) && parsed.length > 0 ? parsed.join(', ') : 'Reel + Story';
                    } catch {
                        deliverables = 'Reel + Story';
                    }
                }

                // If not already in campaign_applications, add as SHORTLISTED invitation
                const existingApp = queryOne(
                    'SELECT id FROM campaign_applications WHERE campaign_id = ? AND creator_id = ?',
                    [campaign.id, creator.id]
                );
                if (!existingApp) {
                    run(
                        `INSERT INTO campaign_applications (
                            id, campaign_id, creator_id, brand_id, pitch,
                            proposed_budget, proposed_deliverables, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SHORTLISTED')`,
                        [
                            `app_pitch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            campaign.id,
                            creator.id,
                            brand.id,
                            `Direct Brand Pitch: ${pitchText}`,
                            proposedBudget,
                            deliverables
                        ]
                    );
                }
            }
        }

        if (!proposedBudget) proposedBudget = 5000;
        if (!deliverables) deliverables = '1 Reel + 1 Story';
        if (!customTitle) customTitle = 'Custom Collaboration';

        // Create or get conversation
        let conv = queryOne('SELECT id FROM conversations WHERE brand_id = ? AND creator_id = ?', [brand.id, creator.id]);
        let convId = conv?.id;

        const snippet = pitchText.length > 80 ? pitchText.substring(0, 77) + '...' : pitchText;

        if (!convId) {
            convId = `conv_${Date.now()}`;
            run(
                'INSERT INTO conversations (id, brand_id, creator_id, campaign_id, last_message) VALUES (?, ?, ?, ?, ?)',
                [convId, brand.id, creator.id, campaignId || null, `Direct Pitch: ${snippet}`]
            );
        } else {
            run(
                'UPDATE conversations SET last_message = ?, campaign_id = COALESCE(?, campaign_id), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [`Direct Pitch: ${snippet}`, campaignId || null, convId]
            );
        }

        const msgText = `🎯 DIRECT COLLABORATION PITCH\nBrand: ${brand.company_name}\nProject: ${customTitle}\nOffer: ₹${proposedBudget.toLocaleString()}\nDeliverables: ${deliverables}\n\nNote: ${pitchText}`;

        run(
            'INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)',
            [`msg_${Date.now()}`, convId, req.user.id, msgText]
        );

        // Notify creator
        run(
            'INSERT INTO notifications (id, user_id, title, message, link) VALUES (?, ?, ?, ?, ?)',
            [
                `notif_${Date.now()}`,
                creator.user_id,
                `🎯 New Direct Pitch from ${brand.company_name}!`,
                `Offered ₹${proposedBudget.toLocaleString()} for "${customTitle}" (${deliverables}). Reply in messages!`,
                `/creator/messages`
            ]
        );

        return res.json({
            success: true,
            message: `Direct pitch sent to ${creator.full_name}! Track progress in Messages.`,
            conversation_id: convId
        });
    } catch (err) {
        console.error('Error sending direct pitch:', err);
        return res.status(500).json({ success: false, error: 'Failed to send pitch: ' + err.message });
    }
});

module.exports = router;
