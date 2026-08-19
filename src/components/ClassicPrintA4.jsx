import React, { forwardRef } from 'react';

// forwardRef zaroori hai taaki hum iska photo (html2canvas) nikal sakein
const ClassicPrintA4 = forwardRef(({
  logo, storeSettings, invoiceDetails, buyerDetails, bankDetails,
  items, totals, amountInWords, terms
}, ref) => {
  
  return (
    // 🔥 STRICT A4 BOX: Exact 794x1123 pixels. No squishing. 🔥
    <div ref={ref} className="w-[794px] h-[1123px] bg-white text-black flex flex-col box-border font-sans" style={{ padding: '20px' }}>
      
      <div className="border-2 border-black flex flex-col h-full">
        {/* HEADER */}
        <div className="flex border-b-2 border-black p-4 items-center">
          <div className="w-[25%] flex justify-start items-center">
            {logo ? <img src={logo} alt="Logo" className="max-h-[70px] max-w-[150px] object-contain" /> : <div className="text-xl font-bold border-2 border-black p-2">LOGO</div>}
          </div>
          <div className="w-[50%] text-center">
            <h1 className="text-3xl font-black uppercase leading-none">{storeSettings?.storeName || ''}</h1>
            <p className="text-xs font-bold uppercase mt-1">{storeSettings?.address || ''}</p>
            <p className="text-xs font-bold mt-1">Contact: {storeSettings?.phone || ''}</p>
          </div>
          <div className="w-[25%] text-right flex flex-col justify-center">
             <div className="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase inline-block mb-2 text-center w-max ml-auto">Tax Invoice</div>
             <p className="text-xs font-bold">GSTIN: <span className="font-black text-sm">{storeSettings?.gstin || ''}</span></p>
          </div>
        </div>

        {/* META DETAILS */}
        <div className="flex border-b-2 border-black text-[13px]">
          <div className="w-1/2 p-2 border-r-2 border-black flex flex-col gap-1">
             <div className="flex"><span className="w-24 font-bold">Invoice No:</span> <span className="font-black">{invoiceDetails?.invoiceNumber || ''}</span></div>
             <div className="flex"><span className="w-24 font-bold">Date:</span> <span className="font-bold">{invoiceDetails?.invoiceDate || ''}</span></div>
             <div className="flex"><span className="w-24 font-bold">State:</span> <span className="font-bold uppercase">{invoiceDetails?.stateCode || ''}</span></div>
          </div>
          <div className="w-1/2 p-2 flex flex-col gap-1">
             <div className="flex"><span className="w-24 font-bold">PAN NO.:</span> <span className="font-bold uppercase">{invoiceDetails?.panNo || ''}</span></div>
             <div className="font-bold underline mt-1 text-[12px]">SHIPPED TO PARTY:</div>
             <div className="flex"><span className="w-24 font-bold">GSTIN:</span> <span className="font-bold uppercase">{invoiceDetails?.shippedGstin || ''}</span></div>
          </div>
        </div>

        {/* BUYER DETAILS */}
        <div className="flex border-b-2 border-black text-[13px]">
          <div className="w-1/2 p-2 border-r-2 border-black flex flex-col gap-1">
             <div className="font-bold underline mb-1 text-[12px]">Details Of Receiver (Billed to)</div>
             <div className="flex"><span className="w-20 font-bold">Name:</span> <span className="font-black uppercase">{buyerDetails?.name || ''}</span></div>
             <div className="flex"><span className="w-20 font-bold">Address:</span> <span className="font-bold uppercase break-words w-full">{buyerDetails?.address || ''}</span></div>
             <div className="flex"><span className="w-20 font-bold">GSTIN:</span> <span className="font-black uppercase">{buyerDetails?.gstin || ''}</span></div>
          </div>
          <div className="w-1/2 p-2 flex flex-col gap-1">
             <div className="font-bold underline mb-1 text-[12px]">Transportation Details</div>
             <div className="flex"><span className="w-24 font-bold">Transporter:</span> <span className="font-bold uppercase">{buyerDetails?.transportParty || ''}</span></div>
             <div className="flex"><span className="w-24 font-bold">Veh/GSTIN:</span> <span className="font-bold uppercase">{buyerDetails?.transportGstin || ''}</span></div>
             <div className="flex gap-4 mt-1">
                <div className="flex"><span className="font-bold mr-1">L.R No:</span> <span className="uppercase">{buyerDetails?.lrNo || ''}</span></div>
                <div className="flex"><span className="font-bold mr-1">Date:</span> <span>{buyerDetails?.lrDate || ''}</span></div>
             </div>
          </div>
        </div>

        {/* ITEMS TABLE (No Inputs, Only Text) */}
        <div className="flex-grow flex flex-col">
          <table className="w-full text-center border-collapse text-[12px]">
            <thead className="border-b-2 border-black font-extrabold uppercase bg-gray-100">
              <tr>
                <th className="border-r border-black p-2 w-8">S.N</th>
                <th className="border-r border-black p-2 text-left pl-2">Description of Goods</th>
                <th className="border-r border-black p-2 w-14">HSN</th>
                <th className="border-r border-black p-2 w-12">Qty</th>
                <th className="border-r border-black p-2 w-16 text-right pr-2">Rate</th>
                <th className="border-r border-black p-2 w-10">Dis%</th>
                <th className="border-r border-black p-2 w-10">GST%</th>
                <th className="p-2 w-20 text-right pr-2">Net Amt</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((item, index) => {
                const baseAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                const disAmt = baseAmount * ((Number(item.disPercent) || 0) / 100);
                const afterDis = baseAmount - disAmt;
                const gstAmt = afterDis * ((Number(item.gstPercent) || 0) / 100);
                const totalAmount = afterDis + gstAmt;

                return (
                  <tr key={item.id} className="border-b border-gray-300 align-top">
                    <td className="border-r border-black p-2 font-bold">{index + 1}</td>
                    <td className="border-r border-black p-2 text-left font-black uppercase text-[13px]">{item.description}</td>
                    <td className="border-r border-black p-2 uppercase">{item.hsn}</td>
                    <td className="border-r border-black p-2 font-bold">{item.qty}</td>
                    <td className="border-r border-black p-2 text-right font-bold pr-2">{item.rate}</td>
                    <td className="border-r border-black p-2">{item.disPercent}</td>
                    <td className="border-r border-black p-2 font-bold">{item.gstPercent}</td>
                    <td className="p-2 text-right font-black pr-2 text-[13px]">{totalAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex border-t-2 border-black text-[13px] h-[220px]">
          <div className="w-2/3 border-r-2 border-black flex flex-col">
            <div className="p-2 border-b border-black">
              <div className="font-bold underline mb-1">Bank Details</div>
              <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-2 gap-y-1">
                <span className="font-bold">Bank:</span> <span className="uppercase">{bankDetails?.bankName}</span>
                <span className="font-bold">Branch:</span> <span className="uppercase">{bankDetails?.branch}</span>
                <span className="font-bold">A/c No:</span> <span className="font-black uppercase">{bankDetails?.accountNo}</span>
                <span className="font-bold">IFSC:</span> <span className="font-black uppercase">{bankDetails?.ifsc}</span>
              </div>
            </div>
            <div className="p-2 border-b border-black flex items-center">
              <span className="font-bold uppercase mr-2">Rs. (In Words):</span>
              <span className="uppercase font-black text-[13px]">{amountInWords}</span>
            </div>
            <div className="p-2 flex-grow">
              <div className="font-bold underline mb-1">Terms & conditions</div>
              <p className="text-[11px] font-semibold leading-relaxed whitespace-pre-wrap">{terms}</p>
            </div>
          </div>
          <div className="w-1/3 flex flex-col">
            <div className="p-2 border-b-2 border-black font-bold flex-grow">
              <div className="flex justify-between mb-1"><span>Taxable Value</span> <span>{totals?.taxableValue.toFixed(2)}</span></div>
              <div className="flex justify-between mb-1 text-red-600"><span>Discount</span> <span>- {totals?.discount.toFixed(2)}</span></div>
              <div className="flex justify-between mb-1"><span>SGST</span> <span>+ {totals?.sgst.toFixed(2)}</span></div>
              <div className="flex justify-between mb-1"><span>CGST</span> <span>+ {totals?.cgst.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-gray-300 pt-1 mt-1"><span>Roundoff</span> <span>{totals?.roundoff > 0 ? '+' : ''}{totals?.roundoff.toFixed(2)}</span></div>
            </div>
            <div className="p-2 border-b-2 border-black bg-gray-200 font-black text-[16px] flex justify-between items-center">
              <span>Grand Total</span> <span>₹{totals?.grandTotal.toFixed(2)}</span>
            </div>
            <div className="p-2 flex flex-col items-center justify-between h-[60px] relative">
              <span className="text-[10px] font-bold uppercase w-full text-right absolute top-1 right-2">For {storeSettings?.storeName}</span>
              <span className="font-bold border-t-2 border-black pt-1 px-4 text-[12px] w-[80%] text-center mt-auto">Authorised Signatory</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default ClassicPrintA4;

