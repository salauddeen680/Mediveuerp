import React from 'react';

export const renderMargInvoice = (invoice, handlePrint, handleShareWhatsApp) => {
  if (!invoice) return null;

  return (
    <div className="bg-white text-black p-8 rounded-xl max-w-4xl mx-auto font-mono shadow-2xl border border-gray-300">
      
      {/* Top Header / Store Branding */}
      <div className="text-center border-b-2 border-black pb-4 mb-3">
        <h1 className="text-2xl font-black uppercase tracking-wider">{invoice.storeInfo?.storeName || 'PHARMA WHOLESALE'}</h1>
        <p className="text-xs font-medium">{invoice.storeInfo?.address || '13-2-47, OPP GOWDIPAMATAM, BACHELI'}</p>
        <p className="text-xs font-medium">
          Phone: {invoice.storeInfo?.phone || '9999955559'} | GSTIN: {invoice.storeInfo?.gstin || '07CTMPM699K1ZJ'}
        </p>
        <p className="text-xs font-bold mt-1">Drug License No: {invoice.storeInfo?.dlNumber || 'DL11WW-6985'}</p>
      </div>

      {/* Bill & Party Details Box */}
      <div className="border border-black text-xs mb-3">
        <div className="grid grid-cols-2 divide-x divide-black p-2 bg-gray-50">
          <div>
            <p><span className="font-bold">Invoice No:</span> {invoice.billNo}</p>
            <p><span className="font-bold">Invoice Date:</span> {invoice.date}</p>
          </div>
          <div className="pl-2">
            <p><span className="font-bold">Billed to:</span> {invoice.customerName}</p>
            <p><span className="font-bold">GSTIN:</span> {invoice.customerGstin || 'N/A'}</p>
            <p><span className="font-bold">Address:</span> {invoice.customerAddress || 'DELHI'}</p>
          </div>
        </div>
      </div>

      {/* Marg Style Inventory Table */}
      <table className="w-full text-xs border-collapse border border-black mb-4">
        <thead>
          <tr className="bg-teal-100/60 border-b border-black text-center font-bold">
            <th className="border border-black p-1.5 w-8">S.</th>
            <th className="border border-black p-1.5 w-12">Qty</th>
            <th className="border border-black p-1.5 w-12">Pack</th>
            <th className="border border-black p-1.5 text-left">Product Name</th>
            <th className="border border-black p-1.5 w-16">BATCH</th>
            <th className="border border-black p-1.5 w-14">EXP</th>
            <th className="border border-black p-1.5 w-16">HSN</th>
            <th className="border border-black p-1.5 w-14">MRP</th>
            <th className="border border-black p-1.5 w-14">Rate</th>
            <th className="border border-black p-1.5 w-12">DIS%</th>
            <th className="border border-black p-1.5 w-12">SGST</th>
            <th className="border border-black p-1.5 w-12">CGST</th>
            <th className="border border-black p-1.5 text-right w-20">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => {
            const itemNet = (item.qty * item.originalPrice) * (1 - (invoice.discountPercent || 0) / 100);
            const gstRate = Number(item.gst) || 12;
            return (
              <tr key={idx} className="border-b border-black/30 hover:bg-gray-50">
                <td className="border border-black p-1 text-center">{idx + 1}</td>
                <td className="border border-black p-1 text-center font-bold">{item.qty}</td>
                <td className="border border-black p-1 text-center">{item.pack || '10T'}</td>
                <td className="border border-black p-1 font-bold uppercase">{item.name}</td>
                <td className="border border-black p-1 text-center">{item.batch}</td>
                <td className="border border-black p-1 text-center">{item.expiry}</td>
                <td className="border border-black p-1 text-center">{item.hsn}</td>
                <td className="border border-black p-1 text-right">₹{item.mrp}</td>
                <td className="border border-black p-1 text-right">₹{item.originalPrice}</td>
                <td className="border border-black p-1 text-center">{invoice.discountPercent || 0}%</td>
                <td className="border border-black p-1 text-center">{gstRate / 2}%</td>
                <td className="border border-black p-1 text-center">{gstRate / 2}%</td>
                <td className="border border-black p-1 text-right font-bold">₹{itemNet.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals and Summary Footer */}
      <div className="grid grid-cols-2 border border-black text-xs mb-4">
        <div className="p-2 border-r border-black flex flex-col justify-between">
          <div>
            <p className="font-bold underline mb-1">Bank Details:</p>
            <p>Bank Name: PUNJAB & SIND BANK</p>
            <p>A/c No: 06261100054752 | IFSC: PSIB0000626</p>
          </div>
          <div className="mt-4">
            <p className="font-bold">Terms & Conditions:</p>
            <p className="text-[10px] text-gray-700">1. Goods once sold will not be taken back.<br/>2. Subject to local jurisdiction.</p>
          </div>
        </div>
        <div className="p-2 space-y-1 bg-gray-50 text-right">
          <div className="flex justify-between"><span>Sub Total:</span> <span className="font-bold">₹{(invoice.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount:</span> <span>-₹{(invoice.discountAmount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Add SGST:</span> <span>+₹{(invoice.totalSgst || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Add CGST:</span> <span>+₹{(invoice.totalCgst || 0).toFixed(2)}</span></div>
          <div className="border-t border-black pt-1 flex justify-between text-sm font-black">
            <span>GRAND TOTAL:</span> 
            <span className="text-teal-700">₹{(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signature & Action Buttons */}
      <div className="flex justify-between items-end pt-2">
        <div className="text-[10px] font-bold text-gray-600">
          <p>Receiver's Signature:</p>
          <div className="h-10 border-b border-dashed border-black w-40 mt-2"></div>
        </div>
        
        {/* Action Buttons (Hidden when printing) */}
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={handleShareWhatsApp} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-1"
          >
            Share WhatsApp
          </button>
          <button 
            onClick={handlePrint} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition-colors cursor-pointer flex items-center gap-1"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="text-right text-[10px] font-bold">
          <p>For {invoice.storeInfo?.storeName || 'PHARMA WHOLESALE'}</p>
          <div className="h-10 border-b border-dashed border-black w-40 mt-2"></div>
          <p className="mt-1">Authorised Signatory</p>
        </div>
      </div>

    </div>
  );
};
