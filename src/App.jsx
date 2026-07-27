import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, X, Home, CreditCard, Package, Users, Truck, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Search, Printer, 
  Download, Activity, CheckCircle, AlertTriangle, Play, Shield, 
  Database, UserCheck, Phone, Mail, MapPin, Check, ChevronRight,
  TrendingUp, Box, ShoppingCart
} from 'lucide-react';
import { 
  initializeApp 
} from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, setDoc, getDocs, onSnapshot, 
  deleteDoc, updateDoc, addDoc, serverTimestamp 
} from 'firebase/firestore';

// --- SAFE FIREBASE INITIALIZATION ---
let fConfig = { apiKey: "dummy-key", projectId: "dummy-project", appId: "123" };
try {
  if (typeof __firebase_config !== 'undefined') {
    fConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  }
} catch (e) {
  console.error("Error parsing firebase config:", e);
}

const app = initializeApp(fConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mediveu-erp';

// --- UTILITY COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
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
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
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
  const [authError, setAuthError] = useState(null);
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

  // Initialize Auth Safely
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        setAuthError(error.message);
        setAuthLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || currentView !== 'tenant') return;

    const unsubs = [
      onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'medicines'), 
        (snap) => setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Meds Sync Error:", err)
      ),
      onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'bills'), 
        (snap) => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Bills Sync Error:", err)
      ),
      onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'customers'), 
        (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Customers Sync Error:", err)
      ),
      onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'suppliers'), 
        (snap) => setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Suppliers Sync Error:", err)
      ),
      onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'settings'), 
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-teal-400 gap-4">
        <Activity className="animate-spin" size={48} />
        <p className="text-slate-400 font-medium">Connecting to MEDIVEU Cloud...</p>
      </div>
    );
  }

  if (authError) {
     return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 max-w-md text-center">
           <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
           <p className="text-slate-400 text-sm mb-6">Unable to connect to authentication servers. If you are in a preview environment, check if API keys are fully loaded.</p>
           <p className="text-xs text-red-400/80 p-3 bg-black/30 rounded">{authError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
      {currentView === 'public' && <PublicWebsite navigate={navigate} />}
      {currentView === 'tenant' && (
        <TenantDashboard 
          user={user} navigate={navigate} currentPath={currentPath} showToast={showToast}
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
// 1. PUBLIC WEBSITE
// ==========================================

function PublicWebsite({ navigate }) {
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
      case 'login': return <LoginView navigate={navigate} />;
      case 'register': return <RegisterView navigate={navigate} />;
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
                  className={`text-sm font-medium transition-colors ${activeTab === link.id ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}
                >
                  {link.label}
                </button>
              ))}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-800">
                <button onClick={() => setActiveTab('login')} className="text-sm font-medium text-slate-300 hover:text-white">Login</button>
                <Button onClick={() => setActiveTab('register')}>Start Free Trial</Button>
              </div>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white">
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
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {link.label}
              </button>
            ))}
             <button onClick={() => { setActiveTab('login'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-teal-400 hover:bg-slate-800">Login</button>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {renderContent()}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="text-teal-400" size={24} />
                <span className="text-xl font-bold text-white">MEDIVEU ERP</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Complete Medical Store ERP & Smart Billing System. Designed for pharmacies, clinics, and medical distributors.
              </p>
              <button onClick={() => setActiveTab('admin-login')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Super Admin Login
              </button>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => setActiveTab('features')} className="hover:text-teal-400">Features</button></li>
                <li><button onClick={() => setActiveTab('pricing')} className="hover:text-teal-400">Pricing</button></li>
                <li><a href="#" className="hover:text-teal-400">Download App</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => setActiveTab('contact')} className="hover:text-teal-400">Contact Us</button></li>
                <li><a href="#" className="hover:text-teal-400">FAQ</a></li>
                <li><a href="#" className="hover:text-teal-400">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-teal-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-teal-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-teal-400">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} MEDIVEU ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const HomeView = ({ setActiveTab }) => (
  <div>
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-sm font-medium mb-8 border border-teal-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          SaaS V2.0 is Live
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
          Smart Billing & ERP for <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-green-500">
            Medical Stores
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Manage inventory, generate GST bills, track expiry dates, and grow your pharmacy business with MEDIVEU's intelligent cloud-based platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => setActiveTab('register')} className="w-full sm:w-auto px-8 py-4 text-lg">
            Start 7-Day Free Trial
          </Button>
          <Button variant="secondary" onClick={() => setActiveTab('features')} className="w-full sm:w-auto px-8 py-4 text-lg">
            View Features <ChevronRight size={20} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const FeaturesView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Everything you need to run your store</h2>
      <p className="text-slate-400 text-lg">Powerful features designed specifically for the healthcare retail industry.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { icon: <FileText size={32} />, title: "Smart Billing (POS)", desc: "Lightning fast billing with barcode scanning, GST calculation, and custom discounts." },
        { icon: <Package size={32} />, title: "Inventory Management", desc: "Track stock levels, set reorder points, and manage multiple batches effortlessly." },
        { icon: <AlertTriangle size={32} />, title: "Expiry Alerts", desc: "Never lose money on expired medicine again. Get automated alerts before stock expires." },
        { icon: <Activity size={32} />, title: "Advanced Reports", desc: "Generate daily sales, GST, profit, and inventory reports with one click." },
        { icon: <Users size={32} />, title: "Customer CRM", desc: "Track customer purchase history, manage outstanding balances, and send WhatsApp bills." },
        { icon: <Database size={32} />, title: "Cloud Backup", desc: "Your data is automatically backed up securely to the cloud. Never lose a single record." },
      ].map((feature, i) => (
        <Card key={i} className="hover:bg-slate-800 transition-colors cursor-pointer group">
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
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple, transparent pricing</h2>
      <p className="text-slate-400 text-lg">No hidden fees. Cancel anytime.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <Card className="relative border-slate-700">
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-white mb-2">Monthly</h3>
          <p className="text-slate-400">Perfect for getting started.</p>
        </div>
        <div className="mb-8 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">₹249</span>
          <span className="text-slate-400">/month</span>
        </div>
        <ul className="space-y-4 mb-8">
          {['Unlimited Bills', 'Unlimited Inventory', 'Cloud Backup', 'Basic Reports', 'Email Support'].map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-300">
              <Check size={18} className="text-teal-400" /> {f}
            </li>
          ))}
        </ul>
        <Button className="w-full">Start 7-Day Free Trial</Button>
      </Card>
      <Card className="relative border-teal-500 shadow-2xl shadow-teal-500/10">
        <div className="absolute top-0 right-8 transform -translate-y-1/2">
          <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-white mb-2">Yearly</h3>
          <p className="text-slate-400">Save big with annual billing.</p>
        </div>
        <div className="mb-8 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">₹2999</span>
          <span className="text-slate-400">/year</span>
        </div>
        <ul className="space-y-4 mb-8">
          {['Everything in Monthly', 'Advanced Analytics', 'WhatsApp Integration', 'Priority 24/7 Support', 'Multiple Users'].map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-300">
              <Check size={18} className="text-teal-400" /> {f}
            </li>
          ))}
        </ul>
        <Button className="w-full">Start 7-Day Free Trial</Button>
      </Card>
    </div>
  </div>
);

const ContactView = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <div className="max-w-3xl mx-auto text-center mb-16">
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Get in touch</h2>
      <p className="text-slate-400 text-lg">Have questions? We're here to help.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
      <div>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-teal-400 shrink-0"><MapPin /></div>
            <div>
              <h4 className="text-white font-medium mb-1">Office</h4>
              <p className="text-slate-400">123 Health Tech Park, Andheri East,<br/>Mumbai, Maharashtra 400069</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-teal-400 shrink-0"><Phone /></div>
            <div>
              <h4 className="text-white font-medium mb-1">Phone</h4>
              <p className="text-slate-400">+91 1800-123-4567</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-teal-400 shrink-0"><Mail /></div>
            <div>
              <h4 className="text-white font-medium mb-1">Email</h4>
              <p className="text-slate-400">support@mediveuerp.com</p>
            </div>
          </div>
        </div>
      </div>
      <Card>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Name" placeholder="John Doe" />
          <Input label="Email" type="email" placeholder="john@example.com" />
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-400">Message</label>
            <textarea className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition-colors h-32 resize-none" placeholder="How can we help?"></textarea>
          </div>
          <Button className="w-full">Send Message</Button>
        </form>
      </Card>
    </div>
  </div>
);

const LoginView = ({ navigate }) => {
  const handleLogin = (e) => {
    e.preventDefault();
    navigate('tenant', 'dashboard');
  };
  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400">Login to your MEDIVEU dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <Input label="Email Address" type="email" placeholder="admin@mystore.com" required />
          <Input label="Password" type="password" placeholder="••••••••" required />
          <Button type="submit" className="w-full">Login</Button>
        </form>
      </Card>
    </div>
  );
};

const RegisterView = ({ navigate }) => {
  const handleRegister = (e) => {
    e.preventDefault();
    navigate('tenant', 'settings');
  };
  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Start Free Trial</h2>
          <p className="text-slate-400">No credit card required.</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-6">
          <Input label="Store Name" placeholder="City Pharmacy" required />
          <Input label="Email Address" type="email" placeholder="admin@mystore.com" required />
          <Input label="Password" type="password" placeholder="••••••••" required />
          <Button type="submit" className="w-full">Create Account</Button>
        </form>
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
          <h2 className="text-2xl font-bold text-white mb-2">Super Admin System</h2>
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

function TenantDashboard({ user, navigate, currentPath, showToast, data }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'billing', label: 'Billing (POS)', icon: <CreditCard size={20} /> },
    { id: 'medicines', label: 'Medicines', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard': return <TenantDashboardView data={data} />;
      case 'billing': return <TenantBillingView data={data} showToast={showToast} user={user} />;
      case 'medicines': return <TenantMedicinesView data={data} showToast={showToast} user={user} />;
      case 'customers': return <TenantCustomersView data={data} showToast={showToast} user={user} />;
      case 'suppliers': return <TenantSuppliersView />;
      case 'reports': return <TenantReportsView data={data} />;
      case 'settings': return <TenantSettingsView data={data} showToast={showToast} user={user} />;
      default: return <TenantDashboardView data={data} />;
    }
  };

  const storeName = data.settings?.general?.storeName || "My Pharmacy";

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="text-teal-400" size={24} />
            <span className="font-bold text-lg text-white truncate">{storeName}</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { navigate('tenant', item.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPath === item.id ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="pt-8">
             <button
              onClick={() => navigate('public', 'home')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <button className="md:hidden text-slate-400 p-2" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="hidden md:flex items-center text-slate-300">
            <span className="capitalize font-medium">{currentPath.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">{user?.uid?.substring(0,6) || 'Guest'}</div>
              <div className="text-xs text-slate-400">Pro Plan (Active)</div>
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
          <h3 className="text-lg font-semibold text-white mb-4">Recent Bills</h3>
          {bills.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No bills generated yet.</div>
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
                    <div className="text-xs text-red-400/70">Batch: {m.batch}</div>
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

function TenantBillingView({ data, showToast, user }) {
  const { medicines, bills } = data;
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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
      setCart([...cart, { ...med, qty: 1, originalPrice: med.mrp }]);
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
  const finalTotal = subtotal - discountAmount;
  
  let totalGstAmount = 0;
  cart.forEach(item => {
     const gstRate = Number(item.gst) || 0;
     const itemTotalAfterDiscount = (item.qty * item.originalPrice) * (1 - discountPercent/100);
     const baseAmount = itemTotalAfterDiscount / (1 + (gstRate/100));
     totalGstAmount += (itemTotalAfterDiscount - baseAmount);
  });

  const handleGenerateBill = async () => {
    if (cart.length === 0) return showToast('Cart is empty', 'error');
    if (!user) return showToast('Please authenticate first', 'error');
    setIsProcessing(true);

    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const billCount = bills.filter(b => b.date === dateStr).length + 1;
      const billNo = `INV-${dateStr.replace(/-/g,'')}-${String(billCount).padStart(3, '0')}`;

      const billData = {
        billNo,
        date: dateStr,
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        items: cart,
        subtotal,
        discountPercent,
        discountAmount,
        totalGstAmount,
        total: finalTotal,
        status: 'PAID'
      };

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'bills'), billData);

      for (const item of cart) {
        const medRef = doc(db, 'artifacts', appId, 'users', user.uid, 'medicines', item.id);
        const newStock = Number(item.stock) - item.qty;
        await updateDoc(medRef, { stock: newStock });
      }

      showToast('Bill generated successfully!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent(0);

    } catch (error) {
      console.error(error);
      showToast('Failed to generate bill', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        <Card className="p-4 flex-shrink-0 relative overflow-visible z-20">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Medicine Name or Barcode..." 
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
                      <div className="text-xs text-slate-400">Batch: {med.batch} • Exp: {med.expiry}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-400 font-bold">₹{med.mrp}</div>
                      <div className={`text-xs ${med.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{med.stock} in stock</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-slate-400 text-center">No medicines found.</div>
              )}
            </div>
          )}
        </Card>

        <Card className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Current Bill Items</h3>
            <span className="text-sm text-slate-400">{cart.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 w-24">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-500">Cart is empty. Search to add items.</td></tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-xs text-slate-500">GST: {item.gst}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600">-</button>
                          <span className="w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">₹{item.originalPrice}</td>
                      <td className="px-4 py-3 text-right font-medium text-teal-400">₹{(item.qty * item.originalPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
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
        <h3 className="font-semibold text-white border-b border-slate-700 pb-3 mb-4">Customer Details</h3>
        <div className="space-y-3 mb-6">
          <Input placeholder="Customer Phone (Optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          <Input placeholder="Customer Name (Optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        </div>

        <h3 className="font-semibold text-white border-b border-slate-700 pb-3 mb-4 mt-auto">Bill Summary</h3>
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
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount Amount</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
           <div className="flex justify-between text-slate-400 text-xs">
            <span>Included GST</span>
            <span>₹{totalGstAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-lg text-white">
            <span>Total Pay</span>
            <span className="text-teal-400">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          className="w-full py-4 text-lg font-bold" 
          onClick={handleGenerateBill} 
          disabled={cart.length === 0 || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Generate Bill'}
        </Button>
      </Card>
    </div>
  );
}

function TenantMedicinesView({ data, showToast, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', genericName: '', barcode: '', batch: '', expiry: '', 
    stock: 0, purchasePrice: 0, mrp: 0, gst: 12
  });

  const handleOpen = (med = null) => {
    if (med) {
      setEditingId(med.id);
      setFormData(med);
    } else {
      setEditingId(null);
      setFormData({ name: '', genericName: '', barcode: '', batch: '', expiry: '', stock: 0, purchasePrice: 0, mrp: 0, gst: 12 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return showToast('Please authenticate first', 'error');
    try {
      const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'medicines');
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
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'medicines', id));
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
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">No medicines found.</td></tr>
              ) : (
                filteredData.map(med => (
                  <tr key={med.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{med.name}</div>
                      <div className="text-xs text-slate-500">{med.genericName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{med.batch}</div>
                      <div className={`text-xs ${new Date(med.expiry) < new Date() ? 'text-red-400 font-bold' : 'text-slate-400'}`}>Exp: {med.expiry}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${med.stock > 10 ? 'bg-green-500/10 text-green-400' : med.stock > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-400'}`}>
                        {med.stock} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">₹{med.mrp}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpen(med)} className="text-teal-400 hover:text-teal-300 mx-2"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(med.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
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
            <Input label="Generic Name" value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} />
            <Input label="Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
            <Input label="Batch Number" required value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
            <Input label="Expiry Date" type="month" required value={formData.expiry} onChange={e => setFormData({...formData, expiry: e.target.value})} />
            <Input label="Initial Stock" type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
            <Input label="Purchase Price (₹)" type="number" step="0.01" required value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
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
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Customers Directory</h1>
      </div>
      <Card>
        <p className="text-slate-400 mb-4">Customer records are created automatically when bills are generated with phone numbers. (Full CRM management available in Pro version).</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900">
              <tr>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Total Purchases</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                data.bills.reduce((acc, bill) => {
                  if(bill.customerPhone) {
                    if(!acc[bill.customerPhone]) acc[bill.customerPhone] = { name: bill.customerName, total: 0, count: 0 };
                    acc[bill.customerPhone].total += Number(bill.total);
                    acc[bill.customerPhone].count += 1;
                    acc[bill.customerPhone].name = bill.customerName || acc[bill.customerPhone].name;
                  }
                  return acc;
                }, {})
              ).map(([phone, info], i) => (
                 <tr key={i} className="border-b border-slate-800">
                    <td className="px-6 py-4 font-medium text-white">{phone}</td>
                    <td className="px-6 py-4">{info.name}</td>
                    <td className="px-6 py-4 text-teal-400">₹{info.total.toFixed(2)} ({info.count} bills)</td>
                 </tr>
              ))}
              {data.bills.filter(b=>b.customerPhone).length === 0 && (
                <tr><td colSpan="3" className="text-center py-8 text-slate-500">No customer data available yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
   )
}

function TenantSuppliersView() {
  return (
    <div className="max-w-7xl mx-auto space-y-4 text-center py-20">
      <Truck size={48} className="mx-auto text-slate-600 mb-4" />
      <h1 className="text-2xl font-bold text-white">Supplier Management</h1>
      <p className="text-slate-400 max-w-md mx-auto">Manage your wholesale suppliers, track purchase orders, and monitor payments. This feature is enabled for active subscribers.</p>
      <Button className="mx-auto mt-4">Upgrade Plan to Access</Button>
    </div>
  );
}

function TenantReportsView({ data }) {
  const { bills } = data;
  const totalSales = bills.reduce((sum, b) => sum + Number(b.total), 0);
  const totalGst = bills.reduce((sum, b) => sum + Number(b.totalGstAmount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-teal-500">
          <h3 className="text-slate-400 text-sm">All Time Revenue</h3>
          <div className="text-3xl font-bold text-white mt-2">₹{totalSales.toFixed(2)}</div>
        </Card>
        <Card className="border-t-4 border-t-green-500">
          <h3 className="text-slate-400 text-sm">All Time GST Collected</h3>
          <div className="text-3xl font-bold text-white mt-2">₹{totalGst.toFixed(2)}</div>
        </Card>
        <Card className="border-t-4 border-t-blue-500">
          <h3 className="text-slate-400 text-sm">Total Bills Generated</h3>
          <div className="text-3xl font-bold text-white mt-2">{bills.length}</div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Bill History</h3>
          <Button variant="secondary"><Download size={16} /> Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bill No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
               {bills.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-500">No bills generated yet.</td></tr>
                ) : (
                  bills.sort((a,b) => b.createdAt - a.createdAt).map((b,i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-300">{b.date}</td>
                      <td className="px-4 py-3 font-medium text-white">{b.billNo}</td>
                      <td className="px-4 py-3 text-slate-300">{b.customerName || 'Walk-in'} {b.customerPhone && `(${b.customerPhone})`}</td>
                      <td className="px-4 py-3 text-right">{b.items?.length || 0}</td>
                      <td className="px-4 py-3 text-right text-teal-400 font-bold">₹{Number(b.total).toFixed(2)}</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TenantSettingsView({ data, showToast, user }) {
  const [formData, setFormData] = useState({
    storeName: data.settings?.general?.storeName || '',
    address: data.settings?.general?.address || '',
    phone: data.settings?.general?.phone || '',
    gstin: data.settings?.general?.gstin || '',
    dlNumber: data.settings?.general?.dlNumber || ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'general');
      await setDoc(docRef, formData, { merge: true });
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Store Settings</h1>
      
      <Card>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Business Profile</h3>
            <Input label="Store Name" required value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} />
            <Input label="Complete Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <Input label="Contact Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">Legal Information (Prints on Bill)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="GSTIN Number" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              <Input label="Drug License (DL) Number" value={formData.dlNumber} onChange={e => setFormData({...formData, dlNumber: e.target.value})} />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ==========================================
// 3. SUPER ADMIN PANEL
// ==========================================

function SuperAdminPanel({ user, navigate, currentPath, showToast }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sysSettings, setSysSettings] = useState({ allowRegistration: true, maxStoreLimit: 1000 });

  useEffect(() => {
    if (!user) return;
    const fetchGlobalData = async () => {
      try {
        const sysRef = collection(db, 'artifacts', appId, 'public', 'data', 'system_settings');
        const unsub = onSnapshot(sysRef, (snap) => {
          if (!snap.empty) {
            setSysSettings(snap.docs[0].data());
          }
        });
        return () => unsub();
      } catch (e) { console.error(e); }
    };
    fetchGlobalData();
  }, [user]);

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'system_settings', 'global');
      await setDoc(docRef, sysSettings, { merge: true });
      showToast('Global settings updated');
    } catch(err) {
      showToast('Error saving settings', 'error');
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden text-slate-300">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-red-500 font-bold text-lg gap-2">
          <Shield /> Super Admin
        </div>
        <div className="p-4 space-y-2 flex-1">
          {['dashboard', 'tenants', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => navigate('public', 'home')} className="flex items-center gap-2 text-slate-500 hover:text-white">
            <LogOut size={18} /> Exit Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-white">System Status</h1>
            <div className="grid grid-cols-3 gap-6">
               <Card className="border-t-2 border-red-500 bg-slate-900">
                  <div className="text-slate-400">Total Tenants</div>
                  <div className="text-3xl font-bold text-white mt-2">124</div>
               </Card>
               <Card className="border-t-2 border-blue-500 bg-slate-900">
                  <div className="text-slate-400">Active Subscriptions</div>
                  <div className="text-3xl font-bold text-white mt-2">89</div>
               </Card>
               <Card className="border-t-2 border-green-500 bg-slate-900">
                  <div className="text-slate-400">System Health</div>
                  <div className="text-3xl font-bold text-green-400 mt-2">Optimal</div>
               </Card>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-bold text-white">Global Platform Settings</h1>
            <Card className="bg-slate-900">
              <form onSubmit={saveSettings} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-white font-medium">Allow New Registrations</div>
                    <div className="text-sm text-slate-500">Enable or disable new signups on public site.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded bg-slate-800 border-slate-700 text-red-500 focus:ring-red-500" 
                    checked={sysSettings.allowRegistration}
                    onChange={e => setSysSettings({...sysSettings, allowRegistration: e.target.checked})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Maximum Store Limit</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" 
                    value={sysSettings.maxStoreLimit}
                    onChange={e => setSysSettings({...sysSettings, maxStoreLimit: Number(e.target.value)})}
                  />
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-red-400 font-medium mb-2">Production Credentials</h4>
                  <p className="text-sm text-slate-400 mb-4">Payment gateway API keys, SMTP email settings, and Cloud Storage configurations should be managed via external environment variables or secure secret managers, not directly via UI.</p>
                </div>

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Save Global Configuration</Button>
              </form>
            </Card>
          </div>
        )}
        
        {activeTab === 'tenants' && (
           <div className="space-y-6 max-w-4xl">
             <h1 className="text-2xl font-bold text-white">Manage Tenants</h1>
             <Card className="bg-slate-900">
                <p className="text-slate-400">This view requires custom Firebase Admin SDK lists to display all auth users. Currently viewing mocked representation.</p>
                <div className="mt-4 p-4 border border-slate-800 rounded bg-black/50">
                   <div className="text-white font-mono text-sm">user_1 (Demo Pharmacy) - Pro Plan - Active</div>
                </div>
             </Card>
           </div>
        )}
      </main>
    </div>
  );
}

