import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Package, Plus, Search, AlertTriangle, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function Inventory({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Form States
  const [showModal, setShowModal] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    hsn: '',
    batchNo: '',
    expiryDate: '',
    qty: '',
    rate: '',
    mrp: '',
    gstPercent: 12
  });

  // Firebase Realtime Listener
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'inventory'), (snapshot) => {
      const itemsList = [];
      snapshot.forEach((doc) => {
        itemsList.push({ id: doc.id, ...doc.data() });
      });
      setItems(itemsList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Form Submit (Add ya Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Item/Medicine name is required!");

    try {
      const payload = {
        name: formData.name.toUpperCase(),
        hsn: formData.hsn || '',
        batchNo: formData.batchNo.toUpperCase() || 'N/A',
        expiryDate: formData.expiryDate || '',
        qty: Number(formData.qty) || 0,
        rate: Number(formData.rate) || 0,
        mrp: Number(formData.mrp) || 0,
        gstPercent: Number(formData.gstPercent) || 12,
        updatedAt: serverTimestamp()
      };

      if (editItemId) {
        await updateDoc(doc(db, 'users', user.uid, 'inventory', editItemId), payload);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'inventory'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }

      setShowModal(false);
      setEditItemId(null);
      setFormData({ name: '', hsn: '', batchNo: '', expiryDate: '', qty: '', rate: '', mrp: '', gstPercent: 12 });
    } catch (err) {
      console.error("Inventory error:", err);
      alert("Error saving item to inventory.");
    }
  };

  const handleEdit = (item) => {
    setEditItemId(item.id);
    setFormData({
      name: item.name || '',
      hsn: item.hsn || '',
      batchNo: item.batchNo || '',
      expiryDate: item.expiryDate || '',
      qty: item.qty || 0,
      rate: item.rate || 0,
      mrp: item.mrp || 0,
      gstPercent: item.gstPercent || 12
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'inventory', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 🔥 MARG ERP SMART EXPIRY STATUS CHECKER 🔥
  const getExpiryStatus = (expDateStr) => {
    if (!expDateStr) return { status: 'NORMAL', text: 'N/A', badgeClass: 'text-slate-400' };
    
    const today = new Date();
    const expDate = new Date(expDateStr);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { status: 'EXPIRED', text: 'EXPIRED', badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30' };
    } else if (diffDays <= 90) {
      return { status: 'NEAR_EXPIRY', text: `Exp in ${diffDays}d`, badgeClass: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' };
    }
    return { status: 'VALID', text: expDateStr, badgeClass: 'text-slate-300' };
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-8 text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center mb-1">
            <Package className="mr-3 text-blue-400" size={28} /> Pharma Inventory & Stock
          </h2>
          <p className="text-xs font-semibold text-slate-400">Total Items: {items.length} | Realtime Auto-Deduction Active</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search Medicine / Batch..." 
              className="w-full md:w-72 bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 text-white transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditItemId(null); setFormData({ name: '', hsn: '', batchNo: '', expiryDate: '', qty: '', rate: '', mrp: '', gstPercent: 12 }); setShowModal(true); }}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-colors shrink-0"
          >
            <Plus size={18} className="mr-2"/> Add Medicine
          </button>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="max-w-7xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold border-b border-slate-700">Medicine Name</th>
                <th className="p-4 font-bold border-b border-slate-700">Batch No</th>
                <th className="p-4 font-bold border-b border-slate-700">Expiry Date</th>
                <th className="p-4 font-bold border-b border-slate-700 text-center">Stock (Qty)</th>
                <th className="p-4 font-bold border-b border-slate-700 text-right">Purchase Rate</th>
                <th className="p-4 font-bold border-b border-slate-700 text-right">MRP</th>
                <th className="p-4 font-bold border-b border-slate-700 text-center">GST %</th>
                <th className="p-4 font-bold border-b border-slate-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500 font-bold">Loading Inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500 font-bold">No medicines found. Click "Add Medicine" to add stock.</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const expInfo = getExpiryStatus(item.expiryDate);
                  const isLowStock = Number(item.qty) <= 10;

                  return (
                    <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="p-4 font-black text-white">{item.name}</td>
                      <td className="p-4 font-bold text-slate-300 uppercase">{item.batchNo || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${expInfo.badgeClass}`}>
                          {expInfo.text}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isLowStock ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-900 text-emerald-400'}`}>
                          {item.qty} {isLowStock && '⚠️'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold">₹{Number(item.rate).toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-white">₹{Number(item.mrp).toFixed(2)}</td>
                      <td className="p-4 text-center font-semibold">{item.gstPercent}%</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-slate-700">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-slate-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MEDICINE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package size={20} className="mr-2 text-blue-400"/> {editItemId ? "Edit Medicine" : "Add New Medicine"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Medicine Name *</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white font-bold uppercase outline-none focus:border-blue-500" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. PARACETAMOL 650MG"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Batch Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white uppercase outline-none focus:border-blue-500" 
                    value={formData.batchNo} 
                    onChange={e => setFormData({...formData, batchNo: e.target.value})} 
                    placeholder="BATCH-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500" 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantity</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white font-bold outline-none focus:border-blue-500" 
                    value={formData.qty} 
                    onChange={e => setFormData({...formData, qty: e.target.value})} 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rate (Purchase)</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white font-bold outline-none focus:border-blue-500" 
                    value={formData.rate} 
                    onChange={e => setFormData({...formData, rate: e.target.value})} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">MRP</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white font-bold outline-none focus:border-blue-500" 
                    value={formData.mrp} 
                    onChange={e => setFormData({...formData, mrp: e.target.value})} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">HSN Code</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500" 
                    value={formData.hsn} 
                    onChange={e => setFormData({...formData, hsn: e.target.value})} 
                    placeholder="3004"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">GST %</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 font-bold cursor-pointer"
                    value={formData.gstPercent}
                    onChange={e => setFormData({...formData, gstPercent: e.target.value})}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition-colors">Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
