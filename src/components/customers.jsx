import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Users, UserPlus, Phone, MapPin, IndianRupee } from 'lucide-react';

export default function Customers({ user }) {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', pendingBalance: 0 });

  // Real-time Customers Fetch
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    await addDoc(collection(db, 'users', user.uid, 'customers'), newCustomer);
    setNewCustomer({ name: '', phone: '', address: '', pendingBalance: 0 });
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen font-sans">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-teal-400">
        <Users /> Customer Management (CRM)
      </h2>
      
      {/* Add Customer Form */}
      <form onSubmit={handleAdd} className="bg-slate-800 border border-slate-700 p-5 rounded-xl mb-6 shadow-lg">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase">Add New Customer</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input placeholder="Customer Name" className="w-full bg-slate-950 border border-slate-700 p-2.5 pl-3 rounded-lg outline-none focus:border-teal-500" onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} value={newCustomer.name} required />
          </div>
          <div className="relative flex items-center">
            <Phone size={16} className="absolute left-3 text-slate-500" />
            <input type="text" placeholder="Phone Number" className="w-full bg-slate-950 border border-slate-700 p-2.5 pl-9 rounded-lg outline-none focus:border-teal-500" onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} value={newCustomer.phone} />
          </div>
          <div className="relative flex items-center">
            <MapPin size={16} className="absolute left-3 text-slate-500" />
            <input type="text" placeholder="Address/City" className="w-full bg-slate-950 border border-slate-700 p-2.5 pl-9 rounded-lg outline-none focus:border-teal-500" onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} value={newCustomer.address} />
          </div>
          <div className="relative flex items-center">
            <IndianRupee size={16} className="absolute left-3 text-slate-500" />
            <input type="number" placeholder="Pending Udhaar (₹)" className="w-full bg-slate-950 border border-slate-700 p-2.5 pl-9 rounded-lg outline-none focus:border-teal-500" onChange={e => setNewCustomer({...newCustomer, pendingBalance: Number(e.target.value)})} value={newCustomer.pendingBalance || ''} />
          </div>
        </div>
        <button type="submit" className="mt-4 w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
          <UserPlus size={18}/> Save Customer
        </button>
      </form>

      {/* Customers List Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-900 border-b border-slate-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold text-right">Pending Dues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {customers.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-slate-500">No customers added yet.</td></tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </td>
                    <td className="p-4 text-slate-300">{customer.phone || '-'}</td>
                    <td className="p-4 text-slate-300">{customer.address || '-'}</td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${customer.pendingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        ₹{customer.pendingBalance}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

