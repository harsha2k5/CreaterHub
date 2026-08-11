import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Zap, Lock, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-heading font-extrabold text-lg text-white">CreatorHub</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Connecting local businesses with creators & influencers for location-based promotional campaigns with Escrow financial security.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> Escrow Payment Protection Active
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">For Brands</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link to="/brand/register" className="hover:text-blue-400">Create Brand Account</Link></li>
              <li><Link to="/explore" className="hover:text-blue-400">Discover Local Creators</Link></li>
              <li><Link to="/brand/dashboard" className="hover:text-blue-400">Campaign Analytics</Link></li>
              <li><Link to="/collaborations" className="hover:text-blue-400">Escrow Payout Protection</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">For Creators</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link to="/creator/register" className="hover:text-purple-400">Create Creator Profile</Link></li>
              <li><Link to="/explore" className="hover:text-purple-400">Explore Nearby Briefs</Link></li>
              <li><Link to="/creator/dashboard" className="hover:text-purple-400">Earnings & Match Score</Link></li>
              <li><Link to="/collaborations" className="hover:text-purple-400">Submit Content Proof</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Startup Headquarters</h4>
            <div className="text-xs space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Real-Time Escrow Contract Engine</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div>© 2026 CreatorHub Platform Inc. All rights reserved.</div>
          <div className="flex gap-6 font-medium">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <Link to="/admin/login" className="hover:text-indigo-400">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
