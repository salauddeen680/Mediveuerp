import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Home, CreditCard, Package, Users, Truck, FileText, 
  Settings, LogOut, Plus, Edit, Trash2, Search, Printer, 
  Download, Activity, CheckCircle, AlertTriangle, Shield, 
  Database, Check, ChevronRight, TrendingUp, Share2 
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

  useEffect(() => {
    const timer = setTimeout(() => { if (authLoading) setAuthLoading(false); }, 3000);
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-teal-500/30">
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
            <button onClick={() => setActiveTab('admin-login')} className="text-xs text-red-400 hover:underline cursor-pointer">Admin Login</button>
            <button onClick={() => setActiveTab('login')} className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer">Login</button>
            <Button onClick={() => setActiveTab('register')}>Start Free Trial</Button>
          </div>
        </div>
      </nav>
      <main className="flex-grow">{renderContent()}</main>
    </div>
  );
}

const HomeView = ({ setActiveTab }) => (
  <div className="max-w-7xl mx-auto px-4 pt-24 pb-32 text-center">
    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
      Smart Wholesale Billing & ERP for <span className="text-teal-400">Medical Stores</span>
    </h1>
    <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10">
      Manage inventory with batch & expiry tracking, generate professional GST invoices, and grow your pharma business.
    </p>
    <div className="flex justify-center gap-4">
      <Button onClick={() => setActiveTab('register')} className="px-8 py-4 text-lg">Create Account / Free Trial</Button>
    </div>
  </div>
);

const FeaturesView = () => (
  <div className="max-w-7xl mx-auto px-4 py-24 text-center text-white">
    <h2 className="text-3xl font-bold mb-6">Complete Wholesale Pharma Features</h2>
  </div>
);

const PricingView = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center text-white">
    <h2 className="text-3xl font-bold mb-6">Transparent Pricing</h2>
  </div>
);

const ContactView = () => (
  <div className="max-w-xl mx-auto py-24 px-4 text-white">
    <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
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

const RegisterView = ({ navigate, showToast, setActiveTab }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Card>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Create Store Account</h2>
        <form onSubmit={async e => { e.preventDefault(); try { const res = await createUserWithEmailAndPassword(auth, email, password); await setDoc(doc(db, 'users', res.user.uid, 'settings', 'general'), { storeName: storeName || 'Pharma Wholesale' }); showToast('Created!'); navigate('tenant', 'dashboard'); } catch(err){ showToast('Failed', 'error'); } }} className="space-y-4">
          <Input label="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} className="text-white" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Register</Button>
        </form>
      </Card>
    </div>
  );
};

const AdminLoginView = ({ navigate }) => {
  const [pwd, setPwd] = useState('');
  return (
    <div className="max-w-md mx-auto py-24 px-4">
      <Card className="border-red-500/30">
        <h2 className="text-2xl font-bold text-white mb-4 text-center text-red-500">Super Admin</h2>
        <form onSubmit={e => { e.preventDefault(); if(pwd === 'admin123') navigate('admin', 'dashboard'); else alert('Wrong password (admin123)'); }} className="space-y-4">
          <Input label="Password" type="password" value={pwd} onChange={e => setPwd(e.target.value)} required />
          <Button type="submit" className="w-full bg-red-600">Access Admin</Button>
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
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
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
      <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{renderContent()}</main>
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
      <h1 className="text-2xl font-bold text-white">Store Settings</h1>
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
    </div>
  );
}

