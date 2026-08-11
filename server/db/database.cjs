const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'platform.db');
const db = new Database(dbPath);

// Enable Foreign Key Enforcement & WAL mode for high performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Execute Tables Schema Initialization
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('brand', 'creator', 'admin')),
        is_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        business_email TEXT NOT NULL,
        phone TEXT,
        category TEXT NOT NULL,
        website TEXT,
        location_name TEXT,
        address TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pin_code TEXT,
        lat REAL DEFAULT 12.9716,
        lng REAL DEFAULT 77.5946,
        gst_number TEXT,
        logo_url TEXT,
        description TEXT,
        rating REAL DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS creators (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        phone TEXT,
        dob TEXT,
        location_name TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        lat REAL DEFAULT 12.9716,
        lng REAL DEFAULT 77.5946,
        bio TEXT,
        avatar_url TEXT,
        categories TEXT,
        languages TEXT,
        followers INTEGER DEFAULT 0,
        avg_views INTEGER DEFAULT 0,
        avg_likes INTEGER DEFAULT 0,
        avg_comments INTEGER DEFAULT 0,
        engagement_rate REAL DEFAULT 4.5,
        rating REAL DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        profile_completion INTEGER DEFAULT 85,
        verified INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS social_accounts (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        handle TEXT NOT NULL,
        follower_count INTEGER DEFAULT 0,
        profile_url TEXT,
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portfolio_items (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        objective TEXT,
        category TEXT NOT NULL,
        location_name TEXT NOT NULL,
        outlet_name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pin_code TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        radius_km REAL DEFAULT 10.0,
        min_followers INTEGER DEFAULT 1000,
        max_followers INTEGER DEFAULT 500000,
        req_categories TEXT,
        req_gender TEXT,
        req_language TEXT,
        req_engagement REAL DEFAULT 2.0,
        platform TEXT NOT NULL,
        deliverables TEXT NOT NULL,
        budget_total REAL NOT NULL,
        reward_per_creator REAL NOT NULL,
        creators_required INTEGER NOT NULL,
        creators_hired INTEGER DEFAULT 0,
        payment_type TEXT DEFAULT 'Fixed Payment',
        start_date TEXT,
        end_date TEXT,
        app_deadline TEXT,
        content_deadline TEXT,
        hashtags TEXT,
        mentions TEXT,
        guidelines TEXT,
        dos TEXT,
        donts TEXT,
        status TEXT DEFAULT 'published',
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        pitch TEXT NOT NULL,
        relevant_experience TEXT,
        content_idea TEXT NOT NULL,
        sample_links TEXT,
        expected_date TEXT,
        status TEXT DEFAULT 'submitted',
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaborations (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        brand_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        current_step INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS content_submissions (
        id TEXT PRIMARY KEY,
        collaboration_id TEXT NOT NULL,
        content_url TEXT NOT NULL,
        platform TEXT NOT NULL,
        caption TEXT,
        screenshot_url TEXT,
        notes TEXT,
        status TEXT DEFAULT 'submitted',
        brand_feedback TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collaboration_id) REFERENCES collaborations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        collaboration_id TEXT NOT NULL,
        brand_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_type TEXT DEFAULT 'Escrow Release',
        status TEXT DEFAULT 'paid',
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collaboration_id) REFERENCES collaborations(id) ON DELETE CASCADE,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        collaboration_id TEXT,
        last_message TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        attachment_url TEXT,
        read_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        collaboration_id TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        reviewee_id TEXT NOT NULL,
        reviewer_role TEXT NOT NULL,
        rating INTEGER NOT NULL,
        review_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collaboration_id) REFERENCES collaborations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_id TEXT NOT NULL,
        reported_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

module.exports = db;
