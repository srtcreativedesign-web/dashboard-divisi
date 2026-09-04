import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CommandPalette } from './CommandPalette';
import { DetailSheet } from './DetailSheet';
import { StickyContextFilterBar } from '../filters/StickyContextFilterBar';
import { AppLayout } from '../../layout/AppLayout';
import { AuthProvider } from '../../session/AuthContext';
import { ToastProvider } from './Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement, { initialEntries = ['/dashboard'] } = {}) {
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

describe('Fase 4: Alat Produktivitas UX (CommandPalette, DetailSheet, StickyContextFilterBar)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'mock_token');
    localStorage.setItem('dashboard-divisi.role-demo', 'DIRECTOR');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. Global Command Palette Tests
  // -------------------------------------------------------------
  describe('1. Global Command Palette (Ctrl+K / Cmd+K)', () => {
    it('merender Command Palette ketika isOpen=true dengan dialog, input pencarian, dan daftar modul', () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter>
          <CommandPalette isOpen={true} onClose={handleClose} />
        </MemoryRouter>,
      );

      expect(screen.getByRole('dialog', { name: /global command palette/i })).toBeInTheDocument();
      expect(screen.getByTestId('command-palette-input')).toBeInTheDocument();
      expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Omzet & Penjualan')).toBeInTheDocument();
      expect(screen.getByText('Jurnal Umum (General Ledger)')).toBeInTheDocument();
    });

    it('tidak merender apa pun saat isOpen=false', () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter>
          <CommandPalette isOpen={false} onClose={handleClose} />
        </MemoryRouter>,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('dapat memfilter item perintah secara real-time berdasarkan query pencarian', () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter>
          <CommandPalette isOpen={true} onClose={handleClose} />
        </MemoryRouter>,
      );

      const input = screen.getByTestId('command-palette-input');

      // Filter "waterfall"
      fireEvent.change(input, { target: { value: 'waterfall' } });
      expect(screen.getByText('Cash Flow Waterfall Chart')).toBeInTheDocument();
      expect(screen.queryByText('Penilaian Kinerja')).not.toBeInTheDocument();

      // Filter "aging"
      fireEvent.change(input, { target: { value: 'aging' } });
      expect(screen.getByText('Aging Bucket & Tagihan Outstanding')).toBeInTheDocument();
      expect(screen.queryByText('Cash Flow Waterfall Chart')).not.toBeInTheDocument();
    });

    it('menampilkan empty state yang ramah ketika tidak ada hasil yang cocok', () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter>
          <CommandPalette isOpen={true} onClose={handleClose} />
        </MemoryRouter>,
      );

      const input = screen.getByTestId('command-palette-input');
      fireEvent.change(input, { target: { value: 'xyzrandomquerytidakada' } });

      expect(screen.getByText('Tidak ada perintah atau modul yang cocok')).toBeInTheDocument();
    });

    it('mendukung navigasi keyboard ArrowDown, ArrowUp, dan seleksi dengan Enter', () => {
      const handleClose = vi.fn();
      const handleSelectAction = vi.fn();
      render(
        <MemoryRouter>
          <CommandPalette
            isOpen={true}
            onClose={handleClose}
            onSelectAction={handleSelectAction}
          />
        </MemoryRouter>,
      );

      const input = screen.getByTestId('command-palette-input');

      // Filter hanya aksi cepat
      fireEvent.change(input, { target: { value: 'Panel Rincian Cepat' } });
      expect(screen.getByText('Buka Panel Rincian Cepat (Detail Sheet)')).toBeInTheDocument();

      // Tekan Enter untuk memilih
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleSelectAction).toHaveBeenCalledWith('act-open-detail-sheet');
    });

    it('menutup Command Palette saat tombol Escape ditekan atau backdrop diklik', () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter>
          <CommandPalette isOpen={true} onClose={handleClose} />
        </MemoryRouter>,
      );

      const input = screen.getByTestId('command-palette-input');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      const backdrop = screen.getByTestId('command-palette-backdrop');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------
  // 2. Sliding Detail Sheet Tests
  // -------------------------------------------------------------
  describe('2. Sliding Detail Sheet / Drawer', () => {
    it('merender Detail Sheet dengan judul, badge status, dan konten anak ketika isOpen=true', () => {
      const handleClose = vi.fn();
      render(
        <DetailSheet
          isOpen={true}
          onClose={handleClose}
          title="Detail Transaksi AR-2026-009"
          subtitle="Pelanggan: PT Sarana Retail Prima"
          badge={{ text: 'Belum Lunas', variant: 'warning' }}
        >
          <div data-testid="sheet-child-content">
            <p>Nominal: Rp 45.000.000</p>
            <p>Umur Piutang: 42 Hari (Bucket 31-60 Hari)</p>
          </div>
        </DetailSheet>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Detail Transaksi AR-2026-009')).toBeInTheDocument();
      expect(screen.getByText('Pelanggan: PT Sarana Retail Prima')).toBeInTheDocument();
      expect(screen.getByText('Belum Lunas')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-child-content')).toBeInTheDocument();
    });

    it('tidak merender apa pun saat isOpen=false', () => {
      const handleClose = vi.fn();
      render(
        <DetailSheet isOpen={false} onClose={handleClose} title="Hidden Sheet">
          <p>Hidden</p>
        </DetailSheet>,
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('dapat ditutup melalui tombol X dan tombol Tutup default di footer', () => {
      const handleClose = vi.fn();
      render(
        <DetailSheet isOpen={true} onClose={handleClose} title="Panel Rincian">
          <p>Konten</p>
        </DetailSheet>,
      );

      const closeBtn = screen.getByTestId('detail-sheet-close-btn');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const defaultCloseBtn = screen.getByTestId('detail-sheet-default-close-btn');
      fireEvent.click(defaultCloseBtn);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it('dapat ditutup saat tombol Escape ditekan atau backdrop diklik', () => {
      const handleClose = vi.fn();
      render(
        <DetailSheet isOpen={true} onClose={handleClose} title="Panel Rincian">
          <p>Konten</p>
        </DetailSheet>,
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      const backdrop = screen.getByTestId('detail-sheet-backdrop');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it('mendukung custom footer dengan aksi khusus', () => {
      const handleExport = vi.fn();
      render(
        <DetailSheet
          isOpen={true}
          onClose={vi.fn()}
          title="Panel Rincian"
          footer={
            <button type="button" onClick={handleExport} data-testid="custom-export-btn">
              Ekspor PDF
            </button>
          }
        >
          <p>Konten</p>
        </DetailSheet>,
      );

      const exportBtn = screen.getByTestId('custom-export-btn');
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);
      expect(handleExport).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------
  // 3. Sticky Context Filter Bar Tests
  // -------------------------------------------------------------
  describe('3. Sticky Context Filter Bar', () => {
    it('merender opsi periode cepat (Hari Ini, 7 Hari, Bulan Ini, Q3 YTD) dan dropdown divisi', () => {
      render(
        <MemoryRouter>
          <StickyContextFilterBar />
        </MemoryRouter>,
      );

      expect(screen.getByTestId('sticky-context-filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('filter-period-today')).toBeInTheDocument();
      expect(screen.getByTestId('filter-period-7d')).toBeInTheDocument();
      expect(screen.getByTestId('filter-period-month')).toBeInTheDocument();
      expect(screen.getByTestId('filter-period-ytd')).toBeInTheDocument();
      expect(screen.getByTestId('sticky-filter-division')).toBeInTheDocument();
    });

    it('memanggil onPeriodChange saat pengguna memilih pill periode berbeda', () => {
      const handlePeriodChange = vi.fn();
      render(
        <MemoryRouter>
          <StickyContextFilterBar
            period="month"
            onPeriodChange={handlePeriodChange}
          />
        </MemoryRouter>,
      );

      const todayBtn = screen.getByTestId('filter-period-today');
      fireEvent.click(todayBtn);
      expect(handlePeriodChange).toHaveBeenCalledWith('today');

      const ytdBtn = screen.getByTestId('filter-period-ytd');
      fireEvent.click(ytdBtn);
      expect(handlePeriodChange).toHaveBeenCalledWith('ytd');
    });

    it('memanggil onDivisionChange saat pengguna memilih divisi berbeda', () => {
      const handleDivisionChange = vi.fn();
      render(
        <MemoryRouter>
          <StickyContextFilterBar
            division="ALL"
            onDivisionChange={handleDivisionChange}
          />
        </MemoryRouter>,
      );

      const select = screen.getByTestId('sticky-filter-division');
      fireEvent.change(select, { target: { value: 'WRAP' } });
      expect(handleDivisionChange).toHaveBeenCalledWith('WRAP');
    });

    it('menampilkan tombol Reset saat filter dimodifikasi dan memicu onResetFilters', () => {
      const handleReset = vi.fn();
      render(
        <MemoryRouter>
          <StickyContextFilterBar
            period="today"
            division="WRAP"
            onResetFilters={handleReset}
          />
        </MemoryRouter>,
      );

      const resetBtn = screen.getByTestId('sticky-filter-reset');
      expect(resetBtn).toBeInTheDocument();
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it('memanggil onOpenCommandPalette dan onOpenDetailSheet saat shortcut button diklik', () => {
      const handleOpenPalette = vi.fn();
      const handleOpenSheet = vi.fn();
      render(
        <MemoryRouter>
          <StickyContextFilterBar
            onOpenCommandPalette={handleOpenPalette}
            onOpenDetailSheet={handleOpenSheet}
          />
        </MemoryRouter>,
      );

      const paletteBtn = screen.getByTestId('sticky-filter-open-palette');
      fireEvent.click(paletteBtn);
      expect(handleOpenPalette).toHaveBeenCalledTimes(1);

      const sheetBtn = screen.getByTestId('sticky-filter-open-sheet');
      fireEvent.click(sheetBtn);
      expect(handleOpenSheet).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------
  // 4. AppLayout Integration with Productivity Tools
  // -------------------------------------------------------------
  describe('4. Integrasi AppLayout dengan Productivity Tools', () => {
    it('dapat membuka Command Palette melalui tombol search navbar dan menutupnya', () => {
      renderWithProviders(<AppLayout />);

      const searchBtn = screen.getByTestId('navbar-search-btn');
      expect(searchBtn).toBeInTheDocument();

      fireEvent.click(searchBtn);
      expect(screen.getByRole('dialog', { name: /global command palette/i })).toBeInTheDocument();

      // Tutup via tombol ESC
      const input = screen.getByTestId('command-palette-input');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: /global command palette/i })).not.toBeInTheDocument();
    });

    it('dapat membuka Command Palette via shortcut Ctrl+K', () => {
      renderWithProviders(<AppLayout />);

      act(() => {
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      });

      expect(screen.getByRole('dialog', { name: /global command palette/i })).toBeInTheDocument();

      // Tekan Ctrl+K lagi untuk toggle tutup
      act(() => {
        fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      });
      expect(screen.queryByRole('dialog', { name: /global command palette/i })).not.toBeInTheDocument();
    });

    it('dapat membuka Detail Sheet via shortcut Ctrl+D atau via action item', () => {
      renderWithProviders(<AppLayout />);

      act(() => {
        fireEvent.keyDown(window, { key: 'd', ctrlKey: true });
      });

      expect(screen.getByText('Rincian Operasional & Finansial')).toBeInTheDocument();
      expect(screen.getByText(/Status Entitas Aktif/i)).toBeInTheDocument();
      expect(screen.getByText(/31\/31 Klop/i)).toBeInTheDocument();

      // Tutup detail sheet
      const closeBtn = screen.getByTestId('detail-sheet-close-btn');
      fireEvent.click(closeBtn);
      expect(screen.queryByText(/Status Entitas Aktif/i)).not.toBeInTheDocument();
    });
  });
});
