import React from 'react';

export const renderMargInvoice = (activeInvoice, handlePrint, handleShareWhatsApp) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <button onClick={handlePrint} className="bg-teal-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium cursor-pointer">Print / PDF</button>
        <button onClick={handleShareWhatsApp} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-slate-700 font-medium cursor-pointer">WhatsApp</button>
      </div>

      <div id="invoice-print-area" className="bg-white text-black p-6 rounded-lg border-2 border-black text-[11px] font-sans">
        
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <div className="text-[10px] font-bold uppercase text-right">Original for Buyer</div>
          <h1 className="text-2xl font-black tracking-wide uppercase text-blue-900">{activeInvoice.storeInfo?.storeName}</h1>
          <p className="text-gray-800 font-medium">Pharmaceutical Distributors (Powered by MEDIVEU ERP)</p>
          <p className="text-gray-700">{activeInvoice.storeInfo?.address}</p>
          <p className="text-gray-700">Phone: {activeInvoice.storeInfo?.phone}</p>
        </div>

        {/* Top Info Bar */}
        <div className="grid grid-cols-2 border border-black mb-2 p-2 bg-gray-50">
          <div>
            <p><span className="font-bold">GSTIN :</span> {activeInvoice.storeInfo?.gstin}</p>
            <p><span className="font-bold">Invoice No :</span> {activeInvoice.billNo}</p>
            <p><span className="font-bold">Invoice Date :</span> {activeInvoice.date}</p>
            <p><span className="font-bold">DL No :</span> {activeInvoice.storeInfo?.dlNumber}</p>
          </div>
          <div>
            <p><span className="font-bold">Shipped To:</span> {activeInvoice.customerName}</p>
            <p><span className="font-bold">GSTIN:</span> {activeInvoice.customerGstin}</p>
          </div>
        </div>

        {/* Buyer Address Box */}
        <div className="border border-black mb-2 p-2">
          <p className="font-bold border-b border-black pb-0.5 mb-1">Detail of Receiver (Billed to):</p>
          <p className="font-bold text-sm">{activeInvoice.customerName}</p>
          <p>{activeInvoice.customerAddress}</p>
          <p><span className="font-bold">GSTIN:</span> {activeInvoice.customerGstin}</p>
        </div>

        {/* Exact Marg-Style Table Structure */}
        <table className="w-full border-collapse border border-black mb-2 text-[10px]">
          <thead>
            <tr className="bg-cyan-100 border-b-2 border-black text-center font-bold">
              <th className="border border-black p-1 w-8">S.</th>
              <th className="border border-black p-1 w-10">Qty.</th>
              <th className="border border-black p-1 w-12">Pack</th>
              <th className="border border-black p-1 text-left">Product</th>
              <th className="border border-black p-1 w-14">BATCH</th>
              <th className="border border-black p-1 w-10">EXP</th>
              <th className="border border-black p-1 w-12">HSN</th>
              <th className="border border-black p-1 w-12">MRP</th>
              <th className="border border-black p-1 w-12">Rate</th>
              <th className="border border-black p-1 w-10">DIS</th>
              <th className="border border-black p-1 w-8">SGST</th>
              <th className="border border-black p-1 w-8">CGST</th>
              <th className="border border-black p-1 text-right w-14">Amount</th>
            </tr>
          </thead>
          <tbody>
            {activeInvoice.items.map((item, idx) => {
              const itemNet = (item.qty * item.originalPrice) * (1 - (activeInvoice.discountPercent || 0)/100);
              const gstRate = Number(item.gst) || 12;
              return (
                <tr key={idx} className="border-b border-black text-center">
                  <td className="border border-black p-1">{idx + 1}</td>
                  <td className="border border-black p-1 font-bold">{item.qty}</td>
                  <td className="border border-black p-1">{item.pack || '10T'}</td>
                  <td className="border border-black p-1 text-left font-bold">{item.name}</td>
                  <td className="border border-black p-1">{item.batch}</td>
                  <td className="border border-black p-1">{item.expiry}</td>
                  <td className="border border-black p-1">{item.hsn}</td>
                  <td className="border border-black p-1">₹{item.mrp}</td>
                  <td className="border border-black p-1">₹{item.originalPrice}</td>
                  <td className="border border-black p-1">{activeInvoice.discountPercent}%</td>
                  <td className="border border-black p-1">{gstRate/2}%</td>
                  <td className="border border-black p-1">{gstRate/2}%</td>
                  <td className="border border-black p-1 text-right font-bold">₹{itemNet.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals & Bank Details */}
        <div className="grid grid-cols-2 gap-4 border border-black p-2 mb-2 bg-gray-50 text-[10px]">
          <div>
            <p className="font-bold underline mb-1">Bank Details:</p>
            <p>Bank Name: PUNJAB & SIND BANK</p>
            <p>Branch: GEETA COLONY</p>
            <p>A/c No.: 06261100054752</p>
            <p>IFSC CODE: PSIB0000626</p>
          </div>
          <div className="text-right space-y-0.5">
            <p>Total Amount Before GST: ₹{activeInvoice.subtotal.toFixed(2)}</p>
            {activeInvoice.discountAmount > 0 && <p>Discount: -₹{activeInvoice.discountAmount.toFixed(2)}</p>}
            <p>Add : SGST: ₹{activeInvoice.totalSgst.toFixed(2)}</p>
            <p>Add : CGST: ₹{activeInvoice.totalCgst.toFixed(2)}</p>
            <p className="font-bold text-xs border-t border-black pt-1">Grand Total: ₹{activeInvoice.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="border border-black p-2 text-[9px]">
          <p className="font-bold">Terms & Conditions:</p>
          <p>1. Goods once sold will not be taken back or exchanged.</p>
          <p>2. Bills not paid on due date will attract 24% interest.</p>
          <div className="text-right mt-3 font-bold text-[10px]">For {activeInvoice.storeInfo?.storeName}<br/><br/>Authorised Signatory</div>
        </div>

      </div>
    </div>
  );
};

