const express = require('express');
const router = express.Router();
const { query, queryOne, run, transaction } = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');
const PaymentService = require('../services/PaymentService.cjs');

function generateId(prefix = 'del') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// GET /api/collaborations - List collaborations (role-aware)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let sql = '';
        let params = [];

        if (req.user.role === 'creator') {
            const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
            if (!creator) return res.status(404).json({ success: false, error: 'Creator not found.' });

            sql = `
                SELECT col.*, c.title as campaign_title, c.reward_per_creator, c.image_url as campaign_image,
                       c.deliverables_json as campaign_deliverables,
                       b.company_name as brand_name, b.logo_url as brand_logo, b.city as brand_city,
                       p.status as payment_status, p.amount as payment_amount, p.is_simulated
                FROM collaborations col
                JOIN campaigns c ON col.campaign_id = c.id
                JOIN brand_profiles b ON col.brand_id = b.id
                LEFT JOIN payments p ON col.id = p.collaboration_id
                WHERE col.creator_id = ?
                ORDER BY col.started_at DESC
            `;
            params = [creator.id];
        } else if (req.user.role === 'brand') {
            const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
            if (!brand) return res.status(404).json({ success: false, error: 'Brand not found.' });

            sql = `
                SELECT col.*, c.title as campaign_title, c.reward_per_creator,
                       cr.full_name as creator_name, cr.username as creator_username,
                       cr.avatar_url as creator_avatar,
                       p.status as payment_status, p.amount as payment_amount, p.is_simulated
                FROM collaborations col
                JOIN campaigns c ON col.campaign_id = c.id
                JOIN creator_profiles cr ON col.creator_id = cr.id
                LEFT JOIN payments p ON col.id = p.collaboration_id
                WHERE col.brand_id = ?
                ORDER BY col.started_at DESC
            `;
            params = [brand.id];
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized.' });
        }

        const rows = query(sql, params);

        const enriched = rows.map(r => {
            let delivs = [];
            try { delivs = JSON.parse(r.campaign_deliverables || '[]'); } catch {}

            // Check if deliverables submitted
            const submissions = query('SELECT * FROM deliverables WHERE collaboration_id = ? ORDER BY submitted_at DESC', [r.id]);

            return {
                ...r,
                campaign_deliverables: delivs,
                submissions
            };
        });

        return res.json({ success: true, count: enriched.length, collaborations: enriched });
    } catch (err) {
        console.error('Error fetching collaborations:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve collaborations.' });
    }
});

// GET /api/collaborations/:id - Single collaboration detail
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const collab = queryOne(`
            SELECT col.*, c.title as campaign_title, c.description as campaign_desc,
                   c.deliverables_json, c.reward_per_creator,
                   b.company_name as brand_name, b.logo_url as brand_logo, b.business_email,
                   cr.full_name as creator_name, cr.username as creator_username, cr.avatar_url as creator_avatar,
                   p.status as payment_status, p.amount as payment_amount, p.is_simulated, p.transaction_ref
            FROM collaborations col
            JOIN campaigns c ON col.campaign_id = c.id
            JOIN brand_profiles b ON col.brand_id = b.id
            JOIN creator_profiles cr ON col.creator_id = cr.id
            LEFT JOIN payments p ON col.id = p.collaboration_id
            WHERE col.id = ?
        `, [id]);

        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found.' });

        const submissions = query('SELECT * FROM deliverables WHERE collaboration_id = ? ORDER BY submitted_at DESC', [id]);
        const reviews = query('SELECT * FROM reviews WHERE collaboration_id = ?', [id]);

        let deliverables = [];
        try { deliverables = JSON.parse(collab.deliverables_json || '[]'); } catch {}

        return res.json({
            success: true,
            collaboration: {
                ...collab,
                deliverables_requirements: deliverables,
                submissions,
                reviews
            }
        });
    } catch (err) {
        console.error('Error fetching collaboration details:', err);
        return res.status(500).json({ success: false, error: 'Failed to load collaboration.' });
    }
});

// POST /api/collaborations/:id/submit - Creator submits deliverable proof
router.post('/:id/submit', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { live_post_url, platform = 'Instagram', caption, screenshot_url, notes } = req.body;

        if (!live_post_url) {
            return res.status(400).json({ success: false, error: 'Live post URL is required.' });
        }

        const creator = queryOne('SELECT id FROM creator_profiles WHERE user_id = ?', [req.user.id]);
        if (!creator) return res.status(403).json({ success: false, error: 'Creator not found.' });

        const collab = queryOne('SELECT * FROM collaborations WHERE id = ? AND creator_id = ?', [id, creator.id]);
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found or unauthorized.' });

        const delivId = generateId('del');
        transaction(() => {
            run(
                `INSERT INTO deliverables (
                    id, collaboration_id, live_post_url, platform, caption,
                    screenshot_url, notes, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
                [delivId, id, live_post_url.trim(), platform, caption || '', screenshot_url || '', notes || '']
            );

            run(
                `UPDATE collaborations
                 SET status = 'SUBMITTED', current_step = 3
                 WHERE id = ?`,
                [id]
            );

            // Notify brand
            const brandUser = queryOne('SELECT user_id FROM brand_profiles WHERE id = ?', [collab.brand_id]);
            if (brandUser) {
                run(
                    `INSERT INTO notifications (id, user_id, title, message, link)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        generateId('notif'),
                        brandUser.user_id,
                        'Deliverable Submitted for Review',
                        'Creator has submitted content proof for verification.',
                        `/brand/collaborations`
                    ]
                );
            }
        });

        return res.json({
            success: true,
            message: 'Deliverable proof submitted for brand review.',
            deliverable_id: delivId
        });
    } catch (err) {
        console.error('Error submitting deliverable:', err);
        return res.status(500).json({ success: false, error: 'Failed to submit deliverable: ' + err.message });
    }
});

// POST /api/collaborations/:id/review - Brand reviews submitted deliverable
router.post('/:id/review', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, feedback } = req.body; // 'APPROVE' | 'REVISION'

        if (!['APPROVE', 'REVISION'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Action must be either APPROVE or REVISION.' });
        }

        const brand = queryOne('SELECT id FROM brand_profiles WHERE user_id = ?', [req.user.id]);
        if (!brand) return res.status(403).json({ success: false, error: 'Brand not found.' });

        const collab = queryOne('SELECT * FROM collaborations WHERE id = ? AND brand_id = ?', [id, brand.id]);
        if (!collab) return res.status(404).json({ success: false, error: 'Collaboration not found or unauthorized.' });

        if (action === 'APPROVE') {
            transaction(() => {
                run("UPDATE deliverables SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP WHERE collaboration_id = ?", [id]);
                run("UPDATE collaborations SET status = 'COMPLETED', current_step = 4, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
            });

            // Automatically trigger Escrow payout
            await PaymentService.releaseEscrow(id);

            return res.json({
                success: true,
                message: 'Deliverables approved! Collaboration marked as completed and simulated escrow payout released.'
            });
        } else {
            transaction(() => {
                run(
                    `UPDATE deliverables
                     SET status = 'REVISION_REQUESTED', brand_feedback = ?, reviewed_at = CURRENT_TIMESTAMP
                     WHERE collaboration_id = ?`,
                    [feedback || 'Please review guidelines and update.', id]
                );
                run("UPDATE collaborations SET status = 'REVISION_REQUESTED' WHERE id = ?", [id]);

                // Notify creator
                const creatorUser = queryOne('SELECT user_id FROM creator_profiles WHERE id = ?', [collab.creator_id]);
                if (creatorUser) {
                    run(
                        `INSERT INTO notifications (id, user_id, title, message, link)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            generateId('notif'),
                            creatorUser.user_id,
                            'Revision Requested on Deliverable',
                            feedback || 'The brand has requested revisions on your submitted proof.',
                            `/creator/collaborations`
                        ]
                    );
                }
            });

            return res.json({
                success: true,
                message: 'Revision requested. Creator has been notified.'
            });
        }
    } catch (err) {
        console.error('Error reviewing deliverable:', err);
        return res.status(500).json({ success: false, error: 'Review action failed: ' + err.message });
    }
});

module.exports = router;
