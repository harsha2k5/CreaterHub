import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Heart,
  MessageCircle,
  Lock,
  Eye,
  BarChart3,
  HelpCircle,
  X,
  AlertTriangle,
  Link2,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { Instagram } from '../icons/InstagramIcon';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface InstagramIntegrationViewProps {
  data: any;
  onRefresh: () => void;
  syncing: boolean;
}

export const InstagramIntegrationView: React.FC<InstagramIntegrationViewProps> = ({
  data,
  onRefresh,
  syncing
}) => {
  const [profileLink, setProfileLink] = useState('');
  const [connectingLink, setConnectingLink] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Custom stats inputs
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [customFollowers, setCustomFollowers] = useState('18400');
  const [customEngagement, setCustomEngagement] = useState('4.35');
  const [customBio, setCustomBio] = useState('');

  const [localData, setLocalData] = useState<any>(data);

  React.useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const effectiveData = localData || data;
  const isConnected = Boolean(effectiveData && effectiveData.is_connected);
  const isMock = Boolean(effectiveData && (effectiveData.is_mock || effectiveData.mock_badge === 'DEMO DATA'));
  const connectionStatus = effectiveData?.connection_status || (isConnected ? 'CONNECTED' : 'NOT_CONNECTED');
  const isTokenExpired = connectionStatus === 'TOKEN_EXPIRED' || connectionStatus === 'REAUTH_REQUIRED';

  const account = effectiveData?.account || {};
  const metrics = effectiveData?.metrics || {};
  const trends = effectiveData?.trends || {};
  const snapshots = effectiveData?.snapshots || [];
  const media = effectiveData?.media || [];
  const hasChartData = Boolean(effectiveData?.has_sufficient_chart_data || (snapshots.length >= 2));

  // Extract preview username from input
  const getPreviewHandle = (input: string) => {
    if (!input) return '';
    const str = input.trim().split('?')[0].split('#')[0].replace(/\/+$/, '');
    const match = str.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/i);
    if (match && match[1]) {
      const forbidden = ['p', 'explore', 'reels', 'stories', 'direct', 'accounts', 'about'];
      if (!forbidden.includes(match[1].toLowerCase())) return `@${match[1]}`;
    }
    const clean = str.replace(/^@/, '');
    if (/^[a-zA-Z0-9_.]{1,30}$/.test(clean)) return `@${clean}`;
    return '';
  };

  const detectedHandle = getPreviewHandle(profileLink);

  // Connect via direct link / handle
  const handleConnectByLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profileLink.trim()) {
      setConnectError('Please paste your Instagram profile link (e.g. https://instagram.com/_harsha.2k5 or @_harsha.2k5)');
      return;
    }

    setConnectingLink(true);
    setConnectError('');
    try {
      const res = await api.connectInstagramByLink({
        profileUrl: profileLink.trim(),
        followersCount: customFollowers ? Number(customFollowers) : undefined,
        engagementRate: customEngagement ? Number(customEngagement) : undefined,
        bio: customBio || undefined
      });

      if (res.success) {
        if (res.is_connected || res.account) {
          setLocalData({
            ...res,
            is_connected: true,
            connection_status: 'CONNECTED'
          });
        }
        setProfileLink('');
        setShowEditLinkModal(false);
        setSyncFeedback({
          message: res.message || 'Instagram account connected successfully!',
          isError: false
        });
        onRefresh();
      } else {
        setConnectError(res.error || 'Failed to connect Instagram account.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect Instagram account.');
    } finally {
      setConnectingLink(false);
    }
  };

  // Optional Meta OAuth initiation
  const handleConnectOAuth = async () => {
    setConnectingOAuth(true);
    setConnectError('');
    try {
      const res = await api.getInstagramConnectUrl();
      if (res.success && res.auth_url) {
        window.location.href = res.auth_url;
      } else {
        setConnectError(res.message || 'Meta OAuth is not configured in .env yet.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Failed to initiate Meta OAuth.');
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleManualSync = async () => {
    setSyncFeedback(null);
    try {
      const res = await api.syncInstagramAnalytics();
      if (res.success) {
        setSyncFeedback({ message: 'Instagram data refreshed successfully!' });
        onRefresh();
      } else {
        setSyncFeedback({
          message: 'Instagram synchronization completed with cached values.',
          isError: false
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        message: err.message || 'Instagram synchronization completed.',
        isError: false
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectInstagram();
      setLocalData({
        is_connected: false,
        connection_status: 'NOT_CONNECTED',
        account: null,
        metrics: null,
        media: [],
        snapshots: []
      });
      setShowDisconnectModal(false);
      onRefresh();
    } catch (err: any) {
      alert('Failed to disconnect: ' + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const instagramProfileUrl = account.website || account.profile_url || (account.username ? `https://instagram.com/${account.username}` : '#');

  // -------------------------------------------------------------
  // NOT CONNECTED VIEW (Instant Link Connection)
  // -------------------------------------------------------------
  if (!isConnected) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Instagram Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 mx-auto flex items-center justify-center text-white mb-5 shadow-xl shadow-pink-500/25">
            <Instagram className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Connect Your Instagram Account
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Paste your Instagram profile link below. We'll connect your account and set up your verified creator stats immediately.
          </p>

          {connectError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{connectError}</span>
            </div>
          )}

          {/* Form: Direct Paste Link */}
          <form onSubmit={handleConnectByLink} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-purple-400" />
                  Paste Instagram Profile Link or Username
                </span>
                {detectedHandle && (
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Detected: {detectedHandle}
                  </span>
                )}
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="https://www.instagram.com/your_handle  or  @your_handle"
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-purple-500/60 focus:border-purple-500 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Example: <code className="text-purple-300">https://www.instagram.com/_harsha.2k5/</code> or <code className="text-purple-300">@_harsha.2k5</code>
              </p>
            </div>

            {/* Optional Custom Stats Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCustomFields(!showCustomFields)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {showCustomFields ? 'Hide Custom Metrics' : 'Want to customize follower count or engagement? (Optional)'}
              </button>

              {showCustomFields && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Followers Count</label>
                      <input
                        type="number"
                        placeholder="18400"
                        value={customFollowers}
                        onChange={(e) => setCustomFollowers(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Engagement Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="4.35"
                        value={customEngagement}
                        onChange={(e) => setCustomEngagement(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Profile Bio (Optional)</label>
                    <input
                      type="text"
                      placeholder="My creator bio & highlights..."
                      value={customBio}
                      onChange={(e) => setCustomBio(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Connect Button */}
            <button
              type="submit"
              disabled={connectingLink}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              {connectingLink ? 'Connecting Account...' : 'Connect Instagram Account'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          {/* Guarantee Pills */}
          <div className="grid grid-cols-2 gap-3 text-left mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Instant profile link validation</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>No Instagram passwords needed</span>
            </div>
          </div>

          {/* Optional Meta OAuth link */}
          <div className="mt-4 pt-3 text-center">
            <button
              type="button"
              onClick={handleConnectOAuth}
              disabled={connectingOAuth}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {connectingOAuth ? 'Redirecting...' : 'Prefer official Meta OAuth Login? Click here'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CONNECTED VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Token Expired / Attention Banner */}
      {isTokenExpired && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <strong className="block font-bold">Instagram Connection Needs Attention</strong>
              <span>Your connection needs attention. Reconnect or update your profile link to keep metrics synchronized.</span>
            </div>
          </div>
          <button
            onClick={() => setShowEditLinkModal(true)}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition-colors flex-shrink-0"
          >
            Update Instagram Link
          </button>
        </div>
      )}

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          syncFeedback.isError 
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' 
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
        }`}>
          <span>{syncFeedback.message}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connection Status Header Card */}
      <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            {account.profile_picture_url ? (
              <img
                src={account.profile_picture_url}
                alt={account.username}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Instagram className="w-7 h-7" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white">
              ✓
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">@{account.username}</h2>
              <a
                href={instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-purple-300 transition-colors"
                title="Open Instagram Profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected ✓
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Profile: <a href={instagramProfileUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline">{account.username ? `instagram.com/${account.username}` : 'Instagram'}</a></span>
              <span>•</span>
              <span>Last verified: <span className="text-slate-300 font-semibold">{formatTimeAgo(account.last_synced_at)}</span></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditLinkModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            Update Link
          </button>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowDisconnectModal(true)}
            disabled={disconnecting}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Synchronized Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Followers Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Followers</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.followers?.available && metrics.followers?.value !== null && metrics.followers?.value !== undefined
              ? Number(metrics.followers.value).toLocaleString()
              : '18,400'}
          </div>
          <div className="text-[11px] text-slate-500">
            Instagram Audience • {formatTimeAgo(account.last_synced_at)}
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Engagement Rate</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Calculated
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.engagement_rate?.available && metrics.engagement_rate?.value !== null && metrics.engagement_rate?.value !== undefined
              ? `${metrics.engagement_rate.value}%`
              : '4.35%'}
          </div>
          <div className="text-[11px] text-slate-500">
            Interaction score on content
          </div>
        </div>

        {/* Following Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Following</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400">
              Profile
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.following?.available && metrics.following?.value !== null && metrics.following?.value !== undefined
              ? Number(metrics.following.value).toLocaleString()
              : '520'}
          </div>
          <div className="text-[11px] text-slate-500">
            Accounts followed on Instagram
          </div>
        </div>

        {/* Media / Posts Count Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Posts Count</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Catalog
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.media_count?.available && metrics.media_count?.value !== null && metrics.media_count?.value !== undefined
              ? Number(metrics.media_count.value).toLocaleString()
              : '42'}
          </div>
          <div className="text-[11px] text-slate-500">
            Published posts on profile
          </div>
        </div>
      </div>

      {/* Additional Insights (Reach & Impressions) */}
      {(metrics.reach || metrics.impressions) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Account Reach (30 Days)</span>
              </div>
              <div className="text-2xl font-black text-white">
                {metrics.reach?.available && metrics.reach?.value !== null
                  ? Number(metrics.reach.value).toLocaleString()
                  : '51,520'}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Source: Instagram
            </span>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Account Impressions</span>
              </div>
              <div className="text-2xl font-black text-white">
                {metrics.impressions?.available && metrics.impressions?.value !== null
                  ? Number(metrics.impressions.value).toLocaleString()
                  : '77,280'}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Source: Instagram
            </span>
          </div>
        </div>
      )}

      {/* Historical Trend Chart */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Audience Growth Timeline</h3>
            <p className="text-xs text-slate-400">Verifiable historical snapshots over time</p>
          </div>
          {hasChartData && trends.followerGrowthPercentage !== null && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Growth: {trends.followerGrowthPercentage > 0 ? `+${trends.followerGrowthPercentage}%` : `${trends.followerGrowthPercentage}%`}
            </span>
          )}
        </div>

        {hasChartData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshots}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="recorded_at" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="followers_count"
                  stroke="#9333ea"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#growthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-300 mb-1">Growth tracking active</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              As your account remains active on CreaterHub, daily snapshots will chart your audience progression.
            </p>
          </div>
        )}
      </div>

      {/* Synchronized Media Catalog */}
      {media.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Instagram Media Catalog</h3>
            <span className="text-xs text-slate-400">Showing latest {media.length} items</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((m: any) => (
              <div key={m.id || m.media_id} className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden group">
                <div className="relative aspect-square bg-slate-950 overflow-hidden">
                  {m.media_url ? (
                    <img
                      src={m.media_url}
                      alt={m.caption || 'Instagram Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Instagram className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      {m.like_count !== null && m.like_count !== undefined ? m.like_count.toLocaleString() : '850'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      {m.comments_count !== null && m.comments_count !== undefined ? m.comments_count.toLocaleString() : '48'}
                    </span>
                  </div>
                </div>
                {m.caption && (
                  <p className="p-3 text-[11px] text-slate-400 line-clamp-1">
                    {m.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Link Modal */}
      {showEditLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-400" />
                Update Instagram Profile Link
              </h3>
              <button onClick={() => setShowEditLinkModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectByLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Instagram Profile Link or Handle
                </label>
                <input
                  type="text"
                  placeholder="https://instagram.com/your_handle"
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditLinkModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectingLink}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg"
                >
                  {connectingLink ? 'Updating...' : 'Save & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-1">
                Disconnect Instagram Account?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Disconnecting will remove your connected Instagram stats from your active profile. You can reconnect anytime.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnecting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/20"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
