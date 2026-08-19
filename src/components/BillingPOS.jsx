import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { Save, Lock, ShieldAlert, LayoutTemplate, Printer, Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import logo from '../logo.png';

// SARE 5 TEMPLATES IMPORT
import ClassicTemplate from './Invoices/ClassicTemplate.jsx';
import ModernTemplate from './Invoices/ModernTemplate.jsx';
import CorporateTemplate from './Invoices/CorporateTemplate.jsx';
import ServiceTemplate from './Invoices/ServiceTemplate.jsx';
import CompactTemplate from './Invoices/CompactTemplate.jsx';

export default function BillingPOS({ data, user, showToast, editBill, setBillToEdit }) {
  // SAAS ACCESS CONTROL
  const userStatus = data?.status || 'Active';
  const userPlan = data?.plan || '7 Days Free Trial';
  
  const createdAtRaw = data?.createdAt || Date.now();
  const createdAt = typeof createdAtRaw === 'object' && createdAtRaw?.seconds 
    ? createdAtRaw.seconds * 1000 
    : createdAtRaw;

  let totalPlanDays = 0;
  const planString = String(userPlan).toLowerCase();
  if (planString.includes('7 days') || planString.includes('trial')) totalPlanDays = 7;
  else if (planString.includes('monthly') || planString.includes('249')) totalPlanDays = 30;
  else if (planString.includes('yearly') || planString.includes('2799')) totalPlanDays = 365;
  else if (planString.includes('lifetime')) totalPlanDays = 36500;
  else totalPlanDays = 7;

  const expiryDate = createdAt + (totalPlanDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isPlanExpired = daysLeft <= 0;
  const isLocked = userStatus === 'Suspended' || isPlanExpired;

  // 🔥 NEW STATE: DUAL MODE (Form or Preview) 🔥
  const [viewMode, setViewMode] = useState('form'); // 'form' | 'preview'

  // TEMPLATE SELECTION STATE
  const [selectedTemplate, setSelectedTemplate] = useState(data?.templateName || 'classic');

  // STORE SETTINGS
  const storeSettings = data?.settings?.general || {
    storeName: 'PHARMA WHOLESALE',
    address: '13-2-47, OPP GOWDIYAMATAM, BEHIND FOOTBALL GROUND, BACHELI',
    phone: '9999955559, 9999988877',
    gstin: '07CTMPM6999K1ZJ',
    dlNumber: 'DL11WW-6985'
  };

  // STATES
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    stateCode: '07-DELHI',
    panNo: '',
    shippedGstin: '',
  });

  const [buyerDetails, setBuyerDetails] = useState({
    name: 'Customer Name',
    address: 'SHOP NO.2, KAROL BAGH, DELHI - 110006',
    gstin: '07CTMPM8957K1ZU',
    state: '07-DELHI',
    transportParty: 'M/s GUPTA STORE',
    transportGstin: '',
    lrNo: '',
    lrDate: new Date().toISOString().split('T')[0],
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: 'PUNJAB & SIND BANK',
    branch: 'GEETA COLONY',
    accountNo: '06261100054752',
    ifsc: 'PSIB0000626'
  });
  const [amountInWords, setAmountInWords] = useState('');
  const [terms, setTerms] = useState("1. Goods once sold will not be taken back.\n2. Bills not paid due date attract 24% interest.");

  const [items, setItems] = useState([
    { id: 1, code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }
  ]);

  const [totals, setTotals] = useState({
    taxableValue: 0, discount: 0, cgst: 0, sgst: 0, igst: 0, roundoff: 0, grandTotal: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Load Edit Data
  useEffect(() => {
    if (editBill) {
      setSelectedTemplate(editBill.templateName || data?.templateName || 'classic');
      if (editBill.invoiceDetails) setInvoiceDetails(editBill.invoiceDetails);
      if (editBill.buyerDetails) setBuyerDetails(editBill.buyerDetails);
      if (editBill.bankDetails) setBankDetails(editBill.bankDetails);
      if (editBill.items && editBill.items.length > 0) setItems(editBill.items);
      if (editBill.amountInWords) setAmountInWords(editBill.amountInWords);
      if (editBill.terms) setTerms(editBill.terms);
    }
  }, [editBill, data]); 

  // Calculations
  useEffect(() => {
    let tValue = 0, tDiscount = 0, tGst = 0;
    items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      let disP = Number(item.disPercent) || 0;
      if (disP < 0) disP = 0;
      if (disP > 100) disP = 100;
      const gstP = Number(item.gstPercent) || 0;

      const baseAmount = qty * rate;
      const disAmount = baseAmount * (disP / 100);
      const afterDis = baseAmount - disAmount;
      const gstAmount = afterDis * (gstP / 100);

      tValue += baseAmount;
      tDiscount += disAmount;
      tGst += gstAmount;
    });

    const amountBeforeGst = tValue - tDiscount;
    const exactTotal = amountBeforeGst + tGst;
    const grandTotal = Math.round(exactTotal);
    
    setTotals({
      taxableValue: amountBeforeGst,
      discount: tDiscount,
      cgst: tGst / 2, 
      sgst: tGst / 2,
      igst: 0,
      roundoff: grandTotal - exactTotal,
      grandTotal: grandTotal
    });
  }, [items]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'disPercent') {
      let numVal = Number(value);
      if (numVal > 100) value = 100;
      if (numVal < 0) value = 0;
    }
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => setItems([...items, { id: Date.now(), code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }]);
  const removeRow = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const handleSaveBill = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const billDataToSave = {
        invoiceDetails, buyerDetails, bankDetails, amountInWords, terms, items, totals, templateName: selectedTemplate, 
      };

      if (editBill && editBill.id) {
        const billRef = doc(db, 'users', user.uid, 'bills', editBill.id);
        await updateDoc(billRef, { ...billDataToSave, updatedAt: serverTimestamp() });
        showToast('Invoice Updated Successfully!');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'bills'), { ...billDataToSave, createdAt: serverTimestamp() });
        showToast('New Invoice Saved Successfully!');

        // INVENTORY AUTO-DEDUCTION LOGIC
        for (const item of items) {
          if (item.description && item.qty > 0) {
            const inventoryRef = collection(db, 'users', user.uid, 'inventory');
            const q = query(inventoryRef, where('name', '==', item.description));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const invDoc = querySnapshot.docs[0];
              const currentQty = invDoc.data().qty || 0;
              const newQty = currentQty - Number(item.qty);
              await updateDoc(doc(db, 'users', user.uid, 'inventory', invDoc.id), {
                qty: newQty < 0 ? 0 : newQty 
              });
            }
          }
        }
      }
      if (setBillToEdit) setBillToEdit(null); 
    } catch (error) {
      console.error(error);
      showToast('Error saving invoice', 'error');
    }
    setIsProcessing(false);
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl shadow-2xl max-w-lg w-full">
          <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            {userStatus === 'Suspended' ? <ShieldAlert className="text-red-500" size={40} /> : <Lock className="text-red-500" size={40} />}
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Access Locked</h2>
          <p className="text-slate-400 mb-8 text-lg">Your account requires an active subscription.</p>
        </div>
      </div>
    );
  }

  const commonProps = {
    logo, storeSettings, invoiceDetails, setInvoiceDetails, buyerDetails, setBuyerDetails, bankDetails, setBankDetails,
    amountInWords, setAmountInWords, terms, setTerms, items, handleItemChange, addRow, removeRow, totals
  };

  // Form Input Style Helpers
  const fiClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 text-sm transition-colors";
  const flClass = "block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-slate-900 p-2 md:p-8 font-sans print:bg-white print:p-0">
      
      {/* TOP HEADER */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">Current Plan: <span className="text-white font-bold ml-1">{userPlan}</span></span>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
           ⏳ {daysLeft} Days Remaining
        </div>
      </div>

      {/* CONTROLS (Template & Save) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 print:hidden shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <LayoutTemplate className="text-blue-400 shrink-0" size={24} />
          <select 
            className="bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-2 outline-none cursor-pointer font-semibold w-full sm:w-auto"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="classic">1. Classic GST</option>
            <option value="modern">2. Modern Minimal</option>
            <option value="corporate">3. Corporate Blue</option>
            <option value="service">4. Service / Freelance</option>
            <option value="compact">5. Compact Retail</option>
          </select>
        </div>

        <button 
          onClick={handleSaveBill} 
          disabled={isProcessing} 
          className="w-full sm:w-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <Save size={18} className="mr-2" /> {editBill ? "Update Bill" : "Save to Cloud"}
        </button>
      </div>

      {/* 🔥 THE MAGIC: DUAL MODE TABS 🔥 */}
      <div className="max-w-[210mm] mx-auto mb-6 flex bg-slate-800 p-1.5 rounded-xl border border-slate-700 print:hidden shadow-lg">
        <button 
          onClick={() => setViewMode('form')} 
          className={`flex-1 flex justify-center items-center py-2.5 rounded-lg font-bold transition-all ${viewMode === 'form' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
        >
          <Edit3 size={18} className="mr-2" /> 1. Data Entry Form
        </button>
        <button 
          onClick={() => setViewMode('preview')} 
          className={`flex-1 flex justify-center items-center py-2.5 rounded-lg font-bold transition-all ${viewMode === 'preview' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
        >
          <Eye size={18} className="mr-2" /> 2. View & PDF
        </button>
      </div>

      {/* ========================================= */}
      {/* MODE 1: DATA ENTRY FORM (Easy Mobile Typing) */}
      {/* ========================================= */}
      {viewMode === 'form' && (
        <div className="max-w-[210mm] mx-auto space-y-4 print:hidden">
          
          {/* Section 1: Invoice Details */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex items-center"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span> Invoice Meta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={flClass}>Invoice No</label><input type="text" className={fiClass} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
              <div><label className={flClass}>Date</label><input type="date" className={fiClass} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
              <div><label className={flClass}>State Code</label><input type="text" className={`${fiClass} uppercase`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
              <div><label className={flClass}>PAN No</label><input type="text" className={`${fiClass} uppercase`} value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} /></div>
            </div>
          </div>

          {/* Section 2: Customer Details */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex items-center"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span> Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={flClass}>Customer Name</label><input type="text" className={`${fiClass} uppercase font-bold`} value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div><label className={flClass}>GSTIN</label><input type="text" className={`${fiClass} uppercase`} value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
              <div className="md:col-span-2"><label className={flClass}>Address</label><input type="text" className={`${fiClass} uppercase`} value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
            </div>
          </div>

          {/* Section 3: Transport */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex items-center"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">3</span> Transport Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2"><label className={flClass}>Transporter Name</label><input type="text" className={`${fiClass} uppercase`} value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
              <div className="col-span-2"><label className={flClass}>Veh/GSTIN</label><input type="text" className={`${fiClass} uppercase`} value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
              <div className="col-span-1 md:col-span-2"><label className={flClass}>L.R No</label><input type="text" className={`${fiClass} uppercase`} value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
              <div className="col-span-1 md:col-span-2"><label className={flClass}>L.R Date</label><input type="date" className={fiClass} value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
            </div>
          </div>

          {/* Section 4: Items Array */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
              <h3 className="text-white font-bold flex items-center"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">4</span> Bill Items</h3>
              <div className="text-lg font-black text-emerald-400">Total: ₹{totals.grandTotal.toFixed(2)}</div>
            </div>
            
            {items.map((item, index) => (
              <div key={item.id} className="p-4 bg-slate-900 border border-slate-700 rounded-lg mb-4 relative shadow-inner">
                {items.length > 1 && (
                  <button onClick={() => removeRow(index)} className="absolute top-3 right-3 text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"><Trash2 size={18} /></button>
                )}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pr-8 md:pr-0">
                  <div className="col-span-2 md:col-span-3"><label className={flClass}>Description</label><input type="text" className={`${fiClass} uppercase font-bold`} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Item Name"/></div>
                  <div><label className={flClass}>Code/HSN</label><input type="text" className={fiClass} value={item.hsn} onChange={e => handleItemChange(index, 'hsn', e.target.value)} /></div>
                  <div><label className={flClass}>Qty</label><input type="number" className={fiClass} value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} /></div>
                  <div><label className={flClass}>Rate</label><input type="number" className={fiClass} value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} /></div>
                  <div><label className={flClass}>Dis %</label><input type="number" className={fiClass} value={item.disPercent} onChange={e => handleItemChange(index, 'disPercent', e.target.value)} /></div>
                  <div><label className={flClass}>GST %</label><input type="number" className={fiClass} value={item.gstPercent} onChange={e => handleItemChange(index, 'gstPercent', e.target.value)} /></div>
                </div>
              </div>
            ))}
            <button onClick={addRow} className="w-full flex justify-center items-center text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 py-3 rounded-lg border border-blue-500/20 font-bold transition-colors border-dashed">
              <Plus size={18} className="mr-2"/> Add Another Item
            </button>
          </div>

          {/* Section 5: Bank & Terms */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
            <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2 flex items-center"><span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">5</span> Bank & Terms</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><label className={flClass}>Bank Name</label><input type="text" className={`${fiClass} uppercase`} value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
              <div><label className={flClass}>Branch</label><input type="text" className={`${fiClass} uppercase`} value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
              <div><label className={flClass}>A/c Number</label><input type="text" className={`${fiClass} font-bold`} value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
              <div><label className={flClass}>IFSC Code</label><input type="text" className={`${fiClass} uppercase font-bold`} value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
            </div>
            <div className="mb-4">
              <label className={flClass}>Amount in Words</label>
              <input type="text" className={`${fiClass} uppercase`} value={amountInWords} onChange={e => setAmountInWords(e.target.value)} placeholder="Rupees..." />
            </div>
            <div>
              <label className={flClass}>Terms & Conditions</label>
              <textarea className={`${fiClass} h-20 resize-none`} value={terms} onChange={e => setTerms(e.target.value)}></textarea>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODE 2: PREVIEW & PRINT (HD Marg A4 Style) */}
      {/* ========================================= */}
      <div className={viewMode === 'preview' ? 'block' : 'hidden print:block'}>
        <div className="w-full relative">
          
          {/* Note for users when viewing preview on mobile */}
          <div className="max-w-[210mm] mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm text-center font-bold print:hidden">
            🎉 Preview Mode Active! Ye bill exact PDF format mein dikh raha hai. Scroll to view or Save PDF.
          </div>

          {selectedTemplate === 'classic' && <ClassicTemplate {...commonProps} />}
          {selectedTemplate === 'modern' && <ModernTemplate {...commonProps} />}
          {selectedTemplate === 'corporate' && <CorporateTemplate {...commonProps} />}
          {selectedTemplate === 'service' && <ServiceTemplate {...commonProps} />}
          {selectedTemplate === 'compact' && <CompactTemplate {...commonProps} />}
        </div>
      </div>
      
    </div>
  );
}
