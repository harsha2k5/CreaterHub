-- CreaterHub Normalized Relational Database Schema
-- Compatible with SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('creator', 'brand', 'admin')),
    is_verified INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS creator_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone TEXT,
    dob TEXT,
    city TEXT NOT NULL,
    area TEXT,
    state TEXT DEFAULT 'Karnataka',
    lat REAL DEFAULT 12.9716,
    lng REAL DEFAULT 77.5946,
    bio TEXT,
    avatar_url TEXT,
    categories_json TEXT DEFAULT '[]',
    languages_json TEXT DEFAULT '[]',
    collab_preferences_json TEXT DEFAULT '[]',
    min_budget REAL DEFAULT 3000,
    radius_km REAL DEFAULT 15.0,
    rate_card_json TEXT DEFAULT '{"reel": 6500, "story": 2500, "post": 4000, "combo": 11000}',
    availability TEXT DEFAULT 'available',
    verified INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'none',
    verification_docs TEXT,
    social_link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_username ON creator_profiles(username);
CREATE INDEX IF NOT EXISTS idx_creator_location ON creator_profiles(city, lat, lng);

CREATE TABLE IF NOT EXISTS brand_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    phone TEXT,
    category TEXT NOT NULL,
    website TEXT,
    location_name TEXT,
    address TEXT,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    pin_code TEXT,
    lat REAL DEFAULT 12.9716,
    lng REAL DEFAULT 77.5946,
    gst_number TEXT,
    logo_url TEXT,
    description TEXT,
    rating REAL DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brand_user_id ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_location ON brand_profiles(city, lat, lng);

CREATE TABLE IF NOT EXISTS instagram_accounts (
    id TEXT PRIMARY KEY,
    creator_id TEXT UNIQUE NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instagram_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    full_name TEXT,
    profile_picture_url TEXT,
    bio TEXT,
    account_type TEXT DEFAULT 'BUSINESS',
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMP,
    connection_status TEXT DEFAULT 'CONNECTED',
    is_connected INTEGER DEFAULT 1,
    is_realtime_sync INTEGER DEFAULT 1,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ig_creator_id ON instagram_accounts(creator_id);
CREATE INDEX IF NOT EXISTS idx_ig_user_id ON instagram_accounts(instagram_user_id);

CREATE TABLE IF NOT EXISTS instagram_metrics (
    id TEXT PRIMARY KEY,
    instagram_account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    followers_count INTEGER DEFAULT 0,
    follows_count INTEGER DEFAULT 0,
    media_count INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate REAL DEFAULT 0.0,
    source TEXT DEFAULT 'LIVE_API',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_account ON instagram_metrics(instagram_account_id, recorded_at);

CREATE TABLE IF NOT EXISTS instagram_media (
    id TEXT PRIMARY KEY,
    instagram_account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    caption TEXT,
    media_type TEXT DEFAULT 'IMAGE',
    media_url TEXT,
    thumbnail_url TEXT,
    permalink TEXT,
    like_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_account ON instagram_media(instagram_account_id, timestamp);

CREATE TABLE IF NOT EXISTS instagram_insights (
    id TEXT PRIMARY KEY,
    instagram_account_id TEXT NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    period TEXT DEFAULT 'day',
    value REAL DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_creator_analyses (
    id TEXT PRIMARY KEY,
    creator_id TEXT UNIQUE NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    engagement_score INTEGER NOT NULL,
    consistency_score INTEGER NOT NULL,
    content_score INTEGER NOT NULL,
    audience_score INTEGER NOT NULL,
    brand_suitability_score INTEGER NOT NULL,
    strengths_json TEXT DEFAULT '[]',
    weaknesses_json TEXT DEFAULT '[]',
    recommendations_json TEXT DEFAULT '[]',
    content_insights_json TEXT DEFAULT '[]',
    summary TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_creator_id ON ai_creator_analyses(creator_id);

CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    objective TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    location_name TEXT NOT NULL,
    address TEXT,
    city TEXT DEFAULT 'Bengaluru',
    state TEXT DEFAULT 'Karnataka',
    pin_code TEXT,
    lat REAL DEFAULT 12.9716,
    lng REAL DEFAULT 77.5946,
    radius_km REAL DEFAULT 10.0,
    min_followers INTEGER DEFAULT 1000,
    max_followers INTEGER DEFAULT 500000,
    req_categories_json TEXT DEFAULT '[]',
    req_engagement REAL DEFAULT 2.0,
    deliverables_json TEXT NOT NULL,
    budget_total REAL NOT NULL,
    reward_per_creator REAL NOT NULL,
    creators_required INTEGER NOT NULL,
    creators_hired INTEGER DEFAULT 0,
    platform TEXT DEFAULT 'Instagram',
    start_date TEXT,
    end_date TEXT,
    app_deadline TEXT,
    content_deadline TEXT,
    status TEXT DEFAULT 'PUBLISHED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON campaigns(city, lat, lng);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS campaign_applications (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    pitch TEXT NOT NULL,
    relevant_experience TEXT,
    content_idea TEXT,
    sample_links TEXT,
    proposed_budget REAL,
    proposed_deliverables TEXT,
    availability TEXT DEFAULT 'immediate',
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apps_campaign ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_apps_creator ON campaign_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_apps_brand ON campaign_applications(brand_id);

CREATE TABLE IF NOT EXISTS collaborations (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    application_id TEXT NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELLED')),
    current_step INTEGER DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_creator ON collaborations(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_brand ON collaborations(brand_id);

CREATE TABLE IF NOT EXISTS deliverables (
    id TEXT PRIMARY KEY,
    collaboration_id TEXT NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    live_post_url TEXT NOT NULL,
    platform TEXT DEFAULT 'Instagram',
    caption TEXT,
    screenshot_url TEXT,
    notes TEXT,
    brand_feedback TEXT,
    status TEXT DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
    last_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conv_participants ON conversations(brand_id, creator_id);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    attachment_url TEXT,
    read_status INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, sent_at);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    collaboration_id TEXT NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_role TEXT NOT NULL CHECK(reviewer_role IN ('creator', 'brand')),
    rating REAL NOT NULL,
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    collaboration_id TEXT NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_type TEXT DEFAULT 'Escrow Release',
    status TEXT DEFAULT 'HELD_IN_ESCROW' CHECK(status IN ('HELD_IN_ESCROW', 'RELEASED', 'REFUNDED', 'PENDING')),
    is_simulated INTEGER DEFAULT 1,
    transaction_ref TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read_status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_status);

CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_actions (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_logs (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    instagram_account_id TEXT,
    status TEXT NOT NULL,
    metrics_updated_count INTEGER DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INTEGER DEFAULT 0,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_creator ON refresh_logs(creator_id, logged_at);
