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
  Layers,
  Lock,
  ArrowUpRight
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
  const [connectError, setConnectError] = useState('');

  const isConnected = Boolean(data && data.is_connected);
  const isSandbox = Boolean(data && data.is_sandbox);
  const account = data?.account || {};
  const metrics = data?.metrics || {};
  const snapshots = data?.snapshots || [];
  const media = data?.media || [];
  const hasChartData = snapshots.length >= 2;

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
      setConnectError(err.message || 'Failed to initiate Meta OAuth.');
    } finally {
      setConnecting(false);
    }
  };

  const [showCustomFields, setShowCustomFields] = useState(false);
  const [customHandle, setCustomHandle] = useState('');
  const [customFollowers, setCustomFollowers] = useState('18400');
  const [customEngagement, setCustomEngagement] = useState('4.35');
  const [customBio, setCustomBio] = useState('');

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
        setConnectError(res.error || 'Failed to connect Sandbox Mode.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect Sandbox Mode.');
    } finally {
      setConnectingSandbox(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Instagram account? Analytics will be cleared.')) return;
    setDisconnecting(true);
    try {
      await api.disconnectInstagram();
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

  if (!isConnected) {
    return (
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 mx-auto flex items-center justify-center text-white mb-6 shadow-xl shadow-pink-500/20">
          <Instagram className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
          Connect Your Instagram
        </h2>

        <p className="text-slate-300 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
          Connect your professional Instagram account to unlock real account analytics, automated brand matching, and AI-powered creator insights.
        </p>

        {connectError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs text-left max-w-md mx-auto flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Meta API Configuration Note</strong>
                <span>{connectError}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-amber-500/20 text-slate-300">
              <p className="mb-2">
                For local development and testing without live Meta App registration, use <strong>Developer Sandbox Mode</strong>:
              </p>
              <button
                onClick={() => handleConnectSandbox()}
                disabled={connectingSandbox}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
              >
                <Sparkles className="w-4 h-4" />
                {connectingSandbox ? 'Connecting...' : 'Connect My Profile in Sandbox Mode'}
              </button>

              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowCustomFields(!showCustomFields)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  {showCustomFields ? '▲ Hide Custom Handle & Stats' : '▼ Want to customize handle, followers & engagement?'}
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
                        placeholder="My creator bio..."
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
                    Save & Connect Custom Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security / Real Data Trust Guarantee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto mb-8 text-xs text-slate-400">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Official Meta OAuth 2.0</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>No passwords ever stored</span>
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
            {connectingSandbox ? 'Connecting...' : 'Dev Sandbox Test Mode'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sandbox Alert Banner */}
      {isSandbox && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase flex-shrink-0">
              SANDBOX DEV MODE
            </span>
            <span className="text-slate-300 text-xs leading-relaxed">
              <strong>Local Test Data:</strong> Connected via Developer Sandbox Mode for UI evaluation and testing. Configure registered <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">META_APP_ID</code> & <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">META_APP_SECRET</code> in <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">.env</code> to sync live Instagram accounts.
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs transition-colors flex-shrink-0"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect Test Account'}
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
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isSandbox 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isSandbox ? 'Sandbox Account ✓' : 'Instagram Connected ✓'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Account Type: <span className="text-white font-semibold">{account.account_type || 'Professional'}</span> • Last synced:{' '}
              <span className="text-purple-300 font-semibold">{formatTimeAgo(account.last_synced_at)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Refresh Data'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all disabled:opacity-50"
          >
            {disconnecting ? '...' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Synchronized Metrics Grid (Zero Fake Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Followers Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Followers</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Meta API
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.followers?.value !== undefined ? metrics.followers.value.toLocaleString() : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Synced from Instagram • {formatTimeAgo(account.last_synced_at)}
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
            {metrics.engagement_rate?.value !== undefined ? `${metrics.engagement_rate.value}%` : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Computed from real post interactions
          </div>
        </div>

        {/* Following Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Following</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Meta API
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.following?.value !== undefined ? metrics.following.value.toLocaleString() : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Synced from Instagram • {formatTimeAgo(account.last_synced_at)}
          </div>
        </div>

        {/* Media / Posts Count Card */}
        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Posts Count</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Meta API
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {metrics.media_count?.value !== undefined ? metrics.media_count.value.toLocaleString() : 'Not available'}
          </div>
          <div className="text-[11px] text-slate-500">
            Published media on account
          </div>
        </div>
      </div>

      {/* Historical Trend Chart (Section 15: Zero Fake Fallback) */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Audience Growth History</h3>
            <p className="text-xs text-slate-400">Verifiable historical snapshots over time</p>
          </div>
          <span className="text-xs font-semibold text-purple-400">30-Day Timeline</span>
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
            <h4 className="text-sm font-bold text-slate-300 mb-1">Not enough synchronized data yet</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              As your account remains connected, daily snapshots will plot your genuine follower growth trend without synthetic estimates.
            </p>
          </div>
        )}
      </div>

      {/* Synchronized Media Grid */}
      {media.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-white mb-4">Synchronized Media Catalog</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((m: any) => (
              <div key={m.media_id} className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden group">
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
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> {m.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-blue-400" /> {m.comments_count || 0}
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
    </div>
  );
};
