const bcrypt = require('bcryptjs');
const { initDB, run, queryOne, query } = require('./database.cjs');

async function seed() {
    await initDB();

    console.log('🌱 Checking seed data...');
    const userCount = queryOne('SELECT COUNT(*) as count FROM users');
    if (userCount && userCount.count > 0) {
        console.log('🌱 Database already contains data. Skipping seed.');
        return;
    }

    console.log('🌱 Seeding fresh relational database...');

    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Admin@123', salt);
    const brandHash = await bcrypt.hash('Brand@123', salt);
    const creatorHash = await bcrypt.hash('Creator@123', salt);

    // 1. Admin User
    run(
        `INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['usr_admin_1', 'admin@creatorhub.com', adminHash, 'admin', 1, 1]
    );

    // 2. Brand Users & Profiles
    const brandsData = [
        {
            userId: 'usr_brand_1',
            brandId: 'brd_1',
            email: 'brand@creatorhub.com',
            company: 'Third Wave Coffee',
            category: 'Food & Beverage',
            location: 'Indiranagar 12th Main',
            address: '724, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9784,
            lng: 77.6408,
            logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&h=200&fit=crop',
            desc: 'Specialty coffee roastery dedicated to sourcing sustainable beans and crafting artisanal coffee experiences.'
        },
        {
            userId: 'usr_brand_2',
            brandId: 'brd_2',
            email: 'contact@bluetokai.com',
            company: 'Blue Tokai Coffee Roasters',
            category: 'Food & Beverage',
            location: 'Koramangala 4th Block',
            address: '583, 80 Feet Rd, 4th Block, Koramangala, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9352,
            lng: 77.6245,
            logo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=200&h=200&fit=crop',
            desc: 'Direct-trade Indian specialty coffee pioneer bringing single-estate roasts straight to coffee enthusiasts.'
        },
        {
            userId: 'usr_brand_3',
            brandId: 'brd_3',
            email: 'partner@cultfit.com',
            company: 'Cult.fit Studio',
            category: 'Fitness & Wellness',
            location: 'HSR Layout Sector 3',
            address: '17th Cross Rd, Sector 3, HSR Layout, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9121,
            lng: 77.6446,
            logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop',
            desc: 'Holistic health & fitness platform offering group workouts, strength conditioning, and functional training.'
        },
        {
            userId: 'usr_brand_4',
            brandId: 'brd_4',
            email: 'hello@organicharvest.com',
            company: 'Organic Harvest Wellness',
            category: 'Beauty & Skincare',
            location: 'Whitefield Main Rd',
            address: 'Forum Shantiniketan Mall, Whitefield, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9892,
            lng: 77.7289,
            logo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&h=200&fit=crop',
            desc: 'Certified organic personal care brand committed to toxin-free, cruelty-free beauty essentials.'
        },
        {
            userId: 'usr_brand_5',
            brandId: 'brd_5',
            email: 'events@socialoffline.in',
            company: 'Church Street Social',
            category: 'Dining & Nightlife',
            location: 'Church Street',
            address: '46/1, Cobalt Building, Church St, Shanthala Nagar, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9749,
            lng: 77.6045,
            logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
            desc: 'The iconic urban hangout blending collaborative workspace by day with vibrant high-energy nightlife.'
        }
    ];

    for (const b of brandsData) {
        run(
            `INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
             VALUES (?, ?, ?, 'brand', 1, 1)`,
            [b.userId, b.email, brandHash]
        );

        run(
            `INSERT INTO brand_profiles (id, user_id, company_name, business_email, category, location_name, address, city, lat, lng, logo_url, description)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [b.brandId, b.userId, b.company, b.email, b.category, b.location, b.address, b.city, b.lat, b.lng, b.logo, b.desc]
        );
    }

    // 3. Creator Users & Profiles (clearly designated Demo Profiles)
    const creatorsData = [
        {
            userId: 'usr_creator_1',
            creatorId: 'crt_1',
            email: 'creator@creatorhub.com',
            name: 'Ananya Rao',
            username: 'ananya_bites',
            city: 'Bengaluru',
            area: 'Indiranagar',
            lat: 12.9719,
            lng: 77.6412,
            bio: 'Bengaluru foodie & café explorer discovering hidden culinary gems, specialty pour-overs, and local artisanal bakes.',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
            categories: JSON.stringify(['Food & Dining', 'Coffee', 'Lifestyle']),
            minBudget: 4000
        },
        {
            userId: 'usr_creator_2',
            creatorId: 'crt_2',
            email: 'creator2@creatorhub.com',
            name: 'Kabir Verma',
            username: 'kabir_fit',
            city: 'Bengaluru',
            area: 'HSR Layout',
            lat: 12.9116,
            lng: 77.6432,
            bio: 'Functional athlete & endurance coach inspiring healthy, active lifestyles with nutrition and high-energy routines.',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
            categories: JSON.stringify(['Fitness & Wellness', 'Health', 'Activewear']),
            minBudget: 5000
        },
        {
            userId: 'usr_creator_3',
            creatorId: 'crt_3',
            email: 'creator3@creatorhub.com',
            name: 'Tara Sen',
            username: 'tara_creates',
            city: 'Bengaluru',
            area: 'Koramangala',
            lat: 12.9348,
            lng: 77.6251,
            bio: 'Contemporary visual artist & lifestyle creator capturing city culture, indie design pop-ups, and mindful living.',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
            categories: JSON.stringify(['Art & Culture', 'Fashion', 'Lifestyle']),
            minBudget: 6000
        }
    ];

    for (const c of creatorsData) {
        run(
            `INSERT INTO users (id, email, password_hash, role, is_verified, is_active)
             VALUES (?, ?, ?, 'creator', 1, 1)`,
            [c.userId, c.email, creatorHash]
        );

        run(
            `INSERT INTO creator_profiles (id, user_id, full_name, username, city, area, lat, lng, bio, avatar_url, categories_json, min_budget)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.creatorId, c.userId, c.name, c.username, c.city, c.area, c.lat, c.lng, c.bio, c.avatar, c.categories, c.minBudget]
        );
    }

    // 4. Live Campaigns
    const campaignsData = [
        {
            id: 'cmp_1',
            brandId: 'brd_1',
            title: 'Artisanal Cold Brew Tasting & Reel Promo',
            desc: 'Launch of our seasonal Cascara cold brew series! Visit our 12th Main Indiranagar roastery, record an aesthetic 30s Reel capturing the brew craft, and share your genuine tasting notes.',
            category: 'Food & Beverage',
            image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&h=500&fit=crop',
            location: 'Indiranagar 12th Main',
            address: '724, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9784,
            lng: 77.6408,
            radiusKm: 10.0,
            minFollowers: 1000,
            maxFollowers: 100000,
            reqCats: JSON.stringify(['Food & Dining', 'Coffee', 'Lifestyle']),
            reqEngagement: 2.0,
            deliverables: JSON.stringify([
                { type: 'Reel', count: 1, requirement: '1x 30-45s Reel showcasing cold brew bar and tasting' },
                { type: 'Story', count: 2, requirement: '2x Stories with outlet location tag and discount promo code' }
            ]),
            budgetTotal: 24000,
            rewardPerCreator: 6000,
            creatorsRequired: 4,
            creatorsHired: 1,
            startDate: '2026-09-01',
            endDate: '2026-09-20',
            appDeadline: '2026-09-12',
            status: 'PUBLISHED'
        },
        {
            id: 'cmp_2',
            brandId: 'brd_2',
            title: 'Specialty Pour-Over Experience & Vlogs',
            desc: 'Inviting coffee lovers for an interactive cupping workshop in Koramangala. Capture our estate origin stories, interact with our head roaster, and share an engaging carousel or vlog.',
            category: 'Food & Beverage',
            image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=500&fit=crop',
            location: 'Koramangala 80ft Road',
            address: '583, 80 Feet Rd, 4th Block, Koramangala, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9352,
            lng: 77.6245,
            radiusKm: 8.0,
            minFollowers: 1500,
            maxFollowers: 150000,
            reqCats: JSON.stringify(['Food & Dining', 'Lifestyle']),
            reqEngagement: 2.5,
            deliverables: JSON.stringify([
                { type: 'Reel', count: 1, requirement: '1x High-quality cupping Reel' },
                { type: 'Carousel', count: 1, requirement: '1x 5-slide flavor note breakdown' }
            ]),
            budgetTotal: 15000,
            rewardPerCreator: 5000,
            creatorsRequired: 3,
            creatorsHired: 0,
            startDate: '2026-09-05',
            endDate: '2026-09-25',
            appDeadline: '2026-09-15',
            status: 'PUBLISHED'
        },
        {
            id: 'cmp_3',
            brandId: 'brd_3',
            title: 'High-Intensity Fitness Bootcamp Review',
            desc: 'Experience our high-octane HRX & S&C conditioning session in HSR Layout. Test your endurance, record an authentic workout vlog, and spotlight community energy.',
            category: 'Fitness & Wellness',
            image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop',
            location: 'HSR Layout Sector 3',
            address: '17th Cross Rd, Sector 3, HSR Layout, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9121,
            lng: 77.6446,
            radiusKm: 12.0,
            minFollowers: 2000,
            maxFollowers: 200000,
            reqCats: JSON.stringify(['Fitness & Wellness', 'Activewear', 'Health']),
            reqEngagement: 3.0,
            deliverables: JSON.stringify([
                { type: 'Reel', count: 1, requirement: '1x High-energy workout recap with beat drop' },
                { type: 'Story', count: 3, requirement: '3x Live Stories during session' }
            ]),
            budgetTotal: 42500,
            rewardPerCreator: 8500,
            creatorsRequired: 5,
            creatorsHired: 1,
            startDate: '2026-09-02',
            endDate: '2026-09-30',
            appDeadline: '2026-09-18',
            status: 'PUBLISHED'
        },
        {
            id: 'cmp_4',
            brandId: 'brd_4',
            title: 'Clean Skincare Weekend Pop-up Showcase',
            desc: 'Organic Harvest is hosting a bespoke skincare ritual pop-up at Forum Shantiniketan Whitefield. Creators receive full complimentary ritual kit and exclusive behind-the-counter access.',
            category: 'Beauty & Skincare',
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=500&fit=crop',
            location: 'Forum Shantiniketan, Whitefield',
            address: 'Whitefield Main Rd, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9892,
            lng: 77.7289,
            radiusKm: 15.0,
            minFollowers: 1000,
            maxFollowers: 250000,
            reqCats: JSON.stringify(['Beauty & Skincare', 'Lifestyle']),
            reqEngagement: 2.2,
            deliverables: JSON.stringify([
                { type: 'Reel', count: 1, requirement: '1x AM/PM ritual routine with texture shots' },
                { type: 'Post', count: 1, requirement: '1x Static review post with clean ingredient highlights' }
            ]),
            budgetTotal: 21000,
            rewardPerCreator: 7000,
            creatorsRequired: 3,
            creatorsHired: 0,
            startDate: '2026-09-10',
            endDate: '2026-10-05',
            appDeadline: '2026-09-22',
            status: 'PUBLISHED'
        },
        {
            id: 'cmp_5',
            brandId: 'brd_5',
            title: 'Weekend Sundowner Nightlife Reels',
            desc: 'Friday night sundowner sessions at Church Street Social. Capture cocktails, live DJ sets, and electric crowd vibes in the heart of the city.',
            category: 'Dining & Nightlife',
            image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
            location: 'Church Street Social',
            address: '46/1, Cobalt Building, Church St, Bengaluru',
            city: 'Bengaluru',
            lat: 12.9749,
            lng: 77.6045,
            radiusKm: 10.0,
            minFollowers: 3000,
            maxFollowers: 300000,
            reqCats: JSON.stringify(['Dining & Nightlife', 'Lifestyle', 'Music']),
            reqEngagement: 3.5,
            deliverables: JSON.stringify([
                { type: 'Reel', count: 1, requirement: '1x Vibrant nightlife transitions Reel' },
                { type: 'Story', count: 4, requirement: '4x Real-time party stories' }
            ]),
            budgetTotal: 60000,
            rewardPerCreator: 10000,
            creatorsRequired: 6,
            creatorsHired: 0,
            startDate: '2026-09-08',
            endDate: '2026-09-28',
            appDeadline: '2026-09-14',
            status: 'PUBLISHED'
        }
    ];

    for (const cmp of campaignsData) {
        run(
            `INSERT INTO campaigns (id, brand_id, title, description, category, image_url, location_name, address, city, lat, lng, radius_km, min_followers, max_followers, req_categories_json, req_engagement, deliverables_json, budget_total, reward_per_creator, creators_required, creators_hired, start_date, end_date, app_deadline, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cmp.id, cmp.brandId, cmp.title, cmp.desc, cmp.category, cmp.image,
                cmp.location, cmp.address, cmp.city, cmp.lat, cmp.lng, cmp.radiusKm,
                cmp.minFollowers, cmp.maxFollowers, cmp.reqCats, cmp.reqEngagement,
                cmp.deliverables, cmp.budgetTotal, cmp.rewardPerCreator, cmp.creatorsRequired,
                cmp.creatorsHired, cmp.startDate, cmp.endDate, cmp.appDeadline, cmp.status
            ]
        );
    }

    // 5. Sample Collaboration & Escrow
    run(
        `INSERT INTO campaign_applications (id, campaign_id, creator_id, brand_id, pitch, relevant_experience, availability, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            'app_1', 'cmp_1', 'crt_1', 'brd_1',
            'I frequent Third Wave Indiranagar weekly! I would love to craft a 4K 60fps aesthetic pour-over transition reel showing the rich crema and modern interiors.',
            'Collaborated with Blue Tokai and Starbucks India on Instagram reels reaching 45k+ organic views.',
            'Available this Saturday afternoon',
            'ACCEPTED'
        ]
    );

    run(
        `INSERT INTO collaborations (id, campaign_id, application_id, brand_id, creator_id, status, current_step)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', 2)`,
        ['collab_1', 'cmp_1', 'app_1', 'brd_1', 'crt_1']
    );

    run(
        `INSERT INTO payments (id, collaboration_id, brand_id, creator_id, amount, status, is_simulated, transaction_ref)
         VALUES (?, ?, ?, ?, ?, 'HELD_IN_ESCROW', 1, ?)`,
        ['pay_1', 'collab_1', 'brd_1', 'crt_1', 6000, 'TXN_SIM_ESCROW_' + Date.now()]
    );

    // Sample Conversation
    run(
        `INSERT INTO conversations (id, brand_id, creator_id, campaign_id, last_message)
         VALUES (?, ?, ?, ?, ?)`,
        ['conv_1', 'brd_1', 'crt_1', 'cmp_1', 'Welcome to the campaign Ananya! We are excited to see your craft reel draft.']
    );

    run(
        `INSERT INTO messages (id, conversation_id, sender_id, text, read_status)
         VALUES (?, ?, ?, ?, 1)`,
        ['msg_1', 'conv_1', 'usr_brand_1', 'Welcome to the campaign Ananya! We are excited to see your craft reel draft.']
    );

    console.log('✅ Seed completed successfully with realistic brands, campaigns, and admin account.');
}

module.exports = seed;

if (require.main === module) {
    seed().catch(console.error);
}
