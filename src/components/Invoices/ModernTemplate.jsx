import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Trash2, Plus, Printer, Share2, Download } from 'lucide-react';

const ModernTemplate = ({
  logo, storeSettings,
  invoiceDetails, setInvoiceDetails,
  buyerDetails, setBuyerDetails,
  bankDetails, setBankDetails,
  items, handleItemChange, addRow, removeRow, totals,
  terms, setTerms, amountInWords, setAmountInWords
}) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${invoiceDetails.invoiceNumber || 'Invoice'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Invoice', text: 'Invoice Attached.' });
        } else {
          alert("Aapka device direct share support nahi karta. Please 'Save' karein.");
        }
      });
    } catch (err) {
      console.error("Share fail:", err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoiceDetails.invoiceNumber || 'Invoice'}.pdf`);
  };

  // Editable Input Style (Dashed border jo print mein gayab ho jayegi)
  const inputClass = "w-full bg-transparent outline-none border-b border-dashed border-gray-300 focus:border-solid focus:border-blue-500 print:border-none text-gray-800 font-medium";

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mb-6 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-bold text-sm transition-all cursor-pointer">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-bold text-sm transition-all cursor-pointer">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 font-bold text-sm transition-all cursor-pointer">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #modern-invoice-wrapper, #modern-invoice-wrapper * { visibility: visible; }
          #modern-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          #modern-invoice { border: none !important; box-shadow: none !important; }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
          input { text-overflow: clip; white-space: pre-wrap; }
        }
      `}</style>

      {/* 🔥 MOBILE RESPONSIVE WRAPPER 🔥 */}
      <div id="modern-invoice-wrapper" className="w-full overflow-x-auto pb-10 print:pb-0 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
        
        {/* EDITABLE INVOICE AREA (Fixed A4 Width for Mobile) */}
        <div id="modern-invoice" ref={invoiceRef} className="w-full min-w-[800px] max-w-[210mm] mx-auto bg-white p-8 border border-gray-200 rounded-sm shadow-xl text-gray-800 relative" style={{ minHeight: '1050px' }}>
          
          {/* 🔥 HEADER: MODERN CENTERED STYLE 🔥 */}
          <div className="flex flex-col items-center justify-center border-b-2 border-gray-100 pb-6 mb-8 relative text-center">
            
            {/* INVOICE TAG */}
            <div className="absolute top-0 right-0">
               <h1 className="text-3xl font-light text-gray-300 tracking-widest uppercase">Invoice</h1>
            </div>

            {/* LOGO */}
            <div className="absolute left-0 top-0">
              {logo ? (
                <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
              ) : (
                <div className="text-2xl font-bold text-blue-600 tracking-wider">LOGO</div>
              )}
            </div>
            
            {/* CENTERED STORE DETAILS */}
            <div className="w-full flex flex-col items-center justify-center pt-4">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-wide">{storeSettings.storeName}</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-lg font-medium uppercase">{storeSettings.address}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Contact: {storeSettings.phone}</p>
              {storeSettings.gstin && <p className="text-sm text-gray-700 font-bold mt-1 tracking-wide">GSTIN: {storeSettings.gstin}</p>}
            </div>
          </div>

          {/* CUSTOMER & INVOICE DETAILS */}
          <div className="flex justify-between mb-10 text-[13px]">
            {/* BILLED TO */}
            <div className="w-1/2 pr-6">
              <p className="text-xs text-blue-600 mb-2 font-bold uppercase tracking-wider">Billed To:</p>
              <div className="flex items-center mb-1"><span className="w-20 font-semibold text-gray-500">Name:</span><input type="text" className={`${inputClass} text-lg font-bold uppercase`} placeholder="Customer Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center mb-1"><span className="w-20 font-semibold text-gray-500">Address:</span><input type="text" className={`${inputClass} uppercase`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center mt-1">
                <span className="w-20 font-semibold text-gray-500">GSTIN:</span>
                <input type="text" className={`${inputClass} font-bold uppercase`} placeholder="GST Number (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} />
              </div>
            </div>
            
            {/* INVOICE META */}
            <div className="w-1/3 flex flex-col justify-center bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase w-24">Invoice No:</span>
                <input type="text" className={`${inputClass} font-bold text-right text-base`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
              </div>
              <div className="flex items-center mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase w-24">Date:</span>
                <input type="date" className={`${inputClass} font-medium text-right`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
              </div>
              <div className="flex items-center">
                <span className="text-xs font-bold text-gray-500 uppercase w-24">State:</span>
                <input type="text" className={`${inputClass} font-medium text-right uppercase`} value={invoiceDetails.stateCode || '07-DELHI'} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} />
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="relative mb-10 min-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-500 text-[11px] uppercase tracking-wider border-b-2 border-gray-200">
                  <th className="py-3 px-2 font-bold w-10 text-center">#</th>
                  <th className="py-3 px-2 font-bold">Item Description</th>
                  <th className="py-3 px-2 font-bold text-center w-16">HSN</th>
                  <th className="py-3 px-2 font-bold text-center w-16">Qty</th>
                  <th className="py-3 px-2 font-bold text-right w-20">Rate</th>
                  <th className="py-3 px-2 font-bold text-center w-14">Dis%</th>
                  <th className="py-3 px-2 font-bold text-center w-14">GST%</th>
                  <th className="py-3 px-2 font-bold text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const baseAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                  const disAmt = baseAmount * ((Number(item.disPercent) || 0) / 100);
                  const afterDis = baseAmount - disAmt;
                  const gstAmt = afterDis * ((Number(item.gstPercent) || 0) / 100);
                  const totalAmount = afterDis + gstAmt;

                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 group relative align-top">
                      <td className="py-3 px-2 text-[13px] text-center font-bold text-gray-400 relative">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-6 top-3 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-2"><input type="text" className={`${inputClass} font-bold`} placeholder="Type item name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="py-3 px-2"><input type="text" className={`${inputClass} text-center`} value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="py-3 px-2"><input type="number" className={`${inputClass} text-center font-bold`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="py-3 px-2"><input type="number" className={`${inputClass} text-right`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="py-3 px-2"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="py-3 px-2"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="py-3 px-2 text-[14px] text-right font-bold text-gray-800">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-2 print:hidden absolute -bottom-12 left-0" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 cursor-pointer shadow-sm transition-colors">
                <Plus size={16} className="mr-1" /> Add New Row
              </button>
            </div>
          </div>

          {/* TOTALS & TERMS */}
          <div className="flex justify-between items-stretch mt-4 absolute bottom-12 left-8 right-8">
            
            {/* Terms & Bank Details */}
            <div className="w-7/12 pr-8 flex flex-col justify-between">
              
              {/* Bank Details */}
              <div className="mb-4">
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Payment Details:</p>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                  <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">Bank:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Bank Name" value={bankDetails?.bankName || ''} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                  <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">Branch:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Branch" value={bankDetails?.branch || ''} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                  <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">A/C:</span> <input type="text" className={`${inputClass} uppercase font-bold`} placeholder="Account No" value={bankDetails?.accountNo || ''} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                  <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">IFSC:</span> <input type="text" className={`${inputClass} uppercase font-bold`} placeholder="IFSC Code" value={bankDetails?.ifsc || ''} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mb-4 bg-gray-50/80 p-2 rounded border border-gray-100 flex items-center">
                 <span className="text-xs font-bold text-gray-500 uppercase w-32">Amount in Words:</span>
                 <input type="text" className={`${inputClass} text-[12px] font-bold uppercase border-none`} placeholder="Rupees..." value={amountInWords || ''} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
              </div>

              {/* Terms */}
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Terms & Conditions:</p>
                <textarea className="w-full bg-transparent outline-none border border-dashed border-gray-300 focus:border-blue-500 print:border-none text-[11px] text-gray-500 resize-none h-12 leading-relaxed" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>
            
            {/* Financial Totals */}
            <div className="w-5/12">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <div className="flex justify-between border-b border-gray-200 pb-2 mb-2 text-[13px] font-medium text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-gray-800">₹{totals.taxableValue.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between border-b border-gray-200 pb-2 mb-2 text-[13px] font-medium text-red-500">
                    <span>Discount:</span>
                    <span className="font-bold">-₹{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-200 pb-2 mb-2 text-[13px] font-medium text-gray-600">
                  <span>Tax (SGST + CGST):</span>
                  <span className="font-bold text-gray-800">+₹{(totals.cgst + totals.sgst).toFixed(2)}</span>
                </div>
                {totals.roundoff !== 0 && (
                  <div className="flex justify-between border-b border-gray-200 pb-2 mb-2 text-[13px] font-medium text-gray-600">
                    <span>Roundoff:</span>
                    <span className="font-bold text-gray-800">{totals.roundoff > 0 ? '+' : ''}₹{totals.roundoff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 pt-2">
                  <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Total Amount:</span>
                  <span className="text-2xl font-black text-blue-600">₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-12 text-right">
                <p className="border-t border-gray-300 inline-block pt-2 text-xs text-gray-500 font-bold w-48 text-center uppercase tracking-wide">
                  For {storeSettings.storeName}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 text-center w-48">Authorised Signatory</p>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
