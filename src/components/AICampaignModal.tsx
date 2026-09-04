import React, { useState } from 'react';
import { api } from '../services/api';
import { AICampaignRecommendation } from '../types';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  DollarSign,
  Users,
  MapPin,
  TrendingUp,
  Tag,
  ShieldCheck,
  Flame,
  ArrowRight,
  RefreshCw,
  Lightbulb
} from 'lucide-react';

interface AICampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const QUICK_PROMPTS = [
  { label: '☕ Cafe & Bakery Launch', prompt: 'I want to promote my new artisan bakery and coffee roastery in Koramangala with food vloggers.' },
  { label: '👗 Fashion Summer Line', prompt: 'Launching a sustainable summer linen wear collection in Indiranagar, targeting fashion stylists.' },
  { label: '📱 Mobile Tech App Beta', prompt: 'Promote our new AI productivity tool to tech creators in Bengaluru, seeking short-form video demos.' },
  { label: '🏋️ Premium Fitness Studio', prompt: 'Opening a boutique pilates & CrossFit studio in HSR Layout, looking for fitness creators.' }
];

export const AICampaignModal: React.FC<AICampaignModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
  showToast
}) => {
  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState('30000');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AICampaignRecommendation | null>(null);
  const [publishing, setPublishing] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse || textToUse.trim().length < 5) {
      showToast('Please describe your campaign idea or target audience.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.getAICampaignRecommendation({
        prompt: textToUse,
        budget: Number(budget) || 25000
      });
      if (res.success && res.recommendation) {
        setRecommendation(res.recommendation);
        showToast('✨ AI Campaign Brief generated successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate campaign recommendation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!recommendation) return;
    setPublishing(true);
    try {
      await api.createCampaign({
        title: recommendation.suggested_title,
        description: recommendation.suggested_description,
        objective: recommendation.strategy,
        category: recommendation.category,
        location_name: recommendation.location_name,
        outlet_name: recommendation.location_name.split(',')[0] || 'Main Location',
        address: recommendation.location_name,
        city: recommendation.city,
        state: 'Karnataka',
        radius_km: 10,
        min_followers: recommendation.min_followers,
        max_followers: recommendation.max_followers,
        req_engagement: recommendation.min_engagement,
        deliverables: recommendation.deliverables,
        creators_required: recommendation.creators_required,
        reward_per_creator: recommendation.reward_per_creator,
        budget_total: recommendation.estimated_budget,
        payment_type: 'Fixed Escrow Release',
        hashtags: recommendation.hashtags,
        dos: recommendation.dos,
        donts: recommendation.donts,
        platform: 'Instagram'
      });

      showToast('🚀 AI Campaign published and Escrow secured!');
      onCampaignCreated();
      onClose();
      setRecommendation(null);
      setPrompt('');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish campaign.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  AI Campaign Architect
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Smart Brief Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Describe your promotion in plain English. AI recommends optimal creator tiers, deliverables & budgets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!recommendation ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  What would you like to promote?
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g., I want to promote my new artisan sourdough cafe in Koramangala with food reels and story walk-throughs..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Target Total Campaign Budget (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Or pick a quick scenario:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(qp.prompt);
                        handleGenerate(qp.prompt);
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 bg-white dark:bg-slate-900/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {qp.label}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {qp.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {/* Generated Title & Strategy */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5 border border-purple-200/60 dark:border-purple-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-600 text-white">
                    {recommendation.category}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> {recommendation.location_name}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                  {recommendation.suggested_title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {recommendation.suggested_description}
                </p>
              </div>

              {/* Key Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Target Reach</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {recommendation.follower_range}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Min Engagement</div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ≥ {recommendation.min_engagement}%
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Hiring Volume</div>
                  <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    {recommendation.creators_required} Creators
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Reward/Creator</div>
                  <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                    ₹{recommendation.reward_per_creator.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Recommended Deliverables
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.deliverables.map((d, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strategy & Guidelines */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Strategy: </span>
                  <span className="text-slate-600 dark:text-slate-300">{recommendation.strategy}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Hashtags: </span>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">{recommendation.hashtags}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          {!recommendation ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || prompt.trim().length < 4}
                onClick={() => handleGenerate()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing Requirements...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Generate AI Campaign Brief
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRecommendation(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refine Prompt
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Publishing & Securing Escrow...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> 1-Click Publish & Secure Escrow
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
