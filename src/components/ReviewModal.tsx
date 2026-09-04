import React, { useState } from 'react';
import { api } from '../services/api';
import { Star, X, CheckCircle2, MessageSquare } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborationId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeRole: 'brand' | 'creator';
  onReviewSubmitted: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  collaborationId,
  revieweeId,
  revieweeName,
  revieweeRole,
  onReviewSubmitted,
  showToast
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      showToast('Please select a star rating.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitReview({
        collaboration_id: collaborationId,
        reviewee_id: revieweeId,
        rating,
        review_text: reviewText.trim()
      });
      showToast('⭐ Thank you! Your review has been published.');
      onReviewSubmitted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-white">
                Rate & Review Experience
              </h3>
              <p className="text-xs text-slate-500">
                Share feedback for <span className="font-bold text-slate-700 dark:text-slate-300">{revieweeName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center py-2 space-y-2">
            <div className="text-xs font-bold text-slate-500">Overall Rating</div>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled
                          ? 'text-amber-500 fill-amber-500 drop-shadow-sm'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-extrabold text-amber-500">
              {rating === 5 ? '🌟 Exceptional (5.0)' : rating === 4 ? '👍 Very Good (4.0)' : rating === 3 ? '👌 Average (3.0)' : 'Needs Improvement'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Review Details
            </label>
            <textarea
              rows={4}
              required
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder={`Describe the collaboration with ${revieweeName} (communication, deliverable quality, punctuality)...`}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reviewText.trim().length < 5}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
