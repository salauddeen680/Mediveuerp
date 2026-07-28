import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Save, Printer, Download, Share2, Plus, Trash2 } from 'lucide-react';

export default function BillingPOS({ data, user, showToast }) {
  // Store Settings
  const storeSettings = data?.settings?.general || {
    storeName: 'PHARMA WHOLESALE',
    address: '13-2-47, OPP GOWDIYAMATAM, BEHIND FOOTBALL GROUND, BACHELI',
    phone: '9999955559, 9999988877',
    gstin: '07CTMPM6999K1ZJ',
    dlNumber: 'DL11WW-6985'
  };

  // Invoice Meta Data
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    stateCode: '07-DELHI',
    panNo: '',
    shippedGstin: '',
  });

  // Buyer & Transport Details
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

  // Dynamic Bank Details & Words
  const [bankDetails, setBankDetails] = useState({
    bankName: 'PUNJAB & SIND BANK',
    branch: 'GEETA COLONY',
    accountNo: '06261100054752',
    ifsc: 'PSIB0000626'
  });
  const [amountInWords, setAmountInWords] = useState('');
  const [terms, setTerms] = useState("1. Goods once sold will not be taken back or exchanged.\n2. Bills not paid due date will attract 24% interest.\n3. All disputes subject to Jurisdiction only.\n4. Prescribed Sales Tax declaration will be given.");

  // Items List
  const [items, setItems] = useState([
    { id: 1, code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }
  ]);

  // Totals State
  const [totals, setTotals] = useState({
    taxableValue: 0, discount: 0, cgst: 0, sgst: 0, igst: 0, roundoff: 0, grandTotal: 0
  });

  // Calculations
  useEffect(() => {
    let tValue = 0, tDiscount = 0, tGst = 0;
    items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const disP = Number(item.disPercent) || 0;
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
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => setItems([...items, { id: Date.now(), code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }]);
  
  const removeRow = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveBill = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'bills'), {
        invoiceDetails, buyerDetails, bankDetails, amountInWords, terms, items, totals, createdAt: serverTimestamp()
      });
      showToast('Invoice Saved Successfully!');
    } catch (error) {
      showToast('Error saving invoice', 'error');
    }
  };

  // 🔥 NAYA SHARE SYSTEM (WhatsApp, Insta, FB ke liye) 🔥
  const handleShare = async () => {
    const shareData = {
      title: `Invoice from ${storeSettings.storeName}`,
      text: `Please find your invoice (Bill No: ${invoiceDetails.invoiceNumber}) for ₹${totals.grandTotal}.`,
      url: window.location.href, 
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      showToast('Sharing not supported on this browser. Link copied!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans print:bg-white print:p-0">
      
      {/* 🔥 FIX: YEH CSS SIRF BILL KO DIKHAYEGI AUR BAAKI SAB GAYAB KAR DEGI 🔥 */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
          /* Remove inputs outline and background for print */
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
        }
      `}</style>

      {/* INVOICE PAPER (Print Content) */}
      <div className="w-full max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-sm overflow-hidden border border-gray-300" id="printable-invoice">
        
        {/* HEADER */}
        <div className="border-b border-black p-4 text-center relative">
          <div className="absolute right-4 top-4 text-xs font-bold text-gray-500 print:hidden">Original for Buyer</div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-black">{storeSettings.storeName}</h1>
          <p className="text-sm font-medium mt-1 uppercase text-black">{storeSettings.address}</p>
          <p className="text-sm font-medium text-black">Phone : {storeSettings.phone}</p>
        </div>

        {/* META DETAILS */}
        <div className="grid grid-cols-2 border-b border-black text-sm">
          <div className="p-2 border-r border-black flex flex-col gap-1 text-black">
            <div className="flex"><span className="w-32 font-bold">GSTIN :</span> <span>{storeSettings.gstin}</span></div>
            <div className="flex items-center"><span className="w-32 font-bold">Invoice Number :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 bg-transparent text-black" value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
            <div className="flex items-center"><span className="w-32 font-bold">Invoice Date :</span> <input type="date" className="border-b border-gray-300 outline-none w-40 bg-transparent text-black" value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
            <div className="flex items-center"><span className="w-32 font-bold">State :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 bg-transparent uppercase text-black" value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
          </div>
          <div className="p-2 flex flex-col gap-1 text-black">
            <div className="flex items-center"><span className="w-32 font-bold">PAN NO. :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 uppercase bg-transparent text-black" value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} /></div>
            <div className="font-bold mt-1 underline">SHIPPED TO PARTY:</div>
            <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 uppercase bg-transparent text-black" value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} /></div>
            <div className="flex"><span className="w-32 font-bold">D.L. No :</span> <span>{storeSettings.dlNumber}</span></div>
          </div>
        </div>

        {/* BUYER DETAILS */}
        <div className="grid grid-cols-2 border-b border-black text-sm text-black">
          <div className="p-2 border-r border-black">
            <div className="font-bold underline mb-1">Detail Of Receiver (Billed to)</div>
            <div className="flex"><span className="w-20 font-bold">Name :</span> <input type="text" className="font-bold w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">Add. :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">GSTIN :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">State :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} /></div>
          </div>
          <div className="p-2">
            <div className="font-bold underline mb-1">TRANSPORTATION</div>
            <div className="flex"><span className="w-24 font-bold">Party :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-24 font-bold">GSTIN :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center"><span className="font-bold mr-2">L.R No. :</span> <input type="text" className="border-b border-gray-300 outline-none w-20 uppercase bg-transparent text-black" value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
              <div className="flex items-center"><span className="font-bold mr-2">L.R Date :</span> <input type="date" className="border-b border-gray-300 outline-none w-32 bg-transparent text-black" value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="min-h-[300px] relative text-black">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="border-b border-black font-bold bg-gray-100">
              <tr>
                <th className="border-r border-black p-1 w-8">S.No.</th>
                <th className="border-r border-black p-1 w-16">Item Code</th>
                <th className="border-r border-black p-1 text-left">Description of Goods</th>
                <th className="border-r border-black p-1 w-16">HSN/SAC</th>
                <th className="border-r border-black p-1 w-12">Qty</th>
                <th className="border-r border-black p-1 w-16">Rate</th>
                <th className="border-r border-black p-1 w-20">Taxable</th>
                <th className="border-r border-black p-1 w-12">DIS%</th>
                <th className="border-r border-black p-1 w-16">DIS Amt</th>
                <th className="border-r border-black p-1 w-12">GST%</th>
                <th className="border-r border-black p-1 w-16">GST Amt</th>
                <th className="p-1 w-20">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const qty = Number(item.qty) || 0;
                const rate = Number(item.rate) || 0;
                const disP = Number(item.disPercent) || 0;
                const gstP = Number(item.gstPercent) || 0;
                const baseAmount = qty * rate;
                const disAmt = baseAmount * (disP / 100);
                const afterDis = baseAmount - disAmt;
                const gstAmt = afterDis * (gstP / 100);
                const totalAmount = afterDis + gstAmt;

                return (
                  <tr key={item.id} className="border-b border-gray-200 group hover:bg-gray-50">
                    <td className="border-r border-black p-1 relative">
                      {index + 1}
                      {items.length > 1 && (
                        <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent text-black" value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-left outline-none bg-transparent font-medium text-black" placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent text-black" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent text-black" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-right outline-none bg-transparent text-black" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{baseAmount.toFixed(2)}</td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent text-black" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{disAmt.toFixed(2)}</td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent text-black" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{gstAmt.toFixed(2)}</td>
                    <td className="p-1 text-right font-bold">{totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="p-2 print:hidden absolute -bottom-10 left-0">
            <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded border border-blue-200 cursor-pointer shadow-sm">
              <Plus size={16} className="mr-1" /> Add Row
            </button>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="grid grid-cols-12 border-t border-black text-sm text-black mt-8">
          
          <div className="col-span-8 border-r border-black flex flex-col justify-between">
            <div className="p-2 border-b border-black">
              <div className="font-bold underline mb-1">Bank Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center"><span className="font-bold w-24">Bank Name:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold w-20">Branch:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold w-24">A/c No.:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold w-20">IFSC:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
              </div>
            </div>
            
            <div className="p-2 border-b border-black font-bold uppercase flex items-center">
              <span className="mr-2 whitespace-nowrap">Rs. (In Words):</span>
              <input type="text" className="w-full outline-none bg-transparent text-black font-bold" placeholder="Type total amount in words..." value={amountInWords} onChange={e => setAmountInWords(e.target.value)} />
            </div>

            <div className="p-2 text-xs">
              <div className="font-bold underline mb-1">Terms & conditions</div>
              <textarea 
                className="w-full outline-none bg-transparent resize-none h-16 text-black" 
                value={terms} 
                onChange={e => setTerms(e.target.value)}
              />
            </div>
          </div>

          <div className="col-span-4 flex flex-col">
            <div className="p-2 border-b border-black font-bold text-xs">
              <div className="flex justify-between"><span>Total Amount Before GST</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
              <div className="flex justify-between text-black mt-1"><span>DISCOUNT</span> <span>- {totals.discount.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Add : SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Add : CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
            </div>
            <div className="p-2 border-b border-black bg-gray-100 font-bold text-lg text-black flex justify-between items-center">
              <span>Total After GST</span> 
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
            <div className="p-2 flex-grow flex flex-col items-end justify-end pt-12 pb-2 pr-4 relative">
              <span className="absolute top-2 right-4 text-xs font-bold text-black">For {storeSettings.storeName}</span>
              <span className="font-bold border-t border-black pt-1 px-4 text-black">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 ACTION BUTTONS (print:hidden laga diya hai, print me 100% nahi dikhenge) 🔥 */}
      <div className="max-w-[210mm] mx-auto mt-6 flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 print:hidden shadow-lg">
        <div className="flex gap-4">
          <button onClick={handleSaveBill} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md cursor-pointer">
            <Save size={18} className="mr-2" /> Save Bill
          </button>
          
          <button onClick={() => window.print()} className="flex items-center bg-slate-600 hover:bg-slate-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-md border border-slate-500 cursor-pointer">
            <Printer size={18} className="mr-2" /> Print Bill
          </button>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md cursor-pointer">
            <Download size={18} className="mr-2" /> Save as PDF
          </button>
          
          {/* 🔥 NEW SHARE BUTTON 🔥 */}
          <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md cursor-pointer">
            <Share2 size={18} className="mr-2" /> Share via Social
          </button>
        </div>
      </div>
      
    </div>
  );
}
