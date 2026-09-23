import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ColumnDef {
  header: string;
  key: string;
}

export interface ExportDataParams {
  title: string;
  filename: string;
  columns: ColumnDef[];
  data: any[];
}

export const exportToPDF = ({ title, filename, columns, data }: ExportDataParams) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 30);

  const head = [columns.map(col => col.header)];
  const body = data.map(row => columns.map(col => row[col.key] ?? '-'));

  autoTable(doc, {
    startY: 36,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233] }, // primary-500
    styles: { font: 'helvetica', fontSize: 10 },
  });

  doc.save(`${filename}.pdf`);
};

export const exportToExcel = ({ filename, columns, data }: ExportDataParams) => {
  const formattedData = data.map(row => {
    const newRow: any = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.key];
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
