import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const ServiceTemplate = ({ data, logoUrl }) => {
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
        const file = new File([blob], `Service_Invoice_${data?.invoiceNo || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Your Service Invoice',
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
    link.download = `Service_Invoice_${data?.invoiceNo || 'Bill'}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS */}
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
      <div ref={invoiceRef} className="bg-white p-10 border rounded-lg shadow-sm text-gray-800" style={{ minHeight: '1000px' }}>
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-8">
          <div className="w-1/2">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-20 object-contain" />
            ) : (
              <div className="text-3xl font-bold text-gray-800">YOUR LOGO</div>
            )}
          </div>
          <div className="w-1/2 text-right">
            <h1 className="text-3xl font-bold text-gray-800 tracking-widest uppercase">Invoice</h1>
            <p className="text-gray-500 mt-1">Invoice # {data?.invoiceNo || 'SRV-001'}</p>
            <p className="text-gray-500">Date: {data?.date || '04-Aug-2026'}</p>
          </div>
        </div>

        {/* PROVIDER & CLIENT DETAILS */}
        <div className="flex justify-between mb-10">
          <div className="w-5/12">
            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Service Provider:</p>
            <h2 className="text-lg font-bold text-gray-800">Your Company Name</h2>
            <p className="text-sm text-gray-600">Email: contact@yourcompany.com</p>
            <p className="text-sm text-gray-600">Phone: +91 9876543210</p>
          </div>
          
          <div className="w-5/12">
            <p className="text-sm font-bold text-gray-400 uppercase mb-2">Billed To:</p>
            <h3 className="text-lg font-bold text-gray-800">{data?.customerName || 'Client Name'}</h3>
            {data?.customerEmail && <p className="text-sm text-gray-600">Email: {data.customerEmail}</p>}
            {data?.customerPhone && <p className="text-sm text-gray-600">Phone: {data.customerPhone}</p>}
            {data?.customerAddress && <p className="text-sm text-gray-600 mt-1">{data.customerAddress}</p>}
          </div>
        </div>

        {/* SERVICES TABLE */}
        <table className="w-full text-left mb-10">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-800">
              <th className="py-3 px-2 font-bold w-3/5">Service Description</th>
              <th className="py-3 px-2 font-bold text-center w-1/5">Hours / Qty</th>
              <th className="py-3 px-2 font-bold text-right w-1/5">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2 text-gray-700">
                <p className="font-semibold text-gray-800">Web Development</p>
                <p className="text-xs text-gray-500 mt-1">Frontend React integration and styling</p>
              </td>
              <td className="py-4 px-2 text-center text-gray-700">40 hrs</td>
              <td className="py-4 px-2 text-right font-medium text-gray-800">₹20,000.00</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-2 text-gray-700">
                <p className="font-semibold text-gray-800">Server Setup</p>
                <p className="text-xs text-gray-500 mt-1">Vercel and Firebase configuration</p>
              </td>
              <td className="py-4 px-2 text-center text-gray-700">1 Job</td>
              <td className="py-4 px-2 text-right font-medium text-gray-800">₹5,000.00</td>
            </tr>
          </tbody>
        </table>

        {/* SUMMARY SECTION */}
        <div className="flex justify-end mb-10">
          <div className="w-1/3">
            <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
              <span>Subtotal:</span>
              <span>₹25,000.00</span>
            </div>
            {/* Dynamic Tax */}
            {data?.tax > 0 && (
              <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
                <span>Tax (GST):</span>
                <span>₹{data.tax}</span>
              </div>
            )}
            <div className="flex justify-between py-3 text-xl font-bold text-gray-800 border-b-2 border-gray-800">
              <span>Total Due:</span>
              <span>₹25,000.00</span>
            </div>
          </div>
        </div>

        {/* FOOTER & NOTES */}
        <div className="mt-16">
          <h4 className="font-bold text-gray-800 mb-2">Thank you for your business!</h4>
          <p className="text-sm text-gray-600">Please make payment by {data?.dueDate || 'within 15 days'} to the following account:</p>
          <div className="mt-2 text-sm text-gray-600">
            <p><strong>Bank:</strong> SBI Bank</p>
            <p><strong>Account Name:</strong> Your Company Name</p>
            <p><strong>Account No:</strong> 0987654321</p>
            <p><strong>IFSC:</strong> SBIN0001234</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceTemplate;

