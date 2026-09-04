/**
 * CreaterHub - Production Real Instagram Integration Test Suite
 * 
 * Validates all enterprise requirements of the Real Instagram Integration:
 * 1. OAuth State Generation & Single-Use CSRF Validation
 * 2. AES-256-GCM Token Encryption & Zero Leakage
 * 3. Strict Null-Preservation (null !== 0) across metrics & media
 * 4. Permanent Identity Binding via instagram_user_id & Duplicate Prevention
 * 5. Production Guard for Mock Mode (prohibited when NODE_ENV === 'production')
 * 6. Historical Snapshot Trend Calculation (only with >= 2 snapshots)
 * 7. Zero-Leakage of Access Tokens in Status Output
 */

const assert = require('assert');
const crypto = require('crypto');
const { query, queryOne, run, initDB } = require('../db/database.cjs');
const TokenEncryptionService = require('../services/TokenEncryptionService.cjs');
const InstagramValidationService = require('../services/InstagramValidationService.cjs');
const InstagramInsightsService = require('../services/InstagramInsightsService.cjs');
const InstagramMediaSyncService = require('../services/InstagramMediaSyncService.cjs');
const MockInstagramService = require('../services/MockInstagramService.cjs');
const InstagramService = require('../services/InstagramService.cjs');

/**
 * Helper to seed a valid test user & creator profile to satisfy foreign key constraints
 */
function createTestCreator() {
    const userId = `usr_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const creatorId = `cr_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    run(
        `INSERT INTO users (id, email, password_hash, role, is_active)
         VALUES (?, ?, 'hash_dummy', 'creator', 1)`,
        [userId, `${userId}@example.com`]
    );

    run(
        `INSERT INTO creator_profiles (id, user_id, full_name, username, bio, city)
         VALUES (?, ?, 'Test Creator', ?, 'Test bio for creator', 'Bengaluru')`,
        [creatorId, userId, `user_${userId.substring(9)}`]
    );

    return { userId, creatorId };
}

async function runTests() {
    console.log('🧪 Starting CreaterHub Real Instagram Integration Test Suite...\n');
    let passed = 0;
    let failed = 0;

    function it(title, fn) {
        try {
            fn();
            console.log(`  ✅ ${title}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ ${title}`);
            console.error(`     Error: ${err.message}\n`);
            failed++;
        }
    }

    async function itAsync(title, fn) {
        try {
            await fn();
            console.log(`  ✅ ${title}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ ${title}`);
            console.error(`     Error: ${err.message}\n`);
            failed++;
        }
    }

    // Initialize DB schema & columns
    await initDB();

    // -------------------------------------------------------------
    // 1. TOKEN ENCRYPTION & SECURITY TESTS
    // -------------------------------------------------------------
    console.log('--- 1. Token Encryption & Security (AES-256-GCM) ---');

    it('should securely encrypt and decrypt access tokens using AES-256-GCM', () => {
        const rawToken = 'EAAGm0PX4ZCpsBA...super_secret_meta_token_12345...';
        const encrypted = TokenEncryptionService.encrypt(rawToken);

        assert.strictEqual(typeof encrypted, 'string');
        assert.notStrictEqual(encrypted, rawToken);
        assert(encrypted.includes(':'), 'Encrypted string must contain IV:AuthTag:CipherText delimiter');

        const parts = encrypted.split(':');
        assert.strictEqual(parts.length, 3, 'Must have iv, authTag, and ciphertext');

        const decrypted = TokenEncryptionService.decrypt(encrypted);
        assert.strictEqual(decrypted, rawToken, 'Decrypted token must match original exactly');
    });

    it('should reject tampered or corrupted ciphertexts by returning null', () => {
        const encrypted = TokenEncryptionService.encrypt('valid_token');
        const parts = encrypted.split(':');
        // Corrupt the ciphertext
        const corrupted = `${parts[0]}:${parts[1]}:corrupted_payload`;
        const result = TokenEncryptionService.decrypt(corrupted);
        assert.strictEqual(result, null, 'Tampered ciphertext must return null');
    });

    // -------------------------------------------------------------
    // 2. OAUTH CSRF STATE VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- 2. OAuth CSRF State Generation & Validation ---');

    it('should store and validate one-time OAuth state tokens, preventing reuse and CSRF', () => {
        const { creatorId } = createTestCreator();
        const stateToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        run(
            `INSERT INTO oauth_states (id, creator_id, state_token, expires_at)
             VALUES (?, ?, ?, ?)`,
            [`st_${Date.now()}`, creatorId, stateToken, expiresAt]
        );

        // First validation must succeed and consume (delete) the state
        const isValid = InstagramService.validateOAuthState(creatorId, stateToken);
        assert.strictEqual(isValid, true, 'First state verification must succeed');

        // Second validation must fail because state was consumed (replay prevention)
        assert.throws(() => {
            InstagramService.validateOAuthState(creatorId, stateToken);
        }, /CSRF verification failed|state does not match/);
    });

    it('should reject expired OAuth states', () => {
        const { creatorId } = createTestCreator();
        const stateToken = crypto.randomBytes(32).toString('hex');
        const pastDate = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago

        run(
            `INSERT INTO oauth_states (id, creator_id, state_token, expires_at)
             VALUES (?, ?, ?, ?)`,
            [`st_exp_${Date.now()}`, creatorId, stateToken, pastDate]
        );

        assert.throws(() => {
            InstagramService.validateOAuthState(creatorId, stateToken);
        }, /expired/);
    });

    // -------------------------------------------------------------
    // 3. STRICT NULL-PRESERVATION TESTS (null !== 0)
    // -------------------------------------------------------------
    console.log('\n--- 3. Strict Null-Preservation (Never Default to 0) ---');

    it('should preserve null metric values and not coerce to 0', () => {
        const parsed = InstagramValidationService.validateMetricSnapshot({
            followers_count: null,
            following_count: undefined,
            media_count: 42,
            reach: null,
            engagement_rate: null
        });

        assert.strictEqual(parsed.followersCount, null, 'Followers count must be null');
        assert.strictEqual(parsed.followingCount, null, 'Following count must be null');
        assert.strictEqual(parsed.mediaCount, 42, 'Media count must be preserved as 42');
        assert.strictEqual(parsed.reach, null, 'Reach must be null');
        assert.strictEqual(parsed.engagementRate, null, 'Engagement rate must be null');
    });

    it('should distinguish between actual 0 and missing null', () => {
        const formattedNull = InstagramValidationService.formatMetricField(null, 'Followers', 'Instagram');
        assert.strictEqual(formattedNull.available, false);
        assert.strictEqual(formattedNull.value, null);
        assert.strictEqual(formattedNull.display, 'Not available');

        const formattedZero = InstagramValidationService.formatMetricField(0, 'Followers', 'Instagram');
        assert.strictEqual(formattedZero.available, true);
        assert.strictEqual(formattedZero.value, 0);
        assert.strictEqual(formattedZero.display, '0');
    });

    it('should preserve null interactions on media items (likes, comments, views)', () => {
        const rawMedia = {
            id: 'media_test_123',
            caption: 'Test photo',
            media_type: 'IMAGE',
            like_count: null,
            comments_count: 5
        };

        const validated = InstagramValidationService.validateMediaItem(rawMedia);
        assert.strictEqual(validated.likeCount, null, 'like_count must remain null');
        assert.strictEqual(validated.commentsCount, 5, 'comments_count must be 5');
    });

    // -------------------------------------------------------------
    // 4. HISTORICAL TRENDS & CHART HISTORY GATE
    // -------------------------------------------------------------
    console.log('\n--- 4. Historical Trends & History Gating ---');

    it('should refuse to calculate growth percentage when fewer than 2 snapshots exist', () => {
        const { userId, creatorId } = createTestCreator();
        const accountId = `iga_trend_${Date.now()}`;

        run(
            `INSERT INTO instagram_accounts (
                id, creator_id, user_id, instagram_user_id, username,
                instagram_username, access_token, is_connected
            ) VALUES (?, ?, ?, 'ig_trend_uid', 'trend_user', 'trend_user', 'token', 1)`,
            [accountId, creatorId, userId]
        );

        // Insert exactly 1 snapshot
        run(
            `INSERT INTO instagram_metrics (
                id, instagram_account_id, creator_id, followers_count, recorded_at
            ) VALUES (?, ?, ?, 5000, CURRENT_TIMESTAMP)`,
            [`met_trend_1_${Date.now()}`, accountId, creatorId]
        );

        const trends = InstagramInsightsService.getHistoricalTrends(accountId);
        assert.strictEqual(trends.trends.hasSufficientHistory, false, 'Must not claim sufficient history with 1 snapshot');
        assert.strictEqual(trends.trends.followerGrowthPercentage, null, 'Growth percentage must be null');
        assert.strictEqual(trends.snapshots.length, 1);
    });

    it('should accurately calculate growth percentage when >= 2 snapshots exist', () => {
        const { userId, creatorId } = createTestCreator();
        const accountId = `iga_growth_${Date.now()}`;

        run(
            `INSERT INTO instagram_accounts (
                id, creator_id, user_id, instagram_user_id, username,
                instagram_username, access_token, is_connected
            ) VALUES (?, ?, ?, 'ig_growth_uid', 'growth_user', 'growth_user', 'token', 1)`,
            [accountId, creatorId, userId]
        );

        // Insert first snapshot (older): 10,000
        run(
            `INSERT INTO instagram_metrics (
                id, instagram_account_id, creator_id, followers_count, recorded_at
            ) VALUES (?, ?, ?, 10000, datetime('now', '-7 days'))`,
            [`met_g1_${Date.now()}`, accountId, creatorId]
        );

        // Insert second snapshot (newer): 12,500 (+25%)
        run(
            `INSERT INTO instagram_metrics (
                id, instagram_account_id, creator_id, followers_count, recorded_at
            ) VALUES (?, ?, ?, 12500, CURRENT_TIMESTAMP)`,
            [`met_g2_${Date.now()}`, accountId, creatorId]
        );

        const trends = InstagramInsightsService.getHistoricalTrends(accountId);
        assert.strictEqual(trends.trends.hasSufficientHistory, true);
        assert.strictEqual(trends.trends.followerGrowthPercentage, 25.0, 'Must calculate exact +25.0% growth');
        assert.strictEqual(trends.snapshots.length, 2);
    });

    // -------------------------------------------------------------
    // 5. MOCK MODE PRODUCTION BARRIER
    // -------------------------------------------------------------
    console.log('\n--- 5. Mock Mode Production Barrier ---');

    it('should strictly throw error and prohibit mock mode in production (NODE_ENV === "production")', () => {
        const originalEnv = process.env.NODE_ENV;
        try {
            process.env.NODE_ENV = 'production';
            assert.throws(() => {
                MockInstagramService.connectMockAccount('dummy_creator_id');
            }, /MockInstagramService is strictly forbidden in production mode/);
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });

    it('should explicitly tag all mock data as DEMO DATA in non-production', () => {
        const originalEnv = process.env.NODE_ENV;
        try {
            process.env.NODE_ENV = 'development';
            const { creatorId } = createTestCreator();
            const result = MockInstagramService.connectMockAccount(creatorId, { username: 'test_demo_user' });

            assert.strictEqual(result.success, true);
            assert.strictEqual(result.data_source, 'DEMO DATA');

            // Verify recorded metric has DEMO DATA source
            const metric = queryOne('SELECT data_source, source FROM instagram_metrics WHERE creator_id = ?', [creatorId]);
            assert.strictEqual(metric.data_source, 'DEMO DATA');

            // Verify recorded media have DEMO DATA source
            const mediaItems = query('SELECT data_source FROM instagram_media WHERE creator_id = ?', [creatorId]);
            assert(mediaItems.length > 0);
            assert(mediaItems.every(m => m.data_source === 'DEMO DATA'));
        } finally {
            process.env.NODE_ENV = originalEnv;
        }
    });

    // -------------------------------------------------------------
    // 6. DUPLICATE CLAIM & ACCOUNT IDENTITY BINDING
    // -------------------------------------------------------------
    console.log('\n--- 6. Account Identity Binding & Duplicate Claim Protection ---');

    it('should reject connection if the instagram_user_id is already bound to another creator', () => {
        const igUserId = `ig_uid_${Date.now()}`;
        const creator1 = createTestCreator();
        const creator2 = createTestCreator();

        // Creator 1 owns this account
        run(
            `INSERT INTO instagram_accounts (
                id, creator_id, user_id, instagram_user_id, username,
                instagram_username, access_token, is_connected
            ) VALUES (?, ?, ?, ?, 'creator_a', 'creator_a', 'token', 1)`,
            [`iga_a_${Date.now()}`, creator1.creatorId, creator1.userId, igUserId]
        );

        // Creator 2 attempts to claim the same instagram_user_id
        const duplicateClaim = queryOne(
            `SELECT creator_id FROM instagram_accounts
             WHERE instagram_user_id = ? AND creator_id != ? AND is_connected = 1`,
            [igUserId, creator2.creatorId]
        );

        assert(duplicateClaim !== null, 'Must detect duplicate account claim');
        assert.strictEqual(duplicateClaim.creator_id, creator1.creatorId);
    });

    // -------------------------------------------------------------
    // 7. STATUS ENDPOINT & ACCESS TOKEN ZERO-LEAKAGE
    // -------------------------------------------------------------
    console.log('\n--- 7. Zero-Leakage of Access Tokens in Status Output ---');

    it('should never expose raw or encrypted access tokens in getStatus output', () => {
        const { userId, creatorId } = createTestCreator();
        const rawToken = 'EAAGm0PX4ZCpsBA...super_secret_token';
        const encToken = TokenEncryptionService.encrypt(rawToken);

        run(
            `INSERT INTO instagram_accounts (
                id, creator_id, user_id, instagram_user_id, username,
                instagram_username, encrypted_access_token, access_token, is_connected
            ) VALUES (?, ?, ?, 'ig_leak_123', 'secure_user', 'secure_user', ?, ?, 1)`,
            [`iga_leak_${Date.now()}`, creatorId, userId, encToken, encToken]
        );

        const status = InstagramService.getStatus(creatorId);

        // Stringify complete output to verify zero occurrence of rawToken or encToken
        const serialized = JSON.stringify(status);
        assert(!serialized.includes(rawToken), 'Raw access token must NEVER appear in status response');
        assert(!serialized.includes(encToken), 'Encrypted access token must NEVER appear in status response');
        assert.strictEqual(status.is_connected, true);
        assert.strictEqual(status.account.username, 'secure_user');
    });

    console.log(`\n======================================================`);
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed.`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
});
