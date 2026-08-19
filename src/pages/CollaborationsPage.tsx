import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Collaboration, ContentSubmission } from '../types';
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
  Clock
} from 'lucide-react';

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
      await api.reviewContentProof(collabId, { action, feedback: action === 'approve' ? 'Great work!' : 'Please adjust pacing.' });
      showToast(action === 'approve' ? '✅ Content Approved!' : '✏️ Revision Requested.');
      loadCollaborations();
    } catch (err: any) {
      showToast(err.message || 'Review failed', 'error');
    }
  };

  const handleReleasePayment = async (collabId: string) => {
    try {
      const res = await api.releasePayment(collabId);
      showToast(`💸 ${res.message}`);
      loadCollaborations();
    } catch (err: any) {
      showToast(err.message || 'Payment release failed', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Loading active collaborations...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
              <FolderCheck className="w-7 h-7 text-purple-600" /> Active Deals & Collaborations
            </h1>
            <p className="text-xs text-slate-500 mt-1">Track campaign workflow steps, submit content proof & release escrow payments</p>
          </div>
        </div>

        {collaborations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <FolderCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <div className="font-bold text-sm">No active collaborations found.</div>
            <div className="text-xs mt-1">Accept creator applications or submit briefs to start deals!</div>
          </div>
        ) : (
          <div className="space-y-6">
            {collaborations.map(collab => {
              const isPaid = collab.status === 'completed' || collab.payment_status === 'paid';

              return (
                <div key={collab.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  {/* Banner */}
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 mb-4 text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                      <Lock className="w-4 h-4 text-blue-500" /> Escrow Fund Guarantee Active
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      ₹{collab.reward_per_creator?.toLocaleString() || '2,500'} {isPaid ? 'Released' : 'Locked'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h3 className="font-heading font-extrabold text-lg mb-1">{collab.campaign_title}</h3>
                      <div className="text-xs text-slate-500">
                        Brand: <strong className="text-slate-800 dark:text-slate-200">{collab.brand_name}</strong> • Creator: <strong className="text-slate-800 dark:text-slate-200">{collab.creator_name}</strong>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${isPaid ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                      {collab.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Step Progress Tracker */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs mb-6">
                    <div className={`p-2.5 rounded-xl border ${collab.current_step >= 1 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      1. Accepted
                    </div>
                    <div className={`p-2.5 rounded-xl border ${collab.current_step >= 2 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      2. Brief Received
                    </div>
                    <div className={`p-2.5 rounded-xl border ${collab.current_step >= 3 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      3. Production
                    </div>
                    <div className={`p-2.5 rounded-xl border ${collab.current_step >= 4 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      4. Proof Submitted
                    </div>
                    <div className={`p-2.5 rounded-xl border ${collab.current_step >= 5 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      5. Approved
                    </div>
                    <div className={`p-2.5 rounded-xl border ${collab.current_step >= 6 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-bold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      6. Paid
                    </div>
                  </div>

                  {/* Display Submitted Content Proof if present */}
                  {collab.content_url && (
                    <div className="mb-6 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                      <div className="font-extrabold text-purple-900 dark:text-purple-200 mb-1 flex items-center justify-between">
                        <span>📸 Submitted Content Proof:</span>
                        <a href={collab.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold">
                          Open Link ↗
                        </a>
                      </div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 break-all">{collab.content_url}</div>
                      {collab.submitted_caption && (
                        <div className="mt-2 text-slate-500 italic">"{collab.submitted_caption}"</div>
                      )}
                      {collab.brand_feedback && (
                        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800 font-bold text-amber-700 dark:text-amber-300">
                          Brand Feedback: {collab.brand_feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {!isBrand && !isPaid && (
                      <button
                        onClick={() => {
                          setSelectedCollab(collab);
                          setContentUrl(collab.content_url || '');
                          setCaption(collab.submitted_caption || '');
                          setScreenshotUrl(collab.screenshot_url || '');
                          setIsSubmitModalOpen(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4" /> {collab.content_url ? 'Resubmit / Edit Content Proof' : 'Submit Content Proof Link'}
                      </button>
                    )}

                    {isBrand && collab.status === 'content_submitted' && (
                      <>
                        <button
                          onClick={() => handleReviewAction(collab.id, 'approve')}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Content
                        </button>
                        <button
                          onClick={() => handleReviewAction(collab.id, 'revision')}
                          className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2"
                        >
                          <RotateCw className="w-4 h-4" /> Request Revision
                        </button>
                      </>
                    )}

                    {isBrand && collab.status === 'approved' && !isPaid && (
                      <button
                        onClick={() => handleReleasePayment(collab.id)}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Payment as Done (Release ₹{collab.reward_per_creator?.toLocaleString()})
                      </button>
                    )}

                    {isPaid && (
                      <div className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" /> Payment Marked as Done & Escrow Transferred
                        </span>
                        <span className="text-[10px] opacity-80 font-mono">{(collab as any).transaction_id || 'TXN_ESCROW_PAID'}</span>
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-heading font-extrabold text-xl">Submit Content Proof</h2>
                  <p className="text-xs text-slate-500">{selectedCollab.campaign_title}</p>
                </div>
                <button onClick={() => setIsSubmitModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleContentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Live Content Reel / Post Link</label>
                  <input
                    type="text"
                    required
                    placeholder="https://instagram.com/reel/sample123 or instagram.com/reel/sample123"
                    value={contentUrl}
                    onChange={e => setContentUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Published Caption & Hashtags</label>
                  <textarea
                    rows={3}
                    placeholder="Paste your caption here..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Analytics Screenshot / Thumbnail Link</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
                    value={screenshotUrl}
                    onChange={e => setScreenshotUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 mt-2"
                >
                  <Send className="w-4 h-4" /> Submit Proof for Brand Approval
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
