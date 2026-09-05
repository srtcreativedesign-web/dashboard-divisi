/**
 * Utilitas Ekspor Data Korporat untuk FINAL DASHBOARD
 * Mendukung pembentukan CSV ber-BOM UTF-8, format angka IDR, JSON, dan Print.
 */
import { ACCOUNTING_EXCEL_DATA } from '../../data/accountingExcelData';

export interface ExportMetadata {
  title: string;
  period?: string;
  division?: string;
  generatedBy?: string;
  generatedAt?: string;
}

export interface DatasetExportResult {
  title: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string | number }[];
}

export function formatCurrencyIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumberID(val: number): string {
  return new Intl.NumberFormat('id-ID').format(val);
}

/**
 * Membentuk Blob CSV lengkap dengan UTF-8 BOM (\uFEFF) agar Microsoft Excel
 * membaca karakter dan pemisah kolom secara sempurna tanpa teks rusak.
 */
export function generateCsvBlob(
  headers: string[],
  rows: (string | number)[][],
  meta?: ExportMetadata,
): Blob {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push('\uFEFF');

  // Header Korporat
  if (meta?.title) {
    lines.push(`"FINAL DASHBOARD - ${meta.title.replace(/"/g, '""')}"\r\n`);
    if (meta.period) lines.push(`"Periode Data:","${meta.period.replace(/"/g, '""')}"\r\n`);
    if (meta.division) lines.push(`"Divisi:","${meta.division.replace(/"/g, '""')}"\r\n`);
    lines.push(`"Tanggal Unduh:","${meta.generatedAt || new Date().toLocaleString('id-ID')}"\r\n`);
    lines.push(`"Dibuat Oleh:","${meta.generatedBy || 'Sistem Final Dashboard'}"\r\n`);
    lines.push('\r\n');
  }

  // Header Kolom
  const headerLine = headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',');
  lines.push(headerLine + '\r\n');

  // Data Baris
  for (const row of rows) {
    const line = row
      .map((cell) => {
        if (cell === null || cell === undefined) return '""';
        const str = String(cell).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
    lines.push(line + '\r\n');
  }

  const csvContent = lines.join('');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Memicu unduhan berkas langsung di peramban pengguna
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 150);
}

/**
 * Menyediakan dataset siap ekspor untuk 5 domain modul utama
 */
export function getExportDataset(
  datasetId: 'executive' | 'divisions' | 'outstanding' | 'cashflow' | 'reconciliation',
  options?: { periodLabel?: string; divisionLabel?: string; formattedCurrency?: boolean },
): DatasetExportResult {
  const useCurrency = options?.formattedCurrency ?? true;
  const curr = (v: number) => (useCurrency ? formatCurrencyIDR(v) : v);

  switch (datasetId) {
    case 'executive':
      return {
        title: 'Ringkasan Eksekutif Konsolidasi Performa',
        filename: `Executive_Summary_${Date.now()}.csv`,
        headers: ['Metrik Finansial / KPI', 'Realisasi MTD', 'Target Periode', 'Persentase (%)', 'Status'],
        rows: [
          ['Total Omzet Penjualan Konsolidasi', curr(1482500000), curr(1300000000), '114.0%', 'Over Target'],
          ['Gross Profit Margin', curr(482500000), curr(400000000), '120.6%', 'Sangat Sehat'],
          ['Total Beban Operasional', curr(124000000), curr(150000000), '82.7%', 'Efisiensi Tercapai'],
          ['Saldo Kas Bersih Operasional', curr(358500000), curr(250000000), '143.4%', 'Surplus'],
          ['Kesesuaian Rekonsiliasi Bank', '31 Rekening Klop', '31 Rekening', '100.0%', 'Cocok Sempurna'],
        ],
      };

    case 'divisions':
      return {
        title: 'Rekapitulasi Kinerja 7 Divisi Ritel',
        filename: `Division_Performance_${Date.now()}.csv`,
        headers: ['Kode Divisi', 'Nama Divisi', 'Omzet Harian', 'Omzet MTD', 'Target Bulanan', 'Pencapaian (%)', 'Peringkat'],
        rows: [
          ['WRAP', 'Wrapping Bandara', curr(162931986), curr(ACCOUNTING_EXCEL_DATA.cashflow.totalRevenue), curr(5000000000), '101.0%', '#1'],
          ['CELL', 'Cellular & Gadget', curr(45000000), curr(1250000000), curr(1200000000), '104.2%', '#2'],
          ['MINI', 'Minimarket & Retail', curr(65000000), curr(1950000000), curr(2000000000), '97.5%', '#3'],
          ['FNB', 'Food & Beverage', curr(52000000), curr(1560000000), curr(1600000000), '97.5%', '#4'],
          ['REFL', 'Refleksi & Relaksasi', curr(28000000), curr(850000000), curr(900000000), '94.4%', '#5'],
          ['MC', 'Money Changer & Forex', curr(75000000), curr(2250000000), curr(2200000000), '102.3%', '#1'],
          ['ACC', 'Accounting & Finance', curr(0), curr(0), curr(0), '100.0%', '#6'],
        ],
      };

    case 'outstanding':
      return {
        title: 'Distribusi Aging Bucket Tagihan Piutang (AR)',
        filename: `Aging_Outstanding_AR_${Date.now()}.csv`,
        headers: ['Interval Usia Penagihan', 'Jumlah Faktur', 'Total Nominal (Rp)', 'Proporsi Portofolio (%)', 'Tingkat Risiko'],
        rows: [
          ['Current (0 - 30 Hari)', '48 Faktur', curr(642000000), '58.4%', 'Rendah (Lancar)'],
          ['31 - 60 Hari', '18 Faktur', curr(248000000), '22.5%', 'Sedang (Perlu Follow-up)'],
          ['61 - 90 Hari', '7 Faktur', curr(142000000), '12.9%', 'Tinggi (Peringatan Tertulis)'],
          ['> 90 Hari (Kritis)', '3 Faktur', curr(68000000), '6.2%', 'Kritis (Eskalasi Hukum)'],
        ],
      };

    case 'cashflow':
      return {
        title: 'Laporan Arus Kas Konsolidasi (Waterfall Bridge)',
        filename: `Cashflow_Waterfall_${Date.now()}.csv`,
        headers: ['Komponen Arus Kas', 'Jenis Aliran', 'Nominal (Rp)', 'Kategori', 'Keterangan'],
        rows: [
          ['Saldo Kas Awal Periode', 'Saldo Awal', curr(ACCOUNTING_EXCEL_DATA.cashflow.initialBalance), 'Kas & Bank', 'Posisi kas awal per Excel'],
          ['Penerimaan Omset Wrapping', 'Kas Masuk (+)', curr(ACCOUNTING_EXCEL_DATA.cashflow.totalRevenue), 'Operasional', 'Total omset lembar Excel Wrapping'],
          ['Beban Sewa Angkasa Pura', 'Kas Keluar (-)', curr(-1720636274), 'Beban Sewa', 'Sewa lokasi & gate AP'],
          ['Beban Gaji Karyawan Lapangan', 'Kas Keluar (-)', curr(-521906036), 'Operasional', 'Payroll 58 outlet bandara'],
          ['Beban Backoffice & Manajemen HO', 'Kas Keluar (-)', curr(-ACCOUNTING_EXCEL_DATA.cashflow.totalBackoffice), 'HO', 'Beban manajemen head office'],
          ['Beban KSO & Leasing Mesin', 'Kas Keluar (-)', curr(-114036954), 'Kemitraan', 'KSO Halim & angsuran leasing'],
          ['Saldo Kas Akhir Periode', 'Saldo Akhir', curr(ACCOUNTING_EXCEL_DATA.cashflow.totalEndingBalance), 'Net Cash', 'Saldo kas akhir klop Excel'],
        ],
      };

    case 'reconciliation':
      return {
        title: 'Hasil Audit Rekonsiliasi 31 Rekening Bank',
        filename: `Bank_Reconciliation_31Accounts_${Date.now()}.csv`,
        headers: ['Nama Bank Mitra', 'Nomor Rekening', 'Saldo Buku Besar', 'Saldo Rekening Koran', 'Selisih Audit', 'Status'],
        rows: [
          ['Bank Mandiri STARWRAPP T2D', '155-00-1241716-1', curr(2505042), curr(2505042), curr(0), 'Klop (100%)'],
          ['BCA STARWRAPP T2D', '551-0490071', curr(1000000), curr(1000000), curr(0), 'Klop (100%)'],
          ['Bank Mandiri GALAXYPORT T2E', '155-00-1243142-8', curr(23824835), curr(23824835), curr(0), 'Klop (100%)'],
          ['Bank Mandiri ROBUSTPACK T2F', '155-00-1268016-4', curr(49961293), curr(49961293), curr(0), 'Klop (100%)'],
          ['Total 31 Rekening Koran Bank', 'Konsolidasi 31 Akun', curr(ACCOUNTING_EXCEL_DATA.totalBankAug), curr(ACCOUNTING_EXCEL_DATA.totalBankAug), curr(0), 'Klop (100%)'],
        ],
      };
  }
}
