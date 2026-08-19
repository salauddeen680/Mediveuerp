import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Share2 } from 'lucide-react';
import ClassicPrintA4 from './ClassicPrintA4'; // 🔥 Upar wali file ko import karein 🔥

const MainBillingApp = ({
  logo, storeSettings, invoiceDetails, setInvoiceDetails,
  buyerDetails, setBuyerDetails, bankDetails, setBankDetails,
  amountInWords, setAmountInWords, terms, setTerms,
  items, handleItemChange, addRow, removeRow, totals
}) => {
  
  // Is Ref ka istemal hum chhupi hui A4 file ki photo lene ke liye karenge
  const printRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      // Photo 794px wali strict file ki niklegi, mobile ui ki nahi!
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoiceDetails.invoiceNumber || 'Bill'}.pdf`);
    } catch (err) {
      console.error("PDF Generate Fail:", err);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      
      {/* 1. PDF / SHARE BUTTONS */}
      <div className="flex gap-3 mb-6">
        <button onClick={handleDownloadPDF} className="flex items-center bg-green-600 text-white px-4 py-2 rounded font-bold shadow">
          <Download size={16} className="mr-2" /> Save High Quality PDF
        </button>
      </div>

      {/* 2. MOBILE DATA ENTRY FORM (Yahan simple inputs rakhein) */}
      <div className="bg-white p-4 rounded shadow-lg max-w-lg mb-10">
        <h2 className="font-black text-xl mb-4">Mobile Data Entry Form</h2>
        
        <label className="block mb-2 font-bold">Customer Name</label>
        <input 
          type="text" 
          className="w-full border border-gray-300 p-2 rounded mb-4" 
          value={buyerDetails.name} 
          onChange={e => setBuyerDetails({...buyerDetails, name: e.target.value})} 
          placeholder="Customer Name"
        />

        {/* ... Aap yahan apne baaki normal mobile inputs daal sakte hain ... */}
        {/* Is form ka design kuch bhi ho, PDF par asar nahi padega! */}
      </div>


      {/* 🔥 3. THE MAGIC TRICK: HIDDEN A4 PRINT FILE 🔥 */}
      {/* Absolute aur left-[-9999px] isko screen se bahar dhakel deta hai, par html2canvas isko dekh leta hai */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <ClassicPrintA4 
          ref={printRef}
          logo={logo}
          storeSettings={storeSettings}
          invoiceDetails={invoiceDetails}
          buyerDetails={buyerDetails}
          bankDetails={bankDetails}
          items={items}
          totals={totals}
          amountInWords={amountInWords}
          terms={terms}
        />
      </div>

    </div>
  );
};

export default MainBillingApp;

