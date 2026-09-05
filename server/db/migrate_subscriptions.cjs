const path = require('path');
const { query, run, queryOne } = require(path.resolve('server/db/database.cjs'));

console.log('🔄 Running Subscription Migration...');

// Check if subscription_tier column exists in creator_profiles
const tableInfo = query("PRAGMA table_info(creator_profiles)");
const columnNames = tableInfo.map(c => c.name);

if (!columnNames.includes('subscription_tier')) {
    console.log('Adding subscription_tier to creator_profiles...');
    run("ALTER TABLE creator_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free'");
}

if (!columnNames.includes('subscription_expires_at')) {
    console.log('Adding subscription_expires_at to creator_profiles...');
    run("ALTER TABLE creator_profiles ADD COLUMN subscription_expires_at TIMESTAMP");
}

if (!columnNames.includes('subscription_updated_at')) {
    console.log('Adding subscription_updated_at to creator_profiles...');
    run("ALTER TABLE creator_profiles ADD COLUMN subscription_updated_at TIMESTAMP");
}

// Create creator_subscriptions table if not exists
run(`
CREATE TABLE IF NOT EXISTS creator_subscriptions (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK(tier IN ('silver', 'gold', 'diamond')),
    price REAL NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'expired')),
    payment_method TEXT DEFAULT 'UPI',
    transaction_ref TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);

run("CREATE INDEX IF NOT EXISTS idx_sub_creator ON creator_subscriptions(creator_id)");

console.log('✅ Subscription schema migration applied successfully!');

// Verify
const updatedCols = query("PRAGMA table_info(creator_profiles)").map(c => c.name);
console.log('creator_profiles subscription columns:', updatedCols.filter(c => c.includes('sub')));
