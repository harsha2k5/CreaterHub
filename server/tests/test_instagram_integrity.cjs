const assert = require('assert');
const { initDB, queryOne } = require('../db/database.cjs');
const seed = require('../db/seed.cjs');
const InstagramService = require('../services/InstagramService.cjs');
const AIAnalysisService = require('../services/AIAnalysisService.cjs');

async function testInstagramIntegrity() {
    console.log('🧪 Running Test: Instagram Zero Fake Data Policy & Integrity...');
    await initDB();
    await seed();

    // 1. Check an unauthenticated creator (reset first to ensure clean test state)
    const creator = queryOne("SELECT id FROM creator_profiles WHERE username = 'ananya_bites'");
    assert(creator, 'Creator ananya_bites must exist in database.');
    InstagramService.disconnect(creator.id);

    const status = InstagramService.getStatus(creator.id);
    console.log('  Status for unconnected account:', status.connection_status);
    assert.strictEqual(status.is_connected, false, 'Account must not be marked connected when OAuth has not been completed.');
    assert.strictEqual(status.connection_status, 'NOT_CONNECTED');
    assert.strictEqual(status.metrics, null, 'Must not return fake metrics when unconnected.');

    // 2. Verify AI Analysis refuses to generate when Instagram is not synchronized
    let aiErrorCaught = false;
    try {
        await AIAnalysisService.analyzeCreator(creator.id);
    } catch (err) {
        aiErrorCaught = true;
        console.log('  AI Analysis successfully blocked with error:', err.message);
        assert(err.message.includes('More Instagram data is required'), 'Must require real Instagram data.');
    }
    assert(aiErrorCaught, 'AI Analysis must throw error if Instagram data is missing or unauthenticated.');

    // 3. Verify diagnostics report
    const diag = InstagramService.getConfigDiagnostics();
    console.log('  Diagnostics report:', JSON.stringify(diag.sync_statistics));
    assert(diag !== null && typeof diag === 'object');
    assert(typeof diag.is_configured === 'boolean');

    // 4. Verify Developer Sandbox Mode connection and explicit watermarking
    const sandboxResult = InstagramService.connectSandboxAccount(creator.id);
    assert.strictEqual(sandboxResult.success, true);
    assert.strictEqual(sandboxResult.is_sandbox, true);

    const sandboxStatus = InstagramService.getStatus(creator.id);
    assert.strictEqual(sandboxStatus.is_connected, true);
    assert.strictEqual(sandboxStatus.is_sandbox, true);
    assert.strictEqual(sandboxStatus.sandbox_badge, 'SANDBOX / DEV MODE — NOT REAL DATA');
    assert.strictEqual(sandboxStatus.metrics.followers.source, 'SANDBOX_DEV_MODE');
    console.log('  Sandbox Account connected with watermarked badge:', sandboxStatus.sandbox_badge);

    // 5. Verify disconnect resets state cleanly
    InstagramService.disconnect(creator.id);
    const resetStatus = InstagramService.getStatus(creator.id);
    assert.strictEqual(resetStatus.is_connected, false);
    assert.strictEqual(resetStatus.connection_status, 'NOT_CONNECTED');
    console.log('  Account disconnected and reset cleanly.');

    console.log('✅ Instagram Zero Fake Data Policy & Integrity Test Passed!');
}

if (require.main === module) {
    testInstagramIntegrity().catch(err => {
        console.error('❌ Instagram integrity test failed:', err);
        process.exit(1);
    });
}

module.exports = testInstagramIntegrity;
