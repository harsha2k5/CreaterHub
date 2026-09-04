const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, run, transaction } = require('../db/database.cjs');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth.cjs');

// Generate unique ID
function generateId(prefix = 'usr') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            // Creator specific
            full_name,
            username,
            phone,
            city,
            area,
            categories,
            bio,
            avatar_url,
            languages,
            min_budget,
            radius_km,
            social_link,
            // Brand specific
            company_name,
            business_category,
            website,
            address,
            location_name,
            description,
            logo_url,
            lat,
            lng
        } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Email, password, and role are required.' });
        }

        if (!['creator', 'brand'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Role must be either creator or brand.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const existing = queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing) {
            return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = generateId('usr');

        let profileData = null;

        if (role === 'creator') {
            const creatorName = (full_name || 'Creator').trim();
            let creatorUsername = (username || creatorName.toLowerCase().replace(/[^a-z0-9_]/g, '_')).trim();
            if (!creatorUsername) creatorUsername = `creator_${Math.random().toString(36).substring(2, 6)}`;

            // Check if username taken
            const existingUsername = queryOne('SELECT id FROM creator_profiles WHERE username = ?', [creatorUsername]);
            if (existingUsername) {
                creatorUsername = `${creatorUsername}_${Math.random().toString(36).substring(2, 5)}`;
            }

            const creatorId = generateId('crt');
            const categoriesJson = JSON.stringify(Array.isArray(categories) ? categories : (categories ? [categories] : ['Lifestyle']));
            const languagesJson = JSON.stringify(Array.isArray(languages) ? languages : ['English']);

            transaction(() => {
                run(
                    `INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
                     VALUES (?, ?, ?, 'creator', 1, 1)`,
                    [userId, normalizedEmail, passwordHash]
                );

                run(
                    `INSERT INTO creator_profiles (
                        id, user_id, full_name, username, phone, city, area,
                        lat, lng, bio, avatar_url, categories_json, languages_json,
                        min_budget, radius_km, social_link
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        creatorId, userId, creatorName, creatorUsername, phone || '',
                        city || 'Bengaluru', area || 'Central',
                        lat || 12.9716, lng || 77.5946,
                        bio || '', avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                        categoriesJson, languagesJson,
                        Number(min_budget) || 3000, Number(radius_km) || 15.0,
                        social_link || ''
                    ]
                );
            });

            profileData = queryOne('SELECT * FROM creator_profiles WHERE id = ?', [creatorId]);
            if (profileData) {
                profileData.categories = JSON.parse(profileData.categories_json || '[]');
                profileData.languages = JSON.parse(profileData.languages_json || '[]');
            }
        } else if (role === 'brand') {
            const brandId = generateId('brd');
            const companyName = (company_name || 'My Local Business').trim();
            const brandCategory = business_category || 'Retail & Lifestyle';

            transaction(() => {
                run(
                    `INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
                     VALUES (?, ?, ?, 'brand', 1, 1)`,
                    [userId, normalizedEmail, passwordHash]
                );

                run(
                    `INSERT INTO brand_profiles (
                        id, user_id, company_name, business_email, phone, category,
                        website, location_name, address, city, lat, lng, logo_url, description
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        brandId, userId, companyName, normalizedEmail, phone || '', brandCategory,
                        website || '', location_name || area || '', address || '', city || 'Bengaluru',
                        lat || 12.9716, lng || 77.5946,
                        logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200',
                        description || ''
                    ]
                );
            });

            profileData = queryOne('SELECT * FROM brand_profiles WHERE id = ?', [brandId]);
        }

        const token = jwt.sign(
            { id: userId, email: normalizedEmail, role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful.',
            token,
            user: {
                id: userId,
                email: normalizedEmail,
                role,
                profile: profileData
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, error: 'Registration failed: ' + err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = queryOne('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        if (user.is_active === 0) {
            return res.status(403).json({ success: false, error: 'Account suspended. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        let profile = null;
        let instagramAccount = null;

        if (user.role === 'creator') {
            profile = queryOne('SELECT * FROM creator_profiles WHERE user_id = ?', [user.id]);
            if (profile) {
                profile.categories = JSON.parse(profile.categories_json || '[]');
                profile.languages = JSON.parse(profile.languages_json || '[]');
                instagramAccount = queryOne(
                    'SELECT username, full_name, profile_picture_url, is_connected, connection_status, last_synced_at FROM instagram_accounts WHERE creator_id = ? AND is_connected = 1',
                    [profile.id]
                );
            }
        } else if (user.role === 'brand') {
            profile = queryOne('SELECT * FROM brand_profiles WHERE user_id = ?', [user.id]);
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified,
                profile,
                creator_profile: user.role === 'creator' ? profile : undefined,
                brand_profile: user.role === 'brand' ? profile : undefined,
                instagram: instagramAccount
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = queryOne('SELECT id, email, role, is_verified, is_active, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        let profile = null;
        let instagramAccount = null;

        if (user.role === 'creator') {
            profile = queryOne('SELECT * FROM creator_profiles WHERE user_id = ?', [user.id]);
            if (profile) {
                profile.categories = JSON.parse(profile.categories_json || '[]');
                profile.languages = JSON.parse(profile.languages_json || '[]');
                instagramAccount = queryOne(
                    'SELECT username, full_name, profile_picture_url, is_connected, connection_status, last_synced_at FROM instagram_accounts WHERE creator_id = ? AND is_connected = 1',
                    [profile.id]
                );
            }
        } else if (user.role === 'brand') {
            profile = queryOne('SELECT * FROM brand_profiles WHERE user_id = ?', [user.id]);
        }

        return res.json({
            success: true,
            user: {
                ...user,
                profile,
                creator_profile: user.role === 'creator' ? profile : undefined,
                brand_profile: user.role === 'brand' ? profile : undefined,
                instagram: instagramAccount
            }
        });
    } catch (err) {
        console.error('Auth check error:', err);
        return res.status(500).json({ success: false, error: 'Authentication check failed.' });
    }
});

module.exports = router;
