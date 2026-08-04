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
  terms, setTerms
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

  // Editable Input Style (Compact specific)
  const inputClass = "w-full bg-transparent outline-none border-b border-dashed border-gray-400 focus:border-gray-800 print:border-none text-gray-900";

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mb-4 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded shadow hover:bg-blue-700 text-sm font-semibold">
          <Printer size={16} className="mr-1"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-green-600 text-white px-3 py-1.5 rounded shadow hover:bg-green-700 text-sm font-semibold">
          <Share2 size={16} className="mr-1"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-gray-800 text-white px-3 py-1.5 rounded shadow hover:bg-gray-900 text-sm font-semibold">
          <Download size={16} className="mr-1"/> Save PDF
        </button>
      </div>

      {/* COMPACT INVOICE AREA (Fully Editable) */}
      <div ref={invoiceRef} className="bg-white p-6 border border-gray-300 shadow-sm text-gray-900 text-sm relative" style={{ minHeight: '1000px' }}>
        
        {/* HEADER (Compact) */}
        <div className="flex justify-between items-center border-b border-gray-400 pb-3 mb-3">
          <div className="w-1/2 flex items-center gap-4">
            {logo ? (
              <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
            ) : (
              <div className="text-xl font-bold text-gray-800 border-2 border-gray-800 p-1">LOGO</div>
            )}
            <div>
              <h1 className="text-xl font-bold uppercase leading-tight">{storeSettings.storeName}</h1>
              <p className="text-xs">{storeSettings.address}</p>
              <p className="text-xs">Ph: {storeSettings.phone}</p>
              {storeSettings.gstin && <p className="text-xs font-semibold">GSTIN: {storeSettings.gstin}</p>}
            </div>
          </div>
          <div className="w-1/3 text-right">
            <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-1">Tax Invoice</h2>
            <div className="flex justify-end items-center mb-1 text-xs font-semibold">
              <span className="w-16">Bill No:</span> 
              <input type="text" className={`${inputClass} w-24 text-right font-normal`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
            </div>
            <div className="flex justify-end items-center text-xs font-semibold">
              <span className="w-16">Date:</span> 
              <input type="date" className={`${inputClass} w-24 text-right font-normal`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
            </div>
          </div>
        </div>

        {/* CUSTOMER INFO (Compact Editable) */}
        <div className="flex justify-between border-b border-gray-400 pb-2 mb-4 text-xs">
          <div className="w-2/3 flex items-center gap-2 flex-wrap">
            <span className="font-bold">Billed To:</span> 
            <input type="text" className={`${inputClass} w-48`} placeholder="Customer Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} />
            <span> | Add:</span>
            <input type="text" className={`${inputClass} w-48`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} />
          </div>
          <div className="w-1/3 flex items-center justify-end gap-2">
            <span className="font-bold">GSTIN:</span> 
            <input type="text" className={`${inputClass} w-32`} placeholder="GST (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} />
          </div>
        </div>

        {/* COMPACT TABLE (Editable rows) */}
        <div className="relative mb-4">
          <table className="w-full text-left border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100 text-xs uppercase border-b border-gray-400">
                <th className="border-r border-gray-400 p-1 text-center w-8">#</th>
                <th className="border-r border-gray-400 p-1">Product Description</th>
                <th className="border-r border-gray-400 p-1 text-center w-12">Qty</th>
                <th className="border-r border-gray-400 p-1 text-right w-16">Rate</th>
                <th className="border-r border-gray-400 p-1 text-center w-12">Dis%</th>
                <th className="border-r border-gray-400 p-1 text-center w-12">GST%</th>
                <th className="p-1 text-right w-20">Amount</th>
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
                  <tr key={item.id} className="border-b border-gray-300 text-xs group relative">
                    <td className="border-r border-gray-400 p-1 text-center relative">
                      {index + 1}
                      {items.length > 1 && (
                        <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                    <td className="border-r border-gray-400 p-1"><input type="text" className={`${inputClass}`} placeholder="Type product name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                    <td className="border-r border-gray-400 p-1"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                    <td className="border-r border-gray-400 p-1"><input type="number" className={`${inputClass} text-right`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                    <td className="border-r border-gray-400 p-1"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                    <td className="border-r border-gray-400 p-1"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                    <td className="p-1 text-right font-medium">₹{totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="mt-2 print:hidden" data-html2canvas-ignore="true">
            <button onClick={addRow} className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 cursor-pointer">
              <Plus size={14} className="mr-1" /> Add Row
            </button>
          </div>
        </div>

        {/* COMPACT FOOTER / TOTALS */}
        <div className="flex justify-between items-start text-xs mt-6">
          {/* Terms & Bank */}
          <div className="w-1/2 pr-4">
            <div className="mb-2">
              <p className="font-bold underline mb-1">Bank Details:</p>
              <div className="flex items-center"><span className="w-12">Bank:</span> <input type="text" className={`${inputClass}`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
              <div className="flex items-center mt-1"><span className="w-12">A/C:</span> <input type="text" className={`${inputClass}`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
              <div className="flex items-center mt-1"><span className="w-12">IFSC:</span> <input type="text" className={`${inputClass}`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
            </div>
            <div>
              <p className="font-bold underline mb-1">Terms & Conditions:</p>
              <textarea className="w-full bg-transparent outline-none border border-dashed border-gray-400 focus:border-gray-800 print:border-none text-xs resize-none h-12 p-1" value={terms} onChange={e => setTerms(e.target.value)} />
            </div>
          </div>

          {/* Totals Box */}
          <div className="w-1/3 border border-gray-400 p-2">
            <div className="flex justify-between mb-1">
              <span>Subtotal:</span>
              <span>₹{totals.taxableValue.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between mb-1 text-green-700">
                <span>Discount:</span>
                <span>-₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between mb-1">
              <span>Tax (GST):</span>
              <span>₹{(totals.cgst + totals.sgst).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
              <span>Net Payable:</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-right">
          <p className="text-xs font-bold border-t border-gray-400 inline-block pt-1 w-40 text-center">Authorised Signatory</p>
        </div>

      </div>
    </div>
  );
};

export default CompactTemplate;
