import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import {
  AgingBucketBar,
  getItemBucket,
  getDaysPastDue,
  type AgingBucketItem,
  type AgingBucketId,
} from './AgingBucketBar';
import { WaterfallChart, type WaterfallItem } from './WaterfallChart';
import { ReconciliationMatchGauge } from './ReconciliationMatchGauge';
import AccountingOutstandingPage from '../../pages/AccountingOutstandingPage';
import AccountingCashflowReportPage from '../../pages/AccountingCashflowReportPage';
import CashflowPage from '../../pages/CashflowPage';
import PnlPage from '../../pages/PnlPage';
import AccountingReconciliationPage from '../../pages/AccountingReconciliationPage';
import { AuthProvider } from '../../session/AuthContext';
import { ToastProvider } from '../ui/Toast';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  role = 'MANAGER',
  division = 'ACC'
) {
  localStorage.setItem('dashboard-divisi.role-demo', role);
  localStorage.setItem('dashboard-divisi.division-demo', division);
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Sistem Visualisasi Finansial & Modul Accounting Fase 3 (ISSUE-21)', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  describe('1. Komponen AgingBucketBar', () => {
    const mockItems: AgingBucketItem[] = [
      { id: '1', remainingAmount: 50000000, dueDate: '2026-08-20', status: 'unpaid' }, // ~12 hari (0-30)
      { id: '2', remainingAmount: 40000000, dueDate: '2026-07-25', status: 'unpaid' }, // ~38 hari (31-60)
      { id: '3', remainingAmount: 30000000, dueDate: '2026-06-25', status: 'unpaid' }, // ~68 hari (61-90)
      { id: '4', remainingAmount: 20000000, dueDate: '2026-05-10', status: 'unpaid' }, // ~114 hari (>90)
      { id: '5', remainingAmount: 10000000, dueDate: '2026-05-10', status: 'paid' }, // lunas (diabaikan)
    ];

    it('menghitung umur jatuh tempo dan mengelompokkan bucket secara akurat', () => {
      expect(getDaysPastDue('2026-08-20', '2026-09-01')).toBe(12);
      expect(getItemBucket(mockItems[0]!, '2026-09-01')).toBe('bucket_0_30');

      expect(getDaysPastDue('2026-07-25', '2026-09-01')).toBe(38);
      expect(getItemBucket(mockItems[1]!, '2026-09-01')).toBe('bucket_31_60');

      expect(getDaysPastDue('2026-06-25', '2026-09-01')).toBe(68);
      expect(getItemBucket(mockItems[2]!, '2026-09-01')).toBe('bucket_61_90');

      expect(getDaysPastDue('2026-05-10', '2026-09-01')).toBe(114);
      expect(getItemBucket(mockItems[3]!, '2026-09-01')).toBe('bucket_over_90');
    });

    it('merender progress bar proporsional dan 4 kartu bucket interaktif', () => {
      const onSelectBucket = vi.fn();
      render(
        <AgingBucketBar
          items={mockItems}
          selectedBucket={null}
          onSelectBucket={onSelectBucket}
          referenceDate="2026-09-01"
        />
      );

      // Judul & Header
      expect(
        screen.getByText(/Aging Bucket Distribution Bar/i)
      ).toBeInTheDocument();

      // Total aktif = 50 + 40 + 30 + 20 = 140 Jt
      expect(screen.getByText(/Rp\s*140\.000\.000/i)).toBeInTheDocument();

      // 4 kartu bucket
      expect(screen.getByTestId('bucket-card-bucket_0_30')).toBeInTheDocument();
      expect(screen.getByTestId('bucket-card-bucket_31_60')).toBeInTheDocument();
      expect(screen.getByTestId('bucket-card-bucket_61_90')).toBeInTheDocument();
      expect(screen.getByTestId('bucket-card-bucket_over_90')).toBeInTheDocument();

      // Klik salah satu kartu memicu callback onSelectBucket
      fireEvent.click(screen.getByTestId('bucket-card-bucket_over_90'));
      expect(onSelectBucket).toHaveBeenCalledWith('bucket_over_90');
    });

    it('menampilkan tombol reset saat salah satu bucket sedang terfilter', () => {
      const onSelectBucket = vi.fn();
      render(
        <AgingBucketBar
          items={mockItems}
          selectedBucket="bucket_over_90"
          onSelectBucket={onSelectBucket}
          referenceDate="2026-09-01"
        />
      );

      const resetBtn = screen.getByTestId('reset-bucket-filter');
      expect(resetBtn).toBeInTheDocument();
      fireEvent.click(resetBtn);
      expect(onSelectBucket).toHaveBeenCalledWith(null);
    });
  });

  describe('2. Komponen WaterfallChart', () => {
    const mockSteps: WaterfallItem[] = [
      { id: '1', label: 'Saldo Awal', amount: 1000000000, isTotal: true },
      { id: '2', label: 'Penerimaan', amount: 500000000 },
      { id: '3', label: 'Beban Operasional', amount: -300000000 },
      { id: '4', label: 'Saldo Akhir', amount: 1200000000, isTotal: true },
    ];

    it('merender tiang-tiang waterfall dan konektor garis putus-putus', () => {
      const { container } = render(<WaterfallChart items={mockSteps} />);

      expect(screen.getByTestId('waterfall-chart-section')).toBeInTheDocument();
      expect(screen.getByTestId('waterfall-bar-1')).toBeInTheDocument();
      expect(screen.getByTestId('waterfall-bar-2')).toBeInTheDocument();
      expect(screen.getByTestId('waterfall-bar-3')).toBeInTheDocument();
      expect(screen.getByTestId('waterfall-bar-4')).toBeInTheDocument();

      // Memeriksa keberadaan elemen konektor garis (line dengan strokeDasharray)
      const lines = container.querySelectorAll('line[stroke-dasharray="3 3"]');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('menampilkan tooltip informatif saat tiang grafik disentuh (hover)', () => {
      render(<WaterfallChart items={mockSteps} />);

      const barPenerimaan = screen.getByTestId('waterfall-bar-2');
      fireEvent.mouseEnter(barPenerimaan);

      const tooltip = screen.getByTestId('waterfall-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/Penerimaan/i);
      expect(tooltip).toHaveTextContent(/Nominal:/i);
      expect(tooltip).toHaveTextContent(/Kumulatif Saldo:/i);

      fireEvent.mouseLeave(barPenerimaan);
      expect(screen.queryByTestId('waterfall-tooltip')).not.toBeInTheDocument();
    });
  });

  describe('3. Komponen ReconciliationMatchGauge', () => {
    it('merender status 100% klop dengan jarum dan teks meteran sempurna', () => {
      render(
        <ReconciliationMatchGauge
          totalBank={7491741528}
          totalCashflow={7491741527.12}
          variance={0.88}
          isMatched={true}
          totalAccounts={31}
        />
      );

      expect(screen.getByTestId('reconciliation-match-gauge-section')).toBeInTheDocument();
      const matchText = screen.getByTestId('match-percentage-text');
      expect(matchText).toHaveTextContent('100.00%');
      expect(screen.getByText(/Rekonsiliasi Sempurna \(Klop\)/i)).toBeInTheDocument();
      expect(screen.getByText(/31 Rekening Bank Operasional/i)).toBeInTheDocument();
    });

    it('merender indikasi peringatan jika terdapat deviasi selisih besar', () => {
      render(
        <ReconciliationMatchGauge
          totalBank={7000000000}
          totalCashflow={6500000000}
          variance={500000000}
          isMatched={false}
          totalAccounts={31}
        />
      );

      const matchText = screen.getByTestId('match-percentage-text');
      expect(parseFloat(matchText.textContent!)).toBeLessThan(95);
      expect(screen.getByText(/Selisih Perlu Rekonsiliasi/i)).toBeInTheDocument();
    });
  });

  describe('4. Integrasi Halaman Finansial (Outstanding, Cashflow, PnL, & Rekonsiliasi)', () => {
    it('AccountingOutstandingPage terintegrasi dengan AgingBucketBar dan memfilter data tabel', async () => {
      renderWithProviders(<AccountingOutstandingPage />, 'MANAGER', 'ACC');

      // Pastikan Aging Bucket Bar ter-render
      expect(screen.getByTestId('aging-bucket-bar-section')).toBeInTheDocument();

      // Klik bucket 0 - 30 Hari
      const bucket030 = screen.getByTestId('bucket-card-bucket_0_30');
      fireEvent.click(bucket030);

      // Tombol reset filter harus muncul
      expect(screen.getByTestId('reset-bucket-filter')).toBeInTheDocument();
    });

    it('AccountingCashflowReportPage merender WaterfallChart untuk arus kas resmi', () => {
      renderWithProviders(<AccountingCashflowReportPage />, 'MANAGER', 'ACC');

      expect(screen.getByTestId('waterfall-chart-section')).toBeInTheDocument();
      expect(screen.getByText(/Waterfall Chart: Jembatan Aliran Arus Kas/i)).toBeInTheDocument();
    });

    it('CashflowPage modul ritel operasional merender WaterfallChart', () => {
      renderWithProviders(<CashflowPage />, 'MANAGER', 'WRAP');

      expect(screen.getByTestId('waterfall-chart-section')).toBeInTheDocument();
      expect(screen.getByText(/Waterfall Chart Arus Kas Operasional/i)).toBeInTheDocument();
    });

    it('PnlPage merender WaterfallChart formasi margin P&L', () => {
      renderWithProviders(<PnlPage />, 'BOD', 'BOD');

      expect(screen.getByTestId('waterfall-chart-section')).toBeInTheDocument();
      expect(screen.getByText(/Waterfall Chart: Formasi Laba Rugi/i)).toBeInTheDocument();
    });

    it('AccountingReconciliationPage merender ReconciliationMatchGauge', () => {
      renderWithProviders(<AccountingReconciliationPage />, 'MANAGER', 'ACC');

      expect(screen.getByTestId('reconciliation-match-gauge-section')).toBeInTheDocument();
      expect(screen.getByTestId('match-percentage-text')).toBeInTheDocument();
    });
  });
});
