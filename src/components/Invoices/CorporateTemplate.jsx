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

  // 🔥 Strict Engine Settings: Force 794px (A4 width) so PDF is always perfect
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
    const canvas = await html2canvas(invoiceRef.current, getCanvasOptions());
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Corporate_Invoice_${invoiceDetails.invoiceNumber || 'Bill'}.pdf`);
  };

  // 🔥 PERFECT INPUT FIX: Padding top/bottom added so text never chops. No borders.
  const inputClass = "w-full bg-transparent outline-none border-none hover:bg-gray-100 focus:bg-blue-50 text-gray-900 font-bold px-1 py-1 rounded-sm";

  return (
    <div className="w-full">
      
      {/* ACTION BUTTONS */}
      <div className="max-w-[794px] mx-auto mb-4 flex flex-wrap justify-center sm:justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-blue-700 text-white px-4 py-2 rounded shadow hover:bg-blue-800 font-bold text-sm cursor-pointer">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 font-bold text-sm cursor-pointer">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-bold text-sm cursor-pointer">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          #corporate-invoice-wrapper, #corporate-invoice-wrapper * { visibility: visible; }
          #corporate-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* 🔥 MOBILE HORIZONTAL SCROLL WRAPPER 🔥 */}
      <div id="corporate-invoice-wrapper" className="w-full overflow-x-auto bg-gray-200/40 py-4 print:p-0 print:bg-transparent flex justify-start sm:justify-center scrollbar-thin scrollbar-thumb-blue-800">
        
        {/* 🔥 THE IRON BOX: Strictly locked to 794px (A4). It WILL NEVER squish on mobile! 🔥 */}
        <div id="corporate-invoice" ref={invoiceRef} className="bg-white border border-gray-300 shadow-xl text-gray-800 flex flex-col shrink-0 relative print:border-none print:shadow-none" style={{ width: '794px', minWidth: '794px', minHeight: '1123px' }}>
          
          {/* TOP BLUE ACCENT BAR */}
          <div className="h-3 w-full bg-blue-800 absolute top-0 left-0"></div>

          {/* 1. HEADER (Strict 3-column Grid) */}
          <div className="flex border-b-2 border-blue-200 mt-3 pt-6 pb-4 px-8 items-center justify-between">
            
            {/* Left: Logo (Strict Size Lock) */}
            <div className="w-[25%] h-[80px] flex items-center justify-start">
              {logo ? (
                <img src={logo} alt="Company Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-2xl font-bold text-blue-800 tracking-wider">LOGO</div>
              )}
            </div>
            
            {/* Center: Store Details */}
            <div className="w-[50%] flex flex-col items-center justify-center text-center relative">
              <div className="absolute -top-10 bg-blue-800 text-white px-5 py-1 text-[11px] font-bold rounded-b-md uppercase tracking-widest print:border print:border-blue-800 print:bg-white print:text-blue-800">
                Corporate Tax Invoice
              </div>
              <h1 className="text-3xl font-black text-blue-800 uppercase tracking-widest leading-none mb-1 mt-2">{storeSettings.storeName}</h1>
              <p className="text-[12px] font-bold text-gray-700 uppercase">{storeSettings.address}</p>
              <p className="text-[12px] font-bold text-gray-700 mt-0.5">Contact: {storeSettings.phone}</p>
            </div>

            {/* Right: GSTIN */}
            <div className="w-[25%] flex flex-col items-end justify-center">
              {storeSettings.gstin && <p className="text-[13px] font-bold text-gray-800 bg-blue-50 px-2 py-1 rounded border border-blue-100">GSTIN: <span className="font-black text-black">{storeSettings.gstin}</span></p>}
            </div>
          </div>

          {/* 2. META & BUYER DETAILS */}
          <div className="flex px-8 py-4 border-b-2 border-blue-100 text-[13px]">
            
            {/* Left Box: Billed To */}
            <div className="w-[60%] pr-4 border-r-2 border-blue-100 flex flex-col gap-1">
              <p className="text-[12px] text-blue-800 font-bold uppercase mb-1 bg-blue-50 w-max px-2 py-0.5 rounded">Invoice To (Client):</p>
              <div className="flex items-center"><span className="w-[80px] font-bold text-gray-600">Name:</span> <input type="text" className={`${inputClass} text-[15px] font-black uppercase text-black`} placeholder="Client Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[80px] font-bold text-gray-600">Address:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[80px] font-bold text-gray-600">GSTIN:</span> <input type="text" className={`${inputClass} uppercase font-extrabold text-black`} placeholder="GST Number (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
            </div>
            
            {/* Right Box: Invoice Info */}
            <div className="w-[40%] pl-4 flex flex-col gap-1 justify-center">
              <div className="flex items-center"><span className="text-[12px] text-blue-800 font-bold uppercase w-[90px]">Inv Number:</span> <input type="text" className={`${inputClass} font-black text-[14px] text-black`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
              <div className="flex items-center"><span className="text-[12px] text-blue-800 font-bold uppercase w-[90px]">Inv Date:</span> <input type="date" className={`${inputClass} font-bold`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
              <div className="flex items-center"><span className="text-[12px] text-blue-800 font-bold uppercase w-[90px]">State:</span> <input type="text" className={`${inputClass} uppercase font-bold`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
            </div>
          </div>

          {/* 3. CORPORATE TABLE (Strict Widths) */}
          <div className="px-8 py-4 relative flex-grow flex flex-col">
            <table className="w-full text-left border-collapse border-2 border-blue-200">
              <thead>
                <tr className="bg-blue-800 text-white text-[12px] uppercase tracking-wider text-center">
                  <th className="py-2 px-1 font-bold w-[5%] border-r border-blue-700">#</th>
                  <th className="py-2 px-2 font-bold w-[30%] border-r border-blue-700 text-left">Item Description</th>
                  <th className="py-2 px-1 font-bold w-[10%] border-r border-blue-700">HSN</th>
                  <th className="py-2 px-1 font-bold w-[10%] border-r border-blue-700">Qty</th>
                  <th className="py-2 px-1 font-bold w-[12%] border-r border-blue-700 text-right">Rate</th>
                  <th className="py-2 px-1 font-bold w-[8%] border-r border-blue-700">Dis%</th>
                  <th className="py-2 px-1 font-bold w-[8%] border-r border-blue-700">GST%</th>
                  <th className="py-2 px-2 font-bold w-[17%] text-right">Net Amount</th>
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
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-blue-50/50 align-top group relative text-[13px]">
                      <td className="py-2 px-1 text-center font-bold relative border-r border-gray-200 pt-2.5">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-7 top-1.5 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-200"><input type="text" className={`${inputClass} font-black uppercase text-black text-[13px]`} placeholder="Type item name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="py-2 px-1 border-r border-gray-200"><input type="text" className={`${inputClass} text-center uppercase`} value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="py-2 px-1 border-r border-gray-200"><input type="number" className={`${inputClass} text-center font-bold text-black`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="py-2 px-1 border-r border-gray-200"><input type="number" className={`${inputClass} text-right font-bold text-black`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="py-2 px-1 border-r border-gray-200"><input type="number" className={`${inputClass} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="py-2 px-1 border-r border-gray-200"><input type="number" className={`${inputClass} text-center font-bold text-black`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="py-2 px-2 text-right font-black text-black pt-2.5 text-[14px]">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON: Always below the table */}
            <div className="mt-4 print:hidden" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-[13px] font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded shadow-sm">
                <Plus size={16} className="mr-2" /> Add New Row
              </button>
            </div>
          </div>

          {/* 4. FOOTER / TOTALS */}
          <div className="px-8 pb-8 flex mt-auto gap-6">
            
            {/* Payment & Terms */}
            <div className="w-[60%] flex flex-col justify-between">
              
              <div className="bg-blue-50/60 p-4 rounded-md border border-blue-200">
                <p className="text-[11px] text-blue-800 font-black uppercase tracking-wider mb-2">Payment / Bank Details</p>
                <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-[13px]">
                  <span className="font-bold text-gray-700">Bank Name:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                  <span className="font-bold text-gray-700">Branch:</span> <input type="text" className={`${inputClass} uppercase`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} />
                  <span className="font-bold text-gray-700">A/C No:</span> <input type="text" className={`${inputClass} uppercase font-black text-black`} placeholder="Account Number" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} />
                  <span className="font-bold text-gray-700">IFSC Code:</span> <input type="text" className={`${inputClass} uppercase font-black text-black`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
                </div>
              </div>

              <div className="mt-3 flex items-center bg-gray-50 p-2 border border-gray-200 rounded">
                <span className="mr-2 font-bold whitespace-nowrap text-[11px] text-blue-800 uppercase tracking-wide">Amt in Words:</span>
                <input type="text" className={`${inputClass} font-black text-[13px] uppercase text-black bg-transparent`} placeholder="Rupees..." value={amountInWords || ''} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
              </div>

              <div className="mt-3">
                <p className="text-[11px] text-gray-500 font-bold uppercase mb-1">Terms & Conditions:</p>
                <textarea className="w-full bg-transparent outline-none border-none text-[12px] text-gray-800 font-semibold resize-none h-12 leading-tight" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>
            
            {/* Financial Totals */}
            <div className="w-[40%] border-2 border-blue-200 rounded-lg flex flex-col overflow-hidden bg-white">
              <div className="p-4 flex-grow text-[13px] font-medium text-gray-700">
                <div className="flex justify-between mb-2">
                  <span>Total Taxable Value:</span>
                  <span className="font-bold text-black">₹{totals.taxableValue.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Total Discount:</span>
                    <span className="font-bold">-₹{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span>Add SGST:</span>
                  <span className="font-bold text-black">+₹{totals.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Add CGST:</span>
                  <span className="font-bold text-black">+₹{totals.cgst.toFixed(2)}</span>
                </div>
                {totals.roundoff !== 0 && (
                  <div className="flex justify-between pt-2 border-t border-gray-200 mt-1">
                    <span>Roundoff:</span>
                    <span className="font-bold text-black">{totals.roundoff > 0 ? '+' : ''}₹{totals.roundoff.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center bg-blue-800 text-white p-4">
                <span className="text-[14px] font-bold uppercase tracking-wider">Grand Total:</span>
                <span className="text-2xl font-black">₹{totals.grandTotal.toFixed(2)}</span>
              </div>

              <div className="p-4 pt-12 flex flex-col justify-end bg-white relative">
                <p className="absolute top-2 right-4 text-[10px] text-gray-500 font-bold uppercase">
                  For {storeSettings.storeName}
                </p>
                <p className="border-t-2 border-blue-800 pt-2 text-[12px] text-gray-800 font-bold text-center uppercase w-full">
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

export default CorporateTemplate;
