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
  terms, setTerms, amountInWords, setAmountInWords
}) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => window.print();

  // 🔥 MARG ERP ENGINE FIX: Strictly set canvas to 794px width to prevent squishing on Mobile 🔥
  const getCanvasOptions = () => ({
    scale: 2,
    useCORS: true,
    windowWidth: 794,
    logging: false
  });

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, getCanvasOptions());
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Service_Invoice_${invoiceDetails.invoiceNumber || 'Bill'}.png`, { type: 'image/png' });
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
    const canvas = await html2canvas(invoiceRef.current, getCanvasOptions());
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Service_Invoice_${invoiceDetails.invoiceNumber || 'Invoice'}.pdf`);
  };

  // 🔥 STRICT INPUT FIX: No borders, generous padding (p-1) so text is never chopped 🔥
  const inputClass = "w-full bg-transparent outline-none border-none hover:bg-gray-100 focus:bg-gray-200 text-gray-900 font-bold px-1 py-1 rounded-sm";

  return (
    <div className="w-full">
      
      {/* ACTION BUTTONS */}
      <div className="max-w-[794px] mx-auto mb-4 flex flex-wrap justify-center sm:justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-bold text-sm cursor-pointer transition-all">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 font-bold text-sm cursor-pointer transition-all">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 font-bold text-sm cursor-pointer transition-all">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          #service-invoice-wrapper, #service-invoice-wrapper * { visibility: visible; }
          #service-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* 🔥 STRICT MOBILE SCROLL WRAPPER 🔥 */}
      <div id="service-invoice-wrapper" className="w-full overflow-x-auto bg-gray-200/40 py-4 print:p-0 print:bg-white flex justify-start sm:justify-center scrollbar-thin scrollbar-thumb-gray-800">
        
        {/* 🔥 EXACT A4 IRON BOX (794px by 1123px) 🔥 */}
        <div id="service-invoice" ref={invoiceRef} className="w-[794px] min-w-[794px] min-h-[1123px] bg-white border border-gray-300 shadow-xl text-gray-800 flex flex-col shrink-0 box-border print:border-none print:shadow-none">
          
          {/* HEADER ROW */}
          <div className="flex border-b-2 border-gray-800 relative p-8 pb-6">
            
            <div className="absolute top-0 right-0 bg-gray-800 text-white px-5 py-1.5 text-[11px] font-bold tracking-widest uppercase rounded-bl-lg print:border print:border-gray-800 print:bg-white print:text-gray-800">
               Service Invoice
            </div>

            {/* Logo - Strictly Locked */}
            <div className="w-[30%] flex items-center justify-start">
              {logo ? (
                <img src={logo} alt="Logo" className="max-h-[70px] max-w-[150px] object-contain" />
              ) : (
                <div className="text-2xl font-bold text-gray-800 tracking-wider border-2 border-gray-800 p-2">LOGO</div>
              )}
            </div>
            
            {/* Center Store Details */}
            <div className="w-[70%] flex flex-col items-end justify-center text-right pt-4">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-wide leading-none mb-1">{storeSettings.storeName}</h2>
              <p className="text-[12px] text-gray-600 font-bold uppercase">{storeSettings.address}</p>
              <p className="text-[12px] text-gray-600 font-bold mt-0.5">Contact: {storeSettings.phone}</p>
              {storeSettings.gstin && <p className="text-[13px] text-gray-800 font-extrabold mt-1 tracking-wide">GSTIN: {storeSettings.gstin}</p>}
            </div>
          </div>

          {/* PROVIDER & CLIENT DETAILS */}
          <div className="flex px-8 py-6 border-b border-gray-200 text-[13px] gap-6">
            
            {/* BILLED TO */}
            <div className="w-[60%] flex flex-col gap-1 border-r-2 border-gray-100 pr-6">
              <p className="text-[12px] text-gray-500 mb-2 font-black uppercase tracking-wider">Billed To (Client):</p>
              <div className="flex items-center"><span className="w-[70px] font-bold text-gray-600">Name:</span><input type="text" className={`${inputClass} text-[15px] font-black uppercase text-black`} placeholder="Client Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[70px] font-bold text-gray-600">Address:</span><input type="text" className={`${inputClass} uppercase`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center">
                <span className="w-[70px] font-bold text-gray-600">GSTIN:</span>
                <input type="text" className={`${inputClass} font-extrabold uppercase text-black`} placeholder="GST Number (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} />
              </div>
            </div>
            
            {/* INVOICE META */}
            <div className="w-[40%] flex flex-col justify-center">
              <div className="flex items-center mb-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase w-[90px]">Invoice No:</span>
                <input type="text" className={`${inputClass} font-black text-right text-[14px] text-black`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
              </div>
              <div className="flex items-center mb-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase w-[90px]">Date:</span>
                <input type="date" className={`${inputClass} font-bold text-right text-black`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
              </div>
              <div className="flex items-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase w-[90px]">State:</span>
                <input type="text" className={`${inputClass} font-bold text-right uppercase text-black`} value={invoiceDetails.stateCode || '07-DELHI'} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} />
              </div>
            </div>
          </div>

          {/* SERVICES TABLE */}
          <div className="flex-grow flex flex-col px-8 py-4 relative">
            <table className="w-full text-left border-collapse border-y-2 border-gray-800">
              <thead>
                <tr className="text-gray-800 text-[12px] uppercase tracking-wider text-center border-b border-gray-300">
                  <th className="py-2 px-1 font-bold w-[5%]">#</th>
                  <th className="py-2 px-2 font-bold w-[30%] text-left">Service Description</th>
                  <th className="py-2 px-1 font-bold w-[10%]">SAC/HSN</th>
                  <th className="py-2 px-1 font-bold w-[10%]">Hrs/Qty</th>
                  <th className="py-2 px-1 font-bold w-[12%] text-right pr-2">Rate</th>
                  <th className="py-2 px-1 font-bold w-[8%]">Dis%</th>
                  <th className="py-2 px-1 font-bold w-[8%]">GST%</th>
                  <th className="py-2 px-2 font-bold w-[17%] text-right">Amount</th>
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
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 align-top group relative text-[13px]">
                      <td className="py-2 px-1 text-center font-bold text-gray-500 relative pt-3">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-7 top-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-2"><input type="text" className={`${inputClass} font-black uppercase text-black`} placeholder="Type service description..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="py-2 px-1"><input type="text" className={`${inputClass} text-center uppercase`} value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="py-2 px-1"><input type="number" className={`${inputClass} text-center font-bold text-black`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="py-2 px-1"><input type="number" className={`${inputClass} text-right font-bold text-black`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="py-2 px-1"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="py-2 px-1"><input type="number" className={`${inputClass} text-center font-bold text-black`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="py-2 px-2 text-[14px] text-right font-black text-black pt-3">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-4 print:hidden" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-[13px] font-bold text-gray-600 hover:text-gray-800 bg-gray-100 px-4 py-2 rounded border border-gray-300 shadow-sm cursor-pointer transition-colors">
                <Plus size={16} className="mr-2" /> Add New Row
              </button>
            </div>
          </div>

          {/* SUMMARY & TERMS SECTION */}
          <div className="px-8 pb-8 flex mt-auto gap-8 pt-4">
            
            {/* Terms & Bank Details */}
            <div className="w-[55%] flex flex-col justify-between">
              
              <div>
                <h4 className="font-bold text-gray-800 mb-3 text-[12px] uppercase tracking-wide">Thank you for your business!</h4>
                
                {/* Bank Details */}
                <div className="mb-3 bg-gray-50 p-3 border border-gray-200 rounded">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Details:</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[12px]">
                    <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">Bank:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Bank Name" value={bankDetails?.bankName || ''} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                    <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">Branch:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Branch" value={bankDetails?.branch || ''} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                    <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">A/C No:</span> <input type="text" className={`${inputClass} uppercase font-bold text-black`} placeholder="Account No" value={bankDetails?.accountNo || ''} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                    <div className="flex items-center"><span className="w-16 font-semibold text-gray-600">IFSC:</span> <input type="text" className={`${inputClass} uppercase font-bold text-black`} placeholder="IFSC Code" value={bankDetails?.ifsc || ''} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="mb-4 flex items-center">
                  <span className="mr-2 font-bold whitespace-nowrap text-[11px] uppercase text-gray-500">Amount in Words:</span>
                  <input type="text" className={`${inputClass} font-black text-[13px] uppercase border-b border-gray-300 rounded-none`} placeholder="Rupees..." value={amountInWords || ''} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
                </div>
              </div>

              {/* Terms */}
              <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Notes / Terms:</p>
                <textarea className="w-full bg-transparent outline-none border-none text-[12px] text-gray-800 font-semibold resize-none h-12 leading-relaxed" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>
            
            {/* Financial Totals */}
            <div className="w-[45%] flex flex-col">
              <div className="flex justify-between py-2 border-b border-gray-200 text-[13px] text-gray-600 font-medium">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-800">₹{totals.taxableValue.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
               <div className="flex justify-between py-2 border-b border-gray-200 text-[13px] font-medium text-red-500">
                  <span>Discount:</span>
                  <span className="font-bold">-₹{totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200 text-[13px] text-gray-600 font-medium">
                <span>Tax (SGST + CGST):</span>
                <span className="font-bold text-gray-800">+₹{(totals.cgst + totals.sgst).toFixed(2)}</span>
              </div>
              {totals.roundoff !== 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 text-[13px] text-gray-600 font-medium">
                  <span>Roundoff:</span>
                  <span className="font-bold text-gray-800">{totals.roundoff > 0 ? '+' : ''}₹{totals.roundoff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 text-xl font-bold text-gray-800 border-y-2 border-gray-800 mt-2 items-center bg-gray-50 px-2">
                <span className="uppercase tracking-wide">Total Due:</span>
                <span className="text-[20px] font-black">₹{totals.grandTotal.toFixed(2)}</span>
              </div>

              {/* Signature */}
              <div className="mt-14 flex flex-col items-center justify-end relative h-[60px]">
                <p className="absolute top-0 right-0 text-[10px] text-gray-500 font-bold uppercase w-full text-right">
                  For {storeSettings.storeName}
                </p>
                <p className="border-t-2 border-gray-400 pt-2 text-[11px] text-gray-600 font-bold w-[70%] ml-auto text-center mt-auto">
                  Authorised Signatory
                </p>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ServiceTemplate;
