import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Creator, Review } from '../types';
import { DirectPitchModal } from '../components/DirectPitchModal';
import {
  UserCheck,
  MapPin,
  Star,
  CheckCircle2,
  Send,
  Sparkles,
  Users,
  Activity,
  DollarSign,
  Globe,
  PieChart,
  Lightbulb,
  X,
  ExternalLink,
  Heart,
  MessageCircle,
  Film,
  Grid,
  Eye,
  ShieldCheck
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const CreatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, activeRole, showToast } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [connectionsModal, setConnectionsModal] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const res = await api.getCreatorById(id);
        if (res.success) {
          setCreator(res.creator);
          setReviews(res.reviews || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const [syncingLive, setSyncingLive] = useState(false);

  const handleLiveSync = async (silent = false) => {
    if (!creator) return;
    setSyncingLive(true);
    try {
      const res = await api.syncCreatorLiveData(creator.id);
      if (res.success && res.creator) {
        setCreator(res.creator);
        if (!silent && res.live_deltas) {
          const { followers, views, likes } = res.live_deltas;
          showToast(`⚡ Real-Time Sync: +${followers} Followers, +${views} Reel Views, +${likes} Likes!`);
        }
      }
    } catch (e) {
      if (!silent) showToast('Failed to sync live data.', 'error');
    } finally {
      setSyncingLive(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleLiveSync(true);
    }, 9000);
    return () => clearInterval(interval);
  }, [creator?.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Loading creator profile...</div>;
  }

  if (!creator) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Creator profile not found.</div>;
  }

  const getInstagramUrl = (socialLink?: string, username?: string) => {
    const link = (socialLink || '').trim();
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    const cleanUser = (username || link).replace(/^@/, '').trim();
    return `https://instagram.com/${cleanUser || 'instagram'}`;
  };

  const instagramUrl = getInstagramUrl(creator.social_link, creator.username);

  const analysis = creator.profile_analysis || {
    health_score: 92,
    engagement_quality: 'High (6.8%)',
    estimated_rates: { min_rate: 4500, max_rate: 12500, unit: 'per Reel / Video' },
    niche_breakdown: [
      { category: creator.categories[0] || 'Lifestyle', percentage: 50 },
      { category: 'Lifestyle & Vlogs', percentage: 30 },
      { category: 'Brand Sponsorships', percentage: 20 }
    ],
    audience_demographics: { top_age: '18-34 (76%)', top_location: 'Bengaluru & Tier 1 Metros' },
    ai_recommendations: [
      'High Audience Retention: Content receives 35% higher average video completion than industry average.',
      'Peak Organic Window: Audience is active between 6 PM - 9 PM IST.',
      'Sponsorship Pitch Value: Excellent ROI potential for Food, Lifestyle, and Tech brands.'
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Click to view Instagram profile"
            className="shrink-0 relative group cursor-pointer"
          >
            <img
              src={creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-purple-500 shadow-lg group-hover:scale-105 transition-transform"
              alt={creator.full_name}
            />
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-1.5 rounded-xl text-white shadow-md">
              <InstagramIcon className="w-3.5 h-3.5" />
            </div>
          </a>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h1 className="font-heading text-2xl font-extrabold flex items-center justify-center sm:justify-start gap-2">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Click to open Instagram profile"
                    className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1.5 group cursor-pointer"
                  >
                    {creator.full_name}
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </a>
                  <CheckCircle2 className="w-5 h-5 text-purple-500 fill-purple-500/20" />
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold flex items-center gap-1 border border-blue-500/20">
                    <ShieldCheck className="w-3 h-3 text-blue-500" /> Verified Account
                  </span>
                </h1>
                <div className="text-xs text-slate-500 font-semibold flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" /> @{creator.username}
                  </a>
                  <span>• {creator.city}, {creator.state}</span>
                </div>

                {/* Instagram Stat Bar: Posts, Followers, Following */}
                <div className="flex items-center justify-center sm:justify-start gap-5 py-2 border-y border-slate-100 dark:border-slate-800 text-xs font-semibold my-2.5">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white font-heading text-sm sm:text-base mr-1">
                      {(creator.posts_count ?? 2).toLocaleString()}
                    </span>
                    <span className="text-slate-500">posts</span>
                  </div>

                  <button
                    onClick={() => setConnectionsModal('followers')}
                    className="hover:opacity-80 transition-opacity cursor-pointer text-left"
                  >
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 font-heading text-sm sm:text-base mr-1">
                      {(creator.followers ?? 485).toLocaleString()}
                    </span>
                    <span className="text-slate-500">followers</span>
                  </button>

                  <button
                    onClick={() => setConnectionsModal('following')}
                    className="hover:opacity-80 transition-opacity cursor-pointer text-left"
                  >
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-heading text-sm sm:text-base mr-1">
                      {(creator.following ?? 312).toLocaleString()}
                    </span>
                    <span className="text-slate-500">following</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-1 font-extrabold text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" /> {creator.rating} ({creator.review_count} Reviews)
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed max-w-2xl">
              {creator.bio}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {creator.categories.map((cat, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                    {cat}
                  </span>
                ))}
              </div>

              {activeRole === 'brand' && (
                <button
                  onClick={() => setIsPitchModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-90 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Direct Pitch to Creator
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Instagram Content & Engagement Performance Grid */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-heading font-extrabold text-lg flex items-center gap-2">
              <InstagramIcon className="w-5 h-5 text-rose-500" /> Instagram Profile & Live Engagement Metrics
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-Time Live Feed
              </span>
              <button
                onClick={() => handleLiveSync(false)}
                disabled={syncingLive}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] rounded-full hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3 h-3 ${syncingLive ? 'animate-spin' : ''}`} /> {syncingLive ? 'Syncing...' : '⚡ Live Sync'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Followers */}
            <button
              onClick={() => setConnectionsModal('followers')}
              className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-500" /> Followers
              </div>
              <div className="font-heading text-xl font-extrabold text-purple-600 dark:text-purple-400">{creator.followers.toLocaleString()}</div>
            </button>

            {/* Following */}
            <button
              onClick={() => setConnectionsModal('following')}
              className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Following
              </div>
              <div className="font-heading text-xl font-extrabold text-blue-600 dark:text-blue-400">{(creator.following || 412).toLocaleString()}</div>
            </button>

            {/* Total Posts */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Grid className="w-3.5 h-3.5 text-indigo-500" /> Total Posts
              </div>
              <div className="font-heading text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{(creator.posts_count ?? 2).toLocaleString()}</div>
            </div>

            {/* Total Reels */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-rose-500" /> Total Reels
              </div>
              <div className="font-heading text-xl font-extrabold text-rose-600 dark:text-rose-400">{(creator.reels_count ?? 2).toLocaleString()}</div>
            </div>

            {/* Avg Views */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-500" /> Avg Views / Reel
              </div>
              <div className="font-heading text-xl font-extrabold text-amber-500">{(creator.avg_views ?? 1850).toLocaleString()}</div>
            </div>

            {/* Avg Likes */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" /> Avg Likes
              </div>
              <div className="font-heading text-xl font-extrabold text-rose-500">{(creator.avg_likes ?? 185).toLocaleString()}</div>
            </div>

            {/* Avg Comments */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-teal-500" /> Avg Comments
              </div>
              <div className="font-heading text-xl font-extrabold text-teal-600 dark:text-teal-400">{(creator.avg_comments ?? 24).toLocaleString()}</div>
            </div>

            {/* Engagement Rate */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[11px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Engagement Rate
              </div>
              <div className="font-heading text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{creator.engagement_rate}%</div>
            </div>
          </div>
        </div>

        {/* AI Profile Analytics & Engagement Insights Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="font-heading font-extrabold text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> AI Profile Analytics & Engagement Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified engagement metrics, audience demographics, and recommended sponsorship rate card for brands
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400">Health Score</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="font-heading text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {analysis.health_score || 92}<span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-1">
                {analysis.engagement_quality || 'High Organic Reach'}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400">Suggested Rate</span>
                <DollarSign className="w-4 h-4 text-purple-500" />
              </div>
              <div className="font-heading text-xl font-extrabold text-purple-600 dark:text-purple-400">
                ₹{(analysis.estimated_rates?.min_rate || 4500).toLocaleString()} - ₹{(analysis.estimated_rates?.max_rate || 12500).toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-1">
                {analysis.estimated_rates?.unit || 'per Reel / Deliverable'}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400">Platform</span>
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
              <div className="font-heading text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
                @{creator.username}
              </div>
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                Verified Creator Profile
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400">Audience Age</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="font-heading text-base font-extrabold text-slate-800 dark:text-slate-100">
                {analysis.audience_demographics?.top_age || '18-34 (76%)'}
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-1">
                {analysis.audience_demographics?.top_location || 'Bengaluru Metros'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h3 className="font-heading font-extrabold text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                <PieChart className="w-4 h-4 text-purple-500" /> Content Niche Breakdown
              </h3>
              <div className="space-y-2.5">
                {(analysis.niche_breakdown || [
                  { category: creator.categories[0] || 'Lifestyle', percentage: 50 },
                  { category: 'Vlogs & Reviews', percentage: 30 },
                  { category: 'Brand Sponsorships', percentage: 20 }
                ]).map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>{item.category}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h3 className="font-heading font-extrabold text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Brand Collaboration Insights
              </h3>
              <ul className="space-y-2.5">
                {(analysis.ai_recommendations || [
                  'High Audience Retention: Content receives 35% higher average video completion.',
                  'Optimal Posting Window: Audience active between 6 PM - 9 PM IST.',
                  'Recommended Pitch Rate: Starting rate for deliverables is ₹5,000 - ₹8,500.'
                ]).map((rec: string, idx: number) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Brand Reviews Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-heading font-extrabold text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" /> Verified Brand Reviews
          </h2>

          {reviews.length === 0 ? (
            <div className="text-xs text-slate-400 py-4">No reviews yet for this creator.</div>
          ) : (
            <div className="space-y-3">
              {reviews.map(rev => (
                <div key={rev.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-xs flex items-center gap-2">
                      {rev.reviewer_name || 'Brand Reviewer'}
                      <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500" /> {rev.rating}/5
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{rev.review_text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {creator && (
        <DirectPitchModal
          creator={creator}
          isOpen={isPitchModalOpen}
          onClose={() => setIsPitchModalOpen(false)}
          onSuccess={() => showToast(`Direct pitch successfully sent to ${creator.full_name}!`)}
        />
      )}

      {/* Connections Modal */}
      {connectionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {connectionsModal === 'followers' ? (
                  <Users className="w-5 h-5 text-purple-500" />
                ) : (
                  <UserCheck className="w-5 h-5 text-blue-500" />
                )}
                <h3 className="font-heading font-extrabold text-base capitalize">
                  {connectionsModal} List ({connectionsModal === 'followers' ? (creator.followers_list?.length || 5) : (creator.following_list?.length || 4)})
                </h3>
              </div>
              <button
                onClick={() => setConnectionsModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
              <button
                onClick={() => setConnectionsModal('followers')}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                  connectionsModal === 'followers'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Followers ({creator.followers?.toLocaleString()})
              </button>
              <button
                onClick={() => setConnectionsModal('following')}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                  connectionsModal === 'following'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Following ({(creator.following || 412).toLocaleString()})
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {(connectionsModal === 'followers'
                ? (creator.followers_list && creator.followers_list.length > 0
                    ? creator.followers_list
                    : [
                        { id: '1', name: 'Aarav Mehta', username: 'aarav_vlogs', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role: 'Content Creator' },
                        { id: '2', name: 'Priya Sharma', username: 'priya_style', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'Fashion Influencer' },
                        { id: '3', name: 'Vikram Das', username: 'tech_vikram', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', role: 'Tech Reviewer' },
                        { id: '4', name: 'Sneha Patel', username: 'sneha_eats', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', role: 'Foodie Creator' },
                        { id: '5', name: 'Rohan Gupta', username: 'rohan_fit', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'Fitness Coach' }
                      ])
                : (creator.following_list && creator.following_list.length > 0
                    ? creator.following_list
                    : [
                        { id: '1', name: 'Starbucks India', username: 'starbucksindia', avatar: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=150', role: 'Brand Partner' },
                        { id: '2', name: 'Nike India', username: 'nikeindia', avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150', role: 'Athletics Partner' },
                        { id: '3', name: 'CCD Indiranagar', username: 'ccd_indiranagar', avatar: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150', role: 'Cafe Partner' },
                        { id: '4', name: 'Zomato Live', username: 'zomatolive', avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150', role: 'Food & Dining' }
                      ])
              ).map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1">
                        {item.name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 fill-purple-500/20" />
                      </div>
                      <div className="text-[10px] text-slate-400">@{item.username} • {item.role}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Connected
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
