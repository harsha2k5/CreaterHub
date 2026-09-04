const assert = require('assert');
const { initDB, queryOne, run } = require('../db/database.cjs');
const seed = require('../db/seed.cjs');
const PaymentService = require('../services/PaymentService.cjs');

async function testCollaborationFlow() {
    console.log('🧪 Running Test: Campaign Application & Collaboration Lifecycle...');
    await initDB();
    await seed();

    const creator = queryOne("SELECT id, user_id FROM creator_profiles WHERE username = 'kabir_fit'");
    const campaign = queryOne("SELECT id, brand_id, reward_per_creator FROM campaigns WHERE title LIKE '%Fitness%'");

    assert(creator, 'Creator must exist.');
    assert(campaign, 'Campaign must exist.');

    // 1. Submit Application
    const appId = `app_test_${Date.now()}`;
    run(
        `INSERT INTO campaign_applications (
            id, campaign_id, creator_id, brand_id, pitch, status
        ) VALUES (?, ?, ?, ?, 'Ready to film workout recap reel!', 'PENDING')`,
        [appId, campaign.id, creator.id, campaign.brand_id]
    );

    const createdApp = queryOne('SELECT * FROM campaign_applications WHERE id = ?', [appId]);
    assert(createdApp, 'Application must be saved in database.');
    assert.strictEqual(createdApp.status, 'PENDING');

    // 2. Brand Accepts Application -> Initializes Collaboration & Escrow
    const collabId = `collab_test_${Date.now()}`;
    run(
        `INSERT INTO collaborations (id, campaign_id, application_id, brand_id, creator_id, status, current_step)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1)`,
        [collabId, campaign.id, appId, campaign.brand_id, creator.id]
    );

    const escrowResult = await PaymentService.holdInEscrow({
        collaborationId: collabId,
        brandId: campaign.brand_id,
        creatorId: creator.id,
        amount: campaign.reward_per_creator
    });

    console.log(`  Escrow locked: ₹${escrowResult.amount} (${escrowResult.provider_mode})`);
    assert.strictEqual(escrowResult.status, 'HELD_IN_ESCROW');
    assert.strictEqual(escrowResult.is_simulated, true, 'Development mode must be simulated escrow.');

    // 3. Creator Submits Deliverables
    const delivId = `del_test_${Date.now()}`;
    run(
        `INSERT INTO deliverables (id, collaboration_id, live_post_url, caption, status)
         VALUES (?, ?, 'https://instagram.com/p/testreel123', 'High intensity session at Cult.fit!', 'SUBMITTED')`,
        [delivId, collabId]
    );
    run("UPDATE collaborations SET status = 'SUBMITTED', current_step = 3 WHERE id = ?", [collabId]);

    const collabAfterSubmit = queryOne('SELECT * FROM collaborations WHERE id = ?', [collabId]);
    assert.strictEqual(collabAfterSubmit.status, 'SUBMITTED');
    assert.strictEqual(collabAfterSubmit.current_step, 3);

    // 4. Brand Approves Deliverables -> Releases Escrow
    const releaseResult = await PaymentService.releaseEscrow(collabId);
    console.log(`  Escrow released: status = ${releaseResult.status}`);
    assert.strictEqual(releaseResult.status, 'RELEASED');

    run("UPDATE collaborations SET status = 'COMPLETED', current_step = 4 WHERE id = ?", [collabId]);
    const finalCollab = queryOne('SELECT * FROM collaborations WHERE id = ?', [collabId]);
    assert.strictEqual(finalCollab.status, 'COMPLETED');
    assert.strictEqual(finalCollab.current_step, 4);

    console.log('✅ Campaign Application & Collaboration Lifecycle Test Passed!');
}

if (require.main === module) {
    testCollaborationFlow().catch(err => {
        console.error('❌ Collaboration test failed:', err);
        process.exit(1);
    });
}

module.exports = testCollaborationFlow;
