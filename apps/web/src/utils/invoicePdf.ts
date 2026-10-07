import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectInvoice } from '../types/project';

function numberToWordsId(amount: number): string {
  const words: string[] = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  const n = Math.floor(Math.abs(amount));

  if (n === 0) return 'Nol';
  if (n < 12) return words[n] ?? '';
  if (n < 20) return numberToWordsId(n - 10) + ' Belas';
  if (n < 100) return (numberToWordsId(Math.floor(n / 10)) + ' Puluh ' + (n % 10 !== 0 ? numberToWordsId(n % 10) : '')).trim();
  if (n < 200) return ('Seratus ' + (n - 100 !== 0 ? numberToWordsId(n - 100) : '')).trim();
  if (n < 1000) return (numberToWordsId(Math.floor(n / 100)) + ' Ratus ' + (n % 100 !== 0 ? numberToWordsId(n % 100) : '')).trim();
  if (n < 2000) return ('Seribu ' + (n - 1000 !== 0 ? numberToWordsId(n - 1000) : '')).trim();
  if (n < 1000000) return (numberToWordsId(Math.floor(n / 1000)) + ' Ribu ' + (n % 1000 !== 0 ? numberToWordsId(n % 1000) : '')).trim();
  if (n < 1000000000) return (numberToWordsId(Math.floor(n / 1000000)) + ' Juta ' + (n % 1000000 !== 0 ? numberToWordsId(n % 1000000) : '')).trim();
  if (n < 1000000000000) return (numberToWordsId(Math.floor(n / 1000000000)) + ' Miliar ' + (n % 1000000000 !== 0 ? numberToWordsId(n % 1000000000) : '')).trim();
  return (numberToWordsId(Math.floor(n / 1000000000000)) + ' Triliun ' + (n % 1000000000000 !== 0 ? numberToWordsId(n % 1000000000000) : '')).trim();
}

export function formatRupiah(val: number | undefined | null): string {
  if (val === undefined || val === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export interface BuildInvoicePdfOptions {
  action?: 'download' | 'print' | 'preview';
}

export function buildInvoicePdf(project: any, invoice: ProjectInvoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const isPaid = invoice.status === 'paid';

  // 1. HEADER & KOP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('PT ENTERPRISE MULTI DIVISI', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Divisi Konstruksi & Manajemen Proyek', margin, 29);
  doc.text('Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan | Telp: (021) 555-0192', margin, 34);

  // Garis pemisah kop
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.6);
  doc.line(margin, 38, pageWidth - margin, 38);

  // 2. JUDUL DOKUMEN & BADGE STATUS
  const docTitle = isPaid ? 'KUITANSI PELUNASAN TERMIN' : 'FAKTUR PENAGIHAN TERMIN';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(docTitle, margin, 48);

  // Status Box
  const statusLabel = isPaid ? 'LUNAS (PAID)' : (invoice.status?.toUpperCase() || 'DRAFT');
  const statusColor: [number, number, number] = isPaid ? [22, 101, 52] : [30, 64, 175]; // Green or Blue
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  const statusWidth = doc.getTextWidth(statusLabel) + 8;
  doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth - margin - statusWidth, 42, statusWidth, 7, 1.5, 1.5, 'D');
  doc.text(statusLabel, pageWidth - margin - statusWidth + 4, 46.8);

  // 3. META DOKUMEN (Kiri: Kepada, Kanan: No Faktur & Tanggal)
  const metaStartY = 56;

  // Kolom Kiri: Informasi Klien & Proyek
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('DITUJUKAN KEPADA:', margin, metaStartY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(project?.client_name || 'Klien Proyek', margin, metaStartY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Proyek: ${project?.name || '-'}`, margin, metaStartY + 10);
  if (project?.project_code) {
    doc.text(`Kode Proyek: ${project.project_code}`, margin, metaStartY + 15);
  }

  // Kolom Kanan: Detail No Faktur & Tanggal
  const rightColX = pageWidth - margin - 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  const invoiceNumber = invoice.invoice_number || `INV-PRJ-${invoice.project_id}-${invoice.id}`;
  const createdDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID') : '-';
  const paidDate = invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString('id-ID') : '-';

  doc.text('Nomor Faktur', rightColX, metaStartY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${invoiceNumber}`, rightColX + 24, metaStartY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tanggal Terbit', rightColX, metaStartY + 5);
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${createdDate}`, rightColX + 24, metaStartY + 5);

  doc.setTextColor(100, 116, 139);
  doc.text('Jatuh Tempo', rightColX, metaStartY + 10);
  doc.setTextColor(15, 23, 42);
  doc.text(`: ${dueDate}`, rightColX + 24, metaStartY + 10);

  if (isPaid) {
    doc.setTextColor(100, 116, 139);
    doc.text('Tgl. Bayar', rightColX, metaStartY + 15);
    doc.setTextColor(22, 101, 52);
    doc.setFont('helvetica', 'bold');
    doc.text(`: ${paidDate}`, rightColX + 24, metaStartY + 15);
  }

  // 4. TABEL RINCIAN TERMIN
  const tableStartY = metaStartY + 23;
  const milestone = project?.milestones?.find((m: any) => m.id === invoice.project_milestone_id);
  const milestoneLabel = milestone ? `${milestone.title} (${milestone.weight_percentage}%)` : '-';
  const amountNum = parseFloat(invoice.amount?.toString() || '0');

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [['No', 'Uraian Termin Penagihan', 'Milestone Terkait', 'Nominal']],
    body: [
      [
        '1',
        invoice.term_name + (invoice.notes ? `\nCatatan: ${invoice.notes}` : ''),
        milestoneLabel,
        formatRupiah(amountNum),
      ],
    ],
    foot: [
      ['', 'Total Penagihan', '', formatRupiah(amountNum)],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [51, 65, 85], // slate-700
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3.5,
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle',
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9.5,
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 90 },
      2: { cellWidth: 40 },
      3: { cellWidth: 32, halign: 'right' },
    },
    didDrawPage: () => {},
  });

  // Ambil posisi Y setelah tabel
  const finalY = (doc as any).lastAutoTable?.finalY || 130;

  // 5. TERBILANG BOX
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, finalY + 4, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Terbilang:', margin + 4, finalY + 9);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const words = `${numberToWordsId(amountNum)} Rupiah`;
  doc.text(words, margin + 20, finalY + 9, { maxWidth: contentWidth - 25 });

  // 6. INFORMASI PEMBAYARAN & REKENING
  const noteBoxY = finalY + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Ketentuan & Instruksi Pembayaran:', margin, noteBoxY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  if (isPaid) {
    doc.text(
      `Pembayaran telah lunas diterima pada tanggal ${paidDate}${invoice.payment_reference ? ` dengan referensi transaksi: ${invoice.payment_reference}` : ''}.`,
      margin,
      noteBoxY + 5
    );
  } else {
    doc.text('1. Pembayaran ditransfer ke Rekening Operasional Resmi:', margin, noteBoxY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('   Bank Mandiri: 123-00-9876543-2 a/n PT ENTERPRISE MULTI DIVISI', margin, noteBoxY + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('2. Harap mencantumkan nomor faktur pada berita transfer bank.', margin, noteBoxY + 14);
  }

  // 7. TANDA TANGAN DUA PIHAK
  const signY = noteBoxY + 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  // Kiri: Diterima Oleh (Klien)
  doc.text('Diterima Oleh,', margin + 10, signY);
  doc.text('Pemberi Kerja / Klien', margin + 10, signY + 4);
  doc.line(margin + 5, signY + 28, margin + 55, signY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(project?.client_name || '( .................................... )', margin + 10, signY + 33);

  // Kanan: Hormat Kami (Manajemen Proyek)
  const rightSignX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.text(`Jakarta, ${createdDate}`, rightSignX + 5, signY);
  doc.text('Project & Finance Division', rightSignX + 5, signY + 4);
  doc.line(rightSignX, signY + 28, rightSignX + 50, signY + 28);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signature', rightSignX + 5, signY + 33);

  // 8. FOOTER HALAMAN
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen ini dicetak otomatis dari Sistem Dashboard Divisi Terpadu pada ${new Date().toLocaleString('id-ID')}`,
    margin,
    285
  );

  return doc;
}

export function downloadInvoicePDF(project: any, invoice: ProjectInvoice): void {
  const doc = buildInvoicePdf(project, invoice);
  const invNum = (invoice.invoice_number || `INV-${invoice.id}`).replace(/[^A-Za-z0-9_-]/g, '_');
  doc.save(`Faktur_${invNum}.pdf`);
}

export function printInvoicePDF(project: any, invoice: ProjectInvoice): void {
  const doc = buildInvoicePdf(project, invoice);
  const invNum = (invoice.invoice_number || `INV-${invoice.id}`).replace(/[^A-Za-z0-9_-]/g, '_');
  try {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    if (blobUrl && typeof window !== 'undefined' && typeof window.open === 'function') {
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow && typeof (window as any).URL?.createObjectURL === 'function') {
        doc.save(`Faktur_${invNum}.pdf`);
      }
    }
  } catch {
    // Di lingkungan browser asli jika popup diblokir, simpan dokumen
    if (typeof window !== 'undefined' && typeof (window as any).URL?.createObjectURL === 'function') {
      doc.save(`Faktur_${invNum}.pdf`);
    }
  }
}
