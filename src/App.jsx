import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, CreditCard, Package, Users, Truck, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Search, Printer, 
  Download, Activity, CheckCircle, AlertTriangle, Play, Shield, 
  Database, UserCheck, Phone, Mail, MapPin, Check, ChevronRight,
  TrendingUp, Box, ShoppingCart, Share2
} from 'lucide-react';

import { auth, db } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

import { renderMargInvoice } from './utils/invoiceTemplate';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
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

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('public'); 
  const [currentPath, setCurrentPath] = useState('home');
  const [toast, setToast] = useState(null);

  // Global Data States
  const [medicines, setMedicines] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [settings, setSettings] = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) setAuthLoading(false); 
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      if (currentUser) {
        setCurrentView('tenant');
        setCurrentPath('dashboard');
      }
      setAuthLoading(false);
    }, (error) => {
      clearTimeout(timer);
      console.error("Auth error:", error);
      setAuthLoading(false);
    });
    
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || currentView !== 'tenant') return;

    const unsubs = [
      onSnapshot(collection(db, 'users', user.uid, 'medicines'), 
        (snap) => setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Meds Sync Error:", err)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'bills'), 
        (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Bills Sync Error:", err)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'customers'), 
        (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Customers Sync Error:", err)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'suppliers'), 
        (snap) => setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Suppliers Sync Error:", err)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'settings'), 
        (snap) => {
          const settingsData = {};
          snap.docs.forEach(d => settingsData[d.id] = d.data());
          setSettings(settingsData);
        },
        (err) => console.error("Settings Sync Error:", err)
      )
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
      {currentView === 'public' && <PublicWebsite navigate={navigate} showToast={showToast} />}
      {currentView === 'tenant' && (
        <TenantDashboard 
          user={user} navigate={navigate} currentPath={currentPath} showToast={showToast} handleLogout={handleLogout}
          data={{ medicines, bills, customers, suppliers, settings }}
        />
      )}
      {currentView === 'admin' && (
        <SuperAdminPanel user={user} navigate={navigate} currentPath={currentPath} showToast={showToast} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==========================================
// 1. PUBLIC WEBSITE & AUTH VIEWS
// ==========================================

function PublicWebsite({ navigate, showToast }) {
  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView setActiveTab={setActiveTab} />;
      case 'features': return <FeaturesView />;
      case 'pricing': return <PricingView />;
      case 'contact': return <ContactView />;
      case 'login': return <LoginView navigate={navigate} showToast={showToast} setActiveTab={setActiveTab} />;
      case 'register': return <RegisterView navigate={navigate} showToast={showToast} setActiveTab={setActiveTab} />;
      case 'admin-login': return <AdminLoginView navigate={navigate} />;
      default: return <HomeView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-500/20">
                <Plus size={24} />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                MEDIVEU <span className="text-teal-400">ERP</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map(link => (
                <button 
                  key={link.id} 
                  onClick={() => setActiveTab(link.id)}
                  className={`text-sm font-medium transition-colors cursor-pointer ${activeTab === link.id ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}
                >
                  {link.label}
                </button>
              ))}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-800">
                <button onClick={() => setActiveTab('login')} className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer">Login</button>
                <Button onClick={() => setActiveTab('register')}>Start Free Trial</Button>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white cursor-pointer">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map(link => (
              <button 
                key={link.id} 
                onClick={() => { setActiveTab(link.id); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
             <button onClick={() => { setActiveTab('login'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-teal-400 hover:bg-slate-800 cursor-pointer">Login</button>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {renderContent()}
      </main>
    </div>
  );
}

const HomeView = ({ setActiveTab }) => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center relative z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-sm font-medium mb-8 border border-teal-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
        </span>
        Pharma ERP V2.0 Live
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
        Smart Wholesale Billing & ERP for <br className="hidden md:block"/>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-green-500">
          Medical Stores
        </span>
      </h1>
      <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
        Manage inventory with batch & expiry tracking, generate professional GST invoices, and grow your pharma business with MEDIVEU cloud platform.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button onClick={() => setActiveTab('register')} className="w-full sm:w-auto px-8 py-4 text-lg">
          Create Account / Free Trial
        </Button>
        <Button variant="secondary" onClick={() => setActiveTab('features')} className="w-full sm:w-auto px-8 py-4 text-lg">
          View Features <ChevronRight size={20} className="ml-1" />
        </Button>
      </div>
    </div>
  </div>
);

const FeaturesView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Complete Wholesale Pharma Features</h2>
      <p className="text-slate-400 text-lg">Engineered specifically for medical stores, distributors, and pharmacies.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { icon: <FileText size={32} />, title: "Wholesale GST Invoicing", desc: "Professional Marg/Wholesale style bills with HSN/SAC, Batch, Expiry, SGST, CGST & IGST breakdown." },
        { icon: <Package size={32} />, title: "Batch & Expiry Control", desc: "Track batch numbers, expiry dates, and automated low stock alerts instantly." },
        { icon: <Printer size={32} />, title: "Print, PDF & Share", desc: "Download PDF copies instantly, direct thermal/A4 print support, and WhatsApp bill sharing." },
        { icon: <Activity size={32} />, title: "Advanced Financial Reports", desc: "Daily sales tracking, total revenue reports, and automated GST liability calculations." },
        { icon: <Users size={32} />, title: "Customer & Party CRM", desc: "Maintain records of buyers, outstanding credit balances, and transaction history." },
        { icon: <Database size={32} />, title: "Secure Cloud Database", desc: "Real-time sync across devices with enterprise-grade Firebase security." },
      ].map((feature, i) => (
        <Card key={i} className="hover:bg-slate-800 transition-colors group">
          <div className="w-14 h-14 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {feature.icon}
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
          <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
        </Card>
      ))}
    </div>
  </div>
);

const PricingView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Transparent Pricing Plans</h2>
      <p className="text-slate-400 text-lg">Scale your store with powerful features.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <Card className="relative border-slate-700">
        <h3 className="text-2xl font-semibold text-white mb-2">Monthly Plan</h3>
        <div className="mb-8 flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-bold text-white">₹249</span>
          <span className="text-slate-400">/month</span>
        </div>
        <ul className="space-y-4 mb-8">
          {['Unlimited GST Bills', 'Batch & Expiry Management', 'PDF & Print Support', 'Cloud Sync'].map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-300">
              <Check size={18} className="text-teal-400" /> {f}
            </li>
          ))}
        </ul>
        <Button className="w-full">Get Started</Button>
      </Card>
      <Card className="relative border-teal-500 shadow-2xl shadow-teal-500/10">
        <div className="absolute top-0 right-8 transform -translate-y-1/2">
          <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Best Value</span>
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">Yearly Plan</h3>
        <div className="mb-8 flex items-baseline gap-2 mt-4">
          <span className="text-5xl font-bold text-white">₹2999</span>
          <span className="text-slate-400">/year</span>
        </div>
        <ul className="space-y-4 mb-8">
          {['Everything in Monthly', 'Advanced Analytics & GST Reports', 'Priority Support', 'Custom Branding'].map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-300">
              <Check size={18} className="text-teal-400" /> {f}
            </li>
          ))}
        </ul>
        <Button className="w-full">Get Started</Button>
      </Card>
    </div>
  </div>
);

const ContactView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div className="max-w-3xl mx-auto text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Contact Support</h2>
      <p className="text-slate-400 text-lg">We are here to assist your pharmacy business 24/7.</p>
    </div>
    <div className="max-w-xl mx-auto">
      <Card>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}>
          <Input label="Your Name" placeholder="Rajesh Kumar" required />
          <Input label="Email or Phone" placeholder="support@pharmacy.com" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-400">Message</label>
            <textarea className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition-colors h-32 resize-none" placeholder="Describe your query..." required></textarea>
          </div>
          <Button className="w-full">Submit Query</Button>
        </form>
      </Card>
    </div>
  </div>
);

const LoginView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('Logged in successfully!');
      navigate('tenant', 'dashboard');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Store Login</h2>
          <p className="text-slate-400">Access your MEDIVEU ERP Account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input label="Email Address" type="email" placeholder="admin@mystore.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account? <button onClick={() => setActiveTab('register')} className="text-teal-400 hover:underline cursor-pointer font-medium">Create Account</button>
        </div>
      </Card>
    </div>
  );
};

const RegisterView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid, 'settings', 'general'), {
        storeName: storeName || 'Pharma Wholesale',
        address: '13-2-47, Opp Gowdiyamatam, Behind Football Ground, Bacheli',
        phone: '9999955559',
        gstin: '07CTMPM699K1ZJ',
        dlNumber: 'DL11WW-6985'
      });

      showToast('Account created successfully!');
      navigate('tenant', 'dashboard');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-400">Setup your Pharmacy ERP instance.</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-6">
          <Input label="Store Name" placeholder="Pharma Wholesale" value={storeName} onChange={e => setStoreName(e.target.value)} required />
          <Input label="Email Address" type="email" placeholder="admin@mystore.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password (Min 6 chars)" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register & Start'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <button onClick={() => setActiveTab('login')} className="text-teal-400 hover:underline cursor-pointer font-medium">Login</button>
        </div>
      </Card>
    </div>
  );
};

const AdminLoginView = ({ navigate }) => {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (pwd === 'admin123') navigate('admin', 'dashboard');
    else setError(true);
  };

  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <Card className="border-red-500/30">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <Shield size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Super Admin Console</h2>
          <p className="text-slate-400">Restricted Access Only</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input label="Admin Password" type="password" value={pwd} onChange={e => {setPwd(e.target.value); setError(false)}} required />
          {error && <p className="text-red-400 text-sm text-center">Invalid credentials (hint: admin123)</p>}
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Access Console</Button>
        </form>
      </Card>
    </div>
  );
};

// ==========================================
// 2. TENANT DASHBOARD (User App)
// ==========================================

function TenantDashboard({ user, navigate, currentPath, showToast, handleLogout, data }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'billing', label: 'Billing / POS', icon: <CreditCard size={20} /> },
    { id: 'medicines', label: 'Inventory (Medicines)', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Store Settings', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard': return <TenantDashboardView data={data} />;
      case 'billing': return <TenantBillingView data={data} showToast={showToast} user={user} />;
      case 'medicines': return <TenantMedicinesView data={data} showToast={showToast} user={user} />;
      case 'customers': return <TenantCustomersView data={data} />;
      case 'suppliers': return <TenantSuppliersView />;
      case 'reports': return <TenantReportsView data={data} />;
      case 'settings': return <TenantSettingsView data={data} showToast={showToast} user={user} />;
      default: return <TenantDashboardView data={data} />;
    }
  };

  const storeName = data.settings?.general?.storeName || "Pharma Wholesale";

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="text-teal-400" size={24} />
            <span className="font-bold text-lg text-white truncate">MEDIVEU ERP</span>
          </div>
          <button className="md:hidden text-slate-400 cursor-pointer" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { navigate('tenant', item.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPath === item.id ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="pt-8">
             <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <button className="md:hidden text-slate-400 p-2 cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="hidden md:flex items-center text-slate-300">
            <span className="capitalize font-medium">{currentPath.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">{user?.email || 'Store User'}</div>
              <div className="text-xs text-teal-400">MEDIVEU Active ERP License</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-green-500 flex items-center justify-center text-white font-bold uppercase">
              {storeName.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function TenantDashboardView({ data }) {
  const { medicines, bills, customers } = data;
  const today = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter(b => b.date === today);
  const todaySales = todayBills.reduce((acc, bill) => acc + (Number(bill.total) || 0), 0);
  const lowStock = medicines.filter(m => Number(m.stock) < 10).length;
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Sales" value={`₹${todaySales.toFixed(2)}`} icon={<TrendingUp size={24} />} color="text-green-400" bg="bg-green-500/10" />
        <StatCard title="Total Bills (Today)" value={todayBills.length} icon={<FileText size={24} />} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard title="Low Stock Items" value={lowStock} icon={<AlertTriangle size={24} />} color="text-orange-400" bg="bg-orange-500/10" />
        <StatCard title="Total Customers" value={customers.length} icon={<Users size={24} />} color="text-teal-400" bg="bg-teal-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Invoices</h3>
          {bills.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No bills generated yet. Go to Billing to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Bill No</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.sort((a,b) => b.createdAt - a.createdAt).slice(0, 5).map(b => (
                    <tr key={b.id} className="border-b border-slate-800">
                      <td className="px-4 py-3 font-medium text-white">{b.billNo}</td>
                      <td className="px-4 py-3 text-slate-300">{b.customerName || 'Walk-in'}</td>
                      <td className="px-4 py-3 text-right text-teal-400">₹{Number(b.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Stock Alerts</h3>
          {medicines.filter(m => Number(m.stock) < 10).length === 0 ? (
             <div className="text-center py-8 text-slate-500 flex flex-col items-center">
               <CheckCircle size={32} className="text-green-500/50 mb-2" />
               All stock levels are optimal.
             </div>
          ) : (
            <div className="space-y-3">
              {medicines.filter(m => Number(m.stock) < 10).slice(0,5).map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <div>
                    <div className="font-medium text-red-200">{m.name}</div>
                    <div className="text-xs text-red-400/70">Batch: {m.batch} | Exp: {m.expiry}</div>
                  </div>
                  <div className="text-red-400 font-bold">
                    {m.stock} left
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }) {
  return (
    <Card className="flex items-center p-6 gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-slate-400 text-sm font-medium">{title}</div>
        <div className="text-2xl font-bold text-white mt-1">{value}</div>
      </div>
    </Card>
  );
}

// ==========================================
// 3. PROFESSIONAL MARG-STYLE BILLING VIEW
// ==========================================

function TenantBillingView({ data, showToast, user }) {
  const { medicines, bills, settings } = data;
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('M/s GUPTA STORE');
  const [customerAddress, setCustomerAddress] = useState('SHOP NO.2, KAROL BAGH, DELHI - 110006');
  const [customerGstin, setCustomerGstin] = useState('07CTMPM8957K1ZU');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const storeSettings = settings?.general || {
    storeName: 'PHARMA WHOLESALE',
    address: '13-2-47, OPP GOWDIPAMATAM, BACHELI',
    phone: '9999955559',
    gstin: '07CTMPM699K1ZJ',
    dlNumber: 'DL11WW-6985'
  };

  const filteredMeds = searchTerm 
    ? medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.barcode === searchTerm)
    : [];

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.qty >= med.stock) {
        showToast(`Only ${med.stock} in stock!`, 'error');
        return;
      }
      setCart(cart.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      if (med.stock < 1) {
        showToast('Out of stock!', 'error');
        return;
      }
      setCart([...cart, { 
        ...med, 
        qty: 1, 
        originalPrice: Number(med.mrp) || 100,
        hsn: med.hsn || '3004',
        batch: med.batch || 'B-101',
        expiry: med.expiry || '12/26',
        gst: Number(med.gst) || 12,
        pack: '10T'
      }]);
    }
    setSearchTerm('');
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    const med = medicines.find(m => m.id === id);
    if (med && newQty > med.stock) {
       showToast(`Only ${med.stock} in stock!`, 'error');
       return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const subtotal = cart.reduce((acc, item) => acc + (item.qty * item.originalPrice), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxableTotal = subtotal - discountAmount;
  
  let totalSgst = 0;
  let totalCgst = 0;
  cart.forEach(item => {
     const itemNet = (item.qty * item.originalPrice) * (1 - discountPercent/100);
     const gstRate = Number(item.gst) || 12;
     const taxAmt = itemNet * (gstRate / 100);
     totalSgst += taxAmt / 2;
     totalCgst += taxAmt / 2;
  });

  const finalTotal = taxableTotal + totalSgst + totalCgst;

  const handleGenerateBill = async () => {
    if (cart.length === 0) return showToast('Cart is empty', 'error');
    if (!user) return showToast('Please authenticate first', 'error');
    setIsProcessing(true);

    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const billCount = bills.length + 1;
      const billNo = `A0000${billCount}`;

      const billData = {
        billNo,
        date: dateStr,
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
        customerName: customerName || 'M/s GUPTA STORE',
        customerAddress,
        customerGstin,
        customerPhone,
        items: cart,
        subtotal,
        discountPercent,
        discountAmount,
        taxableTotal,
        totalSgst,
        totalCgst,
        total: finalTotal,
        storeInfo: storeSettings,
        status: 'PAID'
      };

      await addDoc(collection(db, 'users', user.uid, 'bills'), billData);

      for (const item of cart) {
        if(item.id) {
          const medRef = doc(db, 'users', user.uid, 'medicines', item.id);
          const newStock = Number(item.stock || 0) - item.qty;
          await updateDoc(medRef, { stock: newStock });
        }
      }

      showToast('Invoice generated successfully!');
      setActiveInvoice(billData);
      setCart([]);
    } catch (error) {
      console.error(error);
      showToast('Failed to generate invoice', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice *${activeInvoice?.billNo}* from *${storeSettings.storeName}* (MEDIVEU ERP). Total Amount: ₹${activeInvoice?.total.toFixed(2)}. Thank you!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        <Card className="p-4 flex-shrink-0 relative overflow-visible z-20">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search medicine by name or barcode..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50">
              {filteredMeds.length > 0 ? (
                filteredMeds.map(med => (
                  <div 
                    key={med.id} 
                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 flex justify-between items-center"
                    onClick={() => addToCart(med)}
                  >
                    <div>
                      <div className="font-medium text-white">{med.name}</div>
                      <div className="text-xs text-slate-400">Batch: {med.batch} | Exp: {med.expiry}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-400 font-bold">₹{med.mrp}</div>
                      <div className={`text-xs ${med.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{med.stock} in stock</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-slate-400 text-center">No medicines found. Add them in Inventory first.</div>
              )}
            </div>
          )}
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Current Invoice Items</h3>
            <span className="text-sm text-slate-400">{cart.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Batch/Exp</th>
                  <th className="px-4 py-3 w-24">Qty</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-slate-500">Cart is empty. Search items above to add.</td></tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-xs text-slate-500">HSN: {item.hsn}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300">
                        <div>{item.batch}</div>
                        <div className="text-slate-500">{item.expiry}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 cursor-pointer">-</button>
                          <span className="w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 cursor-pointer">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{item.originalPrice}</td>
                      <td className="px-4 py-3 text-right font-medium text-teal-400">₹{(item.qty * item.originalPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 cursor-pointer"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="w-full md:w-80 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        <h3 className="font-semibold text-white border-b border-slate-700 pb-3 mb-4">Buyer Details</h3>
        <div className="space-y-3 mb-6">
          <Input label="Party Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <Input label="Party GSTIN" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} />
          <Input label="Party Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
        </div>

        <h3 className="font-semibold text-white border-b border-slate-700 pb-3 mb-4 mt-auto">Invoice Totals</h3>
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Discount (%)</span>
            <input 
              type="number" 
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white" 
              value={discountPercent} 
              onChange={e => setDiscountPercent(Number(e.target.value))}
              min="0" max="100"
            />
          </div>
          <div className="flex justify-between text-slate-400 text-xs">
            <span>SGST / CGST</span>
            <span>₹{totalSgst.toFixed(2)} / ₹{totalCgst.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-lg text-white">
            <span>Grand Total</span>
            <span className="text-teal-400">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            className="w-full py-3 font-bold" 
            onClick={handleGenerateBill} 
            disabled={cart.length === 0 || isProcessing}
          >
            {isProcessing ? 'Generating...' : 'Save & Generate Bill'}
          </Button>

          {activeInvoice && (
            <Button variant="secondary" className="w-full py-2.5" onClick={() => setActiveInvoice(activeInvoice)}>
              <FileText size={16} /> View Last Invoice
            </Button>
          )}
        </div>
      </Card>

      {activeInvoice && (
        <Modal isOpen={!!activeInvoice} onClose={() => setActiveInvoice(null)} title="Professional Marg-Style Wholesale Invoice">
           {renderMargInvoice(activeInvoice, handlePrint, handleShareWhatsApp)}
        </Modal>
      )}
    </div>
  );
}

function TenantMedicinesView({ data, showToast, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', genericName: '', barcode: '', batch: '', expiry: '', hsn: '3004',
    stock: 0, purchasePrice: 0, mrp: 0, gst: 12
  });

  const handleOpen = (med = null) => {
    if (med) {
      setEditingId(med.id);
      setFormData(med);
    } else {
      setEditingId(null);
      setFormData({ name: '', genericName: '', barcode: '', batch: '', expiry: '', hsn: '3004', stock: 0, purchasePrice: 0, mrp: 0, gst: 12 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return showToast('Please authenticate first', 'error');
    try {
      const colRef = collection(db, 'users', user.uid, 'medicines');
      if (editingId) {
        await updateDoc(doc(colRef, editingId), { ...formData, updatedAt: serverTimestamp() });
        showToast('Medicine updated!');
      } else {
        await addDoc(colRef, { ...formData, createdAt: serverTimestamp() });
        showToast('Medicine added!');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast('Error saving data', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'medicines', id));
      showToast('Medicine deleted');
    }
  };

  const filteredData = data.medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <Button onClick={() => handleOpen()}><Plus size={18} /> Add Medicine</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
           <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search medicines..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900">
              <tr>
                <th className="px-6 py-4">Medicine Name</th>
                <th className="px-6 py-4">Batch / Exp</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">MRP</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No medicines found. Click Add Medicine.</td></tr>
              ) : (
                filteredData.map(med => (
                  <tr key={med.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{med.name}</div>
                      <div className="text-xs text-slate-500">HSN: {med.hsn}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{med.batch}</div>
                      <div className="text-xs text-slate-400">Exp: {med.expiry}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${med.stock > 10 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {med.stock} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">₹{med.mrp}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpen(med)} className="text-teal-400 hover:text-teal-300 mx-2 cursor-pointer"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(med.id)} className="text-red-400 hover:text-red-300 cursor-pointer"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Medicine" : "Add Medicine"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Medicine Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <Input label="HSN Code" value={formData.hsn} onChange={e => setFormData({...formData, hsn: e.target.value})} />
            <Input label="Batch Number" required value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
            <Input label="Expiry Date (MM/YY)" required value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} />
            <Input label="Stock Quantity" type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
            <Input label="MRP (₹)" type="number" step="0.01" required value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} />
            <Input label="GST (%)" type="number" required value={formData.gst} onChange={e => setFormData({...formData, gst: Number(e.target.value)})} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Medicine</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TenantCustomersView({ data }) {
   return (
    <div className="max-w-7xl mx-auto space-y-4">
       <h1 className="text-2xl font-bold text-white">Customers Directory</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">GSTIN</th>
                <th className="px-6 py-4">Total Purchases</th>
              </tr>
            </thead>
            <tbody>
              {data.bills.map((b, i) => (
                 <tr key={i} className="border-b border-slate-800">
                    <td className="px-6 py-4 font-medium text-white">{b.customerName}</td>
                    <td className="px-6 py-4 text-slate-300">{b.customerGstin || 'N/A'}</td>
                    <td className="px-6 py-4 text-teal-400">₹{Number(b.total).toFixed(2)}</td>
                 </tr>
              ))}
              {data.bills.length === 0 && (
                <tr><td colSpan="3" className="text-center py-8 text-slate-500">No customer bills recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
   );
}

function TenantSuppliersView() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 text-center py-20">
      <Truck size={48} className="mx-auto text-slate-600 mb-4" />
      <h1 className="text-2xl font-bold text-white">Supplier Management</h1>
      <p className="text-slate-400 max-w-md mx-auto">Manage your wholesale distributors and purchase orders.</p>
    </div>
  );
}

function TenantReportsView({ data }) {
  const { bills } = data;
  const totalSales = bills.reduce((sum, b) => sum + Number(b.total), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-teal-500">
          <h3 className="text-slate-400 text-sm">Total Revenue</h3>
          <div className="text-3xl font-bold text-white mt-2">₹{totalSales.toFixed(2)}</div>
        </Card>
        <Card className="border-t-4 border-t-blue-500">
          <h3 className="text-slate-400 text-sm">Total Invoices Generated</h3>
          <div className="text-3xl font-bold text-white mt-2">{bills.length}</div>
        </Card>
      </div>
    </div>
  );
}

function TenantSettingsView({ data, showToast, user }) {
  const [formData, setFormData] = useState({
    storeName: data.settings?.general?.storeName || 'PHARMA WHOLESALE',
    address: data.settings?.general?.address || '13-2-47, OPP GOWDIPAMATAM, BACHELI',
    phone: data.settings?.general?.phone || '9999955559',
    gstin: data.settings?.general?.gstin || '07CTMPM699K1ZJ',
    dlNumber: data.settings?.general?.dlNumber || 'DL11WW-6985'
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Store Branding & Settings</h1>
      
      <Card>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Invoice Header Branding</h3>
            <Input label="Store Name" required value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
            <Input label="Complete Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <Input label="Contact Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Tax & License Numbers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="GSTIN Number" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              <Input label="Drug License (DL) Number" value={formData.dlNumber} onChange={e => setFormData({...formData, dlNumber: e.target.value})} />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function SuperAdminPanel({ user, navigate }) {
  return (
    <div className="flex h-screen bg-black overflow-hidden text-slate-300">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-red-500 font-bold text-lg gap-2">
          <Shield /> Super Admin
        </div>
        <div className="p-4 border-t border-slate-800 mt-auto">
          <button onClick={() => navigate('public', 'home')} className="flex items-center gap-2 text-slate-500 hover:text-white cursor-pointer">
            <LogOut size={18} /> Exit Admin
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-6">System Dashboard</h1>
        <Card className="bg-slate-900">
          <p className="text-slate-400">Super admin controls active. All tenant databases are online.</p>
        </Card>
      </main>
    </div>
  );
}

