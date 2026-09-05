import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  X,
  Lock,
  CheckCircle,
  Inbox,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../session/AuthContext';
import { hasCapability } from '../session/capability';
import { useApprovalStore, DailyRecord } from '../store/approvalStore';
import { ApprovalInboxCentral } from '../components/approvals/ApprovalInboxCentral';

export default function DailyReportPage() {
  const { user } = useAuth();
  const isBod = user?.role === 'BOD';
  const isPicViewOnly = !hasCapability(user?.role as never, 'write:revenue', user?.divisionCode);
  const isManager = user?.role === 'MANAGER' || user?.role === 'SUPERADMIN';
  const userDivision = user?.divisionCode; // NULL jika BOD, atau 'WRAP'/'CELL'/dll.

  // Use Centralized Approval & Daily Report Store
  const {
    dailyReports: reports,
    addDailyReport,
    approveDailyReportFromDailyPage,
    rejectDailyReportFromDailyPage,
  } = useApprovalStore();

  const [activeTab, setActiveTab] = useState<'daily' | 'approvals'>('daily');
  const [selectedDivision, setSelectedDivision] = useState<string>('SEMUA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Reject Reason Modal State
  const [rejectItem, setRejectItem] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Filter Data Berdasarkan Scope Divisi Pengguna
  // Admin, Manager, dan PIC HANYA melihat data dari divisinya sendiri.
  // BOD dapat melihat semua data 7 divisi.
  const scopedReports = reports.filter((r) => {
    if (isBod || !userDivision) return true;
    return r.division === userDivision;
  });

  const filteredReports =
    selectedDivision === 'SEMUA'
      ? scopedReports
      : scopedReports.filter((r) => r.division === selectedDivision);

  const pendingCount = scopedReports.filter((r) => r.status === 'PENDING_REVIEW').length;

  // Form State (Default dikunci ke divisi milik user jika ada)
  const [formDate, setFormDate] = useState('2026-09-03');
  const [formDivision, setFormDivision] = useState<DailyRecord['division']>(
    (userDivision as DailyRecord['division']) ?? 'WRAP'
  );
  const [formRevenue, setFormRevenue] = useState('45000000');
  const [formNotes, setFormNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveDaily = (e: React.FormEvent) => {
    e.preventDefault();
    const rev = parseFloat(formRevenue) || 0;
    const targetDivision = userDivision ?? formDivision;
    const divNames: Record<string, string> = {
      WRAP: 'Wrapping',
      CELL: 'Cellular',
      REFL: 'Refleksi',
      MINI: 'Minimarket',
      FNB: 'Food & Beverage',
      FIN: 'Finance',
      MC: 'Money Changer',
    };

    addDailyReport(
      {
        date: formDate,
        division: targetDivision as DailyRecord['division'],
        divisionName: divNames[targetDivision] ?? 'Divisi',
        revenue: rev,
        target: 40000000,
        notes: formNotes,
        updatedBy: user?.name ?? 'Admin Divisi',
      },
      user?.name ?? 'Admin Divisi',
      user?.role ?? 'PIC'
    );

    setIsModalOpen(false);
    showToast(`✅ Laporan Omset ${divNames[targetDivision]} berhasil disubmit! Menunggu ACC Manager.`);
  };

  const handleApprove = (id: string, name: string) => {
    approveDailyReportFromDailyPage(id, user?.name ?? 'Manager');
    showToast(`✅ Laporan ${name} berhasil di-ACC! Disinkronkan ke Pusat Persetujuan Finansial.`);
  };

  const handleOpenRejectModal = (id: string, name: string) => {
    setRejectItem({ id, name });
    setRejectReason('');
    setRejectError(null);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      setRejectError('Alasan penolakan wajib diisi minimal 5 karakter.');
      return;
    }
    if (!rejectItem) return;

    rejectDailyReportFromDailyPage(rejectItem.id, user?.name ?? 'Manager', trimmed);
    showToast(`⚠️ Laporan ${rejectItem.name} dikembalikan untuk revisi Admin.`);
    setRejectItem(null);
    setRejectReason('');
    setRejectError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up relative" data-testid="daily-report-page">
      {/* Pop-up Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-card-lg bg-navy text-white px-4 py-3 shadow-2xl border border-primary/30 animate-fade-in-down text-xs font-semibold">
          <CheckCircle className="h-4 w-4 text-success" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-navy via-[#1e293b] to-navy p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-primary-light backdrop-blur-md">
              <Calendar className="h-3.5 w-3.5" /> Scope Terisolasi: {userDivision ? `Divisi ${userDivision}` : 'Lintas 7 Divisi (BOD)'}
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Report Harian Divisi</h1>
            <p className="mt-1 text-sm text-slate-300">
              {isBod ? 'Executive Monitoring & Tata Kelola 7 Divisi' : `Hanya Menampilkan Data Khusus Divisi ${userDivision}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!isPicViewOnly && (
              <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white text-xs shadow-md" data-testid="btn-input-omset">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Input Omset Harian
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-white text-navy shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            data-testid="tab-daily-table"
          >
            <Calendar className="w-4 h-4" />
            <span>Tabel Laporan Harian</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {scopedReports.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'bg-white text-navy shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            data-testid="tab-approvals-hub"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pusat Persetujuan (Approval Hub)</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse font-mono">
                {pendingCount} Pending
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Scope Info Badge */}
      {!isBod && userDivision && (
        <section className="rounded-card-lg border border-info/30 bg-info/10 p-3.5 flex items-center justify-between text-xs text-navy font-semibold">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-info" />
            <span>Perizinan Scope Terkunci: Anda sedang mengakses data khusus Divisi <strong>{userDivision}</strong>.</span>
          </div>
          <span className="rounded-pill bg-info/20 px-2.5 py-0.5 text-info font-mono">Isolated Scope</span>
        </section>
      )}

      {/* TAB CONTENT 1: Daily Report Table */}
      {activeTab === 'daily' && (
        <section className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm animate-fade-in">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-navy">Audit Trail & Status Verifikasi Divisi</h2>
              <p className="text-xs text-slate-500">
                Log transaksi harian yang disinkronkan secara reaktif dengan alur persetujuan enterprise
              </p>
            </div>
            {isBod && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-1.5 text-xs">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium text-slate-600">Filter Divisi BOD:</span>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="bg-transparent font-bold text-navy focus:outline-none"
                    data-testid="select-daily-division-filter"
                  >
                    <option value="SEMUA">Semua Divisi (7 Divisi)</option>
                    <option value="WRAP">WRAP - Wrapping</option>
                    <option value="CELL">CELL - Cellular</option>
                    <option value="REFL">REFL - Refleksi</option>
                    <option value="MINI">MINI - Minimarket</option>
                    <option value="FNB">FNB - Food & Beverage</option>
                    <option value="MC">MC - Money Changer</option>
                    <option value="ACC">ACC - Accounting & Finance</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 overflow-x-auto rounded-card-lg border border-line/40">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Tanggal & Divisi</th>
                  <th className="px-4 py-3.5 text-right">Omset Input (Rp)</th>
                  <th className="px-4 py-3.5 text-right">Target (Rp)</th>
                  <th className="px-4 py-3.5">Admin Inputer</th>
                  <th className="px-4 py-3.5 text-center">Status ACC</th>
                  <th className="px-4 py-3.5">Audit Trail (Persetujuan Manager)</th>
                  {isManager && <th className="px-4 py-3.5 text-center">Aksi Manager</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40 font-medium">
                {filteredReports.length > 0 ? (
                  filteredReports.map((item) => (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors" data-testid={`daily-row-${item.id}`}>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-navy">{item.division} - {item.divisionName}</p>
                        <p className="text-xs font-mono text-slate-500">{item.date}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-navy">
                        Rp {item.revenue.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                        Rp {item.target.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">
                        <p>{item.updatedBy}</p>
                        <p className="text-[10px] text-slate-400">{item.submittedAt}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {item.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-success-light px-2.5 py-0.5 text-xs font-bold text-success border border-success/20">
                            <CheckCircle2 className="h-3 w-3" /> ACC Approved
                          </span>
                        )}
                        {item.status === 'PENDING_REVIEW' && (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-warning-light px-2.5 py-0.5 text-xs font-bold text-warning border border-warning/20">
                            <Clock className="h-3 w-3" /> Pending ACC
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-danger-light px-2.5 py-0.5 text-xs font-bold text-danger border border-danger/20">
                            <AlertCircle className="h-3 w-3" /> Perlu Revisi
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {item.status === 'APPROVED' && item.approvedBy ? (
                          <div>
                            <p className="font-bold text-success">Approved by {item.approvedBy}</p>
                            <p className="text-[10px] text-slate-400">Timestamp: {item.approvedAt ?? 'Real-Time'}</p>
                          </div>
                        ) : item.status === 'REJECTED' ? (
                          <div>
                            <p className="font-bold text-danger">Ditolak Checker</p>
                            {item.rejectionReason && (
                              <p className="text-[11px] text-danger/80 italic mt-0.5">
                                &ldquo;{item.rejectionReason}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 italic">Menunggu persetujuan</span>
                            <button
                              type="button"
                              onClick={() => setActiveTab('approvals')}
                              className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-0.5 ml-2"
                            >
                              <span>Hub</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      {isManager && (
                        <td className="px-4 py-3.5 text-center">
                          {item.status === 'PENDING_REVIEW' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleApprove(item.id, item.divisionName)}
                                className="inline-flex items-center gap-1 rounded-card bg-success px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-success-dark transition-colors"
                                data-testid={`btn-acc-daily-${item.id}`}
                              >
                                <Check className="h-3.5 w-3.5" /> ACC
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(item.id, item.divisionName)}
                                className="inline-flex items-center gap-1 rounded-card bg-danger/10 px-2 py-1 text-xs font-bold text-danger hover:bg-danger/20 transition-colors"
                                data-testid={`btn-reject-daily-${item.id}`}
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">Verified</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                      Tidak ada data transaksi untuk divisi ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB CONTENT 2: Approval Hub Inbox */}
      {activeTab === 'approvals' && (
        <section className="animate-fade-in" data-testid="approval-hub-tab-content">
          <ApprovalInboxCentral
            userRole={user?.role}
            userDivision={userDivision ?? undefined}
          />
        </section>
      )}

      {/* Modal Input Omset Harian (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-navy">Input Omset Harian</h3>
            <p className="text-xs text-slate-500 mt-1">Data akan otomatis diteruskan ke Pusat Persetujuan Finansial.</p>
            <form onSubmit={handleSaveDaily} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Tanggal</label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Divisi Operasional</label>
                {userDivision ? (
                  <div className="flex items-center justify-between rounded-input border border-line bg-surface p-2.5 text-sm font-bold text-navy">
                    <span>{userDivision}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-normal">
                      <Lock className="h-3.5 w-3.5" /> Scope Terkunci
                    </span>
                  </div>
                ) : (
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value as DailyRecord['division'])}
                    className="w-full rounded-input border border-line p-2.5 text-sm font-medium text-navy focus:border-primary focus:outline-none"
                  >
                    <option value="WRAP">WRAP - Wrapping</option>
                    <option value="CELL">CELL - Cellular</option>
                    <option value="REFL">REFL - Refleksi</option>
                    <option value="MINI">MINI - Minimarket</option>
                    <option value="FNB">FNB - Food & Beverage</option>
                    <option value="MC">MC - Money Changer</option>
                    <option value="ACC">ACC - Accounting & Finance</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Nominal Omset (Rp)</label>
                <Input
                  type="number"
                  value={formRevenue}
                  onChange={(e) => setFormRevenue(e.target.value)}
                  required
                  placeholder="Contoh: 45000000"
                  data-testid="input-revenue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Catatan Operasional</label>
                <Input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Promo bundling weekend"
                  data-testid="input-notes"
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" data-testid="btn-submit-daily-report">
                  Submit ke Manager
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Alasan Penolakan (Mandatory Rejection Remark) */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-fade-in-up">
            <div className="flex items-center gap-2.5 text-rose-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-navy">
                Kembalikan Laporan {rejectItem.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              SOP Otorisasi: Anda wajib menyertakan alasan penolakan agar staf divisi dapat memperbaiki laporan.
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label
                  htmlFor="daily-reject-reason-textarea"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Alasan Penolakan <span className="text-rose-600">* (Wajib, min 5 karakter)</span>
                </label>
                <textarea
                  id="daily-reject-reason-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (e.target.value.trim().length >= 5) {
                      setRejectError(null);
                    }
                  }}
                  placeholder="Contoh: Bukti slip kasir belum sesuai dengan fisik uang tunai..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-navy focus:outline-none focus:ring-1 focus:ring-rose-500"
                  data-testid="daily-reject-reason-textarea"
                />
                {rejectError && (
                  <p className="text-[11px] font-medium text-rose-600 mt-1">
                    {rejectError}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setRejectItem(null);
                    setRejectReason('');
                    setRejectError(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={rejectReason.trim().length < 5}
                  className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                  data-testid="btn-confirm-reject-daily"
                >
                  Kirim Penolakan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
