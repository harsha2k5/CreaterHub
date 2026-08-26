import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { BrandAuthPage } from './pages/BrandAuthPage';
import { CreatorAuthPage } from './pages/CreatorAuthPage';
import { AdminAuthPage } from './pages/AdminAuthPage';
import { BrandDashboard } from './pages/BrandDashboard';
import { CreatorDashboard } from './pages/CreatorDashboard';
import { ExploreCampaignsPage } from './pages/ExploreCampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { CollaborationsPage } from './pages/CollaborationsPage';
import { MessagesPage } from './pages/MessagesPage';
import { CreatorProfilePage } from './pages/CreatorProfilePage';
import { DirectPitchPage } from './pages/DirectPitchPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import './index.css';

function MainLayout() {
  const { toasts } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExploreCampaignsPage />} />
          <Route path="/pitch-creators" element={<DirectPitchPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/brand/login" element={<BrandAuthPage />} />
          <Route path="/brand/register" element={<BrandAuthPage />} />
          <Route path="/creator/login" element={<CreatorAuthPage />} />
          <Route path="/creator/register" element={<CreatorAuthPage />} />
          <Route path="/admin/login" element={<AdminAuthPage />} />
          <Route path="/brand/dashboard" element={<BrandDashboard />} />
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/collaborations" element={<CollaborationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/creators/:id" element={<CreatorProfilePage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Global Toast Alerts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-2xl px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-bounce-short"
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
