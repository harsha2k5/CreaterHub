const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Brand, Creator } = require('../models/index.cjs');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth.cjs');

const { generateProfileAnalysis, processCreatorRecord } = require('./creators.cjs');

// POST /api/auth/register
router.post('/register', async (eReq, res) => {
    try {
        const { role, email, password, company_name, full_name, username, phone, category, city, state, location_name, address, pin_code, description, bio, social_link } = eReq.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Email, password, and role are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User with this email address already exists. Please log in.' });
        }

        if (role === 'creator') {
            const requestedUsername = (username || '').trim();
            if (requestedUsername) {
                const existingCreator = await Creator.findOne({ username: requestedUsername });
                if (existingCreator) {
                    return res.status(400).json({ success: false, error: `Username "${requestedUsername}" is already taken. Please choose a different username.` });
                }
            }
        }

        const userId = 'user_' + Date.now();
        const passwordHash = bcrypt.hashSync(password, 10);

        const newUser = await User.create({
            id: userId,
            email,
            password_hash: passwordHash,
            role,
            is_verified: 1
        });

        let profileId = '';
        let profile = null;

        try {
            if (role === 'brand') {
                profileId = 'brand_' + Date.now();
                profile = await Brand.create({
                    id: profileId,
                    user_id: userId,
                    company_name: company_name || 'My Brand',
                    business_email: email,
                    phone: phone || '',
                    category: category || 'General',
                    location_name: location_name || city || 'Bengaluru',
                    address: address || '',
                    city: city || 'Bengaluru',
                    state: state || 'Karnataka',
                    pin_code: pin_code || '',
                    description: description || '',
                    verified: 1
                });
            } else if (role === 'creator') {
                profileId = 'creator_' + Date.now();
                let uname = (username || '').trim();
                if (!uname) {
                    uname = 'user_' + Math.floor(Math.random() * 10000);
                }
                const initialAnalysis = social_link ? generateProfileAnalysis(social_link, bio, ['Lifestyle']) : null;
                profile = await Creator.create({
                    id: profileId,
                    user_id: userId,
                    full_name: full_name || 'New Creator',
                    username: uname,
                    phone: phone || '',
                    location_name: location_name || city || 'Bengaluru',
                    city: city || 'Bengaluru',
                    state: state || 'Karnataka',
                    bio: bio || '',
                    categories: ['Lifestyle'],
                    languages: ['English'],
                    social_link: social_link || '',
                    profile_analysis: initialAnalysis,
                    verified: 1
                });
            }
        } catch (profileErr) {
            // Clean up the created user if profile creation fails
            await User.deleteOne({ id: userId });
            throw profileErr;
        }

        const token = jwt.sign({ id: userId, email, role, profileId }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({
            success: true,
            token,
            user: { id: userId, email, role, profileId }
        });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
            if (err.message.includes('username')) {
                return res.status(400).json({ success: false, error: 'That username is already taken. Please enter a different username.' });
            }
            if (err.message.includes('email')) {
                return res.status(400).json({ success: false, error: 'User with this email is already registered.' });
            }
            return res.status(400).json({ success: false, error: 'Registration failed due to a duplicate field value.' });
        }
        return res.status(500).json({ success: false, error: 'Registration failed. ' + err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required.' });
        }

        const user = await User.findOne({ email }).lean();
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
            profile = await Brand.findOne({ user_id: user.id }).lean();
            if (profile) profileId = profile.id;
        } else if (user.role === 'creator') {
            const rawProfile = await Creator.findOne({ user_id: user.id }).lean();
            profile = processCreatorRecord(rawProfile);
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
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id }).select('id email role is_verified created_at').lean();
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        let profile = null;
        if (user.role === 'brand') {
            profile = await Brand.findOne({ user_id: user.id }).lean();
        } else if (user.role === 'creator') {
            const rawProfile = await Creator.findOne({ user_id: user.id }).lean();
            profile = processCreatorRecord(rawProfile);
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
