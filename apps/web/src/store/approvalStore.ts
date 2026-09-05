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
  revenue: number;
  target: number;
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
    revenue: 45000000,
    target: 40000000,
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
    revenue: 110000000,
    target: 100000000,
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
    revenue: 28000000,
    target: 30000000,
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
    revenue: 65000000,
    target: 60000000,
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
    revenue: 85000000,
    target: 75000000,
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
    revenue: 150000000,
    target: 140000000,
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
    revenue: 210000000,
    target: 200000000,
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

    // Auto-generate matching ApprovalRequest
    const newApproval: ApprovalRequest = {
      id: `app-daily-${newId}`,
      referenceNo: `REQ-DAILY-${newId.slice(-6)}`,
      category: 'daily_revenue',
      title: `Laporan Omzet Harian Divisi ${reportData.divisionName} (${reportData.date})`,
      description:
        reportData.notes ||
        `Pengajuan omzet operasional harian divisi ${reportData.divisionName}.`,
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
      diffFields: [
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
        {
          label: 'Catatan Lapangan',
          originalValue: '-',
          proposedValue: reportData.notes || 'Tanpa catatan',
          isChanged: Boolean(reportData.notes),
        },
      ],
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
