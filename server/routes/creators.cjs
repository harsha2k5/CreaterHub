const express = require('express');
const router = express.Router();
const { Creator, Review, Brand, User } = require('../models/index.cjs');

// GET /api/creators
router.get('/', async (req, res) => {
    try {
        const { category, city, search } = req.query;

        const filter = {};

        if (category && category !== 'All') {
            filter.categories = new RegExp(category, 'i');
        }

        if (city && city !== 'All') {
            filter.city = new RegExp(city, 'i');
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { full_name: searchRegex },
                { username: searchRegex },
                { bio: searchRegex }
            ];
        }

        const rawCreators = await Creator.find(filter).sort({ followers: -1 }).lean();

        const processed = rawCreators.map(c => ({
            ...c,
            categories: Array.isArray(c.categories) ? c.categories : (typeof c.categories === 'string' ? JSON.parse(c.categories || '[]') : []),
            languages: Array.isArray(c.languages) ? c.languages : (typeof c.languages === 'string' ? JSON.parse(c.languages || '[]') : [])
        }));

        return res.json({ success: true, count: processed.length, creators: processed });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching creators.' });
    }
});

// GET /api/creators/:id
router.get('/:id', async (req, res) => {
    try {
        const creator = await Creator.findOne({ id: req.params.id }).lean();
        if (!creator) {
            return res.status(404).json({ success: false, error: 'Creator profile not found.' });
        }

        creator.categories = Array.isArray(creator.categories) ? creator.categories : (typeof creator.categories === 'string' ? JSON.parse(creator.categories || '[]') : []);
        creator.languages = Array.isArray(creator.languages) ? creator.languages : (typeof creator.languages === 'string' ? JSON.parse(creator.languages || '[]') : []);

        const socialAccounts = creator.social_accounts || [];
        const portfolio = creator.portfolio_items || [];

        const rawReviews = await Review.find({ reviewee_id: creator.user_id }).sort({ created_at: -1 }).lean();

        const reviewerUserIds = [...new Set(rawReviews.map(r => r.reviewer_id))];
        const [users, brands] = await Promise.all([
            User.find({ id: { $in: reviewerUserIds } }).lean(),
            Brand.find({ user_id: { $in: reviewerUserIds } }).lean()
        ]);

        const userMap = {}; users.forEach(u => userMap[u.id] = u);
        const brandMap = {}; brands.forEach(b => brandMap[b.user_id] = b);

        const reviews = rawReviews.map(r => {
            const u = userMap[r.reviewer_id] || {};
            const b = brandMap[r.reviewer_id] || {};
            return {
                ...r,
                email: u.email || '',
                reviewer_name: b.company_name || 'Reviewer',
                reviewer_avatar: b.logo_url || ''
            };
        });

        return res.json({ success: true, creator, socialAccounts, portfolio, reviews });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error loading creator profile.' });
    }
});

module.exports = router;
