import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ShoppingCart, Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function PurchaseEntry({ user, onNavigate, preSelectedSupplier }) {
  const [suppliers, setSuppliers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bill Details State
  const [billDetails, setBillDetails] = useState({
    supplierId: preSelectedSupplier?.id || '',
    supplierName: preSelectedSupplier?.name || '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
  });

  // Items State
  const [items, setItems] = useState([
    { id: 1, name: '', batchNo: '', expiryDate: '', qty: 0, rate: 0, mrp: 0, gstPercent: 12 }
  ]);

  const [totals, setTotals] = useState({
    taxableValue: 0, cgst: 0, sgst: 0, grandTotal: 0
  });

  // 1. Fetch Suppliers Dropdown
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'suppliers'), (snapshot) => {
      const suppData = [];
      snapshot.forEach(doc => suppData.push({ id: doc.id, ...doc.data() }));
      setSuppliers(suppData);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Auto-Calculate Totals
  useEffect(() => {
    let tValue = 0, tGst = 0;
    items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const gstP = Number(item.gstPercent) || 0;
      
      const baseAmt = qty * rate;
      const gstAmt = baseAmt * (gstP / 100);
      
      tValue += baseAmt;
      tGst += gstAmt;
    });

    setTotals({
      taxableValue: tValue,
      cgst: tGst / 2,
      sgst: tGst / 2,
      grandTotal: Math.round(tValue + tGst)
    });
  }, [items]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => setItems([...items, { id: Date.now(), name: '', batchNo: '', expiryDate: '', qty: 0, rate: 0, mrp: 0, gstPercent: 12 }]);
  const removeRow = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  // 3. MASTER SAVE LOGIC (Purchase + Inventory + Ledger)
  const handleSavePurchase = async () => {
    if (!billDetails.supplierName) return alert("Please select a Supplier!");
    if (!billDetails.invoiceNumber) return alert("Please enter the Bill/Invoice Number!");
    if (items[0].name === '') return alert("Please add at least one medicine!");

    setIsProcessing(true);
    try {
      // A. Save Purchase Bill
      await addDoc(collection(db, 'users', user.uid, 'purchases'), {
        billDetails,
        items,
        totals,
        createdAt: serverTimestamp()
      });

      // B. Update Inventory (Auto-Plus Stock)
      for (const item of items) {
        if (item.name && item.qty > 0) {
          // Check if medicine with same batch already exists
          const q = query(
            collection(db, 'users', user.uid, 'inventory'), 
            where('name', '==', item.name.toUpperCase()),
            where('batchNo', '==', item.batchNo.toUpperCase())
          );
          const snap = await getDocs(q);

          if (!snap.empty) {
            // Update existing stock
            const invDoc = snap.docs[0];
            const oldQty = Number(invDoc.data().qty) || 0;
            await updateDoc(doc(db, 'users', user.uid, 'inventory', invDoc.id), {
              qty: oldQty + Number(item.qty),
              rate: Number(item.rate), // Update to new purchase rate
              mrp: Number(item.mrp),
              expiryDate: item.expiryDate || invDoc.data().expiryDate
            });
          } else {
            // Add as new stock item
            await addDoc(collection(db, 'users', user.uid, 'inventory'), {
              name: item.name.toUpperCase(),
              batchNo: item.batchNo.toUpperCase() || 'N/A',
              expiryDate: item.expiryDate,
              qty: Number(item.qty),
              rate: Number(item.rate),
              mrp: Number(item.mrp),
              gstPercent: Number(item.gstPercent),
              createdAt: serverTimestamp()
            });
          }
        }
      }

      // C. Update Supplier Ledger (Khata) - Hum par udhaar chadha
      await addDoc(collection(db, 'users', user.uid, 'supplier_transactions'), {
        supplierId: billDetails.supplierId,
        supplierName: billDetails.supplierName,
        type: 'DEBIT', // Humne maal kharida, paise dene baaki hain
        amount: totals.grandTotal,
        description: `Purchase Bill: ${billDetails.invoiceNumber}`,
        date: billDetails.invoiceDate,
        timestamp: serverTimestamp()
      });

      alert('Purchase Bill Saved! Stock automatically added to Inventory.');
      if (onNavigate) onNavigate('suppliers'); // Go back to suppliers page

    } catch (error) {
      console.error("Error saving purchase:", error);
      alert('Error saving purchase bill!');
    }
    setIsProcessing(false);
  };

  const fiClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm transition-colors uppercase font-bold";
  const flClass = "block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="bg-slate-900 min-h-screen p-4 md:p-8 text-slate-300 font-sans">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
        <div>
          <button onClick={() => onNavigate && onNavigate('suppliers')} className="flex items-center text-blue-400 hover:text-blue-300 font-bold mb-2 transition-colors text-sm">
            <ArrowLeft size={16} className="mr-1" /> Back to Suppliers
          </button>
          <h2 className="text-2xl font-black text-white flex items-center">
            <ShoppingCart className="mr-3 text-blue-400" size={28} /> Purchase Bill Entry
          </h2>
        </div>
        
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Bill Value</p>
          <div className="text-3xl font-black text-emerald-400">₹{totals.grandTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* BILL DETAILS FORM */}
      <div className="max-w-6xl mx-auto bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm mb-6">
        <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2">1. Distributor & Bill Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={flClass}>Select Distributor / Supplier</label>
            <select 
              className={fiClass}
              value={billDetails.supplierName}
              onChange={(e) => {
                const supp = suppliers.find(s => s.name === e.target.value);
                setBillDetails({...billDetails, supplierName: e.target.value, supplierId: supp?.id || ''});
              }}
            >
              <option value="">-- SELECT SUPPLIER --</option>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={flClass}>Supplier Invoice No.</label>
            <input type="text" className={fiClass} placeholder="e.g. INV-9988" value={billDetails.invoiceNumber} onChange={e => setBillDetails({...billDetails, invoiceNumber: e.target.value})} />
          </div>
          <div>
            <label className={flClass}>Bill Date</label>
            <input type="date" className={fiClass} value={billDetails.invoiceDate} onChange={e => setBillDetails({...billDetails, invoiceDate: e.target.value})} />
          </div>
        </div>
      </div>

      {/* ITEMS ARRAY */}
      <div className="max-w-6xl mx-auto bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm mb-6">
        <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2">2. Received Medicines (Stock Entry)</h3>
        
        {items.map((item, index) => (
          <div key={item.id} className="p-4 bg-slate-900 border border-slate-700 rounded-lg mb-4 relative shadow-inner">
            {items.length > 1 && (
              <button onClick={() => removeRow(index)} className="absolute top-3 right-3 text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"><Trash2 size={18} /></button>
            )}
            <div className="grid grid-cols-2 md:grid-cols-8 gap-3 pr-8 md:pr-0">
              <div className="col-span-2 md:col-span-2"><label className={flClass}>Medicine Name</label><input type="text" className={fiClass} value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} placeholder="Item Name"/></div>
              <div><label className={flClass}>Batch No</label><input type="text" className={fiClass} value={item.batchNo} onChange={e => handleItemChange(index, 'batchNo', e.target.value)} /></div>
              <div><label className={flClass}>Expiry</label><input type="date" className={fiClass} value={item.expiryDate} onChange={e => handleItemChange(index, 'expiryDate', e.target.value)} /></div>
              <div><label className={flClass}>Qty Received</label><input type="number" className={fiClass} value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} /></div>
              <div><label className={flClass}>Purch. Rate</label><input type="number" className={fiClass} value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} /></div>
              <div><label className={flClass}>MRP</label><input type="number" className={fiClass} value={item.mrp} onChange={e => handleItemChange(index, 'mrp', e.target.value)} /></div>
              <div><label className={flClass}>GST %</label>
                <select className={fiClass} value={item.gstPercent} onChange={e => handleItemChange(index, 'gstPercent', e.target.value)}>
                  <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <button onClick={addRow} className="w-full flex justify-center items-center text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 py-3 rounded-lg border border-blue-500/20 font-bold transition-colors border-dashed mt-4">
          <Plus size={18} className="mr-2"/> Add Another Medicine
        </button>
      </div>

      {/* SAVE BUTTON */}
      <div className="max-w-6xl mx-auto flex justify-end">
        <button 
          onClick={handleSavePurchase} 
          disabled={isProcessing}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 text-lg"
        >
          <Save size={20} className="mr-2" /> {isProcessing ? 'Saving to Inventory...' : 'Save Purchase Bill & Update Stock'}
        </button>
      </div>

    </div>
  );
}
