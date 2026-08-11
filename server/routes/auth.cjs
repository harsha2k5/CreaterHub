const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database.cjs');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth.cjs');

// POST /api/auth/register
router.post('/register', (eReq, res) => {
    try {
        const { role, email, password, company_name, full_name, username, phone, category, city, state, location_name, address, pin_code, description, bio } = eReq.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Email, password, and role are required.' });
        }

        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User with this email already exists.' });
        }

        const userId = 'user_' + Date.now();
        const passwordHash = bcrypt.hashSync(password, 10);

        // Transaction to insert User + Profile
        const registerTransaction = db.transaction(() => {
            db.prepare(`
                INSERT INTO users (id, email, password_hash, role, is_verified)
                VALUES (?, ?, ?, ?, 1)
            `).run(userId, email, passwordHash, role);

            let profileId = '';
            if (role === 'brand') {
                profileId = 'brand_' + Date.now();
                db.prepare(`
                    INSERT INTO brands (id, user_id, company_name, business_email, phone, category, location_name, address, city, state, pin_code, description, verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `).run(
                    profileId,
                    userId,
                    company_name || 'My Brand',
                    email,
                    phone || '',
                    category || 'General',
                    location_name || city || 'Bengaluru',
                    address || '',
                    city || 'Bengaluru',
                    state || 'Karnataka',
                    pin_code || '',
                    description || ''
                );
            } else if (role === 'creator') {
                profileId = 'creator_' + Date.now();
                const uname = username || 'user_' + Math.floor(Math.random() * 10000);
                db.prepare(`
                    INSERT INTO creators (id, user_id, full_name, username, phone, location_name, city, state, bio, categories, languages, verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `).run(
                    profileId,
                    userId,
                    full_name || 'New Creator',
                    uname,
                    phone || '',
                    location_name || city || 'Bengaluru',
                    city || 'Bengaluru',
                    state || 'Karnataka',
                    bio || '',
                    JSON.stringify(['Lifestyle']),
                    JSON.stringify(['English'])
                );
            }
            return profileId;
        });

        const profileId = registerTransaction();

        const token = jwt.sign({ id: userId, email, role, profileId }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            success: true,
            token,
            user: { id: userId, email, role, profileId }
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, error: 'Registration failed. ' + err.message });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required.' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        let profile = null;
        let profileId = '';

        if (user.role === 'brand') {
            profile = db.prepare('SELECT * FROM brands WHERE user_id = ?').get(user.id);
            if (profile) profileId = profile.id;
        } else if (user.role === 'creator') {
            profile = db.prepare('SELECT * FROM creators WHERE user_id = ?').get(user.id);
            if (profile) profileId = profile.id;
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, profileId }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profileId,
                profile
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, error: 'Login failed.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, role, is_verified, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        let profile = null;
        if (user.role === 'brand') {
            profile = db.prepare('SELECT * FROM brands WHERE user_id = ?').get(user.id);
        } else if (user.role === 'creator') {
            profile = db.prepare('SELECT * FROM creators WHERE user_id = ?').get(user.id);
        }

        return res.json({
            success: true,
            user: {
                ...user,
                profileId: profile ? profile.id : '',
                profile
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Error fetching session user.' });
    }
});

module.exports = router;
