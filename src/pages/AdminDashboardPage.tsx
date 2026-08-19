import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Users, Building2, CheckCircle2, DollarSign, Handshake, ArrowUpRight, Sparkles } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [collaborationsList, setCollaborationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes, collabsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminCollaborations()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsersList(usersRes.users || []);
      if (collabsRes.success) setCollaborationsList(collabsRes.collaborations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleVerify = async (userId: string) => {
    try {
      await api.verifyUser(userId);
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalPaid = stats?.totalVolume || collaborationsList.reduce((acc, c) => acc + (c.paid_amount || 0), 0);
  const workedTogetherCount = stats?.workedTogetherCount !== undefined ? stats.workedTogetherCount : collaborationsList.length;

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-400">Loading admin control panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/90 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-extrabold text-white">Admin Control Panel</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-extrabold text-[10px] uppercase">
                  System Executive
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Brand × Creator partnerships oversight & Escrow payout analytics</p>
            </div>
          </div>
        </div>

        {/* Primary Admin Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Worked Together Stat */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Worked Together</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Handshake className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-purple-400 mb-1">
              {workedTogetherCount} <span className="text-xs font-semibold text-slate-400">Partnerships</span>
            </div>
            <p className="text-[11px] text-slate-400">Brand × Creator active & completed collaborations</p>
          </div>

          {/* Total Paid Stat */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid Out</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-emerald-400 mb-1">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">Released Escrow payouts to creators</p>
          </div>

          {/* Total Users Stat */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Accounts</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-indigo-400 mb-1">
              {stats?.totalUsers || usersList.length} <span className="text-xs font-semibold text-slate-400">Accounts</span>
            </div>
            <p className="text-[11px] text-slate-400">{stats?.totalBrands || 0} Brands • {stats?.totalCreators || 0} Creators</p>
          </div>

          {/* Active Campaigns Stat */}
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Briefs</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-blue-400 mb-1">
              {stats?.activeCampaigns || 0} <span className="text-xs font-semibold text-slate-400">Live Campaigns</span>
            </div>
            <p className="text-[11px] text-slate-400">Open for creator applications</p>
          </div>
        </div>

        {/* Section 1: Brand × Creator Worked Together & Payouts Table */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-extrabold text-xl flex items-center gap-2">
                <Handshake className="w-5 h-5 text-purple-400" />
                Brand × Creator Partnerships & Payout History
              </h2>
              <p className="text-xs text-slate-400 mt-1">Detailed list of brands and creators working together and amounts paid</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-xs font-bold">
              {collaborationsList.length} Active Collaborations
            </span>
          </div>

          {collaborationsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase">
                    <th className="pb-3.5">Brand Partner</th>
                    <th className="pb-3.5">Creator Partner</th>
                    <th className="pb-3.5">Campaign Brief</th>
                    <th className="pb-3.5">Collaboration Status</th>
                    <th className="pb-3.5 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-semibold">
                  {collaborationsList.map(col => (
                    <tr key={col.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={col.brand_logo || 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80'}
                            alt={col.brand_name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700"
                          />
                          <span className="font-bold text-white text-sm">{col.brand_name}</span>
                        </div>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={col.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                            alt={col.creator_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <div className="font-bold text-white">{col.creator_name}</div>
                            {col.creator_username && (
                              <div className="text-[11px] text-purple-400 font-mono">@{col.creator_username}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 text-slate-300 font-medium">
                        {col.campaign_title}
                      </td>

                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          col.current_step >= 5 || col.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {col.current_step >= 5 || col.status === 'completed' ? 'Completed & Released' : `Step ${col.current_step || 1} Active`}
                        </span>
                      </td>

                      <td className="py-4 text-right">
                        <div className="font-extrabold text-sm text-emerald-400">
                          ₹{col.paid_amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          {col.payment_status === 'paid' ? 'Paid Out' : 'Locked in Escrow'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-700/60">
              <Handshake className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No active Brand × Creator collaborations currently recorded.</p>
            </div>
          )}
        </div>

        {/* Section 2: User Account Verification & Oversight */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-xl flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Registered Accounts & Verification Status
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{usersList.length} Accounts Registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase">
                  <th className="pb-3.5">User / Entity Name</th>
                  <th className="pb-3.5">Account Role</th>
                  <th className="pb-3.5">Email Address</th>
                  <th className="pb-3.5">Verification</th>
                  <th className="pb-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-semibold">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 font-bold text-white">
                      {u.brand_name || u.creator_name || u.email.split('@')[0]}
                    </td>
                    <td className="py-3.5 capitalize">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        u.role === 'brand' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        u.role === 'creator' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                        'bg-indigo-950 text-indigo-400 border border-indigo-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">{u.email}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        u.is_verified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleToggleVerify(u.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          u.is_verified
                            ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                        }`}
                      >
                        {u.is_verified ? 'Revoke Verification' : 'Verify Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

