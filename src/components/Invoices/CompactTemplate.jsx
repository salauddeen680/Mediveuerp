import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const CompactTemplate = ({ data, logoUrl }) => {
  const invoiceRef = useRef(null);

  // 1. PRINT
  const handlePrint = () => window.print();

  // 2. SHARE
  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Retail_Bill_${data?.invoiceNo || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Invoice', text: 'Your bill is attached.' });
        } else {
          alert("Device share support nahi kar raha. 'Save' karein.");
        }
      });
    } catch (err) {
      console.error("Share fail:", err);
    }
  };

  // 3. SAVE
  const handleSave = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Retail_Bill_${data?.invoiceNo || 'Bill'}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mb-4 print:hidden">
        <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1.5 rounded shadow hover:bg-blue-700 text-sm font-semibold">
          🖨️ Print
        </button>
        <button onClick={handleShare} className="bg-green-600 text-white px-3 py-1.5 rounded shadow hover:bg-green-700 text-sm font-semibold">
          📲 Share
        </button>
        <button onClick={handleSave} className="bg-gray-800 text-white px-3 py-1.5 rounded shadow hover:bg-gray-900 text-sm font-semibold">
          💾 Save
        </button>
      </div>

      {/* COMPACT INVOICE AREA */}
      <div ref={invoiceRef} className="bg-white p-6 border border-gray-300 shadow-sm text-gray-900 text-sm" style={{ minHeight: '1000px' }}>
        
        {/* HEADER (Compact) */}
        <div className="flex justify-between items-center border-b border-gray-400 pb-3 mb-3">
          <div className="w-1/2 flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-16 object-contain" />
            ) : (
              <div className="text-xl font-bold text-gray-800 border-2 border-gray-800 p-1">LOGO</div>
            )}
            <div>
              <h1 className="text-xl font-bold uppercase leading-tight">Your Store Name</h1>
              <p className="text-xs">123 Market Road, City, State - 110001</p>
              <p className="text-xs">Ph: +91-9876543210 | D.L. No: 123456</p>
              {data?.companyGst && <p className="text-xs font-semibold">GSTIN: {data.companyGst}</p>}
            </div>
          </div>
          <div className="w-1/3 text-right">
            <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest mb-1">Tax Invoice</h2>
            <p className="text-xs font-semibold">Bill No: <span className="font-normal">{data?.invoiceNo || 'RET-1002'}</span></p>
            <p className="text-xs font-semibold">Date: <span className="font-normal">{data?.date || '04-Aug-2026'}</span></p>
          </div>
        </div>

        {/* CUSTOMER INFO (Compact Line) */}
        <div className="flex justify-between border-b border-gray-400 pb-2 mb-4 text-xs">
          <div>
            <span className="font-bold">Billed To: </span> 
            <span>{data?.customerName || 'Walk-in Customer'}</span>
            {data?.customerPhone && <span> | Ph: {data.customerPhone}</span>}
            {data?.customerAddress && <span> | Add: {data.customerAddress}</span>}
          </div>
          {data?.customerGst && (
            <div>
              <span className="font-bold">GSTIN: </span> {data.customerGst}
            </div>
          )}
        </div>

        {/* COMPACT TABLE */}
        <table className="w-full text-left border-collapse border border-gray-400 mb-4">
          <thead>
            <tr className="bg-gray-100 text-xs uppercase border-b border-gray-400">
              <th className="border-r border-gray-400 p-1 text-center w-8">S.No</th>
              <th className="border-r border-gray-400 p-1">Product Description</th>
              <th className="border-r border-gray-400 p-1 text-center w-16">Batch</th>
              <th className="border-r border-gray-400 p-1 text-center w-16">Exp</th>
              <th className="border-r border-gray-400 p-1 text-center w-12">Qty</th>
              <th className="border-r border-gray-400 p-1 text-right w-20">Rate</th>
              <th className="p-1 text-right w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Dummy Row 1 */}
            <tr className="border-b border-gray-300 text-xs">
              <td className="border-r border-gray-400 p-1 text-center">1</td>
              <td className="border-r border-gray-400 p-1 font-medium">Paracetamol 500mg (Strip)</td>
              <td className="border-r border-gray-400 p-1 text-center">B123</td>
              <td className="border-r border-gray-400 p-1 text-center">12/28</td>
              <td className="border-r border-gray-400 p-1 text-center">5</td>
              <td className="border-r border-gray-400 p-1 text-right">30.00</td>
              <td className="p-1 text-right">150.00</td>
            </tr>
            {/* Dummy Row 2 */}
            <tr className="border-b border-gray-300 text-xs">
              <td className="border-r border-gray-400 p-1 text-center">2</td>
              <td className="border-r border-gray-400 p-1 font-medium">Cough Syrup 100ml</td>
              <td className="border-r border-gray-400 p-1 text-center">C456</td>
              <td className="border-r border-gray-400 p-1 text-center">05/27</td>
              <td className="border-r border-gray-400 p-1 text-center">2</td>
              <td className="border-r border-gray-400 p-1 text-right">85.00</td>
              <td className="p-1 text-right">170.00</td>
            </tr>
          </tbody>
        </table>

        {/* COMPACT FOOTER / TOTALS */}
        <div className="flex justify-between items-start text-xs">
          {/* Terms & Bank */}
          <div className="w-1/2">
            <div className="mb-2">
              <p className="font-bold underline mb-1">Bank Details:</p>
              <p>Bank: HDFC Bank | A/C: 1234567890 | IFSC: HDFC0001234</p>
            </div>
            <div>
              <p className="font-bold underline mb-1">Terms & Conditions:</p>
              <p>1. Medicines without batch no. & expiry will not be taken back.</p>
              <p>2. Subject to local jurisdiction.</p>
            </div>
          </div>

          {/* Totals Box */}
          <div className="w-1/3 border border-gray-400 p-2">
            <div className="flex justify-between mb-1">
              <span>Total Amount:</span>
              <span>₹320.00</span>
            </div>
            {data?.discount > 0 && (
              <div className="flex justify-between mb-1 text-green-700">
                <span>Discount:</span>
                <span>-₹{data.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1 mt-1">
              <span>Net Payable:</span>
              <span>₹320.00</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-right">
          <p className="text-xs font-bold border-t border-gray-400 inline-block pt-1 w-40 text-center">Authorised Signatory</p>
        </div>

      </div>
    </div>
  );
};

export default CompactTemplate;

