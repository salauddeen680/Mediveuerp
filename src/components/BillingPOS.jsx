import React, { useState } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { renderMargInvoice } from '../utils/invoiceTemplate';

export default function BillingPOS({ data, showToast, user }) {
  const { medicines, bills, settings } = data;
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('M/s GUPTA STORE');
  const [customerAddress, setCustomerAddress] = useState('SHOP NO.2, KAROL BAGH, DELHI - 110006');
  const [customerGstin, setCustomerGstin] = useState('07CTMPM8957K1ZU');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const storeSettings = settings?.general || {
    storeName: 'PHARMA WHOLESALE',
    address: '13-2-47, OPP GOWDIPAMATAM, BACHELI',
    phone: '9999955559',
    gstin: '07CTMPM699K1ZJ',
    dlNumber: 'DL11WW-6985'
  };

  const filteredMeds = searchTerm 
    ? medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.barcode === searchTerm)
    : [];

  const addToCart = (med) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      if (existing.qty >= med.stock) {
        showToast(`Only ${med.stock} in stock!`, 'error');
        return;
      }
      setCart(cart.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      if (med.stock < 1) {
        showToast('Out of stock!', 'error');
        return;
      }
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

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    const med = medicines.find(m => m.id === id);
    if (med && newQty > med.stock) {
       showToast(`Only ${med.stock} in stock!`, 'error');
       return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

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
    setIsProcessing(true);

    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const billCount = bills.length + 1;
      const billNo = `A0000${billCount}`;

      const billData = {
        billNo,
        date: dateStr,
        timestamp: serverTimestamp(),
        createdAt: Date.now(),
        customerName: customerName || 'M/s GUPTA STORE',
        customerAddress,
        customerGstin,
        items: cart,
        subtotal,
        discountPercent,
        discountAmount,
        taxableTotal,
        totalSgst,
        totalCgst,
        total: finalTotal,
        storeInfo: storeSettings,
        status: 'PAID'
      };

      await addDoc(collection(db, 'users', user.uid, 'bills'), billData);

      for (const item of cart) {
        if(item.id) {
          const medRef = doc(db, 'users', user.uid, 'medicines', item.id);
          const newStock = Number(item.stock || 0) - item.qty;
          await updateDoc(medRef, { stock: newStock });
        }
      }

      showToast('Invoice generated successfully!');
      setActiveInvoice(billData);
      setCart([]);
    } catch (error) {
      console.error(error);
      showToast('Failed to generate invoice', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => window.print();
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Invoice *${activeInvoice?.billNo}* from *${storeSettings.storeName}*. Total Amount: ₹${activeInvoice?.total.toFixed(2)}. Thank you!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        {/* Search Bar */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 relative z-20">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search medicine by name or barcode..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50">
              {filteredMeds.length > 0 ? (
                filteredMeds.map(med => (
                  <div 
                    key={med.id} 
                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 flex justify-between items-center"
                    onClick={() => addToCart(med)}
                  >
                    <div>
                      <div className="font-medium text-white">{med.name}</div>
                      <div className="text-xs text-slate-400">Batch: {med.batch} | Exp: {med.expiry}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-400 font-bold">₹{med.mrp}</div>
                      <div className={`text-xs ${med.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>{med.stock} in stock</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-slate-400 text-center">No medicines found in inventory.</div>
              )}
            </div>
          )}
        </div>

        {/* POS Items Table */}
        <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Billing Items (Marg Style POS)</h3>
            <span className="text-sm text-slate-400">{cart.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase border-b border-slate-700 sticky top-0">
                <tr>
                  <th className="px-3 py-3">S.</th>
                  <th className="px-3 py-3">Qty</th>
                  <th className="px-3 py-3">Pack</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Batch</th>
                  <th className="px-3 py-3">Exp</th>
                  <th className="px-3 py-3">HSN</th>
                  <th className="px-3 py-3">MRP</th>
                  <th className="px-3 py-3">Rate</th>
                  <th className="px-3 py-3">DIS</th>
                  <th className="px-3 py-3">SGST</th>
                  <th className="px-3 py-3">CGST</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan="14" className="text-center py-12 text-slate-500">Cart is empty. Search items above to add.</td></tr>
                ) : (
                  cart.map((item, idx) => {
                    const itemNet = (item.qty * item.originalPrice) * (1 - discountPercent/100);
                    const gstRate = Number(item.gst) || 12;
                    return (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="px-3 py-3">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center cursor-pointer">-</button>
                            <span className="w-6 text-center font-bold">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center cursor-pointer">+</button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-300">{item.pack || '10T'}</td>
                        <td className="px-3 py-3 font-medium text-white">{item.name}</td>
                        <td className="px-3 py-3 text-slate-300">{item.batch}</td>
                        <td className="px-3 py-3 text-slate-300">{item.expiry}</td>
                        <td className="px-3 py-3 text-slate-300">{item.hsn}</td>
                        <td className="px-3 py-3 text-slate-300">₹{item.mrp}</td>
                        <td className="px-3 py-3 text-slate-300">₹{item.originalPrice}</td>
                        <td className="px-3 py-3 text-slate-300">{discountPercent}%</td>
                        <td className="px-3 py-3 text-slate-300">{gstRate/2}%</td>
                        <td className="px-3 py-3 text-slate-300">{gstRate/2}%</td>
                        <td className="px-3 py-3 text-right font-medium text-teal-400">₹{itemNet.toFixed(2)}</td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 cursor-pointer"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar Totals & Buyer Info */}
      <div className="w-full md:w-80 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex flex-col h-full overflow-y-auto">
        <h3 className="font-semibold text-white border-b border-slate-700 pb-3 mb-4">Buyer Details</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs text-slate-400">Party Name</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Party GSTIN</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Party Address</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
          </div>
        </div>

        <h3 className="font-semibold text-white border-b border-slate-700 pb-3 mb-4 mt-auto">Invoice Totals</h3>
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Discount (%)</span>
            <input 
              type="number" 
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white" 
              value={discountPercent} 
              onChange={e => setDiscountPercent(Number(e.target.value))}
              min="0" max="100"
            />
          </div>
          <div className="flex justify-between text-slate-400 text-xs">
            <span>SGST / CGST</span>
            <span>₹{totalSgst.toFixed(2)} / ₹{totalCgst.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-lg text-white">
            <span>Grand Total</span>
            <span className="text-teal-400">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <button 
          className="w-full py-3 font-bold bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-lg shadow-md hover:from-teal-600 hover:to-green-600 transition-all cursor-pointer disabled:opacity-50" 
          onClick={handleGenerateBill} 
          disabled={cart.length === 0 || isProcessing}
        >
          {isProcessing ? 'Generating...' : 'Save & Generate Bill'}
        </button>
      </div>

      {/* Invoice Modal Preview */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button onClick={() => setActiveInvoice(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold text-lg cursor-pointer">✕</button>
            <h2 className="text-xl font-bold text-white mb-4">Generated Invoice Preview</h2>
            {renderMargInvoice(activeInvoice, handlePrint, handleShareWhatsApp)}
          </div>
        </div>
      )}
    </div>
  );
}

