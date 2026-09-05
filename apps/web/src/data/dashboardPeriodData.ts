import { BodOverviewItem } from '../api/bod';
import { PeriodFilterOption } from '../components/filters/StickyContextFilterBar';

export interface ChartDataPoint {
  label: string;
  shortLabel: string;
  actual: number; // Dalam Jutaan IDR
  target: number; // Dalam Jutaan IDR
}

export interface PeriodSummary {
  periodId: PeriodFilterOption;
  periodLabel: string;
  periodDescription: string;
  totalRevenue: number;
  totalTarget: number;
  achievementPct: number;
  totalWorkforce: number;
  divisions: BodOverviewItem[];
  chartPoints: ChartDataPoint[];
  adminMetrics: {
    targetNominal: number;
    targetLabel: string;
    targetBadge: string;
    realisasiNominal: number;
    realisasiPct: number;
    gapNominal: number;
    gapPct: number;
    pacingLabel: string;
    pacingValue: number; // 0 - 100
    pacingDetail: string;
    pacingRemaining: string;
    reportStatus: string;
    reportStatusDetail: string;
  };
  managerMetrics: {
    pendingCount: number;
    pendingNominal: number;
    slaHours: number;
    approvalRate: number;
  };
}

// 1. Data Hari Ini (today - 1 Hari)
const TODAY_DIVISIONS: BodOverviewItem[] = [
  {
    divisionCode: 'WRAP',
    divisionName: 'Wrapping',
    revenue: { gross: 175200000, source: 'Realtime POS & Kasir', freshness: '15 Menit Lalu' },
    target: { value: 166700000, achievement: 105.1, source: 'Target Harian' },
    performance: { score: 98, level: 'Unggul', source: 'SOP Harian' },
    workforce: { count: 58, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=WRAP' },
  },
  {
    divisionCode: 'CELL',
    divisionName: 'Cellular',
    revenue: { gross: 59800000, source: 'Realtime POS & Kasir', freshness: '10 Menit Lalu' },
    target: { value: 53300000, achievement: 112.2, source: 'Target Harian' },
    performance: { score: 110, level: 'Unggul', source: 'SOP Harian' },
    workforce: { count: 20, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=CELL' },
  },
  {
    divisionCode: 'MINI',
    divisionName: 'Minimarket',
    revenue: { gross: 118500000, source: 'Realtime POS & Kasir', freshness: '25 Menit Lalu' },
    target: { value: 113300000, achievement: 104.6, source: 'Target Harian' },
    performance: { score: 102, level: 'Sesuai Target', source: 'SOP Harian' },
    workforce: { count: 30, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=MINI' },
  },
  {
    divisionCode: 'FNB',
    divisionName: 'FnB',
    revenue: { gross: 42100000, source: 'Realtime POS & Kasir', freshness: '30 Menit Lalu' },
    target: { value: 50000000, achievement: 84.2, source: 'Target Harian' },
    performance: { score: 84, level: 'Perhatian', source: 'SOP Harian' },
    workforce: { count: 60, risk: 'Medium', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=FNB' },
  },
  {
    divisionCode: 'REFL',
    divisionName: 'Refleksi',
    revenue: { gross: 15600000, source: 'Realtime POS & Kasir', freshness: '40 Menit Lalu' },
    target: { value: 13300000, achievement: 117.3, source: 'Target Harian' },
    performance: { score: 115, level: 'Unggul', source: 'SOP Harian' },
    workforce: { count: 15, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=REFL' },
  },
  {
    divisionCode: 'MC',
    divisionName: 'Money Changer',
    revenue: { gross: 174300000, source: 'Realtime POS & Kasir', freshness: '5 Menit Lalu' },
    target: { value: 166700000, achievement: 104.6, source: 'Target Harian' },
    performance: { score: 103, level: 'Sesuai Target', source: 'SOP Harian' },
    workforce: { count: 8, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=MC' },
  },
  {
    divisionCode: 'ACC',
    divisionName: 'Accounting & Finance',
    revenue: { gross: 27000000, source: 'Realtime POS & Kasir', freshness: '1 Jam Lalu' },
    target: { value: 25000000, achievement: 108.0, source: 'Target Harian' },
    performance: { score: 106, level: 'Sesuai Target', source: 'SOP Harian' },
    workforce: { count: 5, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-06', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=ACC' },
  },
];

// 2. Data 7 Hari Terakhir (7d - 1 Minggu Terakhir)
const SEVEN_DAYS_DIVISIONS: BodOverviewItem[] = [
  {
    divisionCode: 'WRAP',
    divisionName: 'Wrapping',
    revenue: { gross: 1226400000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 1166900000, achievement: 105.1, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 98, level: 'Unggul', source: 'Audit Mingguan' },
    workforce: { count: 58, risk: 'Low', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=WRAP' },
  },
  {
    divisionCode: 'CELL',
    divisionName: 'Cellular',
    revenue: { gross: 418600000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 373100000, achievement: 112.2, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 112, level: 'Unggul', source: 'Audit Mingguan' },
    workforce: { count: 20, risk: 'Low', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=CELL' },
  },
  {
    divisionCode: 'MINI',
    divisionName: 'Minimarket',
    revenue: { gross: 829500000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 793100000, achievement: 104.6, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 102, level: 'Sesuai Target', source: 'Audit Mingguan' },
    workforce: { count: 30, risk: 'Low', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=MINI' },
  },
  {
    divisionCode: 'FNB',
    divisionName: 'FnB',
    revenue: { gross: 294700000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 350000000, achievement: 84.2, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 82, level: 'Perhatian', source: 'Audit Mingguan' },
    workforce: { count: 60, risk: 'Medium', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=FNB' },
  },
  {
    divisionCode: 'REFL',
    divisionName: 'Refleksi',
    revenue: { gross: 109200000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 93100000, achievement: 117.3, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 115, level: 'Unggul', source: 'Audit Mingguan' },
    workforce: { count: 15, risk: 'Low', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=REFL' },
  },
  {
    divisionCode: 'MC',
    divisionName: 'Money Changer',
    revenue: { gross: 1220100000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 1166900000, achievement: 104.6, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 103, level: 'Sesuai Target', source: 'Audit Mingguan' },
    workforce: { count: 8, risk: 'Low', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=MC' },
  },
  {
    divisionCode: 'ACC',
    divisionName: 'Accounting & Finance',
    revenue: { gross: 189000000, source: 'Rekap Mingguan Shift POS', freshness: '1 Jam Lalu' },
    target: { value: 175000000, achievement: 108.0, source: 'Target Mingguan (7 Hari)' },
    performance: { score: 106, level: 'Sesuai Target', source: 'Audit Mingguan' },
    workforce: { count: 5, risk: 'Low', source: 'HRD' },
    period: { from: '2026-08-31', to: '2026-09-06' },
    drillDown: { href: '/laporan-harian?divisi=ACC' },
  },
];

// 3. Data Sebulan (month - September 2026)
const MONTH_DIVISIONS: BodOverviewItem[] = [
  {
    divisionCode: 'WRAP',
    divisionName: 'Wrapping',
    revenue: { gross: 5050000000, source: 'Accounting Sync (Excel Sheet)', freshness: '2 Jam Lalu' },
    target: { value: 5000000000, achievement: 101.0, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 98, level: 'Unggul', source: 'SOP Audit' },
    workforce: { count: 58, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=WRAP' },
  },
  {
    divisionCode: 'CELL',
    divisionName: 'Cellular',
    revenue: { gross: 1800000000, source: 'Accounting Sync', freshness: '2 Jam Lalu' },
    target: { value: 1600000000, achievement: 112.5, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 112, level: 'Unggul', source: 'SOP Audit' },
    workforce: { count: 20, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=CELL' },
  },
  {
    divisionCode: 'MINI',
    divisionName: 'Minimarket',
    revenue: { gross: 3500000000, source: 'Accounting Sync', freshness: '2 Jam Lalu' },
    target: { value: 3400000000, achievement: 102.9, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 102, level: 'Sesuai Target', source: 'SOP Audit' },
    workforce: { count: 30, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=MINI' },
  },
  {
    divisionCode: 'FNB',
    divisionName: 'FnB',
    revenue: { gross: 1200000000, source: 'Accounting Sync', freshness: '2 Jam Lalu' },
    target: { value: 1500000000, achievement: 80.0, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 80, level: 'Perhatian', source: 'SOP Audit' },
    workforce: { count: 60, risk: 'Medium', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=FNB' },
  },
  {
    divisionCode: 'REFL',
    divisionName: 'Refleksi',
    revenue: { gross: 450000000, source: 'Accounting Sync', freshness: '2 Jam Lalu' },
    target: { value: 400000000, achievement: 112.5, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 112, level: 'Unggul', source: 'SOP Audit' },
    workforce: { count: 15, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=REFL' },
  },
  {
    divisionCode: 'MC',
    divisionName: 'Money Changer',
    revenue: { gross: 5000000000, source: 'Accounting Sync', freshness: '2 Jam Lalu' },
    target: { value: 5000000000, achievement: 100.0, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 100, level: 'Sesuai Target', source: 'SOP Audit' },
    workforce: { count: 8, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=MC' },
  },
  {
    divisionCode: 'ACC',
    divisionName: 'Accounting & Finance',
    revenue: { gross: 800000000, source: 'Accounting Sync', freshness: '2 Jam Lalu' },
    target: { value: 750000000, achievement: 106.7, source: 'Target Bulanan (Sep 2026)' },
    performance: { score: 106, level: 'Sesuai Target', source: 'SOP Audit' },
    workforce: { count: 5, risk: 'Low', source: 'HRD' },
    period: { from: '2026-09-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=ACC' },
  },
];

// 4. Data Setahun / YTD (ytd - 2026 Tahun Berjalan s/d September)
const YTD_DIVISIONS: BodOverviewItem[] = [
  {
    divisionCode: 'WRAP',
    divisionName: 'Wrapping',
    revenue: { gross: 45450000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 45000000000, achievement: 101.0, source: 'RKAP YTD 2026' },
    performance: { score: 99, level: 'Unggul', source: 'Evaluasi Tahunan' },
    workforce: { count: 58, risk: 'Low', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=WRAP' },
  },
  {
    divisionCode: 'CELL',
    divisionName: 'Cellular',
    revenue: { gross: 16200000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 14400000000, achievement: 112.5, source: 'RKAP YTD 2026' },
    performance: { score: 112, level: 'Unggul', source: 'Evaluasi Tahunan' },
    workforce: { count: 20, risk: 'Low', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=CELL' },
  },
  {
    divisionCode: 'MINI',
    divisionName: 'Minimarket',
    revenue: { gross: 31500000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 30600000000, achievement: 102.9, source: 'RKAP YTD 2026' },
    performance: { score: 103, level: 'Sesuai Target', source: 'Evaluasi Tahunan' },
    workforce: { count: 30, risk: 'Low', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=MINI' },
  },
  {
    divisionCode: 'FNB',
    divisionName: 'FnB',
    revenue: { gross: 11200000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 13500000000, achievement: 83.0, source: 'RKAP YTD 2026' },
    performance: { score: 83, level: 'Perhatian', source: 'Evaluasi Tahunan' },
    workforce: { count: 60, risk: 'Medium', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=FNB' },
  },
  {
    divisionCode: 'REFL',
    divisionName: 'Refleksi',
    revenue: { gross: 4100000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 3600000000, achievement: 113.9, source: 'RKAP YTD 2026' },
    performance: { score: 113, level: 'Unggul', source: 'Evaluasi Tahunan' },
    workforce: { count: 15, risk: 'Low', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=REFL' },
  },
  {
    divisionCode: 'MC',
    divisionName: 'Money Changer',
    revenue: { gross: 45180000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 45000000000, achievement: 100.4, source: 'RKAP YTD 2026' },
    performance: { score: 101, level: 'Sesuai Target', source: 'Evaluasi Tahunan' },
    workforce: { count: 8, risk: 'Low', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=MC' },
  },
  {
    divisionCode: 'ACC',
    divisionName: 'Accounting & Finance',
    revenue: { gross: 7520000000, source: 'Konsolidasi Ledger 9 Bulan', freshness: '1 Hari Lalu' },
    target: { value: 6750000000, achievement: 111.4, source: 'RKAP YTD 2026' },
    performance: { score: 108, level: 'Sesuai Target', source: 'Evaluasi Tahunan' },
    workforce: { count: 5, risk: 'Low', source: 'HRD' },
    period: { from: '2026-01-01', to: '2026-09-30' },
    drillDown: { href: '/laporan-harian?divisi=ACC' },
  },
];

export const PERIOD_CONFIGS: Record<PeriodFilterOption, PeriodSummary> = {
  today: {
    periodId: 'today',
    periodLabel: 'Hari Ini (06 Sep 2026)',
    periodDescription: 'Pemantauan omset berjalan hari ini secara real-time dari 58 outlet',
    totalRevenue: 612500000, // Rp 612.5 Jt
    totalTarget: 588300000,  // Rp 588.3 Jt
    achievementPct: 104.1,
    totalWorkforce: 196,
    divisions: TODAY_DIVISIONS,
    chartPoints: [
      { label: '08:00 WIB', shortLabel: '08:00', actual: 65, target: 60 },
      { label: '10:00 WIB', shortLabel: '10:00', actual: 120, target: 110 },
      { label: '12:00 WIB', shortLabel: '12:00', actual: 210, target: 195 },
      { label: '14:00 WIB', shortLabel: '14:00', actual: 320, target: 300 },
      { label: '16:00 WIB', shortLabel: '16:00', actual: 440, target: 410 },
      { label: '18:00 WIB', shortLabel: '18:00', actual: 540, target: 510 },
      { label: '21:00 WIB (Closing)', shortLabel: '21:00', actual: 612, target: 588 },
    ],
    adminMetrics: {
      targetNominal: 83300000, // Rp 83.3 Jt
      targetLabel: 'Target Harian Divisi',
      targetBadge: 'Hari Ini · 06 Sep 2026',
      realisasiNominal: 87500000, // Rp 87.5 Jt
      realisasiPct: 105.0,
      gapNominal: 4200000,
      gapPct: 5.0,
      pacingLabel: 'Pacing Jam Operasional',
      pacingValue: 87.5,
      pacingDetail: 'Jam 21:00 / 24:00 (Closing Shift)',
      pacingRemaining: '3 Jam Operasional',
      reportStatus: 'Shift Pagi & Sore Terisi Lengkap',
      reportStatusDetail: 'Semua mesin kasir telah settlement dan klop dengan POS.',
    },
    managerMetrics: {
      pendingCount: 2,
      pendingNominal: 110000000,
      slaHours: 4.5,
      approvalRate: 98.5,
    },
  },

  '7d': {
    periodId: '7d',
    periodLabel: '7 Hari Terakhir (31 Agu - 06 Sep 2026)',
    periodDescription: 'Agregasi performa omset dan perolehan 7 hari kalender berjalan',
    totalRevenue: 4287500000, // Rp 4.28 M
    totalTarget: 4120000000,  // Rp 4.12 M
    achievementPct: 104.1,
    totalWorkforce: 196,
    divisions: SEVEN_DAYS_DIVISIONS,
    chartPoints: [
      { label: 'Senin, 31 Agu', shortLabel: 'Sen', actual: 560, target: 540 },
      { label: 'Selasa, 01 Sep', shortLabel: 'Sel', actual: 580, target: 550 },
      { label: 'Rabu, 02 Sep', shortLabel: 'Rab', actual: 595, target: 570 },
      { label: 'Kamis, 03 Sep', shortLabel: 'Kam', actual: 620, target: 590 },
      { label: 'Jumat, 04 Sep', shortLabel: 'Jum', actual: 640, target: 600 },
      { label: 'Sabtu, 05 Sep', shortLabel: 'Sab', actual: 680, target: 640 },
      { label: 'Minggu, 06 Sep', shortLabel: 'Min', actual: 612, target: 588 },
    ],
    adminMetrics: {
      targetNominal: 583300000, // Rp 583.3 Jt
      targetLabel: 'Target 7 Hari Terakhir',
      targetBadge: 'Minggu Berjalan · 7 Hari',
      realisasiNominal: 612500000, // Rp 612.5 Jt
      realisasiPct: 105.0,
      gapNominal: 29200000,
      gapPct: 5.0,
      pacingLabel: 'Pacing Siklus 7 Hari',
      pacingValue: 100,
      pacingDetail: 'Hari ke-7 / 7 Hari (100% Siklus)',
      pacingRemaining: 'Siklus Mingguan Selesai',
      reportStatus: '14/14 Shift Mingguan Terverifikasi',
      reportStatusDetail: 'Rekonsiliasi mingguan seluruh shift telah lolos verifikasi.',
    },
    managerMetrics: {
      pendingCount: 3,
      pendingNominal: 260000000,
      slaHours: 12.0,
      approvalRate: 97.4,
    },
  },

  month: {
    periodId: 'month',
    periodLabel: 'Bulan Ini (September 2026)',
    periodDescription: 'Monitoring realisasi target RKAP bulanan seluruh 7 divisi',
    totalRevenue: 17950000000, // Rp 17.95 M
    totalTarget: 17650000000,  // Rp 17.65 M
    achievementPct: 101.7,
    totalWorkforce: 196,
    divisions: MONTH_DIVISIONS,
    chartPoints: [
      { label: 'Minggu ke-1 (01-07 Sep)', shortLabel: 'M-1', actual: 4280, target: 4120 },
      { label: 'Minggu ke-2 (08-14 Sep)', shortLabel: 'M-2', actual: 4350, target: 4250 },
      { label: 'Minggu ke-3 (15-21 Sep)', shortLabel: 'M-3', actual: 4620, target: 4500 },
      { label: 'Minggu ke-4 (22-28 Sep)', shortLabel: 'M-4', actual: 4700, target: 4780 },
    ],
    adminMetrics: {
      targetNominal: 2500000000, // Rp 2.50 M
      targetLabel: 'Target Divisi Bulan Ini',
      targetBadge: 'RKAP September 2026',
      realisasiNominal: 2200000000, // Rp 2.20 M
      realisasiPct: 88.0,
      gapNominal: -300000000,
      gapPct: -12.0,
      pacingLabel: 'Pacing Waktu Kalender',
      pacingValue: 20.0,
      pacingDetail: 'Hari ke-6 / 30 (20%)',
      pacingRemaining: '24 Hari Tersisa',
      reportStatus: 'Shift Pagi & Sore Lengkap',
      reportStatusDetail: 'Input shift harian lengkap dan tervalidasi settlement kasir.',
    },
    managerMetrics: {
      pendingCount: 3,
      pendingNominal: 260000000,
      slaHours: 18.2,
      approvalRate: 96.8,
    },
  },

  ytd: {
    periodId: 'ytd',
    periodLabel: 'Tahun Berjalan (YTD 2026)',
    periodDescription: 'Akumulasi performa tahun berjalan (Januari - September 2026)',
    totalRevenue: 161150000000, // Rp 161.15 M
    totalTarget: 158850000000,  // Rp 158.85 M
    achievementPct: 101.4,
    totalWorkforce: 196,
    divisions: YTD_DIVISIONS,
    chartPoints: [
      { label: 'Januari 2026', shortLabel: 'Jan', actual: 16800, target: 16500 },
      { label: 'Februari 2026', shortLabel: 'Feb', actual: 17100, target: 17000 },
      { label: 'Maret 2026', shortLabel: 'Mar', actual: 17950, target: 17500 },
      { label: 'April 2026', shortLabel: 'Apr', actual: 18200, target: 18000 },
      { label: 'Mei 2026', shortLabel: 'Mei', actual: 18600, target: 18200 },
      { label: 'Juni 2026', shortLabel: 'Jun', actual: 18100, target: 18500 },
      { label: 'Juli 2026', shortLabel: 'Jul', actual: 18850, target: 18500 },
      { label: 'Agustus 2026', shortLabel: 'Agu', actual: 19300, target: 18800 },
      { label: 'September 2026 (YTD)', shortLabel: 'Sep', actual: 16250, target: 15850 },
    ],
    adminMetrics: {
      targetNominal: 22500000000, // Rp 22.50 M YTD 9 Bulan
      targetLabel: 'Target Divisi YTD (9 Bulan)',
      targetBadge: 'RKAP YTD 2026',
      realisasiNominal: 20100000000, // Rp 20.10 M
      realisasiPct: 89.3,
      gapNominal: -2400000000,
      gapPct: -10.7,
      pacingLabel: 'Pacing Tahun Anggaran',
      pacingValue: 75.0,
      pacingDetail: 'Bulan ke-9 / 12 (75%)',
      pacingRemaining: '3 Bulan Tersisa (Q4)',
      reportStatus: 'Kepatuhan Rekap Tahunan 99.1%',
      reportStatusDetail: 'Seluruh jurnal dan rekonsiliasi bulanan tuntas diaudit.',
    },
    managerMetrics: {
      pendingCount: 6,
      pendingNominal: 680000000,
      slaHours: 21.4,
      approvalRate: 98.9,
    },
  },
};

export function getPeriodSummary(period: PeriodFilterOption = 'month', divisionCode?: string): PeriodSummary {
  const base = PERIOD_CONFIGS[period] ?? PERIOD_CONFIGS.month;
  if (!divisionCode || divisionCode === 'ALL') {
    return base;
  }

  // Jika spesifik divisi tertentu
  const divItem = base.divisions.find((d) => d.divisionCode === divisionCode);
  if (!divItem) return base;

  const divRev = divItem.revenue.gross ?? 0;
  const divTarget = divItem.target.value;
  const divPct = divTarget > 0 ? (divRev / divTarget) * 100 : 0;

  // Scale chart points sesuai proporsi divisi terhadap total
  const ratio = base.totalRevenue > 0 ? divRev / base.totalRevenue : 0.2;
  const scaledPoints = base.chartPoints.map((pt) => ({
    ...pt,
    actual: Math.round(pt.actual * ratio),
    target: Math.round(pt.target * ratio),
  }));

  return {
    ...base,
    totalRevenue: divRev,
    totalTarget: divTarget,
    achievementPct: divPct,
    totalWorkforce: divItem.workforce.count,
    chartPoints: scaledPoints,
    adminMetrics: {
      ...base.adminMetrics,
      targetNominal: divTarget,
      realisasiNominal: divRev,
      realisasiPct: divPct,
      gapNominal: divRev - divTarget,
      gapPct: divPct - 100,
    },
  };
}
