export interface User {
  id: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
  is_verified: number;
  profileId?: string;
  profile?: Brand | Creator;
}

export interface Brand {
  id: string;
  user_id: string;
  company_name: string;
  business_email: string;
  phone?: string;
  category: string;
  website?: string;
  location_name?: string;
  address?: string;
  city: string;
  state: string;
  pin_code?: string;
  lat: number;
  lng: number;
  gst_number?: string;
  logo_url?: string;
  description?: string;
  rating: number;
  review_count: number;
  verified: number;
}

export interface SocialAccount {
  id: string;
  creator_id: string;
  platform: 'Instagram' | 'YouTube' | 'TikTok' | 'Twitter';
  handle: string;
  follower_count: number;
  engagement_rate?: number;
  profile_url?: string;
  verified?: number;
}

export interface PreviousCampaign {
  id: string;
  campaign_title: string;
  brand_name: string;
  brand_logo?: string;
  deliverables: string;
  rating?: number;
  review_text?: string;
  completed_at?: string;
}

export interface CreatorScoreBreakdownItem {
  score: number;
  max: number;
  weight: string;
  label: string;
}

export interface CreatorScore {
  total: number;
  grade: string;
  breakdown: {
    engagement: CreatorScoreBreakdownItem;
    growth: CreatorScoreBreakdownItem;
    content: CreatorScoreBreakdownItem;
    campaign_success: CreatorScoreBreakdownItem;
    completeness: CreatorScoreBreakdownItem;
    reliability: CreatorScoreBreakdownItem;
  };
}

export interface Creator {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  phone?: string;
  dob?: string;
  location_name?: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  bio?: string;
  avatar_url?: string;
  categories: string[];
  languages: string[];
  followers: number;
  following?: number;
  posts_count?: number;
  reels_count?: number;
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  engagement_rate: number;
  rating: number;
  review_count: number;
  profile_completion: number;
  verified: number;
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
  verification_docs?: string;
  verification_date?: string;
  social_accounts?: SocialAccount[];
  previous_campaigns?: PreviousCampaign[];
  completed_campaigns_count?: number;
  creator_score?: CreatorScore;
  starting_price?: number;
  rate_card?: {
    reel?: number;
    story?: number;
    post?: number;
    combo?: number;
  };
  availability?: 'available' | 'busy' | 'taking_pitches';
}

export interface AIMatchReason {
  text: string;
  passed: boolean;
}

export interface AIMatchResult extends Creator {
  match_score: number;
  distance_km: number;
  match_reasons: AIMatchReason[];
  match_breakdown?: Record<string, any>;
}

export interface AICampaignRecommendation {
  category: string;
  location_name: string;
  city: string;
  target_niche: string;
  follower_range: string;
  min_followers: number;
  max_followers: number;
  min_engagement: number;
  deliverables: string[];
  creators_required: number;
  reward_per_creator: number;
  estimated_budget: number;
  suggested_duration: string;
  suggested_title: string;
  suggested_description: string;
  strategy: string;
  hashtags: string;
  dos: string;
  donts: string;
  ai_engine?: string;
}

export interface BrandAnalyticsOverview {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_spent: number;
  avg_campaign_cost: number;
  creators_hired: number;
  total_reach: number;
  total_impressions: number;
  total_engagement: number;
  avg_engagement_rate: number;
  estimated_roi: string;
}

export interface BrandAnalyticsChartPoint {
  period: string;
  spend: number;
  reach: number;
  engagement: number;
}

export interface BrandAnalytics {
  success: boolean;
  time_range: string;
  overview: BrandAnalyticsOverview;
  charts: BrandAnalyticsChartPoint[];
}

export interface CampaignMetrics {
  reach: number;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  total_engagements: number;
  engagement_rate: number;
  cost_per_engagement: number;
  estimated_roi: string;
  conversions: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  brand_name?: string;
  brand_logo?: string;
  brand_verified?: number;
  title: string;
  description: string;
  objective?: string;
  category: string;
  location_name: string;
  outlet_name: string;
  address: string;
  city: string;
  state: string;
  pin_code?: string;
  lat: number;
  lng: number;
  radius_km: number;
  min_followers: number;
  max_followers: number;
  req_categories: string[];
  req_gender?: string;
  req_language?: string;
  req_engagement: number;
  platform: string;
  deliverables: string[];
  budget_total: number;
  reward_per_creator: number;
  creators_required: number;
  creators_hired: number;
  payment_type: string;
  start_date?: string;
  end_date?: string;
  app_deadline?: string;
  content_deadline?: string;
  hashtags?: string;
  mentions?: string;
  guidelines?: string;
  dos?: string;
  donts?: string;
  status: 'draft' | 'published' | 'applications_open' | 'reviewing' | 'creator_selected' | 'in_progress' | 'content_submitted' | 'approved' | 'completed' | 'closed';
  distanceKm?: number;
}

export interface Application {
  id: string;
  campaign_id: string;
  creator_id: string;
  pitch: string;
  relevant_experience?: string;
  content_idea: string;
  sample_links?: string;
  expected_date?: string;
  status: 'submitted' | 'accepted' | 'rejected';
  applied_at: string;
  campaign_title?: string;
  reward_per_creator?: number;
  platform?: string;
  creator_name?: string;
  creator_username?: string;
  creator_avatar?: string;
  creator_followers?: number;
  creator_engagement?: number;
  creator_city?: string;
  creator_rating?: number;
  brand_name?: string;
  brand_logo?: string;
}

export interface Collaboration {
  id: string;
  campaign_id: string;
  application_id: string;
  brand_id: string;
  creator_id: string;
  status: 'active' | 'content_submitted' | 'revision_requested' | 'approved' | 'paid' | 'completed';
  current_step: number;
  created_at: string;
  campaign_title?: string;
  reward_per_creator?: number;
  platform?: string;
  location_name?: string;
  creator_name?: string;
  creator_username?: string;
  creator_avatar?: string;
  brand_name?: string;
  brand_logo?: string;
  payment_status?: string;
  amount_paid?: number;
}

export interface ContentSubmission {
  id: string;
  collaboration_id: string;
  content_url: string;
  platform: string;
  caption?: string;
  screenshot_url?: string;
  notes?: string;
  status: 'submitted' | 'approved' | 'revision_requested';
  brand_feedback?: string;
  submitted_at: string;
}

export interface Payment {
  id: string;
  collaboration_id: string;
  brand_id: string;
  creator_id: string;
  amount: number;
  payment_type: string;
  status: 'pending' | 'processing' | 'paid';
  transaction_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  brand_id: string;
  creator_id: string;
  collaboration_id?: string;
  last_message?: string;
  updated_at: string;
  other_party_name?: string;
  other_party_avatar?: string;
  campaign_title?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  attachment_url?: string;
  read_status: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  read_status: number;
  created_at: string;
}

export interface Review {
  id: string;
  collaboration_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_role: 'brand' | 'creator';
  rating: number;
  review_text?: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
}

// ==========================================
// Creator Analytics Engine Types & Provenance
// ==========================================

export type DataProvenanceSource = 'API_PROVIDED' | 'CALCULATED' | 'BENCHMARK_ESTIMATE';

export interface ProvenancedMetric<T = number> {
  value: T;
  source: DataProvenanceSource;
  label?: string;
  description?: string;
  formula?: string;
  currency?: string;
  performance_tier?: string;
  industry_benchmark?: string;
}

export interface AudienceCluster {
  total_followers: ProvenancedMetric<number>;
  followers_gained_this_month: ProvenancedMetric<number>;
  following: ProvenancedMetric<number>;
  growth_percent: ProvenancedMetric<number>;
  location: {
    top_cities: { city: string; percentage: number }[];
    top_countries: { country: string; percentage: number }[];
    source: DataProvenanceSource;
    label: string;
  };
  age_distribution: {
    brackets: { bracket: string; percentage: number }[];
    source: DataProvenanceSource;
    label: string;
  };
  gender_distribution: {
    breakdown: { gender: string; percentage: number }[];
    source: DataProvenanceSource;
    label: string;
  };
  historical_chart: { date: string; followers: number; reach: number }[];
}

export interface ContentCluster {
  posts: ProvenancedMetric<number> & { feed_count?: number };
  reels: ProvenancedMetric<number>;
  avg_views: ProvenancedMetric<number>;
  avg_likes: ProvenancedMetric<number>;
  avg_comments: ProvenancedMetric<number>;
  avg_shares: ProvenancedMetric<number>;
  avg_saves: ProvenancedMetric<number>;
  recent_media: any[];
}

export interface EngagementCluster {
  engagement_rate: ProvenancedMetric<number>;
  avg_engagement_per_post: ProvenancedMetric<number>;
  best_performing_content: {
    id: string;
    caption: string;
    media_type: string;
    thumbnail_url: string;
    permalink: string;
    like_count: number;
    comments_count: number;
    saved_count: number;
    shares_count: number;
    reach: number;
    relative_score: string;
  }[];
  best_posting_times: {
    recommendations: {
      day: string;
      time: string;
      interaction_boost: string;
      reason: string;
    }[];
    source: DataProvenanceSource;
    label: string;
  };
}

export interface CampaignPerformanceCluster {
  campaign_reach: ProvenancedMetric<number>;
  campaign_impressions: ProvenancedMetric<number>;
  engagement_generated: ProvenancedMetric<number>;
  clicks: ProvenancedMetric<number>;
  conversions: ProvenancedMetric<number>;
  earnings: ProvenancedMetric<number>;
  active_collaborations: number;
  completed_collaborations: number;
}

export interface CreatorAnalyticsEnginePayload {
  success: boolean;
  is_connected: boolean;
  is_official_api: boolean;
  data_source: string;
  generated_at: string;
  profile: any;
  audience: AudienceCluster;
  content: ContentCluster;
  engagement: EngagementCluster;
  campaign_performance: CampaignPerformanceCluster;
  // Legacy compatibility:
  kpi_cards?: any;
  follower_growth_chart?: any[];
  content_performance?: any[];
  audience_insights?: any;
}

