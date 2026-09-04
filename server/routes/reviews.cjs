const express = require('express');
const router = express.Router();
const { query, queryOne, run, transaction } = require('../db/database.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

function generateId(prefix = 'rev') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// POST /api/reviews - Submit mutual review
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { collaboration_id, rating, review_text } = req.body;

        if (!collaboration_id || !rating) {
            return res.status(400).json({ success: false, error: 'Collaboration ID and rating (1-5) are required.' });
        }

        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be a number between 1 and 5.' });
        }

        const collab = queryOne('SELECT * FROM collaborations WHERE id = ?', [collaboration_id]);
        if (!collab) {
            return res.status(404).json({ success: false, error: 'Collaboration not found.' });
        }

        // Determine reviewer and reviewee
        let revieweeUserId = null;
        const reviewerRole = req.user.role;

        if (reviewerRole === 'creator') {
            const brand = queryOne('SELECT user_id FROM brand_profiles WHERE id = ?', [collab.brand_id]);
            revieweeUserId = brand?.user_id;
        } else if (reviewerRole === 'brand') {
            const creator = queryOne('SELECT user_id FROM creator_profiles WHERE id = ?', [collab.creator_id]);
            revieweeUserId = creator?.user_id;
        } else {
            return res.status(403).json({ success: false, error: 'Only participating creators or brands can review.' });
        }

        if (!revieweeUserId) {
            return res.status(404).json({ success: false, error: 'Reviewee user not found.' });
        }

        // Check if already reviewed
        const existing = queryOne(
            'SELECT id FROM reviews WHERE collaboration_id = ? AND reviewer_id = ?',
            [collaboration_id, req.user.id]
        );
        if (existing) {
            return res.status(409).json({ success: false, error: 'You have already submitted a review for this collaboration.' });
        }

        const reviewId = generateId('rev');
        transaction(() => {
            run(
                `INSERT INTO reviews (
                    id, collaboration_id, reviewer_id, reviewee_id,
                    reviewer_role, rating, review_text
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [reviewId, collaboration_id, req.user.id, revieweeUserId, reviewerRole, numRating, review_text || '']
            );

            // Recompute reviewee's average rating
            const stats = queryOne(
                'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewee_id = ?',
                [revieweeUserId]
            );

            if (stats && stats.count > 0) {
                const newAvg = parseFloat(stats.avg_rating.toFixed(1));
                if (reviewerRole === 'creator') {
                    // Updating brand's rating
                    run('UPDATE brand_profiles SET rating = ?, review_count = ? WHERE user_id = ?', [newAvg, stats.count, revieweeUserId]);
                }
            }
        });

        return res.status(201).json({ success: true, message: 'Review submitted successfully.' });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ success: false, error: 'Failed to submit review: ' + err.message });
    }
});

// GET /api/reviews/collaboration/:collabId
router.get('/collaboration/:collabId', authenticateToken, (req, res) => {
    try {
        const { collabId } = req.params;
        const reviews = query('SELECT * FROM reviews WHERE collaboration_id = ?', [collabId]);
        return res.json({ success: true, reviews });
    } catch (err) {
        console.error('Error fetching collaboration reviews:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
    }
});

module.exports = router;
