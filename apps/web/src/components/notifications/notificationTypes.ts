export type NotificationCategory = 'all' | 'financial' | 'operational' | 'audit';
export type NotificationSeverity = 'danger' | 'warning' | 'info' | 'success';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'financial' | 'operational' | 'audit';
  severity: NotificationSeverity;
  timestamp: string;
  relativeTime: string;
  isRead: boolean;
  actionPath?: string;
  actionLabel?: string;
  divisionCode?: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
  traceId: string;
  status: 'success' | 'warning' | 'error';
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    title: 'Tagihan Piutang Melewati 60 Hari',
    message: 'Invoice AR-2026-009 (PT Sarana Retail) sebesar Rp 45.000.000 telah masuk bucket usia kritis >60 hari.',
    category: 'financial',
    severity: 'danger',
    timestamp: '2026-09-04T20:30:00Z',
    relativeTime: '15 menit yang lalu',
    isRead: false,
    actionPath: '/accounting/outstanding',
    actionLabel: 'Inspeksi Piutang',
    divisionCode: 'FIN',
  },
  {
    id: 'notif-002',
    title: 'Pencapaian Target Juara Divisi Minimarket',
    message: 'Divisi Minimarket menembus target MTD sebesar 114% (Omzet: Rp 540.000.000, Peringkat #1).',
    category: 'operational',
    severity: 'success',
    timestamp: '2026-09-04T19:45:00Z',
    relativeTime: '1 jam yang lalu',
    isRead: false,
    actionPath: '/omzet',
    actionLabel: 'Lihat Omzet',
    divisionCode: 'MINI',
  },
  {
    id: 'notif-003',
    title: 'Penyelarasan Mutasi Rekonsiliasi Bank',
    message: 'Terdapat 1 mutasi setoran kasir Wrapping sebesar Rp 45.000.000 menunggu konfirmasi rekonsiliasi.',
    category: 'financial',
    severity: 'warning',
    timestamp: '2026-09-04T18:15:00Z',
    relativeTime: '2 jam yang lalu',
    isRead: false,
    actionPath: '/accounting/rekonsiliasi',
    actionLabel: 'Buka Rekonsiliasi',
    divisionCode: 'ACC',
  },
  {
    id: 'notif-004',
    title: 'Deviasi Target Divisi Jasa & Cleaning',
    message: 'Realisasi omzet divisi Services berada di 18.3% (Action Needed sebelum akhir bulan).',
    category: 'operational',
    severity: 'warning',
    timestamp: '2026-09-04T16:00:00Z',
    relativeTime: '4 jam yang lalu',
    isRead: true,
    actionPath: '/target',
    actionLabel: 'Review Target',
    divisionCode: 'SERVICES',
  },
  {
    id: 'notif-005',
    title: 'Ekspor Berkas Laporan Konsolidasi Bulanan',
    message: 'Direksi Utama berhasil mengunduh berkas rekapitulasi finansial format Excel/CSV.',
    category: 'audit',
    severity: 'info',
    timestamp: '2026-09-04T14:30:00Z',
    relativeTime: '6 jam yang lalu',
    isRead: true,
    actionPath: '/laporan',
    actionLabel: 'Lihat Arsip',
    divisionCode: 'BOD',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-001',
    user: 'Edy Hartono Nasrah',
    role: 'BOD / Direktur Utama',
    action: 'Ekspor Data Finansial Konsolidasi (CSV BOM)',
    target: 'LaporanPage / ExportReportModal',
    timestamp: '04 Sep 2026, 21:05:12 WIB',
    ipAddress: '192.168.1.102 (Internal LAN)',
    traceId: 'TRC-9921-X8B1',
    status: 'success',
  },
  {
    id: 'aud-002',
    user: 'Siti Rahmawati',
    role: 'Manager Accounting',
    action: 'Konfirmasi Rekonsiliasi 31 Rekening Bank',
    target: 'AccountingReconciliationPage',
    timestamp: '04 Sep 2026, 18:30:00 WIB',
    ipAddress: '192.168.1.115',
    traceId: 'TRC-8812-B4F2',
    status: 'success',
  },
  {
    id: 'aud-003',
    user: 'Budi Santoso',
    role: 'Admin Divisi Wrapping',
    action: 'Input Penutupan Setoran Kasir Harian',
    target: 'DailyReportPage',
    timestamp: '04 Sep 2026, 17:45:21 WIB',
    ipAddress: '10.20.4.52 (Outlet Bandara)',
    traceId: 'TRC-7734-K1C9',
    status: 'success',
  },
  {
    id: 'aud-004',
    user: 'Ahmad Fauzi',
    role: 'Admin Divisi Minimarket',
    action: 'Update Parameter Threshold Reorder Point',
    target: 'KonfigurasiPage / Outlet-Config',
    timestamp: '04 Sep 2026, 15:10:05 WIB',
    ipAddress: '10.20.4.78',
    traceId: 'TRC-6619-P0A4',
    status: 'success',
  },
  {
    id: 'aud-005',
    user: 'System Cron Engine',
    role: 'Automated Daemon',
    action: 'Eksekusi Distribusi Flash Report Harian',
    target: 'ScheduledReportManager',
    timestamp: '04 Sep 2026, 21:00:00 WIB',
    ipAddress: '127.0.0.1 (Localhost)',
    traceId: 'TRC-5541-CRON',
    status: 'success',
  },
];
