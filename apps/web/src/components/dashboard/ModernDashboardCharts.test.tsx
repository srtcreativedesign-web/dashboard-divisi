import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SparklineSvg } from './SparklineSvg';
import { ExecutiveKpiCards } from './ExecutiveKpiCards';
import { DualToneAreaChart } from './DualToneAreaChart';
import { DivisionLeaderboard } from './DivisionLeaderboard';
import { InteractiveDonutChart, type DonutSlice } from './InteractiveDonutChart';
import BodExecutiveDashboard from './BodExecutiveDashboard';
import DashboardPage from '../../pages/DashboardPage';
import { AuthProvider } from '../../session/AuthContext';

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

describe('Sistem Visualisasi Data & Modern Dashboard Charts (ISSUE-20)', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  describe('1. Komponen SparklineSvg', () => {
    it('merender elemen SVG kurva bezier dan area dengan mulus', () => {
      const { container } = render(
        <SparklineSvg data={[10, 25, 18, 32, 45]} color="#0284c7" height={36} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 100 32');

      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2); // 1 area path + 1 line path

      // Cek glowing point terakhir
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2); // main dot + pulsing ring
    });

    it('menangani data kosong dengan aman tanpa melempar exception', () => {
      const { container } = render(<SparklineSvg data={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('dapat menyembunyikan titik glowing terakhir jika showLastPoint bernilai false', () => {
      const { container } = render(
        <SparklineSvg data={[5, 15, 20]} showLastPoint={false} />
      );
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(0);
    });
  });

  describe('2. Komponen ExecutiveKpiCards', () => {
    it('merender 4 kartu metrik utama lengkap dengan nilai format, badge delta, dan sparkline', () => {
      render(
        <ExecutiveKpiCards
          totalRevenue={14950000000}
          totalTarget={14650000000}
          achievementPct={102.1}
          workforceCount={183}
        />
      );

      // Card 1: Realisasi Omset
      expect(screen.getByText('Realisasi Omset')).toBeInTheDocument();
      expect(screen.getByText('Rp 14.95')).toBeInTheDocument();
      expect(screen.getByText('+14.8%')).toBeInTheDocument();

      // Card 2: Capaian Target
      expect(screen.getByText('Capaian Target')).toBeInTheDocument();
      expect(screen.getByText('102.1%')).toBeInTheDocument();
      expect(screen.getByText(/\+2.1% Surplus/i)).toBeInTheDocument();

      // Card 3: Estimasi Margin Laba
      expect(screen.getByText('Estimasi Margin Laba')).toBeInTheDocument();
      expect(screen.getByText('24.8%')).toBeInTheDocument();
      expect(screen.getByText('+1.8% MoM')).toBeInTheDocument();

      // Card 4: Produktivitas SDM
      expect(screen.getByText('Produktivitas SDM')).toBeInTheDocument();
      expect(screen.getByText('Rp 81.7')).toBeInTheDocument();
      expect(screen.getByText('+5.4%')).toBeInTheDocument();
    });
  });

  describe('3. Komponen DualToneAreaChart', () => {
    it('merender grafik kurva spline dual-tone dan merespons switcher timeframe', () => {
      render(<DualToneAreaChart />);

      // Judul & Badge
      expect(screen.getByText('Tren Realisasi Omset vs Target')).toBeInTheDocument();
      expect(screen.getByText('Spline Dual-Tone')).toBeInTheDocument();

      // Timeframe buttons
      const dailyBtn = screen.getByTestId('timeframe-btn-daily');
      const weeklyBtn = screen.getByTestId('timeframe-btn-weekly');
      const monthlyBtn = screen.getByTestId('timeframe-btn-monthly');
      const ytdBtn = screen.getByTestId('timeframe-btn-ytd');

      expect(dailyBtn).toBeInTheDocument();
      expect(weeklyBtn).toBeInTheDocument();
      expect(monthlyBtn).toBeInTheDocument();
      expect(ytdBtn).toBeInTheDocument();

      // Switch ke Bulanan
      fireEvent.click(monthlyBtn);
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Sep')).toBeInTheDocument();

      // Switch ke YTD
      fireEvent.click(ytdBtn);
      expect(screen.getByText('Q1')).toBeInTheDocument();
      expect(screen.getByText('Q2')).toBeInTheDocument();
      expect(screen.getByText('Q3')).toBeInTheDocument();
    });

    it('menampilkan floating tooltip saat irisan data grafik di-hover', () => {
      const { container } = render(<DualToneAreaChart />);

      // Cari slice interaktif pertama
      const slices = container.querySelectorAll('rect.cursor-pointer');
      expect(slices.length).toBeGreaterThan(0);

      fireEvent.mouseEnter(slices[0]!);

      // Tooltip harus muncul
      const tooltip = screen.getByTestId('chart-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/Realisasi:/i);
      expect(tooltip).toHaveTextContent(/Target Acuan:/i);
      expect(tooltip).toHaveTextContent(/Deviasi \/ Gap:/i);

      // Mouse leave harus menyembunyikan tooltip
      fireEvent.mouseLeave(slices[0]!);
      expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
    });
  });

  describe('4. Komponen DivisionLeaderboard', () => {
    const mockDivisions = [
      {
        divisionCode: 'CELL',
        divisionName: 'Cellular',
        revenue: { gross: 1800000000, source: '', freshness: '' },
        target: { value: 1600000000, achievement: 112.5, source: '' },
        performance: { score: 112, level: '', source: '' },
        workforce: { count: 20, risk: '', source: '' },
        period: { from: '', to: '' },
        drillDown: { href: '' },
      },
      {
        divisionCode: 'MINI',
        divisionName: 'Minimarket',
        revenue: { gross: 3500000000, source: '', freshness: '' },
        target: { value: 3400000000, achievement: 102.9, source: '' },
        performance: { score: 102, level: '', source: '' },
        workforce: { count: 30, risk: '', source: '' },
        period: { from: '', to: '' },
        drillDown: { href: '' },
      },
      {
        divisionCode: 'FNB',
        divisionName: 'FnB',
        revenue: { gross: 1200000000, source: '', freshness: '' },
        target: { value: 1500000000, achievement: 80.0, source: '' },
        performance: { score: 80, level: '', source: '' },
        workforce: { count: 60, risk: '', source: '' },
        period: { from: '', to: '' },
        drillDown: { href: '' },
      },
    ];

    it('merender divisi ritel terurut berdasarkan capaian target tertinggi (default)', () => {
      render(<DivisionLeaderboard divisions={mockDivisions} />);

      expect(screen.getByText('Leaderboard Kinerja 7 Divisi Ritel')).toBeInTheDocument();

      // Cellular adalah peringkat #1 (112.5%)
      const cellItem = screen.getByTestId('leaderboard-item-CELL');
      expect(cellItem).toHaveTextContent('Cellular');
      expect(cellItem).toHaveTextContent('112.5%');
      expect(cellItem).toHaveTextContent('🥇');
      expect(cellItem).toHaveTextContent('Juara 1');

      // Minimarket #2 (102.9%)
      const miniItem = screen.getByTestId('leaderboard-item-MINI');
      expect(miniItem).toHaveTextContent('Minimarket');
      expect(miniItem).toHaveTextContent('🥈');

      // FnB #3 (80.0%)
      const fnbItem = screen.getByTestId('leaderboard-item-FNB');
      expect(fnbItem).toHaveTextContent('FnB');
      expect(fnbItem).toHaveTextContent('🥉');
    });

    it('dapat beralih pengurutan ke Nominal Omset terbesar saat tombol toggle diklik', () => {
      render(<DivisionLeaderboard divisions={mockDivisions} />);

      const sortByRevBtn = screen.getByTestId('sort-by-revenue');
      fireEvent.click(sortByRevBtn);

      // Minimarket memiliki omset terbesar (Rp 3.500 Jt) sehingga menjadi #1
      const miniItem = screen.getByTestId('leaderboard-item-MINI');
      expect(miniItem).toHaveTextContent('🥇');
      expect(miniItem).toHaveTextContent('Juara 1');
    });
  });

  describe('5. Komponen InteractiveDonutChart', () => {
    const mockDonutData: DonutSlice[] = [
      { label: 'Minimarket', code: 'MINI', value: 3500000000, color: '#10b981' },
      { label: 'Wrapping', code: 'WRAP', value: 2200000000, color: '#0284c7' },
      { label: 'Cellular', code: 'CELL', value: 1800000000, color: '#0ea5e9' },
    ];

    it('merender chart donat dan memperbarui label tengah saat irisan atau legend disentuh', () => {
      render(<InteractiveDonutChart data={mockDonutData} />);

      const centerLabel = screen.getByTestId('donut-center-label');
      // Default center: Total Omset (3.5 + 2.2 + 1.8 = 7.50 M)
      expect(centerLabel).toHaveTextContent(/Total Omset/i);
      expect(centerLabel).toHaveTextContent('Rp 7.50 M');

      // Hover legend Minimarket
      const miniLegend = screen.getByTestId('donut-legend-MINI');
      fireEvent.mouseEnter(miniLegend);

      // Label tengah berubah menjadi rincian Minimarket
      expect(centerLabel).toHaveTextContent(/Minimarket/i);
      expect(centerLabel).toHaveTextContent('Rp 3.50 M');
      expect(centerLabel).toHaveTextContent(/46.7% Kontribusi/i);

      // Mouse leave mengembalikan ke total
      fireEvent.mouseLeave(miniLegend);
      expect(centerLabel).toHaveTextContent(/Total Omset/i);
      expect(centerLabel).toHaveTextContent('Rp 7.50 M');
    });
  });

  describe('6. Integrasi BodExecutiveDashboard & DashboardPage', () => {
    it('BOD Executive Dashboard merender seluruh rangkaian visualisasi data lengkap', async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <BodExecutiveDashboard />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // KPI Cards
      expect(await screen.findByTestId('executive-kpi-cards')).toBeInTheDocument();

      // Dual Tone Area Chart
      expect(screen.getByTestId('dual-tone-area-chart')).toBeInTheDocument();

      // Division Leaderboard
      expect(screen.getByTestId('division-leaderboard')).toBeInTheDocument();

      // Interactive Donut Chart
      expect(screen.getByTestId('interactive-donut-chart')).toBeInTheDocument();

      // Top & Bottom Performers
      expect(screen.getByTestId('top-performers-card')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-performers-card')).toBeInTheDocument();
    });

    it('DashboardPage merender tampilan personalisasi yang sesuai untuk role MANAGER', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
      localStorage.setItem('dashboard-divisi.division-demo', 'ACC');

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter>
              <DashboardPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('manager-dashboard-view')).toBeInTheDocument();
      expect(screen.getByText('Manager Approval Center (Pending ACC)')).toBeInTheDocument();
      expect(screen.getByText('Antrean ACC Pending')).toBeInTheDocument();
      expect(screen.getByText('Approval Rate')).toBeInTheDocument();
    });

    it('DashboardPage merender tampilan personalisasi yang sesuai untuk role ADMIN', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter>
              <DashboardPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('admin-dashboard-view')).toBeInTheDocument();
      expect(screen.getByText('Panel Input Admin Divisi')).toBeInTheDocument();
      expect(screen.getByText('Target Divisi Bulan Ini')).toBeInTheDocument();
    });

    it('DashboardPage merender tampilan personalisasi yang sesuai untuk role PIC', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'PIC');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter>
              <DashboardPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('pic-dashboard-view')).toBeInTheDocument();
      expect(screen.getByText(/Mode Akses PIC \(Read-Only\)/i)).toBeInTheDocument();
      expect(screen.getByText('Status Pengawasan')).toBeInTheDocument();
    });
  });
});
