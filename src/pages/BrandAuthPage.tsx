import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Lock, Phone, MapPin, Globe, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const BrandAuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('marketing@ccd.com');
  const [password, setPassword] = useState('Password123!');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Food & Beverage');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { login, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await registerUser({
          role: 'brand',
          email,
          password,
          company_name: companyName,
          phone,
          category,
          city,
          state,
          description
        });
      } else {
        await login(email, password);
      }
      navigate('/brand/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const fillDemo = () => {
    setEmail('marketing@ccd.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl">
            {isRegister ? 'Register Brand Account' : 'Brand Login Portal'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister ? 'Post briefs & discover local creators near your business' : 'Access your active campaigns & creator applications'}
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
                <label className="block text-xs font-bold mb-1">Company / Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCD Indiranagar"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Business Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option>Food & Beverage</option>
                    <option>Fitness & Sports</option>
                    <option>Fashion & Apparel</option>
                    <option>Beauty & Skincare</option>
                    <option>Software & SaaS</option>
                  </select>
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
            <label className="block text-xs font-bold mb-1">Business Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="marketing@ccd.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500"
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
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all mt-2"
          >
            <span>{isRegister ? 'Complete Brand Registration' : 'Log In to Brand Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <button
            onClick={fillDemo}
            type="button"
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> One-Click Demo Login as CCD Brand
          </button>

          <button
            onClick={() => {
              setEmail('campaigns@nescafe.com');
              setPassword('Password123!');
            }}
            type="button"
            className="w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> One-Click Demo Login as Nescafé Brand ☕
          </button>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold text-center hover:underline"
          >
            {isRegister ? 'Already have a brand account? Log in' : "Don't have a brand account? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
};
