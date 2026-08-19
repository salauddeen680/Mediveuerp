import React, { forwardRef } from 'react';

// forwardRef use kiya hai taaki iska direct print nikal sake bina screen pe dikhaye
const PaymentReceipt = forwardRef(({ payment, storeSettings }, ref) => {
  
  if (!payment) return null;

  return (
    // 🔥 3-INCH THERMAL RECEIPT STYLE (Strict Width 80mm) 🔥
    // Yeh screen par chhupa rahega (hidden) aur sirf Print dabane par dikhega (print:block)
    <div className="hidden print:block">
      <div ref={ref} className="w-[80mm] p-4 text-black bg-white text-[12px] font-sans font-bold mx-auto">
        
        {/* HEADER */}
        <div className="text-center border-b-2 border-black border-dashed pb-2 mb-2">
          <h2 className="text-[18px] font-black uppercase leading-tight">{storeSettings?.storeName || 'STORE NAME'}</h2>
          <p className="text-[10px] mt-1">{storeSettings?.address}</p>
          <p className="text-[10px]">Ph: {storeSettings?.phone}</p>
        </div>

        {/* TITLE */}
        <div className="text-center font-black text-[15px] mb-3 uppercase tracking-widest bg-black text-white py-1">
          Payment Receipt
        </div>

        {/* CUSTOMER DETAILS */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Date:</span> 
            <span>{new Date(payment.date).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span> 
            <span className="font-black uppercase text-right max-w-[120px] break-words">{payment.customerName}</span>
          </div>
        </div>

        {/* AMOUNT SECTION */}
        <div className="border-t-2 border-b-2 border-black border-dashed py-3 my-2 flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-wider mb-1">Amount Received</span>
          <span className="font-black text-[22px]">Rs. {Number(payment.amount).toFixed(2)}</span>
        </div>

        {/* FOOTER & NOTES */}
        <div className="text-center space-y-1 mt-3">
          <p className="text-[11px] uppercase">Mode: {payment.description || 'Cash'}</p>
          <p className="text-[10px] italic mt-2">Thank you for your payment!</p>
          <p className="text-[9px] mt-3">Signature / Stamp</p>
          <div className="mt-4 border-b border-black w-24 mx-auto"></div>
        </div>

      </div>
    </div>
  );
});

export default PaymentReceipt;
