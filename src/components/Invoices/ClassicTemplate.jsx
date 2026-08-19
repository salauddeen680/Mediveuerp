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
    // A4 size standard dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoiceDetails.invoiceNumber || 'Bill'}.pdf`);
  };

  // 🔥 THE ULTIMATE INPUT FIX 🔥
  // bg-transparent, no borders, generous padding (p-1), and standard line-height so HTML2CANVAS never cuts text.
  const inputStyle = "w-full bg-transparent outline-none border-none hover:bg-gray-100 focus:bg-blue-50 font-bold text-gray-900 p-1 leading-snug rounded-sm";

  return (
    <div className="w-full">
      {/* ACTION BUTTONS */}
      <div className="max-w-[794px] mx-auto mb-4 flex flex-wrap justify-center sm:justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded shadow font-bold text-sm cursor-pointer transition-all">
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
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          #classic-invoice-wrapper, #classic-invoice-wrapper * { visibility: visible; }
          #classic-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* HORIZONTAL SCROLL WRAPPER */}
      <div id="classic-invoice-wrapper" className="w-full overflow-x-auto bg-gray-200/50 py-4 print:p-0 print:bg-white flex justify-start sm:justify-center">
        
        {/* 🔥 STRICT A4 PIXEL DIMENSIONS: 794px width, 1123px min-height 🔥 */}
        <div id="classic-invoice" ref={invoiceRef} className="w-[794px] min-w-[794px] min-h-[1123px] bg-white text-black border-2 border-black flex flex-col shrink-0 box-border shadow-xl print:shadow-none print:border-none">
          
          {/* 1. HEADER ROW */}
          <div className="flex border-b-2 border-black items-stretch">
            {/* Logo Box */}
            <div className="w-1/4 border-r-2 border-black p-2 flex items-center justify-center">
              {logo ? (
                <img src={logo} alt="Logo" className="max-h-[80px] max-w-full object-contain" />
              ) : (
                <div className="text-xl font-bold tracking-widest text-gray-400">LOGO</div>
              )}
            </div>
            
            {/* Store Details Box */}
            <div className="w-1/2 p-2 flex flex-col items-center justify-center text-center">
              <span className="bg-black text-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-1 inline-block">
                Tax Invoice
              </span>
              <h1 className="text-2xl font-black uppercase text-black leading-none mb-1">{storeSettings.storeName}</h1>
              <p className="text-[11px] font-bold uppercase text-gray-800">{storeSettings.address}</p>
              <p className="text-[11px] font-bold text-gray-800 mt-0.5">Contact: {storeSettings.phone}</p>
            </div>

            {/* GSTIN / DL Box */}
            <div className="w-1/4 border-l-2 border-black p-3 flex flex-col justify-center bg-gray-50/50">
              <div className="text-[10px] font-bold text-gray-500 text-right mb-2 print:hidden" data-html2canvas-ignore="true">Original for Buyer</div>
              <div className="text-[11px] font-bold text-gray-600">GSTIN:</div>
              <div className="text-[13px] font-black text-black leading-none">{storeSettings.gstin}</div>
              <div className="text-[11px] font-bold text-gray-600 mt-2">D.L. No:</div>
              <div className="text-[12px] font-bold text-black leading-none">{storeSettings.dlNumber}</div>
            </div>
          </div>

          {/* 2. META DETAILS ROW */}
          <div className="flex border-b-2 border-black text-[12px]">
            <div className="w-1/2 border-r-2 border-black p-2 grid grid-cols-[100px_1fr] items-center gap-y-1">
              <span className="font-bold text-gray-700 pl-1">Invoice No:</span> 
              <input type="text" className={inputStyle} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
              
              <span className="font-bold text-gray-700 pl-1">Invoice Date:</span> 
              <input type="date" className={inputStyle} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
              
              <span className="font-bold text-gray-700 pl-1">State:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} />
            </div>
            
            <div className="w-1/2 p-2 grid grid-cols-[100px_1fr] items-center gap-y-1">
              <span className="font-bold text-gray-700 pl-1">PAN NO.:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} />
              
              <span className="font-bold underline col-span-2 mt-1 mb-1 pl-1 text-[13px] text-black">SHIPPED TO PARTY:</span>
              
              <span className="font-bold text-gray-700 pl-1">GSTIN:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} />
            </div>
          </div>

          {/* 3. BUYER & TRANSPORT ROW */}
          <div className="flex border-b-2 border-black text-[12px]">
            <div className="w-1/2 border-r-2 border-black p-2 flex flex-col gap-1">
              <span className="font-bold underline mb-1 pl-1 text-[13px] text-black">Details Of Receiver (Billed to)</span>
              
              <div className="flex items-start"><span className="w-[80px] font-bold text-gray-700 pl-1 mt-1">Name:</span> <input type="text" className={`uppercase text-[14px] font-black ${inputStyle}`} value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
              <div className="flex items-start"><span className="w-[80px] font-bold text-gray-700 pl-1 mt-1">Address:</span> <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
              <div className="flex items-start"><span className="w-[80px] font-bold text-gray-700 pl-1 mt-1">GSTIN:</span> <input type="text" className={`uppercase font-extrabold ${inputStyle}`} value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
              <div className="flex items-start"><span className="w-[80px] font-bold text-gray-700 pl-1 mt-1">State:</span> <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} /></div>
            </div>
            
            <div className="w-1/2 p-2 flex flex-col gap-1">
              <span className="font-bold underline mb-1 pl-1 text-[13px] text-black">Transportation Details</span>
              
              <div className="flex items-start"><span className="w-[80px] font-bold text-gray-700 pl-1 mt-1">Transporter:</span> <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
              <div className="flex items-start"><span className="w-[80px] font-bold text-gray-700 pl-1 mt-1">Veh/GSTIN:</span> <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
              
              <div className="flex gap-2 w-full mt-1">
                <div className="flex items-center w-1/2"><span className="font-bold text-gray-700 pl-1 mr-2">L.R No:</span> <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
                <div className="flex items-center w-1/2"><span className="font-bold text-gray-700 mr-2">Date:</span> <input type="date" className={inputStyle} value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
              </div>
            </div>
          </div>

          {/* 4. ITEMS TABLE AREA */}
          <div className="flex-grow flex flex-col relative text-black">
            <table className="w-full text-[12px] text-center border-collapse">
              <thead className="border-b-2 border-black font-extrabold bg-gray-100 uppercase tracking-tight">
                <tr>
                  <th className="border-r border-black p-2 w-8">S.N</th>
                  <th className="border-r border-black p-2 w-14">Code</th>
                  <th className="border-r border-black p-2 text-left pl-2">Description of Goods</th>
                  <th className="border-r border-black p-2 w-14">HSN</th>
                  <th className="border-r border-black p-2 w-12">Qty</th>
                  <th className="border-r border-black p-2 w-16">Rate</th>
                  <th className="border-r border-black p-2 w-20">Taxable</th>
                  <th className="border-r border-black p-2 w-10">DIS%</th>
                  <th className="border-r border-black p-2 w-14">DIS Amt</th>
                  <th className="border-r border-black p-2 w-10">GST%</th>
                  <th className="border-r border-black p-2 w-14">GST Amt</th>
                  <th className="p-2 w-20 pr-2">Net Amt</th>
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
                      <td className="border-r border-black px-1 py-1.5 relative font-bold text-[13px] pt-2">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                      <td className="border-r border-black px-1 py-1.5"><input type="text" className={`text-center uppercase ${inputStyle}`} value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5 pl-2"><input type="text" className={`text-left font-black uppercase text-[13px] ${inputStyle}`} placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5"><input type="text" className={`text-center ${inputStyle}`} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5"><input type="number" className={`text-center font-bold ${inputStyle}`} value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5"><input type="number" className={`text-right font-bold ${inputStyle}`} value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5 text-right font-semibold pt-2.5 pr-1 text-[13px]">{baseAmount.toFixed(2)}</td>
                      <td className="border-r border-black px-1 py-1.5"><input type="number" className={`text-center ${inputStyle}`} value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5 text-right pt-2.5 pr-1">{disAmt > 0 ? disAmt.toFixed(2) : ''}</td>
                      <td className="border-r border-black px-1 py-1.5"><input type="number" className={`text-center font-bold ${inputStyle}`} value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="border-r border-black px-1 py-1.5 text-right pt-2.5 pr-1">{gstAmt > 0 ? gstAmt.toFixed(2) : ''}</td>
                      <td className="px-1 py-1.5 text-right font-black pr-2 pt-2.5 text-[13px]">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* ADD ROW BUTTON */}
            <div className="p-3 print:hidden absolute -bottom-12 left-0" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded shadow-sm">
                <Plus size={14} className="mr-1" /> Add New Row
              </button>
            </div>
          </div>

          {/* 5. FOOTER GRID */}
          <div className="flex border-t-2 border-black text-xs mt-auto bg-white">
            
            {/* LEFT FOOTER */}
            <div className="w-2/3 border-r-2 border-black flex flex-col justify-between">
              
              <div className="p-3 border-b border-black bg-gray-50/50">
                <div className="font-bold underline mb-2 text-black">Bank Details</div>
                <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-2 gap-y-1 items-center">
                  <span className="font-bold text-gray-700">Bank:</span> <input type="text" className={`uppercase ${inputStyle}`} placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                  <span className="font-bold text-gray-700">Branch:</span> <input type="text" className={`uppercase ${inputStyle}`} placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} />
                  <span className="font-bold text-gray-700">A/c No:</span> <input type="text" className={`uppercase font-black ${inputStyle}`} placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} />
                  <span className="font-bold text-gray-700">IFSC:</span> <input type="text" className={`uppercase font-black ${inputStyle}`} placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
                </div>
              </div>
              
              <div className="p-3 border-b border-black font-bold uppercase flex items-center bg-gray-100">
                <span className="mr-2 whitespace-nowrap text-gray-800">Rs. (In Words):</span>
                <input type="text" className={`uppercase font-black text-[13px] ${inputStyle}`} placeholder="Type total amount in words..." value={amountInWords} onChange={e => setAmountInWords(e.target.value)} />
              </div>

              <div className="p-3 flex-grow">
                <div className="font-bold underline mb-1 text-black">Terms & conditions</div>
                <textarea className="w-full outline-none bg-transparent resize-none h-12 text-black font-semibold leading-tight mt-1" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            {/* RIGHT FOOTER (TOTALS) */}
            <div className="w-1/3 flex flex-col">
              <div className="p-3 border-b border-black font-bold text-[13px] flex-grow bg-gray-50/50">
                <div className="flex justify-between mb-1.5 text-gray-800"><span>Total Taxable Value</span> <span className="font-extrabold">{totals.taxableValue.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5 text-red-600"><span>Less: Discount</span> <span className="font-extrabold">- {totals.discount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5 text-gray-800"><span>Add: SGST</span> <span className="font-extrabold">+ {totals.sgst.toFixed(2)}</span></div>
                <div className="flex justify-between mb-1.5 text-gray-800"><span>Add: CGST</span> <span className="font-extrabold">+ {totals.cgst.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-gray-300 pt-1.5 mt-1.5 text-gray-800"><span>Roundoff</span> <span className="font-extrabold">{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
              </div>
              <div className="p-3 border-b-2 border-black bg-gray-200 font-black text-[16px] flex justify-between items-center">
                <span>Grand Total</span> 
                <span className="text-[20px]">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="p-3 flex-grow flex flex-col items-center justify-between relative min-h-[90px]">
                <span className="text-[10px] font-bold text-gray-800 uppercase text-right w-full absolute top-2 right-3">For {storeSettings.storeName}</span>
                <span className="font-bold border-t-2 border-black pt-1 px-4 text-black text-[12px] w-full text-center mt-auto">Authorised Signatory</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassicTemplate;
