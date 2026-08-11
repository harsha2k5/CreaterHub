import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Lock, User, AtSign, MapPin, ArrowRight, Zap } from 'lucide-react';

export const CreatorAuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('alex@creatorhub.io');
  const [password, setPassword] = useState('Password123!');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await registerUser({
          role: 'creator',
          email,
          password,
          full_name: fullName,
          username: username || 'user_' + Date.now(),
          city,
          bio
        });
      } else {
        await login(email, password);
      }
      navigate('/creator/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const fillDemo = () => {
    setEmail('alex@creatorhub.io');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl">
            {isRegister ? 'Creator Registration' : 'Creator Portal Login'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister ? 'Monetize your content & discover local sponsorship briefs' : 'Check application status & manage active collaborations'}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="alexcreates"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold mb-1">Creator Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="alex@creatorhub.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <span>{isRegister ? 'Create Creator Profile' : 'Log In to Creator Studio'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <button
            onClick={fillDemo}
            type="button"
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-purple-500" /> One-Click Demo Login as Alex Rivera (128K)
          </button>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-purple-600 dark:text-purple-400 font-bold text-center hover:underline"
          >
            {isRegister ? 'Already have a creator profile? Log in' : "Don't have a profile yet? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
};
