import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, CreditCard, Package, Users, Truck, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Search, Printer, 
  Download, Activity, CheckCircle, AlertTriangle, Shield, 
  Database, Check, ChevronRight, TrendingUp, Share2, Upload 
} from 'lucide-react';

import { auth, db } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

import BillingPOS from './components/BillingPOS';
import AdminPanel from './components/AdminPanel';

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

  // Handle direct secret admin route check on initial load
  useEffect(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      setCurrentView('admin');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (authLoading) setAuthLoading(false); }, 3000);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      if (currentUser && currentView !== 'admin') {
        setCurrentView('tenant');
        setCurrentPath('dashboard');
      }
      setAuthLoading(false);
    }, (error) => {
      clearTimeout(timer);
      setAuthLoading(false);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, []);

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

// 🔥 FIX: Ab Homepage par Features aur Pricing ek sath dikhenge, niche khali nahi rahega!
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
    // Razorpay integration hook placeholder
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
        {/* Free Trial Card */}
        <Card className="border-teal-500/50 flex flex-col justify-between">
          <div>
            <div className="text-teal-400 font-semibold mb-2">STARTER</div>
            <h3 className="text-2xl font-bold mb-4">7 Days Free Trial</h3>
            <div className="text-4xl font-black mb-6">₹0 <span className="text-sm font-normal text-slate-400">/ 7 days</span></div>
            <p className="text-slate-400 text-sm mb-6">Test all professional features with no restrictions.</p>
          </div>
          <Button onClick={() => setActiveTab('register')} className="w-full">Start Free Trial</Button>
        </Card>

        {/* Monthly Plan */}
        <Card className="border-blue-500/50 flex flex-col justify-between bg-slate-800/80">
          <div>
            <div className="text-blue-400 font-semibold mb-2">MONTHLY PROFESSIONAL</div>
            <h3 className="text-2xl font-bold mb-4">Monthly Plan</h3>
            <div className="text-4xl font-black mb-6">₹249 <span className="text-sm font-normal text-slate-400">/ month</span></div>
            <p className="text-slate-400 text-sm mb-6">Billed monthly via Razorpay. Full ERP access with updates.</p>
          </div>
          <Button onClick={() => handleRazorpayCheckout('Monthly Plan', 249)} className="w-full bg-blue-600 hover:bg-blue-700">Pay ₹249 via Razorpay</Button>
        </Card>

        {/* Yearly Plan */}
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
        <form onSubmit={async e => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); showToast('Logged in!'); navigate('tenant', 'dashboard'); } catch(err){ showToast('Login failed', 'error'); } }} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Login</Button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">New here? <button onClick={() => setActiveTab('register')} className="text-teal-400">Create Account</button></div>
      </Card>
    </div>
  );
};

// 🔥 FIX: Aapka diya hua RegisterView Code yahan add kiya hai taaki Admin panel mein "0 Stores" ki problem theek ho jaye
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
            
            // 1. MAIN DOCUMENT BANANA (Taki Admin mein 0 na dikhe)
            await setDoc(doc(db, 'users', res.user.uid), {
              email: email,
              status: 'Active',
              plan: '7 Days Free Trial',
              createdAt: Date.now()
            });

            // 2. SETTINGS SUB-COLLECTION BANANA
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
            showToast('Registration Failed', 'error'); 
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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'billing', label: 'Billing / POS', icon: <CreditCard size={20} /> },
    { id: 'medicines', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings & Backup', icon: <Settings size={20} /> },
  ];

  const renderContent = () => {
    switch (currentPath) {
      case 'dashboard': return <TenantDashboardView data={data} />;
      case 'billing': return <BillingPOS data={data} showToast={showToast} user={user} />;
      case 'medicines': return <TenantMedicinesView data={data} showToast={showToast} user={user} />;
      case 'customers': return <TenantCustomersView data={data} />;
      case 'reports': return <TenantReportsView data={data} />;
      case 'settings': return <TenantSettingsView data={data} showToast={showToast} user={user} />;
      default: return <TenantDashboardView data={data} />;
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
            <button key={item.id} onClick={() => navigate('tenant', item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${currentPath === item.id ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-slate-800'}`}>
              {item.icon} {item.label}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 cursor-pointer mt-8">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{renderContent()}</main>
        <Footer />
      </div>
    </div>
  );
}

function TenantDashboardView({ data }) {
  const { medicines, bills } = data;
  const totalSales = bills.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

function TenantReportsView({ data }) {
  const totalSales = data.bills.reduce((sum, b) => sum + Number(b.total), 0);
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-teal-500"><h3 className="text-slate-400 text-sm">Total Revenue</h3><div className="text-3xl font-bold text-white mt-2">₹{totalSales.toFixed(2)}</div></Card>
        <Card className="border-t-4 border-t-blue-500"><h3 className="text-slate-400 text-sm">Total Invoices</h3><div className="text-3xl font-bold text-white mt-2">{data.bills.length}</div></Card>
      </div>
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

  // Backup & Export Data Feature for User
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

      {/* User Backup & Export Section */}
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
