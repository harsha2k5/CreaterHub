import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Compass,
  Bot,
  Layers,
  MessageSquare,
  DollarSign,
  UserCheck,
  Settings,
  RefreshCw,
  MapPin,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileCheck,
  Send
} from 'lucide-react';
import { Instagram } from '../components/icons/InstagramIcon';
import { InstagramIntegrationView } from '../components/instagram/InstagramIntegrationView';
import { AICreatorAnalysisCard } from '../components/analytics/AICreatorAnalysisCard';

export const CreatorDashboard: React.FC = () => {
  const { user, refreshSessionUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'instagram' | 'ai' | 'collaborations' | 'earnings' | 'messages' | 'profile'>('overview');
  const [loading, setLoading] = useState(true);
  const [syncingInstagram, setSyncingInstagram] = useState(false);

  // Loaded Data
  const [instagramData, setInstagramData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);

  // Deliverables submission state
  const [selectedCollab, setSelectedCollab] = useState<any>(null);
  const [liveUrl, setLiveUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState(false);

  const profile = (user?.profile as any) || {};

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [igRes, appsRes, colRes, earnRes] = await Promise.allSettled([
        api.getInstagramAnalytics(),
        api.getApplications(),
        api.getCollaborations(),
        api.getCreatorEarnings()
      ]);

      if (igRes.status === 'fulfilled' && igRes.value.success) {
        setInstagramData(igRes.value);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value.success) {
        setApplications(appsRes.value.applications || []);
      }
      if (colRes.status === 'fulfilled' && colRes.value.success) {
        setCollaborations(colRes.value.collaborations || []);
      }
      if (earnRes.status === 'fulfilled' && earnRes.value.success) {
        setEarnings(earnRes.value);
      }

      // Check if creator already has stored AI analysis
      if (profile.id) {
        try {
          const aiRes = await api.getCreatorAIAnalysis(profile.id);
          if (aiRes.success && aiRes.analysis) {
            setAiAnalysis(aiRes.analysis);
          }
        } catch {
          // Stored analysis doesn't exist yet
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const handleRefreshInstagram = async () => {
    setSyncingInstagram(true);
    try {
      try {
        await api.syncInstagramAnalytics();
      } catch (syncErr: any) {
        console.warn('Instagram sync warning:', syncErr.message);
      }
      const igRes = await api.getInstagramAnalytics();
      if (igRes && igRes.success) {
        setInstagramData(igRes);
      }
    } catch (err) {
      console.error('Failed to reload Instagram data:', err);
    } finally {
      setSyncingInstagram(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollab || !liveUrl.trim()) return;

    setSubmittingProof(true);
    setProofError('');
    try {
      const res = await api.submitDeliverableProof(selectedCollab.id, {
        live_post_url: liveUrl.trim(),
        notes: proofNotes.trim()
      });

      if (res.success) {
        setProofSuccess(true);
        setTimeout(() => {
          setSelectedCollab(null);
          setProofSuccess(false);
          setLiveUrl('');
          setProofNotes('');
          loadAllData();
        }, 1500);
      }
    } catch (err: any) {
      setProofError(err.message || 'Failed to submit proof.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const isIgConnected = Boolean(instagramData && instagramData.is_connected);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800/80 p-6 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-purple-500/25">
              C
            </div>
            <span className="font-black text-white text-xl tracking-tight">CreaterHub</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" /> Overview
            </button>

            <Link
              to="/creator/feed"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> Discover Briefs
            </Link>

            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'applications'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <FileCheck className="w-4 h-4" /> Applications
              </span>
              {applications.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-purple-300">
                  {applications.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('collaborations')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'collaborations'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4" /> Deliverables
              </span>
              {collaborations.filter(c => c.status === 'ACTIVE').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                  {collaborations.filter(c => c.status === 'ACTIVE').length} active
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('instagram')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'instagram'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <Instagram className="w-4 h-4 text-pink-400" /> Instagram Analytics
              </span>
              {isIgConnected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-400" /> AI Analysis
            </button>

            <Link
              to="/creator/messages"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-blue-400" /> Messages
            </Link>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'earnings'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" /> Escrow & Earnings
            </button>

            <Link
              to={`/creators/${profile.id || ''}`}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
            >
              <UserCheck className="w-4 h-4" /> Public Profile
            </Link>
          </nav>
        </div>

        {/* User Mini Profile */}
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={profile.full_name || 'Creator'}
              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{profile.full_name || 'Creator'}</div>
              <div className="text-[11px] text-slate-500 truncate">@{profile.username}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Top Profile Header (Section 9) */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={profile.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{profile.full_name || 'Creator'}</h1>
                {profile.verified && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>@{profile.username}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-purple-400 font-semibold">
                  <MapPin className="w-3.5 h-3.5" /> {profile.area || profile.city || 'Bengaluru'}
                </span>
                <span>•</span>
                <span className="text-slate-300">
                  Min: ₹{Number(profile.min_budget || 3000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Instagram Status Badge */}
          <div className="flex items-center gap-3">
            {isIgConnected ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Instagram Connected ✓
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('instagram')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-600/20"
              >
                <Instagram className="w-4 h-4" /> Connect Instagram
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Active Deliverables</div>
                <div className="text-3xl font-black text-white">
                  {collaborations.filter(c => c.status === 'ACTIVE' || c.status === 'SUBMITTED').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Campaigns in progress</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Applications Submitted</div>
                <div className="text-3xl font-black text-purple-400">
                  {applications.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {applications.filter(a => a.status === 'ACCEPTED').length} accepted
                </div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Simulated Escrow Balance</div>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{Number(earnings?.held_in_escrow || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Pending approval release</div>
              </div>
            </div>

            {/* Campaign Discovery CTA Banner */}
            <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 p-8 rounded-3xl border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
              <div>
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                  Local Matchmaker
                </span>
                <h3 className="text-xl font-black text-white mb-2">Explore Nearby Campaign Feed</h3>
                <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                  Discover briefs within 1km - 25km radius from your current location and apply with custom pitches.
                </p>
              </div>
              <Link
                to="/creator/feed"
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 self-start sm:self-auto"
              >
                <Compass className="w-4 h-4" /> Open Campaign Feed
              </Link>
            </div>

            {/* Active Collaborations Quick List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Current Collaborations</h3>
                <button onClick={() => setActiveTab('collaborations')} className="text-xs text-purple-400 font-bold hover:underline">
                  View All ({collaborations.length})
                </button>
              </div>

              {collaborations.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-slate-800 text-xs text-slate-400">
                  No active collaborations yet. Apply to campaigns on the feed to get hired!
                </div>
              ) : (
                <div className="space-y-3">
                  {collaborations.slice(0, 3).map(col => (
                    <div
                      key={col.id}
                      className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img src={col.brand_logo} alt={col.brand_name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{col.campaign_title}</h4>
                          <span className="text-[11px] text-slate-400">{col.brand_name} • ₹{col.reward_per_creator?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          col.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : col.status === 'SUBMITTED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {col.status}
                        </span>
                        <button
                          onClick={() => { setSelectedCollab(col); setActiveTab('collaborations'); }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                        >
                          Details & Proof
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Instagram Analytics (Strict Zero Fake Data) */}
        {activeTab === 'instagram' && (
          <InstagramIntegrationView
            data={instagramData}
            onRefresh={handleRefreshInstagram}
            syncing={syncingInstagram}
          />
        )}

        {/* Tab 3: AI Creator Analysis */}
        {activeTab === 'ai' && (
          <AICreatorAnalysisCard
            analysis={aiAnalysis}
            isInstagramConnected={isIgConnected}
            onAnalysisUpdated={newAnalysis => setAiAnalysis(newAnalysis)}
          />
        )}

        {/* Tab 4: Collaborations & Deliverable Submissions */}
        {activeTab === 'collaborations' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Collaboration Deliverables</h2>
              <p className="text-xs text-slate-400">
                Track deliverables, submit live links and screenshots, and verify approvals.
              </p>
            </div>

            {collaborations.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800 text-xs text-slate-400">
                No collaborations recorded yet. Explore briefs to begin collaborating.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {collaborations.map(col => (
                  <div key={col.id} className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                          Campaign Brief
                        </span>
                        <h3 className="text-lg font-black text-white">{col.campaign_title}</h3>
                        <div className="text-xs text-slate-400">{col.brand_name} • Reward: ₹{col.reward_per_creator?.toLocaleString()}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Status: {col.status}
                        </span>
                        {col.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setSelectedCollab(col)}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                          >
                            Submit Proof
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Step Progression Bar */}
                    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-center">
                      {[
                        { step: 1, label: 'Accepted' },
                        { step: 2, label: 'Content Creation' },
                        { step: 3, label: 'Proof Submitted' },
                        { step: 4, label: 'Approved & Paid' }
                      ].map(s => (
                        <div
                          key={s.step}
                          className={`p-2 rounded-xl border text-[11px] font-bold ${
                            (col.current_step || 1) >= s.step
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-slate-950/40 text-slate-500 border-slate-800'
                          }`}
                        >
                          Step {s.step}: {s.label}
                        </div>
                      ))}
                    </div>

                    {/* Submitted Deliverables if any */}
                    {col.submissions?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-bold text-slate-400 block mb-2">Submitted Proof History:</span>
                        {col.submissions.map((sub: any) => (
                          <div key={sub.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                            <a
                              href={sub.live_post_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              {sub.live_post_url} <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {sub.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Proof Modal */}
            {selectedCollab && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
                  {proofSuccess ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <h3 className="text-lg font-bold text-white mb-1">Deliverable Submitted!</h3>
                      <p className="text-xs text-slate-400">The brand will review and release your escrow payment.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitProof} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white">Submit Deliverable Proof</h3>
                        <button onClick={() => setSelectedCollab(null)} className="text-slate-400 hover:text-white">✕</button>
                      </div>

                      {proofError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 text-xs">{proofError}</div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Live Instagram Post / Reel URL *
                        </label>
                        <input
                          type="url"
                          required
                          value={liveUrl}
                          onChange={e => setLiveUrl(e.target.value)}
                          placeholder="https://www.instagram.com/reel/..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Notes / Collaboration Remarks (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={proofNotes}
                          onChange={e => setProofNotes(e.target.value)}
                          placeholder="Mention metrics, audio credits, or brand mentions..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingProof}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {submittingProof ? 'Submitting...' : 'Confirm Submission'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Applications */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white mb-1">My Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800 text-xs text-slate-400">
                You have not submitted any applications yet.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-0.5">
                        {app.campaign_category}
                      </span>
                      <h4 className="text-base font-black text-white">{app.campaign_title}</h4>
                      <div className="text-xs text-slate-400 mt-1">
                        Brand: {app.brand_name} • Offered: ₹{app.proposed_budget || app.reward_per_creator}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic">"{app.pitch}"</p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === 'ACCEPTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Earnings & Simulated Escrow */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Escrow & Payout Ledger</h2>
              <p className="text-xs text-slate-400">
                Transparent escrow fund management. Funds are held upon application acceptance and released upon deliverable approval.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Total Completed Payouts</div>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{Number(earnings?.total_earned || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Successfully released from escrow</div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Currently Held in Escrow</div>
                <div className="text-3xl font-black text-purple-400">
                  ₹{Number(earnings?.held_in_escrow || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Locked for active collaborations</div>
              </div>
            </div>

            {/* Payment Ledger Notice */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>Payment Mode: <strong className="text-purple-300">{earnings?.mode_notice || 'Development Escrow Simulator'}</strong></span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
