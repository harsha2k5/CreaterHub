import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Users,
  Building2,
  Layers,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Instagram } from '../components/icons/InstagramIcon';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'campaigns' | 'instagram'>('overview');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, campRes, healthRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminCampaigns(),
        api.getAdminInstagramHealth()
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.stats);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        setUsers(usersRes.value.users || []);
      }
      if (campRes.status === 'fulfilled' && campRes.value.success) {
        setCampaigns(campRes.value.campaigns || []);
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.success) {
        setHealthData(healthRes.value.diagnostics);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleUserActive = async (userId: string) => {
    try {
      await api.suspendUser(userId);
      loadAdminData();
    } catch (err) {
      console.error('Error toggling user suspension:', err);
    }
  };

  const handleToggleCreatorBadge = async (creatorId: string) => {
    try {
      await api.verifyCreatorBadge(creatorId);
      loadAdminData();
    } catch (err) {
      console.error('Error toggling creator verification:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Superadmin Console</div>
              <h1 className="text-2xl font-black text-white">Platform Governance</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['overview', 'users', 'campaigns', 'instagram'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab === 'instagram' ? 'Meta API Health' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Total Creators</div>
                <div className="text-3xl font-black text-white">{stats?.total_creators || 0}</div>
              </div>
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Total Brands</div>
                <div className="text-3xl font-black text-blue-400">{stats?.total_brands || 0}</div>
              </div>
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Active Briefs</div>
                <div className="text-3xl font-black text-purple-400">{stats?.active_campaigns || 0}</div>
              </div>
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 mb-1">Total Released GMV</div>
                <div className="text-3xl font-black text-emerald-400">₹{Number(stats?.total_gmv || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Quick Instagram Health Banner */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Instagram className="w-6 h-6 text-pink-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Official Meta Integration Status</h4>
                  <p className="text-xs text-slate-400">
                    {healthData?.is_configured
                      ? 'Meta Developer App credentials active. Graph API v19.0 connected.'
                      : 'Meta Developer App keys missing in .env.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('instagram')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Inspect Health Console
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Registered Users & Creators</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-6">User / Entity</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Instagram Sync</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white">{u.creator_name || u.brand_name || 'Admin'}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-rose-500/10 text-rose-400' : u.role === 'creator' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.role === 'creator' ? (
                          u.ig_connected ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                            </span>
                          ) : (
                            <span className="text-slate-500">Unconnected</span>
                          )
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {u.is_active === 1 ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {u.creator_id && (
                          <button
                            onClick={() => handleToggleCreatorBadge(u.creator_id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold"
                          >
                            Verify Badge
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserActive(u.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                              u.is_active === 1 ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                            }`}
                          >
                            {u.is_active === 1 ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Campaign Moderation */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">Campaign Moderation</h2>
            <div className="space-y-3">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{camp.title}</h4>
                    <span className="text-xs text-slate-400">{camp.brand_name} • {camp.city} • ₹{camp.reward_per_creator?.toLocaleString()}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                    {camp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Instagram API Health Console (Section 37) */}
        {activeTab === 'instagram' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              <div>
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1">
                  Diagnostics & API Observability
                </span>
                <h2 className="text-2xl font-black text-white">Meta Graph API Health Console</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time telemetry on Meta OAuth credentials, rate limits, and synchronization logs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">App ID Configured</span>
                  <strong className={healthData?.meta_app_id_present ? 'text-emerald-400' : 'text-amber-400'}>
                    {healthData?.meta_app_id_present ? 'Configured (Active)' : 'Missing in .env'}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">Connected Creators</span>
                  <strong className="text-white">{healthData?.total_connected_accounts || 0}</strong>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">Sync Success / Fail</span>
                  <strong className="text-emerald-400">
                    {healthData?.sync_statistics?.total_successful || 0}
                  </strong>{' '}
                  /{' '}
                  <strong className="text-rose-400">
                    {healthData?.sync_statistics?.total_failed || 0}
                  </strong>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Recent Sync Audit Logs (Structured Logging)
                </h4>
                {healthData?.recent_logs?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-500 text-center">
                    No sync events recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {healthData?.recent_logs?.map((log: any) => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-slate-300 font-mono text-[11px]">{log.creator_id}</span>
                          {log.error_message && <span className="text-rose-400 ml-2">({log.error_message})</span>}
                        </div>
                        <span className="text-slate-500 text-[10px]">{log.logged_at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
