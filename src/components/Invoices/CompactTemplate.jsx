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

  // 🔥 MARG ERP PDF ENGINE FIX: Force 794px width so mobile capture doesn't squish the PDF 🔥
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
        const file = new File([blob], `Retail_Bill_${invoiceDetails.invoiceNumber || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Invoice', text: 'Your bill is attached.' });
        } else {
          alert("Device share support nahi kar raha. 'Save PDF' karein.");
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
    pdf.save(`Retail_Bill_${invoiceDetails.invoiceNumber}.pdf`);
  };

  // 🔥 STRICT INPUT STYLE: No dashed borders. Generous padding so text never chops.
  const inputStyle = "w-full outline-none bg-transparent text-black border-none hover:bg-gray-100 focus:bg-gray-50 font-bold px-1 py-1 rounded-sm";

  return (
    <div className="w-full">
      {/* ACTION BUTTONS */}
      <div className="max-w-[794px] mx-auto mb-4 flex flex-wrap justify-center sm:justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded shadow font-bold text-sm transition-all cursor-pointer">
          <Printer size={16} className="mr-2"/> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-sm transition-all cursor-pointer">
          <Share2 size={16} className="mr-2"/> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold text-sm transition-all cursor-pointer">
          <Download size={16} className="mr-2"/> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          #compact-invoice-wrapper, #compact-invoice-wrapper * { visibility: visible; }
          #compact-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* 🔥 STRICT MOBILE SCROLL WRAPPER 🔥 */}
      <div id="compact-invoice-wrapper" className="w-full overflow-x-auto bg-gray-200/50 py-4 print:p-0 print:bg-white flex justify-start sm:justify-center scrollbar-thin scrollbar-thumb-gray-500">
        
        {/* 🔥 EXACT A4 SIZE LOCKED (794px by 1123px). IT WILL NEVER SQUISH 🔥 */}
        <div id="compact-invoice" ref={invoiceRef} className="w-[794px] min-w-[794px] min-h-[1123px] mx-auto bg-white p-6 border border-gray-400 shadow-xl text-black flex flex-col shrink-0 box-border print:border-none print:shadow-none">
          
          {/* HEADER SECTION */}
          <div className="border-b-2 border-black pb-4 mb-4 relative flex items-center justify-between">
            
            {/* Tax Invoice Badge Center-Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-0.5 text-[11px] font-bold rounded-b-md uppercase tracking-widest print:border print:border-black print:bg-white print:text-black">
              Retail Tax Invoice
            </div>

            {/* Logo - Fixed max width/height so it never breaks layout */}
            <div className="w-[25%] flex items-start justify-start pt-2">
              {logo ? (
                 <img src={logo} alt="Store Logo" className="max-h-[60px] max-w-[120px] object-contain" />
              ) : (
                <div className="text-xl font-bold border-2 border-black p-1">LOGO</div>
              )}
            </div>
            
            {/* Center Store Details */}
            <div className="w-[50%] flex flex-col items-center justify-center pt-4">
              <h1 className="text-3xl font-black uppercase tracking-wide text-black leading-none mb-1">{storeSettings.storeName}</h1>
              <p className="text-xs font-bold uppercase text-black">{storeSettings.address}</p>
              <p className="text-xs font-bold text-black mt-0.5">Contact: {storeSettings.phone}</p>
            </div>

            {/* Right Meta Details */}
            <div className="w-[25%] flex flex-col items-end justify-center pt-4 text-right">
                {storeSettings.gstin && <p className="text-xs font-bold text-black bg-gray-100 px-2 py-0.5 rounded">GSTIN: {storeSettings.gstin}</p>}
            </div>
          </div>

          {/* BILLED TO & INVOICE DETAILS GRID */}
          <div className="flex justify-between border-b-2 border-black pb-4 mb-4 text-[13px]">
            
            {/* Left: Customer Details */}
            <div className="w-[55%] pr-4 flex flex-col gap-1 border-r-2 border-black">
              <div className="font-bold underline mb-1 text-[13px] bg-gray-100 px-2 py-0.5 inline-block w-max">Billed To (Customer):</div>
              <div className="flex items-center"><span className="w-[60px] font-bold">Name:</span> <input type="text" className={`${inputStyle} uppercase font-black text-[14px]`} placeholder="Customer Name" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[60px] font-bold">Address:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Address" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[60px] font-bold">GSTIN:</span> <input type="text" className={`${inputStyle} uppercase font-extrabold`} placeholder="GST (Optional)" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
            </div>
            
            {/* Right: Invoice Details */}
            <div className="w-[45%] pl-4 flex flex-col gap-1 justify-center">
              <div className="flex items-center"><span className="w-[80px] font-bold">Bill No:</span> <input type="text" className={`${inputStyle} font-black text-[14px]`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[80px] font-bold">Date:</span> <input type="date" className={`${inputStyle} font-bold`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-[80px] font-bold">State:</span> <input type="text" className={`${inputStyle} uppercase`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
            </div>
          </div>

          {/* TABLE AREA */}
          <div className="relative mb-6">
            <table className="w-full text-left border-collapse border-2 border-black">
              <thead>
                <tr className="bg-gray-100 text-[11px] font-extrabold uppercase border-b-2 border-black tracking-tight text-center">
                  <th className="border-r-2 border-black p-1.5 w-8">#</th>
                  <th className="border-r-2 border-black p-1.5 text-left pl-2">Product Description</th>
                  <th className="border-r-2 border-black p-1.5 w-16">HSN</th>
                  <th className="border-r-2 border-black p-1.5 w-12">Qty</th>
                  <th className="border-r-2 border-black p-1.5 w-16 text-right pr-2">Rate</th>
                  <th className="border-r-2 border-black p-1.5 w-12">Dis%</th>
                  <th className="border-r-2 border-black p-1.5 w-12">GST%</th>
                  <th className="p-1.5 w-24 text-right pr-2">Amount</th>
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
                    <tr key={item.id} className="border-b border-gray-300 text-[13px] group relative align-middle hover:bg-gray-50">
                      <td className="border-r-2 border-black p-1.5 text-center font-bold relative">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-7 top-1 text-red-500 print:hidden" data-html2canvas-ignore="true">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                      <td className="border-r-2 border-black p-1.5 pl-2"><input type="text" className={`${inputStyle} font-bold uppercase text-[13px]`} placeholder="Type product name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r-2 border-black p-1.5"><input type="text" className={`${inputStyle} text-center`} value={item.hsn || ''} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r-2 border-black p-1.5"><input type="number" className={`${inputStyle} text-center font-bold`} placeholder="0" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r-2 border-black p-1.5"><input type="number" className={`${inputStyle} text-right font-bold`} placeholder="0.00" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r-2 border-black p-1.5"><input type="number" className={`${inputStyle} text-center`} placeholder="0" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r-2 border-black p-1.5"><input type="number" className={`${inputStyle} text-center font-bold`} placeholder="0" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="p-1.5 text-right font-black pr-2 text-[14px]">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON: Flow ke andar hai, kabhi gayab nahi hoga */}
            <div className="mt-3 print:hidden" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded cursor-pointer shadow-sm">
                <Plus size={16} className="mr-2" /> Add Item Row
              </button>
            </div>
          </div>

          {/* 🔥 FOOTER AREA (mt-auto pushes it to the bottom, NO absolute positioning) 🔥 */}
          <div className="flex border-t-2 border-b-2 border-black text-[13px] mt-auto border-l-2 border-r-2 w-full">
            
            {/* LEFT FOOTER (Bank & Terms) */}
            <div className="w-[60%] flex flex-col justify-between border-r-2 border-black">
              
              <div className="p-3 border-b-2 border-black bg-gray-50/50">
                <p className="font-bold underline mb-2 text-black">Bank Details:</p>
                <div className="grid grid-cols-[50px_1fr_60px_1fr] gap-x-2 gap-y-2 items-center">
                  <span className="font-bold text-gray-800">Bank:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                  <span className="font-bold text-gray-800">Branch:</span> <input type="text" className={`${inputStyle} uppercase`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} />
                  <span className="font-bold text-gray-800">A/C:</span> <input type="text" className={`${inputStyle} font-black uppercase`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} />
                  <span className="font-bold text-gray-800">IFSC:</span> <input type="text" className={`${inputStyle} font-black uppercase`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
                </div>
              </div>

              <div className="p-3 border-b-2 border-black flex items-center bg-gray-100">
                <span className="mr-2 font-bold whitespace-nowrap text-gray-800 uppercase">Amt in Words:</span>
                <input type="text" className={`${inputStyle} font-black text-[13px] uppercase bg-transparent`} placeholder="Rupees..." value={amountInWords || ''} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
              </div>

              <div className="p-3 flex-grow">
                <p className="font-bold underline mb-1 text-black">Terms & Conditions:</p>
                <textarea className="w-full bg-transparent outline-none border-none text-black font-semibold resize-none h-10 leading-tight" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            {/* RIGHT FOOTER (Totals) */}
            <div className="w-[40%] flex flex-col bg-gray-50/50">
              <div className="p-3 flex-grow font-semibold text-[13px]">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-800">Subtotal:</span>
                  <span className="font-extrabold text-black">{totals.taxableValue.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Discount:</span>
                    <span className="font-extrabold">- {totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-800">Tax (GST):</span>
                  <span className="font-extrabold text-black">+ {(totals.cgst + totals.sgst).toFixed(2)}</span>
                </div>
                {totals.roundoff !== 0 && (
                  <div className="flex justify-between pt-2 mt-1 border-t border-gray-300">
                    <span className="text-gray-800">Roundoff:</span>
                    <span className="font-extrabold text-black">{totals.roundoff > 0 ? '+' : ''} {totals.roundoff.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between font-black text-[16px] border-t-2 border-black bg-gray-200 p-3 items-center">
                <span>Net Payable:</span>
                <span className="text-[20px]">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              
              <div className="p-3 pt-12 flex flex-col items-center justify-between relative bg-white">
                <span className="text-[10px] font-bold text-gray-800 uppercase absolute top-2 right-2">For {storeSettings.storeName}</span>
                <span className="font-bold border-t-2 border-black pt-1 px-4 w-[80%] text-center text-[11px] text-black">Authorised Signatory</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default CompactTemplate;
