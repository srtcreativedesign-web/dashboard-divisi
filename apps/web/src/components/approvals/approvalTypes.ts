export type ApprovalCategory =
  | 'daily_revenue'
  | 'bank_reconciliation'
  | 'period_closing'
  | 'receivable_writeoff';

export type ApprovalStatus = 'pending_review' | 'approved' | 'rejected' | 'cancelled';

export type ApprovalPriority = 'critical' | 'high' | 'medium' | 'low';

export interface DiffField {
  label: string;
  originalValue: string | number;
  proposedValue: string | number;
  diffText?: string;
  unit?: string;
  isChanged: boolean;
}

export interface ApprovalRequest {
  id: string;
  referenceNo: string;
  category: ApprovalCategory;
  title: string;
  description: string;
  divisionCode: 'WRAP' | 'CELL' | 'REFL' | 'MINI' | 'FNB' | 'MC' | 'ACC' | 'ALL';
  divisionName: string;
  amount: number;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerRole?: string;
  rejectionReason?: string;
  approvalNote?: string;
  diffFields: DiffField[];
  relatedEntityId?: string;
  thresholdBreached?: boolean;
  thresholdBreachDetails?: string;
}

export const CATEGORY_METADATA: Record<
  ApprovalCategory,
  { label: string; badgeClass: string; icon: string }
> = {
  daily_revenue: {
    label: 'Pendapatan Harian',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'TrendingUp',
  },
  bank_reconciliation: {
    label: 'Penyesuaian Bank',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'Building2',
  },
  period_closing: {
    label: 'Periode Akuntansi',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'Calendar',
  },
  receivable_writeoff: {
    label: 'Penghapusan Piutang',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'FileText',
  },
};

export const PRIORITY_METADATA: Record<
  ApprovalPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  critical: {
    label: 'Kritis',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  high: {
    label: 'Tinggi',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
  },
  medium: {
    label: 'Sedang',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  low: {
    label: 'Rendah',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const STATUS_METADATA: Record<
  ApprovalStatus,
  { label: string; badgeClass: string }
> = {
  pending_review: {
    label: 'Menunggu Persetujuan',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
  },
  approved: {
    label: 'Disetujui',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
  },
  rejected: {
    label: 'Ditolak / Perlu Revisi',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
  },
  cancelled: {
    label: 'Dibatalkan',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'app-01',
    referenceNo: 'REQ-20260904-001',
    category: 'daily_revenue',
    title: 'Laporan Omzet Harian Divisi Wrapping (03 Sep 2026)',
    description: 'Pengajuan realisasi omzet harian bundling hari pelanggan sebesar Rp 45.000.000.',
    divisionCode: 'WRAP',
    divisionName: 'Wrapping',
    amount: 45000000,
    priority: 'medium',
    status: 'pending_review',
    requesterId: 'user-wrap-admin',
    requesterName: 'Admin Wrapping',
    requesterRole: 'PIC / Staff',
    submittedAt: '04 Sep 2026, 08:30 WIB',
    relatedEntityId: '1',
    thresholdBreached: false,
    diffFields: [
      {
        label: 'Target Harian',
        originalValue: 'Rp 40.000.000',
        proposedValue: 'Rp 40.000.000',
        isChanged: false,
      },
      {
        label: 'Realisasi Pendapatan',
        originalValue: 'Rp 0',
        proposedValue: 'Rp 45.000.000',
        diffText: '+Rp 45.000.000 (+112.5% Target)',
        isChanged: true,
      },
      {
        label: 'Catatan Lapangan',
        originalValue: '-',
        proposedValue: 'Promosi Bundling Hari Pelanggan',
        isChanged: true,
      },
    ],
  },
  {
    id: 'app-02',
    referenceNo: 'REQ-20260904-002',
    category: 'daily_revenue',
    title: 'Koreksi Setoran Kasir Minimarket Terbuka',
    description: 'Terdapat selisih pencatatan sistem POS Rp 65.000.000 dengan fisik setoran kasir Rp 64.750.000.',
    divisionCode: 'MINI',
    divisionName: 'Minimarket',
    amount: 65000000,
    priority: 'high',
    status: 'pending_review',
    requesterId: 'user-mini-admin',
    requesterName: 'Admin Minimarket',
    requesterRole: 'PIC / Staff',
    submittedAt: '04 Sep 2026, 09:15 WIB',
    relatedEntityId: '4',
    thresholdBreached: true,
    thresholdBreachDetails: 'Selisih setoran kasir Rp 250.000 melampaui toleransi nol selisih.',
    diffFields: [
      {
        label: 'Total Penjualan POS',
        originalValue: 'Rp 65.000.000',
        proposedValue: 'Rp 65.000.000',
        isChanged: false,
      },
      {
        label: 'Fisik Uang Masuk',
        originalValue: 'Rp 65.000.000',
        proposedValue: 'Rp 64.750.000',
        diffText: '-Rp 250.000 (Selisih Kurang)',
        isChanged: true,
      },
      {
        label: 'Keterangan Selisih',
        originalValue: '-',
        proposedValue: 'Selisih pembulatan uang receh shift malam, dialihkan ke beban operasional kecil.',
        isChanged: true,
      },
    ],
  },
  {
    id: 'app-03',
    referenceNo: 'REQ-20260904-003',
    category: 'bank_reconciliation',
    title: 'Penyesuaian Biaya Administrasi Mutasi Bank BCA',
    description: 'Rekonsiliasi mutasi rekening koran BCA Operasional dengan selisih biaya kliring antar-bank.',
    divisionCode: 'ACC',
    divisionName: 'Accounting & Finance',
    amount: 1250000,
    priority: 'high',
    status: 'pending_review',
    requesterId: 'user-fin-admin',
    requesterName: 'Staff Accounting',
    requesterRole: 'PIC / Staff',
    submittedAt: '04 Sep 2026, 10:00 WIB',
    thresholdBreached: true,
    thresholdBreachDetails: 'Selisih rekonsiliasi > Rp 0 membutuhkan otorisasi Manajer Accounting.',
    diffFields: [
      {
        label: 'Saldo Rekening Koran',
        originalValue: 'Rp 2.450.000.000',
        proposedValue: 'Rp 2.448.750.000',
        diffText: '-Rp 1.250.000',
        isChanged: true,
      },
      {
        label: 'Akun Beban Penyesuaian',
        originalValue: '-',
        proposedValue: '6-1020 Beban Administrasi Bank',
        isChanged: true,
      },
    ],
  },
  {
    id: 'app-04',
    referenceNo: 'REQ-20260904-004',
    category: 'receivable_writeoff',
    title: 'Penghapusan Piutang Macet >90 Hari Toko Berkah',
    description: 'Permohonan write-off invoice #INV-2026-0412 karena debitur dinyatakan pailit per audit hukum.',
    divisionCode: 'CELL',
    divisionName: 'Cellular',
    amount: 15800000,
    priority: 'critical',
    status: 'pending_review',
    requesterId: 'user-cell-spv',
    requesterName: 'Supervisor Cellular',
    requesterRole: 'Supervisor',
    submittedAt: '04 Sep 2026, 11:20 WIB',
    thresholdBreached: true,
    thresholdBreachDetails: 'Nilai penghapusan piutang Rp 15.800.000 (> Rp 10.000.000) memerlukan persetujuan Direksi (BOD).',
    diffFields: [
      {
        label: 'Nilai Tagihan Piutang',
        originalValue: 'Rp 15.800.000',
        proposedValue: 'Rp 0',
        diffText: '-Rp 15.800.000 (Penyisihan 100%)',
        isChanged: true,
      },
      {
        label: 'Status Penagihan',
        originalValue: 'Macet (>90 Hari)',
        proposedValue: 'Dihapuskan (Write-Off)',
        isChanged: true,
      },
    ],
  },
  {
    id: 'app-05',
    referenceNo: 'REQ-20260904-005',
    category: 'period_closing',
    title: 'Pembukaan Sementara Periode Akuntansi Agustus 2026',
    description: 'Permohonan unfreeze buku besar Agustus 2026 untuk penyesuaian jurnal audit eksternal.',
    divisionCode: 'ACC',
    divisionName: 'Accounting & Finance',
    amount: 0,
    priority: 'critical',
    status: 'pending_review',
    requesterId: 'user-fin-mgr',
    requesterName: 'Manager Accounting',
    requesterRole: 'Manager',
    submittedAt: '04 Sep 2026, 13:00 WIB',
    thresholdBreached: true,
    thresholdBreachDetails: 'Pembukaan periode yang telah ditutup membutuhkan persetujuan Direktur Keuangan (BOD).',
    diffFields: [
      {
        label: 'Status Periode Agustus 2026',
        originalValue: 'Locked (Terkunci)',
        proposedValue: 'Temporary Open (Dibuka Sementara 24 Jam)',
        isChanged: true,
      },
    ],
  },
  {
    id: 'app-06',
    referenceNo: 'REQ-20260903-012',
    category: 'daily_revenue',
    title: 'Laporan Pendapatan Harian FnB Event Kuliner (03 Sep 2026)',
    description: 'Omzet operasional harian FnB telah direkonsiliasi dan sesuai laporan kasir.',
    divisionCode: 'FNB',
    divisionName: 'Food & Beverage',
    amount: 85000000,
    priority: 'low',
    status: 'approved',
    requesterId: 'user-fnb-admin',
    requesterName: 'Admin FnB',
    requesterRole: 'PIC / Staff',
    submittedAt: '03 Sep 2026, 09:05 WIB',
    reviewedAt: '03 Sep 2026, 10:00 WIB',
    reviewerId: 'user-fnb-mgr',
    reviewerName: 'Hendra Wijaya',
    reviewerRole: 'Manager FnB',
    approvalNote: 'Laporan valid dan telah diverifikasi dengan bukti transaksi QRIS & EDC.',
    relatedEntityId: '5',
    thresholdBreached: false,
    diffFields: [
      {
        label: 'Realisasi Pendapatan',
        originalValue: 'Rp 0',
        proposedValue: 'Rp 85.000.000',
        diffText: '+Rp 85.000.000',
        isChanged: true,
      },
    ],
  },
  {
    id: 'app-07',
    referenceNo: 'REQ-20260903-015',
    category: 'daily_revenue',
    title: 'Laporan Pendapatan Harian Refleksi (03 Sep 2026)',
    description: 'Pengajuan omzet harian refleksi sebesar Rp 28.000.000.',
    divisionCode: 'REFL',
    divisionName: 'Refleksi',
    amount: 28000000,
    priority: 'medium',
    status: 'rejected',
    requesterId: 'user-refl-admin',
    requesterName: 'Admin Refleksi',
    requesterRole: 'PIC / Staff',
    submittedAt: '03 Sep 2026, 08:45 WIB',
    reviewedAt: '03 Sep 2026, 09:30 WIB',
    reviewerId: 'user-refl-mgr',
    reviewerName: 'Siti Rahma',
    reviewerRole: 'Manager Refleksi',
    rejectionReason: 'Rekapitulasi fisik kasir belum melampirkan slip settlement EDC BCA.',
    relatedEntityId: '3',
    thresholdBreached: false,
    diffFields: [
      {
        label: 'Realisasi Pendapatan',
        originalValue: 'Rp 0',
        proposedValue: 'Rp 28.000.000',
        diffText: '+Rp 28.000.000',
        isChanged: true,
      },
    ],
  },
];
