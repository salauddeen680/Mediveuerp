import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { httpsCallable } from 'firebase/functions';
import useSWR from 'swr';
import { Check, Copy, Gift, Share2, Users, WalletCards } from 'lucide-react';
import { functions } from '../firebase';
import { Badge, Button, Card, PageHeader } from './ui';

export default function ReferralCenter({ user, showToast }) {
  const [copied, setCopied] = useState(false);
  const inviteOrigin = import.meta.env.VITE_APP_URL || (Capacitor.isNativePlatform() ? 'https://www.mediveu.site' : window.location.origin);
  const inviteUrl = useMemo(() => `${inviteOrigin}/?ref=${encodeURIComponent(user.uid)}#register`, [inviteOrigin, user.uid]);
  const { data, error, isLoading } = useSWR(
    user?.uid ? ['referral-dashboard', user.uid] : null,
    () => httpsCallable(functions, 'getReferralDashboard')({}).then((result) => result.data),
    { refreshInterval: 30000, revalidateOnFocus: true },
  );
  const stats = data?.stats || {};
  const referrals = data?.referrals || [];
  const activeMonthly = Number(stats.activeMonthlySubscribers || 0);
  const progress = Math.min(activeMonthly, 3);
  const rewardGranted = Boolean(stats.rewardGranted);
  const appliedMonths = Number(stats.rewardMonthsApplied || 0);

  const share = async () => {
    const text = 'Try MEDIVEU ERP for simple pharmacy billing, stock and GST invoices. Create your store account here:';
    try {
      if (navigator.share) await navigator.share({ title: 'MEDIVEU ERP referral', text, url: inviteUrl });
      else {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('Could not open sharing. Copy the referral link instead.', 'error');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showToast('Referral link copied');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy the link in this browser', 'error');
    }
  };

  const sortedReferrals = [...referrals].sort((a, b) => (b.qualifiedAt || 0) - (a.qualifiedAt || 0));

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <PageHeader title="Invite friends, earn free time" subtitle="When 3 different stores you invite each buy a monthly plan, you earn one free month. Only verified monthly payments count." icon={<Gift size={20} />} />
      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-4">
        <Card className="p-5 sm:p-6 border-brand-sky/20 bg-gradient-to-br from-sky-500/[0.08] to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-brand-sky">Your invite link</p><h2 className="text-lg font-bold text-white mt-1">Share it with pharmacy owners</h2></div>
            <div className="w-10 h-10 rounded-xl bg-brand-sky/10 text-brand-sky grid place-items-center"><Share2 size={19} /></div>
          </div>
          <p className="text-sm text-slate-400 mt-2">A referral counts only after a new user joins through your link and completes a verified ₹249 monthly payment. Trials, yearly plans and duplicate accounts do not count.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-950/70 px-3 py-3 text-xs text-slate-300 truncate" title={inviteUrl}>{inviteUrl}</div>
            <Button variant="secondary" onClick={copy}><Copy size={15} /> {copied ? 'Copied' : 'Copy link'}</Button>
            <Button onClick={share}><Share2 size={15} /> Share</Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active monthly subscribers</p><p className="text-2xl font-extrabold text-white mt-1">{activeMonthly}<span className="text-slate-500"> / 3</span></p></div>
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green grid place-items-center"><Gift size={19} /></div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-label="Qualifying monthly referrals toward next reward" aria-valuemin={0} aria-valuemax={3} aria-valuenow={progress}>
            <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${(progress / 3) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-3">{rewardGranted ? 'Your one-time free-month reward has been unlocked.' : `${Math.max(0, 3 - progress)} more active monthly ${3 - progress === 1 ? 'subscriber' : 'subscribers'} needed to reach the goal.`}</p>
          <p className="text-xs text-brand-green mt-2">{appliedMonths} free {appliedMonths === 1 ? 'month' : 'months'} added to your plan</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.07]">
          <div><h2 className="font-bold text-white">Your invited stores</h2><p className="text-xs text-slate-500 mt-1">Referral status updates after payment verification.</p></div>
          <Badge tone="info"><Users size={13} /> {referrals.length} invited</Badge>
        </div>
        {error ? (
          <p role="alert" className="p-5 text-sm text-red-300">Referral activity could not be loaded. Refresh this page and try again.</p>
        ) : isLoading ? (
          <p role="status" className="p-5 text-sm text-slate-400">Loading referral activity…</p>
        ) : sortedReferrals.length ? (
          <ul className="divide-y divide-white/[0.06]">
            {sortedReferrals.map((referral) => (
              <li key={referral.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0"><p className="text-sm font-medium text-white truncate">Store account ending {referral.id.slice(-6)}</p><p className="text-xs text-slate-500 mt-0.5">{referral.isActiveMonthly ? `Active through ${new Date(referral.activeMonthlySubscriptionEndsAt).toLocaleDateString('en-IN')}` : referral.qualifiedAt ? `Monthly plan qualified ${new Date(referral.qualifiedAt).toLocaleDateString('en-IN')}` : 'Waiting for monthly subscription'}</p></div>
                <Badge tone={referral.isActiveMonthly ? 'success' : referral.status === 'qualified' ? 'info' : 'warning'}>{referral.isActiveMonthly ? <><Check size={12} /> Active monthly</> : referral.status === 'qualified' ? <><Check size={12} /> Qualified</> : <><WalletCards size={12} /> Pending</>}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-10 px-5 text-center"><div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 grid place-items-center text-slate-400"><Users size={20} /></div><p className="text-sm font-semibold text-white mt-3">No invited stores yet</p><p className="text-xs text-slate-500 mt-1">Share your invite link to start earning.</p></div>
        )}
      </Card>
      <p className="text-xs text-slate-500">Rewards are issued automatically by the verified payment service. A subscription can earn referral credit once only; a reward is granted for each complete group of three qualifying monthly subscribers.</p>
    </div>
  );
}
