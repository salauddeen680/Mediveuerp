import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, CreditCard, Package, Users, Truck, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Search, Printer, 
  Download, Activity, CheckCircle, AlertTriangle, Shield, 
  Database, Check, ChevronRight, TrendingUp, Share2, Upload, 
  ShieldCheck, Clock, ArrowRight 
} from 'lucide-react';

import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// Components
import BillingPOS from './components/BillingPOS';
import AdminPanel from './components/AdminPanel';
import Reports from './components/Reports';
import SubscriptionPlans from './components/SubscriptionPlans'; 

// Utils
import { generateZipBackup } from './utils/backupExporter';

// Logo
import logo from './logo.png';

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
      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 transition-colors w-full"
      {...props} 
    />
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl overflow-hidden ${className}`}>
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
  
  // 🔥 ADMIN AUTHENTICATION STATE
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [bills, setBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [settings, setSettings] = useState({});
  const [userData, setUserData] = useState(null); 

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const checkAdminRoute = () => {
      const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('#admin');
      if (isAdmin) {
        setCurrentView('admin');
        setAuthLoading(false); 
      }
    };
    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('#admin');
      
      if (currentUser && !isAdmin && currentView !== 'admin') {
        setCurrentView('tenant');
        setCurrentPath('dashboard');
      }
      
      if (!currentUser || isAdmin) {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [currentView]);

  useEffect(() => {
    if (!user || currentView !== 'tenant') return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        setUserData({}); 
      }
      setAuthLoading(false);
    });

    const unsubs = [
      unsubUser,
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
    
    if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else {
      window.history.pushState({}, '', '/');
      setIsAdminAuth(false); // Security: Reset admin auth if they leave the page
    }
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

  if (authLoading || (user && currentView === 'tenant' && userData === null)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-teal-400 gap-4">
        <Activity className="animate-spin" size={48} />
        <p className="text-slate-400 font-medium">Loading MEDIVEU ERP...</p>
      </div>
    );
  }

  const fallbackCreationTime = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).getTime() 
    : Date.now();

  const combinedTenantData = {
    medicines,
    bills,
    customers,
    suppliers,
    settings,
    plan: userData?.plan || '7 Days Free Trial',
    status: userData?.status || 'Active',
    createdAt: userData?.createdAt || fallbackCreationTime, 
    templateName: userData?.templateName || 'classic'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30 flex flex-col justify-between">
      {currentView === 'public' && <PublicWebsite navigate={navigate} showToast={showToast} />}
      
      {currentView === 'tenant' && (
        <TenantDashboard 
          user={user} navigate={navigate} currentPath={currentPath} showToast={showToast} handleLogout={handleLogout}
          data={combinedTenantData}
        />
      )}
      
      {/* 🔥 ADMIN SECURITY CHECK (NEW LOGIN LAYER) */}
      {currentView === 'admin' && (
        isAdminAuth ? (
          <AdminPanel navigate={navigate} />
        ) : (
          <AdminLoginView onLogin={setIsAdminAuth} navigate={navigate} />
        )
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ==========================================
// 🔥 SUPER ADMIN LOGIN COMPONENT (NEW)
// ==========================================
const AdminLoginView = ({ onLogin, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    // Tumhara exact Password aur ID check
    if (email === 'Admin@mediveu.com' && password === 'mediveu@2006') {
      onLogin(true);
      setError('');
    } else {
      setError('Galat Admin ID ya Password!');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-slate-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      <Card className="w-full max-w-md border-red-500/20 shadow-2xl shadow-red-500/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
        <div className="flex justify-center mb-6 mt-2">
          <div className="bg-red-500/10 p-4 rounded-full text-red-500 border border-red-500/20">
            <Shield size={36} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Super Admin Login</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Restricted Area. Authorized Personnel Only.</p>
        
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <Input 
            label="Admin Email" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Enter admin ID"
            required 
          />
          <Input 
            label="Admin Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Enter security key"
            required 
          />
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg mt-2 cursor-pointer"
          >
            Authenticate <ArrowRight size={18} />
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate('public', 'home')} 
            className="w-full text-slate-500 text-sm mt-4 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ← Back to Public Website
          </button>
        </form>
      </Card>
    </div>
  );
};


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
            <img src={logo} alt="Mediveu Logo" className="h-10 w-auto object-contain drop-shadow-md rounded-md" />
            <span className="text-2xl font-bold text-white tracking-wide">MEDIVEU <span className="text-teal-400">ERP</span></span>
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
      <div className="flex justify-center gap-4 flex-wrap">
        <Button onClick={() => setActiveTab('register')} className="px-8 py-4 text-lg w-full sm:w-auto">Create Account / 7 Days Free Trial</Button>
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
    setTimeout(() => setActiveTab('register'), 1500);
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
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-teal-400 font-semibold break-all">
      saifyt915@gmail.com
    </div>
  </div>
);

const LoginView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return showToast('Please enter your email', 'error');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showToast('Password reset link sent! Please check your email inbox.');
      setIsForgotModalOpen(false);
      setResetEmail('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') showToast('No account found with this email.', 'error');
      else showToast(err.message.replace('Firebase:', ''), 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4 w-full">
      <Card>
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Mediveu Logo" className="h-16 w-auto object-contain rounded-md" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Store Login</h2>
        <form onSubmit={async e => { 
          e.preventDefault(); 
          try { 
            await signInWithEmailAndPassword(auth, email, password); 
            showToast('Logged in successfully!'); 
            navigate('tenant', 'dashboard'); 
          } catch(err){ 
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') showToast('Invalid Email or Password!', 'error');
            else showToast(err.message.replace('Firebase:', ''), 'error'); 
          } 
        }} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <div className="flex justify-end">
            <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
              Forgot Password?
            </button>
          </div>
          <Button type="submit" className="w-full">Login</Button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          New here? <button onClick={() => setActiveTab('register')} className="text-teal-400 ml-1">Create Account</button>
        </div>
      </Card>

      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Reset Password">
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <p className="text-slate-300 text-sm">Enter your registered email address below. We will send you a secure link to reset your password.</p>
          <Input label="Email Address" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
          <Button type="submit" className="w-full mt-2">Send Reset Link</Button>
        </form>
      </Modal>
    </div>
  );
};

const RegisterView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  
  return (
    <div className="max-w-md mx-auto py-20 px-4 w-full">
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
              phone: '', address: '', gstin: '', dlNumber: ''
            }); 
            
            showToast('Account Created Successfully!'); 
            navigate('tenant', 'dashboard'); 
          } catch(err){ 
            if (err.code === 'auth/email-already-in-use') showToast('This Email is already registered! Please Login.', 'error');
            else if (err.code === 'auth/weak-password') showToast('Password must be at least 6 characters.', 'error');
            else showToast(err.message.replace('Firebase:', ''), 'error'); 
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
// TENANT DASHBOARD
// ==========================================
function TenantDashboard({ user, navigate, currentPath, showToast, handleLogout, data }) {
  const [billToEdit, setBillToEdit] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      case 'reports': return <Reports data={data} onOpenBill={(bill) => { setBillToEdit(bill); navigate('tenant', 'billing'); }} />;
      case 'subscription': return <SubscriptionPlans user={user} showToast={showToast} navigate={navigate} />;
      case 'settings': return <TenantSettingsView data={data} showToast={showToast} user={user} />;
      default: return <TenantDashboardView data={data} navigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative w-full">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col`}>
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between font-bold text-white">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Dashboard Logo" className="h-8 w-auto object-contain rounded" />
            <span className="tracking-wide">MEDIVEU ERP</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                if (item.id === 'billing') setBillToEdit(null);
                navigate('tenant', item.id);
                setIsSidebarOpen(false);
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        <HeaderTimerBar data={data} navigate={navigate} onMenuToggle={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">{renderContent()}</main>
        <Footer />
      </div>
    </div>
  );
}

// ==========================================
// TIME CALCULATOR HOOK
// ==========================================
function useSubscriptionTimer(data) {
  const userPlan = data?.plan || '7 Days Free Trial';
  const userStatus = data?.status || 'Active';
  
  const createdAtRaw = data?.createdAt || Date.now();
  const createdAt = typeof createdAtRaw === 'object' && createdAtRaw?.seconds 
    ? createdAtRaw.seconds * 1000 
    : Number(createdAtRaw) || Date.now();

  let totalPlanDays = 7;
  const planString = String(userPlan).toLowerCase();

  if (planString.includes('7 days') || planString.includes('trial')) totalPlanDays = 7;
  else if (planString.includes('monthly') || planString.includes('249') || planString.includes('month')) totalPlanDays = 30;
  else if (planString.includes('yearly') || planString.includes('2799') || planString.includes('year')) totalPlanDays = 365;
  else if (planString.includes('lifetime') || planString.includes('unlimited')) totalPlanDays = 36500;

  const expiryTimestamp = createdAt + (totalPlanDays * 24 * 60 * 60 * 1000);
  const expiryDateString = new Date(expiryTimestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const difference = expiryTimestamp - now;
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiryTimestamp]);

  return { userPlan, userStatus, expiryDateString, timeLeft, isUrgent: timeLeft.days <= 3 };
}

function HeaderTimerBar({ data, navigate, onMenuToggle }) {
  const { userPlan, timeLeft, isUrgent } = useSubscriptionTimer(data);
  return (
    <div className={`border-b px-4 md:px-6 py-2.5 flex flex-wrap md:flex-row justify-between items-center shadow-md gap-3 md:gap-2 transition-colors w-full ${isUrgent || timeLeft.isExpired ? 'bg-red-950/40 border-red-500/40' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button onClick={onMenuToggle} className="md:hidden text-slate-300 hover:text-white p-1 -ml-2">
          <Menu size={24} />
        </button>
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUrgent ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
        </span>
        <span className="text-xs md:text-sm text-slate-300 truncate">
          Active Plan: <span className="text-white font-semibold ml-1">{userPlan}</span>
        </span>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap ${isUrgent || timeLeft.isExpired ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse' : 'bg-slate-950/80 border-slate-700/60 text-teal-400'}`}>
          {timeLeft.isExpired ? <span>EXPIRED</span> : <span>⏳ {timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m left</span>}
        </div>
        <button onClick={() => navigate && navigate('tenant', 'subscription')} className="text-xs bg-teal-500 hover:bg-teal-600 text-white font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm whitespace-nowrap">
          Upgrade
        </button>
      </div>
    </div>
  );
}

function PlanStatusCard({ data, navigate }) {
  const { userPlan, userStatus, expiryDateString, timeLeft, isUrgent } = useSubscriptionTimer(data);
  return (
    <div className={`border rounded-2xl p-4 md:p-6 shadow-2xl mb-6 relative overflow-hidden transition-all duration-300 w-full ${isUrgent || timeLeft.isExpired ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-red-500/50 shadow-red-500/10' : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700/80 shadow-teal-500/5'}`}>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isUrgent || timeLeft.isExpired ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'}`}>
            {isUrgent || timeLeft.isExpired ? <AlertTriangle size={24} className="animate-bounce" /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Current Subscription</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${userStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>{userStatus}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-1 break-words">{userPlan}</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">Valid up to: <span className="text-slate-200 font-medium">{expiryDateString}</span></p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 w-full sm:w-auto ${isUrgent || timeLeft.isExpired ? 'bg-red-500/15 border-red-500/40 text-red-200 shadow-lg shadow-red-500/10' : 'bg-slate-950/60 border-slate-700/60 text-slate-200'}`}>
            <Clock size={20} className={`shrink-0 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-teal-400'}`} />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Time Remaining</div>
              <div className="text-sm md:text-base font-extrabold tracking-wide">
                {timeLeft.isExpired ? <span className="text-red-400 font-bold">Plan Expired!</span> : <span className="font-mono">{timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s</span>}
              </div>
            </div>
          </div>
          <button onClick={() => navigate && navigate('tenant', 'subscription')} className={`font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto whitespace-nowrap ${isUrgent || timeLeft.isExpired ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-red-600/30 animate-pulse' : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-teal-500/20'}`}>
            Upgrade Plan <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TenantDashboardView({ data, navigate }) {
  const medicines = data?.medicines || [];
  const bills = data?.bills || [];
  const totalSales = bills.reduce((acc, b) => acc + Number(b.totals?.grandTotal || b.total || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <PlanStatusCard data={data} navigate={navigate} />
      <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card><div className="text-slate-400 text-sm">Total Revenue</div><div className="text-2xl md:text-3xl font-bold text-green-400 mt-1">₹{totalSales.toFixed(2)}</div></Card>
        <Card><div className="text-slate-400 text-sm">Total Invoices</div><div className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">{bills.length}</div></Card>
        <Card><div className="text-slate-400 text-sm">Total Medicines</div><div className="text-2xl md:text-3xl font-bold text-teal-400 mt-1">{medicines.length}</div></Card>
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
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-white">Inventory Management</h1>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">Add Medicine</Button>
      </div>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto w-full rounded-xl">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-900 text-slate-400">
              <tr><th className="p-4">Name</th><th className="p-4">Batch</th><th className="p-4">Expiry</th><th className="p-4">Stock</th><th className="p-4">MRP</th></tr>
            </thead>
            <tbody>
              {data.medicines?.map(m => (
                <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4 text-white font-medium">{m.name}</td>
                  <td className="p-4">{m.batch}</td><td className="p-4">{m.expiry}</td>
                  <td className="p-4">{m.stock}</td><td className="p-4">₹{m.mrp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Medicine">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Batch" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} required />
            <Input label="Expiry (MM/YY)" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} required />
            <Input label="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} required />
            <Input label="MRP" type="number" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})} required />
          </div>
          <Button type="submit" className="w-full mt-4">Save</Button>
        </form>
      </Modal>
    </div>
  );
}

function TenantCustomersView({ data }) {
  const customerMap = new Map();
  if (data?.bills) {
    data.bills.forEach(b => {
      const name = b.customerName || b.buyerDetails?.name || 'Unknown Party';
      const gst = b.customerGstin || b.buyerDetails?.gstin || 'N/A';
      const amount = Number(b.totals?.grandTotal || b.total || 0);
      if (customerMap.has(name)) {
        customerMap.set(name, { ...customerMap.get(name), total: customerMap.get(name).total + amount });
      } else {
        customerMap.set(name, { name, gst, total: amount });
      }
    });
  }
  const customerList = Array.from(customerMap.values());

  return (
    <div className="max-w-7xl mx-auto space-y-4 w-full">
      <h1 className="text-xl md:text-2xl font-bold text-white">Customers Directory</h1>
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto w-full rounded-xl">
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[500px]">
            <thead className="bg-slate-900 text-slate-400">
              <tr><th className="p-4">Customer Name</th><th className="p-4">GSTIN</th><th className="p-4 text-right">Total Purchases</th></tr>
            </thead>
            <tbody>
              {customerList.map((c, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4 text-white font-medium">{c.name}</td>
                  <td className="p-4 text-slate-300">{c.gst}</td>
                  <td className="p-4 text-right text-teal-400 font-bold">₹{c.total.toFixed(2)}</td>
                </tr>
              ))}
              {customerList.length === 0 && (
                <tr><td colSpan="3" className="text-center py-8 text-slate-500">No customers found. Generate bills to add customers.</td></tr>
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

  const handleExportBackup = async () => {
    try {
      showToast('Preparing backup files...', 'success');
      
      const backupData = {
        settings: data.settings,
        medicines: data.medicines,
        bills: data.bills,
        customers: data.customers,
        suppliers: data.suppliers,
        exportDate: new Date().toISOString()
      };

      await generateZipBackup(backupData, formData.storeName);
      showToast('Backup Zip Downloaded Successfully!');
    } catch (error) {
      showToast('Error creating backup! Check if jszip is installed.', 'error');
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        
        if (!importedData.exportDate) {
          showToast('Invalid backup file! Please select a valid JSON backup.', 'error');
          return;
        }

        showToast('Restoring data... Please wait.');

        if (importedData.medicines && importedData.medicines.length > 0) {
          for (const med of importedData.medicines) {
            const { id, ...medData } = med;
            await addDoc(collection(db, 'users', user.uid, 'medicines'), medData);
          }
        }
        
        if (importedData.bills && importedData.bills.length > 0) {
          for (const bill of importedData.bills) {
            const { id, ...billData } = bill;
            await addDoc(collection(db, 'users', user.uid, 'bills'), billData);
          }
        }

        if (importedData.settings && importedData.settings.general) {
          await setDoc(doc(db, 'users', user.uid, 'settings', 'general'), importedData.settings.general, { merge: true });
        }

        showToast('Backup Restored Successfully!', 'success');
        e.target.value = null;
      } catch (err) {
        showToast('Error restoring backup. File might be corrupted.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      <h1 className="text-xl md:text-2xl font-bold text-white">Store Settings & Backup</h1>
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Store Name" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} required />
          <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <Input label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Input label="GSTIN" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
          <Input label="Drug License Number" value={formData.dlNumber} onChange={e => setFormData({...formData, dlNumber: e.target.value})} />
          <div className="flex justify-end pt-4"><Button type="submit" className="w-full sm:w-auto">Save Settings</Button></div>
        </form>
      </Card>
      
      <Card className="border-teal-500/30">
        <h3 className="text-lg md:text-xl font-bold text-white mb-2">Data Backup & Restore</h3>
        <p className="text-slate-400 text-sm mb-4">
          Download a complete ZIP folder of your store, or restore from a JSON backup file.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExportBackup} variant="secondary" className="gap-2 w-full sm:w-auto">
            <Download size={18} /> Download Backup (.zip)
          </Button>

          <div className="relative w-full sm:w-auto">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBackup} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Upload Backup File"
            />
            <Button variant="primary" className="gap-2 w-full pointer-events-none">
              <Upload size={18} /> Restore Backup
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
