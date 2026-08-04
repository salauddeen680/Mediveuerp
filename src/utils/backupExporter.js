import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Yeh function data ko Excel (CSV) format mein convert karta hai
const convertToCSV = (objArray) => {
  if (!objArray || objArray.length === 0) return '';
  const header = Object.keys(objArray[0]).join(',');
  const rows = objArray.map(obj => 
    Object.values(obj).map(val => {
      // Agar value mein comma hai, toh usko double quotes mein wrap karo
      const strVal = String(val);
      return strVal.includes(',') ? `"${strVal}"` : strVal;
    }).join(',')
  ).join('\n');
  return `${header}\n${rows}`;
};

export const generateZipBackup = async (data, storeName) => {
  const zip = new JSZip();

  // 1. Medicines ko Excel (CSV) file banayenge
  if (data.medicines && data.medicines.length > 0) {
    const medCSV = convertToCSV(data.medicines);
    zip.file("Medicines_Inventory.csv", medCSV);
  }

  // 2. Customers ko Excel (CSV) file banayenge
  if (data.customers && data.customers.length > 0) {
    const custCSV = convertToCSV(data.customers);
    zip.file("Customers_List.csv", custCSV);
  }

  // 3. Bills aur Settings ko JSON hi rakhna safe hai kyunki unka structure complex hota hai
  zip.file("All_Invoices.json", JSON.stringify(data.bills, null, 2));
  zip.file("Store_Settings.json", JSON.stringify(data.settings, null, 2));

  // 4. Ek chhota sa text file (ReadMe) daalenge
  const readmeText = `MEDIVEU ERP BACKUP\nStore Name: ${storeName}\nDate: ${new Date().toLocaleString()}\n\nNote: Medicines and Customers are in Excel (.csv) format. Bills are safely stored in JSON format for complete data integrity.`;
  zip.file("README.txt", readmeText);

  // ZIP generate karke download karwayenge
  const content = await zip.generateAsync({ type: "blob" });
  const fileName = `Mediveu_Backup_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(content, fileName);
};

