import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Creator, Review } from '../types';
import { UserCheck, MapPin, Star, CheckCircle2, Instagram, Youtube, Award, Folder } from 'lucide-react';

export const CreatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const res = await api.getCreatorById(id);
        if (res.success) {
          setCreator(res.creator);
          setReviews(res.reviews || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Loading creator profile...</div>;
  }

  if (!creator) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Creator profile not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
          <img
            src={creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
            className="w-24 h-24 rounded-3xl object-cover border-2 border-purple-500 shadow-lg shrink-0"
            alt={creator.full_name}
          />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h1 className="font-heading text-2xl font-extrabold flex items-center justify-center sm:justify-start gap-2">
                  {creator.full_name} <CheckCircle2 className="w-5 h-5 text-purple-500 fill-purple-500/20" />
                </h1>
                <div className="text-xs text-slate-500 font-semibold">@{creator.username} • {creator.city}, {creator.state}</div>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-1 font-extrabold text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" /> {creator.rating} ({creator.review_count} Reviews)
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed max-w-2xl">
              {creator.bio}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {creator.categories.map((cat, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-bold mb-1">Followers</div>
            <div className="font-heading text-2xl font-extrabold text-purple-600">{creator.followers.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-bold mb-1">Avg Engagement</div>
            <div className="font-heading text-2xl font-extrabold text-blue-600">{creator.engagement_rate}%</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-bold mb-1">Avg Views</div>
            <div className="font-heading text-2xl font-extrabold text-emerald-600">{creator.avg_views.toLocaleString()}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-bold mb-1">Completed Deals</div>
            <div className="font-heading text-2xl font-extrabold text-amber-500">24 Deals</div>
          </div>
        </div>

        {/* Brand Reviews Section */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-heading font-extrabold text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" /> Verified Brand Reviews
          </h2>

          {reviews.length === 0 ? (
            <div className="text-xs text-slate-400 py-4">No reviews yet for this creator.</div>
          ) : (
            <div className="space-y-3">
              {reviews.map(rev => (
                <div key={rev.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-xs flex items-center gap-2">
                      {rev.reviewer_name || 'Brand Reviewer'}
                      <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500" /> {rev.rating}/5
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{rev.review_text}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
