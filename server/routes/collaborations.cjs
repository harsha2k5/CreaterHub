const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// GET /api/collaborations
router.get('/', authenticateToken, (req, res) => {
    try {
        let collabs = [];

        if (req.user.role === 'brand') {
            const brand = db.prepare('SELECT id FROM brands WHERE user_id = ?').get(req.user.id);
            if (!brand) return res.json({ success: true, collaborations: [] });

            collabs = db.prepare(`
                SELECT col.*, c.title AS campaign_title, c.reward_per_creator, c.platform, c.location_name,
                       cr.full_name AS creator_name, cr.username AS creator_username, cr.avatar_url AS creator_avatar,
                       p.status AS payment_status, p.amount AS amount_paid
                FROM collaborations col
                JOIN campaigns c ON col.campaign_id = c.id
                JOIN creators cr ON col.creator_id = cr.id
                LEFT JOIN payments p ON p.collaboration_id = col.id
                WHERE col.brand_id = ?
                ORDER BY col.created_at DESC
            `).all(brand.id);

        } else if (req.user.role === 'creator') {
            const creator = db.prepare('SELECT id FROM creators WHERE user_id = ?').get(req.user.id);
            if (!creator) return res.json({ success: true, collaborations: [] });

            collabs = db.prepare(`
                SELECT col.*, c.title AS campaign_title, c.reward_per_creator, c.platform, c.location_name,
                       b.company_name AS brand_name, b.logo_url AS brand_logo,
                       p.status AS payment_status, p.amount AS amount_paid
                FROM collaborations col
                JOIN campaigns c ON col.campaign_id = c.id
                JOIN brands b ON col.brand_id = b.id
                LEFT JOIN payments p ON p.collaboration_id = col.id
                WHERE col.creator_id = ?
                ORDER BY col.created_at DESC
            `).all(creator.id);
        }

        return res.json({ success: true, count: collabs.length, collaborations: collabs });
    } catch (err) {
        console.error('Error fetching collaborations:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch collaborations.' });
    }
});

// GET /api/collaborations/:id
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const collab = db.prepare(`
            SELECT col.*, c.title AS campaign_title, c.description AS campaign_description, c.deliverables, c.reward_per_creator, c.platform, c.location_name, c.guidelines,
                   b.company_name AS brand_name, b.logo_url AS brand_logo,
                   cr.full_name AS creator_name, cr.avatar_url AS creator_avatar, cr.user_id AS creator_user_id
            FROM collaborations col
            JOIN campaigns c ON col.campaign_id = c.id
            JOIN brands b ON col.brand_id = b.id
            JOIN creators cr ON col.creator_id = cr.id
            WHERE col.id = ?
        `).get(req.params.id);

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        collab.deliverables = JSON.parse(collab.deliverables || '[]');

        const submissions = db.prepare(`
            SELECT * FROM content_submissions WHERE collaboration_id = ? ORDER BY submitted_at DESC
        `).all(collab.id);

        const payment = db.prepare(`
            SELECT * FROM payments WHERE collaboration_id = ?
        `).get(collab.id);

        return res.json({ success: true, collaboration: collab, submissions, payment });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching collaboration details.' });
    }
});

// POST /api/collaborations/:id/submit (Creator Submits Content Proof)
router.post('/:id/submit', authenticateToken, (req, res) => {
    try {
        const { content_url, platform, caption, screenshot_url, notes } = req.body;
        if (!content_url) {
            return res.status(400).json({ success: false, error: 'Content URL is required.' });
        }

        const collab = db.prepare(`
            SELECT col.*, c.title AS campaign_title, b.user_id AS brand_user_id
            FROM collaborations col
            JOIN campaigns c ON col.campaign_id = c.id
            JOIN brands b ON col.brand_id = b.id
            WHERE col.id = ?
        `).get(req.params.id);

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        const subId = 'sub_' + Date.now();
        db.prepare(`
            INSERT INTO content_submissions (id, collaboration_id, content_url, platform, caption, screenshot_url, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
        `).run(subId, collab.id, content_url, platform || 'Instagram', caption || '', screenshot_url || '', notes || '');

        // Update collaboration status step to content_submitted (Step 4)
        db.prepare('UPDATE collaborations SET status = "content_submitted", current_step = 4 WHERE id = ?').run(collab.id);

        // Notify Brand
        db.prepare(`
            INSERT INTO notifications (id, user_id, title, message, link)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            'notif_' + Date.now(),
            collab.brand_user_id,
            '📸 Content Proof Submitted',
            `Creator submitted content for "${collab.campaign_title}"`,
            '/collaborations'
        );

        return res.status(201).json({ success: true, message: 'Content proof submitted successfully!', submissionId: subId });
    } catch (err) {
        console.error('Error submitting content:', err);
        return res.status(500).json({ success: false, error: 'Submission failed.' });
    }
});

// PUT /api/collaborations/:id/review (Brand Approves or Requests Revision)
router.put('/:id/review', authenticateToken, (req, res) => {
    try {
        const { action, feedback } = req.body; // 'approve' or 'revision'

        const collab = db.prepare(`
            SELECT col.*, c.title AS campaign_title, cr.user_id AS creator_user_id
            FROM collaborations col
            JOIN campaigns c ON col.campaign_id = c.id
            JOIN creators cr ON col.creator_id = cr.id
            WHERE col.id = ?
        `).get(req.params.id);

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        if (action === 'approve') {
            db.prepare('UPDATE collaborations SET status = "approved", current_step = 5 WHERE id = ?').run(collab.id);
            db.prepare('UPDATE content_submissions SET status = "approved", brand_feedback = ? WHERE collaboration_id = ?').run(feedback || 'Approved!', collab.id);

            db.prepare(`
                INSERT INTO notifications (id, user_id, title, message, link)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                'notif_' + Date.now(),
                collab.creator_user_id,
                '✅ Content Approved!',
                `Brand approved your content for "${collab.campaign_title}". Payment release pending.`,
                '/collaborations'
            );

            return res.json({ success: true, message: 'Content approved successfully!' });
        } else if (action === 'revision') {
            db.prepare('UPDATE collaborations SET status = "revision_requested", current_step = 3 WHERE id = ?').run(collab.id);
            db.prepare('UPDATE content_submissions SET status = "revision_requested", brand_feedback = ? WHERE collaboration_id = ?').run(feedback || 'Revision requested.', collab.id);

            db.prepare(`
                INSERT INTO notifications (id, user_id, title, message, link)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                'notif_' + Date.now(),
                collab.creator_user_id,
                '✏️ Revision Requested',
                `Brand requested revision for "${collab.campaign_title}": ${feedback || 'Check notes.'}`,
                '/collaborations'
            );

            return res.json({ success: true, message: 'Revision requested.' });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid review action.' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Review action failed.' });
    }
});

// POST /api/collaborations/:id/release-payment (Brand Releases Escrow Payment)
router.post('/:id/release-payment', authenticateToken, (req, res) => {
    try {
        const collab = db.prepare(`
            SELECT col.*, c.title AS campaign_title, c.reward_per_creator, cr.user_id AS creator_user_id, cr.full_name AS creator_name
            FROM collaborations col
            JOIN campaigns c ON col.campaign_id = c.id
            JOIN creators cr ON col.creator_id = cr.id
            WHERE col.id = ?
        `).get(req.params.id);

        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        const existingPayment = db.prepare('SELECT id FROM payments WHERE collaboration_id = ?').get(collab.id);
        if (existingPayment) {
            return res.status(400).json({ success: false, error: 'Payment already released for this collaboration.' });
        }

        const paymentId = 'pay_' + Date.now();
        const txnId = 'TXN_ESCROW_' + Math.floor(100000 + Math.random() * 900000);

        db.prepare(`
            INSERT INTO payments (id, collaboration_id, brand_id, creator_id, amount, payment_type, status, transaction_id)
            VALUES (?, ?, ?, ?, ?, 'Escrow Release', 'paid', ?)
        `).run(paymentId, collab.id, collab.brand_id, collab.creator_id, collab.reward_per_creator, txnId);

        // Update collaboration to completed (Step 6)
        db.prepare('UPDATE collaborations SET status = "completed", current_step = 6 WHERE id = ?').run(collab.id);

        // Notify Creator
        db.prepare(`
            INSERT INTO notifications (id, user_id, title, message, link)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            'notif_' + Date.now(),
            collab.creator_user_id,
            '💸 Payment Released!',
            `₹${collab.reward_per_creator.toLocaleString()} transferred to your account for "${collab.campaign_title}".`,
            '/earnings'
        );

        return res.json({
            success: true,
            message: `Payment of ₹${collab.reward_per_creator.toLocaleString()} released successfully!`,
            transactionId: txnId
        });
    } catch (err) {
        console.error('Error releasing payment:', err);
        return res.status(500).json({ success: false, error: 'Payment release failed.' });
    }
});

module.exports = router;
