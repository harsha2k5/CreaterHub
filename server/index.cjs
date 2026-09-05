const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB, queryOne } = require('./db/database.cjs');
const seed = require('./db/seed.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            if (!req.path.startsWith('/api/health')) {
                const duration = Date.now() - start;
                console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
            }
        });
        next();
    });
}

// Mount API Modules
app.use('/api/auth', require('./routes/auth.cjs'));
app.use('/api/campaigns', require('./routes/campaigns.cjs'));
app.use('/api/applications', require('./routes/applications.cjs'));
app.use('/api/collaborations', require('./routes/collaborations.cjs'));
app.use('/api/creators', require('./routes/creators.cjs'));
app.use('/api/brands', require('./routes/brands.cjs'));
app.use('/api/instagram', require('./routes/instagram.cjs'));
app.use('/api/ai', require('./routes/ai.cjs'));
app.use('/api/payments', require('./routes/payments.cjs'));
app.use('/api/messages', require('./routes/messages.cjs'));
app.use('/api/reviews', require('./routes/reviews.cjs'));
app.use('/api/notifications', require('./routes/notifications.cjs'));
app.use('/api/subscriptions', require('./routes/subscriptions.cjs').router);
app.use('/api/admin', require('./routes/admin.cjs'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'CreaterHub Production API Operational',
        database: 'Normalized Relational Engine (SQLite/PostgreSQL)',
        timestamp: new Date().toISOString()
    });
});

// Global 404 handler for unmatched API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Server Uncaught Error]', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message
    });
});

// Server Initialization
async function startServer() {
    try {
        await initDB();
        await seed();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n=================================================`);
            console.log(`🚀 CreaterHub Core API Server Running on Port ${PORT}`);
            console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🛡️ Architecture: Real Data First. No Fake Data.`);
            console.log(`=================================================\n`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
