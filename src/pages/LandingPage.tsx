import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Campaign } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  DollarSign,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  CheckCircle2,
  TrendingUp,
  Flame,
  Award,
  Clock,
  Instagram,
  Video,
  PlaySquare
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await api.getCampaigns({ radius: '15' });
        if (res.success && res.campaigns) {
          setFeaturedCampaigns(res.campaigns.slice(0, 3));
        }
      } catch (e) {
        // Fallback demo card if backend loading
      }
    };
    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-purple-600/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Location-Based Brand × Creator Collaboration Platform
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Where <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Local Brands</span> Meet <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Creators</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
              Discover nearby campaigns, collaborate with authentic creators, and release payments with Escrow protection. Build authentic connections right in your neighborhood.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/brand/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 group transition-all"
              >
                <Building2 className="w-5 h-5" /> I'm a Brand — Launch Brief
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/creator/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 group transition-all"
              >
                <Users className="w-5 h-5" /> I'm a Creator — Get Paid
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Markers Bar */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Escrow Fund Locking
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500" /> Location Discovery
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Verified Accounts
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Direct Messaging
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Demo Campaign Section (CCD Indiranagar) */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                Featured Live Briefs
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold">Explore Active Campaigns Near You</h2>
            </div>
            <Link
              to="/explore"
              className="mt-4 md:mt-0 font-bold text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View All 10+ Campaigns <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCampaigns.length > 0 ? (
              featuredCampaigns.map(camp => (
                <div
                  key={camp.id}
                  onClick={() => navigate(`/campaigns/${camp.id}`)}
                  className="group bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={camp.brand_logo || 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80'}
                          alt={camp.brand_name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            {camp.brand_name}
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {camp.location_name}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-xs">
                        ₹{camp.reward_per_creator.toLocaleString()}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-base mb-2 group-hover:text-blue-600 transition-colors">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline in 15 days
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      View Brief <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              // Hardcoded Demo CCD Brief
              <div
                onClick={() => navigate('/explore')}
                className="group bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=300&auto=format&fit=crop&q=80"
                        alt="CCD"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          Cafe Coffee Day (CCD)
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> Indiranagar, Bengaluru
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-xs">
                      ₹2,500
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base mb-2 group-hover:text-blue-600 transition-colors">
                    CCD Indiranagar Creator Promotion
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    CCD is launching a revamped lounge experience at our Indiranagar outlet and looking for local creators to produce authentic Instagram Reels.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> 10 Creators Needed
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Apply Brief <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl font-extrabold mb-4">How CreatorHub Works</h2>
            <p className="text-sm text-slate-500">End-to-end promotion management with built-in location radius search & escrow security.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Brands */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-xl">For Brands & Outlets</h3>
                  <p className="text-xs text-slate-500">Hire authentic local creators near your business</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Create Campaign Brief</h4>
                    <p className="text-xs text-slate-500">Set location (e.g. CCD Indiranagar), search radius (1-25km), reward payout & content requirements.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Review Creator Applications</h4>
                    <p className="text-xs text-slate-500">Compare creator follower stats, engagement rate, location distance & pitch ideas. Accept the best candidates.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Approve & Release Payment</h4>
                    <p className="text-xs text-slate-500">Review content proof URL & screenshot. When approved, release Escrow payment with 1 click.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Creators */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-xl">For Creators & Influencers</h3>
                  <p className="text-xs text-slate-500">Monetize your audience with nearby local sponsorships</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Discover Nearby Briefs</h4>
                    <p className="text-xs text-slate-500">Filter campaigns by distance, category (Food, Tech, Fashion), minimum reward & social platform.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Submit Your Pitch</h4>
                    <p className="text-xs text-slate-500">Explain why you are the best fit, share your proposed Reel concept, and submit your application.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Create & Receive Payout</h4>
                    <p className="text-xs text-slate-500">Film your Reel/Post, submit proof, and get paid directly to your account with Escrow protection.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-extrabold mb-4">Ready to Launch Your Next Local Campaign?</h2>
          <p className="text-base text-blue-100 mb-8 max-w-xl mx-auto">
            Join hundreds of local businesses and creators collaborating seamlessly on CreatorHub.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/brand/register"
              className="px-6 py-3.5 rounded-xl bg-white text-blue-600 font-extrabold text-sm hover:bg-slate-100 shadow-lg transition-colors"
            >
              Post a CampaignBrief
            </Link>
            <Link
              to="/creator/register"
              className="px-6 py-3.5 rounded-xl bg-purple-900/60 hover:bg-purple-900 text-white font-extrabold text-sm border border-white/20 transition-colors"
            >
              Apply as Creator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
