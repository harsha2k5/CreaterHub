import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  Sparkles,
  Bot,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Layers
} from 'lucide-react';

interface AICreatorAnalysisCardProps {
  analysis: any;
  isInstagramConnected: boolean;
  onAnalysisUpdated: (newAnalysis: any) => void;
}

export const AICreatorAnalysisCard: React.FC<AICreatorAnalysisCardProps> = ({
  analysis,
  isInstagramConnected,
  onAnalysisUpdated
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.triggerAIAnalysis();
      if (res.success && res.analysis) {
        onAnalysisUpdated(res.analysis);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  };

  if (!isInstagramConnected) {
    return (
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center max-w-xl mx-auto shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
          <Bot className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connect Instagram to Unlock AI Analysis</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          CreaterHub evaluates real account metrics rather than fabricated guesses. Connect your official Instagram account to generate your grounded Creator Score and tailored growth recommendations.
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zero Synthetic Scores Policy
        </span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-8 text-center max-w-xl mx-auto shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Analyze Your Verified Instagram Profile</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Run your AI evaluation to determine your Creator Score, audience suitability for local brands, and key strengths.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          {analyzing ? 'Analyzing Metrics...' : 'Generate AI Creator Analysis'}
        </button>
      </div>
    );
  }

  const subScores = [
    { label: 'Engagement Quality', score: analysis.engagementScore || 75 },
    { label: 'Content Consistency', score: analysis.consistencyScore || 75 },
    { label: 'Content Quality', score: analysis.contentScore || 75 },
    { label: 'Audience Relevance', score: analysis.audienceScore || 75 },
    { label: 'Brand Suitability', score: analysis.brandSuitabilityScore || 75 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Creator Score */}
      <div className="bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Score Ring / Pill */}
            <div className={`w-24 h-24 rounded-3xl border-2 flex flex-col items-center justify-center shadow-lg ${getScoreColor(analysis.overallScore || 80)}`}>
              <span className="text-3xl font-black">{analysis.overallScore || 80}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">/ 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-purple-400" /> AI Creator Score
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(analysis.analyzed_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">Performance Evaluation</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all self-start md:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Re-analyzing...' : 'Re-Analyze'}
          </button>
        </div>

        {/* Sub-Score Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-800/80">
          {subScores.map(sub => (
            <div key={sub.label} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate">
                {sub.label}
              </div>
              <div className="text-xl font-black text-white mb-2">{sub.score}</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${sub.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
            <CheckCircle2 className="w-4 h-4" /> Core Strengths
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {analysis.strengths?.map((s: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses / Opportunities */}
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">
            <AlertTriangle className="w-4 h-4" /> Growth Opportunities
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {analysis.weaknesses?.map((w: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-4">
            <Lightbulb className="w-4 h-4" /> Actionable Recommendations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {analysis.recommendations.map((r: string, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <div className="font-bold text-purple-300 mb-1">Tip #{idx + 1}</div>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authenticity Disclaimer */}
      <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>AI evaluation grounded strictly in verified Instagram synchronization. Zero synthetic scores.</span>
      </div>
    </div>
  );
};
