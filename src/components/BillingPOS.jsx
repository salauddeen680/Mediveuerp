import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { Save, Lock, ShieldAlert, LayoutTemplate, Printer, Zap } from 'lucide-react';
import logo from '../logo.png';

// SARE 5 TEMPLATES IMPORT
import ClassicTemplate from './Invoices/ClassicTemplate.jsx';
import ModernTemplate from './Invoices/ModernTemplate.jsx';
import CorporateTemplate from './Invoices/CorporateTemplate.jsx';
import ServiceTemplate from './Invoices/ServiceTemplate.jsx';
import CompactTemplate from './Invoices/CompactTemplate.jsx';

export default function BillingPOS({ data, user, showToast, editBill, setBillToEdit }) {
  const userStatus = data?.status || 'Active';
  const userPlan = data?.plan || '7 Days Free Trial';
  
  const createdAtRaw = data?.createdAt || Date.now();
  const createdAt = typeof createdAtRaw === 'object' && createdAtRaw?.seconds ? createdAtRaw.seconds * 1000 : createdAtRaw;
  let totalPlanDays = planString => {
    let s = String(planString).toLowerCase();
    if (s.includes('trial')) return 7;
    if (s.includes('monthly') || s.includes('249')) return 30;
    if (s.includes('yearly') || s.includes('2799')) return 365;
    if (s.includes('lifetime')) return 36500;
    return 7;
  };
  const expiryDate = createdAt + (totalPlanDays(userPlan) * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isLocked = userStatus === 'Suspended' || daysLeft <= 0;

  const [selectedTemplate, setSelectedTemplate] = useState(data?.templateName || 'classic');
  const storeSettings = data?.settings?.general || {
    storeName: 'PHARMA WHOLESALE', address: '13-2-47, OPP GOWDIYAMATAM, BACHELI', phone: '9999955559', gstin: '07CTMPM6999K1ZJ', dlNumber: 'DL11WW-6985'
  };

  const [invoiceDetails, setInvoiceDetails] = useState({ invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`, invoiceDate: new Date().toISOString().split('T')[0], stateCode: '07-DELHI', panNo: '', shippedGstin: '' });
  const [buyerDetails, setBuyerDetails] = useState({ name: 'Customer Name', address: 'KAROL BAGH, DELHI', gstin: '', state: '07-DELHI', transportParty: '', transportGstin: '', lrNo: '', lrDate: new Date().toISOString().split('T')[0] });
  const [bankDetails, setBankDetails] = useState({ bankName: 'PUNJAB & SIND BANK', branch: 'GEETA COLONY', accountNo: '06261100054752', ifsc: 'PSIB0000626' });
  const [amountInWords, setAmountInWords] = useState('');
  const [terms, setTerms] = useState("1. Goods once sold will not be taken back.\n2. Bills not paid due date attract 24% interest.");
  const [items, setItems] = useState([{ id: 1, code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }]);
  const [totals, setTotals] = useState({ taxableValue: 0, discount: 0, cgst: 0, sgst: 0, igst: 0, roundoff: 0, grandTotal: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // 📦 INVENTORY FETCH FOR BARCODE & AUTOCOMPLETE 📦
  const [inventoryList, setInventoryList] = useState([]);
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'inventory'), (snap) => {
      setInventoryList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  // Edit Bill Load
  useEffect(() => {
    if (editBill) {
      setSelectedTemplate(editBill.templateName || 'classic');
      if (editBill.invoiceDetails) setInvoiceDetails(editBill.invoiceDetails);
      if (editBill.buyerDetails) setBuyerDetails(editBill.buyerDetails);
      if (editBill.bankDetails) setBankDetails(editBill.bankDetails);
      if (editBill.items?.length) setItems(editBill.items);
      if (editBill.amountInWords) setAmountInWords(editBill.amountInWords);
      if (editBill.terms) setTerms(editBill.terms);
    }
  }, [editBill]); 

  // Calculations
  useEffect(() => {
    let tValue = 0, tDiscount = 0, tGst = 0;
    items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      let disP = Number(item.disPercent) || 0;
      if (disP < 0) disP = 0; if (disP > 100) disP = 100;
      const gstP = Number(item.gstPercent) || 0;
      const baseAmt = qty * rate;
      const disAmt = baseAmt * (disP / 100);
      const gstAmt = (baseAmt - disAmt) * (gstP / 100);
      tValue += baseAmt; tDiscount += disAmt; tGst += gstAmt;
    });
    const amountBeforeGst = tValue - tDiscount;
    const exactTotal = amountBeforeGst + tGst;
    const grandTotal = Math.round(exactTotal);
    setTotals({ taxableValue: amountBeforeGst, discount: tDiscount, cgst: tGst / 2, sgst: tGst / 2, igst: 0, roundoff: grandTotal - exactTotal, grandTotal });
  }, [items]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'disPercent') { let n = Number(value); if (n > 100) value = 100; if (n < 0) value = 0; }
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => setItems([...items, { id: Date.now(), code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }]);
  const removeRow = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const handleSaveBill = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const billData = { invoiceDetails, buyerDetails, bankDetails, amountInWords, terms, items, totals, templateName: selectedTemplate };
      if (editBill?.id) {
        await updateDoc(doc(db, 'users', user.uid, 'bills', editBill.id), { ...billData, updatedAt: serverTimestamp() });
        showToast('Invoice Updated Successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'bills'), { ...billData, createdAt: serverTimestamp() });
        
        // Ledger Entry: Bill banne par customer ke khate mein udhaar (DEBIT) chadhana
        if (buyerDetails.name && buyerDetails.name !== 'Customer Name') {
            await addDoc(collection(db, 'users', user.uid, 'transactions'), {
                customerId: buyerDetails.name, // Ideal: use actual customer ID
                customerName: buyerDetails.name,
                type: 'DEBIT',
                amount: totals.grandTotal,
                description: `Invoice ${invoiceDetails.invoiceNumber}`,
                date: new Date().toISOString(),
                timestamp: serverTimestamp()
            });
        }

        showToast('New Invoice Saved Successfully!');
        for (const item of items) {
          if (item.description && item.qty > 0) {
            const q = query(collection(db, 'users', user.uid, 'inventory'), where('name', '==', item.description));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const invDoc = snap.docs[0];
              const newQty = (invDoc.data().qty || 0) - Number(item.qty);
              await updateDoc(doc(db, 'users', user.uid, 'inventory', invDoc.id), { qty: newQty < 0 ? 0 : newQty });
            }
          }
        }
      }
      if (setBillToEdit) setBillToEdit(null); 
    } catch (error) { console.error(error); showToast('Error saving invoice', 'error'); }
    setIsProcessing(false);
  };

  // 🔥 MARG ERP MAGIC: KEYBOARD SHORTCUTS & BARCODE SCANNER 🔥
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const currentTime = Date.now();
      
      // 1. F2 to SAVE BILL
      if (e.key === 'F2') {
        e.preventDefault();
        handleSaveBill();
      }
      // 2. F4 to PRINT BILL
      if (e.key === 'F4') {
        e.preventDefault();
        window.print();
      }

      // 3. ENTER TO NEXT FIELD (Skip Textareas to allow multi-line)
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const timeDiff = currentTime - lastKeyTime.current;
        // Agar typing speed slow hai, matlab insaan type kar raha hai (Barcode nahi hai)
        if (timeDiff > 50) {
          e.preventDefault();
          const formElements = Array.from(document.querySelectorAll('input, select, button'));
          const index = formElements.indexOf(e.target);
          if (index > -1 && index < formElements.length - 1) {
            formElements[index + 1].focus(); // Move to next input
          }
        }
      }

      // 4. BARCODE SCANNER LOGIC (Speedy typing capture)
      const timeDiff = currentTime - lastKeyTime.current;
      if (timeDiff < 50) {
        if (e.key === 'Enter') {
          // Scanner complete reading
          const code = barcodeBuffer.current;
          if (code) {
            const foundItem = inventoryList.find(i => i.batchNo === code || i.hsn === code || i.name.includes(code));
            if (foundItem) {
              // Add item to bill automatically
              setItems(prev => {
                const last = prev[prev.length - 1];
                const newItem = { id: Date.now(), code: foundItem.batchNo, description: foundItem.name, hsn: foundItem.hsn, qty: 1, rate: foundItem.rate, disPercent: 0, gstPercent: foundItem.gstPercent };
                if (!last.description && !last.rate) {
                  const arr = [...prev]; arr[arr.length - 1] = newItem; return arr; // Replace empty row
                }
                return [...prev, newItem]; // Add new row
              });
              showToast(`Barcode Scanned: ${foundItem.name}`);
            }
          }
          barcodeBuffer.current = ""; // Clear buffer
        } else if (e.key.length === 1) {
          barcodeBuffer.current += e.key;
        }
      } else {
        if (e.key.length === 1) barcodeBuffer.current = e.key; // Reset for new typing
      }
      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [inventoryList, items, invoiceDetails]); // Dependencies updated

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full">
          <ShieldAlert className="text-red-500 mx-auto mb-4" size={40} />
          <h2 className="text-3xl font-bold text-white mb-3">Access Locked</h2>
        </div>
      </div>
    );
  }

  const commonProps = { logo, storeSettings, invoiceDetails, setInvoiceDetails, buyerDetails, setBuyerDetails, bankDetails, setBankDetails, amountInWords, setAmountInWords, terms, setTerms, items, handleItemChange, addRow, removeRow, totals };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans print:bg-white print:p-0">
      
      {/* HEADER & SHORTCUT INFO */}
      <div className="max-w-[210mm] mx-auto mb-4 flex flex-col md:flex-row justify-between items-center bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl print:hidden shadow-lg gap-4">
        <div className="flex gap-4">
          <span className="text-sm font-medium text-slate-400">Plan: <span className="text-white font-bold">{userPlan}</span></span>
          <span className="text-xs font-bold px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full">⏳ {daysLeft} Days</span>
        </div>
        <div className="flex gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="flex items-center"><Zap size={12} className="text-yellow-400 mr-1"/> Shortcuts:</span>
          <span><b className="text-white">ENTER</b> = Next Box</span>
          <span><b className="text-emerald-400">F2</b> = Save</span>
          <span><b className="text-blue-400">F4</b> = Print</span>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 print:hidden shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <LayoutTemplate className="text-blue-400 shrink-0" size={24} />
          <select className="bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-2 outline-none cursor-pointer font-semibold" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
            <option value="classic">1. Classic GST</option>
            <option value="modern">2. Modern Minimal</option>
            <option value="corporate">3. Corporate Blue</option>
            <option value="service">4. Service / Freelance</option>
            <option value="compact">5. Compact Retail</option>
          </select>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => window.print()} className="flex items-center bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md">
            <Printer size={18} className="mr-2" /> Print (F4)
          </button>
          <button onClick={handleSaveBill} disabled={isProcessing} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md disabled:opacity-50">
            <Save size={18} className="mr-2" /> {editBill ? "Update Bill" : "Save to Cloud (F2)"}
          </button>
        </div>
      </div>

      {/* LIVE INVOICE TEMPLATE */}
      <div className="w-full">
        {selectedTemplate === 'classic' && <ClassicTemplate {...commonProps} />}
        {selectedTemplate === 'modern' && <ModernTemplate {...commonProps} />}
        {selectedTemplate === 'corporate' && <CorporateTemplate {...commonProps} />}
        {selectedTemplate === 'service' && <ServiceTemplate {...commonProps} />}
        {selectedTemplate === 'compact' && <CompactTemplate {...commonProps} />}
      </div>
      
    </div>
  );
}
