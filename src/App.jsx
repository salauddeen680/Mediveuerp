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

// --- EXACT MARG-STYLE WHOLESALE INVOICE TEMPLATE ---
const renderMargInvoice = (invoice, handlePrint, handleShareWhatsApp) => {
  if (!invoice) return null;

  return (
    <div className="bg-white text-black p-6 rounded-xl max-w-4xl mx-auto font-mono shadow-2xl border border-gray-400 text-xs">
      
      {/* Top Header / Store Branding */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <h1 className="text-2xl font-black uppercase tracking-wider">{invoice.storeInfo?.storeName || 'PHARMA WHOLESALE'}</h1>
        <p className="text-xs font-medium">{invoice.storeInfo?.address || '13-2-47, OPP GOWDIPAMATAM, BACHELI'}</p>
        <p className="text-xs font-medium">
          Phone: {invoice.storeInfo?.phone || '9999955559'} | GSTIN: {invoice.storeInfo?.gstin || '07CTMPM699K1ZJ'}
        </p>
        <p className="text-xs font-bold mt-0.5">Drug License No: {invoice.storeInfo?.dlNumber || 'DL11WW-6985'}</p>
      </div>

      {/* Bill & Party Details Box */}
      <div className="border border-black mb-3">
        <div className="grid grid-cols-2 divide-x divide-black p-2 bg-gray-50">
          <div>
            <p><span className="font-bold">Invoice No:</span> {invoice.billNo}</p>
            <p><span className="font-bold">Invoice Date:</span> {invoice.date}</p>
          </div>
          <div className="pl-2">
            <p><span className="font-bold">Billed to:</span> {invoice.customerName}</p>
            <p><span className="font-bold">GSTIN:</span> {invoice.customerGstin || 'N/A'}</p>
            <p><span className="font-bold">Address:</span> {invoice.customerAddress || 'DELHI'}</p>
          </div>
        </div>
      </div>

      {/* Marg Style Inventory Table */}
      <table className="w-full border-collapse border border-black mb-3 text-[11px]">
        <thead>
          <tr className="bg-teal-100/80 border-b border-black text-center font-bold">
            <th className="border border-black p-1 w-8">S.</th>
            <th className="border border-black p-1 w-10">Qty</th>
            <th className="border border-black p-1 w-12">Pack</th>
            <th className="border border-black p-1 text-left">Product Name</th>
            <th className="border border-black p-1 w-16">BATCH</th>
            <th className="border border-black p-1 w-12">EXP</th>
            <th className="border border-black p-1 w-14">HSN</th>
            <th className="border border-black p-1 w-12">MRP</th>
            <th className="border border-black p-1 w-12">Rate</th>
            <th className="border border-black p-1 w-10">DIS%</th>
            <th className="border border-black p-1 w-10">SGST</th>
            <th className="border border-black p-1 w-10">CGST</th>
            <th className="border border-black p-1 text-right w-16">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => {
            const itemNet = (item.qty * item.originalPrice) * (1 - (invoice.discountPercent || 0) / 100);
            const gstRate = Number(item.gst) || 12;
            return (
              <tr key={idx} className="border-b border-black/30">
                <td className="border border-black p-1 text-center">{idx + 1}</td>
                <td className="border border-black p-1 text-center font-bold">{item.qty}</td>
                <td className="border border-black p-1 text-center">{item.pack || '10T'}</td>
                <td className="border border-black p-1 font-bold uppercase">{item.name}</td>
                <td className="border border-black p-1 text-center">{item.batch}</td>
                <td className="border border-black p-1 text-center">{item.expiry}</td>
                <td className="border border-black p-1 text-center">{item.hsn}</td>
                <td className="border border-black p-1 text-right">₹{item.mrp}</td>
                <td className="border border-black p-1 text-right">₹{item.originalPrice}</td>
                <td className="border border-black p-1 text-center">{invoice.discountPercent || 0}%</td>
                <td className="border border-black p-1 text-center">{gstRate / 2}%</td>
                <td className="border border-black p-1 text-center">{gstRate / 2}%</td>
                <td className="border border-black p-1 text-right font-bold">₹{itemNet.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals and Bank Details Footer */}
      <div className="grid grid-cols-2 border border-black mb-4">
        <div className="p-2 border-r border-black flex flex-col justify-between">
          <div>
            <p className="font-bold underline mb-1">Bank Details:</p>
            <p>Bank Name: PUNJAB & SIND BANK</p>
            <p>A/c No: 06261100054752 | IFSC: PSIB0000626</p>
          </div>
          <div className="mt-3">
            <p className="font-bold">Terms & Conditions:</p>
            <p className="text-[10px] text-gray-700">1. Goods once sold will not be taken back.<br/>2. Subject to local jurisdiction.</p>
          </div>
        </div>
        <div className="p-2 space-y-1 bg-gray-50 text-right">
          <div className="flex justify-between"><span>Sub Total:</span> <span className="font-bold">₹{(invoice.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount:</span> <span>-₹{(invoice.discountAmount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Add SGST (6%):</span> <span>+₹{(invoice.totalSgst || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Add CGST (6%):</span> <span>+₹{(invoice.totalCgst || 0).toFixed(2)}</span></div>
          <div className="border-t border-black pt-1 flex justify-between text-sm font-black">
            <span>GRAND TOTAL:</span> 
            <span className="text-teal-700">₹{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signature & Action Buttons */}
      <div className="flex justify-between items-end pt-2">
        <div className="text-[10px] font-bold text-gray-600">
          <p>Receiver's Signature:</p>
          <div className="h-8 border-b border-dashed border-black w-36 mt-2"></div>
        </div>
        
        {/* Action Buttons (Print, PDF, WhatsApp) */}
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handleShareWhatsApp} 
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-1"
          >
            <Share2 size={14} /> WhatsApp
          </button>
          <button 
            onClick={handlePrint} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-1"
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>

        <div className="text-right text-[10px] font-bold">
          <p>For {invoice.storeInfo?.storeName || 'PHARMA WHOLESALE'}</p>
          <div className="h-8 border-b border-dashed border-black w-36 mt-2"></div>
          <p className="mt-0.5">Authorised Signatory</p>
        </div>
      </div>

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
        <SuperAdminPanel user={user} navigate={navigate} />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <button className="md:hidden text-slate-300" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>
      <main className="flex-grow">{renderContent()}</main>
    </div>
  );
}

const HomeView = ({ setActiveTab }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
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
  <div className="max-w-7xl mx-auto px-4 py-24 text-center">
    <h2 className="text-3xl font-bold text-white mb-6">Complete Wholesale Pharma Features</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {['Wholesale GST Invoicing', 'Batch & Expiry Control', 'Print, PDF & Share'].map((title, i) => (
        <Card key={i}><h3 className="text-xl font-semibold text-white mb-2">{title}</h3><p className="text-slate-400 text-sm">Engineered specifically for medical distributors.</p></Card>
      ))}
    </div>
  </div>
);

const PricingView = () => (
  <div className="max-w-4xl mx-auto px-4 py-24 text-center">
    <h2 className="text-3xl font-bold text-white mb-6">Transparent Pricing</h2>
    <Card className="border-teal-500"><h3 className="text-2xl font-semibold text-white mb-2">Monthly Plan</h3><div className="text-5xl font-bold text-teal-400 my-4">₹249 <span className="text-sm text-slate-400">/month</span></div><Button className="w-full">Get Started</Button></Card>
  </div>
);

const ContactView = () => (
  <div className="max-w-xl mx-auto py-24 px-4">
    <Card><form onSubmit={e => {e.preventDefault(); alert('Sent!');}} className="space-y-4"><Input label="Name" required /><Input label="Email" required /><Button className="w-full">Submit</Button></form></Card>
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
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
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
      case 'billing': return <TenantBillingView data={data} showToast={showToast} user={user} />;
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card><div className="text-slate-400 text-sm">Total Revenue</div><div className="text-3xl font-bold text-green-400 mt-1">₹{totalSales.toFixed(2)}</div></Card>
        <Card><div className="text-slate-400 text-sm">Invoices</div><div className="text-3xl font-bold text-blue-400 mt-1">{bills.length}</div></Card>
        <Card><div className="text-slate-400 text-sm">Medicines</div><div className="text-3xl font-bold text-teal-400 mt-1">{medicines.length}</div></Card>
      </div>
    </div>
  );
}

function TenantBillingView({ data, showToast, user }) {
  const { medicines, bills, settings } = data;
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('M/s GUPTA STORE');
  const [customerGstin, setCustomerGstin] = useState('07CTMPM8957K1ZU');
  const [customerAddress, setCustomerAddress] = useState('SHOP NO.2, KAROL BAGH, DELHI - 110006');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const storeSettings = settings?.general || {
    storeName: 'PHARMA WHOLESALE',
    address: '13-2-47, OPP GOWDIPAMATAM, BACHELI',
    phone: '9999955559',
    gstin: '07CTMPM699K1ZJ',
    dlNumber: 'DL11WW-6985'
  };

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      setCart(cart.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
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

    try {
      const billData = {
        billNo: `A0000${bills.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        customerName, customerGstin, customerAddress,
        items: cart,
        subtotal, discountPercent, discountAmount,
        totalSgst, totalCgst,
        total: finalTotal,
        storeInfo: storeSettings
      };
      
      await addDoc(collection(db, 'users', user.uid, 'bills'), billData);
      setActiveInvoice(billData);
      setCart([]);
      showToast('Bill generated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate bill', 'error');
    }
  };

  const handlePrint = () => window.print();
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice *${activeInvoice?.billNo}* from *${storeSettings.storeName}*. Total Amount: ₹${activeInvoice?.total.toFixed(2)}. Thank you!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative z-20">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white" placeholder="Search medicine by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 mt-1 rounded-lg max-h-48 overflow-y-auto z-50">
              {medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                <div key={m.id} onClick={() => addToCart(m)} className="p-2.5 hover:bg-slate-700 cursor-pointer flex justify-between">
                  <span className="text-white font-medium">{m.name}</span> <span className="text-teal-400">₹{m.mrp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <Card className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase">
              <tr>
                <th className="p-3">S.</th>
                <th className="p-3">Product</th>
                <th className="p-3">Batch</th>
                <th className="p-3">Qty</th>
                <th className="p-3">MRP</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3 font-bold text-white">{item.name}</td>
                  <td className="p-3 text-slate-300">{item.batch}</td>
                  <td className="p-3 text-teal-400 font-bold">{item.qty}</td>
                  <td className="p-3">₹{item.mrp}</td>
                  <td className="p-3 text-right text-teal-400 font-bold">₹{(item.qty * item.originalPrice).toFixed(2)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr><td colSpan="6" className="text-center py-12 text-slate-500">Cart is empty. Search items above.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="w-full lg:w-80 flex flex-col justify-between">
        <Card className="space-y-4">
          <Input label="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          <Input label="Customer GSTIN" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} />
          <div className="flex justify-between items-center text-slate-300 text-sm">
            <span>Discount (%)</span>
            <input type="number" className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
          </div>
          <div className="text-lg font-bold text-white flex justify-between pt-2 border-t border-slate-700">
            <span>Grand Total:</span> <span className="text-teal-400">₹{finalTotal.toFixed(2)}</span>
          </div>
          <Button onClick={handleGenerateBill} className="w-full py-3 font-bold">Save & Generate Bill</Button>
        </Card>
      </div>

      {activeInvoice && (
        <Modal isOpen={!!activeInvoice} onClose={() => setActiveInvoice(null)} title="Professional Marg-Style Invoice Preview">
           {renderMargInvoice(activeInvoice, handlePrint, handleShareWhatsApp)}
        </Modal>
      )}
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
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-white">Inventory</h1><Button onClick={() => setIsModalOpen(true)}>Add Medicine</Button></div>
      <Card className="p-0 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Name</th><th className="p-3">Batch</th><th className="p-3">Expiry</th><th className="p-3">Stock</th><th className="p-3">MRP</th></tr></thead><tbody>{data.medicines.map(m => <tr key={m.id} className="border-b border-slate-800"><td className="p-3 text-white font-medium">{m.name}</td><td className="p-3">{m.batch}</td><td className="p-3">{m.expiry}</td><td className="p-3">{m.stock}</td><td className="p-3">₹{m.mrp}</td></tr>)}</tbody></table></Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Medicine"><form onSubmit={handleSave} className="space-y-4"><Input label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /><Input label="Batch" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} required /><Input label="Expiry (MM/YY)" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} required /><Input label="Stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} required /><Input label="MRP" type="number" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})} required /><Button type="submit">Save</Button></form></Modal>
    </div>
  );
}

function TenantCustomersView({ data }) { return <div className="text-white text-xl">Customers View ({data.bills.length} bills)</div>; }
function TenantReportsView({ data }) { return <div className="text-white text-xl">Reports View</div>; }
function TenantSettingsView({ data, showToast, user }) { return <div className="text-white text-xl">Settings View</div>; }

function SuperAdminPanel({ navigate }) {
  return (
    <div className="flex h-screen bg-black text-slate-300">
      <aside className="w-64 bg-slate-900 p-4"><button onClick={() => navigate('public', 'home')} className="text-red-400">Exit Admin</button></aside>
      <main className="p-8"><h1 className="text-2xl text-white">Super Admin Console</h1></main>
    </div>
  );
}

