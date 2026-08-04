import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Trash2, Plus, Printer, Share2, Download } from 'lucide-react';

const ServiceTemplate = ({
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
        const file = new File([blob], `Service_Invoice_${invoiceDetails.invoiceNumber || 'Bill'}.png`, { type: 'image/png' });
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
    pdf.save(`Service_Invoice_${invoiceDetails.invoiceNumber}.pdf`);
  };

  // Editable Input Style (Dashed border jo print mein gayab ho jayegi)
  const inputClass = "w-full bg-transparent outline-none border-b border-dashed border-gray-300 focus:border-blue-500 print:border-none text-gray-800";

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mb-6 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-semibold text-sm">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-semibold text-sm">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 font-semibold text-sm">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      {/* EDITABLE INVOICE AREA */}
      <div ref={invoiceRef} className="bg-white p-10 border rounded-lg shadow-sm text-gray-800 relative" style={{ minHeight: '1000px' }}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-8">
          <div className="w-1/2">
            {logo ? (
              <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
            ) : (
              <div className="text-3xl font-bold text-gray-800">LOGO</div>
            )}
          </div>
          <div className="w-1/2 text-right">
            <h1 className="text-3xl font-bold text-gray-800 tracking-widest uppercase mb-2">Invoice</h1>
            <div className="flex justify-end items-center mb-1">
              <span className="text-sm font-semibold text-gray-500 mr-2">Invoice #:</span>
              <input type="text" className={`${inputClass} text-sm text-right w-32`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
            </div>
            <div className="flex justify-end items-center">
              <span className="text-sm font-semibold text-gray-500 mr-2">Date:</span>
              <input type="date" className={`${inputClass} text-sm text-right w-32`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
            </div>
          </div>
        </div>

        {/* PROVIDER & CLIENT DETAILS (Fully Editable) */}
        <div className="flex justify-between mb-10">
          <div className="w-5/12 pr-4">
            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Service Provider:</p>
            <h2 className="text-lg font-bold text-gray-800 uppercase">{storeSettings.storeName}</h2>
            <p className="text-sm text-gray-600 mt-1">{storeSettings.address}</p>
            <p className="text-sm text-gray-600">Phone: {storeSettings.phone}</p>
            {storeSettings.gstin && <p className="text-sm text-gray-600 font-semibold">GSTIN: {storeSettings.gstin}</p>}
          </div>
          
          <div className="w-5/12">
            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Billed To:</p>
            <input type="text" className={`${inputClass} text-lg font-bold mb-1`} placeholder="Client Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} />
            <input type="text" className={`${inputClass} text-sm mb-1`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} />
            <div className="flex items-center mt-1">
              <span className="text-sm font-semibold text-gray-600 w-16">GSTIN:</span>
              <input type="text" className={`${inputClass} text-sm`} placeholder="GST (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SERVICES TABLE (Editable rows) */}
        <div className="relative mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800 text-gray-800 text-sm">
                <th className="py-2 px-2 font-bold w-10 text-center">#</th>
                <th className="py-2 px-2 font-bold w-2/5">Service Description</th>
                <th className="py-2 px-2 font-bold text-center w-16">Hrs/Qty</th>
                <th className="py-2 px-2 font-bold text-right w-24">Rate</th>
                <th className="py-2 px-2 font-bold text-center w-16">Dis%</th>
                <th className="py-2 px-2 font-bold text-center w-16">GST%</th>
                <th className="py-2 px-2 font-bold text-right w-28">Amount</th>
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
                  <tr key={item.id} className="border-b border-gray-200 group relative">
                    <td className="py-4 px-2 text-sm text-center relative">
                      {index + 1}
                      {items.length > 1 && (
                        <button onClick={() => removeRow(index)} className="absolute -left-6 top-4 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-2"><input type="text" className={`${inputClass} text-sm font-medium`} placeholder="Type service description..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                    <td className="py-4 px-2"><input type="number" className={`${inputClass} text-sm text-center`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                    <td className="py-4 px-2"><input type="number" className={`${inputClass} text-sm text-right`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                    <td className="py-4 px-2"><input type="number" className={`${inputClass} text-sm text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                    <td className="py-4 px-2"><input type="number" className={`${inputClass} text-sm text-center`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                    <td className="py-4 px-2 text-sm text-right font-bold text-gray-800">₹{totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="mt-2 print:hidden" data-html2canvas-ignore="true">
            <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded border border-blue-200 cursor-pointer shadow-sm">
              <Plus size={16} className="mr-1" /> Add Row
            </button>
          </div>
        </div>

        {/* SUMMARY SECTION */}
        <div className="flex justify-between items-start mt-8">
          <div className="w-1/2 pr-4">
            <h4 className="font-bold text-gray-800 mb-2">Thank you for your business!</h4>
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-500 mb-1">Bank Details:</p>
              <div className="flex items-center text-sm"><span className="w-20 text-gray-600">Bank:</span> <input type="text" className={`${inputClass} w-48`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
              <div className="flex items-center text-sm mt-1"><span className="w-20 text-gray-600">A/C Name:</span> <input type="text" className={`${inputClass} w-48`} placeholder="Account Name" value={storeSettings.storeName} readOnly /></div>
              <div className="flex items-center text-sm mt-1"><span className="w-20 text-gray-600">A/C No:</span> <input type="text" className={`${inputClass} w-48`} placeholder="Account Number" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
              <div className="flex items-center text-sm mt-1"><span className="w-20 text-gray-600">IFSC:</span> <input type="text" className={`${inputClass} w-48`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Notes / Terms:</p>
              <textarea className="w-full bg-transparent outline-none border border-dashed border-gray-300 focus:border-blue-500 print:border-none text-xs text-gray-500 resize-none h-16 p-1" value={terms} onChange={e => setTerms(e.target.value)} />
            </div>
          </div>
          
          <div className="w-1/3">
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
              <span>Subtotal:</span>
              <span>₹{totals.taxableValue.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between py-2 text-green-600 border-b border-gray-200">
                <span>Discount:</span>
                <span>- ₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
              <span>Tax (GST):</span>
              <span>₹{(totals.cgst + totals.sgst).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-xl font-bold text-gray-800 border-b-2 border-gray-800 mt-2">
              <span>Total Due:</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceTemplate;
