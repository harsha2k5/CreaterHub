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
  avg_views: number;
  avg_likes: number;
  avg_comments: number;
  engagement_rate: number;
  rating: number;
  review_count: number;
  profile_completion: number;
  verified: number;
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
  status: 'draft' | 'published' | 'closed';
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
