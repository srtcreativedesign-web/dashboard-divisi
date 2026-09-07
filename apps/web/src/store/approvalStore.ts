import { create } from 'zustand';
import {
  ApprovalRequest,
  INITIAL_APPROVAL_REQUESTS,
} from '../components/approvals/approvalTypes';

export interface DailyRecord {
  id: string;
  date: string;
  division: 'WRAP' | 'CELL' | 'REFL' | 'MINI' | 'FNB' | 'MC' | 'ACC';
  divisionName: string;
  outletCode?: string;
  outletName?: string;
  shift?: 'Pagi (06:00 - 14:00)' | 'Siang/Sore (14:00 - 22:00)' | 'Full Day (All Shifts)';
  categoryService?: string;
  revenue: number;
  target: number;
  cashAmount?: number;
  edcAmount?: number;
  qrisAmount?: number;
  transactionCount?: number;
  attachmentName?: string;
  notes: string;
  updatedBy: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
  rejectionReason?: string;
}

export const INITIAL_DAILY_REPORTS: DailyRecord[] = [
  {
    id: '1',
    date: '2026-09-03',
    division: 'WRAP',
    divisionName: 'Wrapping',
    outletCode: 'T2D1',
    outletName: 'STAR WRAP-T2D1',
    shift: 'Full Day (All Shifts)',
    categoryService: 'Wrapping Bagasi & Protection',
    revenue: 45000000,
    target: 40000000,
    cashAmount: 12000000,
    edcAmount: 23000000,
    qrisAmount: 10000000,
    transactionCount: 225,
    attachmentName: 'settlement_edc_mandiri_t2d1.pdf',
    notes: 'Promosi Bundling Hari Pelanggan',
    updatedBy: 'Admin Wrapping',
    status: 'PENDING_REVIEW',
    submittedAt: '03 Sep 2026 08:30',
  },
  {
    id: '2',
    date: '2026-09-03',
    division: 'CELL',
    divisionName: 'Cellular',
    outletCode: 'T3IOUT',
    outletName: 'POINT CELLULLER-T3IOUT',
    shift: 'Full Day (All Shifts)',
    categoryService: 'SIM Card Wisatawan & Kuota Roaming',
    revenue: 110000000,
    target: 100000000,
    cashAmount: 20000000,
    edcAmount: 60000000,
    qrisAmount: 30000000,
    transactionCount: 310,
    attachmentName: 'slip_settlement_bca_t3i.pdf',
    notes: 'Launching Aksesoris Flagship',
    updatedBy: 'Admin Cellular',
    status: 'APPROVED',
    approvedBy: 'Manager Cellular',
    approvedAt: '03 Sep 2026 09:15',
    submittedAt: '03 Sep 2026 08:10',
  },
  {
    id: '3',
    date: '2026-09-03',
    division: 'REFL',
    divisionName: 'Refleksi',
    outletCode: 'T2FA',
    outletName: 'SERENITY BLOSSOMS-T2FA',
    shift: 'Siang/Sore (14:00 - 22:00)',
    categoryService: 'Pijat Relaksasi Refleksi Bandara',
    revenue: 28000000,
    target: 30000000,
    cashAmount: 8000000,
    edcAmount: 15000000,
    qrisAmount: 5000000,
    transactionCount: 95,
    notes: 'Jam sibuk sore hari',
    updatedBy: 'Admin Refleksi',
    status: 'REJECTED',
    rejectionReason: 'Rekapitulasi fisik kasir belum melampirkan slip settlement EDC BCA.',
    submittedAt: '03 Sep 2026 08:45',
  },
  {
    id: '4',
    date: '2026-09-03',
    division: 'MINI',
    divisionName: 'Minimarket',
    outletCode: 'T3I',
    outletName: 'M-MART-T3I',
    shift: 'Full Day (All Shifts)',
    categoryService: 'Groceries, Minuman & Snack Bandara',
    revenue: 65000000,
    target: 60000000,
    cashAmount: 25000000,
    edcAmount: 25000000,
    qrisAmount: 15000000,
    transactionCount: 420,
    attachmentName: 'rekap_kasir_mmart_t3i.pdf',
    notes: 'Penjualan groceries stabil',
    updatedBy: 'Admin Minimarket',
    status: 'PENDING_REVIEW',
    submittedAt: '03 Sep 2026 08:50',
  },
  {
    id: '5',
    date: '2026-09-03',
    division: 'FNB',
    divisionName: 'Food & Beverage',
    outletCode: 'T3INT',
    outletName: 'BAKSO ZURO-T3INT',
    shift: 'Full Day (All Shifts)',
    categoryService: 'Food & Beverage Terminal 3',
    revenue: 85000000,
    target: 75000000,
    cashAmount: 30000000,
    edcAmount: 35000000,
    qrisAmount: 20000000,
    transactionCount: 380,
    attachmentName: 'settlement_edc_mandiri_fnb.pdf',
    notes: 'Event Kuliner Malam',
    updatedBy: 'Admin FnB',
    status: 'APPROVED',
    approvedBy: 'Manager FnB',
    approvedAt: '03 Sep 2026 10:00',
    submittedAt: '03 Sep 2026 09:05',
  },
  {
    id: '6',
    date: '2026-09-03',
    division: 'ACC',
    divisionName: 'Accounting & Finance',
    outletCode: 'ACC-001',
    outletName: 'Accounting Head Office',
    shift: 'Full Day (All Shifts)',
    categoryService: 'Pendapatan Jasa Shared Accounting',
    revenue: 150000000,
    target: 140000000,
    cashAmount: 0,
    edcAmount: 0,
    qrisAmount: 150000000,
    transactionCount: 15,
    notes: 'Pencatatan pendapatan jasa & pembukuan',
    updatedBy: 'Admin Accounting',
    status: 'PENDING_REVIEW',
    submittedAt: '03 Sep 2026 09:20',
  },
  {
    id: '7',
    date: '2026-09-03',
    division: 'MC',
    divisionName: 'Money Changer',
    outletCode: 'MCT3-I',
    outletName: 'MONEY CHANGER-MCT3-I',
    shift: 'Full Day (All Shifts)',
    categoryService: 'Transaksi Valas & Penukaran Mata Uang',
    revenue: 210000000,
    target: 200000000,
    cashAmount: 90000000,
    edcAmount: 70000000,
    qrisAmount: 50000000,
    transactionCount: 140,
    attachmentName: 'rekap_transaksi_valas_mct3.pdf',
    notes: 'Lonjakan transaksi valas',
    updatedBy: 'Admin Money Changer',
    status: 'APPROVED',
    approvedBy: 'Manager Money Changer',
    approvedAt: '03 Sep 2026 10:30',
    submittedAt: '03 Sep 2026 09:30',
  },
];

interface ApprovalStoreState {
  requests: ApprovalRequest[];
  dailyReports: DailyRecord[];
  approveRequest: (
    requestId: string,
    reviewerName: string,
    reviewerRole: string,
    note?: string
  ) => void;
  rejectRequest: (
    requestId: string,
    reviewerName: string,
    reviewerRole: string,
    reason: string
  ) => void;
  batchApproveRequests: (
    requestIds: string[],
    reviewerName: string,
    reviewerRole: string
  ) => void;
  addDailyReport: (
    report: Omit<DailyRecord, 'id' | 'status' | 'submittedAt'>,
    requesterName: string,
    requesterRole: string
  ) => DailyRecord;
  approveDailyReportFromDailyPage: (dailyId: string, reviewerName: string) => void;
  rejectDailyReportFromDailyPage: (
    dailyId: string,
    reviewerName: string,
    reason: string
  ) => void;
  resetToInitial: () => void;
}

export const useApprovalStore = create<ApprovalStoreState>((set, get) => ({
  requests: INITIAL_APPROVAL_REQUESTS,
  dailyReports: INITIAL_DAILY_REPORTS,

  approveRequest: (requestId, reviewerName, reviewerRole, note) => {
    const timestamp = 'Baru Saja';
    let matchedDailyId: string | undefined;

    set((state) => {
      const nextRequests = state.requests.map((r) => {
        if (r.id === requestId) {
          matchedDailyId = r.relatedEntityId;
          return {
            ...r,
            status: 'approved' as const,
            reviewedAt: timestamp,
            reviewerName,
            reviewerRole,
            approvalNote: note || 'Disetujui sesuai SOP.',
          };
        }
        return r;
      });

      // Synchronize 2-way with Daily Reports
      const nextReports = matchedDailyId
        ? state.dailyReports.map((d) => {
            if (d.id === matchedDailyId) {
              return {
                ...d,
                status: 'APPROVED' as const,
                approvedBy: reviewerName,
                approvedAt: timestamp,
              };
            }
            return d;
          })
        : state.dailyReports;

      return {
        requests: nextRequests,
        dailyReports: nextReports,
      };
    });
  },

  rejectRequest: (requestId, reviewerName, reviewerRole, reason) => {
    const timestamp = 'Baru Saja';
    let matchedDailyId: string | undefined;

    set((state) => {
      const nextRequests = state.requests.map((r) => {
        if (r.id === requestId) {
          matchedDailyId = r.relatedEntityId;
          return {
            ...r,
            status: 'rejected' as const,
            reviewedAt: timestamp,
            reviewerName,
            reviewerRole,
            rejectionReason: reason,
          };
        }
        return r;
      });

      // Synchronize 2-way with Daily Reports
      const nextReports = matchedDailyId
        ? state.dailyReports.map((d) => {
            if (d.id === matchedDailyId) {
              return {
                ...d,
                status: 'REJECTED' as const,
                rejectionReason: reason,
              };
            }
            return d;
          })
        : state.dailyReports;

      return {
        requests: nextRequests,
        dailyReports: nextReports,
      };
    });
  },

  batchApproveRequests: (requestIds, reviewerName, reviewerRole) => {
    const timestamp = 'Baru Saja (Batch)';
    const matchedDailyIds: string[] = [];

    set((state) => {
      const nextRequests = state.requests.map((r) => {
        if (requestIds.includes(r.id)) {
          if (r.relatedEntityId) matchedDailyIds.push(r.relatedEntityId);
          return {
            ...r,
            status: 'approved' as const,
            reviewedAt: timestamp,
            reviewerName,
            reviewerRole,
            approvalNote: 'Disetujui melalui aksi otorisasi massal (Batch Approval).',
          };
        }
        return r;
      });

      const nextReports = state.dailyReports.map((d) => {
        if (matchedDailyIds.includes(d.id)) {
          return {
            ...d,
            status: 'APPROVED' as const,
            approvedBy: reviewerName,
            approvedAt: timestamp,
          };
        }
        return d;
      });

      return {
        requests: nextRequests,
        dailyReports: nextReports,
      };
    });
  },

  addDailyReport: (reportData, requesterName, requesterRole) => {
    const newId = String(Date.now());
    const submittedAt = new Date().toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const newRecord: DailyRecord = {
      ...reportData,
      id: newId,
      status: 'PENDING_REVIEW',
      submittedAt,
    };

    // Build diff fields dynamically
    const diffFields = [
      {
        label: 'Target Harian',
        originalValue: `Rp ${reportData.target.toLocaleString('id-ID')}`,
        proposedValue: `Rp ${reportData.target.toLocaleString('id-ID')}`,
        isChanged: false,
      },
      {
        label: 'Realisasi Pendapatan',
        originalValue: 'Rp 0',
        proposedValue: `Rp ${reportData.revenue.toLocaleString('id-ID')}`,
        diffText: `+Rp ${reportData.revenue.toLocaleString('id-ID')}`,
        isChanged: true,
      },
    ];

    if (reportData.outletName) {
      diffFields.push({
        label: 'Outlet / Unit Kerja',
        originalValue: '-',
        proposedValue: `${reportData.outletCode ?? ''} - ${reportData.outletName}`,
        isChanged: true,
      });
    }

    if (reportData.cashAmount !== undefined || reportData.edcAmount !== undefined || reportData.qrisAmount !== undefined) {
      const c = (reportData.cashAmount ?? 0).toLocaleString('id-ID');
      const e = (reportData.edcAmount ?? 0).toLocaleString('id-ID');
      const q = (reportData.qrisAmount ?? 0).toLocaleString('id-ID');
      diffFields.push({
        label: 'Rincian Kanal Kasir',
        originalValue: '-',
        proposedValue: `Tunai: Rp ${c} | EDC: Rp ${e} | QRIS: Rp ${q}`,
        isChanged: true,
      });
    }

    if (reportData.transactionCount) {
      diffFields.push({
        label: 'Volume Transaksi',
        originalValue: '-',
        proposedValue: `${reportData.transactionCount.toLocaleString('id-ID')} Struk / Pax`,
        isChanged: true,
      });
    }

    if (reportData.attachmentName) {
      diffFields.push({
        label: 'Lampiran Slip Kasir / Settlement',
        originalValue: '-',
        proposedValue: reportData.attachmentName,
        isChanged: true,
      });
    }

    diffFields.push({
      label: 'Catatan Lapangan',
      originalValue: '-',
      proposedValue: reportData.notes || 'Tanpa catatan',
      isChanged: Boolean(reportData.notes),
    });

    // Auto-generate matching ApprovalRequest
    const newApproval: ApprovalRequest = {
      id: `app-daily-${newId}`,
      referenceNo: `REQ-DAILY-${newId.slice(-6)}`,
      category: 'daily_revenue',
      title: reportData.outletName
        ? `Laporan Omzet Harian Divisi ${reportData.divisionName} - ${reportData.outletName} (${reportData.date})`
        : `Laporan Omzet Harian Divisi ${reportData.divisionName} (${reportData.date})`,
      description:
        reportData.notes ||
        `Pengajuan omzet operasional harian divisi ${reportData.divisionName}${reportData.outletName ? ` di unit ${reportData.outletName}` : ''}.`,
      divisionCode: reportData.division,
      divisionName: reportData.divisionName,
      amount: reportData.revenue,
      priority: reportData.revenue >= 100000000 ? 'high' : 'medium',
      status: 'pending_review',
      requesterId: `user-${reportData.division.toLowerCase()}-admin`,
      requesterName,
      requesterRole,
      submittedAt,
      relatedEntityId: newId,
      thresholdBreached: reportData.revenue < reportData.target * 0.8,
      thresholdBreachDetails:
        reportData.revenue < reportData.target * 0.8
          ? 'Realisasi harian di bawah 80% dari target divisi.'
          : undefined,
      diffFields,
    };

    set((state) => ({
      dailyReports: [newRecord, ...state.dailyReports],
      requests: [newApproval, ...state.requests],
    }));

    return newRecord;
  },

  approveDailyReportFromDailyPage: (dailyId, reviewerName) => {
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    set((state) => ({
      dailyReports: state.dailyReports.map((d) => {
        if (d.id === dailyId) {
          return {
            ...d,
            status: 'APPROVED',
            approvedBy: reviewerName,
            approvedAt: timestamp,
          };
        }
        return d;
      }),
      requests: state.requests.map((r) => {
        if (r.relatedEntityId === dailyId) {
          return {
            ...r,
            status: 'approved',
            reviewedAt: timestamp,
            reviewerName,
            reviewerRole: 'Manager/BOD',
            approvalNote: 'Disetujui langsung dari halaman Laporan Harian.',
          };
        }
        return r;
      }),
    }));
  },

  rejectDailyReportFromDailyPage: (dailyId, reviewerName, reason) => {
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    set((state) => ({
      dailyReports: state.dailyReports.map((d) => {
        if (d.id === dailyId) {
          return {
            ...d,
            status: 'REJECTED',
            rejectionReason: reason,
          };
        }
        return d;
      }),
      requests: state.requests.map((r) => {
        if (r.relatedEntityId === dailyId) {
          return {
            ...r,
            status: 'rejected',
            reviewedAt: timestamp,
            reviewerName,
            reviewerRole: 'Manager/BOD',
            rejectionReason: reason,
          };
        }
        return r;
      }),
    }));
  },

  resetToInitial: () => {
    set({
      requests: INITIAL_APPROVAL_REQUESTS,
      dailyReports: INITIAL_DAILY_REPORTS,
    });
  },
}));
