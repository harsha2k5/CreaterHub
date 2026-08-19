import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Campaign, Application } from '../types';
import {
  Building2,
  PlusCircle,
  Users,
  CheckCircle2,
  DollarSign,
  Clock,
  MapPin,
  Flame,
  X,
  Send,
  MessageSquare,
  Star,
  ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const DEMO_CHART_DATA = [
  { day: 'Mon', applications: 4, spend: 2500 },
  { day: 'Tue', applications: 8, spend: 5000 },
  { day: 'Wed', applications: 15, spend: 10000 },
  { day: 'Thu', applications: 12, spend: 7500 },
  { day: 'Fri', applications: 22, spend: 15000 },
  { day: 'Sat', applications: 30, spend: 22000 },
  { day: 'Sun', applications: 38, spend: 25000 }
];

export const BrandDashboard: React.FC = () => {
  const { user, showToast } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food & Beverage');
  const [locationName, setLocationName] = useState('Indiranagar, Bengaluru');
  const [outletName, setOutletName] = useState('CCD Indiranagar');
  const [radiusKm, setRadiusKm] = useState('10');
  const [reward, setReward] = useState('2500');
  const [creatorsCount, setCreatorsCount] = useState('10');
  const [deliverableReel, setDeliverableReel] = useState(true);
  const [deliverableStory, setDeliverableStory] = useState(true);
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      const campRes = await api.getCampaigns();
      if (campRes.success) {
        setCampaigns(campRes.campaigns.filter((c: any) => c.brand_id === user?.profileId));
      }
      const appRes = await api.getApplications();
      if (appRes.success) {
        setApplications(appRes.applications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const delivs = [];
      if (deliverableReel) delivs.push('1 Instagram Reel (9:16)');
      if (deliverableStory) delivs.push('2 Instagram Stories');

      await api.createCampaign({
        title,
        description,
        category,
        location_name: locationName,
        outlet_name: outletName,
        address: locationName || outletName || 'Bengaluru, India',
        radius_km: Number(radiusKm),
        reward_per_creator: Number(reward),
        creators_required: Number(creatorsCount),
        deliverables: delivs,
        platform: 'Instagram'
      });

      showToast('🚀 Campaign Published & Escrow Funded!');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create campaign', 'error');
    }
  };

  const handleAppStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.updateApplicationStatus(appId, status);
      showToast(`Application ${status}!`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={(user?.profile as any)?.logo_url || 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80'}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
              alt="Brand"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-extrabold">
                  {(user?.profile as any)?.company_name || 'Brand Enterprise Dashboard'}
                </h1>
                <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {(user?.profile as any)?.location_name || 'Bengaluru, India'} • Enterprise Verified
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Create New Brief & Fund Escrow
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-1">Active Campaigns</div>
            <div className="font-heading text-2xl font-extrabold text-blue-600">{campaigns.length} Briefs</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-1">Applications Received</div>
            <div className="font-heading text-2xl font-extrabold text-purple-600">{applications.length} Creators</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-1">Total Escrow Budget</div>
            <div className="font-heading text-2xl font-extrabold text-emerald-600">₹25,000</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-1">Brand Rating</div>
            <div className="font-heading text-2xl font-extrabold text-amber-500 flex items-center gap-1">
              4.9 <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
        </div>

        {/* Chart + Applications Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Analytics Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-heading font-extrabold text-base mb-1">Campaign Creator Reach Analytics</h3>
            <p className="text-xs text-slate-400 mb-6">Applications volume & weekly escrow spend</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DEMO_CHART_DATA}>
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stroke="#2563eb" fillOpacity={1} fill="url(#colorApp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Applications Review List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base mb-1">Creator Applicants</h3>
              <p className="text-xs text-slate-400 mb-4">Review pitches & accept for collaboration</p>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No applications received yet.</div>
                ) : (
                  applications.map(app => (
                    <div key={app.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2.5 mb-2">
                        <img src={app.creator_avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs truncate">{app.creator_name}</div>
                          <div className="text-[10px] text-slate-400">{app.creator_followers?.toLocaleString()} Followers • {app.creator_city}</div>
                        </div>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic mb-2">
                        "{app.pitch}"
                      </p>

                      {app.status === 'submitted' && (
                        <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => handleAppStatus(app.id, 'accepted')}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => handleAppStatus(app.id, 'rejected')}
                            className="flex-1 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Campaign Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-heading font-extrabold text-xl">Create Campaign Brief</h2>
                  <p className="text-xs text-slate-500">Fund escrow & invite local creators within radius</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Campaign Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CCD Indiranagar Creator Promotion"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Outlet Location</label>
                    <input
                      type="text"
                      required
                      placeholder="Indiranagar, Bengaluru"
                      value={locationName}
                      onChange={e => setLocationName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Target Radius (KM)</label>
                    <select
                      value={radiusKm}
                      onChange={e => setRadiusKm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    >
                      <option value="1">1 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="25">25 km</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Reward Per Creator (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="2500"
                      value={reward}
                      onChange={e => setReward(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Number of Creators</label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      value={creatorsCount}
                      onChange={e => setCreatorsCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Campaign Guidelines & Requirements</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe deliverables, key hooks, and brand guidelines..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" /> Publish Brief & Fund Escrow (₹{(Number(reward) * Number(creatorsCount)).toLocaleString()})
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
