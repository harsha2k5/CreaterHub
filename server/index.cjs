const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db/database.cjs');
const seedDatabase = require('./db/seed.cjs');
const { User } = require('./models/index.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes Registration
app.use('/api/auth', require('./routes/auth.cjs'));
app.use('/api/campaigns', require('./routes/campaigns.cjs'));
app.use('/api/applications', require('./routes/applications.cjs'));
app.use('/api/collaborations', require('./routes/collaborations.cjs'));
app.use('/api/creators', require('./routes/creators.cjs').router);
app.use('/api/brands', require('./routes/brands.cjs'));
app.use('/api/messages', require('./routes/messages.cjs'));
app.use('/api/notifications', require('./routes/notifications.cjs'));
app.use('/api/reviews', require('./routes/reviews.cjs'));
app.use('/api/reports', require('./routes/reports.cjs'));
app.use('/api/admin', require('./routes/admin.cjs'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'API Operational (MongoDB)', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error. ' + err.message });
});

// Connect to Database and start Express Server
async function startServer() {
    const dbConnected = await connectDB();

    if (dbConnected) {
        try {
            // Check if database needs initial seeding
            const userCount = await User.countDocuments({});
            if (userCount === 0) {
                console.log('🌱 Database is empty. Running initial seed...');
                await seedDatabase();
            }
        } catch (err) {
            console.error('⚠️ DB Seed Error:', err.message);
        }
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Brand x Creator API Server running on port ${PORT}`);
    });
}

startServer();

