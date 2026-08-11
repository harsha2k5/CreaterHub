import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Campaign } from '../types';
import {
  Building2,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  Users,
  ShieldCheck,
  Tag,
  Send,
  X,
  ArrowLeft,
  Share2,
  Hash,
  AlertCircle
} from 'lucide-react';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Application Form State
  const [pitch, setPitch] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [relevantExperience, setRelevantExperience] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const res = await api.getCampaignById(id);
        if (res.success) {
          setCampaign(res.campaign);
        }
      } catch (e) {
        showToast('Failed to load campaign details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.applyCampaign(id, {
        pitch,
        content_idea: contentIdea,
        relevant_experience: relevantExperience,
        expected_date: 'In 5 Days'
      });
      showToast('🎉 Application submitted to brand successfully!');
      setIsApplyModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit application', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Loading campaign details...</div>;
  }

  if (!campaign) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Campaign not found.</div>;
  }

  const isCreator = user?.role === 'creator';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </button>

        {/* Brand & Brief Header */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <img
                src={campaign.brand_logo || 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80'}
                alt={campaign.brand_name}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">{campaign.brand_name}</h2>
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {campaign.location_name} • {campaign.outlet_name}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400 font-bold uppercase">Creator Reward Payout</div>
              <div className="font-heading text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{campaign.reward_per_creator.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Escrow Protected Payout
              </div>
            </div>
          </div>

          <h1 className="font-heading text-2xl font-extrabold mb-4">{campaign.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {campaign.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
            <div>
              <div className="text-slate-400 font-semibold mb-0.5">Category</div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{campaign.category}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-0.5">Platform</div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{campaign.platform}</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-0.5">Min Followers</div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{campaign.min_followers.toLocaleString()}+</div>
            </div>
            <div>
              <div className="text-slate-400 font-semibold mb-0.5">Slots Available</div>
              <div className="font-bold text-blue-600 dark:text-blue-400">{campaign.creators_required - campaign.creators_hired} / {campaign.creators_required} Slots</div>
            </div>
          </div>
        </div>

        {/* Requirements & Guidelines Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-extrabold text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Campaign Deliverables
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {campaign.deliverables.map((del, idx) => (
                <li key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{del}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-heading font-extrabold text-base flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" /> Hashtags & Mentions
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-blue-600 dark:text-blue-400">
              {campaign.hashtags || '#CCDIndiranagar #CafeCoffeeDay #BengaluruEats'}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-purple-600 dark:text-purple-400">
              {campaign.mentions || '@cafecoffeeday @ccd_indiranagar'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="font-extrabold text-sm">Interested in this collaboration?</div>
            <div className="text-xs text-slate-500">Submit your pitch idea directly to the brand for review.</div>
          </div>

          {isCreator ? (
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" /> Apply for Campaign
            </button>
          ) : (
            <button
              onClick={() => navigate('/creator/login')}
              className="px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs"
            >
              Log in as Creator to Apply
            </button>
          )}
        </div>

        {/* Application Form Modal */}
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-heading font-extrabold text-xl">Apply for Campaign</h2>
                  <p className="text-xs text-slate-500">{campaign.title}</p>
                </div>
                <button onClick={() => setIsApplyModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Why should the brand select you?</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. As an Indiranagar local with 128k followers, I specialize in food & lifestyle Reels..."
                    value={pitch}
                    onChange={e => setPitch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Proposed Content Concept / Hook</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe your 3s opening hook, video pacing, and call to action..."
                    value={contentIdea}
                    onChange={e => setContentIdea(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Relevant Experience / Previous Work Links</label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/p/sample_reel"
                    value={relevantExperience}
                    onChange={e => setRelevantExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" /> Submit Application to Brand
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
