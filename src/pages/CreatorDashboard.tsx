import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Campaign, Application } from '../types';
import {
  Users,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  DollarSign,
  Flame,
  CheckCircle2,
  TrendingUp,
  Award,
  ArrowRight
} from 'lucide-react';

export const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nearbyCampaigns, setNearbyCampaigns] = useState<Campaign[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const campRes = await api.getCampaigns({ radius: '15' });
        if (campRes.success) setNearbyCampaigns(campRes.campaigns);
        const appRes = await api.getApplications();
        if (appRes.success) setMyApplications(appRes.applications);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const profile = (user?.profile as any) || {};

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
              alt="Creator"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-2xl font-extrabold">{profile.full_name || 'Creator Studio'}</h1>
                <CheckCircle2 className="w-5 h-5 text-purple-500 fill-purple-500/20" />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {profile.location_name || 'Indiranagar, Bengaluru'} • @{profile.username || 'alexcreates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-slate-400 font-semibold">Followers</div>
              <div className="font-heading text-lg font-extrabold text-purple-600">{profile.followers?.toLocaleString() || '128K'}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold">Avg Engagement</div>
              <div className="font-heading text-lg font-extrabold text-blue-600">{profile.engagement_rate || '6.4'}%</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold">Profile Complete</div>
              <div className="font-heading text-lg font-extrabold text-emerald-600">{profile.profile_completion || 95}%</div>
            </div>
          </div>
        </div>

        {/* Recommended Campaigns Match Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-heading font-extrabold text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Recommended For You
              </h2>
              <p className="text-xs text-slate-400">Matched using creator category, location radius & followers</p>
            </div>
            <button onClick={() => navigate('/explore')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Explore All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {nearbyCampaigns.slice(0, 3).map((camp, idx) => (
              <div
                key={camp.id}
                onClick={() => navigate(`/campaigns/${camp.id}`)}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" /> {96 - idx * 4}% Match
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                      ₹{camp.reward_per_creator.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base mb-1">{camp.title}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {camp.location_name} ({camp.distanceKm || 2.4} km away)
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">{camp.platform}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Applications Tracker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="font-heading font-extrabold text-xl mb-1">My Submitted Applications</h2>
          <p className="text-xs text-slate-400 mb-6">Track application status & accepted sponsorship briefs</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Campaign & Brand</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Reward</th>
                  <th className="pb-3">Applied On</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {myApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No applications submitted yet. Browse campaigns to apply!</td>
                  </tr>
                ) : (
                  myApplications.map(app => (
                    <tr key={app.id}>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {app.campaign_title || 'CCD Indiranagar Creator Promotion'}
                      </td>
                      <td className="py-3.5 text-slate-500">{app.location_name || 'Indiranagar, Bengaluru'}</td>
                      <td className="py-3.5 text-emerald-600 font-extrabold">₹{app.reward_per_creator?.toLocaleString() || '2,500'}</td>
                      <td className="py-3.5 text-slate-400">{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {app.status === 'accepted' ? (
                          <button
                            onClick={() => navigate('/collaborations')}
                            className="px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-[11px]"
                          >
                            Open Deal Workflow
                          </button>
                        ) : (
                          <span className="text-slate-400">Under Review</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
