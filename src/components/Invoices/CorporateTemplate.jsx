import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Trash2, Plus, Printer, Share2, Download } from 'lucide-react';

const CorporateTemplate = ({
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
        const file = new File([blob], `Corporate_Invoice_${invoiceDetails.invoiceNumber || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Invoice', text: 'Invoice Attached.' });
        } else {
          alert("Aapka device direct share support nahi karta. Please 'Save PDF' karein.");
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
    pdf.save(`Corporate_Invoice_${invoiceDetails.invoiceNumber}.pdf`);
  };

  // 🔥 MAGIC CSS FIX: Hover/Focus par line dikhegi, par PDF/Print mein transparent ho jayegi 🔥
  const inputStyle = "w-full outline-none bg-transparent text-gray-800 border-b border-transparent hover:border-gray-400 hover:border-dashed focus:border-blue-800 focus:border-solid font-medium py-1 transition-colors";

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mb-6 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-bold text-sm transition-all cursor-pointer">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 font-bold text-sm transition-all cursor-pointer">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-bold text-sm transition-all cursor-pointer">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #corporate-invoice-wrapper, #corporate-invoice-wrapper * { visibility: visible; }
          #corporate-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          #corporate-invoice { border: none !important; box-shadow: none !important; }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
          input { text-overflow: clip; white-space: pre-wrap; }
        }
      `}</style>

      {/* MOBILE RESPONSIVE WRAPPER */}
      <div id="corporate-invoice-wrapper" className="w-full overflow-x-auto pb-10 print:pb-0 scrollbar-thin scrollbar-thumb-blue-800 scrollbar-track-transparent">
        
        {/* INVOICE AREA (Fixed A4 Width for Mobile) */}
        <div id="corporate-invoice" ref={invoiceRef} className="w-full min-w-[800px] max-w-[210mm] mx-auto bg-white p-0 border border-gray-200 shadow-xl text-gray-800 relative" style={{ minHeight: '1050px' }}>
          
          {/* TOP BLUE ACCENT BAR */}
          <div className="h-3 w-full bg-blue-800 absolute top-0 left-0"></div>

          <div className="p-8 pt-10">
            {/* HEADER: CENTERED CORPORATE STYLE */}
            <div className="border-b-2 border-blue-100 pb-6 mb-8 relative flex flex-col items-center justify-center text-center">
              
              {/* TAX INVOICE BADGE */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-800 text-white px-6 py-1 text-xs font-bold rounded-b-md uppercase tracking-widest print:border print:border-blue-800 print:bg-white print:text-blue-800">
                Corporate Tax Invoice
              </div>

              {/* LOGO */}
              {logo && <img src={logo} alt="Company Logo" className="absolute left-0 top-4" style={{ height: '70px', objectFit: 'contain' }} />}
              
              {/* CENTERED COMPANY DETAILS */}
              <div className="w-full flex flex-col items-center justify-center mt-6">
                <h1 className="text-4xl font-extrabold text-blue-800 uppercase tracking-widest">{storeSettings.storeName}</h1>
                <p className="text-sm font-semibold mt-2 text-gray-600 max-w-lg uppercase">{storeSettings.address}</p>
                <p className="text-sm font-semibold text-gray-600 mt-1">Contact: {storeSettings.phone}</p>
                {storeSettings.gstin && <p className="text-sm font-bold text-gray-800 mt-1">GSTIN: {storeSettings.gstin}</p>}
              </div>
            </div>

            {/* BILL TO & INVOICE DETAILS */}
            <div className="flex justify-between border-b-2 border-blue-50 pb-6 mb-8 text-[13px]">
              {/* INVOICE TO */}
              <div className="w-1/2 pr-6 border-r border-blue-100 flex flex-col gap-2">
                <p className="text-xs text-blue-800 font-bold uppercase mb-1">Invoice To (Client):</p>
                <div className="flex items-center"><span className="w-20 font-semibold">Name:</span> <input type="text" className={`${inputStyle} text-base font-bold uppercase`} placeholder="Client Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
                <div className="flex items-center"><span className="w-20 font-semibold">Address:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
                <div className="flex items-center"><span className="w-20 font-semibold">GSTIN:</span> <input type="text" className={`${inputStyle} uppercase font-bold`} placeholder="GST Number (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
              </div>
              
              {/* INVOICE META */}
              <div className="w-1/2 pl-6 flex flex-col gap-2 justify-center">
                <div className="flex items-center"><span className="text-sm text-blue-800 font-bold uppercase w-28">Inv Number:</span> <input type="text" className={`${inputStyle} font-bold text-base`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
                <div className="flex items-center"><span className="text-sm text-blue-800 font-bold uppercase w-28">Inv Date:</span> <input type="date" className={`${inputStyle}`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
                <div className="flex items-center"><span className="text-sm text-blue-800 font-bold uppercase w-28">State:</span> <input type="text" className={`${inputStyle} uppercase`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
              </div>
            </div>

            {/* CORPORATE TABLE */}
            <div className="relative mb-8 min-h-[350px]">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-blue-800 text-white text-[12px] uppercase tracking-wider">
                    <th className="py-3 px-2 font-bold w-10 text-center border-r border-blue-700">#</th>
                    <th className="py-3 px-3 font-bold border-r border-blue-700">Item Description</th>
                    <th className="py-3 px-2 font-bold text-center w-16 border-r border-blue-700">HSN</th>
                    <th className="py-3 px-2 font-bold text-center w-16 border-r border-blue-700">Qty</th>
                    <th className="py-3 px-2 font-bold text-right w-20 border-r border-blue-700">Rate</th>
                    <th className="py-3 px-2 font-bold text-center w-14 border-r border-blue-700">Dis%</th>
                    <th className="py-3 px-2 font-bold text-center w-14 border-r border-blue-700">GST%</th>
                    <th className="py-3 px-3 font-bold text-right w-28">Net Amount</th>
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
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-blue-50/50 group relative align-top">
                        <td className="py-3 px-2 text-[13px] text-center font-bold relative border-r border-gray-200">
                          {index + 1}
                          {items.length > 1 && (
                            <button onClick={() => removeRow(index)} className="absolute -left-6 top-3 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 border-r border-gray-200"><input type="text" className={`${inputStyle} font-bold`} placeholder="Type item name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                        <td className="py-3 px-2 border-r border-gray-200"><input type="text" className={`${inputStyle} text-center`} value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                        <td className="py-3 px-2 border-r border-gray-200"><input type="number" className={`${inputStyle} text-center font-bold`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                        <td className="py-3 px-2 border-r border-gray-200"><input type="number" className={`${inputStyle} text-right`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                        <td className="py-3 px-2 border-r border-gray-200"><input type="number" className={`${inputStyle} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                        <td className="py-3 px-2 border-r border-gray-200"><input type="number" className={`${inputStyle} text-center`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                        <td className="py-3 px-3 text-[14px] text-right font-bold text-gray-800">₹{totalAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-2 print:hidden absolute -bottom-10 left-0" data-html2canvas-ignore="true">
                <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-800 hover:text-blue-900 bg-blue-100 px-3 py-1.5 rounded border border-blue-200 cursor-pointer shadow-sm">
                  <Plus size={16} className="mr-1" /> Add New Row
                </button>
              </div>
            </div>

            {/* TOTALS & BANK DETAILS */}
            <div className="flex justify-between items-stretch mt-4 absolute bottom-10 left-8 right-8">
              
              {/* Payment Info & Terms */}
              <div className="w-7/12 pr-6 flex flex-col justify-between">
                <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
                  <p className="text-xs text-blue-800 font-bold uppercase mb-2">Payment / Bank Details</p>
                  <div className="flex items-center text-[13px] mb-1.5"><span className="w-24 text-gray-700 font-semibold">Bank Name:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                  <div className="flex items-center text-[13px] mb-1.5"><span className="w-24 text-gray-700 font-semibold">Account No:</span> <input type="text" className={`${inputStyle} uppercase font-bold`} placeholder="Account Number" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                  <div className="flex items-center text-[13px]"><span className="w-24 text-gray-700 font-semibold">IFSC Code:</span> <input type="text" className={`${inputStyle} uppercase font-bold`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
                </div>

                <div className="mt-3 flex items-center bg-gray-50 p-2 border border-gray-200 rounded">
                  <span className="mr-2 font-bold whitespace-nowrap text-xs text-blue-800 uppercase">Amt in Words:</span>
                  <input type="text" className={`${inputStyle} font-bold text-xs uppercase border-none`} placeholder="Rupees..." value={amountInWords || ''} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
                </div>

                <div className="mt-3">
                  <p className="text-[11px] text-blue-800 mb-1 font-bold uppercase">Terms & Conditions:</p>
                  <textarea className="w-full bg-transparent outline-none border border-dashed border-gray-300 focus:border-blue-800 print:border-none text-[11px] text-gray-600 resize-none h-12 leading-tight py-1" value={terms} onChange={e => setTerms(e.target.value)} />
                </div>
              </div>
              
              {/* Financial Totals */}
              <div className="w-5/12 border border-blue-200 rounded-lg flex flex-col shadow-sm overflow-hidden">
                <div className="p-4 flex-grow bg-white text-[13px] font-medium text-gray-700">
                  <div className="flex justify-between mb-2">
                    <span>Total Taxable Value:</span>
                    <span className="font-bold">₹{totals.taxableValue.toFixed(2)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between mb-2 text-red-600">
                      <span>Total Discount:</span>
                      <span className="font-bold">-₹{totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2">
                    <span>Add SGST:</span>
                    <span className="font-bold">+₹{totals.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Add CGST:</span>
                    <span className="font-bold">+₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  {totals.roundoff !== 0 && (
                    <div className="flex justify-between">
                      <span>Roundoff:</span>
                      <span className="font-bold">{totals.roundoff > 0 ? '+' : ''}₹{totals.roundoff.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center bg-blue-800 text-white p-4">
                  <span className="text-sm font-bold uppercase tracking-wider">Grand Total:</span>
                  <span className="text-xl font-black">₹{totals.grandTotal.toFixed(2)}</span>
                </div>

                <div className="p-4 pt-10 bg-white text-right">
                  <p className="border-t-2 border-blue-800 inline-block pt-1 text-xs text-blue-800 font-bold w-48 text-center uppercase">
                    For {storeSettings.storeName}
                  </p>
                  <p className="text-[10px] text-gray-500 text-center w-48 mt-1">Authorised Signatory</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateTemplate;
