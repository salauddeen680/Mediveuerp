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

  // 🔥 YAHAN HAI ASLI JADUU: windowWidth: 1200 add kiya hai taaki mobile par bill na pichke! 🔥
  const getCanvasOptions = () => ({
    scale: 2,
    useCORS: true,
    windowWidth: 1200, // Forces html2canvas to render as if on a large desktop screen
    logging: false
  });

  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, getCanvasOptions());
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
    const canvas = await html2canvas(invoiceRef.current, getCanvasOptions());
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoiceDetails.invoiceNumber || 'Bill'}.pdf`);
  };

  const inputStyle = "w-full outline-none bg-transparent text-black border-none hover:bg-gray-100 focus:bg-blue-50 font-bold px-1 py-1 leading-normal";

  return (
    <div className="w-full">
      {/* ACTION BUTTONS */}
      <div className="max-w-[794px] mx-auto mb-4 flex flex-wrap justify-center sm:justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-700 text-white px-4 py-2 rounded shadow font-bold text-sm">
          <Printer size={16} className="mr-2" /> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded shadow font-bold text-sm">
          <Share2 size={16} className="mr-2" /> Share
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 text-white px-4 py-2 rounded shadow font-bold text-sm">
          <Download size={16} className="mr-2" /> Save PDF
        </button>
      </div>

      {/* HORIZONTAL SCROLL WRAPPER */}
      <div className="w-full overflow-x-auto pb-6 print:pb-0 scrollbar-thin scrollbar-thumb-gray-400">
        
        {/* STRICT A4 CONTAINER - 210mm width by 297mm height ratio */}
        <div id="classic-invoice" ref={invoiceRef} className="mx-auto bg-white text-black border-2 border-black flex flex-col" style={{ width: '794px', minHeight: '1123px' }}>
          
          {/* 1. HEADER */}
          <div className="flex border-b-2 border-black items-center p-3 relative">
            {/* Tax Invoice Badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 text-[11px] font-bold uppercase tracking-widest rounded-b-md">
              Tax Invoice
            </div>

            {/* Logo Fix: Strict max dimensions */}
            <div className="w-1/4 flex justify-start items-center">
              {logo ? (
                <img src={logo} alt="Logo" style={{ maxWidth: '140px', maxHeight: '70px', objectFit: 'contain' }} />
              ) : (
                <div className="text-xl font-bold">LOGO</div>
              )}
            </div>
            
            {/* Store Details */}
            <div className="w-1/2 text-center pt-4">
              <h1 className="text-3xl font-black uppercase leading-none mb-1">{storeSettings.storeName}</h1>
              <p className="text-[12px] font-bold uppercase">{storeSettings.address}</p>
              <p className="text-[12px] font-bold mt-0.5">Contact: {storeSettings.phone}</p>
            </div>

            <div className="w-1/4 text-right flex flex-col justify-center">
              <p className="text-[10px] font-bold text-gray-500 mb-2 print:hidden" data-html2canvas-ignore="true">Original for Buyer</p>
              <p className="text-[12px] font-bold">GSTIN: <span className="font-black text-[14px]">{storeSettings.gstin}</span></p>
              <p className="text-[12px] font-bold mt-1">D.L. No: <span className="font-black">{storeSettings.dlNumber}</span></p>
            </div>
          </div>

          {/* 2. INVOICE META */}
          <div className="grid grid-cols-2 border-b-2 border-black text-[13px]">
            <div className="p-3 border-r-2 border-black grid grid-cols-[100px_1fr] gap-1 items-center">
              <span className="font-bold">Invoice No:</span> 
              <input type="text" className={inputStyle} value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} />
              <span className="font-bold">Date:</span> 
              <input type="date" className={inputStyle} value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} />
              <span className="font-bold">State:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} />
            </div>
            
            <div className="p-3 grid grid-cols-[100px_1fr] gap-1 items-center">
              <span className="font-bold">PAN NO.:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} />
              <span className="font-bold underline col-span-2 mt-2">SHIPPED TO PARTY:</span>
              <span className="font-bold">GSTIN:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} />
            </div>
          </div>

          {/* 3. BUYER DETAILS */}
          <div className="grid grid-cols-2 border-b-2 border-black text-[13px]">
            <div className="p-3 border-r-2 border-black grid grid-cols-[80px_1fr] gap-1 items-center">
              <span className="font-bold underline col-span-2 mb-2">Details Of Receiver (Billed to)</span>
              <span className="font-bold">Name:</span> 
              <input type="text" className={`uppercase font-black text-[15px] ${inputStyle}`} value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} />
              <span className="font-bold">Address:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} />
              <span className="font-bold">GSTIN:</span> 
              <input type="text" className={`uppercase font-bold ${inputStyle}`} value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} />
              <span className="font-bold">State:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} />
            </div>
            
            <div className="p-3 grid grid-cols-[90px_1fr] gap-1 items-center">
              <span className="font-bold underline col-span-2 mb-2">Transportation Details</span>
              <span className="font-bold">Transporter:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} />
              <span className="font-bold">Veh/GSTIN:</span> 
              <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} />
              <div className="col-span-2 grid grid-cols-[60px_1fr_40px_1fr] gap-2 mt-2 items-center">
                <span className="font-bold">L.R No:</span> 
                <input type="text" className={`uppercase ${inputStyle}`} value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} />
                <span className="font-bold">Date:</span> 
                <input type="date" className={inputStyle} value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 4. ITEMS TABLE */}
          <div className="flex-grow relative text-black">
            <table className="w-full text-[12px] text-center border-collapse">
              <thead className="border-b-2 border-black font-extrabold bg-gray-100 uppercase">
                <tr>
                  <th className="border-r border-black p-2 w-8">S.N</th>
                  <th className="border-r border-black p-2 w-16">Code</th>
                  <th className="border-r border-black p-2 text-left pl-2">Description of Goods</th>
                  <th className="border-r border-black p-2 w-14">HSN</th>
                  <th className="border-r border-black p-2 w-12">Qty</th>
                  <th className="border-r border-black p-2 w-16">Rate</th>
                  <th className="border-r border-black p-2 w-20">Taxable</th>
                  <th className="border-r border-black p-2 w-10">DIS%</th>
                  <th className="border-r border-black p-2 w-14">DIS Amt</th>
                  <th className="border-r border-black p-2 w-10">GST%</th>
                  <th className="border-r border-black p-2 w-14">GST Amt</th>
                  <th className="p-2 w-20">Net Amt</th>
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
                    <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50 align-middle">
                      <td className="border-r border-black p-2 font-bold relative">
                        {index + 1}
                        {items.length > 1 && (
                          <button onClick={() => removeRow(index)} className="absolute -left-8 top-2 text-red-500 print:hidden" data-html2canvas-ignore="true">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                      <td className="border-r border-black p-1"><input type="text" className={`text-center uppercase ${inputStyle}`} value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                      <td className="border-r border-black p-1 pl-2"><input type="text" className={`text-left font-black uppercase text-[13px] ${inputStyle}`} placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="text" className={`text-center ${inputStyle}`} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center font-bold ${inputStyle}`} value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-right font-bold ${inputStyle}`} value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                      <td className="border-r border-black p-2 text-right font-semibold">{baseAmount.toFixed(2)}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center ${inputStyle}`} value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-2 text-right">{disAmt > 0 ? disAmt.toFixed(2) : ''}</td>
                      <td className="border-r border-black p-1"><input type="number" className={`text-center font-bold ${inputStyle}`} value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                      <td className="border-r border-black p-2 text-right">{gstAmt > 0 ? gstAmt.toFixed(2) : ''}</td>
                      <td className="p-2 text-right font-black text-[13px]">{totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="p-3 print:hidden" data-html2canvas-ignore="true">
              <button onClick={addRow} className="flex items-center text-[13px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded">
                <Plus size={16} className="mr-1" /> Add New Row
              </button>
            </div>
          </div>

          {/* 5. FOOTER */}
          <div className="flex border-t-2 border-black text-[13px] mt-auto">
            
            {/* LEFT FOOTER */}
            <div className="w-2/3 border-r-2 border-black flex flex-col">
              
              <div className="p-3 border-b border-black">
                <div className="font-bold underline mb-2">Bank Details</div>
                <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-2 gap-y-2 items-center">
                  <span className="font-bold">Bank:</span> <input type="text" className={`uppercase ${inputStyle}`} value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                  <span className="font-bold">Branch:</span> <input type="text" className={`uppercase ${inputStyle}`} value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} />
                  <span className="font-bold">A/c No:</span> <input type="text" className={`uppercase font-black ${inputStyle}`} value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} />
                  <span className="font-bold">IFSC:</span> <input type="text" className={`uppercase font-black ${inputStyle}`} value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
                </div>
              </div>
              
              <div className="p-3 border-b border-black font-bold uppercase flex items-center bg-gray-50">
                <span className="mr-2 whitespace-nowrap">Rs. (In Words):</span>
                <input type="text" className={`uppercase font-black text-[14px] ${inputStyle}`} value={amountInWords} onChange={e => setAmountInWords(e.target.value)} />
              </div>

              <div className="p-3 flex-grow">
                <div className="font-bold underline mb-2">Terms & conditions</div>
                <textarea className="w-full outline-none bg-transparent resize-none h-12 text-black font-semibold leading-relaxed" value={terms} onChange={e => setTerms(e.target.value)} />
              </div>
            </div>

            {/* RIGHT FOOTER (TOTALS) */}
            <div className="w-1/3 flex flex-col">
              <div className="p-3 border-b-2 border-black font-bold text-[13px] flex-grow">
                <div className="flex justify-between mb-2"><span>Total Taxable Value</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2 text-red-600"><span>Less: Discount</span> <span>- {totals.discount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2"><span>Add: SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2"><span>Add: CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
              </div>
              <div className="p-3 border-b-2 border-black bg-gray-200 font-black text-[16px] flex justify-between items-center">
                <span>Grand Total</span> 
                <span className="text-[20px]">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="p-3 flex-grow flex flex-col items-center justify-between min-h-[90px] relative">
                <span className="text-[11px] font-bold uppercase absolute top-2 right-2">For {storeSettings.storeName}</span>
                <span className="font-bold border-t-2 border-black pt-1 px-4 text-[12px] w-full text-center mt-auto">Authorised Signatory</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassicTemplate;
