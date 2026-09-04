import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Collaboration } from '../types';
import { ReviewModal } from '../components/ReviewModal';
import {
  FolderCheck,
  CheckCircle2,
  Lock,
  DollarSign,
  Video,
  UploadCloud,
  ShieldCheck,
  Send,
  MessageSquare,
  X,
  RotateCw,
  Clock,
  Star,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const STAGES = [
  { step: 1, name: 'Agreement & Escrow', actor: 'Brand Action', desc: 'Campaign contract accepted & budget secured in escrow.' },
  { step: 2, name: 'Product / Outlet Visit', actor: 'Shared Action', desc: 'Product delivered or creator conducts on-site outlet visit.' },
  { step: 3, name: 'Content Production', actor: 'Creator Action', desc: 'Drafting, editing reel, and preparing compliant captions.' },
  { step: 4, name: 'Proof Submitted', actor: 'Creator Action', desc: 'Live reel link & performance metrics submitted.' },
  { step: 5, name: 'Brand Review & Approval', actor: 'Brand Action', desc: 'Brand reviews deliverables against guidelines.' },
  { step: 6, name: 'Escrow Payout & Reviews', actor: 'Dual Action', desc: 'Funds released to creator & dual reviews posted.' }
];

export const CollaborationsPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);

  // Content Submission Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [contentUrl, setContentUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewCollab, setReviewCollab] = useState<Collaboration | null>(null);

  const isBrand = user?.role === 'brand';

  const loadCollaborations = async () => {
    try {
      const res = await api.getCollaborations();
      if (res.success) {
        setCollaborations(res.collaborations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborations();
  }, []);

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollab) return;
    try {
      await api.submitContentProof(selectedCollab.id, {
        content_url: contentUrl,
        platform: selectedCollab.platform || 'Instagram',
        caption,
        screenshot_url: screenshotUrl,
        notes
      });
      showToast('📸 Content proof submitted to brand for review!');
      setIsSubmitModalOpen(false);
      loadCollaborations();
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    }
  };

  const handleReviewAction = async (collabId: string, action: 'approve' | 'revision') => {
    try {
      await api.reviewContentProof(collabId, { action, feedback: action === 'approve' ? 'Deliverable approved!' : 'Please tweak pacing.' });
      showToast(action === 'approve' ? '✅ Deliverable Approved!' : '✏️ Revision Requested.');
      loadCollaborations();
    } catch (err: any) {
      showToast(err.message || 'Review failed', 'error');
    }
  };

  const handleReleasePayment = async (collab: Collaboration) => {
    try {
      const res = await api.releasePayment(collab.id);
      showToast(`🎉 Escrow Payout Released! ₹${collab.reward_per_creator?.toLocaleString()} sent to ${collab.creator_name}.`);
      loadCollaborations();
      // Prompt review
      setReviewCollab(collab);
      setIsReviewModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Payment release failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">
        Loading active collaborations & escrow status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <FolderCheck className="w-8 h-8 text-purple-600" /> Deals & Escrow Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time 6-stage collaboration workflow, proof verification, and simulated escrow payouts.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-blue-500" /> Simulated Escrow Engine
          </div>
        </div>

        {collaborations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <FolderCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <div className="font-bold text-sm text-slate-700 dark:text-slate-300">No active collaborations found.</div>
            <div className="text-xs">Accept creator applications or pitch briefs to initiate deals!</div>
          </div>
        ) : (
          <div className="space-y-6">
            {collaborations.map(collab => {
              const isPaid = collab.status === 'completed' || collab.payment_status === 'paid';
              const currentStep = collab.current_step || 1;

              return (
                <div
                  key={collab.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
                >
                  {/* Escrow Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-blue-200 dark:border-blue-900/60 text-xs">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                      <Lock className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Simulated Escrow Protection: Funds held securely until final content approval.</span>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Deal Value</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{(collab.reward_per_creator || 3000).toLocaleString()} {isPaid ? '• Payout Completed ✓' : '• In Escrow Locked'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Parties */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                        {collab.campaign_title}
                      </h2>
                      <div className="text-xs text-slate-500 font-semibold mt-1 flex flex-wrap items-center gap-3">
                        <span>Brand: <strong className="text-slate-800 dark:text-slate-200">{collab.brand_name}</strong></span>
                        <span>•</span>
                        <span>Creator: <strong className="text-slate-800 dark:text-slate-200">{collab.creator_name}</strong></span>
                        <span>•</span>
                        <span>Platform: <strong className="text-purple-600">{collab.platform || 'Instagram'}</strong></span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isPaid
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {collab.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* 6-Stage Workflow Timeline */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" /> Collaboration Timeline & Milestones:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {STAGES.map(stage => {
                        const isCompleted = currentStep > stage.step || (currentStep === 6 && isPaid);
                        const isCurrent = currentStep === stage.step && !isPaid;

                        return (
                          <div
                            key={stage.step}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              isCompleted
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                                : isCurrent
                                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 dark:text-purple-200'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase mb-1">
                              <span>Step {stage.step}</span>
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : isCurrent ? (
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                              ) : (
                                <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                              )}
                            </div>
                            <div className="text-xs font-bold leading-snug truncate">
                              {stage.name}
                            </div>
                            <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                              {stage.actor}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submitted Proof Card if available */}
                  {collab.content_url && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Video className="w-4 h-4 text-purple-500" /> Submitted Reel / Post Deliverable:
                        </span>
                        <a
                          href={collab.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                        >
                          Open Content Link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 font-mono text-[11px] break-all bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        {collab.content_url}
                      </div>
                      {collab.submitted_caption && (
                        <div className="text-slate-600 dark:text-slate-400 italic text-[11px]">
                          "{collab.submitted_caption}"
                        </div>
                      )}
                      {collab.brand_feedback && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-bold">
                          Brand Feedback: {collab.brand_feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {/* Creator Submit Action */}
                    {!isBrand && !isPaid && (
                      <button
                        onClick={() => {
                          setSelectedCollab(collab);
                          setContentUrl(collab.content_url || '');
                          setCaption(collab.submitted_caption || '');
                          setScreenshotUrl(collab.screenshot_url || '');
                          setIsSubmitModalOpen(true);
                        }}
                        className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <UploadCloud className="w-4 h-4" />
                        {collab.content_url ? 'Resubmit / Update Deliverable Link' : 'Submit Content Proof Link'}
                      </button>
                    )}

                    {/* Brand Approve / Revision Actions */}
                    {isBrand && collab.status === 'content_submitted' && (
                      <>
                        <button
                          onClick={() => handleReviewAction(collab.id, 'approve')}
                          className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Content Deliverable
                        </button>
                        <button
                          onClick={() => handleReviewAction(collab.id, 'revision')}
                          className="flex-1 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <RotateCw className="w-4 h-4" /> Request Revisions
                        </button>
                      </>
                    )}

                    {/* Brand Release Payment Action */}
                    {isBrand && collab.status === 'approved' && !isPaid && (
                      <button
                        onClick={() => handleReleasePayment(collab)}
                        className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Release Escrow Payment (₹{collab.reward_per_creator?.toLocaleString()})
                      </button>
                    )}

                    {/* Completed State & Reviews */}
                    {isPaid && (
                      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Escrow Payout Complete • Transaction ID: {(collab as any).transaction_id || 'TXN_ESCROW_RELEASED'}
                        </span>

                        <button
                          onClick={() => {
                            setReviewCollab(collab);
                            setIsReviewModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" /> Rate Collaboration
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Proof Modal */}
        {isSubmitModalOpen && selectedCollab && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                    Submit Content Proof
                  </h2>
                  <p className="text-xs text-slate-500">{selectedCollab.campaign_title}</p>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleContentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Live Content Reel / Post URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://instagram.com/reel/sample123"
                    value={contentUrl}
                    onChange={e => setContentUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Published Caption & Mentions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Paste caption, tags, and brand mentions used..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Performance Screenshot / Insights Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"
                    value={screenshotUrl}
                    onChange={e => setScreenshotUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" /> Submit Proof for Brand Verification
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dual-Sided Review Modal */}
        {isReviewModalOpen && reviewCollab && (
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            collaborationId={reviewCollab.id}
            revieweeId={isBrand ? reviewCollab.creator_user_id || reviewCollab.creator_id : reviewCollab.brand_user_id || reviewCollab.brand_id}
            revieweeName={isBrand ? reviewCollab.creator_name : reviewCollab.brand_name}
            revieweeRole={isBrand ? 'creator' : 'brand'}
            onReviewSubmitted={() => {
              loadCollaborations();
            }}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
};
