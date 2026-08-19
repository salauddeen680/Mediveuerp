import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Plus, FileText, Search } from 'lucide-react';

// 🔥 YAHAN HUMNE NAYI FILE KO LINK KIYA HAI 🔥
import CustomerLedger from './CustomerLedger';

export default function Customers({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 LINKING STATE: Jab ye set hoga, tab Khata khulega 🔥
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState(null);

  // Naya Customer add karne ke states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', gstin: '', address: '' });

  // Firebase se Customers fetch karna
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'customers'), (snapshot) => {
      const custData = [];
      snapshot.forEach(doc => custData.push({ id: doc.id, ...doc.data() }));
      setCustomers(custData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Naya customer save karna
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return alert("Customer Name is required");
    try {
      await addDoc(collection(db, 'users', user.uid, 'customers'), {
        ...newCustomer,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', gstin: '', address: '' });
    } catch (error) {
      console.error("Error adding customer", error);
    }
  };

  // 🔄 MAGIC LINK: Agar koi customer select hua hai, toh Ledger page dikhao 🔄
  if (selectedCustomerForLedger) {
    return (
      <CustomerLedger 
        user={user} 
        customer={selectedCustomerForLedger} 
        onBack={() => setSelectedCustomerForLedger(null)} 
      />
    );
  }

  // SEARCH FILTER
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-8 text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
        <h2 className="text-2xl font-black text-white flex items-center mb-4 md:mb-0">
          <Users className="mr-3 text-blue-400" size={28} /> My Customers
        </h2>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full md:w-64 bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 text-white transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors shrink-0">
            <Plus size={18} className="mr-2"/> Add New
          </button>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="max-w-6xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold border-b border-slate-700">Customer Name</th>
                <th className="p-4 font-bold border-b border-slate-700">Phone</th>
                <th className="p-4 font-bold border-b border-slate-700">GSTIN</th>
                <th className="p-4 font-bold border-b border-slate-700 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">Loading Customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">No customers found. Add a new customer to start.</td></tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 font-black text-white">{cust.name}</td>
                    <td className="p-4 font-semibold">{cust.phone || '-'}</td>
                    <td className="p-4 font-bold uppercase">{cust.gstin || '-'}</td>
                    <td className="p-4 text-center">
                      {/* 🔥 LINK BUTTON: Ispe click karte hi CustomerLedger khulega 🔥 */}
                      <button 
                        onClick={() => setSelectedCustomerForLedger(cust)} 
                        className="flex items-center justify-center w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded border border-emerald-500/20 font-bold transition-colors"
                      >
                        <FileText size={16} className="mr-2"/> View Ledger (Khata)
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Users size={20} className="mr-2 text-blue-400"/> Add New Customer
              </h3>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer / Business Name</label>
                <input type="text" required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500 uppercase font-bold" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">GSTIN</label>
                  <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500 uppercase font-bold" value={newCustomer.gstin} onChange={e => setNewCustomer({...newCustomer, gstin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
                <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500 h-20 resize-none uppercase" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
