import React from 'react';

// Card ka design wahi same rakha hai
const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

export default function Reports({ data, onOpenBill }) {
  // 🔥 CRASH PREVENTION: Agar data.bills nahi hai toh khali array le lo
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Financial Reports & Bill History</h1>
      
      {/* TOP SECTION: Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-teal-500">
          <h3 className="text-slate-400 text-sm">Total Revenue</h3>
          <div className="text-3xl font-bold text-white mt-2">₹{totalSales.toFixed(2)}</div>
        </Card>
        <Card className="border-t-4 border-t-blue-500">
          <h3 className="text-slate-400 text-sm">Total Invoices Generated</h3>
          <div className="text-3xl font-bold text-white mt-2">{billsArray.length}</div>
        </Card>
      </div>

      {/* BOTTOM SECTION: Invoice List */}
      <Card className="p-0 overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h3 className="text-lg font-bold text-white">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Invoice No.</th>
                <th className="p-4">Party Name</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedBills.length > 0 ? (
                sortedBills.map((bill, i) => {
                  // Safe Date Parsing
                  let dateObj = new Date();
                  if (bill.createdAt?.seconds) {
                    dateObj = new Date(bill.createdAt.seconds * 1000);
                  } else if (typeof bill.createdAt === 'number') {
                    dateObj = new Date(bill.createdAt);
                  }
                  
                  const dateStr = dateObj.toLocaleDateString('en-IN');
                  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  
                  const amount = bill.totals?.grandTotal || bill.total || 0;
                  const partyName = bill.buyerDetails?.name || bill.customerName || 'Unknown Party';
                  const invNo = bill.invoiceDetails?.invoiceNumber || `INV-${i+1}`;

                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800 transition-colors">
                      <td className="p-4 text-slate-300">
                        <div className="font-medium">{dateStr}</div>
                        <div className="text-xs text-slate-500">{timeStr}</div>
                      </td>
                      <td className="p-4 text-teal-400 font-medium">{invNo}</td>
                      <td className="p-4 text-white uppercase">{partyName}</td>
                      <td className="p-4 font-bold text-green-400">₹{Number(amount).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        {/* 🔥 FULLY SAFE BUTTON */}
                        <button 
                          onClick={() => {
                            if(onOpenBill) {
                              onOpenBill(bill);
                            } else {
                              console.warn("onOpenBill function is not passed to Reports component");
                            }
                          }}
                          className="text-blue-400 hover:text-white text-xs bg-blue-500/10 hover:bg-blue-500/30 px-3 py-1.5 rounded-md border border-blue-500/20 transition-all cursor-pointer"
                        >
                          Open Bill
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-500">
                    No invoices generated yet.
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
