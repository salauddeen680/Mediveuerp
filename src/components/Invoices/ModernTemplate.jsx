import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const ModernTemplate = ({ data, logoUrl }) => {
  const invoiceRef = useRef(null);

  // 1. PRINT FUNCTION
  const handlePrint = () => {
    window.print();
  };

  // 2. SHARE AS PHOTO FUNCTION
  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Invoice_${data?.invoiceNo || 'Bill'}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Your Invoice',
            text: 'Please find your invoice attached.',
          });
        } else {
          alert("Aapka device direct share support nahi karta. Please 'Save' karke share karein.");
        }
      });
    } catch (err) {
      console.error("Share fail ho gaya:", err);
    }
  };

  // 3. SAVE FUNCTION
  const handleSave = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Invoice_${data?.invoiceNo || 'Bill'}.png`;
    link.click();
  };

  // Total Calculation (Dynamic)
  let subtotal = 0;
  let totalTax = 0;
  if (data?.items) {
    data.items.forEach(item => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const base = qty * rate;
      const dis = base * ((Number(item.disPercent) || 0) / 100);
      const afterDis = base - dis;
      totalTax += afterDis * ((Number(item.gstPercent) || 0) / 100);
      subtotal += afterDis;
    });
  }
  const grandTotal = Math.round(subtotal + totalTax);

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* BUTTONS */}
      <div className="flex justify-end gap-3 mb-6 print:hidden">
        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-semibold">
          🖨️ Print
        </button>
        <button onClick={handleShare} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-semibold">
          📲 Share (Photo)
        </button>
        <button onClick={handleSave} className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900 font-semibold">
          💾 Save
        </button>
      </div>

      {/* INVOICE AREA */}
      <div ref={invoiceRef} className="bg-white p-8 border rounded-sm shadow-sm text-gray-800" style={{ minHeight: '1000px' }}>
        
        {/* HEADER: Logo Left, Details Right */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div className="w-1/2">
            {/* Logo Left Side - Size Reduced */}
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="text-2xl font-bold text-blue-600 tracking-wider">YOUR LOGO</div>
            )}
          </div>
          
          <div className="w-1/2 text-right">
            <h1 className="text-4xl font-light text-gray-400 mb-2">INVOICE</h1>
            <h2 className="text-xl font-bold text-gray-800">Company Name</h2>
            <p className="text-sm text-gray-600">123 Business Road, City, State</p>
            {data?.companyPhone && <p className="text-sm text-gray-600">Phone: {data.companyPhone}</p>}
            {data?.companyGst && <p className="text-sm text-gray-600 font-semibold">GSTIN: {data.companyGst}</p>}
          </div>
        </div>

        {/* DETAILS: Bill To */}
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">BILLED TO:</p>
            <h3 className="text-lg font-bold">{data?.customerName || 'Customer Name'}</h3>
            {data?.customerAddress && <p className="text-sm text-gray-600">{data.customerAddress}</p>}
            {data?.customerPhone && <p className="text-sm text-gray-600">Ph: {data.customerPhone}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm"><span className="text-gray-500 font-semibold">Invoice No:</span> {data?.invoiceNo || 'INV-001'}</p>
            <p className="text-sm"><span className="text-gray-500 font-semibold">Date:</span> {data?.date || '04-Aug-2026'}</p>
          </div>
        </div>

        {/* TABLE (Modern Look with Dynamic Real Items) */}
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm border-b-2 border-gray-300">
              <th className="py-2 px-2 font-semibold w-12">S.No.</th>
              <th className="py-2 px-2 font-semibold">Item Description</th>
              <th className="py-2 px-2 font-semibold text-center w-20">Qty</th>
              <th className="py-2 px-2 font-semibold text-right w-24">Rate</th>
              <th className="py-2 px-2 font-semibold text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data?.items && data.items.map((item, index) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.rate) || 0;
              const disP = Number(item.disPercent) || 0;
              const gstP = Number(item.gstPercent) || 0;
              
              const baseAmount = qty * rate;
              const disAmt = baseAmount * (disP / 100);
              const afterDis = baseAmount - disAmt;
              const gstAmt = afterDis * (gstP / 100);
              const totalAmount = afterDis + gstAmt;

              return (
                <tr key={item.id || index} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-sm">{index + 1}</td>
                  <td className="py-3 px-2 text-sm text-gray-800 font-medium">{item.description || 'Item Name'}</td>
                  <td className="py-3 px-2 text-sm text-center">{qty}</td>
                  <td className="py-3 px-2 text-sm text-right">₹{rate.toFixed(2)}</td>
                  <td className="py-3 px-2 text-sm text-right font-medium">₹{totalAmount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* TOTALS & TERMS */}
        <div className="flex justify-between items-start mt-8">
          <div className="w-1/2">
            <p className="text-sm text-gray-500 font-semibold mb-1">Terms & Conditions:</p>
            <p className="text-xs text-gray-500">1. Goods once sold will not be taken back.<br/>2. Subject to local jurisdiction.</p>
          </div>
          
          <div className="w-1/3">
            <div className="flex justify-between border-b pb-2 mb-2">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between border-b pb-2 mb-2">
                <span className="text-sm text-gray-600">Tax (GST):</span>
                <span className="text-sm font-semibold">₹{totalTax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between bg-gray-50 p-2 rounded">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold text-blue-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* SIGNATURE */}
        <div className="mt-20 text-right">
          <p className="border-t border-gray-400 inline-block pt-2 text-sm text-gray-600 font-semibold w-48 text-center">
            Authorised Signatory
          </p>
        </div>

      </div>
    </div>
  );
};

export default ModernTemplate;
