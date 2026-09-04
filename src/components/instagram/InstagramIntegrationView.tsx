import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Heart,
  MessageCircle,
  Lock,
  Eye,
  BarChart3,
  HelpCircle,
  X,
  AlertTriangle
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
  const [connecting, setConnecting] = useState(false);
  const [connectingSandbox, setConnectingSandbox] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const isConnected = Boolean(data && data.is_connected);
  const isMock = Boolean(data && (data.is_mock || data.mock_badge === 'DEMO DATA'));
  const connectionStatus = data?.connection_status || (isConnected ? 'CONNECTED' : 'NOT_CONNECTED');
  const isTokenExpired = connectionStatus === 'TOKEN_EXPIRED' || connectionStatus === 'REAUTH_REQUIRED';

  const account = data?.account || {};
  const metrics = data?.metrics || {};
  const trends = data?.trends || {};
  const snapshots = data?.snapshots || [];
  const media = data?.media || [];
  const hasChartData = Boolean(data?.has_sufficient_chart_data || (snapshots.length >= 2));

  // Custom sandbox inputs
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [customHandle, setCustomHandle] = useState('');
  const [customFollowers, setCustomFollowers] = useState('18400');
  const [customEngagement, setCustomEngagement] = useState('4.35');
  const [customBio, setCustomBio] = useState('');

  const handleConnectInstagram = async () => {
    setConnecting(true);
    setConnectError('');
    try {
      const res = await api.getInstagramConnectUrl();
      if (res.success && res.auth_url) {
        window.location.href = res.auth_url;
      } else {
        setConnectError(res.message || 'Meta OAuth is not configured yet on this environment.');
      }
    } catch (err: any) {
      setConnectError(err.message || "Your Instagram account cannot currently be connected through Meta's Instagram API. Please make sure you are using an eligible professional Instagram account.");
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectSandbox = async (options?: any) => {
    setConnectingSandbox(true);
    setConnectError('');
    try {
      const payload = options || (customHandle ? {
        username: customHandle,
        followersCount: customFollowers ? Number(customFollowers) : undefined,
        engagementRate: customEngagement ? Number(customEngagement) : undefined,
        bio: customBio || undefined
      } : undefined);

      const res = await api.connectInstagramSandbox(payload);
      if (res.success) {
        onRefresh();
      } else {
        setConnectError(res.error || 'Failed to connect Development Mock Mode.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect Development Mock Mode.');
    } finally {
      setConnectingSandbox(false);
    }
  };

  const handleManualSync = async () => {
    setSyncFeedback(null);
    try {
      const res = await api.syncInstagramAnalytics();
      if (res.success) {
        setSyncFeedback({ message: 'Instagram data refreshed successfully from Meta API.' });
        onRefresh();
      } else {
        setSyncFeedback({
          message: 'Instagram synchronization failed. Showing last successfully synchronized data.',
          isError: true
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        message: err.message || 'Instagram synchronization failed. Showing last successfully synchronized data.',
        isError: true
      });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectInstagram();
      setShowDisconnectModal(false);
      onRefresh();
    } catch (err: any) {
      alert('Failed to disconnect: ' + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  };

  // -------------------------------------------------------------
  // NOT CONNECTED VIEW
  // -------------------------------------------------------------
  if (!isConnected) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Main Connect Card */}
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-pink-500/20">
            <Instagram className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
            Connect Your Instagram Professional Account
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
            Connect your official Instagram Professional account to unlock live verified analytics, AI brand suitability scoring, and guaranteed data transparency for brands.
          </p>

          {/* Account Requirements Box */}
          <div className="mb-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left max-w-xl mx-auto text-xs text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-2 mb-2.5">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Meta API Account Eligibility Requirements:
            </h4>
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              <li>Must be an <strong>Instagram Creator</strong> or <strong>Business Account</strong> (Personal accounts cannot share API metrics).</li>
              <li>Your Instagram profile must be connected to a <strong>Facebook Page</strong>.</li>
              <li>You must possess <strong>Admin access</strong> on that connected Facebook Page.</li>
            </ul>
          </div>

          {connectError && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs text-left max-w-xl mx-auto flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">Meta API Connection Note</strong>
                  <span>{connectError}</span>
                </div>
              </div>

              {/* Developer Mock Option in Non-Production */}
              <div className="pt-3 border-t border-amber-500/20 text-slate-300">
                <p className="mb-2">
                  To test CreaterHub locally without a registered Meta Developer App, use <strong>Development Mock Mode</strong> (strictly disabled in production):
                </p>
                <button
                  onClick={() => handleConnectSandbox()}
                  disabled={connectingSandbox}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  {connectingSandbox ? 'Connecting...' : 'Connect Development Demo Account'}
                </button>

                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowCustomFields(!showCustomFields)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    {showCustomFields ? '▲ Hide Custom Mock Fields' : '▼ Customize mock handle, followers & engagement'}
                  </button>
                </div>

                {showCustomFields && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/25 space-y-3 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Instagram Handle</label>
                        <input
                          type="text"
                          placeholder="@_harsha.2k5"
                          value={customHandle}
                          onChange={e => setCustomHandle(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Followers Count</label>
                        <input
                          type="number"
                          placeholder="18400"
                          value={customFollowers}
                          onChange={e => setCustomFollowers(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Engagement Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="4.35"
                          value={customEngagement}
                          onChange={e => setCustomEngagement(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Custom Bio</label>
                        <input
                          type="text"
                          placeholder="Creator bio..."
                          value={customBio}
                          onChange={e => setCustomBio(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnectSandbox({
                        username: customHandle,
                        followersCount: customFollowers ? Number(customFollowers) : undefined,
                        engagementRate: customEngagement ? Number(customEngagement) : undefined,
                        bio: customBio || undefined
                      })}
                      disabled={connectingSandbox}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md"
                    >
                      Save & Connect Custom Demo Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real Data Trust Guarantee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto mb-8 text-xs text-slate-400">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Official Meta OAuth 2.0 Login</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>No Instagram passwords stored</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleConnectInstagram}
              disabled={connecting || connectingSandbox}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-pink-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Instagram className="w-4 h-4" />
              {connecting ? 'Redirecting to Meta...' : 'Connect Instagram Professional'}
            </button>
            <button
              onClick={handleConnectSandbox}
              disabled={connecting || connectingSandbox}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {connectingSandbox ? 'Connecting...' : 'Dev Mock Demo Mode'}
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
              <span>Your Meta authorization has expired. Please reconnect to keep live analytics and brand verifications synchronized.</span>
            </div>
          </div>
          <button
            onClick={handleConnectInstagram}
            disabled={connecting}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition-colors flex-shrink-0"
          >
            {connecting ? 'Redirecting...' : 'Reconnect Instagram'}
          </button>
        </div>
      )}

      {/* Demo Data Alert Banner */}
      {isMock && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex-shrink-0">
              DEMO DATA
            </span>
            <span className="text-slate-300 text-xs leading-relaxed">
              <strong>Local Development Mode:</strong> Showing simulated demo data for UI testing. Production environments strictly disallow mock modes and require registered Meta App credentials.
            </span>
          </div>
          <button
            onClick={() => setShowDisconnectModal(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs transition-colors flex-shrink-0"
          >
            Disconnect Demo Account
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
              {isMock ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEMO DATA
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Source: Instagram ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Account Type: <span className="text-white font-semibold">{account.account_type || 'Professional'}</span> • Last synced:{' '}
              <span className="text-purple-300 font-semibold">{formatTimeAgo(account.last_synced_at)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Refresh Data'}
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

      {/* Synchronized Metrics Grid (Strict Null Preservation & Source Transparency) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Followers Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Followers</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isMock 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {metrics.followers?.source || (isMock ? 'DEMO DATA' : 'Source: Instagram')}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.followers?.available && metrics.followers?.value !== null && metrics.followers?.value !== undefined
              ? Number(metrics.followers.value).toLocaleString()
              : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Synced from Instagram • {formatTimeAgo(account.last_synced_at)}
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Engagement Rate</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isMock 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {metrics.engagement_rate?.source || (isMock ? 'DEMO DATA' : 'Source: CreaterHub Analytics')}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.engagement_rate?.available && metrics.engagement_rate?.value !== null && metrics.engagement_rate?.value !== undefined
              ? `${metrics.engagement_rate.value}%`
              : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Computed from measurable post interactions
          </div>
        </div>

        {/* Following Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Following</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isMock 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {metrics.following?.source || (isMock ? 'DEMO DATA' : 'Source: Instagram')}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.following?.available && metrics.following?.value !== null && metrics.following?.value !== undefined
              ? Number(metrics.following.value).toLocaleString()
              : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Synced from Instagram • {formatTimeAgo(account.last_synced_at)}
          </div>
        </div>

        {/* Media / Posts Count Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Posts Count</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              isMock 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {metrics.media_count?.source || (isMock ? 'DEMO DATA' : 'Source: Instagram')}
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.media_count?.available && metrics.media_count?.value !== null && metrics.media_count?.value !== undefined
              ? Number(metrics.media_count.value).toLocaleString()
              : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Published catalog on profile
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
                <span>Account Reach (Last 30 Days)</span>
              </div>
              <div className="text-2xl font-black text-white">
                {metrics.reach?.available && metrics.reach?.value !== null
                  ? Number(metrics.reach.value).toLocaleString()
                  : 'Not available'}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {metrics.reach?.source || 'Source: Instagram'}
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
                  : 'Not available'}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {metrics.impressions?.source || 'Source: Instagram'}
            </span>
          </div>
        </div>
      )}

      {/* Historical Trend Chart (Strict Rule: Only show trend if >= 2 snapshots exist) */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Audience Growth Timeline</h3>
            <p className="text-xs text-slate-400">Verifiable historical snapshots over time (zero synthetic interpolation)</p>
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
            <h4 className="text-sm font-bold text-slate-300 mb-1">Not enough synchronized historical data yet</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Trend data will appear after your next scheduled synchronization. CreaterHub never generates synthetic historical numbers.
            </p>
          </div>
        )}
      </div>

      {/* Synchronized Media Catalog */}
      {media.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Synchronized Media Catalog</h3>
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
                      {m.like_count !== null && m.like_count !== undefined ? m.like_count.toLocaleString() : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      {m.comments_count !== null && m.comments_count !== undefined ? m.comments_count.toLocaleString() : 'N/A'}
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
                Disconnecting will archive your synchronized analytics and remove your verified Instagram stats from brand searches. You can reconnect anytime.
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
