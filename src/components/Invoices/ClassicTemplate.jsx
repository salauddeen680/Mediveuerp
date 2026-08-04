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

  return (
    <div>
      {/* CLASSIC ACTION BUTTONS */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded shadow font-bold text-sm">
          <Printer size={16} className="mr-2" /> Print
        </button>
        <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow font-bold text-sm">
          <Share2 size={16} className="mr-2" /> Share (Photo)
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold text-sm">
          <Download size={16} className="mr-2" /> Save PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          #classic-invoice, #classic-invoice * { visibility: visible; }
          #classic-invoice {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important;
          }
          input, textarea { border: none !important; background: transparent !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
        }
      `}</style>

      {/* PAPER AREA */}
      <div id="classic-invoice" ref={invoiceRef} className="w-full max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-sm border border-gray-300 relative" style={{ minHeight: '1000px' }}>
        
        {/* HEADER: LOGO LEFT SIDE 🔥 */}
        <div className="border-b border-black p-4 relative flex items-center justify-between">
          <div className="absolute right-4 top-4 text-xs font-bold text-gray-500 print:hidden">Original for Buyer</div>
          
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
          <div className="p-2 border-r border-black flex flex-col gap-1">
            <div className="flex"><span className="w-32 font-bold">GSTIN :</span> <span>{storeSettings.gstin}</span></div>
            <div className="flex items-center"><span className="w-32 font-bold">Invoice Number :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 bg-transparent text-black" value={invoiceDetails.invoiceNumber} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})} /></div>
            <div className="flex items-center"><span className="w-32 font-bold">Invoice Date :</span> <input type="date" className="border-b border-gray-300 outline-none w-40 bg-transparent text-black" value={invoiceDetails.invoiceDate} onChange={e => setInvoiceDetails({...invoiceDetails, invoiceDate: e.target.value})} /></div>
            <div className="flex items-center"><span className="w-32 font-bold">State :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 bg-transparent uppercase text-black" value={invoiceDetails.stateCode} onChange={e => setInvoiceDetails({...invoiceDetails, stateCode: e.target.value})} /></div>
          </div>
          <div className="p-2 flex flex-col gap-1">
            <div className="flex items-center"><span className="w-32 font-bold">PAN NO. :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 uppercase bg-transparent text-black" value={invoiceDetails.panNo} onChange={e => setInvoiceDetails({...invoiceDetails, panNo: e.target.value})} /></div>
            <div className="font-bold mt-1 underline">SHIPPED TO PARTY:</div>
            <div className="flex items-center"><span className="w-32 font-bold">GSTIN :</span> <input type="text" className="border-b border-gray-300 outline-none w-40 uppercase bg-transparent text-black" value={invoiceDetails.shippedGstin} onChange={e => setInvoiceDetails({...invoiceDetails, shippedGstin: e.target.value})} /></div>
            <div className="flex"><span className="w-32 font-bold">D.L. No :</span> <span>{storeSettings.dlNumber}</span></div>
          </div>
        </div>

        {/* BUYER DETAILS */}
        <div className="grid grid-cols-2 border-b border-black text-sm">
          <div className="p-2 border-r border-black">
            <div className="font-bold underline mb-1">Detail Of Receiver (Billed to)</div>
            <div className="flex"><span className="w-20 font-bold">Name :</span> <input type="text" className="font-bold w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.name} onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">Add. :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.address} onChange={e => setBuyerDetails({...buyerDetails, address: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">GSTIN :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.gstin} onChange={e => setBuyerDetails({...buyerDetails, gstin: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-20 font-bold">State :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.state} onChange={e => setBuyerDetails({...buyerDetails, state: e.target.value})} /></div>
          </div>
          <div className="p-2">
            <div className="font-bold underline mb-1">TRANSPORTATION</div>
            <div className="flex"><span className="w-24 font-bold">Party :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.transportParty} onChange={e => setBuyerDetails({...buyerDetails, transportParty: e.target.value})} /></div>
            <div className="flex mt-1"><span className="w-24 font-bold">GSTIN :</span> <input type="text" className="w-full outline-none uppercase bg-transparent text-black" value={buyerDetails.transportGstin} onChange={e => setBuyerDetails({...buyerDetails, transportGstin: e.target.value})} /></div>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center"><span className="font-bold mr-2">L.R No. :</span> <input type="text" className="border-b border-gray-300 outline-none w-20 uppercase bg-transparent text-black" value={buyerDetails.lrNo} onChange={e => setBuyerDetails({...buyerDetails, lrNo: e.target.value})} /></div>
              <div className="flex items-center"><span className="font-bold mr-2">L.R Date :</span> <input type="date" className="border-b border-gray-300 outline-none w-32 bg-transparent text-black" value={buyerDetails.lrDate} onChange={e => setBuyerDetails({...buyerDetails, lrDate: e.target.value})} /></div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="min-h-[300px] relative text-black">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="border-b border-black font-bold bg-gray-100">
              <tr>
                <th className="border-r border-black p-1 w-8">S.No.</th>
                <th className="border-r border-black p-1 w-16">Item Code</th>
                <th className="border-r border-black p-1 text-left">Description of Goods</th>
                <th className="border-r border-black p-1 w-16">HSN/SAC</th>
                <th className="border-r border-black p-1 w-12">Qty</th>
                <th className="border-r border-black p-1 w-16">Rate</th>
                <th className="border-r border-black p-1 w-20">Taxable</th>
                <th className="border-r border-black p-1 w-12">DIS%</th>
                <th className="border-r border-black p-1 w-16">DIS Amt</th>
                <th className="border-r border-black p-1 w-12">GST%</th>
                <th className="border-r border-black p-1 w-16">GST Amt</th>
                <th className="p-1 w-20">Amount</th>
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
                    <td className="border-r border-black p-1 relative">
                      {index + 1}
                      {items.length > 1 && (
                        <button onClick={() => removeRow(index)} className="absolute -left-6 top-1 text-red-500 opacity-0 group-hover:opacity-100 print:hidden cursor-pointer" data-html2canvas-ignore="true">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent text-black" value={item.code} onChange={(e) => handleItemChange(index, 'code', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-left outline-none bg-transparent font-medium text-black" placeholder="Type name..." value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="text" className="w-full text-center outline-none bg-transparent text-black" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent text-black" value={item.qty || ''} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-right outline-none bg-transparent text-black" value={item.rate || ''} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{baseAmount.toFixed(2)}</td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent text-black" value={item.disPercent || ''} onChange={(e) => handleItemChange(index, 'disPercent', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{disAmt.toFixed(2)}</td>
                    <td className="border-r border-black p-1"><input type="number" className="w-full text-center outline-none bg-transparent text-black" value={item.gstPercent || ''} onChange={(e) => handleItemChange(index, 'gstPercent', e.target.value)} /></td>
                    <td className="border-r border-black p-1 text-right">{gstAmt.toFixed(2)}</td>
                    <td className="p-1 text-right font-bold">{totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="p-2 print:hidden absolute -bottom-10 left-0" data-html2canvas-ignore="true">
            <button onClick={addRow} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded border border-blue-200 cursor-pointer shadow-sm">
              <Plus size={16} className="mr-1" /> Add Row
            </button>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="grid grid-cols-12 border-t border-black text-sm mt-8">
          <div className="col-span-8 border-r border-black flex flex-col justify-between">
            <div className="p-2 border-b border-black">
              <div className="font-bold underline mb-1">Bank Details</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center"><span className="font-bold w-24">Bank Name:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="Bank Name" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold w-20">Branch:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="Branch" value={bankDetails.branch} onChange={e => setBankDetails({...bankDetails, branch: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold w-24">A/c No.:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="Account No" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} /></div>
                <div className="flex items-center"><span className="font-bold w-20">IFSC:</span> <input type="text" className="w-full outline-none bg-transparent border-b border-gray-200 uppercase text-black" placeholder="IFSC Code" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} /></div>
              </div>
            </div>
            
            <div className="p-2 border-b border-black font-bold uppercase flex items-center">
              <span className="mr-2 whitespace-nowrap">Rs. (In Words):</span>
              <input type="text" className="w-full outline-none bg-transparent text-black font-bold" placeholder="Type total amount in words..." value={amountInWords} onChange={e => setAmountInWords(e.target.value)} />
            </div>

            <div className="p-2 text-xs">
              <div className="font-bold underline mb-1">Terms & conditions</div>
              <textarea className="w-full outline-none bg-transparent resize-none h-16 text-black" value={terms} onChange={e => setTerms(e.target.value)} />
            </div>
          </div>

          <div className="col-span-4 flex flex-col">
            <div className="p-2 border-b border-black font-bold text-xs">
              <div className="flex justify-between"><span>Total Amount Before GST</span> <span>{totals.taxableValue.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>DISCOUNT</span> <span>- {totals.discount.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Add : SGST</span> <span>+ {totals.sgst.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Add : CGST</span> <span>+ {totals.cgst.toFixed(2)}</span></div>
              <div className="flex justify-between mt-1"><span>Roundoff</span> <span>{totals.roundoff > 0 ? '+' : ''}{totals.roundoff.toFixed(2)}</span></div>
            </div>
            <div className="p-2 border-b border-black bg-gray-100 font-bold text-lg flex justify-between items-center">
              <span>Total After GST</span> 
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
            <div className="p-2 flex-grow flex flex-col items-end justify-end pt-12 pb-2 pr-4 relative">
              <span className="absolute top-2 right-4 text-xs font-bold text-black">For {storeSettings.storeName}</span>
              <span className="font-bold border-t border-black pt-1 px-4 text-black">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassicTemplate;

