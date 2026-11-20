import React, { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { Receipt, Package, WifiOff, Smartphone, LayoutTemplate, BarChart3, ShieldCheck, Users, Check, ArrowRight, Menu, X, Phone, Mail, Download, LockKeyhole, Sparkles } from 'lucide-react';
import { auth } from '../../firebase';
import { sessionStore } from '../../lib/sessionStore';
import { BrandMark, Button, Card, Field, cn } from '../ui';
import LegalDocuments from '../LegalDocuments';

const FEATURES = [
  { icon: Receipt, title: 'Fast GST Billing', text: 'Keyboard-first billing (F2 save, F4 print) with barcode scan, CGST/SGST/IGST and auto amount in words.' },
  { icon: LayoutTemplate, title: '10+ Bill Templates', text: 'A4 GST, pharma wholesale, A5 retail, thermal 80mm & 58mm, estimate, challan and more.' },
  { icon: Package, title: 'Batch & Expiry Stock', text: 'Track batch, expiry, MRP and quantity. Stock auto-reduces on sale and increases on purchase.' },
  { icon: WifiOff, title: 'Works Offline', text: 'Keep billing without internet. Everything syncs automatically when you are back online.' },
  { icon: Users, title: 'Party Ledger (Khata)', text: 'Customer and supplier ledgers with credit, payments and outstanding balances.' },
  { icon: BarChart3, title: 'Reports & Alerts', text: 'Sales reports, low-stock and near-expiry alerts, Excel export and one-click backup.' },
];

const PLANS = [
  { name: 'Free Trial', price: '0', period: '7 days', text: 'All features, no card required.', cta: 'Start Free Trial' },
  { name: 'Monthly', price: '249', period: 'month', text: 'Secure checkout available after sign-in.', cta: 'Sign in to upgrade', featured: true },
  { name: 'Yearly', price: '2,799', period: 'year', text: 'Secure checkout available after sign-in.', cta: 'Sign in to upgrade' },
];

const TABS = ['home', 'features', 'pricing', 'contact'];

function authError(err) {
  const map = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Invalid email or password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'This email is already registered. Please log in.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes, then try again.',
    'auth/user-disabled': 'This account is disabled. Contact MEDIVEU support.',
    'auth/operation-not-allowed': 'Email and password sign-in is not enabled for this Firebase project. Contact MEDIVEU support.',
    'auth/network-request-failed': 'No internet connection. Reconnect and try again.',
  };
  return map[err?.code] || String(err?.message || 'Something went wrong').replace('Firebase:', '').trim();
}

function Home({ setTab }) {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,123,240,0.25),transparent_60%)]" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-green border border-brand-green/30 bg-brand-green/10 rounded-full px-3 py-1">
            <ShieldCheck size={14} /> Complete Medical Store ERP
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white text-balance leading-[1.05]">
            Smart billing & stock for <span className="gradient-text">medical stores</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-slate-400 max-w-2xl mx-auto text-pretty">
            MEDIVEU ERP helps pharmacies and wholesalers create GST invoices in seconds, manage batch-wise stock and party ledgers on mobile, laptop or desktop, even offline.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setTab('register')} className="px-6 py-3">Start 7-day free trial <ArrowRight size={16} /></Button>
            <Button variant="secondary" onClick={() => setTab('login')} className="px-6 py-3">Login to store</Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            {['GST ready', 'Works offline', 'Thermal & A4 print', 'WhatsApp share'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><Check size={14} className="text-brand-green" /> {t}</span>
            ))}
          </div>
        </div>
      </section>
      <FeaturesGrid />
      <Pricing setTab={setTab} />
    </>
  );
}

function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => Capacitor.isNativePlatform() || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions((visible) => !visible);
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setInstallPrompt(null);
    } catch {
      setInstallPrompt(null);
      setShowInstructions(true);
    }
  };

  return (
    <Card className="mt-6 p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-sky/10 text-brand-sky grid place-items-center"><Smartphone size={20} /></span>
        <div className="min-w-0">
          <h3 className="font-semibold text-white">{installed ? 'MEDIVEU ERP is installed' : 'Use MEDIVEU like an app'}</h3>
          <p className="text-sm text-slate-400 mt-1">{installed ? 'You are using MEDIVEU as an installed app.' : 'Install it on your phone or computer for a full-screen shortcut and offline access, or download the Android release.'}</p>
          {showInstructions && !installed && (
            <p className="text-sm text-slate-300 mt-2" role="status">{/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Open Share and tap Add to Home Screen.' : 'Open your browser menu and choose Install app or Add to Home screen.'}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 shrink-0">
        {!installed && <Button variant="secondary" className="w-full md:w-auto" onClick={install}><Download size={16} /> {showInstructions && !installPrompt ? 'Hide install steps' : 'Install web app'}</Button>}
        {!installed && <a href="https://github.com/alauddinjp681-sudo/Mediveuerp/releases/latest/download/Mediveu-ERP.apk" className="btn-ghost justify-center" aria-label="Download the MEDIVEU Android APK">
          <Download size={16} /> Android APK
        </a>}
      </div>
    </Card>
  );
}

function FeaturesGrid() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center text-balance">Everything your store needs</h2>
      <p className="text-slate-400 text-center mt-3 max-w-xl mx-auto">Built for Indian pharmacies, distributors and retail counters.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-6">
            <span className="w-11 h-11 rounded-xl bg-brand-gradient text-white flex items-center justify-center shadow-glow"><Icon size={20} /></span>
            <h3 className="mt-4 font-bold text-white">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{text}</p>
          </Card>
        ))}
      </div>
      <InstallAppCard />
    </section>
  );
}

function Pricing({ setTab }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center">Simple, transparent pricing</h2>
      <div className="grid md:grid-cols-3 gap-4 mt-10">
        {PLANS.map((p) => (
          <Card key={p.name} className={cn('p-6 flex flex-col', p.featured && 'border-brand-sky/50 shadow-glow')}>
            {p.featured && <span className="self-start text-[11px] font-bold uppercase tracking-wider text-white bg-brand-gradient rounded-full px-2.5 py-0.5 mb-3">Most popular</span>}
            <h3 className="font-bold text-white text-lg">{p.name}</h3>
            <div className="mt-3 text-4xl font-extrabold text-white">₹{p.price}<span className="text-sm font-medium text-slate-400"> / {p.period}</span></div>
            <p className="text-sm text-slate-400 mt-2 flex-1">{p.text}</p>
            <Button variant={p.featured ? 'primary' : 'secondary'} className="mt-6 w-full" onClick={() => setTab(p.name === 'Free Trial' ? 'register' : 'login')}>{p.cta}</Button>
          </Card>
        ))}
      </div>
      <p className="mt-5 text-center text-xs text-slate-500">Payments are verified securely before a subscription is activated. Sign in to manage or upgrade your store plan.</p>
    </section>
  );
}

function Contact() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h2 className="text-3xl font-extrabold text-white">Contact MEDIVEU ERP</h2>
      <p className="text-slate-400 mt-3">Need help with setup, plans or migration? We are here.</p>
      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <Card className="p-6"><Mail className="mx-auto text-brand-sky" /><a href="mailto:salauddeen680@gmail.com" className="mt-2 inline-block text-white font-semibold hover:text-brand-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky rounded">salauddeen680@gmail.com</a></Card>
        <Card className="p-6"><Phone className="mx-auto text-brand-green" /><div className="mt-2 text-white font-semibold">Mon - Sat, 10am - 7pm</div></Card>
      </div>
    </section>
  );
}

function AuthCard({ title, subtitle, children, setTab }) {
  return (
    <section className="auth-scene">
      <div className="auth-layout">
        <div className="auth-story">
          <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
          <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
          <div className="auth-story-content">
            <span className="auth-eyebrow"><Sparkles size={14} /> MEDIVEU SECURE ACCESS</span>
            <h2>Care for your<br /><span>business, clearly.</span></h2>
            <p>One calm place for billing, stock, customers and the daily work that keeps your pharmacy moving.</p>
            <div className="auth-trust"><LockKeyhole size={15} /> Your account is protected by Firebase Authentication</div>
          </div>
        </div>
        <Card className="auth-panel">
          <div className="auth-brand"><BrandMark /></div>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
          <div className="auth-footer"><ShieldCheck size={14} /> Secure access to your store workspace</div>
          <nav aria-label="Legal information" className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            <button type="button" onClick={() => setTab?.('privacy')} className="text-slate-400 underline-offset-4 hover:text-brand-sky hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky rounded">Privacy Policy</button>
            <button type="button" onClick={() => setTab?.('terms')} className="text-slate-400 underline-offset-4 hover:text-brand-sky hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky rounded">Terms &amp; Conditions</button>
          </nav>
        </Card>
      </div>
    </section>
  );
}

function Login({ setTab, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('Logged in successfully');
    } catch (err) {
      showToast(authError(err), 'error');
    }
    setBusy(false);
  };

  return (
    <AuthCard title="Login to your store" subtitle="Welcome back to MEDIVEU ERP" setTab={setTab}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        <div className="flex justify-end">
          <button type="button" onClick={() => { setTab('forgot'); }} className="text-sm text-brand-sky hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky rounded">Forgot password?</button>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Logging in...' : 'Login securely'} <ArrowRight size={16} /></Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">New here? <button onClick={() => setTab('register')} className="text-brand-sky font-semibold hover:underline">Create account</button></p>
    </AuthCard>
  );
}

function ForgotPassword({ setTab, showToast }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showToast('Password reset link sent. Check your inbox.');
      setTab('login');
    } catch (error) {
      showToast(authError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Reset your password" subtitle="We will email a secure link to get you back into your store." setTab={setTab}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Account email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Sending secure link...' : 'Send reset link'} <ArrowRight size={16} /></Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400"><button onClick={() => setTab('login')} className="text-brand-sky font-semibold hover:underline">Back to login</button></p>
    </AuthCard>
  );
}

function Register({ setTab, showToast }) {
  const [form, setForm] = useState(() => ({
    storeName: '', phone: '', email: '', password: '', invitationCode: '',
    ownerReferralCode: new URLSearchParams(window.location.search).get('ref') || '',
  }));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const invitationCode = form.invitationCode.trim();
    const ownerReferralCode = invitationCode ? '' : form.ownerReferralCode.trim();
    const registration = {
      storeName: form.storeName.trim(),
      phone: form.phone.trim(),
      invitationCode,
    };
    sessionStore.setItem('mediveu-registration', JSON.stringify(registration));
    if (ownerReferralCode) {
      sessionStore.setItem('mediveu-owner-referral-code', JSON.stringify({ email: form.email.trim().toLowerCase(), code: ownerReferralCode }));
    } else {
      sessionStore.removeItem('mediveu-owner-referral-code');
    }
    try {
      await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      showToast('Account created. Your store is being set up now.');
    } catch (err) {
      sessionStore.removeItem('mediveu-registration');
      sessionStore.removeItem('mediveu-owner-referral-code');
      showToast(authError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create your store account" subtitle="7 days free. No card required." setTab={setTab}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Staff / team invitation code (optional)" id="team-invitation-code" value={form.invitationCode} onChange={set('invitationCode')} autoComplete="off" placeholder="For joining an existing store as a teammate" />
        {!form.invitationCode.trim() && <>
          <Field label="Owner referral code (optional)" id="owner-referral-code" value={form.ownerReferralCode} onChange={set('ownerReferralCode')} autoComplete="off" placeholder="MEDI-…" />
          <p className="-mt-2 text-xs text-slate-500">For tracking owner referrals and rewards only. It never signs you in or grants store access.</p>
        </>}
        <Field label="Store Name" value={form.storeName} onChange={set('storeName')} required={!form.invitationCode.trim()} placeholder={form.invitationCode.trim() ? 'Not needed when joining a store' : ''} />
        <Field label="Mobile" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <Field label="Password" type="password" minLength={6} value={form.password} onChange={set('password')} required autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating...' : 'Register & start trial'}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">Already have an account? <button onClick={() => setTab('login')} className="text-brand-sky font-semibold hover:underline">Login</button></p>
    </AuthCard>
  );
}

export default function PublicSite({ showToast, tab, setTab }) {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('ref') && window.location.hash === '#register' && tab !== 'register') setTab('register');
  }, [tab, setTab]);
  const current = ['home', 'features', 'pricing', 'contact', 'login', 'register', 'forgot', 'privacy', 'terms'].includes(tab) ? tab : 'home';
  const goTab = (t) => { setTab(t); setMenu(false); window.scrollTo(0, 0); };

  const page = {
    home: <Home setTab={goTab} />,
    features: <FeaturesGrid />,
    pricing: <Pricing setTab={goTab} />,
    contact: <Contact />,
    login: <Login setTab={goTab} showToast={showToast} />,
    register: <Register setTab={goTab} showToast={showToast} />,
    forgot: <ForgotPassword setTab={goTab} showToast={showToast} />,
    privacy: <LegalDocuments type="privacy" onBack={goTab} />,
    terms: <LegalDocuments type="terms" onBack={goTab} />,
  }[current];

  return (
    <div className="min-h-dvh flex flex-col bg-ink-950">
      <header className="site-header sticky top-0 z-40 border-b border-white/[0.07] bg-ink-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => goTab('home')} aria-label="MEDIVEU ERP home"><BrandMark size="sm" /></button>
          <nav className="hidden md:flex items-center gap-1" aria-label="Website">
            {TABS.map((t) => (
              <button key={t} onClick={() => goTab(t)} aria-current={current === t ? 'page' : undefined}
                className={cn('px-3 py-2 rounded-lg text-sm font-medium capitalize', current === t ? 'text-white bg-white/[0.06]' : 'text-slate-400 hover:text-white')}>{t}</button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" onClick={() => goTab('login')}>Login</Button>
            <Button onClick={() => goTab('register')}>Free Trial</Button>
          </div>
          <button className="md:hidden p-2 text-slate-300" onClick={() => setMenu((m) => !m)} aria-label="Toggle menu" aria-expanded={menu}>{menu ? <X /> : <Menu />}</button>
        </div>
        {menu && (
          <div className="md:hidden border-t border-white/[0.07] px-4 py-3 space-y-1 bg-ink-900">
            {TABS.map((t) => <button key={t} onClick={() => goTab(t)} className="block w-full text-left px-3 py-2.5 rounded-lg text-slate-200 capitalize hover:bg-white/5">{t}</button>)}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="secondary" onClick={() => goTab('login')}>Login</Button>
              <Button onClick={() => goTab('register')}>Free Trial</Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{page}</main>
      <footer className="border-t border-white/[0.07] py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <BrandMark size="sm" />
          <span>&copy; {new Date().getFullYear()} MEDIVEU ERP. All rights reserved.</span>
          <nav aria-label="Legal information" className="flex gap-4">
            <button type="button" onClick={() => goTab('privacy')} className="hover:text-brand-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky rounded">Privacy Policy</button>
            <button type="button" onClick={() => goTab('terms')} className="hover:text-brand-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky rounded">Terms &amp; Conditions</button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
