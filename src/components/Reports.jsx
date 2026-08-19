import React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
// 🔥 YAHAN EXPORT ENGINE KO LINK KIYA HAI 🔥
import { exportGSTR1, exportToCSV } from '../utils/excelExport';

// Card ka design wahi same rakha hai
const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export default function Reports({ data, onOpenBill }) {
  // CRASH PREVENTION: Agar data.bills nahi hai toh khali array le lo
  const billsArray = data?.bills || [];

  // Total Revenue Calculation (Safe way)
  const totalSales = billsArray.reduce((sum, b) => {
    const amount = b?.totals?.grandTotal || b?.total || 0;
    return sum + Number(amount);
  }, 0);

  // Naye bills sabse upar dikhane ke liye Sorting (Safe date reading)
  const sortedBills = [...billsArray].sort((a, b) => {
    const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
    const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
    return timeB - timeA;
  });

  // 🔥 CUSTOM SALES REPORT EXPORTER 🔥
  const handleDownloadBasicSales = () => {
    const formattedData = sortedBills.map((bill, i) => {
      let dateObj = new Date();
      if (bill.createdAt?.seconds) dateObj = new Date(bill.createdAt.seconds * 1000);
      else if (typeof bill.createdAt === 'number') dateObj = new Date(bill.createdAt);

      return {
        'S.No': i + 1,
        'Date': dateObj.toLocaleDateString('en-IN'),
        'Invoice Number': bill.invoiceDetails?.invoiceNumber || `INV-${i+1}`,
        'Customer Name': bill.buyerDetails?.name || 'Unknown',
        'Customer GST': bill.buyerDetails?.gstin || 'N/A',
        'Taxable Amount': (bill.totals?.taxableValue || 0).toFixed(2),
        'Total GST': ((bill.totals?.cgst || 0) + (bill.totals?.sgst || 0)).toFixed(2),
        'Grand Total': (bill.totals?.grandTotal || 0).toFixed(2)
      };
    });

    exportToCSV(formattedData, `Basic_Sales_Report_${new Date().toLocaleDateString('en-IN')}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* HEADER SECTION WITH ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-white">Financial Reports</h1>
          <p className="text-slate-400 text-sm mt-1 font-semibold">Track your revenue and generate GST reports</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleDownloadBasicSales}
            className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md"
          >
            <FileSpreadsheet size={18} className="mr-2" /> Sales Report
          </button>
          <button 
            onClick={() => exportGSTR1(sortedBills)}
            className="flex-1 md:flex-none flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-md"
          >
            <Download size={18} className="mr-2" /> GST (GSTR-1) Report
          </button>
        </div>
      </div>
      
      {/* TOP SECTION: Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-emerald-500 bg-emerald-500/5">
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Revenue</h3>
          <div className="text-4xl font-black text-emerald-400 mt-2">₹{totalSales.toFixed(2)}</div>
        </Card>
        <Card className="border-t-4 border-t-blue-500 bg-blue-500/5">
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Invoices Generated</h3>
          <div className="text-4xl font-black text-blue-400 mt-2">{billsArray.length}</div>
        </Card>
      </div>

      {/* BOTTOM SECTION: Invoice List */}
      <Card className="p-0 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h3 className="text-lg font-bold text-white flex items-center">
            <FileSpreadsheet className="mr-2 text-blue-400" size={20}/> Recent Invoices History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Invoice No.</th>
                <th className="p-4 font-bold">Party Name</th>
                <th className="p-4 font-bold">Total Amount</th>
                <th className="p-4 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedBills.length > 0 ? (
                sortedBills.map((bill, i) => {
                  let dateObj = new Date();
                  if (bill.createdAt?.seconds) {
                    dateObj = new Date(bill.createdAt.seconds * 1000);
                  } else if (typeof bill.createdAt === 'number') {
                    dateObj = new Date(bill.createdAt);
                  }
                  
                  const dateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  
                  const amount = bill.totals?.grandTotal || bill.total || 0;
                  const partyName = bill.buyerDetails?.name || bill.customerName || 'Unknown Party';
                  const invNo = bill.invoiceDetails?.invoiceNumber || `INV-${i+1}`;

                  return (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-slate-300">
                        <div className="font-bold">{dateStr}</div>
                        <div className="text-[11px] font-semibold text-slate-500">{timeStr}</div>
                      </td>
                      <td className="p-4 text-blue-400 font-bold">{invNo}</td>
                      <td className="p-4 text-white font-bold uppercase">{partyName}</td>
                      <td className="p-4 font-black text-emerald-400">₹{Number(amount).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => {
                            if(onOpenBill) {
                              onOpenBill(bill);
                            } else {
                              console.warn("onOpenBill function is not passed to Reports component");
                            }
                          }}
                          className="text-blue-400 hover:text-white font-bold text-xs bg-blue-500/10 hover:bg-blue-600 px-4 py-2 rounded-md border border-blue-500/20 transition-all cursor-pointer shadow-sm"
                        >
                          Open / Edit Bill
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-500 font-bold">
                    No invoices generated yet. Generate a bill from the POS section.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
