import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  formatCurrencyIDR,
  generateCsvBlob,
  getExportDataset,
} from './exportUtils';
import { ExportReportModal } from './ExportReportModal';
import { ScheduledReportManager } from './ScheduledReportManager';
import { ReportArchiveTable } from './ReportArchiveTable';
import LaporanPage from '../../pages/LaporanPage';
import { AppLayout } from '../../layout/AppLayout';
import { AuthProvider } from '../../session/AuthContext';
import { ToastProvider } from '../ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement, { initialEntries = ['/laporan'] } = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {ui}
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Fase 5: Pengayaan Fitur Ekspor Data & Laporan Otomatis (ISSUE-23)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'mock_token');
    localStorage.setItem('dashboard-divisi.role-demo', 'DIRECTOR');
    vi.spyOn(window, 'print').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. Export Utilities Unit Tests
  // -------------------------------------------------------------
  describe('1. Utilitas Ekspor Data (exportUtils)', () => {
    it('formatCurrencyIDR memformat angka ke representasi mata uang Rupiah standar', () => {
      const formatted = formatCurrencyIDR(1482500000);
      expect(formatted).toContain('1.482.500.000');
    });

    it('generateCsvBlob menyisipkan BOM UTF-8 dan header metadata korporat resmi', () => {
      const headers = ['Kode', 'Nama', 'Nilai'];
      const rows = [['D01', 'Divisi Wrapping', 45000000]];
      const blob = generateCsvBlob(headers, rows, {
        title: 'Laporan Uji Coba',
        period: 'September 2026',
        division: 'Konsolidasi',
        generatedBy: 'Auditor IT',
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toContain('text/csv');
      expect(blob.size).toBeGreaterThan(50);
    });

    it('getExportDataset mengembalikan dataset terstruktur untuk 5 modul kunci', () => {
      const executive = getExportDataset('executive');
      expect(executive.headers).toContain('Metrik Finansial / KPI');
      expect(executive.rows.length).toBeGreaterThanOrEqual(4);

      const divisions = getExportDataset('divisions');
      expect(divisions.headers).toContain('Kode Divisi');
      expect(divisions.rows.length).toBe(7);

      const outstanding = getExportDataset('outstanding');
      expect(outstanding.headers).toContain('Interval Usia Penagihan');

      const cashflow = getExportDataset('cashflow');
      expect(cashflow.headers).toContain('Komponen Arus Kas');

      const reconciliation = getExportDataset('reconciliation');
      expect(reconciliation.headers).toContain('Nama Bank Mitra');
    });
  });

  // -------------------------------------------------------------
  // 2. ExportReportModal Tests
  // -------------------------------------------------------------
  describe('2. Universal Export Modal (ExportReportModal)', () => {
    it('merender modal dialog ketika isOpen=true dengan pilihan dataset dan format berkas', () => {
      const handleClose = vi.fn();
      render(
        <ExportReportModal
          isOpen={true}
          onClose={handleClose}
          initialDataset="executive"
        />,
      );

      expect(screen.getByRole('dialog', { name: /pusat ekspor data & laporan/i })).toBeInTheDocument();
      expect(screen.getAllByText('Ringkasan Eksekutif & KPI Konsolidasi').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Rekapitulasi Kinerja 7 Divisi Ritel')).toBeInTheDocument();
      expect(screen.getByTestId('format-option-csv')).toBeInTheDocument();
      expect(screen.getByTestId('format-option-print')).toBeInTheDocument();
      expect(screen.getByTestId('format-option-json')).toBeInTheDocument();
    });

    it('tidak merender apa pun saat isOpen=false', () => {
      render(
        <ExportReportModal
          isOpen={false}
          onClose={vi.fn()}
        />,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('memungkinkan pemilihan dataset dan format berkas unduhan', () => {
      render(
        <ExportReportModal
          isOpen={true}
          onClose={vi.fn()}
        />,
      );

      // Pilih dataset divisions
      const divOption = screen.getByTestId('dataset-option-divisions');
      fireEvent.click(divOption);
      expect(divOption).toHaveAttribute('aria-checked', 'true');

      // Pilih format JSON
      const jsonOption = screen.getByTestId('format-option-json');
      fireEvent.click(jsonOption);
      expect(jsonOption).toHaveClass('border-purple-500');
    });

    it('menjalankan proses kompilasi berkas dan memicu download nyata di browser', async () => {
      render(
        <ExportReportModal
          isOpen={true}
          onClose={vi.fn()}
          initialDataset="executive"
          initialFormat="csv"
        />,
      );

      const submitBtn = screen.getByTestId('export-submit-btn');
      fireEvent.click(submitBtn);

      // Pastikan ada progress bar selama generasi
      expect(screen.getByTestId('export-progress')).toBeInTheDocument();

      // Tunggu hingga kompilasi selesai
      await waitFor(
        () => {
          expect(screen.getByTestId('export-success-banner')).toBeInTheDocument();
        },
        { timeout: 1500 },
      );

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(screen.getByText(/Berkas Berhasil Dibuat!/i)).toBeInTheDocument();
    });

    it('memicu window.print() saat format Cetak PDF dipilih', async () => {
      render(
        <ExportReportModal
          isOpen={true}
          onClose={vi.fn()}
          initialDataset="cashflow"
          initialFormat="print"
        />,
      );

      const submitBtn = screen.getByTestId('export-submit-btn');
      fireEvent.click(submitBtn);

      await waitFor(
        () => {
          expect(screen.getByTestId('export-success-banner')).toBeInTheDocument();
        },
        { timeout: 1500 },
      );

      expect(window.print).toHaveBeenCalled();
    });

    it('dapat ditutup menggunakan tombol X, tombol batal, atau tombol Escape', () => {
      const handleClose = vi.fn();
      render(
        <ExportReportModal
          isOpen={true}
          onClose={handleClose}
        />,
      );

      const closeBtn = screen.getByTestId('export-modal-close-btn');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const cancelBtn = screen.getByTestId('export-cancel-btn');
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(2);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(3);
    });
  });

  // -------------------------------------------------------------
  // 3. ScheduledReportManager Tests
  // -------------------------------------------------------------
  describe('3. Pusat Laporan Terjadwal (ScheduledReportManager)', () => {
    it('merender daftar jadwal distribusi laporan dengan frekuensi, waktu, dan kanal pengiriman', () => {
      render(<ScheduledReportManager />);

      expect(screen.getByTestId('scheduled-report-manager')).toBeInTheDocument();
      expect(screen.getByText('Flash Report Penutupan Omzet Harian')).toBeInTheDocument();
      expect(screen.getByText('Rekapitulasi Aging Tagihan Piutang Mingguan')).toBeInTheDocument();
      expect(screen.getByText('Laporan Konsolidasi Finansial & P&L Bulanan')).toBeInTheDocument();
      expect(screen.getByText('Hasil Pencocokan Rekonsiliasi 31 Bank')).toBeInTheDocument();
    });

    it('dapat mengaktifkan dan menjeda jadwal pengiriman via tombol power toggle', () => {
      render(<ScheduledReportManager />);

      const toggleBtn = screen.getByTestId('toggle-schedule-sch-daily-flash');
      const statusPill = screen.getByTestId('schedule-status-sch-daily-flash');

      expect(statusPill).toHaveTextContent('Aktif Terjadwal');

      // Jeda
      fireEvent.click(toggleBtn);
      expect(statusPill).toHaveTextContent('Dijeda');

      // Aktifkan kembali
      fireEvent.click(toggleBtn);
      expect(statusPill).toHaveTextContent('Aktif Terjadwal');
    });

    it('memicu pengiriman manual "Kirim Sekarang" dengan spinner dan notifikasi sukses', async () => {
      const handleManualTrigger = vi.fn();
      render(<ScheduledReportManager onManualTrigger={handleManualTrigger} />);

      const sendNowBtn = screen.getByTestId('send-now-sch-daily-flash');
      fireEvent.click(sendNowBtn);

      // Loading state
      expect(screen.getByText(/Mengirim.../i)).toBeInTheDocument();

      // Sukses
      await waitFor(
        () => {
          expect(screen.getByTestId('schedule-success-toast')).toBeInTheDocument();
        },
        { timeout: 1500 },
      );

      expect(handleManualTrigger).toHaveBeenCalledWith('sch-daily-flash');
      expect(screen.getByText(/berhasil dikirimkan ke/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------
  // 4. ReportArchiveTable Tests
  // -------------------------------------------------------------
  describe('4. Arsip Laporan & Audit Unduhan (ReportArchiveTable)', () => {
    it('merender riwayat dokumen laporan dengan nama, periode, format, dan stempel waktu', () => {
      render(<ReportArchiveTable />);

      expect(screen.getByTestId('report-archive-table')).toBeInTheDocument();
      expect(screen.getByText('Executive_Summary_MTD_Sep2026.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Rekapitulasi_Aging_Piutang_Minggu_36.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Laporan_Rekonsiliasi_31_Rekening_Bank.xlsx')).toBeInTheDocument();
    });

    it('memfilter dokumen pada tabel secara dinamis berdasarkan input pencarian', () => {
      render(<ReportArchiveTable />);

      const searchInput = screen.getByTestId('archive-search-input');
      fireEvent.change(searchInput, { target: { value: 'Rekonsiliasi' } });

      expect(screen.getByText('Laporan_Rekonsiliasi_31_Rekening_Bank.xlsx')).toBeInTheDocument();
      expect(screen.queryByText('Executive_Summary_MTD_Sep2026.xlsx')).not.toBeInTheDocument();
    });

    it('memicu unduhan ulang nyata saat tombol "Unduh Ulang" diklik', async () => {
      render(<ReportArchiveTable />);

      const redownloadBtn = screen.getByTestId('redownload-btn-arc-001');
      fireEvent.click(redownloadBtn);

      await waitFor(
        () => {
          expect(global.URL.createObjectURL).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });
  });

  // -------------------------------------------------------------
  // 5. Integrasi End-to-End di LaporanPage & AppLayout
  // -------------------------------------------------------------
  describe('5. Integrasi LaporanPage & AppLayout dengan Ekspor', () => {
    it('pada LaporanPage, tombol header "Download Laporan (.PDF)" membuka modal ekspor', () => {
      renderWithProviders(<LaporanPage />);

      const downloadHeaderBtn = screen.getByTestId('header-download-pdf-btn');
      fireEvent.click(downloadHeaderBtn);

      expect(screen.getByRole('dialog', { name: /pusat ekspor data & laporan/i })).toBeInTheDocument();
    });

    it('pada LaporanPage Tab 4 (Export), merender ScheduledReportManager dan ReportArchiveTable', () => {
      renderWithProviders(<LaporanPage />);

      // Pindah ke tab export
      const exportTabBtn = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportTabBtn);

      expect(screen.getByTestId('scheduled-report-manager')).toBeInTheDocument();
      expect(screen.getByTestId('report-archive-table-container')).toBeInTheDocument();

      // Tombol buka modal ekspor di tab
      const openModalBtn = screen.getByTestId('tab-export-excel-btn');
      fireEvent.click(openModalBtn);
      expect(screen.getByRole('dialog', { name: /pusat ekspor data & laporan/i })).toBeInTheDocument();
    });

    it('pada AppLayout, tombol "Ekspor" di Sticky Filter Bar membuka ExportReportModal', () => {
      renderWithProviders(<AppLayout />, { initialEntries: ['/dashboard'] });

      const stickyExportBtn = screen.getByTestId('sticky-filter-open-export');
      expect(stickyExportBtn).toBeInTheDocument();

      fireEvent.click(stickyExportBtn);
      expect(screen.getByRole('dialog', { name: /pusat ekspor data & laporan/i })).toBeInTheDocument();
    });
  });
});
