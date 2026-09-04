import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  Building2,
  Eye,
  CheckCheck,
  ShieldCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ApprovalRequest,
  ApprovalCategory,
  ApprovalStatus,
  ApprovalPriority,
  CATEGORY_METADATA,
  PRIORITY_METADATA,
  STATUS_METADATA,
  INITIAL_APPROVAL_REQUESTS,
} from './approvalTypes';
import { ApprovalReviewModal } from './ApprovalReviewModal';
import { useToast } from '../ui/Toast';

export interface ApprovalInboxCentralProps {
  initialRequests?: ApprovalRequest[];
  onApproveRequest?: (id: string, note?: string) => void;
  onRejectRequest?: (id: string, reason: string) => void;
  userRole?: string;
  userDivision?: string;
  className?: string;
}

export function ApprovalInboxCentral({
  initialRequests = INITIAL_APPROVAL_REQUESTS,
  onApproveRequest,
  onRejectRequest,
  userRole = 'BOD',
  userDivision,
  className = '',
}: ApprovalInboxCentralProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>(initialRequests);
  const [selectedDivision, setSelectedDivision] = useState<string>('SEMUA');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending_review');
  const [selectedPriority, setSelectedPriority] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRequest, setActiveRequest] = useState<ApprovalRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  const isBod = userRole === 'BOD' || userRole === 'SUPERADMIN';
  const isManager = userRole === 'MANAGER';
  // PIC / Staff can submit/view, but cannot approve/reject
  const canReview = isBod || isManager;

  // Scope Filtering by User Role
  const scopedRequests = useMemo(() => {
    return requests.filter((r) => {
      // BOD & Superadmin see all divisions
      if (isBod || !userDivision) return true;
      // Manager & PIC see only their division
      return r.divisionCode === userDivision || r.divisionCode === 'ALL';
    });
  }, [requests, isBod, userDivision]);

  // Combined Multi-Filter
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter((r) => {
      const matchDivision =
        selectedDivision === 'SEMUA' || r.divisionCode === selectedDivision;
      const matchCategory =
        selectedCategory === 'SEMUA' || r.category === selectedCategory;
      const matchStatus =
        selectedStatus === 'SEMUA' || r.status === selectedStatus;
      const matchPriority =
        selectedPriority === 'SEMUA' || r.priority === selectedPriority;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        r.referenceNo.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.requesterName.toLowerCase().includes(query) ||
        r.divisionName.toLowerCase().includes(query);

      return (
        matchDivision &&
        matchCategory &&
        matchStatus &&
        matchPriority &&
        matchSearch
      );
    });
  }, [
    scopedRequests,
    selectedDivision,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    searchQuery,
  ]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const pending = scopedRequests.filter((r) => r.status === 'pending_review');
    const approved = scopedRequests.filter((r) => r.status === 'approved');
    const rejected = scopedRequests.filter((r) => r.status === 'rejected');
    const totalPendingExposure = pending.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      totalPendingExposure,
    };
  }, [scopedRequests]);

  const handleOpenReview = (request: ApprovalRequest) => {
    setActiveRequest(request);
    setIsModalOpen(true);
  };

  const handleApprove = (requestId: string, note?: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          status: 'approved',
          reviewedAt: 'Baru Saja',
          reviewerId: 'current-user-id',
          reviewerName: isBod ? 'Direksi (BOD)' : 'Manager Divisi',
          reviewerRole: isBod ? 'BOD' : 'MANAGER',
          approvalNote: note || 'Disetujui sesuai SOP.',
        };
      })
    );
    setSelectedIds((prev) => prev.filter((id) => id !== requestId));
    if (onApproveRequest) {
      onApproveRequest(requestId, note);
    }
    toast(
      `Tiket ${requestId} berhasil disetujui. Pengaju telah menerima notifikasi resmi.`,
      'success'
    );
  };

  const handleReject = (requestId: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          status: 'rejected',
          reviewedAt: 'Baru Saja',
          reviewerId: 'current-user-id',
          reviewerName: isBod ? 'Direksi (BOD)' : 'Manager Divisi',
          reviewerRole: isBod ? 'BOD' : 'MANAGER',
          rejectionReason: reason,
        };
      })
    );
    setSelectedIds((prev) => prev.filter((id) => id !== requestId));
    if (onRejectRequest) {
      onRejectRequest(requestId, reason);
    }
    toast(
      `Tiket ${requestId} dikembalikan ke pengaju dengan catatan revisi.`,
      'error'
    );
  };

  // Batch Approval for selected pending requests
  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (!selectedIds.includes(r.id)) return r;
        return {
          ...r,
          status: 'approved',
          reviewedAt: 'Baru Saja (Batch)',
          reviewerId: 'current-user-id',
          reviewerName: isBod ? 'Direksi (BOD)' : 'Manager Divisi',
          reviewerRole: isBod ? 'BOD' : 'MANAGER',
          approvalNote: 'Disetujui melalui aksi otorisasi massal (Batch Approval).',
        };
      })
    );
    const count = selectedIds.length;
    setSelectedIds([]);
    toast(
      `${count} permohonan telah disetujui secara bersamaan.`,
      'success'
    );
  };

  const toggleSelectAll = () => {
    const pendingInFilter = filteredRequests
      .filter((r) => r.status === 'pending_review')
      .map((r) => r.id);
    if (selectedIds.length === pendingInFilter.length && pendingInFilter.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingInFilter);
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="approval-inbox-central">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100">
              <Inbox className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-navy">
                Pusat Persetujuan Finansial Berjenjang
              </h1>
              <p className="text-xs text-slate-500">
                Pusat otorisasi transaksi operasional dan finansial sensitif dengan prinsip <em>Maker-Checker</em>.
              </p>
            </div>
          </div>
        </div>

        {/* User Scope Indicator */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-600">
            Peran Akses: <strong>{userRole}</strong>
            {userDivision ? ` (${userDivision})` : ' (Seluruh Divisi)'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            Kewenangan: <strong>{canReview ? 'Checker (Otorisator)' : 'Maker (Submitter)'}</strong>
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Menunggu Persetujuan */}
        <div
          onClick={() => setSelectedStatus('pending_review')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'pending_review'
              ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
          data-testid="stat-card-pending"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu Tindakan</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-amber-900">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">Tiket Tertunda</span>
          </div>
        </div>

        {/* Card 2: Disetujui */}
        <div
          onClick={() => setSelectedStatus('approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'approved'
              ? 'bg-emerald-50/70 border-emerald-300 shadow-xs ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
          data-testid="stat-card-approved"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Telah Disetujui</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-emerald-900">
              {metrics.approvedCount}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Tiket Lolos</span>
          </div>
        </div>

        {/* Card 3: Ditolak / Perlu Revisi */}
        <div
          onClick={() => setSelectedStatus('rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'rejected'
              ? 'bg-rose-50/70 border-rose-300 shadow-xs ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
          data-testid="stat-card-rejected"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ditolak / Revisi</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-rose-900">
              {metrics.rejectedCount}
            </span>
            <span className="text-xs text-rose-700 font-medium">Perlu Tindak Lanjut</span>
          </div>
        </div>

        {/* Card 4: Total Nilai Eksposur Menunggu */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Eksposur Menunggu</span>
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-navy block truncate">
              Rp {metrics.totalPendingExposure.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-400">Total nilai transaksi tertunda</span>
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor tiket REQ, judul, atau pengaju..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              data-testid="approval-search-input"
            />
          </div>

          {/* Batch Action Button (Visible if items selected) */}
          {canReview && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs font-semibold text-sky-900 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                {selectedIds.length} tiket dipilih
              </span>
              <button
                type="button"
                onClick={handleBatchApprove}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                data-testid="btn-batch-approve"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Setujui Terpilih
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 mr-2 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Division Filter */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            disabled={!isBod && !!userDivision}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-sky-500 disabled:opacity-60"
            data-testid="filter-division-select"
          >
            <option value="SEMUA">Semua Divisi (7 Unit)</option>
            <option value="WRAP">Wrapping (WRAP)</option>
            <option value="CELL">Cellular (CELL)</option>
            <option value="REFL">Refleksi (REFL)</option>
            <option value="MINI">Minimarket (MINI)</option>
            <option value="FNB">Food & Beverage (FNB)</option>
            <option value="FIN">Finance (FIN)</option>
            <option value="MC">Money Changer (MC)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-sky-500"
            data-testid="filter-category-select"
          >
            <option value="SEMUA">Semua Kategori</option>
            <option value="daily_revenue">Pendapatan Harian</option>
            <option value="bank_reconciliation">Penyesuaian Bank</option>
            <option value="period_closing">Periode Akuntansi</option>
            <option value="receivable_writeoff">Penghapusan Piutang</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-sky-500"
            data-testid="filter-status-select"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="pending_review">Menunggu Persetujuan</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak / Revisi</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-sky-500"
            data-testid="filter-priority-select"
          >
            <option value="SEMUA">Semua Prioritas</option>
            <option value="critical">Kritis</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>

          {/* Reset Filters button */}
          {(selectedDivision !== 'SEMUA' ||
            selectedCategory !== 'SEMUA' ||
            selectedStatus !== 'pending_review' ||
            selectedPriority !== 'SEMUA' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDivision('SEMUA');
                setSelectedCategory('SEMUA');
                setSelectedStatus('pending_review');
                setSelectedPriority('SEMUA');
                setSearchQuery('');
              }}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline px-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Approval Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center" data-testid="empty-approval-state">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-navy">Tidak Ada Pengajuan Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada tiket persetujuan yang cocok dengan kriteria filter saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  {canReview && (
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length ===
                            filteredRequests.filter((r) => r.status === 'pending_review').length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        aria-label="Pilih semua pengajuan"
                      />
                    </th>
                  )}
                  <th className="py-3 px-3">No. Tiket & Kategori</th>
                  <th className="py-3 px-3">Judul Pengajuan</th>
                  <th className="py-3 px-3">Divisi</th>
                  <th className="py-3 px-3">Pengaju (Maker)</th>
                  <th className="py-3 px-3">Nilai Paparan</th>
                  <th className="py-3 px-3">Prioritas</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const categoryInfo = CATEGORY_METADATA[req.category];
                  const priorityInfo = PRIORITY_METADATA[req.priority];
                  const statusInfo = STATUS_METADATA[req.status];
                  const isSelected = selectedIds.includes(req.id);
                  const isPending = req.status === 'pending_review';

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-sky-50/40' : ''
                      }`}
                      data-testid={`approval-row-${req.id}`}
                    >
                      {canReview && (
                        <td className="py-3 px-3 text-center">
                          {isPending ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectId(req.id)}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                              aria-label={`Pilih tiket ${req.referenceNo}`}
                            />
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-navy">{req.referenceNo}</div>
                        <span
                          className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryInfo.badgeClass}`}
                        >
                          {categoryInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {req.title}
                        </div>
                        {req.thresholdBreached && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-0.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Batas Ambang Terlampaui</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">
                          {req.divisionName}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {req.divisionCode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-700">{req.requesterName}</div>
                        <div className="text-[10px] text-slate-400">{req.submittedAt}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {req.amount > 0
                          ? `Rp ${req.amount.toLocaleString('id-ID')}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityInfo.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`}
                          />
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1 ${
                            isPending && canReview
                              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          data-testid={`btn-review-${req.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending && canReview ? 'Tinjau & Putuskan' : 'Detail'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Review */}
      <ApprovalReviewModal
        request={activeRequest}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveRequest(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        canReview={canReview}
      />
    </div>
  );
}
