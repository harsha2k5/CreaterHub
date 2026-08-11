const db = require('./database.cjs');
const bcrypt = require('bcryptjs');

function seedDatabase() {
    console.log('🌱 Starting database seed initialization...');

    // Clear existing data safely
    db.prepare('DELETE FROM reports').run();
    db.prepare('DELETE FROM reviews').run();
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM conversations').run();
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM content_submissions').run();
    db.prepare('DELETE FROM collaborations').run();
    db.prepare('DELETE FROM applications').run();
    db.prepare('DELETE FROM campaigns').run();
    db.prepare('DELETE FROM portfolio_items').run();
    db.prepare('DELETE FROM social_accounts').run();
    db.prepare('DELETE FROM creators').run();
    db.prepare('DELETE FROM brands').run();
    db.prepare('DELETE FROM users').run();

    const passwordHash = bcrypt.hashSync('Password123!', 10);
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);

    // 1. Users
    const insertUser = db.prepare(`
        INSERT INTO users (id, email, password_hash, role, is_verified)
        VALUES (?, ?, ?, ?, ?)
    `);

    // Admin
    insertUser.run('user_admin', 'admin@creatorhub.io', adminPasswordHash, 'admin', 1);

    // Brands
    insertUser.run('user_ccd', 'marketing@ccd.com', passwordHash, 'brand', 1);
    insertUser.run('user_nike', 'campaigns@nike.in', passwordHash, 'brand', 1);
    insertUser.run('user_nescafe', 'campaigns@nescafe.com', passwordHash, 'brand', 1);
    insertUser.run('user_zomato', 'partnerships@zomato.com', passwordHash, 'brand', 1);

    // Creators
    insertUser.run('user_alex', 'alex@creatorhub.io', passwordHash, 'creator', 1);
    insertUser.run('user_priya', 'priya@foodvlogs.com', passwordHash, 'creator', 1);
    insertUser.run('user_rahul', 'rahul@fitlife.in', passwordHash, 'creator', 1);

    // 2. Brands Data
    const insertBrand = db.prepare(`
        INSERT INTO brands (id, user_id, company_name, business_email, phone, category, website, location_name, address, city, state, pin_code, lat, lng, gst_number, logo_url, description, rating, review_count, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBrand.run(
        'brand_ccd',
        'user_ccd',
        'Cafe Coffee Day (CCD)',
        'marketing@ccd.com',
        '+91 98765 43210',
        'Food & Beverage',
        'https://cafecoffeeday.com',
        'CCD Indiranagar Outlet',
        '100 Feet Road, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.9784,
        77.6408,
        '29AAAAA0000A1Z5',
        'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80',
        'India’s favorite neighborhood cafe chain bringing people together over coffee & snacks.',
        4.9,
        18,
        1
    );

    insertBrand.run(
        'brand_nike',
        'user_nike',
        'Nike Fitness India',
        'campaigns@nike.in',
        '+91 98765 11111',
        'Fitness & Sports',
        'https://nike.in',
        'Nike Flagship Store Indiranagar',
        '12th Main Road, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.9716,
        77.6412,
        '29BBBBB1111B2Z6',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
        'Just Do It. Premium athletic footwear, apparel and fitness training equipment.',
        4.8,
        12,
        1
    );
    insertBrand.run(
        'brand_nescafe',
        'user_nescafe',
        'Nescafé India (Nestlé)',
        'campaigns@nescafe.com',
        '+91 98765 99999',
        'Food & Beverage',
        'https://nescafe.com/in',
        'Nescafé Experience Hub',
        'MG Road Boulevard, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560001',
        12.9755,
        77.6085,
        '29CCCC0000C1Z8',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
        'It all starts with a Nescafé. Premium rich coffee blends, ready-to-drink cold coffees and cafe experiences.',
        4.95,
        35,
        1
    );

    // 3. Creators Data
    const insertCreator = db.prepare(`
        INSERT INTO creators (id, user_id, full_name, username, phone, dob, location_name, city, state, lat, lng, bio, avatar_url, categories, languages, followers, avg_views, avg_likes, avg_comments, engagement_rate, rating, review_count, profile_completion, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCreator.run(
        'creator_alex',
        'user_alex',
        'Alex Rivera',
        'alexcreates',
        '+91 99887 76655',
        '1998-05-14',
        'Indiranagar, Bengaluru',
        'Bengaluru',
        'Karnataka',
        12.9750,
        77.6380,
        'Short-form video director & tech lifestyle creator based in Namma Bengaluru 🎥☕',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        JSON.stringify(['Food', 'Lifestyle', 'Technology']),
        JSON.stringify(['English', 'Hindi', 'Kannada']),
        128000,
        45000,
        6200,
        480,
        6.4,
        4.95,
        24,
        95,
        1
    );

    insertCreator.run(
        'creator_priya',
        'user_priya',
        'Priya Sharma',
        'priyafoodie',
        '+91 98877 66554',
        1999-11-20,
        'Koramangala, Bengaluru',
        'Bengaluru',
        'Karnataka',
        12.9352,
        77.6245,
        'Exploring the best cafes, street food & fine dining in South India 🍕🧋',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        JSON.stringify(['Food', 'Travel', 'Lifestyle']),
        JSON.stringify(['English', 'Hindi']),
        85000,
        32000,
        4100,
        310,
        5.8,
        4.85,
        16,
        90,
        1
    );

    // 4. Social Accounts
    const insertSocial = db.prepare(`
        INSERT INTO social_accounts (id, creator_id, platform, handle, follower_count, profile_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertSocial.run('soc_1', 'creator_alex', 'instagram', '@alexcreates', 128000, 'https://instagram.com/alexcreates');
    insertSocial.run('soc_2', 'creator_alex', 'youtube', 'Alex Rivera Shorts', 42000, 'https://youtube.com/@alexriverashorts');

    // 5. Campaigns Data
    const insertCampaign = db.prepare(`
        INSERT INTO campaigns (id, brand_id, title, description, objective, category, location_name, outlet_name, address, city, state, pin_code, lat, lng, radius_km, min_followers, max_followers, req_categories, req_gender, req_language, req_engagement, platform, deliverables, budget_total, reward_per_creator, creators_required, creators_hired, payment_type, start_date, end_date, app_deadline, content_deadline, hashtags, mentions, guidelines, dos, donts, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCampaign.run(
        'camp_ccd_indiranagar',
        'brand_ccd',
        'CCD Indiranagar Creator Promotion',
        'CCD is launching a revamped lounge experience at our Indiranagar outlet and looking for local creators to produce authentic Instagram Reels showcasing the new ambiance, handcrafted coffee, and gourmet food menu.',
        'Drive local footfall & social awareness for the revamped Indiranagar flagship outlet.',
        'Food & Lifestyle',
        'CCD Indiranagar Outlet',
        'Cafe Coffee Day Flagship',
        '100 Feet Road, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.9784,
        77.6408,
        10.0,
        5000,
        250000,
        JSON.stringify(['Food', 'Lifestyle', 'Travel']),
        'Any',
        'English / Hindi / Kannada',
        3.0,
        'Instagram',
        JSON.stringify(['1 Instagram Reel (9:16)', '2 Instagram Stories with Geo-Tag']),
        25000,
        2500,
        10,
        2,
        'Fixed Payment + Food Voucher',
        '2026-08-15',
        '2026-09-15',
        '2026-08-25',
        '2026-09-05',
        '#CCDIndiranagar #CafeCoffeeDay #BengaluruEats',
        '@cafecoffeeday @ccd_indiranagar',
        'Feature coffee brewing visuals, show outlet interior, tag location in reel.',
        'Show natural smile, high-quality 4K vertical video, clear audio.',
        'No negative remarks, no competing brand logos visible in background.',
        'published'
    );

    insertCampaign.run(
        'camp_nike_challenge',
        'brand_nike',
        'Nike 30-Day Urban Fitness Challenge',
        'Promote the new Nike Pegasus 41 running shoes during early morning runs across Indiranagar & Cubbon Park.',
        'Product awareness & runner engagement.',
        'Fitness & Sports',
        'Nike Indiranagar Store',
        'Nike Outlet',
        '12th Main Road, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.9716,
        77.6412,
        15.0,
        10000,
        300000,
        JSON.stringify(['Fitness', 'Lifestyle']),
        'Any',
        'English',
        4.0,
        'Instagram',
        JSON.stringify(['1 Reel', '1 Story Set']),
        25000,
        5000,
        5,
        1,
        'Fixed Payment',
        '2026-08-20',
        '2026-09-20',
        '2026-08-28',
        '2026-09-10',
        '#NikeRunning #Pegasus41 #BengaluruRunners',
        '@nikeindia',
        'High energy running clips, shoe cushioning close-ups.',
        'Wear Nike apparel, highlight comfort.',
        'No unbranded footwear.',
        'published'
    );
    insertCampaign.run(
        'camp_nescafe_monsoon',
        'brand_nescafe',
        'Nescafé Intense Cold Coffee Monsoon Refresh Brief',
        'Nescafé is launching its new ready-to-drink Intense Cold Coffee cans across Bengaluru stores! We are looking for 15 lifestyle & food creators to film aesthetic reels showing how Nescafé powers their morning routine.',
        'Drive retail trial & social engagement for Nescafé Cold Coffee cans.',
        'Food & Beverage',
        'MG Road Boulevard Outlet',
        'Nescafé Experience Zone',
        'MG Road, Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560001',
        12.9755,
        77.6085,
        10.0,
        3000,
        300000,
        JSON.stringify(['Food', 'Lifestyle', 'College']),
        'Any',
        'English / Hindi',
        3.5,
        'Instagram',
        JSON.stringify(['1 Instagram Reel (15-30s)', '2 Instagram Stories with product tag']),
        45000,
        3000,
        15,
        4,
        'Fixed Escrow Payout',
        '2026-08-15',
        '2026-09-25',
        '2026-08-30',
        '2026-09-15',
        '#ItAllStartsWithANescafe #NescafeColdCoffee #BengaluruCoffee',
        '@nescafeindia',
        'Show iconic red mug or cold coffee can, aesthetic pour shot, high energy background music.',
        '4K vertical video, clear branding visible in opening 3 seconds.',
        'Do not feature competing tea/coffee brands.',
        'published'
    );

    // 6. Application & Collaboration for Demo Workflow
    const insertApp = db.prepare(`
        INSERT INTO applications (id, campaign_id, creator_id, pitch, relevant_experience, content_idea, sample_links, expected_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertApp.run(
        'app_101',
        'camp_ccd_indiranagar',
        'creator_alex',
        'Hey CCD team! As an Indiranagar local with 128k followers, I’d love to film a dynamic cinematic unboxing of your new cold brew & artisanal sandwich menu.',
        'Collaborated with 15+ F&B outlets across Bengaluru with average reel views exceeding 50,000.',
        'Start with a fast-paced 3s hook walking into CCD 100ft road, ASMR coffee pour, aesthetic seating montage, and call to action to visit!',
        'https://instagram.com/p/sample_reel_1',
        '2026-08-22',
        'accepted'
    );

    const insertCollab = db.prepare(`
        INSERT INTO collaborations (id, campaign_id, application_id, brand_id, creator_id, status, current_step)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertCollab.run(
        'collab_101',
        'camp_ccd_indiranagar',
        'app_101',
        'brand_ccd',
        'creator_alex',
        'active',
        3
    );

    // 7. Conversation & Message
    const insertConv = db.prepare(`
        INSERT INTO conversations (id, brand_id, creator_id, collaboration_id, last_message)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertConv.run('conv_101', 'brand_ccd', 'creator_alex', 'collab_101', 'Looking forward to shooting at the outlet tomorrow!');

    const insertMsg = db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, text, read_status)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertMsg.run('msg_1', 'conv_101', 'user_ccd', 'Hi Alex! We accepted your application for the CCD Indiranagar campaign.', 1);
    insertMsg.run('msg_2', 'conv_101', 'user_alex', 'Awesome! Looking forward to shooting at the outlet tomorrow!', 1);

    // 8. Notifications
    const insertNotif = db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertNotif.run('notif_1', 'user_alex', '🎉 Application Accepted!', 'CCD has accepted your application for CCD Indiranagar Creator Promotion.', '/collaborations');
    insertNotif.run('notif_2', 'user_ccd', '📥 New Creator Application', 'Alex Rivera applied for CCD Indiranagar Creator Promotion.', '/applications');

    console.log('✅ Database seeded successfully with realistic demo data!');
}

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
