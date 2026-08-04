import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const CorporateTemplate = ({ data, logoUrl }) => {
  const invoiceRef = useRef(null);

  // 1. PRINT
  const handlePrint = () => {
    window.print();
  };

  // 2. SHARE (WhatsApp/Email)
  const handleShare = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Invoice_${data?.invoiceNo || 'Bill'}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Your Corporate Invoice',
            text: 'Please find your invoice attached.',
          });
        } else {
          alert("Aapka device direct share support nahi karta. Please 'Save' karke bhejein.");
        }
      });
    } catch (err) {
      console.error("Share fail ho gaya:", err);
    }
  };

  // 3. SAVE (Download as PNG)
  const handleSave = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `Invoice_${data?.invoiceNo || 'Bill'}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      
      {/* ACTION BUTTONS (Print hone par hide ho jayenge) */}
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
      <div ref={invoiceRef} className="bg-white p-0 border border-gray-200 shadow-sm text-gray-800 relative" style={{ minHeight: '1000px' }}>
        
        {/* TOP BLUE ACCENT BAR */}
        <div className="h-3 w-full bg-blue-800"></div>

        <div className="p-8">
          {/* HEADER: Logo Left, Company Info Right */}
          <div className="flex justify-between items-start mb-10">
            <div className="w-1/2">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" className="max-h-24 object-contain" />
              ) : (
                <div className="text-3xl font-extrabold text-blue-800 tracking-wider">YOUR LOGO</div>
              )}
            </div>
            
            <div className="w-1/2 text-right">
              <h1 className="text-4xl font-bold text-blue-800 mb-2 uppercase tracking-widest">Tax Invoice</h1>
              <h2 className="text-xl font-bold text-gray-800 mt-2">Company Name Ltd.</h2>
              <p className="text-sm text-gray-600">Corporate Office, Business Park</p>
              <p className="text-sm text-gray-600">New Delhi, India - 110001</p>
              {data?.companyPhone && <p className="text-sm text-gray-600">Ph: {data.companyPhone}</p>}
              {data?.companyGst && <p className="text-sm text-gray-800 font-semibold mt-1">GSTIN: {data.companyGst}</p>}
            </div>
          </div>

          {/* BILL TO & INVOICE DETAILS */}
          <div className="flex justify-between border-t-2 border-b-2 border-blue-100 py-4 mb-8">
            <div className="w-1/2">
              <p className="text-xs text-blue-800 font-bold uppercase mb-1">Invoice To:</p>
              <h3 className="text-lg font-bold text-gray-800">{data?.customerName || 'Client Name'}</h3>
              {data?.customerAddress && <p className="text-sm text-gray-600 mt-1">{data.customerAddress}</p>}
              {data?.customerGst && <p className="text-sm text-gray-800 font-semibold mt-1">GSTIN: {data.customerGst}</p>}
            </div>
            <div className="w-1/2 text-right">
              <div className="inline-block text-left">
                <p className="text-sm mb-1"><span className="text-blue-800 font-bold uppercase inline-block w-24">Inv Number:</span> <span className="font-medium text-gray-800">{data?.invoiceNo || 'CORP-2026-001'}</span></p>
                <p className="text-sm mb-1"><span className="text-blue-800 font-bold uppercase inline-block w-24">Inv Date:</span> <span className="font-medium text-gray-800">{data?.date || '04-Aug-2026'}</span></p>
                {data?.dueDate && <p className="text-sm mb-1"><span className="text-blue-800 font-bold uppercase inline-block w-24">Due Date:</span> <span className="font-medium text-gray-800">{data.dueDate}</span></p>}
              </div>
            </div>
          </div>

          {/* CORPORATE TABLE (Blue Header) */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-blue-800 text-white text-sm">
                <th className="py-3 px-3 font-semibold w-12 text-center">#</th>
                <th className="py-3 px-3 font-semibold">Item & Description</th>
                <th className="py-3 px-3 font-semibold text-center w-20">Qty</th>
                <th className="py-3 px-3 font-semibold text-right w-32">Rate</th>
                <th className="py-3 px-3 font-semibold text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Dummy Data */}
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-4 px-3 text-center text-sm">1</td>
                <td className="py-4 px-3 text-sm font-medium text-gray-800">Corporate Consultation Service</td>
                <td className="py-4 px-3 text-center text-sm">1</td>
                <td className="py-4 px-3 text-right text-sm">₹15,000.00</td>
                <td className="py-4 px-3 text-right text-sm font-bold text-gray-800">₹15,000.00</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-3 text-center text-sm">2</td>
                <td className="py-4 px-3 text-sm font-medium text-gray-800">Software Maintenance (Monthly)</td>
                <td className="py-4 px-3 text-center text-sm">3</td>
                <td className="py-4 px-3 text-right text-sm">₹2,000.00</td>
                <td className="py-4 px-3 text-right text-sm font-bold text-gray-800">₹6,000.00</td>
              </tr>
            </tbody>
          </table>

          {/* TOTALS & BANK DETAILS */}
          <div className="flex justify-between items-start mt-8">
            <div className="w-1/2 pr-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-xs text-blue-800 font-bold uppercase mb-2">Payment / Bank Details</p>
                <p className="text-sm text-gray-700">Bank Name: <span className="font-semibold">HDFC Bank</span></p>
                <p className="text-sm text-gray-700">Account No: <span className="font-semibold">01234567890123</span></p>
                <p className="text-sm text-gray-700">IFSC Code: <span className="font-semibold">HDFC0001234</span></p>
              </div>
            </div>
            
            <div className="w-1/3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-semibold">₹21,000.00</span>
              </div>
              {/* Dynamic Discount */}
              {data?.discount > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                  <span className="text-sm">Discount:</span>
                  <span className="text-sm font-semibold">-₹{data.discount}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">CGST (9%):</span>
                <span className="text-sm font-semibold">₹1,890.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">SGST (9%):</span>
                <span className="text-sm font-semibold">₹1,890.00</span>
              </div>
              
              <div className="flex justify-between items-center bg-blue-800 text-white p-3 mt-2 rounded">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-xl font-bold">₹24,780.00</span>
              </div>
            </div>
          </div>
          
          {/* FOOTER & SIGNATURE */}
          <div className="flex justify-between items-end mt-20">
            <div className="w-2/3">
              <p className="text-xs text-gray-500 mb-1 font-bold">Terms & Conditions:</p>
              <p className="text-xs text-gray-500">1. Payment is due within 15 days of invoice date.</p>
              <p className="text-xs text-gray-500">2. Late payments may be subject to a 1.5% monthly interest rate.</p>
            </div>
            <div className="w-1/3 text-right">
              <div className="h-16"></div> {/* Signature Space */}
              <p className="border-t-2 border-blue-800 inline-block pt-2 text-sm text-blue-800 font-bold w-48 text-center">
                For Company Name Ltd.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CorporateTemplate;

