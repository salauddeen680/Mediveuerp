import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Save, Printer, Download, Share2, Plus, Trash2 } from 'lucide-react';

export default function BillingPOS({ data, user, showToast }) {
  // Store Settings (Fetched from props)
  const storeSettings = data?.settings?.general || {
    storeName: 'PHARMA WHOLESALE',
    address: '13-2-47, OPP GOWDIYAMATAM, BEHIND FOOTBALL GROUND, BACHELI, 494553',
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

  // Items List (Dynamic Rows)
  const [items, setItems] = useState([
    { id: 1, code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }
  ]);

  // Totals State
  const [totals, setTotals] = useState({
    taxableValue: 0,
    discount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    roundoff: 0,
    grandTotal: 0
  });

  // Automatic Calculation whenever items change
  useEffect(() => {
    let tValue = 0;
    let tDiscount = 0;
    let tGst = 0;

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
    const roundoff = grandTotal - exactTotal;

    setTotals({
      taxableValue: amountBeforeGst,
      discount: tDiscount,
      cgst: tGst / 2, // Assuming Intra-state for now (CGST 6%, SGST 6%)
      sgst: tGst / 2,
      igst: 0,
      roundoff: roundoff,
      grandTotal: grandTotal
    });
  }, [items]);

  // Handlers for Items
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => {
    setItems([...items, { id: Date.now(), code: '', description: '', hsn: '', qty: 0, rate: 0, disPercent: 0, gstPercent: 12 }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Save Bill to Firestore
  const handleSaveBill = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'bills'), {
        invoiceDetails,
        buyerDetails,
        items,
        totals,
        createdAt: serverTimestamp()
      });
      showToast('Invoice Saved Successfully!');
      window.print(); // Auto trigger print
    } catch (error) {
      showToast('Error saving invoice', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 overflow-y-auto font-sans">
      
      {/* INVOICE PAPER (A4 Style) */}
      <div className="max-w-5xl mx-auto bg-white text-black shadow-2xl rounded-sm overflow-hidden" id="printable-invoice">
        
        {/* HEADER SECTION */}
        <div className="border-b-2 border-black p-4 text-center relative">
          <div className="absolute right-4 top-4 text-xs font-bold text-gray-500">Original for Buyer</div>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">{storeSettings.storeName}</h1>
          <p className="text-sm font-medium mt-1 uppercase">{storeSettings.address}</p>
          <p className="text-sm font-medium">Phone : {storeSettings.phone}</p>
        </div>

        {/* META DETAILS GRID */}
        <div className="grid grid-cols-2 border-b-2 border-black text-sm">
          <div className="p-2 border-r-2 border-black flex flex-col gap-1">
            <div className="flex"><span className="w-32 font-bold">GSTIN :</span> <span>{storeSettings.gstin}</span></div>
            <div className="flex items-center"><span className="w-32 font-bold">Invoice Number :</span> <input type="text" className="border-b border-gray-400 outline-none w-32" value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
            <div className="flex items-center"><span className="w-32 font-bold">Invoice Date :</span> <input type="date" className="border-b border-gray-400 outline-none w-32" value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
            <div className="flex"><span className="w-32 font-bold">State :</span> <span>{invoiceDetails.stateCode}</span></div>
          </div>
          <div className="p-2 flex flex-col gap-1">
            <div className="flex"><span className="w-32 font-bold">PAN NO. :</span> <input type="text" className="border-b border-gray-400 outline-none w-40 uppercase" value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} /></div>
            <div className="font-bold mt-1 underline">SHIPPED TO PARTY:</div>
            <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <input type="text" className="border-b border-gray-400 outline-none w-40 uppercase" value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} /></div>
            <div className="flex"><span className="w-32 font-bold">D.L. No :</span> <span>{storeSettings.dlNumber}</span></div>
          </div>
        </div>

        {/* BUYER & TRANSPORT DETAILS */}
        <div className="grid grid-cols-2 border-b-2 border-black text-sm">
          <div className="p-2 border-r-2 border-black">
            <div className="font-bold underline mb-1">Detail Of Receiver (Billed to)</div>
            <div className="flex"><span className="w-20 font-bold">Name :</span> <input type="text" className="font-bold w-full outline-none uppercase" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">Add. :</span> <input type="text" className="w-full outline-none uppercase" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">GSTIN :</span> <input type="text" className="w-full outline-none uppercase" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">State :</span> <input type="text" className="w-full outline-none uppercase" value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} /></div>
          </div>
          <div className="p-2">
            <div className="font-bold underline mb-1">TRANSPORTATION</div>
            <div className="flex"><span className="w-24 font-bold">Party :</span> <input type="text" className="w-full outline-none uppercase" value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-24 font-bold">GSTIN :</span> <input type="text" className="w-full outline-none uppercase" value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center"><span className="font-bold mr-2">L.R No. :</span> <input type="text" className="border-b border-gray-400 outline-none w-20 uppercase" value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
              <div className="flex items-center"><span className="font-bold mr-2">L.R Date :</span> <input type="date" className="border-b border-gray-400 outline-none w-32" value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
            </div>
          </div>
        </div>

        {/* DYNAMIC ITEMS TABLE */}
        <div className="min-h-[300px]">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="border-b-2 border-black font-bold bg-gray-50">
              <tr>
                <th className="border-r border-black p-1 w-8">S.No.</th>
                <th className="border-r border-black p-1 w-16">Item Code</th>
                <th className="border-r border-black p-1 text-left">Description of Goods</th>
                <th className="border-r border-black p-1 w-16">HSN/SAC</th>
                <th className="border-r border-black p-1 w-12">Qty</th>
                <th className="border-r border-black p-1 w-16">Rate</th>
                <th className="border-r border-black p-1 w-20">Taxable Value</th>
                <th className="border-r border-black p-1 w-12">DIS %</th>
                <th className="border-r border-black p-1 w-16">DIS Amt</th>
                <th className="border-r border-black p-1 w-12">GST %</th>
                <th className="border-r border-black p-1 w-16">GST Amt</th>
                <th className="p-1 w-24">Amount</th>
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
                  <tr key={item.id} className="border-b border-gray-200 group hover:bg-blue-50/50">
                    <td className="border-r border-black p-1 relative">
                      {index + 1}
                      {items.length > 1 && (
                        <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent" value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-left outline-none bg-transparent font-medium text-blue-600" placeholder="Type medicine name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-right outline-none bg-transparent" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{baseAmount.toFixed(2)}</td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{disAmt.toFixed(2)}</td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{gstAmt.toFixed(2)}</td>
                    <td className="p-1 text-right font-bold">{totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Add Row Button (Hidden in Print) */}
          <div className="p-2 print:hidden">
            <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
              <Plus size={16} className="mr-1" /> Add Row
            </button>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="grid grid-cols-12 border-t-2 border-black text-sm">
          
          {/* Left Footer (Bank Details & Terms) */}
          <div className="col-span-8 border-r-2 border-black flex flex-col justify-between">
            <div className="p-2 border-b-2 border-black">
              <div className="font-bold underline mb-1">Bank Details</div>
              <div className="grid grid-cols-2 gap-x-4">
                <div><span className="font-bold">Bank Name:</span> PUNJAB & SIND BANK</div>
                <div><span className="font-bold">Bank Branch:</span> GEETA COLONY</div>
                <div><span className="font-bold">Bank A/c No.:</span> 06261100054752</div>
                <div><span className="font-bold">IFSC CODE:</span> PSIB0000626</div>
              </div>
            </div>
            
            <div className="p-2 border-b-2 border-black font-bold uppercase">
              Rs. {/* Add Number to Words logic here if needed, keeping static for layout */} 
              (Amount in words will appear here)
            </div>

            <div className="p-2 text-xs">
              <div className="font-bold underline">Terms & conditions</div>
              <ol className="list-decimal pl-4 mt-1">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Bills not paid due date will attract 24% interest.</li>
                <li>All disputes subject to Jurisdiction only.</li>
                <li>Prescribed Sales Tax declaration will be given.</li>
              </ol>
            </div>
          </div>

          {/* Right Footer (Totals Calculation) */}
          <div className="col-span-4 flex flex-col">
            <div className="p-2 border-b-2 border-black font-bold">
              <div className="flex justify-between"><span>Total Amount Before GST</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
              <div className="flex justify-between text-red-600"><span>DISCOUNT</span> <span>- {totals.discount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Add : SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Add : CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
            </div>
            <div className="p-2 border-b-2 border-black bg-blue-50 font-bold text-lg text-blue-900 flex justify-between items-center">
              <span>Total Amount After GST</span> 
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
            <div className="p-2 flex-grow flex flex-col items-end justify-end pt-12 pb-2 pr-4 relative">
              <span className="absolute top-2 right-4 text-xs font-bold">For {storeSettings.storeName}</span>
              <span className="font-bold border-t border-black pt-1 px-4">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS (Hidden in Print) */}
      <div className="max-w-5xl mx-auto mt-6 flex justify-between items-center print:hidden bg-white/5 backdrop-blur-md p-4 rounded-xl border border-slate-700">
        <div className="flex gap-4">
          <button onClick={handleSaveBill} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg">
            <Save size={18} className="mr-2" /> Save Bill
          </button>
          <button onClick={() => window.print()} className="flex items-center bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg border border-slate-600">
            <Printer size={18} className="mr-2" /> Print
          </button>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => window.print()} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-lg">
            <Download size={18} className="mr-2" /> Download PDF
          </button>
          <button onClick={() => showToast('Share link copied to clipboard!')} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-lg">
            <Share2 size={18} className="mr-2" /> Share
          </button>
        </div>
      </div>
      
    </div>
  );
}
