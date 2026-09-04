const assert = require('assert');
const { initDB, queryOne, run } = require('../db/database.cjs');
const seed = require('../db/seed.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth.cjs');

async function testAuthAndRoles() {
    console.log('🧪 Running Test: Authentication & Role Enforcement...');
    await initDB();
    await seed();

    // 1. Verify Admin User Exists
    const admin = queryOne("SELECT * FROM users WHERE email = 'admin@creatorhub.com'");
    assert(admin, 'Admin user must exist in seed data.');
    assert.strictEqual(admin.role, 'admin', 'Admin role must be admin.');
    const adminPasswordMatch = await bcrypt.compare('Admin@123', admin.password_hash);
    assert(adminPasswordMatch, 'Admin password must match Admin@123.');

    // 2. Verify Brand User & Profile
    const brandUser = queryOne("SELECT * FROM users WHERE email = 'brand@creatorhub.com'");
    assert(brandUser, 'Brand user must exist in seed data.');
    assert.strictEqual(brandUser.role, 'brand', 'Brand role must be brand.');
    const brandProfile = queryOne('SELECT * FROM brand_profiles WHERE user_id = ?', [brandUser.id]);
    assert(brandProfile, 'Brand profile must exist.');
    assert.strictEqual(brandProfile.company_name, 'Third Wave Coffee');

    // 3. Verify Creator User & Profile
    const creatorUser = queryOne("SELECT * FROM users WHERE email = 'creator@creatorhub.com'");
    assert(creatorUser, 'Creator user must exist in seed data.');
    assert.strictEqual(creatorUser.role, 'creator', 'Creator role must be creator.');
    const creatorProfile = queryOne('SELECT * FROM creator_profiles WHERE user_id = ?', [creatorUser.id]);
    assert(creatorProfile, 'Creator profile must exist.');
    assert.strictEqual(creatorProfile.full_name, 'Ananya Rao');

    // 4. Test JWT Signing & Role Decoding
    const token = jwt.sign({ id: creatorUser.id, email: creatorUser.email, role: 'creator' }, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.role, 'creator');
    assert.strictEqual(decoded.email, 'creator@creatorhub.com');

    console.log('✅ Authentication & Role Enforcement Test Passed!');
}

if (require.main === module) {
    testAuthAndRoles().catch(err => {
        console.error('❌ Auth test failed:', err);
        process.exit(1);
    });
}

module.exports = testAuthAndRoles;
