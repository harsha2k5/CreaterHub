import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Lock, User, AtSign, MapPin, ArrowRight, Phone, Sparkles, AlertCircle } from 'lucide-react';

export const CreatorAuthPage: React.FC = () => {
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(location.pathname.includes('register'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [area, setArea] = useState('Indiranagar');
  const [niche, setNiche] = useState('Food & Beverage');
  const [bio, setBio] = useState('');
  const [minBudget, setMinBudget] = useState('4000');
  const [radiusKm, setRadiusKm] = useState('15');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login, registerUser, logout } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl text-white">Already Signed In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Logged in as <strong className="text-white">{user.email}</strong>
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate(user.role === 'brand' ? '/brand/dashboard' : '/creator/feed')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
            >
              Go to {user.role === 'brand' ? 'Brand Studio' : 'Campaign Feed'} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs rounded-xl transition-all"
            >
              Log Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await registerUser({
          role: 'creator',
          email,
          password,
          full_name: fullName,
          username: username || fullName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          social_link: socialLink,
          phone,
          city,
          area,
          categories: [niche],
          bio,
          min_budget: Number(minBudget),
          radius_km: Number(radiusKm)
        });
        // Section 6: Send directly to Creator Campaign Feed!
        navigate('/creator/feed');
      } else {
        await login(email, password);
        navigate('/creator/feed');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-base">
              C
            </div>
            <span className="text-lg font-black text-white tracking-tight">CreaterHub</span>
          </Link>

          <h2 className="text-2xl font-black text-white">
            {isRegister ? 'Creator Registration' : 'Creator Portal Login'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? 'Discover paid brand briefs near your neighborhood'
              : 'Access your campaign feed, Instagram analytics & earnings'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Rao"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="ananya_bites"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Neighborhood / Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indiranagar"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Primary Niche *</label>
                  <select
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Fitness & Wellness">Fitness & Wellness</option>
                    <option value="Beauty & Skincare">Beauty & Skincare</option>
                    <option value="Dining & Nightlife">Dining & Nightlife</option>
                    <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                    <option value="Tech & Gadgets">Tech & Gadgets</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    value={minBudget}
                    onChange={e => setMinBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Bio / Profile Summary</label>
                <textarea
                  rows={2}
                  placeholder="Tell local businesses about your content style and audience..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Instagram Profile Link</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/your_handle"
                  value={socialLink}
                  onChange={e => setSocialLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="ananya@creatorhub.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className={isRegister ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block font-bold text-slate-300 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-xl shadow-purple-600/25 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
          >
            <span>{isRegister ? 'Create Profile & Discover Briefs' : 'Log In to Creator Studio'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-xs text-purple-400 font-bold hover:underline"
          >
            {isRegister ? 'Already have an account? Sign in here' : "New to CreaterHub? Create creator profile"}
          </button>
        </div>
      </div>
    </div>
  );
};
