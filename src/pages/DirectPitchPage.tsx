import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Creator, Campaign, AIMatchResult } from '../types';
import { DirectPitchModal } from '../components/DirectPitchModal';
import { AICampaignModal } from '../components/AICampaignModal';
import {
  Send,
  Search,
  Filter,
  Sparkles,
  Star,
  CheckCircle2,
  Users,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  Award,
  Zap,
  Check,
  XCircle,
  Layers,
  ChevronDown
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const CATEGORIES = [
  'All',
  'Food & Beverage',
  'Fashion & Style',
  'Tech & Gaming',
  'Fitness & Health',
  'Lifestyle & Vlogs',
  'Beauty & Skincare',
  'Travel & Photography'
];

const CITIES = ['All', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

export const DirectPitchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeRole, showToast } = useAuth();

  // Mode: 'ai_match' | 'directory'
  const [activeTab, setActiveTab] = useState<'ai_match' | 'directory'>('ai_match');

  // Brand Campaigns for AI Matching
  const [brandCampaigns, setBrandCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [aiMatches, setAiMatches] = useState<AIMatchResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Directory State
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'followers' | 'engagement' | 'rating'>('score');

  // Modals
  const [selectedCreatorForPitch, setSelectedCreatorForPitch] = useState<Creator | null>(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    fetchBrandCampaigns();
    fetchCreators();
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [selectedCategory, selectedCity, sortBy]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchMatchesForCampaign(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchBrandCampaigns = async () => {
    try {
      const res = await api.getCampaigns();
      if (res.success) {
        const userCamps = res.campaigns.filter((c: any) => c.brand_id === user?.profileId);
        setBrandCampaigns(userCamps);
        if (userCamps.length > 0) {
          setSelectedCampaignId(userCamps[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMatchesForCampaign = async (campaignId: string) => {
    setLoadingMatches(true);
    try {
      const res = await api.getCampaignMatches(campaignId);
      if (res.success && res.matches) {
        setAiMatches(res.matches);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedCity !== 'All') params.city = selectedCity;
      if (searchQuery) params.search = searchQuery;
      if (sortBy) params.sort = sortBy;

      const res = await api.getCreators(params);
      if (res.success) {
        setCreators(res.creators);
      }
    } catch (e) {
      console.error('Failed to fetch creators:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCreators();
  };

  const handleOpenPitch = (creator: Creator) => {
    if (activeRole !== 'brand') {
      showToast('Please log in as a Brand to pitch creators directly.', 'info');
      navigate('/brand/login');
      return;
    }
    setSelectedCreatorForPitch(creator);
    setIsPitchModalOpen(true);
  };

  const getInstagramUrl = (socialLink?: string, username?: string) => {
    const link = (socialLink || '').trim();
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    const cleanUser = (username || link).replace(/^@/, '').trim();
    return `https://instagram.com/${cleanUser || 'instagram'}`;
  };

  if (activeRole !== 'brand') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/60 rounded-full flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
            Brand Access Only
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The AI Creator Matching & Direct Pitch Studio is exclusively available for verified Brand accounts.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => navigate('/brand/login')}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all cursor-pointer"
            >
              Sign In as Brand
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Back to Explore Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCampaign = brandCampaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI-Powered Creator Matchmaking
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI Creator Matching & Direct Pitch Studio
            </h1>
            <p className="text-sm sm:text-base text-purple-200 leading-relaxed">
              Match with vetted local creators based on geographic proximity, niche relevance, verified engagement, and past performance.
            </p>
          </div>
        </div>

        {/* Tab Switcher: AI Matching vs Directory */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('ai_match')}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ai_match'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" /> AI Match Engine (By Campaign)
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Browse Creator Directory
          </button>
        </div>

        {/* Tab 1: AI Match Engine */}
        {activeTab === 'ai_match' && (
          <div className="space-y-6 animate-fade-in">
            {/* Campaign Selection Bar */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Select Active Campaign for AI Matchmaking:
                </label>
                {brandCampaigns.length === 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">No active campaigns published yet.</span>
                    <button
                      onClick={() => setIsAIModalOpen(true)}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      + Generate AI Campaign Brief
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedCampaignId}
                    onChange={e => setSelectedCampaignId(e.target.value)}
                    className="w-full sm:max-w-md px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {brandCampaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.category} • {c.location_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedCampaign && (
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Target Radius & Reward</div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedCampaign.radius_km || 10} km radius • ₹{(selectedCampaign.reward_per_creator || 3000).toLocaleString()} / Creator
                  </div>
                </div>
              )}
            </div>

            {/* AI Matches Grid */}
            {loadingMatches ? (
              <div className="py-20 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                <div className="text-xs font-bold text-slate-400">
                  Calculating multi-factor compatibility scores across 6 criteria...
                </div>
              </div>
            ) : aiMatches.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-heading text-lg font-extrabold">No Matches Found</h3>
                <p className="text-xs text-slate-500">
                  Try creating a campaign or adjusting requirements to find matched creators.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiMatches.map(match => (
                  <div
                    key={match.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-purple-200/80 dark:border-purple-800/40 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Compatibility Badge & Proximity */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {match.match_score}% Match
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          {match.distance_km ? `${match.distance_km} km away` : match.city}
                        </span>
                      </div>

                      {/* Profile Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={match.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500 shadow-md"
                          alt=""
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-heading font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {match.full_name}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                            @{match.username}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {match.followers.toLocaleString()} Followers • {match.engagement_rate}% Eng
                          </div>
                        </div>
                      </div>

                      {/* Why Recommended Checklist */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                          Why Recommended:
                        </div>
                        {match.match_reasons?.map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {reason.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span className={reason.passed ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 line-through'}>
                              {reason.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => navigate(`/creators/${match.id}`)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenPitch(match)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white text-xs font-extrabold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Pitch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Creator Directory */}
        {activeTab === 'directory' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search & Filter Controls */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search creator name, @username, or niche keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Search className="w-4 h-4" /> Search Creators
                </button>
              </form>

              {/* Category & City Pills */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                  <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Category:
                  </span>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city === 'All' ? 'All Cities' : city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="score">Sort by Quality Score (0-100)</option>
                      <option value="followers">Sort by Followers</option>
                      <option value="engagement">Sort by Engagement</option>
                      <option value="rating">Sort by Rating</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Directory Cards Grid */}
            {loading ? (
              <div className="py-20 text-center text-xs font-bold text-slate-400">Loading creators...</div>
            ) : creators.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-heading text-lg font-extrabold">No Creators Found</h3>
                <p className="text-xs text-slate-500">Try adjusting your filters to discover creators.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <div
                    key={creator.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div>
                      {/* Top Profile Bar */}
                      <div className="flex items-start gap-4 mb-4">
                        <a
                          href={getInstagramUrl(creator.social_accounts?.[0]?.profile_url, creator.username)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative shrink-0 group/img cursor-pointer"
                        >
                          <img
                            src={creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={creator.full_name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-md group-hover/img:scale-105 transition-transform"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-1 rounded-lg text-white shadow">
                            <InstagramIcon className="w-3 h-3" />
                          </div>
                        </a>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            {creator.full_name}
                            <CheckCircle2 className="w-4 h-4 text-purple-500 fill-purple-500/20 shrink-0" />
                          </h3>
                          <div className="text-xs text-purple-600 dark:text-purple-400 font-bold truncate">
                            @{creator.username}
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {creator.city}, {creator.state}
                          </p>
                        </div>
                      </div>

                      {/* Performance Score & Rate Badge */}
                      <div className="flex items-center justify-between p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/60 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-extrabold text-purple-900 dark:text-purple-200">
                            Score: {creator.creator_score?.total || 91}/100
                          </span>
                          <span className="text-[10px] font-black uppercase text-emerald-600">
                            ({creator.creator_score?.grade || 'A+'})
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          From ₹{(creator.starting_price || 4500).toLocaleString()}
                        </span>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                        {creator.bio}
                      </p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-center">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Followers</div>
                          <div className="font-heading text-sm font-extrabold text-purple-600 dark:text-purple-400">
                            {creator.followers.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Engagement</div>
                          <div className="font-heading text-sm font-extrabold text-blue-600 dark:text-blue-400">
                            {creator.engagement_rate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Rating</div>
                          <div className="font-heading text-sm font-extrabold text-amber-500 flex items-center justify-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-500" /> {creator.rating}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => navigate(`/creators/${creator.id}`)}
                        className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors cursor-pointer"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleOpenPitch(creator)}
                        className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Direct Pitch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCreatorForPitch && (
        <DirectPitchModal
          creator={selectedCreatorForPitch}
          isOpen={isPitchModalOpen}
          onClose={() => setIsPitchModalOpen(false)}
          onSuccess={() => showToast(`Direct pitch successfully sent to ${selectedCreatorForPitch.full_name}!`)}
        />
      )}

      <AICampaignModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onCampaignCreated={() => {
          fetchBrandCampaigns();
        }}
        showToast={showToast}
      />
    </div>
  );
};
