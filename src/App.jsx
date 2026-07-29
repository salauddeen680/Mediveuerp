import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, CreditCard, Package, Users, Truck, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Search, Printer, 
  Download, Activity, CheckCircle, AlertTriangle, Shield, 
  Database, Check, ChevronRight, TrendingUp, Share2, Upload, 
  ShieldCheck, Clock, ArrowRight 
} from 'lucide-react';

import { auth, db } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// Aapke components import ho rahe hain
import BillingPOS from './components/BillingPOS';
import AdminPanel from './components/AdminPanel';
import Reports from './components/Reports';
import SubscriptionPlans from './components/SubscriptionPlans'; 

// --- UTILITY COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer";
  const variants = {
    primary: "bg-gradient-to-r from-teal-500 to-green-500 text-white hover:from-teal-600 hover:to-green-600 shadow-md",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = ({ label, className = '', ...props }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-sm text-slate-400">{label}</label>}
    <input 
      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition-colors"
      {...props} 
    />
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
      type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 
      type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' : 
      'bg-slate-800/90 border-slate-600 text-slate-100'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

// --- FOOTER COMPONENT ---
const Footer = () => (
  <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-sm text-slate-400 space-y-2 mt-auto">
    <p>© 2026 CCU Studios MEDIVEU ERP. All rights reserved.</p>
    <p>Need support or help with payments/subscriptions? Contact us at <a href="mailto:saifyt915@gmail.com" className="text-teal-400 hover:underline">saifyt915@gmail.com</a></p>
  </footer>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('public'); 
  const [currentPath, setCurrentPath] = useState('home');
  const [toast, setToast] = useState(null);

  const [medicines, setMedicines] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [settings, setSettings] = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  // 🔥 ADMIN ROUTING FIX
  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin' || window.location.pathname.includes('admin')) {
        setCurrentView('admin');
      }
    };
    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (authLoading) setAuthLoading(false); }, 3000);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      if (currentUser && currentView !== 'admin' && window.location.pathname !== '/admin' && window.location.hash !== '#admin') {
        setCurrentView('tenant');
        setCurrentPath('dashboard');
      }
      setAuthLoading(false);
    }, (error) => {
      clearTimeout(timer);
      setAuthLoading(false);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, [currentView]);

  useEffect(() => {
    if (!user || currentView !== 'tenant') return;
    const unsubs = [
      onSnapshot(collection(db, 'users', user.uid, 'medicines'), (snap) => setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'users', user.uid, 'bills'), (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'users', user.uid, 'customers'), (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'users', user.uid, 'suppliers'), (snap) => setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'users', user.uid, 'settings'), (snap) => {
        const settingsData = {};
        snap.docs.forEach(d => settingsData[d.id] = d.data());
        setSettings(settingsData);
      })
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, [user, currentView]);

  const navigate = (view, path) => {
    setCurrentView(view);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('public', 'home');
      showToast('Logged out successfully');
    } catch (err) {
      showToast('Error logging out', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-teal-400 gap-4">
        <Activity className="animate-spin" size={48} />
        <p className="text-slate-400 font-medium">Loading MEDIVEU ERP...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 flex flex-col justify-between">
      {currentView === 'public' && <PublicWebsite navigate={navigate} showToast={showToast} />}
      {currentView === 'tenant' && (
        <TenantDashboard 
          user={user} navigate={navigate} currentPath={currentPath} showToast={showToast} handleLogout={handleLogout}
          data={{ medicines, bills, customers, suppliers, settings }}
        />
      )}
      {currentView === 'admin' && (
        <AdminPanel navigate={navigate} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==========================================
// PUBLIC WEBSITE
// ==========================================
function PublicWebsite({ navigate, showToast }) {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView setActiveTab={setActiveTab} showToast={showToast} />;
      case 'features': return <FeaturesView />;
      case 'pricing': return <PricingView setActiveTab={setActiveTab} showToast={showToast} />;
      case 'contact': return <ContactView />;
      case 'login': return <LoginView navigate={navigate} showToast={showToast} setActiveTab={setActiveTab} />;
      case 'register': return <RegisterView navigate={navigate} showToast={showToast} setActiveTab={setActiveTab} />;
      default: return <HomeView setActiveTab={setActiveTab} showToast={showToast} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              <Plus size={24} />
            </div>
            <span className="text-2xl font-bold text-white">MEDIVEU <span className="text-teal-400">ERP</span></span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {['home', 'features', 'pricing', 'contact'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-medium capitalize cursor-pointer ${activeTab === tab ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}>
                {tab}
              </button>
            ))}
            <button onClick={() => setActiveTab('login')} className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer">Login</button>
            <Button onClick={() => setActiveTab('register')}>Start Free Trial</Button>
          </div>
        </div>
      </nav>
      <main className="flex-grow">{renderContent()}</main>
      <Footer />
    </div>
  );
}

const HomeView = ({ setActiveTab, showToast }) => (
  <>
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-20 text-center">
      <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
        Smart Wholesale Billing & ERP for <span className="text-teal-400">Medical Stores</span>
      </h1>
      <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10">
        Manage inventory with batch & expiry tracking, generate professional GST invoices, and grow your pharma business securely.
      </p>
      <div className="flex justify-center gap-4">
        <Button onClick={() => setActiveTab('register')} className="px-8 py-4 text-lg">Create Account / 7 Days Free Trial</Button>
      </div>
    </div>
    <FeaturesView />
    <PricingView setActiveTab={setActiveTab} showToast={showToast} />
  </>
);

const FeaturesView = () => (
  <div className="max-w-7xl mx-auto px-4 py-20 text-center text-white space-y-6">
    <h2 className="text-3xl font-bold">Complete Wholesale Pharma Features</h2>
    <p className="text-slate-400 max-w-2xl mx-auto">Multi-tenant secure architecture, lightning-fast POS billing, batch-wise inventory tracking, and complete customer history reports.</p>
  </div>
);

const PricingView = ({ setActiveTab, showToast }) => {
  const handleRazorpayCheckout = (planName, amount) => {
    showToast(`Redirecting to Razorpay secure checkout for ${planName} (₹${amount})...`);
    setTimeout(() => {
      setActiveTab('register');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 text-white">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold mb-4">Simple & Transparent Pricing</h2>
        <p className="text-slate-400">Choose the best plan for your medical store wholesale business.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-teal-500/50 flex flex-col justify-between">
          <div>
            <div className="text-teal-400 font-semibold mb-2">STARTER</div>
            <h3 className="text-2xl font-bold mb-4">7 Days Free Trial</h3>
            <div className="text-4xl font-black mb-6">₹0 <span className="text-sm font-normal text-slate-400">/ 7 days</span></div>
            <p className="text-slate-400 text-sm mb-6">Test all professional features with no restrictions.</p>
          </div>
          <Button onClick={() => setActiveTab('register')} className="w-full">Start Free Trial</Button>
        </Card>
        <Card className="border-blue-500/50 flex flex-col justify-between bg-slate-800/80">
          <div>
            <div className="text-blue-400 font-semibold mb-2">MONTHLY PROFESSIONAL</div>
            <h3 className="text-2xl font-bold mb-4">Monthly Plan</h3>
            <div className="text-4xl font-black mb-6">₹249 <span className="text-sm font-normal text-slate-400">/ month</span></div>
            <p className="text-slate-400 text-sm mb-6">Billed monthly via Razorpay. Full ERP access with updates.</p>
          </div>
          <Button onClick={() => handleRazorpayCheckout('Monthly Plan', 249)} className="w-full bg-blue-600 hover:bg-blue-700">Pay ₹249 via Razorpay</Button>
        </Card>
        <Card className="border-green-500/50 flex flex-col justify-between">
          <div>
            <div className="text-green-400 font-semibold mb-2">BEST VALUE (SAVE MORE)</div>
            <h3 className="text-2xl font-bold mb-4">Yearly Plan</h3>
            <div className="text-4xl font-black mb-6">₹2,799 <span className="text-sm font-normal text-slate-400">/ year</span></div>
            <p className="text-slate-400 text-sm mb-6">Billed annually via Razorpay. Dedicated priority support.</p>
          </div>
          <Button onClick={() => handleRazorpayCheckout('Yearly Plan', 2799)} className="w-full bg-green-600 hover:bg-green-700">Pay ₹2,799 via Razorpay</Button>
        </Card>
      </div>
    </div>
  );
};

const ContactView = () => (
  <div className="max-w-xl mx-auto py-24 px-4 text-white text-center space-y-4">
    <h2 className="text-3xl font-bold mb-4">Contact Support</h2>
    <p className="text-slate-400">If you face any issues with your subscription, billing, or software setup, reach out to us directly:</p>
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-teal-400 font-semibold">
      saifyt915@gmail.com
    </div>
  </div>
);

const LoginView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Store Login</h2>
        <form onSubmit={async e => { 
          e.preventDefault(); 
          try { 
            await signInWithEmailAndPassword(auth, email, password); 
            showToast('Logged in successfully!'); 
            navigate('tenant', 'dashboard'); 
          } catch(err){ 
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
              showToast('Invalid Email or Password!', 'error');
            } else {
              showToast(err.message.replace('Firebase:', ''), 'error'); 
            }
          } 
        }} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Login</Button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">New here? <button onClick={() => setActiveTab('register')} className="text-teal-400">Create Account</button></div>
      </Card>
    </div>
  );
};

const RegisterView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  
  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Create Store Account</h2>
        <form onSubmit={async e => { 
          e.preventDefault(); 
          try { 
            const res = await createUserWithEmailAndPassword(auth, email, password); 
            
            await setDoc(doc(db, 'users', res.user.uid), {
              email: email,
              status: 'Active',
              plan: '7 Days Free Trial',
              createdAt: Date.now()
            });

            await setDoc(doc(db, 'users', res.user.uid, 'settings', 'general'), { 
              storeName: storeName || 'Pharma Wholesale', 
              phone: '',
              address: '',
              gstin: '',
              dlNumber: ''
            }); 
            
            showToast('Account Created Successfully!'); 
            navigate('tenant', 'dashboard'); 
          } catch(err){ 
            if (err.code === 'auth/email-already-in-use') {
              showToast('This Email is already registered! Please Login.', 'error');
            } else if (err.code === 'auth/weak-password') {
              showToast('Password must be at least 6 characters.', 'error');
            } else {
              showToast(err.message.replace('Firebase:', ''), 'error'); 
            }
          } 
        }} className="space-y-4">
          <Input label="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Register & Start Trial</Button>
        </form>
      </Card>
    </div>
  );
};

// ==========================================
// TENANT DASHBOARD & VIEWS
// ==========================================
function TenantDashboard({ user, navigate, currentPath, showToast, handleLogout, data }) {
  const [billToEdit, setBillToEdit] = useState(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'billing', label: 'Billing / POS', icon: <CreditCard size={20} /> },
    { id: 'medicines', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'subscription', label: 'Upgrade Plan', icon: <Shield size={20} className="text-teal-400" /> }, 
    { id: 'settings', label: 'Settings & Backup', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard': return <TenantDashboardView data={data} navigate={navigate} />;
      case 'billing': return <BillingPOS data={data} showToast={showToast} user={user} editBill={billToEdit} setBillToEdit={setBillToEdit} />;
      case 'medicines': return <TenantMedicinesView data={data} showToast={showToast} user={user} />;
      case 'customers': return <TenantCustomersView data={data} />;
      
      case 'reports': return <Reports data={data} onOpenBill={(bill) => {
        setBillToEdit(bill);
        navigate('tenant', 'billing');
      }} />;
      
      case 'subscription': return <SubscriptionPlans user={user} showToast={showToast} navigate={navigate} />;
      
      case 'settings': return <TenantSettingsView data={data} showToast={showToast} user={user} />;
      default: return <TenantDashboardView data={data} navigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 px-4 border-b border-slate-800 flex items-center gap-2 font-bold text-white">
          <Plus className="text-teal-400" /> MEDIVEU ERP
        </div>
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                if (item.id === 'billing') setBillToEdit(null);
                navigate('tenant', item.id);
              }} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${currentPath === item.id ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 cursor-pointer mt-8">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Days Remaining Header Top Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs md:text-sm text-slate-300">
              Active Plan: <span className="text-white font-semibold ml-1">{data?.plan || '7 Days Free Trial'}</span>
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{renderContent()}</main>
        <Footer />
      </div>
    </div>
  );
}

// 🔥 SUBSCRIPTION TEMPLATE CARD (Dashboard ke theek upar dikhega)
function PlanStatusCard({ data, navigate }) {
  const userPlan = data?.plan || '7 Days Free Trial';
  const userStatus = data?.status || 'Active';
  
  const createdAtRaw = data?.createdAt || Date.now();
  const createdAt = typeof createdAtRaw === 'object' && createdAtRaw?.seconds 
    ? createdAtRaw.seconds * 1000 
    : createdAtRaw;

  let totalPlanDays = 7;
  const planString = String(userPlan).toLowerCase();

  if (planString.includes('7 days') || planString.includes('trial')) {
    totalPlanDays = 7;
  } else if (planString.includes('monthly') || planString.includes('249')) {
    totalPlanDays = 30;
  } else if (planString.includes('yearly') || planString.includes('2799')) {
    totalPlanDays = 365;
  } else if (planString.includes('lifetime')) {
    totalPlanDays = 36500;
  }

  const expiryTimestamp = createdAt + (totalPlanDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiryTimestamp - Date.now()) / (1000 * 60 * 60 * 24));
  const expiryDateString = new Date(expiryTimestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl mb-6 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            daysLeft <= 3 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
          }`}>
            {daysLeft <= 3 ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Current Active Subscription</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                userStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {userStatus}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">{userPlan}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Valid up to: <span className="text-slate-200 font-medium">{expiryDateString}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 ${
            daysLeft <= 3 
              ? 'bg-red-500/10 border-red-500/30 text-red-300' 
              : 'bg-slate-950/60 border-slate-700/60 text-slate-200'
          }`}>
            <Clock size={20} className={daysLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-teal-400'} />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Time Status</div>
              <div className="text-sm font-extrabold">
                {daysLeft > 0 ? `${daysLeft} Days Remaining` : 'Plan Expired!'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate && navigate('tenant', 'subscription')}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            Upgrade Plan <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TenantDashboardView({ data, navigate }) {
  const { medicines, bills } = data;
  
  const totalSales = bills.reduce((acc, b) => {
    const amount = b.totals?.grandTotal || b.total || 0;
    return acc + Number(amount);
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 🔥 Dashboard Overview ke theek upar Subscription Card */}
      <PlanStatusCard data={data} navigate={navigate} />

      <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card><div className="text-slate-400 text-sm">Total Revenue</div><div className="text-3xl font-bold text-green-400 mt-1">₹{totalSales.toFixed(2)}</div></Card>
        <Card><div className="text-slate-400 text-sm">Total Invoices</div><div className="text-3xl font-bold text-blue-400 mt-1">{bills.length}</div></Card>
        <Card><div className="text-slate-400 text-sm">Total Medicines</div><div className="text-3xl font-bold text-teal-400 mt-1">{medicines.length}</div></Card>
      </div>
    </div>
  );
}

function TenantMedicinesView({ data, showToast, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', batch: 'B101', expiry: '12/26', hsn: '3004', stock: 50, mrp: 100, gst: 12 });
  const handleSave = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'users', user.uid, 'medicines'), form);
    showToast('Medicine added successfully!');
    setIsModalOpen(false);
  };
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-white">Inventory Management</h1><Button onClick={() => setIsModalOpen(true)}>Add Medicine</Button></div>
      <Card className="p-0 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Name</th><th className="p-3">Batch</th><th className="p-3">Expiry</th><th className="p-3">Stock</th><th className="p-3">MRP</th></tr></thead><tbody>{data.medicines.map(m => <tr key={m.id} className="border-b border-slate-800"><td className="p-3 text-white font-medium">{m.name}</td><td className="p-3">{m.batch}</td><td className="p-3">{m.expiry}</td><td className="p-3">{m.stock}</td><td className="p-3">₹{m.mrp}</td></tr>)}</tbody></table></Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Medicine"><form onSubmit={handleSave} className="space-y-4"><Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /><Input label="Batch" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} required /><Input label="Expiry (MM/YY)" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} required /><Input label="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} required /><Input label="MRP" type="number" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})} required /><Button type="submit">Save</Button></form></Modal>
    </div>
  );
}

function TenantCustomersView({ data }) {
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Customers Directory</h1>
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400">
            <tr><th className="p-3">Customer Name</th><th className="p-3">GSTIN</th><th className="p-3 text-right">Total Purchases</th></tr>
          </thead>
          <tbody>
            {data.bills.map((b, i) => (
              <tr key={i} className="border-b border-slate-800">
                <td className="p-3 text-white font-medium">{b.customerName}</td>
                <td className="p-3 text-slate-300">{b.customerGstin || 'N/A'}</td>
                <td className="p-3 text-right text-teal-400">₹{Number(b.total).toFixed(2)}</td>
              </tr>
            ))}
            {data.bills.length === 0 && (
              <tr><td colSpan="3" className="text-center py-8 text-slate-500">No customer bills recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TenantSettingsView({ data, showToast, user }) {
  const [formData, setFormData] = useState({
    storeName: data.settings?.general?.storeName || 'PHARMA WHOLESALE',
    address: data.settings?.general?.address || '',
    phone: data.settings?.general?.phone || '',
    gstin: data.settings?.general?.gstin || '',
    dlNumber: data.settings?.general?.dlNumber || ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'general');
      await setDoc(docRef, formData, { merge: true });
      showToast('Store settings saved successfully!');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      settings: data.settings,
      medicines: data.medicines,
      bills: data.bills,
      customers: data.customers,
      suppliers: data.suppliers,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mediveu_erp_backup_${user.uid.slice(0,6)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup exported successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Store Settings & Backup</h1>
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Store Name" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} required />
          <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Input label="GSTIN" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
          <Input label="Drug License Number" value={formData.dlNumber} onChange={e => setFormData({...formData, dlNumber: e.target.value})} />
          <div className="flex justify-end pt-4"><Button type="submit">Save Settings</Button></div>
        </form>
      </Card>

      <Card className="border-teal-500/30">
        <h3 className="text-xl font-bold text-white mb-2">Data Backup & Export</h3>
        <p className="text-slate-400 text-sm mb-4">Download a complete JSON backup of your store inventory, bills, customers, and settings for safe keeping.</p>
        <Button onClick={handleExportBackup} variant="secondary" className="gap-2">
          <Download size={18} /> Download Store Backup (.json)
        </Button>
      </Card>
    </div>
  );
}
