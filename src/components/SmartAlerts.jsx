import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, PackageOpen } from 'lucide-react';

export default function SmartAlerts({ user, onNavigate }) {
  const [alerts, setAlerts] = useState({
    lowStockItems: [],
    expiringItems: []
  });

  useEffect(() => {
    if (!user?.uid) return;

    // Sirf Inventory fetch karenge alerts ke liye
    const unsubscribeInventory = onSnapshot(collection(db, 'users', user.uid, 'inventory'), (snapshot) => {
      const lowStock = [];
      const expiring = [];
      const today = new Date();

      snapshot.forEach(doc => {
        const item = { id: doc.id, ...doc.data() };
        
        // Low Stock Check (< 10)
        if (Number(item.qty) <= 10) {
          lowStock.push(item);
        }

        // Expiry Check (Within 90 days or expired)
        if (item.expiryDate) {
          const expDate = new Date(item.expiryDate);
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          if (diffDays <= 90) {
            expiring.push({ ...item, daysLeft: diffDays });
          }
        }
      });

      setAlerts({ lowStockItems: lowStock, expiringItems: expiring });
    });

    return () => unsubscribeInventory();
  }, [user]);

  // Agar dono alert khali hain toh kuch mat dikhao
  if (alerts.lowStockItems.length === 0 && alerts.expiringItems.length === 0) {
    return null; 
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 font-sans">
      
      {/* EXPIRED / NEAR EXPIRY TABLE */}
      {alerts.expiringItems.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center">
              <AlertTriangle size={20} className="mr-2 text-red-400" /> Expiry Alerts
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase sticky top-0">
                <tr>
                  <th className="p-3 font-bold border-b border-slate-700">Medicine</th>
                  <th className="p-3 font-bold border-b border-slate-700">Batch</th>
                  <th className="p-3 font-bold border-b border-slate-700 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {alerts.expiringItems.sort((a,b) => a.daysLeft - b.daysLeft).map(item => (
                  <tr key={item.id} className="hover:bg-slate-700/20">
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 font-semibold text-slate-400">{item.batchNo}</td>
                    <td className="p-3 text-right">
                      {item.daysLeft <= 0 ? (
                        <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px] uppercase">Expired</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold text-[10px] uppercase">In {item.daysLeft} Days</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOW STOCK TABLE */}
      {alerts.lowStockItems.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center">
              <PackageOpen size={20} className="mr-2 text-yellow-400" /> Low Stock Alerts
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase sticky top-0">
                <tr>
                  <th className="p-3 font-bold border-b border-slate-700">Medicine</th>
                  <th className="p-3 font-bold border-b border-slate-700">Stock Left</th>
                  <th className="p-3 font-bold border-b border-slate-700 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {alerts.lowStockItems.sort((a,b) => a.qty - b.qty).map(item => (
                  <tr key={item.id} className="hover:bg-slate-700/20">
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 font-black text-red-400">{item.qty} units</td>
                    <td className="p-3 text-right">
                      <button onClick={() => onNavigate && onNavigate('inventory')} className="text-[10px] font-bold bg-slate-700 px-2 py-1 rounded text-white hover:bg-slate-600 uppercase">Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
