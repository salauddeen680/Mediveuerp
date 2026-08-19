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
        const file = new File([blob], `${invoiceDetails.invoiceNumber}.png`, { type: 'image/png' });
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
    pdf.save(`${invoiceDetails.invoiceNumber}.pdf`);
  };

  // COMMON INPUT STYLES (Dotted on screen, invisible on Print)
  const inputStyle = "outline-none bg-transparent text-black border-b border-gray-300 border-dashed print:border-none focus:border-solid focus:border-teal-500 font-medium";

  return (
    <div>
      {/* CLASSIC ACTION BUTTONS */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded shadow font-bold text-sm transition-all cursor-pointer">
          <Printer size={16} className="mr-2" /> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-sm transition-all cursor-pointer">
          <Share2 size={16} className="mr-2" /> Share (Photo)
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold text-sm transition-all cursor-pointer">
          <Download size={16} className="mr-2" /> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #classic-invoice-wrapper, #classic-invoice-wrapper * { visibility: visible; }
          #classic-invoice-wrapper {
            position: absolute; left: 0; top: 0; width: 100%;
          }
          #classic-invoice {
            border: none !important; box-shadow: none !important;
          }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
          /* Fixes print text cutoff issues */
          input { text-overflow: clip; white-space: pre-wrap; }
        }
      `}</style>

      {/* 🔥 MOBILE RESPONSIVE WRAPPER (Horizontal Scroll) 🔥 */}
      <div id="classic-invoice-wrapper" className="w-full overflow-x-auto pb-10 print:pb-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        
        {/* PAPER AREA - Fixed min-width ensures A4 ratio on mobile */}
        <div id="classic-invoice" ref={invoiceRef} className="w-full min-w-[800px] max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-sm border border-gray-400 relative" style={{ minHeight: '1100px' }}>
          
          {/* 🔥 HEADER: CENTERED MARG ERP STYLE 🔥 */}
          <div className="border-b border-black p-4 relative flex flex-col items-center justify-center text-center">
            
            {/* TAX INVOICE BADGE */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-0.5 text-[11px] font-bold rounded-b-md uppercase tracking-widest print:border print:border-black print:bg-white print:text-black">
              Tax Invoice
            </div>

            {/* ORIGINAL COPY TAG */}
            <div className="absolute right-4 top-4 text-xs font-bold text-gray-500 print:hidden" data-html2canvas-ignore="true">
              Original for Buyer
            </div>
            
            {/* LOGO */}
            {logo && <img src={logo} alt="Store Logo" className="absolute left-4 top-4" style={{ height: '70px', objectFit: 'contain' }} />}
            
            {/* CENTERED STORE DETAILS */}
            <div className="w-full flex flex-col items-center justify-center mt-3">
              <h1 className="text-3xl font-extrabold uppercase tracking-widest text-black">{storeSettings.storeName}</h1>
              <p className="text-sm font-semibold mt-1 uppercase text-black max-w-lg">{storeSettings.address}</p>
              <p className="text-sm font-semibold text-black mt-1">Contact : {storeSettings.phone}</p>
            </div>
          </div>

          {/* META DETAILS (Invoice No, Date, etc.) */}
          <div className="grid grid-cols-2 border-b border-black text-sm">
            <div className="p-3 border-r border-black flex flex-col gap-1.5">
              <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <span className="font-bold">{storeSettings.gstin}</span></div>
              <div className="flex items-center"><span className="w-32 font-bold">Invoice No :</span> <input type="text" className={`w-48 ${inputStyle}`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-32 font-bold">Invoice Date :</span> <input type="date" className={`w-48 ${inputStyle}`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-32 font-bold">State :</span> <input type="text" className={`w-48 uppercase ${inputStyle}`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              <div className="flex items-center"><span className="w-32 font-bold">PAN NO. :</span> <input type="text" className={`w-48 uppercase ${inputStyle}`} value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} /></div>
              <div className="font-bold mt-2 underline text-[13px]">SHIPPED TO PARTY:</div>
              <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <input type="text" className={`w-48 uppercase ${inputStyle}`} value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-32 font-bold">D.L. No :</span> <span className="font-bold">{storeSettings.dlNumber}</span></div>
            </div>
          </div>

          {/* BUYER DETAILS */}
          <div className="grid grid-cols-2 border-b border-black text-sm">
            <div className="p-3 border-r border-black flex flex-col gap-1.5">
              <div className="font-bold underline mb-1 text-[13px]">Detail Of Receiver (Billed to)</div>
              <div className="flex items-center"><span className="w-24 font-bold">Name :</span> <input type="text" className={`w-full font-bold uppercase ${inputStyle}`} value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">Address :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">GSTIN :</span> <input type="text" className={`w-full uppercase font-bold ${inputStyle}`} value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">State :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} /></div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              <div className="font-bold underline mb-1 text-[13px]">Transportation Details</div>
              <div className="flex items-center"><span className="w-24 font-bold">Transporter :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">Veh/GSTIN :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center"><span className="font-bold mr-2">L.R No :</span> <input type="text" className={`w-24 uppercase ${inputStyle}`} value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold mr-2">Date :</span> <input type="date" className={`w-32 ${inputStyle}`} value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="min-h-[350px] relative text-black">
            <table className="w-full text-[13px] text-center border-collapse">
              <thead className="border-b border-black font-extrabold bg-gray-100 uppercase text-[11px] tracking-tight">
                <tr>
                  <th className="border-r border-black p-1.5 w-8">S.N</th>
                  <th className="border-r border-black p-1.5 w-16">Code</th>
                  <th className="border-r border-black p-1.5 text-left pl-2">Description of Goods</th>
                  <th className="border-r border-black p-1.5 w-16">HSN</th>
                  <th className="border-r border-black p-1.5 w-12">Qty</th>
                  <th className="border-r border-black p-1.5 w-16">Rate</th>
                  <th className="border-r border-black p-1.5 w-20">Taxable</th>
                  <th className="border-r border-black p-1.5 w-12">DIS%</th>
                  <th className="border-r border-black p-1.5 w-16">DIS Amt</th>
                  <th className="border-r border-black p-1.5 w-12">GST%</th>
                  <th className="border-r border-black p-1.5 w-16">GST Amt</th>
                  <th className="p-1.5 w-20">Net Amt</th>
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
                    <tr key={item.id} className="border-b border-gray-200/50 group hover:bg-gray-50 align-top">
                      <td className="border-r border-black p-1 relative font-bold">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="border-r border-black p-1"><input type="text" className={`w-full text-center ${inputStyle}`} value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                      <td className="border-r border-black p-1 pl-2"><input type="text" className={`w-full text-left font-bold ${inputStyle}`} placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="text" className={`w-full text-center ${inputStyle}`} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`w-full text-center font-bold ${inputStyle}`} value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`w-full text-right ${inputStyle}`} value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pr-1 font-semibold">{baseAmount.toFixed(2)}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`w-full text-center ${inputStyle}`} value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pr-1">{disAmt > 0 ? disAmt.toFixed(2) : ''}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`w-full text-center ${inputStyle}`} value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pr-1">{gstAmt > 0 ? gstAmt.toFixed(2) : ''}</td>
                      <td className="p-1 text-right pr-1 font-bold">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON (Hides on Print) */}
            <div className="p-2 print:hidden absolute -bottom-12 left-0" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200 cursor-pointer shadow-sm">
                <Plus size={16} className="mr-1" /> Add New Row
              </button>
            </div>
          </div>

          {/* FOOTER SECTION */}
          <div className="grid grid-cols-12 border-t border-black text-sm mt-auto absolute bottom-0 w-full bg-white">
            <div className="col-span-8 border-r border-black flex flex-col justify-between">
              
              {/* BANK DETAILS */}
              <div className="p-3 border-b border-black">
                <div className="font-bold underline mb-1.5 text-[13px]">Bank Details</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                  <div className="flex items-center"><span className="font-bold w-24">Bank Name:</span> <input type="text" className={`w-full uppercase ${inputStyle}`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                  <div className="flex items-center"><span className="font-bold w-20">Branch:</span> <input type="text" className={`w-full uppercase ${inputStyle}`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                  <div className="flex items-center"><span className="font-bold w-24">A/c No.:</span> <input type="text" className={`w-full uppercase font-bold ${inputStyle}`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                  <div className="flex items-center"><span className="font-bold w-20">IFSC Code:</span> <input type="text" className={`w-full uppercase font-bold ${inputStyle}`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
                </div>
              </div>
              
              {/* AMOUNT IN WORDS */}
              <div className="p-3 border-b border-black font-bold uppercase flex items-center bg-gray-50">
                <span className="mr-2 whitespace-nowrap text-[13px]">Rs. (In Words):</span>
                <input type="text" className={`w-full font-bold ${inputStyle}`} placeholder="Type total amount in words..." value={amountInWords} onChange={e => setAmountInWords(e.target.value)} />
              </div>

              {/* TERMS & CONDITIONS */}
              <div className="p-3 text-[11px]">
                <div className="font-bold underline mb-1">Terms & Conditions</div>
                <textarea className="w-full outline-none bg-transparent resize-none h-14 text-black font-medium leading-tight" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            {/* TOTALS & SIGNATURE */}
            <div className="col-span-4 flex flex-col">
              <div className="p-3 border-b border-black font-bold text-[13px] flex-grow">
                <div className="flex justify-between mb-1.5"><span>Total Taxable Value</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5 text-red-600"><span>Less: Discount</span> <span>- {totals.discount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5"><span>Add: SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5"><span>Add: CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
              </div>
              <div className="p-3 border-b border-black bg-gray-100 font-black text-xl flex justify-between items-center">
                <span>Grand Total</span> 
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="p-3 h-28 flex flex-col items-end justify-end relative">
                <span className="absolute top-2 right-4 text-xs font-bold text-black uppercase">For {storeSettings.storeName}</span>
                <span className="font-bold border-t border-black pt-1 px-2 text-black text-xs">Authorised Signatory</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default ClassicTemplate;
