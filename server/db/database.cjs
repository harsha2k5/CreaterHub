const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/creatorhub';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`🍃 Connected successfully to MongoDB at ${MONGODB_URI}`);
        return true;
    } catch (err) {
        console.warn(`⚠️ Could not connect to MongoDB at ${MONGODB_URI}: ${err.message}`);
        console.warn('⚠️ Please ensure MongoDB is running locally on port 27017 or set MONGODB_URI in .env.');
        return false;
    }
}

module.exports = { connectDB, mongoose };

