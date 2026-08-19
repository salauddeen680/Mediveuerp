import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Truck, Plus, FileText, Search, ShoppingCart } from 'lucide-react';

export default function Suppliers({ user, onNavigate }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Naya Supplier add karne ke states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', gstin: '', address: '' });

  // Firebase se Suppliers fetch karna
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'suppliers'), (snapshot) => {
      const suppData = [];
      snapshot.forEach(doc => suppData.push({ id: doc.id, ...doc.data() }));
      setSuppliers(suppData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Naya Supplier save karna
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplier.name) return alert("Supplier Name is required");
    try {
      await addDoc(collection(db, 'users', user.uid, 'suppliers'), {
        ...newSupplier,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewSupplier({ name: '', phone: '', gstin: '', address: '' });
    } catch (error) {
      console.error("Error adding supplier", error);
    }
  };

  // SEARCH FILTER
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.phone && s.phone.includes(searchTerm))
  );

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-8 text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center">
            <Truck className="mr-3 text-emerald-400" size={28} /> Distributors & Suppliers
          </h2>
          <p className="text-slate-400 text-sm font-semibold mt-1">Manage purchase accounts & wholesale vendors</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search supplier..." 
              className="w-full md:w-64 bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-emerald-500 text-white transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-colors shrink-0">
            <Plus size={18} className="mr-2"/> Add Supplier
          </button>
        </div>
      </div>

      {/* SUPPLIERS TABLE */}
      <div className="max-w-6xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold border-b border-slate-700">Distributor Name</th>
                <th className="p-4 font-bold border-b border-slate-700">Phone</th>
                <th className="p-4 font-bold border-b border-slate-700">GSTIN</th>
                <th className="p-4 font-bold border-b border-slate-700 text-center">Auto-Linked Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">Loading Suppliers...</td></tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">No suppliers found. Add a new distributor to start.</td></tr>
              ) : (
                filteredSuppliers.map((supp) => (
                  <tr key={supp.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 font-black text-white">{supp.name}</td>
                    <td className="p-4 font-semibold">{supp.phone || '-'}</td>
                    <td className="p-4 font-bold uppercase">{supp.gstin || '-'}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {/* 🔥 LINK 1: Purchase Bill Entry - Jab next file banegi toh ye wahan le jayega 🔥 */}
                        <button 
                          onClick={() => onNavigate && onNavigate('purchaseEntry', supp)} 
                          className="flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded border border-blue-500/20 font-bold transition-colors text-xs"
                        >
                          <ShoppingCart size={14} className="mr-1"/> Add Purchase Bill
                        </button>

                        {/* 🔥 LINK 2: Supplier Ledger (Khata) 🔥 */}
                        <button 
                          onClick={() => onNavigate && onNavigate('supplierLedger', supp)} 
                          className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded border border-slate-600 font-bold transition-colors text-xs"
                        >
                          <FileText size={14} className="mr-1"/> View Khata
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Truck size={20} className="mr-2 text-emerald-400"/> Add New Distributor
              </h3>
            </div>
            <form onSubmit={handleAddSupplier} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agency / Distributor Name</label>
                <input type="text" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 uppercase font-bold" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">GSTIN</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 uppercase font-bold" value={newSupplier.gstin} onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 h-20 resize-none uppercase" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors">Save Distributor</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

