import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Yeh function data ko clean Excel (CSV) format mein convert karta hai
const convertToCSV = (objArray) => {
  if (!objArray || objArray.length === 0) return '';
  const header = Object.keys(objArray[0]).join(',');
  const rows = objArray.map(obj => 
    Object.values(obj).map(val => {
      // Data ko safe rakhne ke liye double quotes lagana
      const strVal = String(val || '').replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',')
  ).join('\n');
  return `${header}\n${rows}`;
};

export const generateZipBackup = async (data, storeName) => {
  const zip = new JSZip();

  // 1. Medicines (Excel)
  if (data.medicines && data.medicines.length > 0) {
    zip.file("Medicines_Inventory.csv", convertToCSV(data.medicines));
  } else {
    zip.file("Medicines_Inventory.txt", "No medicines data found.");
  }

  // 2. Customers (Excel)
  if (data.customers && data.customers.length > 0) {
    zip.file("Customers_List.csv", convertToCSV(data.customers));
  } else {
    zip.file("Customers_List.txt", "No customers data found.");
  }

  // 3. BILLS FIX (JSON se hata kar Excel mein convert kiya)
  if (data.bills && data.bills.length > 0) {
    const formattedBills = data.bills.map((bill, index) => ({
      'S.No': index + 1,
      'Date': bill.invoiceDetails?.invoiceDate || 'N/A',
      'Invoice No': bill.invoiceDetails?.invoiceNumber || 'N/A',
      'Customer Name': bill.buyerDetails?.name || 'Unknown',
      'Customer Phone': bill.buyerDetails?.phone || 'N/A',
      'Taxable Amount (Rs)': (bill.totals?.taxableValue || 0).toFixed(2),
      'Total GST (Rs)': ((bill.totals?.cgst || 0) + (bill.totals?.sgst || 0)).toFixed(2),
      'Grand Total (Rs)': (bill.totals?.grandTotal || 0).toFixed(2)
    }));
    zip.file("All_Invoices_Report.csv", convertToCSV(formattedBills));
  } else {
    zip.file("All_Invoices_Report.txt", "No bills generated yet.");
  }

  // 4. SETTINGS FIX (JSON se hata kar simple padhne wali Text file banayi)
  let settingsText = "=== STORE SETTINGS & INFO ===\n\n";
  const s = data.settings?.general || {};
  settingsText += `Store Name : ${s.storeName || 'N/A'}\n`;
  settingsText += `Phone      : ${s.phone || 'N/A'}\n`;
  settingsText += `Address    : ${s.address || 'N/A'}\n`;
  settingsText += `GSTIN      : ${s.gstin || 'N/A'}\n`;
  settingsText += `DL Number  : ${s.dlNumber || 'N/A'}\n`;
  
  zip.file("Store_Settings.txt", settingsText);

  // 5. ReadMe Instruction
  const readmeText = `MEDIVEU ERP BACKUP\nStore Name: ${storeName}\nDate: ${new Date().toLocaleString()}\n\nINFO: \nSaari (.csv) files ko open karne ke liye apne phone mein Microsoft Excel ya Google Sheets ka use karein. Isme aapko koi code nahi dikhega, sab table format mein clean dikhega.`;
  zip.file("README.txt", readmeText);

  // ZIP generate karke download karwayenge
  const content = await zip.generateAsync({ type: "blob" });
  const fileName = `Mediveu_Backup_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(content, fileName);
};
