const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/applications
router.get('/', authenticateToken, (req, res) => {
    try {
        if (req.user.role === 'brand') {
            const brand = db.prepare('SELECT id FROM brands WHERE user_id = ?').get(req.user.id);
            if (!brand) return res.json({ success: true, applications: [] });

            const apps = db.prepare(`
                SELECT a.*, c.title AS campaign_title, c.reward_per_creator, c.platform,
                       cr.full_name AS creator_name, cr.username AS creator_username, cr.avatar_url AS creator_avatar,
                       cr.followers AS creator_followers, cr.engagement_rate AS creator_engagement, cr.city AS creator_city, cr.rating AS creator_rating
                FROM applications a
                JOIN campaigns c ON a.campaign_id = c.id
                JOIN creators cr ON a.creator_id = cr.id
                WHERE c.brand_id = ?
                ORDER BY a.applied_at DESC
            `).all(brand.id);

            return res.json({ success: true, count: apps.length, applications: apps });

        } else if (req.user.role === 'creator') {
            const creator = db.prepare('SELECT id FROM creators WHERE user_id = ?').get(req.user.id);
            if (!creator) return res.json({ success: true, applications: [] });

            const apps = db.prepare(`
                SELECT a.*, c.title AS campaign_title, c.location_name, c.reward_per_creator, c.platform,
                       b.company_name AS brand_name, b.logo_url AS brand_logo
                FROM applications a
                JOIN campaigns c ON a.campaign_id = c.id
                JOIN brands b ON c.brand_id = b.id
                WHERE a.creator_id = ?
                ORDER BY a.applied_at DESC
            `).all(creator.id);

            return res.json({ success: true, count: apps.length, applications: apps });
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized role.' });
        }
    } catch (err) {
        console.error('Error fetching applications:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch applications.' });
    }
});

// PUT /api/applications/:id/status (Accept or Reject)
router.put('/:id/status', authenticateToken, (req, res) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status. Must be accepted or rejected.' });
        }

        const app = db.prepare(`
            SELECT a.*, c.brand_id, c.title AS campaign_title, cr.user_id AS creator_user_id, cr.full_name AS creator_name
            FROM applications a
            JOIN campaigns c ON a.campaign_id = c.id
            JOIN creators cr ON a.creator_id = cr.id
            WHERE a.id = ?
        `).get(req.params.id);

        if (!app) {
            return res.status(404).json({ success: false, error: 'Application not found.' });
        }

        // Update application status
        db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, app.id);

        if (status === 'accepted') {
            // Check if collaboration already exists
            const existingCollab = db.prepare('SELECT id FROM collaborations WHERE application_id = ?').get(app.id);
            let collabId = existingCollab ? existingCollab.id : 'collab_' + Date.now();

            if (!existingCollab) {
                db.prepare(`
                    INSERT INTO collaborations (id, campaign_id, application_id, brand_id, creator_id, status, current_step)
                    VALUES (?, ?, ?, ?, ?, 'active', 2)
                `).run(collabId, app.campaign_id, app.id, app.brand_id, app.creator_id);

                // Update campaign hired count
                db.prepare('UPDATE campaigns SET creators_hired = creators_hired + 1 WHERE id = ?').run(app.campaign_id);

                // Create or find Conversation
                const existingConv = db.prepare('SELECT id FROM conversations WHERE brand_id = ? AND creator_id = ?').get(app.brand_id, app.creator_id);
                let convId = existingConv ? existingConv.id : 'conv_' + Date.now();

                if (!existingConv) {
                    db.prepare(`
                        INSERT INTO conversations (id, brand_id, creator_id, collaboration_id, last_message)
                        VALUES (?, ?, ?, ?, 'Collaboration accepted! Let us begin.')
                    `).run(convId, app.brand_id, app.creator_id, collabId);
                }

                // Initial Message
                const brandUser = db.prepare('SELECT user_id FROM brands WHERE id = ?').get(app.brand_id);
                if (brandUser) {
                    db.prepare(`
                        INSERT INTO messages (id, conversation_id, sender_id, text, read_status)
                        VALUES (?, ?, ?, ?, 0)
                    `).run('msg_' + Date.now(), convId, brandUser.user_id, `Congratulations! Your application for "${app.campaign_title}" has been accepted. Let us coordinate content creation!`, 0);
                }
            }

            // Send Notification to Creator
            db.prepare(`
                INSERT INTO notifications (id, user_id, title, message, link)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                'notif_' + Date.now(),
                app.creator_user_id,
                '🎉 Application Accepted!',
                `Your application for "${app.campaign_title}" has been accepted.`,
                '/collaborations'
            );
        }

        return res.json({ success: true, message: `Application ${status} successfully.` });
    } catch (err) {
        console.error('Error updating application status:', err);
        return res.status(500).json({ success: false, error: 'Failed to update application status.' });
    }
});

module.exports = router;
