const express = require('express');
const router = express.Router();
const { Review, User, Creator, Brand } = require('../models/index.cjs');
const { authenticateToken } = require('../middleware/auth.cjs');

// POST /api/reviews
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { collaboration_id, reviewee_id, rating, review_text } = req.body;

        if (!collaboration_id || !reviewee_id || !rating) {
            return res.status(400).json({ success: false, error: 'Collaboration ID, reviewee ID, and rating are required.' });
        }

        const reviewId = 'rev_' + Date.now();
        await Review.create({
            id: reviewId,
            collaboration_id,
            reviewer_id: req.user.id,
            reviewee_id,
            reviewer_role: req.user.role,
            rating: Number(rating),
            review_text: review_text || ''
        });

        // Recalculate average rating for reviewee profile
        const reviewee = await User.findOne({ id: reviewee_id }).lean();
        if (reviewee) {
            const allReviews = await Review.find({ reviewee_id }).lean();
            const count = allReviews.length;
            const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
            const newRating = count > 0 ? parseFloat((sum / count).toFixed(1)) : 5.0;

            if (reviewee.role === 'creator') {
                await Creator.updateOne({ user_id: reviewee_id }, { rating: newRating, review_count: count });
            } else if (reviewee.role === 'brand') {
                await Brand.updateOne({ user_id: reviewee_id }, { rating: newRating, review_count: count });
            }
        }

        return res.status(201).json({ success: true, message: 'Review submitted successfully!', reviewId });
    } catch (err) {
        console.error('Error submitting review:', err);
        return res.status(500).json({ success: false, error: 'Review submission failed.' });
    }
});

module.exports = router;
