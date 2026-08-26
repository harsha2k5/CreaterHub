import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Campaign, Application } from '../types';
import {
  Users,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  DollarSign,
  Flame,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight,
  BarChart3,
  PieChart,
  Zap,
  RefreshCw,
  Globe,
  Activity,
  Lightbulb,
  UserCheck,
  X
} from 'lucide-react';

export const CreatorDashboard: React.FC = () => {
  const { user, showToast, updateUserProfile, refreshSessionUser } = useAuth();
  const navigate = useNavigate();
  const [nearbyCampaigns, setNearbyCampaigns] = useState<Campaign[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [connectionsModal, setConnectionsModal] = useState<'followers' | 'following' | null>(null);

  const profile = (user?.profile as any) || {};
  const [socialLinkInput, setSocialLinkInput] = useState(profile.social_link || '');
  const [analysisData, setAnalysisData] = useState<any>(profile.profile_analysis || null);

  const loadData = async () => {
    try {
      const campRes = await api.getCampaigns({ radius: '15' });
      if (campRes.success) setNearbyCampaigns(campRes.campaigns);
      const appRes = await api.getApplications();
      if (appRes.success) setMyApplications(appRes.applications);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLiveSync = async (silent = false) => {
    if (!profile.id) return;
    try {
      const res = await api.syncCreatorLiveData(profile.id);
      if (res.success && res.creator) {
        if (res.creator.profile_analysis) setAnalysisData(res.creator.profile_analysis);
        updateUserProfile(res.creator);
        if (!silent && res.live_deltas) {
          const { followers, views, likes } = res.live_deltas;
          showToast(`⚡ Real-Time Sync: +${followers} Followers, +${views} Reel Views, +${likes} Likes!`);
        }
      }
    } catch (e) {
      if (!silent) showToast('Failed to sync live data.', 'error');
    }
  };

  useEffect(() => {
    loadData();
    if (profile.profile_analysis) {
      setAnalysisData(profile.profile_analysis);
    } else if (profile.social_link) {
      handleAnalyzeProfile(profile.social_link, true);
    }

    const interval = setInterval(() => {
      handleLiveSync(true);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyzeProfile = async (linkToAnalyze?: string, silent = false) => {
    const targetLink = linkToAnalyze || socialLinkInput;
    if (!targetLink || targetLink.trim().length === 0) {
      if (!silent) showToast('Please enter your Instagram or social media profile link.', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await api.analyzeCreatorProfile(targetLink.trim());
      if (res.success && res.profile_analysis) {
        setAnalysisData(res.profile_analysis);
        if (res.creator) {
          updateUserProfile(res.creator);
        }
        await refreshSessionUser();
        if (!silent) showToast(`✨ Analyzed Instagram profile! ${res.creator?.followers ? `${res.creator.followers.toLocaleString()} Followers found.` : ''}`);
        setIsAnalyzeModalOpen(false);
      }
    } catch (err: any) {
      if (!silent) showToast(err.message || 'Failed to analyze profile.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePitchResponse = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await api.updateApplicationStatus(appId, status);
      if (res.success) {
        showToast(status === 'accepted' ? '🎉 Pitch accepted! Collaboration created.' : 'Pitch declined.');
        if (status === 'accepted') {
          navigate('/collaborations');
        } else {
          loadData();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update pitch status.', 'error');
    }
  };

  const pendingPitches = myApplications.filter(a => a.status === 'invited');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
              alt="Creator"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-extrabold">{profile.full_name || 'Creator Studio'}</h1>
                <CheckCircle2 className="w-5 h-5 text-purple-500 fill-purple-500/20" />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.location_name || 'Indiranagar, Bengaluru'} • @{profile.username || 'alexcreates'}
              </p>

              {/* Instagram Stat Bar: Posts, Followers, Following */}
              <div className="flex items-center gap-4 pt-1.5 text-xs font-semibold">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white font-heading text-sm mr-1">
                    {(profile.posts_count ?? 2).toLocaleString()}
                  </span>
                  <span className="text-slate-500">posts</span>
                </div>
                <button
                  onClick={() => setConnectionsModal('followers')}
                  className="hover:opacity-80 transition-opacity cursor-pointer text-left"
                >
                  <span className="font-extrabold text-purple-600 dark:text-purple-400 font-heading text-sm mr-1">
                    {(profile.followers ?? 485).toLocaleString()}
                  </span>
                  <span className="text-slate-500">followers</span>
                </button>
                <button
                  onClick={() => setConnectionsModal('following')}
                  className="hover:opacity-80 transition-opacity cursor-pointer text-left"
                >
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 font-heading text-sm mr-1">
                    {(profile.following ?? 312).toLocaleString()}
                  </span>
                  <span className="text-slate-500">following</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4" /> {analysisData ? 'Update Social Link & Re-analyze' : 'Analyze Social Profile'}
            </button>

            <div className="flex items-center gap-4 text-xs border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setConnectionsModal('followers')}
                className="text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 p-2 rounded-xl transition-all cursor-pointer"
              >
                <div className="text-slate-400 font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-500" /> Followers
                </div>
                <div className="font-heading text-lg font-extrabold text-purple-600 dark:text-purple-400">
                  {(profile.followers ?? 485).toLocaleString()}
                </div>
              </button>

              <button
                onClick={() => setConnectionsModal('following')}
                className="text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 p-2 rounded-xl transition-all cursor-pointer"
              >
                <div className="text-slate-400 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Following
                </div>
                <div className="font-heading text-lg font-extrabold text-blue-600 dark:text-blue-400">
                  {(profile.following ?? 312).toLocaleString()}
                </div>
              </button>

              <div className="p-2">
                <div className="text-slate-400 font-semibold">Avg Engagement</div>
                <div className="font-heading text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {profile.engagement_rate || '6.8'}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Profile Analytics & Insights Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-extrabold text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" /> AI Profile Analytics & Creator Insights
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated performance scoring, content niche breakdown, and brand rate card
              </p>
            </div>
            <button
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-extrabold text-xs rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-analyze Profile
            </button>
          </div>

          {analysisData ? (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Health Score */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">Profile Health Score</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="font-heading text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {analysisData.health_score || 92}<span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                    {analysisData.engagement_quality || 'High Organic Reach'}
                  </div>
                </div>

                {/* Estimated Sponsorship Rate Card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">Recommended Rate</span>
                    <DollarSign className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="font-heading text-xl font-extrabold text-purple-600 dark:text-purple-400">
                    ₹{(analysisData.estimated_rates?.min_rate || 4500).toLocaleString()} - ₹{(analysisData.estimated_rates?.max_rate || 12500).toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                    {analysisData.estimated_rates?.unit || 'per Reel / Deliverable'}
                  </div>
                </div>

                {/* Platform & Handle */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">Linked Account</span>
                    <Globe className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="font-heading text-base font-extrabold text-slate-800 dark:text-slate-100 truncate">
                    @{analysisData.handle || profile.username || 'creator'}
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {analysisData.platform || 'Instagram'} Verified
                  </div>
                </div>

                {/* Audience Age & Location */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400">Core Audience</span>
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="font-heading text-base font-extrabold text-slate-800 dark:text-slate-100">
                    {analysisData.audience_demographics?.top_age || '18-34 (76%)'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1">
                    {analysisData.audience_demographics?.top_location || 'Metros & Tier 1'}
                  </div>
                </div>
              </div>

              {/* Niche Breakdown & AI Recommendations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Niche Distribution Bars */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <h3 className="font-heading font-extrabold text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <PieChart className="w-4 h-4 text-purple-500" /> Content Niche Breakdown
                  </h3>
                  <div className="space-y-2.5">
                    {(analysisData.niche_breakdown || [
                      { category: 'Food & Culinary', percentage: 50 },
                      { category: 'Lifestyle', percentage: 30 },
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

                {/* AI Recommendations */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <h3 className="font-heading font-extrabold text-sm flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> AI Recommendations to Boost Brand Deals
                  </h3>
                  <ul className="space-y-2.5">
                    {(analysisData.ai_recommendations || [
                      'Hook Audience in 2 Seconds: Add clear on-screen caption text in the first 2 seconds of video content.',
                      'Optimal Posting Window: Post between 6:30 PM - 9:00 PM IST on weekdays for maximum organic engagement.',
                      'Direct Pitch Rate: Recommended starting pitch rate for brand deliverables is ₹5,000 - ₹8,500.'
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
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-purple-500 mx-auto" />
              <h3 className="font-heading text-sm font-extrabold">Analyze Your Social Media Profile</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Enter your Instagram or YouTube profile link to generate instant AI engagement metrics, content niche breakdown, and brand rate card recommendations.
              </p>
              <button
                onClick={() => setIsAnalyzeModalOpen(true)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-500/20 cursor-pointer transition-all"
              >
                Analyze Profile Link
              </button>
            </div>
          )}
        </div>

        {/* Direct Pitches & Invitations Banner/Section */}
        {pendingPitches.length > 0 && (
          <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 text-white p-6 rounded-3xl border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-xl flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" /> Received Direct Pitches ({pendingPitches.length})
                </h2>
                <p className="text-xs text-purple-200">Brands have directly invited you to collaborate on custom campaigns</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPitches.map((pitch) => (
                <div key={pitch.id} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider">
                        Direct Pitch Offer
                      </span>
                      <h3 className="font-heading font-extrabold text-base text-white mt-1">
                        {pitch.campaign_title || pitch.custom_title || 'Custom Campaign Pitch'}
                      </h3>
                      <p className="text-xs text-purple-200">From {pitch.brand_name || 'Verified Brand'}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-extrabold text-xs border border-emerald-500/30">
                      ₹{(pitch.reward_per_creator || pitch.custom_budget || 0).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 bg-black/20 p-3 rounded-xl italic">
                    "{pitch.pitch}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handlePitchResponse(pitch.id, 'rejected')}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handlePitchResponse(pitch.id, 'accepted')}
                      className="px-5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      Accept Pitch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Campaigns Match Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-heading font-extrabold text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Recommended For You
              </h2>
              <p className="text-xs text-slate-400">Matched using creator category, location radius & followers</p>
            </div>
            <button onClick={() => navigate('/explore')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Explore All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nearbyCampaigns.slice(0, 3).map((camp, idx) => (
              <div
                key={camp.id}
                onClick={() => navigate(`/campaigns/${camp.id}`)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" /> {96 - idx * 4}% Match
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                      ₹{camp.reward_per_creator.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base mb-1">{camp.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {camp.location_name} ({camp.distanceKm || 2.4} km away)
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">{camp.platform}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Applications Tracker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="font-heading font-extrabold text-xl mb-1">My Applications & Direct Pitches</h2>
          <p className="text-xs text-slate-400 mb-6">Track application status & accepted sponsorship briefs</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Campaign & Brand</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Reward</th>
                  <th className="pb-3">Applied On</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {myApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No applications or pitches received yet. Browse campaigns to apply!</td>
                  </tr>
                ) : (
                  myApplications.map(app => (
                    <tr key={app.id}>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {app.campaign_title || app.custom_title || 'Direct Pitch Campaign'}
                      </td>
                      <td className="py-3.5 text-slate-500">{app.location_name || 'Indiranagar, Bengaluru'}</td>
                      <td className="py-3.5 text-emerald-600 font-extrabold">₹{(app.reward_per_creator || app.custom_budget || 0).toLocaleString()}</td>
                      <td className="py-3.5 text-slate-400">{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : app.status === 'invited' ? 'bg-purple-100 text-purple-700' : app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {app.status === 'invited' ? 'Direct Pitch' : app.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {app.status === 'accepted' ? (
                          <button
                            onClick={() => navigate('/collaborations')}
                            className="px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-[11px]"
                          >
                            Open Deal Workflow
                          </button>
                        ) : app.status === 'invited' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePitchResponse(app.id, 'accepted')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handlePitchResponse(app.id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px]"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">Under Review</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Profile Analysis Modal */}
      {isAnalyzeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base">Analyze Social Profile</h3>
                  <p className="text-xs text-slate-500">Run AI profile scoring & rate card estimation</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Instagram / YouTube / TikTok Link or Handle
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="https://instagram.com/alexcreates or @alexcreates"
                  value={socialLinkInput}
                  onChange={(e) => setSocialLinkInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Our AI model evaluates engagement rates, audience demographics, and generates recommended sponsorship pricing.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAnalyzeProfile(undefined, false)}
                disabled={analyzing}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Run AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers & Following List Modal */}
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
                  {connectionsModal} List ({connectionsModal === 'followers' ? (profile.followers_list?.length || 5) : (profile.following_list?.length || 4)})
                </h3>
              </div>
              <button
                onClick={() => setConnectionsModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
              <button
                onClick={() => setConnectionsModal('followers')}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                  connectionsModal === 'followers'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Followers ({profile.followers?.toLocaleString() || '128.4K'})
              </button>
              <button
                onClick={() => setConnectionsModal('following')}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                  connectionsModal === 'following'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Following ({profile.following?.toLocaleString() || '412'})
              </button>
            </div>

            {/* List */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {(connectionsModal === 'followers'
                ? (profile.followers_list && profile.followers_list.length > 0
                    ? profile.followers_list
                    : [
                        { id: '1', name: 'Aarav Mehta', username: 'aarav_vlogs', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', role: 'Content Creator' },
                        { id: '2', name: 'Priya Sharma', username: 'priya_style', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', role: 'Fashion Influencer' },
                        { id: '3', name: 'Vikram Das', username: 'tech_vikram', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', role: 'Tech Reviewer' },
                        { id: '4', name: 'Sneha Patel', username: 'sneha_eats', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', role: 'Foodie Creator' },
                        { id: '5', name: 'Rohan Gupta', username: 'rohan_fit', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', role: 'Fitness Coach' }
                      ])
                : (profile.following_list && profile.following_list.length > 0
                    ? profile.following_list
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
