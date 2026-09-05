import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
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
  ChevronDown,
  Menu,
  X,
  Check,
  ExternalLink,
  Users,
  Send,
  Crown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, unreadNotifications, activeRole, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const isBrand = activeRole === 'brand';

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifs(true);
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (showNotifMenu) {
      fetchNotifications();
    }
  }, [showNotifMenu]);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_status: 1 })));
      showToast('All notifications marked as read.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-black text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              CreaterHub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Section 4 Structure) */}
        <nav className="hidden md:flex items-center gap-1 font-semibold text-xs">
          {user ? (
            <>
              <Link
                to="/creator/feed"
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/creator/feed'
                    ? 'bg-purple-950/60 text-purple-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> Discovery Feed
              </Link>

              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : isBrand ? '/brand/dashboard' : '/creator/dashboard'}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  location.pathname.includes('dashboard')
                    ? user?.role === 'admin'
                      ? 'bg-rose-950/60 text-rose-400 font-bold border border-rose-500/30'
                      : 'bg-purple-950/60 text-purple-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {user?.role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Admin Console
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3.5 h-3.5" /> Dashboard
                  </>
                )}
              </Link>

              {isBrand && (
                <Link
                  to="/pitch-creators"
                  className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                    location.pathname === '/pitch-creators'
                      ? 'bg-purple-950/60 text-purple-400 font-bold'
                      : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/30'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Direct Pitch
                </Link>
              )}

              <Link
                to="/creator/messages"
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                  location.pathname.includes('messages')
                    ? 'bg-purple-950/60 text-purple-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Messages
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Home
              </Link>
              <a
                href="#how-it-works"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                How It Works
              </a>
              <Link
                to="/creator/register"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                For Creators
              </Link>
              <Link
                to="/brand/register"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                For Brands
              </Link>
              <Link
                to="/creator/feed"
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Campaigns
              </Link>
            </>
          )}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {loadingNotifs ? (
                      <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">No alerts yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifMenu(false);
                            if (n.link) navigate(n.link);
                          }}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs cursor-pointer hover:border-purple-500/30"
                        >
                          <div className="font-bold text-white">{n.title}</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
              >
                <img
                  src={
                    (user.profile as any)?.avatar_url ||
                    (user.profile as any)?.logo_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                  }
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover border border-slate-700"
                />
                <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[100px] truncate">
                  {(user.profile as any)?.full_name || (user.profile as any)?.company_name || user.email.split('@')[0]}
                </span>
                {user.role === 'admin' ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Admin
                  </span>
                ) : !isBrand && (user.profile as any)?.subscription_tier && (user.profile as any)?.subscription_tier !== 'free' ? (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    (user.profile as any)?.subscription_tier === 'diamond'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : (user.profile as any)?.subscription_tier === 'gold'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                  }`}>
                    {(user.profile as any)?.subscription_tier}
                  </span>
                ) : null}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50 text-xs font-semibold">
                  {user.role === 'admin' ? (
                    <div className="p-2 mb-1.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-rose-400" /> System Administrator
                    </div>
                  ) : !isBrand && (
                    <Link
                      to="/creator/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 mb-1.5 rounded-xl bg-purple-950/40 border border-purple-500/20 hover:border-purple-500/40 flex items-center justify-between text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="capitalize font-bold">{(user.profile as any)?.subscription_tier || 'Free'} Member</span>
                      </span>
                      <span className="text-[10px] text-purple-400 font-bold">Manage ↗</span>
                    </Link>
                  )}

                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : isBrand ? '/brand/dashboard' : '/creator/dashboard'}
                    onClick={() => setShowProfileMenu(false)}
                    className="p-2 rounded-xl text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                  >
                    {user.role === 'admin' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-rose-400" /> Admin Portal
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4 text-purple-400" /> Dashboard
                      </>
                    )}
                  </Link>

                  {isBrand && (
                    <Link
                      to="/pitch-creators"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 rounded-xl text-purple-400 hover:bg-purple-950/40 flex items-center gap-2 font-bold"
                    >
                      <Send className="w-4 h-4 text-purple-400" /> Direct Pitch Creators
                    </Link>
                  )}

                  {user.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="p-2 rounded-xl text-rose-400 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Portal
                    </Link>
                  )}

                  <hr className="my-1 border-slate-800" />

                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/');
                    }}
                    className="w-full p-2 rounded-xl text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/creator/login"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/choose-role"
                className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-600/25 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
