import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  Crown,
  Gem,
  Zap,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SubscriptionTier } from '../types';

interface CreatorSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier;
  targetCampaignReward?: number;
  onSuccess?: () => void;
}

export const CreatorSubscriptionModal: React.FC<CreatorSubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentTier = 'free',
  targetCampaignReward,
  onSuccess
}) => {
  const { showToast, refreshSessionUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    currentTier === 'free' ? 'gold' : currentTier === 'silver' ? 'gold' : 'diamond'
  );
  const [loading, setLoading] = useState(false);
  const [successTier, setSuccessTier] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;
    if (tier === currentTier) {
      showToast(`You are already on the ${tier.toUpperCase()} plan!`, 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await api.upgradeSubscription({
        tier,
        billing_cycle: billingCycle,
        payment_method: 'UPI Instant'
      });

      if (res.success) {
        setSuccessTier(tier);
        showToast(`🎉 Upgraded to ${tier.toUpperCase()} successfully!`);
        if (refreshSessionUser) {
          await refreshSessionUser();
        }
        setTimeout(() => {
          setSuccessTier(null);
          onClose();
          if (onSuccess) onSuccess();
        }, 1600);
      } else {
        showToast(res.error || 'Failed to upgrade subscription.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Payment simulation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'silver' as SubscriptionTier,
      name: 'Silver Growth',
      tagline: 'Ideal for emerging creators scaling their monthly collabs',
      priceMonthly: 499,
      priceYearly: 4990,
      icon: Sparkles,
      color: 'slate',
      borderClass: 'border-slate-400/40 hover:border-slate-300',
      badgeClass: 'bg-slate-700/80 text-slate-200 border-slate-500/40',
      gradientClass: 'from-slate-700 to-slate-900',
      btnClass: 'bg-slate-200 hover:bg-white text-slate-950',
      applicationLimit: '15 Applications / mo',
      payoutAccess: 'Briefs up to ₹15,000',
      perks: [
        '15 campaign applications/month (5x free)',
        'Unlock briefs paying up to ₹15,000',
        '24h Early Access to newly published briefs',
        'Silver Verified Creator Profile Badge',
        'Priority brand application review'
      ]
    },
    {
      id: 'gold' as SubscriptionTier,
      name: 'Gold Pro',
      tagline: 'Most chosen by active influencers earning ₹30k - ₹80k/mo',
      priceMonthly: 999,
      priceYearly: 9990,
      icon: Crown,
      color: 'amber',
      popular: true,
      borderClass: 'border-amber-500/60 hover:border-amber-400 ring-2 ring-amber-500/30',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      gradientClass: 'from-amber-600/30 via-yellow-600/20 to-slate-900',
      btnClass: 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:opacity-95 text-slate-950 font-black shadow-lg shadow-amber-500/25',
      applicationLimit: '40 Applications / mo',
      payoutAccess: 'Briefs up to ₹50,000',
      perks: [
        '40 campaign applications/month (13x free)',
        'Unlock high-paying campaigns up to ₹50,000',
        'AI Pitch Generator for winning proposals',
        'Top 3 ranking in Brand Creator Matchmaker',
        'Gold VIP Influencer Badge on bids',
        'Direct brand invitations & pitches spotlight'
      ]
    },
    {
      id: 'diamond' as SubscriptionTier,
      name: 'Diamond VIP',
      tagline: 'For elite & agency creators seeking maximum high-ticket deals',
      priceMonthly: 1999,
      priceYearly: 19990,
      icon: Gem,
      color: 'purple',
      borderClass: 'border-purple-500/50 hover:border-purple-400',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      gradientClass: 'from-purple-900/40 via-indigo-900/30 to-slate-900',
      btnClass: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white font-black shadow-lg shadow-purple-500/25',
      applicationLimit: 'Unlimited Applications',
      payoutAccess: 'Unlimited (₹50,000+ Megas)',
      perks: [
        'Unlimited applications every month',
        'Access to all Mega-Budget & Ambassador deals',
        '0% Platform Commission fee on all earnings',
        'Dedicated VIP Creator Success Manager',
        'Diamond Elite Verification Badge',
        'Featured Spotlight on Brand Dashboard homepage'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col my-8 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
              <Crown className="w-3.5 h-3.5" /> Creator Pro Membership
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
              Unlock More High-Paying Campaigns
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {targetCampaignReward
                ? `This campaign pays ₹${targetCampaignReward.toLocaleString()}. Upgrade your tier to submit your pitch and unlock exclusive brand briefs.`
                : 'Free accounts are limited to 3 applications per month up to ₹5,000. Upgrade to Silver, Gold, or Diamond to get more paid briefs, early access, and top placement.'}
            </p>

            {/* Billing Switcher */}
            <div className="pt-2 inline-flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yearly Billing
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {successTier && (
          <div className="p-4 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
            <span>Successfully activated your {successTier.toUpperCase()} Membership! Enjoy your benefits.</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {plans.map(plan => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.id;
            const isSelected = selectedTier === plan.id;
            const displayPrice = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedTier(plan.id)}
                className={`rounded-3xl p-6 border transition-all flex flex-col justify-between relative cursor-pointer ${
                  plan.borderClass
                } ${isSelected ? 'bg-slate-800/80 shadow-xl' : 'bg-slate-900/60 hover:bg-slate-800/40'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <Icon className={`w-6 h-6 ${plan.id === 'silver' ? 'text-slate-300' : plan.id === 'gold' ? 'text-amber-400' : 'text-purple-400'}`} />
                    </div>
                    {isCurrent && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-black text-white">{plan.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{plan.tagline}</p>

                  {/* Price */}
                  <div className="my-5 pb-5 border-b border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">₹{displayPrice.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-bold">/ month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                        Billed annually: ₹{plan.priceYearly.toLocaleString()} (2 mos free)
                      </div>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Monthly Applications</span>
                      <span className="text-white font-extrabold">{plan.applicationLimit}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 font-medium">Campaign Ceiling</span>
                      <span className="text-emerald-400 font-extrabold">{plan.payoutAccess}</span>
                    </div>
                  </div>

                  {/* Perks Checklist */}
                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      Included Benefits:
                    </div>
                    {plan.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="pt-6 mt-6 border-t border-slate-800/80">
                  <button
                    type="button"
                    disabled={loading || isCurrent}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade(plan.id);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      plan.btnClass
                    }`}
                  >
                    {loading ? (
                      'Processing Activation...'
                    ) : isCurrent ? (
                      'Active Plan ✓'
                    ) : (
                      <>
                        Upgrade to {plan.name} <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote on Free Tier */}
        <div className="p-4 sm:px-8 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>
              <strong>Free Plan:</strong> 3 applications/month, campaigns up to ₹5,000. No credit card required.
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Instant UPI & Card Activation • Cancel anytime from dashboard
          </div>
        </div>
      </div>
    </div>
  );
};
