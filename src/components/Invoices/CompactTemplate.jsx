import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Trash2, Plus, Printer, Share2, Download } from 'lucide-react';

const CompactTemplate = ({
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
        const file = new File([blob], `Retail_Bill_${invoiceDetails.invoiceNumber || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Invoice', text: 'Your bill is attached.' });
        } else {
          alert("Device share support nahi kar raha. 'Save' karein.");
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
    pdf.save(`Retail_Bill_${invoiceDetails.invoiceNumber}.pdf`);
  };

  // COMMON INPUT STYLES (Dotted on screen, invisible on Print)
  const inputStyle = "w-full outline-none bg-transparent text-black border-b border-gray-400 border-dashed print:border-none focus:border-solid focus:border-teal-600 font-medium";

  return (
    <div>
      {/* ACTION BUTTONS */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-600 text-white px-4 py-2 rounded shadow hover:bg-slate-700 text-sm font-bold transition-all cursor-pointer">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 text-sm font-bold transition-all cursor-pointer">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 text-sm font-bold transition-all cursor-pointer">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #compact-invoice-wrapper, #compact-invoice-wrapper * { visibility: visible; }
          #compact-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          #compact-invoice { border: none !important; box-shadow: none !important; }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
          input { text-overflow: clip; white-space: pre-wrap; }
        }
      `}</style>

      {/* 🔥 MOBILE RESPONSIVE WRAPPER 🔥 */}
      <div id="compact-invoice-wrapper" className="w-full overflow-x-auto pb-10 print:pb-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        
        {/* COMPACT INVOICE AREA (Fully Editable & A4 Size Locked) */}
        <div id="compact-invoice" ref={invoiceRef} className="w-full min-w-[800px] max-w-[210mm] mx-auto bg-white p-6 border border-gray-400 shadow-xl text-black text-sm relative" style={{ minHeight: '1000px' }}>
          
          {/* 🔥 HEADER: CENTERED MARG ERP STYLE 🔥 */}
          <div className="border-b-2 border-black pb-4 mb-4 relative flex flex-col items-center justify-center text-center">
            
            {/* TAX INVOICE BADGE */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-0.5 text-[11px] font-bold rounded-b-md uppercase tracking-widest print:border print:border-black print:bg-white print:text-black">
              Retail Tax Invoice
            </div>

            {/* LOGO */}
            {logo && <img src={logo} alt="Store Logo" className="absolute left-0 top-2" style={{ height: '60px', objectFit: 'contain' }} />}
            
            {/* CENTERED STORE DETAILS */}
            <div className="w-full flex flex-col items-center justify-center mt-4">
              <h1 className="text-3xl font-black uppercase tracking-wide text-black">{storeSettings.storeName}</h1>
              <p className="text-sm font-semibold mt-1 uppercase text-black max-w-lg">{storeSettings.address}</p>
              <p className="text-sm font-semibold text-black mt-1">Contact: {storeSettings.phone}</p>
              {storeSettings.gstin && <p className="text-xs font-bold text-black mt-1">GSTIN: {storeSettings.gstin}</p>}
            </div>
          </div>

          {/* META & CUSTOMER INFO (Compact Grid) */}
          <div className="flex justify-between border-b border-gray-400 pb-3 mb-4 text-[13px]">
            {/* BILLED TO */}
            <div className="w-1/2 pr-4 flex flex-col gap-1.5 border-r border-gray-400">
              <div className="font-bold underline mb-1">Billed To (Customer):</div>
              <div className="flex items-center"><span className="w-20 font-bold">Name:</span> <input type="text" className={`${inputStyle} uppercase font-bold`} placeholder="Customer Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-20 font-bold">Address:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-20 font-bold">GSTIN:</span> <input type="text" className={`${inputStyle} uppercase font-bold`} placeholder="GST (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
            </div>
            
            {/* INVOICE DETAILS */}
            <div className="w-1/2 pl-4 flex flex-col gap-1.5 justify-center">
              <div className="flex items-center"><span className="w-24 font-bold">Bill No:</span> <input type="text" className={`${inputStyle} font-bold`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">Date:</span> <input type="date" className={`${inputStyle}`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">State:</span> <input type="text" className={`${inputStyle} uppercase`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
            </div>
          </div>

          {/* COMPACT TABLE */}
          <div className="relative mb-6 min-h-[400px]">
            <table className="w-full text-left border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100 text-[11px] font-extrabold uppercase border-b border-gray-400 tracking-tight">
                  <th className="border-r border-gray-400 p-1.5 text-center w-8">#</th>
                  <th className="border-r border-gray-400 p-1.5 pl-2">Product Description</th>
                  <th className="border-r border-gray-400 p-1.5 text-center w-16">HSN</th>
                  <th className="border-r border-gray-400 p-1.5 text-center w-12">Qty</th>
                  <th className="border-r border-gray-400 p-1.5 text-right w-16">Rate</th>
                  <th className="border-r border-gray-400 p-1.5 text-center w-12">Dis%</th>
                  <th className="border-r border-gray-400 p-1.5 text-center w-12">GST%</th>
                  <th className="p-1.5 text-right w-20 pr-2">Amount</th>
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
                    <tr key={item.id} className="border-b border-gray-300 text-[13px] group relative align-top hover:bg-gray-50">
                      <td className="border-r border-gray-400 p-1.5 text-center font-bold relative">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="border-r border-gray-400 p-1.5 pl-2"><input type="text" className={`${inputStyle} font-bold`} placeholder="Type product name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r border-gray-400 p-1.5"><input type="text" className={`${inputStyle} text-center`} value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r border-gray-400 p-1.5"><input type="number" className={`${inputStyle} text-center font-bold`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r border-gray-400 p-1.5"><input type="number" className={`${inputStyle} text-right`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r border-gray-400 p-1.5"><input type="number" className={`${inputStyle} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r border-gray-400 p-1.5"><input type="number" className={`${inputStyle} text-center`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="p-1.5 text-right font-bold pr-2">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON */}
            <div className="mt-2 print:hidden absolute -bottom-10 left-0" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200 cursor-pointer shadow-sm">
                <Plus size={14} className="mr-1" /> Add New Row
              </button>
            </div>
          </div>

          {/* FOOTER / TOTALS */}
          <div className="flex justify-between items-stretch text-[13px] border-t border-gray-400 pt-4 absolute bottom-6 left-6 right-6">
            
            {/* Terms & Bank */}
            <div className="w-7/12 pr-6 flex flex-col justify-between">
              <div>
                <p className="font-bold underline mb-1">Bank Details:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="flex items-center"><span className="w-12 font-semibold">Bank:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                  <div className="flex items-center"><span className="w-12 font-semibold">Branch:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                  <div className="flex items-center"><span className="w-12 font-semibold">A/C:</span> <input type="text" className={`${inputStyle} font-bold uppercase`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                  <div className="flex items-center"><span className="w-12 font-semibold">IFSC:</span> <input type="text" className={`${inputStyle} font-bold uppercase`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mt-3 flex items-center bg-gray-50 p-1.5 border border-gray-200 rounded">
                <span className="mr-2 font-bold whitespace-nowrap text-xs">Amt in Words:</span>
                <input type="text" className={`${inputStyle} font-bold text-xs uppercase border-none`} placeholder="Rupees..." value={amountInWords || ''} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
              </div>

              <div className="mt-3">
                <p className="font-bold underline mb-1">Terms & Conditions:</p>
                <textarea className="w-full bg-transparent outline-none border border-dashed border-gray-400 focus:border-gray-800 print:border-none text-[11px] resize-none h-10 leading-tight" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            {/* Totals Box */}
            <div className="w-5/12 border border-black rounded flex flex-col">
              <div className="p-3 flex-grow font-semibold text-[13px]">
                <div className="flex justify-between mb-1.5">
                  <span>Subtotal:</span>
                  <span>{totals.taxableValue.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between mb-1.5 text-red-600">
                    <span>Discount:</span>
                    <span>-{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between mb-1.5">
                  <span>Total Tax (GST):</span>
                  <span>+{(totals.cgst + totals.sgst).toFixed(2)}</span>
                </div>
                {totals.roundoff !== 0 && (
                  <div className="flex justify-between mb-1.5">
                    <span>Roundoff:</span>
                    <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-black text-lg border-t border-black bg-gray-100 p-3">
                <span>Net Payable:</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="p-3 pt-10 text-right">
                <p className="text-xs font-bold border-t border-black inline-block pt-1 w-full text-center">Authorised Signatory</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompactTemplate;
