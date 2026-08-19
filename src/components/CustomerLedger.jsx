import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Plus, IndianRupee, FileText, Download } from 'lucide-react';

export default function CustomerLedger({ user, customer, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment add karne ke states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Firebase se customer ke saare transactions (Bills aur Payments) auto-fetch karna
  useEffect(() => {
    if (!user?.uid || !customer?.id) return;

    // Database query: Is customer ka saara data date ke hisaab se lao
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      where('customerId', '==', customer.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transData = [];
      snapshot.forEach(doc => {
        transData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(transData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, customer]);

  // Naya Payment (Jama) add karne ka function
  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        customerId: customer.id,
        customerName: customer.name,
        type: 'CREDIT', // CREDIT matlab customer ne paise jama karwaye
        amount: Number(paymentAmount),
        description: paymentNote || 'Payment Received (Cash/Online)',
        date: new Date().toISOString(),
        timestamp: serverTimestamp()
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (error) {
      console.error("Payment add error", error);
      alert("Error adding payment. Please try again.");
    }
  };

  // 🧮 TOTAL UDHAAR (BALANCE) CALCULATION 🧮
  // DEBIT (Bills) = Customer udhaar mein hai
  // CREDIT (Payments) = Customer ne paise de diye
  let totalBalance = 0;
  transactions.forEach(t => {
    if (t.type === 'DEBIT') totalBalance += Number(t.amount);
    if (t.type === 'CREDIT') totalBalance -= Number(t.amount);
  });

  return (
    <div className="bg-slate-900 min-h-screen text-slate-300 p-4 font-sans">
      
      {/* 1. HEADER & CUSTOMER DETAILS */}
      <div className="max-w-5xl mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-6">
        <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
          <div>
            <button onClick={onBack} className="flex items-center text-blue-400 hover:text-blue-300 font-bold mb-4 transition-colors">
              <ArrowLeft size={18} className="mr-2" /> Back to Customers
            </button>
            <h2 className="text-3xl font-black text-white uppercase">{customer?.name || 'Customer Name'}</h2>
            <p className="text-sm font-semibold mt-1">Phone: {customer?.phone || 'N/A'} | GSTIN: {customer?.gstin || 'N/A'}</p>
          </div>
          <div className={`p-4 rounded-lg text-right border ${totalBalance > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Outstanding</p>
            <h3 className={`text-3xl font-black ${totalBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              ₹{totalBalance > 0 ? totalBalance.toFixed(2) : '0.00'}
            </h3>
            {totalBalance > 0 && <p className="text-xs font-bold text-red-500 mt-1">Amount Due</p>}
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={() => setShowPaymentModal(true)} className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md">
            <IndianRupee size={18} className="mr-2" /> Receive Payment
          </button>
          <button className="flex items-center bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md">
            <Download size={18} className="mr-2" /> Download Statement
          </button>
        </div>
      </div>

      {/* 2. TRANSACTIONS TABLE */}
      <div className="max-w-5xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center">
            <FileText size={20} className="mr-2 text-blue-400" /> Account Statement
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-bold border-b border-slate-700">Date</th>
                <th className="p-4 font-bold border-b border-slate-700">Particulars (Description)</th>
                <th className="p-4 font-bold border-b border-slate-700 text-right">Debit (₹) <br/><span className="text-[10px] normal-case">(Bill Amount)</span></th>
                <th className="p-4 font-bold border-b border-slate-700 text-right">Credit (₹) <br/><span className="text-[10px] normal-case">(Payment Given)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">Loading Transactions...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500 font-bold">No transactions found for this customer.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 font-semibold text-sm">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-bold text-white text-sm">
                      {t.description}
                      {t.type === 'DEBIT' && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase">Invoice</span>}
                      {t.type === 'CREDIT' && <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">Payment</span>}
                    </td>
                    <td className="p-4 text-right font-black text-red-400">
                      {t.type === 'DEBIT' ? `₹${Number(t.amount).toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 text-right font-black text-emerald-400">
                      {t.type === 'CREDIT' ? `₹${Number(t.amount).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RECEIVE PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-bold text-white flex items-center">
                <IndianRupee size={20} className="mr-2 text-emerald-400"/> Receive Payment
              </h3>
            </div>
            <form onSubmit={handleAddPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount Received (₹)</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-black text-lg outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Mode / Notes</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Cash, UPI, Cheque No..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
