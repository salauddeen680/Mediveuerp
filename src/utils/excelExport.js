// 🔥 GST & INVOICE EXCEL EXPORTER UTILITY 🔥

export const exportToCSV = (data, filename = 'GST_Report.csv') => {
  if (!data || !data.length) {
    alert("Export karne ke liye koi data nahi hai!");
    return;
  }

  // CSV Headers
  const headers = Object.keys(data[0]);
  
  // CSV Rows creation with proper escaping
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  
  // Auto Download Trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// GSTR-1 Sales Report Formatter
export const exportGSTR1 = (bills) => {
  const formattedData = bills.map((bill, index) => ({
    'Sr No': index + 1,
    'Invoice No': bill.invoiceDetails?.invoiceNumber || 'N/A',
    'Invoice Date': bill.invoiceDetails?.invoiceDate || 'N/A',
    'Customer Name': bill.buyerDetails?.name || 'N/A',
    'Customer GSTIN': bill.buyerDetails?.gstin || 'Unregistered',
    'State Code': bill.invoiceDetails?.stateCode || '07-DELHI',
    'Taxable Value (Rs)': (bill.totals?.taxableValue || 0).toFixed(2),
    'CGST (Rs)': (bill.totals?.cgst || 0).toFixed(2),
    'SGST (Rs)': (bill.totals?.sgst || 0).toFixed(2),
    'Total Tax (Rs)': ((bill.totals?.cgst || 0) + (bill.totals?.sgst || 0)).toFixed(2),
    'Grand Total (Rs)': (bill.totals?.grandTotal || 0).toFixed(2)
  }));

  exportToCSV(formattedData, `GSTR1_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
};

