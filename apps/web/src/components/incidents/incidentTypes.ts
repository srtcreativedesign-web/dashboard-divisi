export type IncidentCategory =
  | 'ar_aging'
  | 'retail_target'
  | 'bank_reconciliation'
  | 'cashier_variance';

export type IncidentStatus = 'open' | 'investigating' | 'resolved';
export type IncidentSeverity = 'danger' | 'warning';

export interface AlertRuleConfig {
  id: string;
  category: IncidentCategory;
  title: string;
  description: string;
  thresholdValue: number;
  thresholdUnit: string;
  severity: IncidentSeverity;
  enabledChannels: ('in_app' | 'email' | 'webhook')[];
  isActive: boolean;
  lastUpdated: string;
}

export interface FinancialIncident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  divisionCode: string;
  divisionName: string;
  amount: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedPic?: string;
  notes?: string;
  detectedAt: string;
  resolvedAt?: string;
  traceId: string;
}

export const INITIAL_ALERT_RULES: AlertRuleConfig[] = [
  {
    id: 'rule-01',
    category: 'ar_aging',
    title: 'Ambang Batas Piutang Kritis (>60 Hari)',
    description: 'Picu peringatan darurat jika tagihan invoice melampaui usia jatuh tempo 60 hari.',
    thresholdValue: 60,
    thresholdUnit: 'Hari',
    severity: 'danger',
    enabledChannels: ['in_app', 'email', 'webhook'],
    isActive: true,
    lastUpdated: '04 Sep 2026, 21:00 WIB',
  },
  {
    id: 'rule-02',
    category: 'retail_target',
    title: 'Toleransi Deviasi Target Penjualan Ritel',
    description: 'Peringatan dini aktif apabila realisasi MTD ritel berada di bawah persentase ambang.',
    thresholdValue: 75,
    thresholdUnit: '% MTD',
    severity: 'warning',
    enabledChannels: ['in_app', 'email'],
    isActive: true,
    lastUpdated: '04 Sep 2026, 18:30 WIB',
  },
  {
    id: 'rule-03',
    category: 'bank_reconciliation',
    title: 'Selisih Mutasi Rekonsiliasi Bank',
    description: 'Peringatan aktif jika terdapat selisih mutasi rekening bank yang belum klop dengan buku besar.',
    thresholdValue: 0,
    thresholdUnit: 'IDR (Nol Toleransi)',
    severity: 'danger',
    enabledChannels: ['in_app', 'email', 'webhook'],
    isActive: true,
    lastUpdated: '04 Sep 2026, 17:00 WIB',
  },
  {
    id: 'rule-04',
    category: 'cashier_variance',
    title: 'Ambang Selisih Fisik Kasir Harian',
    description: 'Peringatan aktif jika selisih cash over/short kasir outlet melampaui batas toleransi.',
    thresholdValue: 250000,
    thresholdUnit: 'IDR / Shift',
    severity: 'warning',
    enabledChannels: ['in_app'],
    isActive: true,
    lastUpdated: '04 Sep 2026, 15:45 WIB',
  },
];

export const INITIAL_INCIDENTS: FinancialIncident[] = [
  {
    id: 'inc-001',
    title: 'Tagihan Piutang Melewati Batas 60 Hari',
    description: 'Invoice AR-2026-009 milik PT Sarana Retail telah menunggak 68 hari tanpa pembayaran cicilan.',
    category: 'ar_aging',
    divisionCode: 'FIN',
    divisionName: 'Finance & Accounting',
    amount: 45000000,
    severity: 'danger',
    status: 'open',
    assignedPic: 'Belum Ditugaskan',
    detectedAt: '04 Sep 2026, 20:30 WIB',
    traceId: 'TRC-9921-AR',
  },
  {
    id: 'inc-002',
    title: 'Selisih Mutasi Rekening Bank Belum Terverifikasi',
    description: 'Setoran kasir operasional Wrapping Bandara sebesar Rp 45.000.000 menunggu konfirmasi rekonsiliasi.',
    category: 'bank_reconciliation',
    divisionCode: 'ACC',
    divisionName: 'Accounting Center',
    amount: 45000000,
    severity: 'warning',
    status: 'investigating',
    assignedPic: 'Siti Rahmawati (Manager ACC)',
    notes: 'Sedang diverifikasi rekening koran Mandiri Giro Bandara.',
    detectedAt: '04 Sep 2026, 18:15 WIB',
    traceId: 'TRC-8812-RECON',
  },
  {
    id: 'inc-003',
    title: 'Deviasi Target Omzet Divisi Jasa & Cleaning',
    description: 'Pencapaian baru menyentuh 18.3% (tertinggal 81.7% dari target MTD berjalan).',
    category: 'retail_target',
    divisionCode: 'SERVICES',
    divisionName: 'Services & Cleaning',
    amount: 140000000,
    severity: 'warning',
    status: 'open',
    assignedPic: 'Belum Ditugaskan',
    detectedAt: '04 Sep 2026, 16:00 WIB',
    traceId: 'TRC-7734-TGT',
  },
  {
    id: 'inc-004',
    title: 'Selisih Setoran Kasir Minimarket Terminal 2',
    description: 'Ditemukan selisih minus Rp 350.000 antara bukti fisik setor dengan sistem POS shift 2.',
    category: 'cashier_variance',
    divisionCode: 'MINI',
    divisionName: 'Minimarket Retail',
    amount: 350000,
    severity: 'warning',
    status: 'resolved',
    assignedPic: 'Ahmad Fauzi (Supervisor)',
    notes: 'Koreksi voucher diskon kasir telah dicocokkan dengan log transaksi kasir.',
    detectedAt: '03 Sep 2026, 22:15 WIB',
    resolvedAt: '04 Sep 2026, 11:30 WIB',
    traceId: 'TRC-6619-POS',
  },
];
