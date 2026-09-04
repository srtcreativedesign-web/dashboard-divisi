/**
 * Utilitas Ekspor Data Korporat untuk FINAL DASHBOARD
 * Mendukung pembentukan CSV ber-BOM UTF-8, format angka IDR, JSON, dan Print.
 */

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
          ['WRAP', 'Wrapping Bandara', curr(45000000), curr(262500000), curr(1200000000), '21.9%', '#2'],
          ['CELL', 'Cellular & Gadget', curr(55000000), curr(310000000), curr(1500000000), '20.7%', '#3'],
          ['MINI', 'Minimarket & Retail', curr(89000000), curr(540000000), curr(2000000000), '27.0%', '#1 (Juara)'],
          ['FNB', 'Food & Beverage', curr(78000000), curr(420000000), curr(1800000000), '23.3%', '#2'],
          ['REFL', 'Refleksi & Relaksasi', curr(18000000), curr(110000000), curr(600000000), '18.3%', '#4'],
          ['MC', 'Money Changer & Forex', curr(95000000), curr(620000000), curr(2200000000), '28.2%', '#1'],
          ['FIN', 'Finance & Treasury', curr(32000000), curr(195000000), curr(800000000), '24.4%', '#3'],
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
          ['Saldo Kas Awal Periode', 'Saldo Awal', curr(850000000), 'Kas & Bank', 'Posisi per 1 September 2026'],
          ['Penerimaan Penjualan Kasir', 'Kas Masuk (+)', curr(1482500000), 'Operasional', 'Setoran harian 7 divisi ritel'],
          ['Penerimaan Piutang Tenant', 'Kas Masuk (+)', curr(240000000), 'Operasional', 'Pelunasan invoice jatuh tempo'],
          ['Pembayaran Beban Pokok & Suplier', 'Kas Keluar (-)', curr(-620000000), 'HPP', 'Pengadaan stok dan logistik ritel'],
          ['Beban Gaji & Upah Karyawan', 'Kas Keluar (-)', curr(-315000000), 'Operasional', 'Payroll 142 staf dan teknisi'],
          ['Beban Sewa & Utilisasi Bandara', 'Kas Keluar (-)', curr(-185000000), 'Fasilitas', 'Biaya tenant & listrik bandara'],
          ['Saldo Kas Akhir Periode', 'Saldo Akhir', curr(1452500000), 'Net Cash', 'Kenaikan kas neto +Rp 602.500.000'],
        ],
      };

    case 'reconciliation':
      return {
        title: 'Hasil Audit Rekonsiliasi 31 Rekening Bank',
        filename: `Bank_Reconciliation_31Accounts_${Date.now()}.csv`,
        headers: ['Nama Bank Mitra', 'Nomor Rekening', 'Saldo Buku Besar', 'Saldo Rekening Koran', 'Selisih Audit', 'Status'],
        rows: [
          ['Bank Mandiri Operasional', '137-00-1928371-1', curr(482500000), curr(482500000), curr(0), 'Klop (100%)'],
          ['BCA Giro Penjualan Ritel', '521-098273-0', curr(395000000), curr(395000000), curr(0), 'Klop (100%)'],
          ['BNI Valas Money Changer', '019-283746-2', curr(215000000), curr(215000000), curr(0), 'Klop (100%)'],
          ['BRI Setoran Kasir Wrapping', '028-192837-5', curr(178000000), curr(178000000), curr(0), 'Klop (100%)'],
          ['Bank Syariah Indonesia (BSI)', '712-983741-9', curr(182000000), curr(182000000), curr(0), 'Klop (100%)'],
        ],
      };
  }
}
