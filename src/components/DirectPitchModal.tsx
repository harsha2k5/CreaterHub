import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, Briefcase, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Campaign, Creator } from '../types';

interface DirectPitchModalProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DirectPitchModal: React.FC<DirectPitchModalProps> = ({
  creator,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pitchType, setPitchType] = useState<'existing' | 'custom'>('existing');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customBudget, setCustomBudget] = useState<string>('');
  const [customDeliverables, setCustomDeliverables] = useState<string>('');
  const [pitchMessage, setPitchMessage] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingCampaigns, setFetchingCampaigns] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
      fetchBrandCampaigns();
    }
  }, [isOpen]);

  const fetchBrandCampaigns = async () => {
    setFetchingCampaigns(true);
    try {
      const res = await api.getCampaigns();
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
        if (res.campaigns.length > 0) {
          setSelectedCampaignId(res.campaigns[0].id);
        } else {
          setPitchType('custom');
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setFetchingCampaigns(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pitchMessage.trim()) {
      setError('Please provide a pitch message describing the opportunity.');
      return;
    }

    if (pitchType === 'custom' && !customTitle.trim()) {
      setError('Please provide a title for the custom pitch.');
      return;
    }

    if (pitchType === 'existing' && !selectedCampaignId) {
      setError('Please select a campaign to pitch.');
      return;
    }

    setLoading(true);

    try {
      const matchedCamp = campaigns.find(c => c.id === selectedCampaignId);
      const calculatedBudget = pitchType === 'custom' ? (parseFloat(customBudget) || 0) : (matchedCamp?.reward_per_creator || 0);
      const calculatedDeliverables = pitchType === 'custom' ? customDeliverables.trim() : (Array.isArray(matchedCamp?.deliverables_json) ? matchedCamp.deliverables_json.join(', ') : matchedCamp?.deliverables_json || '1 Reel + 1 Story');

      const payload = {
        campaign_id: pitchType === 'existing' ? selectedCampaignId : '',
        custom_title: pitchType === 'custom' ? customTitle.trim() : (matchedCamp?.title || ''),
        custom_budget: calculatedBudget,
        custom_deliverables: calculatedDeliverables,
        pitch: pitchMessage.trim(),
        message: pitchMessage.trim(),
        proposed_budget: calculatedBudget,
        deliverables: calculatedDeliverables
      };

      const res = await api.sendDirectPitch(creator.id, payload);

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1800);
      } else {
        setError(res.error || 'Failed to send pitch.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <img
              src={creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={creator.full_name}
              className="w-11 h-11 rounded-2xl object-cover border-2 border-purple-500 shadow-sm"
            />
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                Direct Pitch to {creator.full_name}
                <CheckCircle2 className="w-4 h-4 text-purple-500 fill-purple-500/20" />
                {(creator.verified === 1 || creator.verification_status === 'verified') && (
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    ✓ Verified
                  </span>
                )}
                <Sparkles className="w-4 h-4 text-purple-500" />
              </h3>
              <p className="text-xs text-slate-500 font-medium">@{creator.username} • {creator.city} • {(creator.followers || 0).toLocaleString()} Followers ({creator.engagement_rate || 4.5}% ER)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-heading text-xl font-extrabold text-slate-900 dark:text-white">Pitch Sent Successfully!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your direct pitch and invitation have been delivered to {creator.full_name}. You can continue chatting in Messages.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Pitch Type Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setPitchType('existing')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  pitchType === 'existing'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Select Campaign
              </button>
              <button
                type="button"
                onClick={() => setPitchType('custom')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  pitchType === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Custom Offer / Deal
              </button>
            </div>

            {/* Pitch Form Inputs */}
            {pitchType === 'existing' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Active Campaign
                </label>
                {fetchingCampaigns ? (
                  <div className="text-xs text-slate-400 py-2">Loading active campaigns...</div>
                ) : campaigns.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl text-xs text-amber-700 dark:text-amber-300">
                    No active campaigns found. Switch to "Custom Offer / Deal" to create a direct pitch offer.
                  </div>
                ) : (
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} (₹{c.reward_per_creator.toLocaleString()} • {c.platform})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign / Project Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Exclusive Brand Ambassador Reel"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Proposed Budget (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        placeholder="15000"
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Key Deliverable
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="1 Reel + 2 Stories"
                        value={customDeliverables}
                        onChange={(e) => setCustomDeliverables(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pitch Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pitch Message / Invitation Note *
              </label>
              <textarea
                rows={4}
                placeholder={`Hi ${creator.full_name}, we loved your recent content and would like to invite you to collaborate on our upcoming campaign...`}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-90 shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  'Sending Pitch...'
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Direct Pitch
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
