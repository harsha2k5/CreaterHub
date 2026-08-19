const { connectDB } = require('./database.cjs');
const {
    User,
    Brand,
    Creator,
    Campaign,
    Application,
    Collaboration,
    Conversation,
    Message,
    Notification,
    Review,
    Report,
    Payment,
    ContentSubmission
} = require('../models/index.cjs');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
    console.log('🌱 Starting MongoDB database seed initialization...');

    try {
        // Clear existing data safely
        await Promise.all([
            User.deleteMany({}),
            Brand.deleteMany({}),
            Creator.deleteMany({}),
            Campaign.deleteMany({}),
            Application.deleteMany({}),
            Collaboration.deleteMany({}),
            Conversation.deleteMany({}),
            Message.deleteMany({}),
            Notification.deleteMany({}),
            Review.deleteMany({}),
            Report.deleteMany({}),
            Payment.deleteMany({}),
            ContentSubmission.deleteMany({})
        ]);

        const adminPasswordHash = bcrypt.hashSync('admin123', 10);

        // 1. Users (Only Admin retained)
        await User.insertMany([
            { id: 'user_admin', email: 'admin@creatorhub.io', password_hash: adminPasswordHash, role: 'admin', is_verified: 1 }
        ]);

        console.log('✅ Database seeded successfully. All users removed except Admin (admin@creatorhub.io)!');
    } catch (err) {
        console.error('❌ Error Seeding MongoDB:', err);
    }
}

if (require.main === module) {
    (async () => {
        await connectDB();
        await seedDatabase();
        process.exit(0);
    })();
}

module.exports = seedDatabase;

