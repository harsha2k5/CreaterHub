const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// POST /api/reviews
router.post('/', authenticateToken, (req, res) => {
    try {
        const { collaboration_id, reviewee_id, rating, review_text } = req.body;

        if (!collaboration_id || !reviewee_id || !rating) {
            return res.status(400).json({ success: false, error: 'Collaboration ID, reviewee ID, and rating are required.' });
        }

        const reviewId = 'rev_' + Date.now();
        db.prepare(`
            INSERT INTO reviews (id, collaboration_id, reviewer_id, reviewee_id, reviewer_role, rating, review_text)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            reviewId,
            collaboration_id,
            req.user.id,
            reviewee_id,
            req.user.role,
            Number(rating),
            review_text || ''
        );

        // Recalculate average rating for reviewee profile
        const reviewee = db.prepare('SELECT role FROM users WHERE id = ?').get(reviewee_id);
        if (reviewee) {
            const avgData = db.prepare('SELECT AVG(rating) AS avg_rating, COUNT(*) AS count FROM reviews WHERE reviewee_id = ?').get(reviewee_id);
            const newRating = parseFloat((avgData.avg_rating || 5.0).toFixed(1));
            const count = avgData.count;

            if (reviewee.role === 'creator') {
                db.prepare('UPDATE creators SET rating = ?, review_count = ? WHERE user_id = ?').run(newRating, count, reviewee_id);
            } else if (reviewee.role === 'brand') {
                db.prepare('UPDATE brands SET rating = ?, review_count = ? WHERE user_id = ?').run(newRating, count, reviewee_id);
            }
        }

        return res.status(201).json({ success: true, message: 'Review submitted successfully!', reviewId });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ success: false, error: 'Review submission failed.' });
    }
});

module.exports = router;
