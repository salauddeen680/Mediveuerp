import React, { useState, useEffect } from 'react';
import { Shield, Users, CreditCard, Activity, LogOut, CheckCircle, AlertTriangle, Search, Lock, Unlock, RefreshCw, Save, Edit, X } from 'lucide-react';
import { db } from '../firebase';
// 🔥 onSnapshot import joda gaya hai real-time data ke liye
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// 🔥 Logo import (Path check kar lena agar alag folder mein ho toh)
import logo from '../logo.png';

export default function AdminPanel({ navigate }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalUserLimit, setGlobalUserLimit] = useState(50);
  const [actionLoading, setActionLoading] = useState(null);

  // Plan Edit Modal States
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState(null);
  const [newPlanValue, setNewPlanValue] = useState('');
  // 🔥 Custom days ke liye naya state
  const [customDays, setCustomDays] = useState('');

  useEffect(() => {
    fetchAdminConfig(); 
    // 🔥 Purana fetchTenants hata kar real-time listener call kar rahe hain
    const unsubscribe = listenToTenantsRealTime();
    return () => unsubscribe();
  }, []);

  const fetchAdminConfig = async () => {
    try {
      const configRef = doc(db, 'admin', 'config');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setGlobalUserLimit(configSnap.data().userLimit || 50);
      } else {
        await setDoc(configRef, { userLimit: 50 }); 
      }
    } catch (error) {
      console.error("Config fetch error:", error);
    }
  };

  const saveLimitToDb = async () => {
    try {
      await setDoc(doc(db, 'admin', 'config'), { userLimit: globalUserLimit }, { merge: true });
      alert("Success: Server capacity limit saved permanently!");
    } catch (error) {
      alert("Error: Failed to save limit to database.");
    }
  };

  // 🔥 NAYA REAL-TIME FETCH FUNCTION JISME AUTO-EXPIRY LOGIC HAI
  const listenToTenantsRealTime = () => {
    setLoading(true);
    
    return onSnapshot(collection(db, 'users'), async (snapshot) => {
      const tenantPromises = snapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        let storeName = 'Unknown Store';
        let storePhone = 'N/A';
        
        // Store ki extra details (settings) fetch karna
        try {
          const sSnap = await getDoc(doc(db, 'users', userId, 'settings', 'general'));
          if (sSnap.exists()) {
            storeName = sSnap.data().storeName || storeName;
            storePhone = sSnap.data().phone || storePhone;
          }
        } catch (e) {
          console.log("Settings not found for user", userId);
        }

        // --- ⏳ AUTO EXPIRY CALCULATION ---
        let days = 0;
        const planStr = (userData.plan || '').toLowerCase();
        
        if (planStr.includes('7 days') || planStr.includes('trial')) days = 7;
        else if (planStr.includes('monthly') || planStr.includes('249')) days = 30;
        else if (planStr.includes('yearly') || planStr.includes('2799')) days = 365;
        else if (planStr.includes('lifetime')) days = 36500; // 100 saal
        else if (planStr.includes('custom')) {
          // Extract number of days from "Custom Plan (X Days)"
          const match = planStr.match(/\d+/);
          if (match) days = parseInt(match[0], 10);
        }

        let derivedStatus = userData.status || 'Active';
        const createdAtRaw = userData.createdAt || Date.now();
        const createdAtMs = typeof createdAtRaw === 'object' && createdAtRaw.seconds ? createdAtRaw.seconds * 1000 : Number(createdAtRaw);

        // Agar account Active hai aur uske din check karne hain
        if (derivedStatus === 'Active' && days > 0) {
          const expiryTimestamp = createdAtMs + (days * 24 * 60 * 60 * 1000);
          if (Date.now() > expiryTimestamp) {
            derivedStatus = 'Expired'; // Din poore ho gaye toh automatically Expired dikhayega
          }
        }
        
        return {
          id: userId,
          email: userData.email || `Store ID: ${userId.slice(0, 6)}`,
          storeName,
          phone: storePhone,
          status: derivedStatus,
          originalStatus: userData.status || 'Active', // Database mein actual status
          plan: userData.plan || '7 Days Free Trial', 
          createdAt: createdAtMs
        };
      });

      const tenantList = await Promise.all(tenantPromises);
      setTenants(tenantList);
      setLoading(false);
    }, (error) => {
      console.error("Error with real-time fetching:", error);
      setLoading(false);
    });
  };

  const toggleTenantStatus = async (tenantId, currentStatus) => {
    // Agar status expired hai ya active hai, use toggle karke Suspended ya Active karo
    const newStatus = (currentStatus === 'Active' || currentStatus === 'Expired') ? 'Suspended' : 'Active';
    try {
      setActionLoading(tenantId);
      const userRef = doc(db, 'users', tenantId);
      await updateDoc(userRef, { status: newStatus });
      // Note: Hum state update nahi kar rahe kyunki onSnapshot auto update kar dega
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update store status. Make sure the user document exists.");
    } finally {
      setActionLoading(null);
    }
  };

  const openEditPlanModal = (tenant) => {
    setCurrentEditUser(tenant);
    // Purana plan set karo, custom ho toh dropdown set karo
    if (tenant.plan.includes('Custom')) {
      setNewPlanValue('Custom Days');
      const match = tenant.plan.match(/\d+/);
      setCustomDays(match ? match[0] : '');
    } else {
      setNewPlanValue(tenant.plan);
      setCustomDays('');
    }
    setShowPlanModal(true);
  };

  const saveUpdatedPlan = async () => {
    if (!currentEditUser) return;
    try {
      let finalPlan = newPlanValue;
      
      // 🔥 Agar "Custom Days" chuna hai toh nayi string banayenge
      if (newPlanValue === 'Custom Days') {
        if (!customDays || Number(customDays) <= 0) {
          alert("Please enter valid number of days!");
          return;
        }
        finalPlan = `Custom Plan (${customDays} Days)`;
      }

      const userRef = doc(db, 'users', currentEditUser.id);
      
      // 🔥 Naya plan denge toh 'createdAt' aaj ki date ho jayegi taaki timer reset ho
      await updateDoc(userRef, { 
        plan: finalPlan,
        createdAt: Date.now(),
        status: 'Active' // Agar expired tha toh wapas active ho jayega
      });
      
      setShowPlanModal(false);
      alert(`Plan successfully updated to ${finalPlan} for ${currentEditUser.storeName}`);
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update the plan.");
    }
  };

  const filteredTenants = tenants.filter(t => 
    String(t.storeName).toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(t.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeStores = tenants.filter(t => t.status === 'Active');
  const monthlyCount = activeStores.filter(t => String(t.plan).includes('249') || String(t.plan).toLowerCase().includes('monthly')).length;
  const yearlyCount = activeStores.filter(t => String(t.plan).includes('2799') || String(t.plan).toLowerCase().includes('yearly')).length;
  
  const totalRevenue = (monthlyCount * 249) + (yearlyCount * 2799);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* 🔥 YAHAN AAPKA LOGO ADD KIYA GAYA HAI */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-red-500 font-bold text-lg gap-2">
          <img src={logo} alt="Logo" className="h-8 w-auto object-contain rounded-md shadow-sm" />
          <span className="truncate">Super Admin</span>
        </div>
        <div className="p-4 space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Management</div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400">
            <Users size={18} /> Tenant Stores ({tenants.length})
          </button>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => navigate('public', 'home')} 
            className="w-full flex items-center gap-2 text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={18} /> Exit Admin Console
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">System Control Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Manage all registered medical stores, subscription plans, and access limits.</p>
          </div>
          {/* Refresh button can stay for manual UI confidence, though real-time auto updates it */}
          <button 
            onClick={() => setLoading(true)} 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 cursor-pointer transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-slate-400 text-sm font-medium">Total Stores</div>
            <div className="text-3xl font-bold text-white mt-2">{tenants.length} <span className="text-xs text-slate-500 font-normal">/ Max: {globalUserLimit}</span></div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-slate-400 text-sm font-medium">Monthly Plans</div>
            <div className="text-3xl font-bold text-teal-400 mt-2">{monthlyCount} Active</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-slate-400 text-sm font-medium">Yearly Plans</div>
            <div className="text-3xl font-bold text-indigo-400 mt-2">{yearlyCount} Active</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="text-slate-400 text-sm font-medium">Total Revenue</div>
            <div className="text-3xl font-bold text-green-400 mt-2">₹{totalRevenue}</div>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="text-red-400" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-white">Platform User Limit Control</h4>
              <p className="text-xs text-slate-400">Set maximum registered store capacity allowed on the server.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={globalUserLimit} 
              onChange={(e) => setGlobalUserLimit(Number(e.target.value))}
              className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-red-500"
            />
            <button 
              onClick={saveLimitToDb}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Save size={14} /> Save Limit
            </button>
            <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 font-medium">
              {tenants.length >= globalUserLimit ? 'Limit Reached' : 'Capacity Safe'}
            </span>
          </div>
        </div>

        {/* Tenants Table Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Tenant Stores Directory</h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search store or email..." 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Store Name</th>
                  <th className="px-6 py-4">Owner Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Plan / Billing</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions / Control</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-12 text-slate-500">Loading store databases...</td></tr>
                ) : filteredTenants.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-12 text-slate-500">No stores found matching your search.</td></tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{t.storeName}</td>
                      <td className="px-6 py-4 text-slate-300">{t.email}</td>
                      <td className="px-6 py-4 text-slate-300">{t.phone}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          String(t.plan).includes('2799') || String(t.plan).toLowerCase().includes('yearly')
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : String(t.plan).includes('Custom') 
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        }`}>
                          {t.plan}
                        </span>
                        {/* Edit Plan Button */}
                        <button 
                          onClick={() => openEditPlanModal(t)}
                          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Change Plan"
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {/* 🔥 Expired badge ke liye laal rang, baakiyon ke liye active/suspend colors */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : t.status === 'Expired' ? 'bg-red-600/20 text-red-500 border-red-500/40 animate-pulse'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleTenantStatus(t.id, t.status)}
                          disabled={actionLoading === t.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
                            t.status === 'Active' || t.status === 'Expired'
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {t.status === 'Active' || t.status === 'Expired' ? <Lock size={12} /> : <Unlock size={12} />}
                          {actionLoading === t.id ? 'Processing...' : ((t.status === 'Active' || t.status === 'Expired') ? 'Suspend' : 'Activate')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Plan Modal Overlay */}
      {showPlanModal && currentEditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard size={18} className="text-teal-400" /> Update Store Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Store Name</label>
                <div className="text-white font-medium mt-1">{currentEditUser.storeName}</div>
                {currentEditUser.status === 'Expired' && (
                  <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12}/> Current plan has expired. Upgrading will restore access.
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-xs text-slate-400 uppercase font-semibold">Select New Plan</label>
                <select 
                  value={newPlanValue} 
                  onChange={(e) => setNewPlanValue(e.target.value)}
                  className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="7 Days Free Trial">7 Days Free Trial</option>
                  <option value="Monthly Plan (₹249)">Monthly Plan (₹249)</option>
                  <option value="Yearly Plan (₹2799)">Yearly Plan (₹2799)</option>
                  <option value="Lifetime Access">Lifetime Access (Unlimited)</option>
                  {/* 🔥 Custom Days Option */}
                  <option value="Custom Days">Custom Days (Enter Manually)</option>
                </select>
              </div>

              {/* 🔥 Custom Days Box (Sirf tab dikhega jab custom chuna ho) */}
              {newPlanValue === 'Custom Days' && (
                <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs text-orange-400 uppercase font-semibold">Enter Number of Days</label>
                  <input 
                    type="number" 
                    value={customDays} 
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Example: 15, 45, 90..."
                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">Validity will be calculated starting from today.</p>
                </div>
              )}

              <button 
                onClick={saveUpdatedPlan}
                className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2.5 rounded-lg transition-colors cursor-pointer shadow-lg"
              >
                Save Updated Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
