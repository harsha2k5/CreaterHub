const express = require('express');
const router = express.Router();
const db = require('../db/database.cjs');

// GET /api/creators
router.get('/', (req, res) => {
    try {
        const { category, city, search } = req.query;

        let query = `SELECT * FROM creators WHERE 1=1`;
        const params = [];

        if (category && category !== 'All') {
            query += ` AND categories LIKE ?`;
            params.push(`%${category}%`);
        }

        if (city && city !== 'All') {
            query += ` AND city LIKE ?`;
            params.push(`%${city}%`);
        }

        if (search) {
            query += ` AND (full_name LIKE ? OR username LIKE ? OR bio LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY followers DESC`;

        const creators = db.prepare(query).all(...params);

        const processed = creators.map(c => ({
            ...c,
            categories: JSON.parse(c.categories || '[]'),
            languages: JSON.parse(c.languages || '[]')
        }));

        return res.json({ success: true, count: processed.length, creators: processed });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching creators.' });
    }
});

// GET /api/creators/:id
router.get('/:id', (req, res) => {
    try {
        const creator = db.prepare('SELECT * FROM creators WHERE id = ?').get(req.params.id);
        if (!creator) {
            return res.status(404).json({ success: false, error: 'Creator profile not found.' });
        }

        creator.categories = JSON.parse(creator.categories || '[]');
        creator.languages = JSON.parse(creator.languages || '[]');

        const socialAccounts = db.prepare('SELECT * FROM social_accounts WHERE creator_id = ?').all(creator.id);
        const portfolio = db.prepare('SELECT * FROM portfolio_items WHERE creator_id = ?').all(creator.id);
        const reviews = db.prepare(`
            SELECT r.*, u.email, b.company_name AS reviewer_name, b.logo_url AS reviewer_avatar
            FROM reviews r
            JOIN users u ON r.reviewer_id = u.id
            LEFT JOIN brands b ON b.user_id = u.id
            WHERE r.reviewee_id = ?
            ORDER BY r.created_at DESC
        `).all(creator.user_id);

        return res.json({ success: true, creator, socialAccounts, portfolio, reviews });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error loading creator profile.' });
    }
});

module.exports = router;
