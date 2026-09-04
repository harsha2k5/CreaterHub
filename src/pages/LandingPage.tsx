import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  Bot,
  Compass,
  DollarSign,
  HeartHandshake
} from 'lucide-react';
import { Instagram } from '../components/icons/InstagramIcon';

export const LandingPage: React.FC = () => {
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'creator' | 'brand'>('creator');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.getCampaigns({ limit: '3' });
        if (res.success && res.campaigns) {
          setFeaturedCampaigns(res.campaigns.slice(0, 3));
        }
      } catch (err) {
        console.warn('Could not load featured briefs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border-b border-purple-500/20 px-4 py-2 text-center text-xs font-medium text-purple-200">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          Real Data First. Powered by Official Meta Graph API & AI Analytics.
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 font-semibold text-xs mb-8 shadow-inner">
              <Compass className="w-4 h-4 text-purple-400" />
              Hyperlocal Creator-Brand Collaboration Platform
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8">
              Where <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">Local Brands</span> Meet{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Creators</span>.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
              Discover nearby collaboration opportunities, connect with the right creators, and turn local influence into real business growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/creator/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 group transition-all"
              >
                <Users className="w-4 h-4" /> Join as Creator
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/brand/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-bold text-sm shadow-lg flex items-center justify-center gap-2 group transition-all"
              >
                <Building2 className="w-4 h-4 text-blue-400" /> Join as Brand
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Markers Bar */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-semibold text-slate-400">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Escrow Fund Protection
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" /> Haversine Local Radius
              </div>
              <div className="flex items-center justify-center gap-2">
                <Instagram className="w-4 h-4 text-pink-400" /> Official Meta Graph API
              </div>
              <div className="flex items-center justify-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" /> Grounded AI Score
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Ecosystem Visual */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                The Hyperlocal Collaboration Engine
              </h2>
              <p className="text-slate-400 text-sm">
                Seamless matching based on real proximity, genuine engagement, and transparent escrow execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Brand Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">Local Brand Briefs</h3>
                <p className="text-slate-400 text-xs mb-4">
                  Cafes, gyms, salons, and retail outlets launch targeted briefs with defined radii and rewards.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Escrow Locked Budgets
                </div>
              </div>

              {/* Match Hub */}
              <div className="bg-gradient-to-b from-purple-950/60 to-slate-950 p-6 rounded-2xl border border-purple-500/30 text-center relative shadow-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-600/30">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-purple-400 mb-1">Smart Engine</div>
                <h3 className="font-black text-white text-xl mb-2">91% Match Score</h3>
                <p className="text-slate-300 text-xs mb-4">
                  Haversine distance + verified audience + niche fit score creators without guesswork.
                </p>
                <div className="inline-block px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-[11px] font-bold">
                  📍 2.4 km from target store
                </div>
              </div>

              {/* Creator Card */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                  <Instagram className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-lg mb-1">Verified Creators</h3>
                <p className="text-slate-400 text-xs mb-4">
                  Instagram accounts synced via official Meta APIs. No scraping, no passwords, no fake stats.
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs text-pink-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Real Engagement Provenance
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Active Campaigns */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
              Live Brand Briefs
            </div>
            <h2 className="text-3xl font-black text-white">Active Neighborhood Opportunities</h2>
          </div>
          <Link
            to="/creator/register"
            className="mt-4 sm:mt-0 font-bold text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1.5 group"
          >
            Explore All Campaigns <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCampaigns.map(camp => (
              <div
                key={camp.id}
                className="bg-slate-900/70 rounded-2xl border border-slate-800 overflow-hidden hover:border-purple-500/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    <img
                      src={camp.image_url}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-purple-300 border border-purple-500/20">
                      {camp.category}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl text-sm font-black text-emerald-400 border border-emerald-500/30">
                      ₹{camp.reward_per_creator?.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <img src={camp.brand_logo} alt={camp.brand_name} className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs font-semibold text-slate-300">{camp.brand_name}</span>
                    </div>
                    <h3 className="font-bold text-white text-base mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                      {camp.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-blue-400 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{camp.location_name || camp.city}</span>
                  </div>
                  <Link
                    to="/creator/register"
                    className="font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Apply Now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
              Workflow Transparency
            </div>
            <h2 className="text-3xl font-black text-white mb-6">How CreaterHub Works</h2>

            {/* Toggle Tabs */}
            <div className="inline-flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('creator')}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'creator'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                For Creators
              </button>
              <button
                onClick={() => setActiveTab('brand')}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'brand'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                For Brands
              </button>
            </div>
          </div>

          {activeTab === 'creator' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create Your Profile', desc: 'Sign up with your bio, preferred categories, rate card, and geographic neighborhood.' },
                { step: '02', title: 'Connect Instagram', desc: 'Securely link via official Meta OAuth. No scraping, no passwords, only live verified metrics.' },
                { step: '03', title: 'Discover Nearby Campaigns', desc: 'Filter active brand briefs by distance (1km, 5km, 10km, 25km) and match suitability.' },
                { step: '04', title: 'Apply with Custom Pitch', desc: 'Submit tailored collaboration ideas and availability directly to local business owners.' },
                { step: '05', title: 'Collaborate & Deliver', desc: 'Produce required Reels, Stories, or Carousels and upload live post proof for approval.' },
                { step: '06', title: 'Get Paid & Build Rating', desc: 'Receive protected escrow payout, record verifiable campaign history, and collect reviews.' }
              ].map(s => (
                <div key={s.step} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all">
                  <div className="text-2xl font-black text-purple-400 mb-2 font-mono">{s.step}</div>
                  <h3 className="font-bold text-white text-base mb-1.5">{s.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create Brand Profile', desc: 'Register your retail store, cafe, studio, or service business with exact outlet coordinates.' },
                { step: '02', title: 'Publish a Brief', desc: 'Define budget, deliverables (Reels/Stories), target radius, and creator follower brackets.' },
                { step: '03', title: 'Discover Local Creators', desc: 'Review nearby creators ranked by distance, niche overlap, and calibrated Match Score.' },
                { step: '04', title: 'Review Applications', desc: 'Inspect verified Instagram engagement rates and AI creator analyses before selecting.' },
                { step: '05', title: 'Approve & Release Funds', desc: 'Verify submitted live post links and proof before releasing locked escrow payments.' },
                { step: '06', title: 'Track Collaboration ROI', desc: 'Build lasting partnerships, rate creators, and expand neighborhood customer reach.' }
              ].map(s => (
                <div key={s.step} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all">
                  <div className="text-2xl font-black text-blue-400 mb-2 font-mono">{s.step}</div>
                  <h3 className="font-bold text-white text-base mb-1.5">{s.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
            Platform Capabilities
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Engineered for Trust & Results</h2>
          <p className="text-slate-400 text-sm">
            Everything local businesses and digital creators need for transparent, seamless partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Instagram, color: 'text-pink-400', title: 'Official Meta Analytics', desc: 'Verified profile stats, media lists, and real engagement numbers.' },
            { icon: Bot, color: 'text-purple-400', title: 'Grounded AI Analysis', desc: 'Structured creator scores, strengths, and actionable content recommendations.' },
            { icon: Compass, color: 'text-blue-400', title: 'Haversine Radius Match', desc: 'Precise geospatial calculations prioritizing nearby stores and talent.' },
            { icon: DollarSign, color: 'text-emerald-400', title: 'Escrow Protection', desc: 'Transparent payment locking upon acceptance and release upon verification.' },
            { icon: BarChart3, color: 'text-amber-400', title: 'Performance Tracking', desc: 'Track reach, active applications, and completed deliverables in real time.' },
            { icon: Zap, color: 'text-cyan-400', title: 'In-App Direct Chat', desc: 'Collaborate and coordinate deliverables with authenticated messaging.' },
            { icon: Award, color: 'text-rose-400', title: 'Mutual Reviews', desc: 'Build verified reputation with post-collaboration star ratings.' },
            { icon: ShieldCheck, color: 'text-indigo-400', title: 'Zero Fake Data', desc: 'Strict data provenance labels and zero simulated benchmark guessers.' }
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-900/60 via-indigo-950 to-purple-900/60 p-10 sm:p-16 rounded-3xl border border-purple-500/30 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Ready to Grow Together?
            </h2>
            <p className="text-slate-300 text-base max-w-xl mx-auto mb-8">
              Join hundreds of local brands and authentic creators building real local influence and revenue today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/creator/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                I'm a Creator
              </Link>
              <Link
                to="/brand/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                I'm a Brand
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
