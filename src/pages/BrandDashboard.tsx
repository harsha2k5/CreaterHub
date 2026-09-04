import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  PlusCircle,
  Users,
  Layers,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

export const BrandDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'create' | 'applications' | 'creators' | 'collaborations'>('overview');
  const [loading, setLoading] = useState(true);

  // Brand data states
  const [analytics, setAnalytics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [matchedCreators, setMatchedCreators] = useState<any[]>([]);

  // Create Campaign Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Food & Beverage');
  const [formLocation, setFormLocation] = useState('');
  const [formCity, setFormCity] = useState('Bengaluru');
  const [formReward, setFormReward] = useState('5000');
  const [formCreatorsReq, setFormCreatorsReq] = useState('3');
  const [formRadius, setFormRadius] = useState('10');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800');
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Deliverable Review State
  const [reviewingCollab, setReviewingCollab] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REVISION'>('APPROVE');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  // Direct Pitch State
  const [pitchingCreator, setPitchingCreator] = useState<any>(null);
  const [pitchBudget, setPitchBudget] = useState('5000');
  const [pitchMessage, setPitchMessage] = useState('');
  const [pitchDeliverables, setPitchDeliverables] = useState('1x Reel + 2x Stories');
  const [sendingPitch, setSendingPitch] = useState(false);
  const [pitchSuccess, setPitchSuccess] = useState(false);

  const brandProfile = (user?.profile as any) || {};

  const loadData = async () => {
    setLoading(true);
    try {
      const [anaRes, campRes, appRes, colRes] = await Promise.allSettled([
        api.getBrandAnalytics(),
        api.getCampaigns({ brand_id: brandProfile.id, status: 'ALL' }),
        api.getApplications(),
        api.getCollaborations()
      ]);

      if (anaRes.status === 'fulfilled' && anaRes.value.success) {
        setAnalytics(anaRes.value.analytics);
      }
      if (campRes.status === 'fulfilled' && campRes.value.success) {
        setCampaigns(campRes.value.campaigns || []);
      }
      if (appRes.status === 'fulfilled' && appRes.value.success) {
        setApplications(appRes.value.applications || []);
      }
      if (colRes.status === 'fulfilled' && colRes.value.success) {
        setCollaborations(colRes.value.collaborations || []);
      }

      // Load creators for matcher
      const creatorsRes = await api.getCreators({ limit: '10' });
      if (creatorsRes.success && creatorsRes.creators) {
        setMatchedCreators(creatorsRes.creators);
      }
    } catch (err) {
      console.error('Error loading brand dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCampaign(true);
    try {
      const payload = {
        title: formTitle,
        description: formDesc,
        category: formCategory,
        location_name: formLocation || brandProfile.location_name || 'Outlet Location',
        city: formCity,
        radius_km: Number(formRadius),
        reward_per_creator: Number(formReward),
        creators_required: Number(formCreatorsReq),
        budget_total: Number(formReward) * Number(formCreatorsReq),
        image_url: formImage
      };

      const res = await api.createCampaign(payload);
      if (res.success) {
        setCreateSuccess(true);
        setTimeout(() => {
          setCreateSuccess(false);
          setActiveTab('campaigns');
          loadData();
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleUpdateAppStatus = async (appId: string, status: 'ACCEPTED' | 'SHORTLISTED' | 'REJECTED') => {
    try {
      await api.updateApplicationStatus(appId, status);
      loadData();
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const handleReviewDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingCollab) return;

    setProcessingReview(true);
    try {
      await api.reviewDeliverableProof(reviewingCollab.id, {
        action: reviewAction,
        feedback: reviewFeedback
      });
      setReviewingCollab(null);
      setReviewFeedback('');
      loadData();
    } catch (err) {
      console.error('Error reviewing deliverable:', err);
    } finally {
      setProcessingReview(false);
    }
  };

  const handleSendDirectPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchingCreator) return;

    setSendingPitch(true);
    try {
      await api.sendDirectPitch(pitchingCreator.id, {
        message: pitchMessage,
        proposed_budget: Number(pitchBudget),
        deliverables: pitchDeliverables
      });
      setPitchSuccess(true);
      setTimeout(() => {
        setPitchingCreator(null);
        setPitchSuccess(false);
        setPitchMessage('');
      }, 1500);
    } catch (err) {
      console.error('Error sending pitch:', err);
    } finally {
      setSendingPitch(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Brand Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800/80 p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25">
              C
            </div>
            <span className="font-black text-white text-xl tracking-tight">CreaterHub</span>
          </Link>

          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Overview
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4" /> Campaigns
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-blue-300">
                {campaigns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" /> Create Campaign
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'applications'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="w-4 h-4" /> Applications
              </span>
              {applications.filter(a => a.status === 'PENDING').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-bold">
                  {applications.filter(a => a.status === 'PENDING').length} new
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('collaborations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'collaborations'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Deliverables Proof
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {collaborations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('creators')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'creators'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> Discover Creators
            </button>

            <Link
              to="/creator/messages"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" /> Messages
            </Link>
          </nav>
        </div>

        {/* Brand Mini Card */}
        <div className="pt-6 border-t border-slate-800 flex items-center gap-3">
          <img
            src={brandProfile.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100'}
            alt={brandProfile.company_name}
            className="w-9 h-9 rounded-xl object-cover border border-slate-700"
          />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{brandProfile.company_name}</div>
            <div className="text-[11px] text-slate-500 truncate">{brandProfile.category}</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Header Bar */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src={brandProfile.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150'}
              alt={brandProfile.company_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{brandProfile.company_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Verified Brand
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{brandProfile.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-400">
                  <MapPin className="w-3.5 h-3.5" /> {brandProfile.location_name || brandProfile.city}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('create')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Launch Campaign
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Dashboard 6 Cards (Section 17) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Active Campaigns</div>
                <div className="text-3xl font-black text-white">{analytics?.active_campaigns || campaigns.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Live in marketplace</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Creator Applications</div>
                <div className="text-3xl font-black text-purple-400">{analytics?.total_applications || applications.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Total submitted pitches</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Selected Creators</div>
                <div className="text-3xl font-black text-blue-400">{analytics?.selected_creators || collaborations.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Hired for content briefs</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Completed Campaigns</div>
                <div className="text-3xl font-black text-emerald-400">{analytics?.completed_campaigns || 0}</div>
                <div className="text-[11px] text-slate-500 mt-1">Deliverables verified & paid</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Total Committed Spend</div>
                <div className="text-3xl font-black text-white">₹{Number(analytics?.total_spend || 0).toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 mt-1">Escrow locked & released</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Estimated Local Reach</div>
                <div className="text-3xl font-black text-pink-400">{Number(analytics?.estimated_reach || 0).toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 mt-1">Verified audience impressions</div>
              </div>
            </div>

            {/* Recent Applications Quick Glance */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Recent Creator Applications</h3>
                <button onClick={() => setActiveTab('applications')} className="text-xs text-blue-400 font-bold hover:underline">
                  View All ({applications.length})
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-slate-800 text-xs text-slate-400">
                  No applications received yet. Your active campaigns are currently discoverable by nearby creators.
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map(app => (
                    <div
                      key={app.id}
                      className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img src={app.creator_avatar} alt={app.creator_name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{app.creator_name}</h4>
                          <span className="text-[11px] text-slate-400">@{app.creator_username} • Applied for {app.campaign_title}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'ACCEPTED')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                            {app.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create Campaign Wizard (Section 18) */}
        {activeTab === 'create' && (
          <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 max-w-2xl mx-auto shadow-xl">
            <div className="mb-6">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Step-by-Step Brief Builder
              </span>
              <h2 className="text-2xl font-black text-white">Create New Campaign</h2>
              <p className="text-xs text-slate-400 mt-1">
                Define deliverables, target neighborhood, budget, and creator requirements.
              </p>
            </div>

            {createSuccess ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white mb-1">Campaign Published!</h3>
                <p className="text-xs text-slate-400">Nearby creators will discover it on their feed.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Artisanal Cold Brew Tasting & Reel Promo"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Campaign Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Describe collaboration goals, atmosphere, guidelines, and what creators will showcase..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Food & Beverage">Food & Beverage</option>
                      <option value="Fitness & Wellness">Fitness & Wellness</option>
                      <option value="Beauty & Skincare">Beauty & Skincare</option>
                      <option value="Dining & Nightlife">Dining & Nightlife</option>
                      <option value="Retail & Fashion">Retail & Fashion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Target Neighborhood / Area</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={e => setFormLocation(e.target.value)}
                      placeholder="e.g. Indiranagar 12th Main"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Reward/Creator (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formReward}
                      onChange={e => setFormReward(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Creators Needed *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formCreatorsReq}
                      onChange={e => setFormCreatorsReq(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Search Radius (km)</label>
                    <input
                      type="number"
                      value={formRadius}
                      onChange={e => setFormRadius(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={formImage}
                    onChange={e => setFormImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 mt-4"
                >
                  {creatingCampaign ? 'Publishing...' : 'Publish Campaign to Local Feed'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Applications Review */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white mb-1">Creator Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800 text-xs text-slate-400">
                No applications submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img src={app.creator_avatar} alt={app.creator_name} className="w-14 h-14 rounded-2xl object-cover border border-slate-700" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">{app.creator_name}</h3>
                            <span className="text-xs text-slate-400">@{app.creator_username}</span>
                            {app.match_score && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {app.match_score}% Match
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Applied to: <strong className="text-white">{app.campaign_title}</strong>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Verified Followers: <strong className="text-purple-300">{app.ig_followers ? app.ig_followers.toLocaleString() : 'Unconnected'}</strong> • Offered: ₹{app.proposed_budget || app.reward_per_creator}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'ACCEPTED')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                            >
                              Accept & Lock Escrow
                            </button>
                            <button
                              onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            app.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {app.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                      <strong className="block text-slate-400 text-[10px] uppercase mb-1">Creator Pitch</strong>
                      "{app.pitch}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Deliverables Verification */}
        {activeTab === 'collaborations' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white mb-1">Deliverables & Content Verification</h2>
            {collaborations.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800 text-xs text-slate-400">
                No active collaborations yet.
              </div>
            ) : (
              <div className="space-y-4">
                {collaborations.map(col => (
                  <div key={col.id} className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                        {col.campaign_title}
                      </span>
                      <h3 className="text-base font-black text-white">Creator: {col.creator_name}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Status: <strong className="text-purple-300">{col.status}</strong> • Escrow: ₹{col.reward_per_creator?.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {col.submissions?.length > 0 && col.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => setReviewingCollab(col)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Review Proof & Release Escrow
                        </button>
                      ) : col.status === 'COMPLETED' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Approved & Escrow Released ✓
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Awaiting Creator Post</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Review Modal */}
            {reviewingCollab && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
                  <h3 className="text-lg font-black text-white mb-2">Review Deliverable Proof</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Inspect submitted live post URL. Approving will automatically release locked escrow funds.
                  </p>

                  <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-1">Live Instagram Link:</span>
                    <a
                      href={reviewingCollab.submissions?.[0]?.live_post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 font-bold hover:underline flex items-center gap-1"
                    >
                      {reviewingCollab.submissions?.[0]?.live_post_url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <form onSubmit={handleReviewDeliverable} className="space-y-4">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setReviewAction('APPROVE')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                          reviewAction === 'APPROVE'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Approve & Release Escrow
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewAction('REVISION')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                          reviewAction === 'REVISION'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Request Revision
                      </button>
                    </div>

                    {reviewAction === 'REVISION' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Revision Instructions</label>
                        <textarea
                          rows={2}
                          required
                          value={reviewFeedback}
                          onChange={e => setReviewFeedback(e.target.value)}
                          placeholder="State what needs adjustment (e.g. tag outlet location, add promo code in caption)..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewingCollab(null)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processingReview}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {processingReview ? 'Processing...' : 'Confirm Action'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Creators Discovery & Matchmaker */}
        {activeTab === 'creators' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white mb-1">Discover Local Creators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchedCreators.map(cr => (
                <div key={cr.id} className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={cr.avatar_url} alt={cr.full_name} className="w-12 h-12 rounded-2xl object-cover border border-slate-700" />
                      <div>
                        <h4 className="text-sm font-black text-white">{cr.full_name}</h4>
                        <span className="text-xs text-slate-400">@{cr.username}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{cr.bio}</p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-xl mb-4">
                      <div>
                        <span className="text-slate-500 block">Verified Followers:</span>
                        <strong className="text-white">{cr.instagram?.followers_count ? cr.instagram.followers_count.toLocaleString() : 'Unconnected'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Engagement:</span>
                        <strong className="text-emerald-400">{cr.instagram?.engagement_rate ? `${cr.instagram.engagement_rate}%` : '—'}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setPitchingCreator(cr)}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                  >
                    Direct Pitch
                  </button>
                </div>
              ))}
            </div>

            {/* Direct Pitch Modal */}
            {pitchingCreator && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                  {pitchSuccess ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <h3 className="text-base font-bold text-white mb-1">Pitch Dispatched!</h3>
                      <p className="text-xs text-slate-400">Creator has been notified in Messages.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendDirectPitch} className="space-y-4">
                      <h3 className="text-base font-black text-white">Direct Pitch to {pitchingCreator.full_name}</h3>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Proposed Budget (₹)</label>
                        <input
                          type="number"
                          value={pitchBudget}
                          onChange={e => setPitchBudget(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Deliverables</label>
                        <input
                          type="text"
                          value={pitchDeliverables}
                          onChange={e => setPitchDeliverables(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Message</label>
                        <textarea
                          rows={3}
                          value={pitchMessage}
                          onChange={e => setPitchMessage(e.target.value)}
                          placeholder="Tell the creator why you'd like them to visit your outlet..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPitchingCreator(null)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={sendingPitch}
                          className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                        >
                          {sendingPitch ? 'Sending...' : 'Send Pitch'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
