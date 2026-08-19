const express = require('express');
const router = express.Router();
const { Brand, Campaign, Review, Creator, User } = require('../models/index.cjs');

// GET /api/brands
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find({}).sort({ rating: -1 }).lean();
        return res.json({ success: true, count: brands.length, brands });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching brands.' });
    }
});

// GET /api/brands/:id
router.get('/:id', async (req, res) => {
    try {
        const brand = await Brand.findOne({ id: req.params.id }).lean();
        if (!brand) {
            return res.status(404).json({ success: false, error: 'Brand not found.' });
        }

        const activeCampaigns = await Campaign.find({ brand_id: brand.id, status: 'published' }).lean();

        const rawReviews = await Review.find({ reviewee_id: brand.user_id }).sort({ created_at: -1 }).lean();

        const reviewerUserIds = [...new Set(rawReviews.map(r => r.reviewer_id))];
        const creators = await Creator.find({ user_id: { $in: reviewerUserIds } }).lean();

        const creatorMap = {}; creators.forEach(cr => creatorMap[cr.user_id] = cr);

        const reviews = rawReviews.map(r => {
            const cr = creatorMap[r.reviewer_id] || {};
            return {
                ...r,
                reviewer_name: cr.full_name || 'Creator Reviewer',
                reviewer_avatar: cr.avatar_url || ''
            };
        });

        return res.json({ success: true, brand, activeCampaigns, reviews });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error loading brand profile.' });
    }
});

module.exports = router;
