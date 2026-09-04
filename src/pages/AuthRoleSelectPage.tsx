import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Building2, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';

export const AuthRoleSelectPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-purple-500/30">
            C
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CreaterHub</span>
        </Link>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          How do you want to use CreaterHub?
        </h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Choose your account type to get started with tailored collaboration tools.
        </p>
      </div>

      <div className="mt-10 max-w-3xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Creator Card */}
        <div
          onClick={() => navigate('/creator/register')}
          className="bg-slate-900/80 hover:bg-slate-900 border-2 border-slate-800 hover:border-purple-500/60 rounded-3xl p-8 cursor-pointer transition-all duration-300 group hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>

            <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              For Influencers & Creators
            </span>

            <h3 className="text-2xl font-black text-white mb-2 group-hover:text-purple-300 transition-colors">
              I'm a Creator
            </h3>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Find local brands and collaboration opportunities near your neighborhood. Connect Instagram for verified metrics and unlock paid briefs.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Geospatial local discovery (1km - 25km radius)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Zero fake data — official Meta Graph API sync</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Protected Escrow payouts upon approved deliverables</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-purple-400 group-hover:text-purple-300">
            <span>Continue as Creator</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* Brand Card */}
        <div
          onClick={() => navigate('/brand/register')}
          className="bg-slate-900/80 hover:bg-slate-900 border-2 border-slate-800 hover:border-blue-500/60 rounded-3xl p-8 cursor-pointer transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-7 h-7" />
            </div>

            <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              For Local Businesses
            </span>

            <h3 className="text-2xl font-black text-white mb-2 group-hover:text-blue-300 transition-colors">
              I'm a Brand
            </h3>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Find local creators and grow your business. Launch campaigns, review verified engagement scores, and scale authentic word-of-mouth.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Targeted outlet radius & store geo-fencing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Multi-factor AI creator matching (0-100% Score)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Step-by-step deliverable review & escrow controls</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-blue-400 group-hover:text-blue-300">
            <span>Continue as Brand</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 relative z-10">
        Already have an account?{' '}
        <Link to="/creator/login" className="text-purple-400 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
