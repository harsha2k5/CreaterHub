const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, required: true, enum: ['brand', 'creator', 'admin'] },
    is_verified: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

// Brand Schema
const brandSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, unique: true },
    company_name: { type: String, required: true },
    business_email: { type: String, required: true },
    phone: { type: String },
    category: { type: String, required: true },
    website: { type: String },
    location_name: { type: String },
    address: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pin_code: { type: String },
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    gst_number: { type: String },
    logo_url: { type: String },
    description: { type: String },
    rating: { type: Number, default: 5.0 },
    review_count: { type: Number, default: 0 },
    verified: { type: Number, default: 1 }
});

// Social Account Sub-Schema
const socialAccountSchema = new mongoose.Schema({
    id: { type: String, required: true },
    creator_id: { type: String, required: true },
    platform: { type: String, required: true },
    handle: { type: String, required: true },
    follower_count: { type: Number, default: 0 },
    profile_url: { type: String }
});

// Portfolio Item Sub-Schema
const portfolioItemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    creator_id: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail_url: { type: String }
});

// Creator Schema
const creatorSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    phone: { type: String },
    dob: { type: String },
    location_name: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    bio: { type: String },
    avatar_url: { type: String },
    categories: { type: mongoose.Schema.Types.Mixed, default: [] },
    languages: { type: mongoose.Schema.Types.Mixed, default: [] },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 412 },
    posts_count: { type: Number, default: 342 },
    reels_count: { type: Number, default: 186 },
    avg_views: { type: Number, default: 45200 },
    avg_likes: { type: Number, default: 8650 },
    avg_comments: { type: Number, default: 640 },
    engagement_rate: { type: Number, default: 4.5 },
    rating: { type: Number, default: 5.0 },
    review_count: { type: Number, default: 0 },
    profile_completion: { type: Number, default: 85 },
    verified: { type: Number, default: 1 },
    social_link: { type: String, default: '' },
    profile_analysis: { type: mongoose.Schema.Types.Mixed, default: null },
    followers_list: { type: mongoose.Schema.Types.Mixed, default: [] },
    following_list: { type: mongoose.Schema.Types.Mixed, default: [] },
    social_accounts: [socialAccountSchema],
    portfolio_items: [portfolioItemSchema]
});

// Campaign Schema
const campaignSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    brand_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    objective: { type: String },
    category: { type: String, required: true },
    location_name: { type: String, required: true },
    outlet_name: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: 'Bengaluru' },
    state: { type: String, default: 'Karnataka' },
    pin_code: { type: String },
    lat: { type: Number, default: 12.9716 },
    lng: { type: Number, default: 77.5946 },
    radius_km: { type: Number, default: 10.0 },
    min_followers: { type: Number, default: 1000 },
    max_followers: { type: Number, default: 500000 },
    req_categories: { type: mongoose.Schema.Types.Mixed },
    req_gender: { type: String },
    req_language: { type: String },
    req_engagement: { type: Number, default: 2.0 },
    platform: { type: String, required: true },
    deliverables: { type: mongoose.Schema.Types.Mixed, required: true },
    budget_total: { type: Number, required: true },
    reward_per_creator: { type: Number, required: true },
    creators_required: { type: Number, required: true },
    creators_hired: { type: Number, default: 0 },
    payment_type: { type: String, default: 'Fixed Payment' },
    start_date: { type: String },
    end_date: { type: String },
    app_deadline: { type: String },
    content_deadline: { type: String },
    hashtags: { type: String },
    mentions: { type: String },
    guidelines: { type: String },
    dos: { type: String },
    donts: { type: String },
    status: { type: String, default: 'published' }
});

// Application Schema
const applicationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    campaign_id: { type: String, default: '' },
    creator_id: { type: String, required: true },
    brand_id: { type: String, default: '' },
    type: { type: String, default: 'application' }, // 'application' | 'direct_pitch'
    custom_title: { type: String, default: '' },
    custom_budget: { type: Number, default: 0 },
    custom_deliverables: { type: String, default: '' },
    pitch: { type: String, required: true },
    relevant_experience: { type: String },
    content_idea: { type: String, default: '' },
    sample_links: { type: String },
    expected_date: { type: String },
    status: { type: String, default: 'submitted' }, // 'submitted', 'invited', 'accepted', 'rejected'
    applied_at: { type: Date, default: Date.now }
});

// Collaboration Schema
const collaborationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    campaign_id: { type: String, required: true },
    application_id: { type: String, required: true },
    brand_id: { type: String, required: true },
    creator_id: { type: String, required: true },
    status: { type: String, default: 'active' },
    current_step: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now }
});

// Content Submission Schema
const contentSubmissionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    collaboration_id: { type: String, required: true },
    content_url: { type: String, required: true },
    platform: { type: String, required: true },
    caption: { type: String },
    screenshot_url: { type: String },
    notes: { type: String },
    status: { type: String, default: 'submitted' },
    brand_feedback: { type: String },
    submitted_at: { type: Date, default: Date.now }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    collaboration_id: { type: String, required: true },
    brand_id: { type: String, required: true },
    creator_id: { type: String, required: true },
    amount: { type: Number, required: true },
    payment_type: { type: String, default: 'Escrow Release' },
    status: { type: String, default: 'paid' },
    transaction_id: { type: String },
    created_at: { type: Date, default: Date.now }
});

// Conversation Schema
const conversationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    brand_id: { type: String, required: true },
    creator_id: { type: String, required: true },
    collaboration_id: { type: String },
    last_message: { type: String },
    updated_at: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    conversation_id: { type: String, required: true },
    sender_id: { type: String, required: true },
    text: { type: String, required: true },
    attachment_url: { type: String },
    read_status: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read_status: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    collaboration_id: { type: String, required: true },
    reviewer_id: { type: String, required: true },
    reviewee_id: { type: String, required: true },
    reviewer_role: { type: String, required: true },
    rating: { type: Number, required: true },
    review_text: { type: String },
    created_at: { type: Date, default: Date.now }
});

// Report Schema
const reportSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    reporter_id: { type: String, required: true },
    reported_id: { type: String, required: true },
    target_type: { type: String, required: true },
    reason: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Brand = mongoose.model('Brand', brandSchema);
const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);
const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);
const Creator = mongoose.model('Creator', creatorSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const Application = mongoose.model('Application', applicationSchema);
const Collaboration = mongoose.model('Collaboration', collaborationSchema);
const ContentSubmission = mongoose.model('ContentSubmission', contentSubmissionSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Review = mongoose.model('Review', reviewSchema);
const Report = mongoose.model('Report', reportSchema);

module.exports = {
    User,
    Brand,
    SocialAccount,
    PortfolioItem,
    Creator,
    Campaign,
    Application,
    Collaboration,
    ContentSubmission,
    Payment,
    Conversation,
    Message,
    Notification,
    Review,
    Report
};
