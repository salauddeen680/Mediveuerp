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
    pdf.save(`${invoiceDetails.invoiceNumber || 'Bill'}.pdf`);
  };

  // 🔥 THE MASTER FIX: Lines sirf Focus/Hover par dikhengi, PDF Save/Print mein transparent rahengi! 
  // 'pb-1' se text neeche se nahi katega 🔥
  const inputStyle = "w-full outline-none bg-transparent text-black border-b border-transparent hover:border-gray-300 hover:border-dashed focus:border-teal-500 focus:border-solid font-semibold pb-1 transition-colors";

  return (
    <div>
      {/* ACTION BUTTONS (flex-wrap fixed for mobile) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer transition-all">
          <Printer size={16} className="mr-2" /> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer transition-all">
          <Share2 size={16} className="mr-2" /> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer transition-all">
          <Download size={16} className="mr-2" /> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #classic-invoice-wrapper, #classic-invoice-wrapper * { visibility: visible; }
          #classic-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          #classic-invoice { border: none !important; box-shadow: none !important; }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
          input { text-overflow: clip; white-space: pre-wrap; }
        }
      `}</style>

      {/* MOBILE RESPONSIVE WRAPPER (Horizontal Scroll) */}
      <div id="classic-invoice-wrapper" className="w-full overflow-x-auto pb-10 print:pb-0 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        
        {/* INVOICE PAPER (Original Design) */}
        <div id="classic-invoice" ref={invoiceRef} className="w-full min-w-[800px] max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-sm border border-gray-400 relative" style={{ minHeight: '1000px' }}>
          
          {/* HEADER (Original Left-Right Layout) */}
          <div className="border-b border-black p-4 relative flex items-center justify-between">
            <div className="absolute right-4 top-4 text-xs font-bold text-gray-500 print:hidden" data-html2canvas-ignore="true">
              Original for Buyer
            </div>
            
            <div className="w-1/4">
              {logo && <img src={logo} alt="Store Logo" style={{ height: '70px', objectFit: 'contain' }} />}
            </div>
            
            <div className="w-3/4 text-right">
              <h1 className="text-3xl font-extrabold uppercase tracking-wide text-black">{storeSettings.storeName}</h1>
              <p className="text-sm font-medium mt-1 uppercase text-black">{storeSettings.address}</p>
              <p className="text-sm font-medium text-black">Phone : {storeSettings.phone}</p>
            </div>
          </div>

          {/* META DETAILS */}
          <div className="grid grid-cols-2 border-b border-black text-sm">
            <div className="p-3 border-r border-black flex flex-col gap-1.5">
              <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <span className="font-bold">{storeSettings.gstin}</span></div>
              <div className="flex items-center"><span className="w-32 font-bold">Invoice Number :</span> <input type="text" className={`w-40 ${inputStyle}`} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-32 font-bold">Invoice Date :</span> <input type="date" className={`w-40 ${inputStyle}`} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-32 font-bold">State :</span> <input type="text" className={`w-40 uppercase ${inputStyle}`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              <div className="flex items-center"><span className="w-32 font-bold">PAN NO. :</span> <input type="text" className={`w-40 uppercase ${inputStyle}`} value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} /></div>
              <div className="font-bold mt-1 underline">SHIPPED TO PARTY:</div>
              <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <input type="text" className={`w-40 uppercase ${inputStyle}`} value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-32 font-bold">D.L. No :</span> <span className="font-bold">{storeSettings.dlNumber}</span></div>
            </div>
          </div>

          {/* BUYER DETAILS */}
          <div className="grid grid-cols-2 border-b border-black text-sm">
            <div className="p-3 border-r border-black flex flex-col gap-1.5">
              <div className="font-bold underline mb-1">Detail Of Receiver (Billed to)</div>
              <div className="flex items-center"><span className="w-20 font-bold">Name :</span> <input type="text" className={`w-full uppercase font-bold text-[15px] ${inputStyle}`} value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-20 font-bold">Add. :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-20 font-bold">GSTIN :</span> <input type="text" className={`w-full uppercase font-bold ${inputStyle}`} value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-20 font-bold">State :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} /></div>
            </div>
            <div className="p-3 flex flex-col gap-1.5">
              <div className="font-bold underline mb-1">TRANSPORTATION</div>
              <div className="flex items-center"><span className="w-24 font-bold">Party :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
              <div className="flex items-center"><span className="w-24 font-bold">Veh/GSTIN :</span> <input type="text" className={`w-full uppercase ${inputStyle}`} value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center"><span className="font-bold mr-2">L.R No. :</span> <input type="text" className={`w-20 uppercase ${inputStyle}`} value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold mr-2">L.R Date :</span> <input type="date" className={`w-32 ${inputStyle}`} value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="min-h-[300px] relative text-black pb-10">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="border-b border-black font-bold bg-gray-100">
                <tr>
                  <th className="border-r border-black p-1.5 w-8">S.No.</th>
                  <th className="border-r border-black p-1.5 w-16">Item Code</th>
                  <th className="border-r border-black p-1.5 text-left pl-2">Description of Goods</th>
                  <th className="border-r border-black p-1.5 w-16">HSN/SAC</th>
                  <th className="border-r border-black p-1.5 w-12">Qty</th>
                  <th className="border-r border-black p-1.5 w-16">Rate</th>
                  <th className="border-r border-black p-1.5 w-20">Taxable</th>
                  <th className="border-r border-black p-1.5 w-12">DIS%</th>
                  <th className="border-r border-black p-1.5 w-16">DIS Amt</th>
                  <th className="border-r border-black p-1.5 w-12">GST%</th>
                  <th className="border-r border-black p-1.5 w-16">GST Amt</th>
                  <th className="p-1.5 w-20">Amount</th>
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
                    <tr key={item.id} className="border-b border-gray-200 group hover:bg-gray-50">
                      <td className="border-r border-black p-1 relative font-bold">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="border-r border-black p-1"><input type="text" className={`text-center ${inputStyle}`} value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                      <td className="border-r border-black p-1 pl-2"><input type="text" className={`text-left font-bold ${inputStyle}`} placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="text" className={`text-center ${inputStyle}`} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center font-bold ${inputStyle}`} value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-right ${inputStyle}`} value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right font-semibold pt-2">{baseAmount.toFixed(2)}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center ${inputStyle}`} value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pt-2">{disAmt > 0 ? disAmt.toFixed(2) : ''}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center ${inputStyle}`} value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-1 text-right pt-2">{gstAmt > 0 ? gstAmt.toFixed(2) : ''}</td>
                      <td className="p-1 text-right font-bold pr-1 pt-2">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON (Visible inside the table area) */}
            <div className="p-2 print:hidden absolute bottom-0 left-0" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded border border-blue-200 cursor-pointer shadow-sm">
                <Plus size={16} className="mr-1" /> Add Row
              </button>
            </div>
          </div>

          {/* FOOTER SECTION */}
          <div className="grid grid-cols-12 border-t border-black text-sm absolute bottom-0 w-full bg-white">
            <div className="col-span-8 border-r border-black flex flex-col justify-between">
              <div className="p-3 border-b border-black">
                <div className="font-bold underline mb-1">Bank Details</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center"><span className="font-bold w-24">Bank Name:</span> <input type="text" className={`w-full uppercase ${inputStyle}`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                  <div className="flex items-center"><span className="font-bold w-20">Branch:</span> <input type="text" className={`w-full uppercase ${inputStyle}`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                  <div className="flex items-center"><span className="font-bold w-24">A/c No.:</span> <input type="text" className={`w-full uppercase font-bold ${inputStyle}`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                  <div className="flex items-center"><span className="font-bold w-20">IFSC:</span> <input type="text" className={`w-full uppercase font-bold ${inputStyle}`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
                </div>
              </div>
              
              <div className="p-3 border-b border-black font-bold uppercase flex items-center bg-gray-50">
                <span className="mr-2 whitespace-nowrap">Rs. (In Words):</span>
                <input type="text" className={`w-full font-bold ${inputStyle}`} placeholder="Type total amount in words..." value={amountInWords} onChange={e => setAmountInWords ? setAmountInWords(e.target.value) : null} />
              </div>

              <div className="p-3 text-[11px]">
                <div className="font-bold underline mb-1">Terms & conditions</div>
                <textarea className="w-full outline-none bg-transparent resize-none h-14 text-black font-medium leading-tight" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            <div className="col-span-4 flex flex-col">
              <div className="p-3 border-b border-black font-bold text-[13px] flex-grow">
                <div className="flex justify-between mb-1.5"><span>Total Taxable Value</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5 text-red-600"><span>Less : Discount</span> <span>- {totals.discount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5"><span>Add : SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5"><span>Add : CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
              </div>
              <div className="p-3 border-b border-black bg-gray-100 font-bold text-lg flex justify-between items-center">
                <span>Grand Total</span> 
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="p-3 h-28 flex flex-col items-center justify-end relative">
                <span className="absolute top-2 right-4 text-[11px] font-bold text-black uppercase">For {storeSettings.storeName}</span>
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
