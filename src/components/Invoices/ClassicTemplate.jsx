import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Trash2, Plus, Printer, Share2, Download } from 'lucide-react';

const ClassicTemplate = ({
  logo, storeSettings, invoiceDetails, setInvoiceDetails,
  buyerDetails, setBuyerDetails, bankDetails, setBankDetails,
  amountInWords, setAmountInWords, terms, setTerms,
  items, handleItemChange, addRow, removeRow, totals
}) => {
  const invoiceRef = useRef(null);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `${invoiceDetails.invoiceNumber || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Invoice', text: 'Invoice Attached.' });
        } else {
          alert("Device share support nahi karta. Please 'Save PDF' karein.");
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
    pdf.save(`${invoiceDetails.invoiceNumber || 'Bill'}.pdf`);
  };

  // 🔥 Strict Input Style: Fixed padding, no height lock taaki text na kate 🔥
  const inputStyle = "w-full outline-none bg-transparent text-black border-none hover:bg-gray-100 focus:bg-blue-50 font-bold px-1 py-0.5";

  return (
    <div className="w-full">
      {/* ACTION BUTTONS */}
      <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap justify-center sm:justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer">
          <Printer size={16} className="mr-2" /> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer">
          <Share2 size={16} className="mr-2" /> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer">
          <Download size={16} className="mr-2" /> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #classic-invoice-wrapper, #classic-invoice-wrapper * { visibility: visible; }
          #classic-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
        }
      `}</style>

      {/* HORIZONTAL SCROLL WRAPPER */}
      <div id="classic-invoice-wrapper" className="w-full overflow-x-auto pb-4 print:pb-0 scrollbar-thin scrollbar-thumb-gray-400">
        
        {/* 🔥 MAIN INVOICE CONTAINER 🔥 */}
        <div id="classic-invoice" ref={invoiceRef} className="min-w-[800px] max-w-[210mm] mx-auto bg-white text-black border-2 border-black flex flex-col" style={{ minHeight: '1050px' }}>
          
          {/* 1. HEADER - FIXED LOGO SIZE & ALIGNMENT */}
          <div className="flex border-b-2 border-black relative">
            {/* Logo Box - Locked Height */}
            <div className="w-[20%] p-2 border-r-2 border-black flex items-center justify-center">
              {logo ? (
                <img src={logo} alt="Store Logo" className="h-[60px] w-auto object-contain" />
              ) : (
                <div className="text-xl font-bold">LOGO</div>
              )}
            </div>
            
            {/* Store Details Center Box */}
            <div className="w-[60%] p-2 flex flex-col items-center justify-center text-center relative pt-6">
              {/* Tax Invoice Badge - Fixed position */}
              <div className="bg-black text-white px-4 py-0.5 text-[11px] font-bold uppercase tracking-widest absolute top-0 rounded-b-md print:border print:border-black print:text-black print:bg-white">
                Tax Invoice
              </div>
              <h1 className="text-3xl font-black uppercase text-black leading-none mb-1">{storeSettings.storeName}</h1>
              <p className="text-xs font-bold uppercase text-black">{storeSettings.address}</p>
              <p className="text-xs font-bold text-black mt-0.5">Contact: {storeSettings.phone}</p>
            </div>

            {/* GSTIN Box */}
            <div className="w-[20%] p-2 border-l-2 border-black flex flex-col justify-center">
              <div className="text-[10px] font-bold text-gray-500 text-right mb-2 print:hidden" data-html2canvas-ignore="true">Original for Buyer</div>
              <p className="text-xs font-bold text-black">GSTIN:</p>
              <p className="text-sm font-extrabold text-black mb-1">{storeSettings.gstin}</p>
              <p className="text-xs font-bold text-black">D.L. No:</p>
              <p className="text-xs font-extrabold text-black">{storeSettings.dlNumber}</p>
            </div>
          </div>

          {/* 2. INVOICE META DETAILS */}
          <div className="grid grid-cols-2 border-b-2 border-black text-xs">
            <div className="p-2 border-r-2 border-black grid grid-cols-[90px_1fr] gap-y-1 items-center">
              <span className="font-bold text-gray-800">Invoice No:</span> 
              <input type="text" className={inputStyle} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
              
              <span className="font-bold text-gray-800">Invoice Date:</span> 
              <input type="date" className={inputStyle} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
              
              <span className="font-bold text-gray-800">State:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} />
            </div>
            
            <div className="p-2 grid grid-cols-[90px_1fr] gap-y-1 items-center">
              <span className="font-bold text-gray-800">PAN NO.:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} />
              
              <span className="font-bold underline col-span-2 mt-1 mb-1 text-[13px]">SHIPPED TO PARTY:</span>
              
              <span className="font-bold text-gray-800">GSTIN:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} />
            </div>
          </div>

          {/* 3. BUYER DETAILS */}
          <div className="grid grid-cols-2 border-b-2 border-black text-xs">
            <div className="p-2 border-r-2 border-black grid grid-cols-[70px_1fr] gap-y-1 items-center">
              <span className="font-bold underline col-span-2 mb-1 text-[13px]">Details Of Receiver (Billed to)</span>
              
              <span className="font-bold text-gray-800">Name:</span> 
              <input type="text" className={`uppercase text-[14px] ${inputStyle}`} value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} />
              
              <span className="font-bold text-gray-800">Address:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} />
              
              <span className="font-bold text-gray-800">GSTIN:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} />
              
              <span className="font-bold text-gray-800">State:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} />
            </div>
            
            <div className="p-2 grid grid-cols-[90px_1fr] gap-y-1 items-start">
              <span className="font-bold underline col-span-2 mb-1 text-[13px]">Transportation Details</span>
              
              <span className="font-bold text-gray-800">Transporter:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} />
              
              <span className="font-bold text-gray-800">Veh/GSTIN:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} />
              
              <div className="col-span-2 grid grid-cols-[60px_1fr_40px_1fr] gap-2 items-center mt-2">
                <span className="font-bold text-gray-800">L.R No:</span> 
                <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} />
                <span className="font-bold text-gray-800">Date:</span> 
                <input type="date" className={inputStyle} value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 4. ITEMS TABLE */}
          <div className="flex-grow flex flex-col relative text-black">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="border-b-2 border-black font-extrabold bg-gray-100 uppercase tracking-tight">
                <tr>
                  <th className="border-r border-black p-1.5 w-8">S.N</th>
                  <th className="border-r border-black p-1.5 w-16">Code</th>
                  <th className="border-r border-black p-1.5 text-left pl-2">Description of Goods</th>
                  <th className="border-r border-black p-1.5 w-16">HSN</th>
                  <th className="border-r border-black p-1.5 w-12">Qty</th>
                  <th className="border-r border-black p-1.5 w-16">Rate</th>
                  <th className="border-r border-black p-1.5 w-20">Taxable</th>
                  <th className="border-r border-black p-1.5 w-10">DIS%</th>
                  <th className="border-r border-black p-1.5 w-14">DIS Amt</th>
                  <th className="border-r border-black p-1.5 w-10">GST%</th>
                  <th className="border-r border-black p-1.5 w-14">GST Amt</th>
                  <th className="p-1.5 w-24">Net Amt</th>
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
                    <tr key={item.id} className="border-b border-gray-300 group hover:bg-gray-50 align-top">
                      <td className="border-r border-black p-1 relative font-bold pt-1.5">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="border-r border-black p-1"><input type="text" className={`text-center uppercase ${inputStyle}`} value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                      <td className="border-r border-black p-1 pl-2"><input type="text" className={`text-left uppercase ${inputStyle}`} placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="text" className={`text-center ${inputStyle}`} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center ${inputStyle}`} value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-right ${inputStyle}`} value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right font-semibold pt-1.5 pr-1">{baseAmount.toFixed(2)}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center ${inputStyle}`} value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pt-1.5 pr-1">{disAmt > 0 ? disAmt.toFixed(2) : ''}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center ${inputStyle}`} value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pt-1.5 pr-1">{gstAmt > 0 ? gstAmt.toFixed(2) : ''}</td>
                      <td className="p-1 text-right font-bold pr-2 pt-1.5">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON */}
            <div className="p-2 print:hidden" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200 cursor-pointer shadow-sm">
                <Plus size={14} className="mr-1" /> Add Item Row
              </button>
            </div>
          </div>

          {/* 5. FOOTER */}
          <div className="grid grid-cols-12 border-t-2 border-black text-xs mt-auto w-full bg-white">
            
            {/* LEFT FOOTER */}
            <div className="col-span-8 border-r-2 border-black flex flex-col justify-between">
              
              <div className="p-2 border-b border-black">
                <div className="font-bold underline mb-1">Bank Details</div>
                <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-2 gap-y-1 items-center">
                  <span className="font-bold">Bank:</span> <input type="text" className={`uppercase ${inputStyle}`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                  <span className="font-bold">Branch:</span> <input type="text" className={`uppercase ${inputStyle}`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} />
                  <span className="font-bold">A/c No:</span> <input type="text" className={`uppercase font-extrabold ${inputStyle}`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} />
                  <span className="font-bold">IFSC:</span> <input type="text" className={`uppercase font-extrabold ${inputStyle}`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
                </div>
              </div>
              
              <div className="p-2 border-b border-black font-bold uppercase flex items-center bg-gray-50">
                <span className="mr-2 whitespace-nowrap">Rs. (In Words):</span>
                <input type="text" className={`uppercase ${inputStyle}`} placeholder="Type total amount in words..." value={amountInWords} onChange={e => setAmountInWords(e.target.value)} />
              </div>

              <div className="p-2 text-[11px]">
                <div className="font-bold underline mb-1">Terms & conditions</div>
                <textarea className="w-full outline-none bg-transparent resize-none h-10 text-black font-medium leading-tight" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            {/* RIGHT FOOTER (TOTALS) */}
            <div className="col-span-4 flex flex-col">
              <div className="p-2 border-b border-black font-bold text-[12px] flex-grow">
                <div className="flex justify-between mb-1"><span>Total Taxable Value</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1 text-red-600"><span>Less: Discount</span> <span>- {totals.discount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1"><span>Add: SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1"><span>Add: CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-gray-300 pt-1 mt-1"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
              </div>
              <div className="p-2 border-b-2 border-black bg-gray-200 font-black text-lg flex justify-between items-center">
                <span>Grand Total</span> 
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="p-2 flex-grow flex flex-col items-center justify-between relative min-h-[80px]">
                <span className="text-[10px] font-bold text-black uppercase text-right w-full">For {storeSettings.storeName}</span>
                <span className="font-bold border-t border-black pt-1 px-4 text-black text-[11px] w-full text-center mt-auto">Authorised Signatory</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassicTemplate;
