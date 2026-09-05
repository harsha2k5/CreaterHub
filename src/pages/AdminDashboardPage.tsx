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
  ArrowRight,
  ShieldCheck,
  Crown,
  MapPin,
  ExternalLink,
  Briefcase,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { Instagram } from '../components/icons/InstagramIcon';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'campaigns' | 'instagram'>('users');

  // Users Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'creator' | 'brand' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'financial' | 'deals' | 'newest' | 'name'>('financial');

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

  // Financial aggregates calculated from user dataset
  const totalCreatorEarned = users
    .filter(u => u.role === 'creator')
    .reduce((sum, u) => sum + Number(u.creator_earned || 0), 0);

  const totalCreatorEscrow = users
    .filter(u => u.role === 'creator')
    .reduce((sum, u) => sum + Number(u.creator_escrow || 0), 0);

  const totalBrandSpent = users
    .filter(u => u.role === 'brand')
    .reduce((sum, u) => sum + Number(u.brand_spent || 0), 0);

  const totalBrandEscrow = users
    .filter(u => u.role === 'brand')
    .reduce((sum, u) => sum + Number(u.brand_escrow || 0), 0);

  const creatorsCount = users.filter(u => u.role === 'creator').length;
  const brandsCount = users.filter(u => u.role === 'brand').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;

  // Filter and sort users
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const name = (u.creator_name || u.brand_name || '').toLowerCase();
    const handle = (u.creator_username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const city = (u.creator_city || u.brand_city || '').toLowerCase();

    return name.includes(q) || handle.includes(q) || email.includes(q) || city.includes(q);
  }).sort((a, b) => {
    if (sortBy === 'financial') {
      const aTotal = Number(a.creator_earned || 0) + Number(a.brand_spent || 0);
      const bTotal = Number(b.creator_earned || 0) + Number(b.brand_spent || 0);
      return bTotal - aTotal;
    }
    if (sortBy === 'deals') {
      return Number(b.completed_deals || 0) - Number(a.completed_deals || 0);
    }
    if (sortBy === 'name') {
      const aName = a.creator_name || a.brand_name || a.email;
      const bName = b.creator_name || b.brand_name || b.email;
      return aName.localeCompare(bName);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Superadmin Console</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Full Authority
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">Platform Governance & Financial Ledger</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>

            {['users', 'overview', 'campaigns', 'instagram'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab === 'users' ? 'Users & Earnings' : tab === 'instagram' ? 'Meta API Health' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Top Platform KPI Metrics Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 shadow-lg">
            <div className="text-xs font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span>Total Platform Users</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white">{users.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {creatorsCount} Creators • {brandsCount} Brands • {adminsCount} Admin
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-6 rounded-3xl border border-emerald-500/30 shadow-lg">
            <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center justify-between">
              <span>Released Creator Earnings</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-300">
              ₹{Number(stats?.total_gmv || totalCreatorEarned).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400/80 font-semibold mt-1">
              Approved & Escrow Released ✓
            </div>
          </div>

          <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 shadow-lg">
            <div className="text-xs font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span>Total Held In Escrow</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-blue-400">
              ₹{Number(stats?.held_in_escrow || totalCreatorEscrow + totalBrandEscrow).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Locked in active deliverables</div>
          </div>

          <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 shadow-lg">
            <div className="text-xs font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span>Active Briefs & Deals</span>
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">
              {stats?.active_campaigns || campaigns.filter(c => c.status === 'PUBLISHED').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats?.completed_collaborations || 0} completed payouts
            </div>
          </div>
        </div>

        {/* Tab 1: Users & Financial Ledger (MAIN TAB) */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filter, Search & Sorting Bar */}
            <div className="bg-slate-900/70 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-rose-400" /> Registered Users, Roles & Financials
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live ledger showing all registered accounts, their role, total earnings, active escrow, and deals.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      roleFilter === 'all'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Users ({users.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('creator')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      roleFilter === 'creator'
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                        : 'text-slate-400 hover:text-purple-300'
                    }`}
                  >
                    Creators ({creatorsCount})
                  </button>
                  <button
                    onClick={() => setRoleFilter('brand')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      roleFilter === 'brand'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                        : 'text-slate-400 hover:text-blue-300'
                    }`}
                  >
                    Brands ({brandsCount})
                  </button>
                  <button
                    onClick={() => setRoleFilter('admin')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      roleFilter === 'admin'
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                        : 'text-slate-400 hover:text-rose-300'
                    }`}
                  >
                    Admins ({adminsCount})
                  </button>
                </div>
              </div>

              {/* Search & Sort Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, @username, email, or city (e.g. naga, CCD, Indiranagar)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="financial">Highest Earnings / Spent</option>
                    <option value="deals">Most Completed Deals</option>
                    <option value="newest">Newest Registered</option>
                    <option value="name">Alphabetical (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/70 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-6">User / Entity</th>
                      <th className="py-3.5 px-6">Role & Membership</th>
                      <th className="py-3.5 px-6">Platform Earnings / Spent</th>
                      <th className="py-3.5 px-6">Escrow & Deals</th>
                      <th className="py-3.5 px-6">Instagram</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No users match your current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        const isCreator = u.role === 'creator';
                        const isBrand = u.role === 'brand';
                        const isAdmin = u.role === 'admin';

                        const avatar =
                          u.creator_avatar ||
                          u.brand_logo ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';

                        const displayName = u.creator_name || u.brand_name || 'System Administrator';
                        const city = u.creator_city || u.brand_city || u.creator_area;

                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* User Profile */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={avatar}
                                  alt={displayName}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{displayName}</span>
                                    {(u.creator_verified === 1 || u.brand_verified === 1) && (
                                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {u.creator_username ? `@${u.creator_username}` : u.email}
                                  </div>
                                  {city && (
                                    <div className="text-[10px] text-purple-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" /> {city}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Role & Tier */}
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isAdmin
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : isCreator
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {u.role}
                                </span>

                                {isCreator && (
                                  <div className="flex items-center gap-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                      u.subscription_tier === 'diamond'
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                        : u.subscription_tier === 'gold'
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : u.subscription_tier === 'silver'
                                        ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {u.subscription_tier || 'free'} tier
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Earnings / Spend Column */}
                            <td className="py-4 px-6">
                              {isCreator ? (
                                <div>
                                  <div className="text-sm font-black text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    ₹{Number(u.creator_earned || 0).toLocaleString()}
                                  </div>
                                  <span className="text-[10px] text-slate-500">Released Earnings</span>
                                </div>
                              ) : isBrand ? (
                                <div>
                                  <div className="text-sm font-black text-blue-400">
                                    ₹{Number(u.brand_spent || 0).toLocaleString()}
                                  </div>
                                  <span className="text-[10px] text-slate-500">Total Escrow Paid</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Platform Administrator</span>
                              )}
                            </td>

                            {/* Escrow & Deals */}
                            <td className="py-4 px-6">
                              {isCreator ? (
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-purple-300">
                                    ₹{Number(u.creator_escrow || 0).toLocaleString()}{' '}
                                    <span className="text-[10px] text-slate-500 font-normal">in escrow</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {u.completed_deals || 0} completed deals
                                  </div>
                                </div>
                              ) : isBrand ? (
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-amber-300">
                                    ₹{Number(u.brand_escrow || 0).toLocaleString()}{' '}
                                    <span className="text-[10px] text-slate-500 font-normal">in escrow</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {u.brand_campaigns || 0} briefs published
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* Instagram */}
                            <td className="py-4 px-6">
                              {isCreator ? (
                                u.ig_connected ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3" /> Synced ✓
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Unconnected</span>
                                )
                              ) : (
                                <span className="text-slate-600 text-[11px]">N/A</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                u.is_active === 1
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              }`}>
                                {u.is_active === 1 ? 'Active' : 'Suspended'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                              {u.creator_id && (
                                <button
                                  onClick={() => handleToggleCreatorBadge(u.creator_id)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all border border-slate-700"
                                >
                                  {u.creator_verified ? 'Unverify' : 'Verify Badge ✓'}
                                </button>
                              )}

                              {!isAdmin && (
                                <button
                                  onClick={() => handleToggleUserActive(u.id)}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                    u.is_active === 1
                                      ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/60'
                                      : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-800/60'
                                  }`}
                                >
                                  {u.is_active === 1 ? 'Suspend' : 'Reactivate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Overview Platform Metrics */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Creator Economy</div>
                <div className="text-4xl font-black text-white">{creatorsCount}</div>
                <div className="text-xs text-slate-400">Total registered influencer accounts</div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Total Payouts:</span>
                  <span className="text-emerald-400 font-bold">₹{totalCreatorEarned.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">Brand Partners</div>
                <div className="text-4xl font-black text-blue-400">{brandsCount}</div>
                <div className="text-xs text-slate-400">Verified retail & hospitality businesses</div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Escrow Funded:</span>
                  <span className="text-blue-400 font-bold">₹{totalBrandSpent.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Campaign Pipeline</div>
                <div className="text-4xl font-black text-emerald-400">{campaigns.length}</div>
                <div className="text-xs text-slate-400">Total campaigns hosted on CreaterHub</div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Active Deals:</span>
                  <span className="text-purple-300 font-bold">{stats?.active_campaigns || 0} active</span>
                </div>
              </div>
            </div>

            {/* Quick Instagram Health Banner */}
            <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Instagram className="w-8 h-8 text-pink-400 flex-shrink-0" />
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

        {/* Tab 3: Campaign Moderation */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-white">Campaign Moderation</h2>
                <p className="text-xs text-slate-400">All campaigns created by brands across geographic radii.</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{campaigns.length} Campaigns</span>
            </div>

            <div className="space-y-3">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-white text-sm">{camp.title}</h4>
                    <span className="text-xs text-slate-400">
                      {camp.brand_name} • {camp.city || 'Bengaluru'} • Reward: ₹{Number(camp.reward_per_creator || 0).toLocaleString()} • Budget: ₹{Number(camp.budget_total || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                    camp.status === 'PUBLISHED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
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
