import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Package, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function Inventory({ user }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', batch: '', expiry: '', qty: 0, price: 0 });

  // Real-time Inventory Fetch
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'inventory'), orderBy('expiry', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    await addDoc(collection(db, 'users', user.uid, 'inventory'), newItem);
    setNewItem({ name: '', batch: '', expiry: '', qty: 0, price: 0 });
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Package /> Inventory Management</h2>
      
      {/* Add Item Form */}
      <form onSubmit={handleAdd} className="bg-slate-800 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input placeholder="Item Name" className="bg-slate-950 p-2 rounded" onChange={e => setNewItem({...newItem, name: e.target.value})} value={newItem.name} />
        <input placeholder="Batch No" className="bg-slate-950 p-2 rounded" onChange={e => setNewItem({...newItem, batch: e.target.value})} value={newItem.batch} />
        <input type="date" className="bg-slate-950 p-2 rounded" onChange={e => setNewItem({...newItem, expiry: e.target.value})} value={newItem.expiry} />
        <input type="number" placeholder="Qty" className="bg-slate-950 p-2 rounded" onChange={e => setNewItem({...newItem, qty: Number(e.target.value)})} value={newItem.qty} />
        <button className="bg-teal-600 p-2 rounded font-bold flex items-center justify-center gap-2"><Plus size={18}/> Add</button>
      </form>

      {/* Inventory Table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-700 text-xs uppercase">
            <tr>
              <th className="p-4">Item</th>
              <th className="p-4">Batch</th>
              <th className="p-4">Expiry</th>
              <th className="p-4">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="p-4">{item.name}</td>
                <td className="p-4">{item.batch}</td>
                <td className={`p-4 ${new Date(item.expiry) < new Date() ? 'text-red-400 font-bold' : ''}`}>
                  {item.expiry}
                </td>
                <td className="p-4">{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

