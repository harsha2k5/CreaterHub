import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Users, Building2, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const statsRes = await api.getAdminStats();
      if (statsRes.success) setStats(statsRes.stats);
      const usersRes = await api.getAdminUsers();
      if (usersRes.success) setUsersList(usersRes.users || []);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Loading admin portal...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-extrabold">Admin Control Panel</h1>
            <p className="text-xs text-slate-400">Platform overview, user verification & escrow oversight</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold mb-1">Total Users</div>
              <div className="font-heading text-2xl font-extrabold text-indigo-400">{stats.totalUsers}</div>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold mb-1">Active Briefs</div>
              <div className="font-heading text-2xl font-extrabold text-blue-400">{stats.activeCampaigns}</div>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold mb-1">Total Platform Turnover</div>
              <div className="font-heading text-2xl font-extrabold text-emerald-400">₹{(stats.totalVolume || 25000).toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold mb-1">Pending Reports</div>
              <div className="font-heading text-2xl font-extrabold text-rose-400">{stats.pendingReports}</div>
            </div>
          </div>
        )}

        {/* User Management Table */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
          <h2 className="font-heading font-extrabold text-xl">User Verification Management</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase">
                  <th className="pb-3">User & Profile Name</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-semibold">
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td className="py-3.5 font-bold text-white">
                      {u.brand_name || u.creator_name || u.email.split('@')[0]}
                    </td>
                    <td className="py-3.5 capitalize">{u.role}</td>
                    <td className="py-3.5 text-slate-400">{u.email}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${u.is_verified ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400'}`}>
                        {u.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => handleToggleVerify(u.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold ${u.is_verified ? 'bg-rose-900/60 text-rose-300' : 'bg-indigo-600 text-white'}`}
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
