import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ColumnDef {
  header: string;
  key: string;
}

export interface ExportDataParams<T = Record<string, unknown>> {
  title: string;
  filename: string;
  columns: ColumnDef[];
  data: T[];
}

export const exportToPDF = <T = Record<string, unknown>>({ title, filename, columns, data }: ExportDataParams<T>) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 30);

  const head = [columns.map(col => col.header)];
  const body = data.map(row => columns.map(col => (row as Record<string, unknown>)[col.key] ?? '-'));

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

export const exportToExcel = <T = Record<string, unknown>>({ filename, columns, data }: ExportDataParams<T>) => {
  const formattedData = data.map(row => {
    const newRow: Record<string, unknown> = {};
    columns.forEach(col => {
      newRow[col.header] = (row as Record<string, unknown>)[col.key];
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
