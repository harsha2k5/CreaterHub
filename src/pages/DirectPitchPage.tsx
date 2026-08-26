import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Creator } from '../types';
import { DirectPitchModal } from '../components/DirectPitchModal';
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
  Eye,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink
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
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'engagement' | 'rating'>('followers');

  // Pitch Modal State
  const [selectedCreatorForPitch, setSelectedCreatorForPitch] = useState<Creator | null>(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [selectedCategory, selectedCity]);

  const getInstagramUrl = (socialLink?: string, username?: string) => {
    const link = (socialLink || '').trim();
    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }
    const cleanUser = (username || link).replace(/^@/, '').trim();
    return `https://instagram.com/${cleanUser || 'instagram'}`;
  };

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedCity !== 'All') params.city = selectedCity;
      if (searchQuery) params.search = searchQuery;

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

  // Sort Creators client-side
  const sortedCreators = [...creators].sort((a, b) => {
    if (sortBy === 'followers') return b.followers - a.followers;
    if (sortBy === 'engagement') return b.engagement_rate - a.engagement_rate;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

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
            The Direct Pitch & Creator Outreach Studio is exclusively available for verified Brand accounts.
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" /> Direct Creator Outreach Studio
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Directly Pitch & Hire Top Creators
            </h1>
            <p className="text-sm sm:text-base text-purple-200 leading-relaxed">
              Explore verified local creators, review engagement statistics, and send custom sponsorship pitches or campaign invites in seconds.
            </p>
          </div>
        </div>

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
                  <option value="followers">Sort by Followers</option>
                  <option value="engagement">Sort by Engagement</option>
                  <option value="rating">Sort by Rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">Loading creators...</div>
        ) : sortedCreators.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-heading text-lg font-extrabold">No Creators Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your category or city filters to explore creators.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Profile Bar */}
                  <div className="flex items-start gap-4 mb-4">
                    <a
                      href={getInstagramUrl(creator.social_link, creator.username)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Click to view Instagram profile"
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
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <a
                            href={getInstagramUrl(creator.social_link, creator.username)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Instagram profile"
                            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            {creator.full_name}
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                          <CheckCircle2 className="w-4 h-4 text-purple-500 fill-purple-500/20 shrink-0" />
                        </h3>
                      </div>
                      <a
                        href={getInstagramUrl(creator.social_link, creator.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline truncate flex items-center gap-1 cursor-pointer mt-0.5"
                      >
                        <InstagramIcon className="w-3 h-3" /> @{creator.username}
                      </a>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {creator.city}, {creator.state}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {creator.bio}
                  </p>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(Array.isArray(creator.categories) ? creator.categories : []).slice(0, 3).map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl mb-5 text-center">
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
                    View Profile
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

      {/* Direct Pitch Modal */}
      {selectedCreatorForPitch && (
        <DirectPitchModal
          creator={selectedCreatorForPitch}
          isOpen={isPitchModalOpen}
          onClose={() => setIsPitchModalOpen(false)}
          onSuccess={() => showToast(`Direct pitch successfully sent to ${selectedCreatorForPitch.full_name}!`)}
        />
      )}
    </div>
  );
};
