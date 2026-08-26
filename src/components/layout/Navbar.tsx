import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Compass,
  Briefcase,
  FolderCheck,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  UserCheck,
  Building2,
  ShieldCheck,
  LogOut,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, unreadNotifications, activeRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const isBrand = activeRole === 'brand';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CreatorHub
            </span>
            <span className="block text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Brand × Creator Marketplace
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-semibold text-sm">
          <Link
            to="/explore"
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
              location.pathname === '/explore'
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" /> Explore Campaigns
          </Link>

          {user && (
            <>
              {isBrand && (
                <Link
                  to="/pitch-creators"
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                    location.pathname === '/pitch-creators'
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-extrabold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-purple-500" /> Pitch Creators
                </Link>
              )}

              <Link
                to={isBrand ? '/brand/dashboard' : '/creator/dashboard'}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  location.pathname.includes('dashboard')
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4" /> Dashboard
              </Link>

              <Link
                to="/collaborations"
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/collaborations'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <FolderCheck className="w-4 h-4" /> Deals
              </Link>

              <Link
                to="/messages"
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/messages'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </Link>
            </>
          )}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 transition-colors"
              >
                <img
                  src={
                    (user.profile as any)?.avatar_url ||
                    (user.profile as any)?.logo_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  className="w-7 h-7 rounded-full object-cover"
                  alt="Avatar"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
                  {(user.profile as any)?.company_name || (user.profile as any)?.full_name || user.email.split('@')[0]}
                </span>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    isBrand
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                  }`}
                >
                  {user.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 flex flex-col gap-1 z-50">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl mb-1">
                    <div className="text-xs font-bold truncate">
                      {(user.profile as any)?.company_name || (user.profile as any)?.full_name || 'User Profile'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  </div>

                  <Link
                    to={isBrand ? `/brands/${user.profileId}` : `/creators/${user.profileId}`}
                    onClick={() => setShowProfileMenu(false)}
                    className="p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    {isBrand ? <Building2 className="w-4 h-4 text-sky-500" /> : <UserCheck className="w-4 h-4 text-purple-500" />}
                    Public Profile
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-indigo-600 dark:text-indigo-400"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Portal
                    </Link>
                  )}

                  <hr className="my-1 border-slate-100 dark:border-slate-700" />

                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/');
                    }}
                    className="p-2 rounded-xl text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout Session
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/brand/login"
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                For Brands
              </Link>
              <Link
                to="/creator/login"
                className="px-3.5 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 transition-all"
              >
                For Creators
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
