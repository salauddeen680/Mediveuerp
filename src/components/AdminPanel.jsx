import React, { useState, useEffect } from 'react';
import { Shield, Users, CreditCard, Activity, LogOut, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminPanel({ navigate }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      // Fetching all registered users/stores from Firestore root 'users' collection
      const querySnapshot = await getDocs(collection(db, 'users'));
      const tenantList = [];
      
      for (const userDoc of querySnapshot.docs) {
        const userId = userDoc.id;
        // Fetch store general settings
        const settingsSnap = await getDocs(collection(db, 'users', userId, 'settings'));
        let storeName = 'Unknown Store';
        let storePhone = 'N/A';
        
        settingsSnap.forEach(sDoc => {
          if (sDoc.id === 'general') {
            storeName = sDoc.data().storeName || storeName;
            storePhone = sDoc.data().phone || storePhone;
          }
        });

        tenantList.push({
          id: userId,
          email: userDoc.data().email || `Store ID: ${userId.slice(0, 6)}`,
          storeName,
          phone: storePhone,
          status: 'Active Trial',
          plan: 'Monthly (₹249)',
          createdAt: userDoc.data().createdAt || Date.now()
        });
      }

      setTenants(tenantList);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = tenants.length * 249; // Estimated calculation based on active stores

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-red-500 font-bold text-lg gap-2">
          <Shield size={24} /> Super Admin
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

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">System Control Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Manage all registered medical stores and subscription renewals.</p>
          </div>
          <button 
            onClick={fetchTenants} 
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 cursor-pointer"
          >
            Refresh Data
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium">Total Registered Stores</div>
            <div className="text-3xl font-bold text-white mt-2">{tenants.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium">Active Subscriptions / Trials</div>
            <div className="text-3xl font-bold text-teal-400 mt-2">{tenants.length} Active</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="text-slate-400 text-sm font-medium">Estimated MRR (Monthly Revenue)</div>
            <div className="text-3xl font-bold text-green-400 mt-2">₹{totalRevenue}</div>
          </div>
        </div>

        {/* Tenants Table Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
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
                  <th className="px-6 py-4">Plan / Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-500">Loading store databases...</td></tr>
                ) : filteredTenants.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-500">No stores found.</td></tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-medium text-white">{t.storeName}</td>
                      <td className="px-6 py-4 text-slate-300">{t.email}</td>
                      <td className="px-6 py-4 text-slate-300">{t.phone}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          {t.status} ({t.plan})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-slate-400">Manage</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

