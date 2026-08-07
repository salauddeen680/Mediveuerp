import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Save, Lock, ShieldAlert, LayoutTemplate } from 'lucide-react';
import logo from '../logo.png';

// 🔥 SARE 5 TEMPLATES IMPORT KAR LIYE (WITH .jsx EXTENSION) 🔥
import ClassicTemplate from './Invoices/ClassicTemplate.jsx';
import ModernTemplate from './Invoices/ModernTemplate.jsx';
import CorporateTemplate from './Invoices/CorporateTemplate.jsx';
import ServiceTemplate from './Invoices/ServiceTemplate.jsx';
import CompactTemplate from './Invoices/CompactTemplate.jsx';

// 🔥 editBill aur setBillToEdit add kiya gaya hai props mein 🔥
export default function BillingPOS({ data, user, showToast, editBill, setBillToEdit }) {
  // SAAS ACCESS CONTROL & SMART COUNTDOWN LOGIC
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
    name: 'M/s GUPTA STORE',
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

  // 🔥 NAYA EFFECT: Edit Bill Ka Pura Data Load Karne Ke Liye 🔥
  useEffect(() => {
    if (editBill) {
      // Template load karo
      setSelectedTemplate(editBill.templateName || data?.templateName || 'classic');
      
      // Invoice aur Buyer Details load karo
      if (editBill.invoiceDetails) setInvoiceDetails(editBill.invoiceDetails);
      if (editBill.buyerDetails) setBuyerDetails(editBill.buyerDetails);
      if (editBill.bankDetails) setBankDetails(editBill.bankDetails);
      
      // Items load karo (yahan null/undefined check laga diya hai error se bachne ke liye)
      if (editBill.items && editBill.items.length > 0) {
        setItems(editBill.items);
      } else {
        setItems([{ id: 1, code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }]);
      }

      if (editBill.amountInWords) setAmountInWords(editBill.amountInWords);
      if (editBill.terms) setTerms(editBill.terms);
    }
  }, [editBill, data]); // Jab bhi editBill change hoga, data bhar dega

  // CALCULATIONS
  useEffect(() => {
    let tValue = 0, tDiscount = 0, tGst = 0;
    items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      // 🔥 DISCOUNT PAR LIMIT LAGA DI HAI (0 Se Kam Nahi, 100 Se Zyada Nahi) 🔥
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
    
    // 🔥 YAHAN BHI DISCOUNT FIELD PAR 100% KI LIMIT LAGA DI HAI 🔥
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
      // Yahan hum naya doc add kar rahe hain, chahe toh ise edit karne par updateDoc bhi bana sakte ho.
      await addDoc(collection(db, 'users', user.uid, 'bills'), {
        invoiceDetails, 
        buyerDetails, 
        bankDetails, 
        amountInWords, 
        terms, 
        items, 
        totals, 
        templateName: selectedTemplate, 
        createdAt: serverTimestamp()
      });
      showToast('Invoice Saved Successfully!');
      // Save ke baad editBill state ko clear karne ke liye
      if (setBillToEdit) setBillToEdit(null); 
    } catch (error) {
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

  // COMMON PROPS OBJECT
  const commonProps = {
    logo, storeSettings,
    invoiceDetails, setInvoiceDetails,
    buyerDetails, setBuyerDetails,
    bankDetails, setBankDetails,
    amountInWords, setAmountInWords,
    terms, setTerms,
    items, handleItemChange, addRow, removeRow,
    totals
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans print:bg-white print:p-0">
      
      {/* SUBSCRIPTION BANNER */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">Current Plan: <span className="text-white font-bold ml-1">{userPlan}</span></span>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
           ⏳ {daysLeft} Days Remaining
        </div>
      </div>

      {/* TEMPLATE SELECTOR & CLOUD SAVE BUTTON */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="text-blue-400" size={24} />
          <select 
            className="bg-slate-900 text-white border border-slate-600 rounded-lg px-4 py-2 outline-none cursor-pointer font-semibold"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="classic">1. Classic GST</option>
            <option value="modern">2. Modern Minimal</option>
            <option value="corporate">3. Corporate Blue</option>
            <option value="service">4. Service / Freelance</option>
            <option value="compact">5. Compact Retail</option>
          </select>
          <span className="text-xs text-slate-400 ml-2">*(All templates are now 100% Editable)*</span>
        </div>

        {/* FIREBASE SAVE BUTTON */}
        <button onClick={handleSaveBill} disabled={isProcessing} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md cursor-pointer disabled:opacity-50">
          <Save size={18} className="mr-2" /> Save to Cloud
        </button>
      </div>

      {/* INVOICE RENDER AREA */}
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
