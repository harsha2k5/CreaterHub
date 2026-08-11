const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'creatorhub_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or expired session token.' });
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized.' });
        }
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: `Access restricted to ${role} role.` });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    requireBrand: requireRole('brand'),
    requireCreator: requireRole('creator'),
    requireAdmin: requireRole('admin')
};
