import { useState } from 'react';
import { Calendar, Plus, Filter, CheckCircle2, AlertCircle, Clock, ShieldCheck, Check, X, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../session/AuthContext';
import { hasCapability } from '../session/capability';

interface DailyRecord {
  id: string;
  date: string;
  division: 'WRAP' | 'CELL' | 'REFL' | 'MINI' | 'FNB' | 'FIN' | 'MC';
  divisionName: string;
  revenue: number;
  target: number;
  notes: string;
  updatedBy: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  submittedAt?: string;
}

const INITIAL_REPORTS: DailyRecord[] = [
  { id: '1', date: '2026-09-03', division: 'WRAP', divisionName: 'Wrapping', revenue: 45000000, target: 40000000, notes: 'Promosi Bundling Hari Pelanggan', updatedBy: 'Admin Wrapping', status: 'PENDING_REVIEW', submittedAt: '03 Sep 2026 08:30' },
  { id: '2', date: '2026-09-03', division: 'CELL', divisionName: 'Cellular', revenue: 110000000, target: 100000000, notes: 'Launching Aksesoris Flagship', updatedBy: 'Admin Cellular', status: 'APPROVED', approvedBy: 'Manager Cellular', approvedAt: '03 Sep 2026 09:15', submittedAt: '03 Sep 2026 08:10' },
  { id: '3', date: '2026-09-03', division: 'REFL', divisionName: 'Refleksi', revenue: 28000000, target: 30000000, notes: 'Jam sibuk sore hari', updatedBy: 'Admin Refleksi', status: 'APPROVED', approvedBy: 'Manager Refleksi', approvedAt: '03 Sep 2026 09:40', submittedAt: '03 Sep 2026 08:45' },
  { id: '4', date: '2026-09-03', division: 'MINI', divisionName: 'Minimarket', revenue: 65000000, target: 60000000, notes: 'Penjualan groceries stabil', updatedBy: 'Admin Minimarket', status: 'PENDING_REVIEW', submittedAt: '03 Sep 2026 08:50' },
  { id: '5', date: '2026-09-03', division: 'FNB', divisionName: 'Food & Beverage', revenue: 85000000, target: 75000000, notes: 'Event Kuliner Malam', updatedBy: 'Admin FnB', status: 'APPROVED', approvedBy: 'Manager FnB', approvedAt: '03 Sep 2026 10:00', submittedAt: '03 Sep 2026 09:05' },
  { id: '6', date: '2026-09-03', division: 'FIN', divisionName: 'Finance', revenue: 150000000, target: 140000000, notes: 'Pencatatan pendapatan jasa', updatedBy: 'Admin Finance', status: 'PENDING_REVIEW', submittedAt: '03 Sep 2026 09:20' },
  { id: '7', date: '2026-09-03', division: 'MC', divisionName: 'Money Changer', revenue: 210000000, target: 200000000, notes: 'Lonjakan transaksi valas', updatedBy: 'Admin Money Changer', status: 'APPROVED', approvedBy: 'Manager Money Changer', approvedAt: '03 Sep 2026 10:30', submittedAt: '03 Sep 2026 09:30' },
];

export default function DailyReportPage() {
  const { user } = useAuth();
  const isBod = user?.role === 'BOD';
  const isPicViewOnly = !hasCapability(user?.role as never, 'write:revenue', user?.divisionCode);
  const isManager = user?.role === 'MANAGER' || user?.role === 'SUPERADMIN';
  const userDivision = user?.divisionCode; // NULL jika BOD, atau 'WRAP'/'CELL'/dll.

  const [reports, setReports] = useState<DailyRecord[]>(INITIAL_REPORTS);
  const [selectedDivision, setSelectedDivision] = useState<string>('SEMUA');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter Data Berdasarkan Scope Divisi Pengguna
  // Admin, Manager, dan PIC HANYA melihat data dari divisinya sendiri.
  // BOD dapat melihat semua data 7 divisi.
  const scopedReports = reports.filter(r => {
    if (isBod || !userDivision) return true;
    return r.division === userDivision;
  });

  const filteredReports = selectedDivision === 'SEMUA' ? scopedReports : scopedReports.filter(r => r.division === selectedDivision);

  // Form State (Default dikunci ke divisi milik user jika ada)
  const [formDate, setFormDate] = useState('2026-09-03');
  const [formDivision, setFormDivision] = useState<'WRAP' | 'CELL' | 'REFL' | 'MINI' | 'FNB' | 'FIN' | 'MC'>(
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
      WRAP: 'Wrapping', CELL: 'Cellular', REFL: 'Refleksi', MINI: 'Minimarket', FNB: 'Food & Beverage', FIN: 'Finance', MC: 'Money Changer'
    };

    const newRecord: DailyRecord = {
      id: String(Date.now()),
      date: formDate,
      division: targetDivision as DailyRecord['division'],
      divisionName: divNames[targetDivision] ?? 'Divisi',
      revenue: rev,
      target: 40000000,
      notes: formNotes,
      updatedBy: user?.name ?? 'Admin Divisi',
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
    };

    setReports([newRecord, ...reports]);
    setIsModalOpen(false);
    showToast(`✅ Laporan Omset ${divNames[targetDivision]} berhasil disubmit! Menunggu ACC Manager.`);
  };

  const handleApprove = (id: string, name: string) => {
    setReports(reports.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: 'APPROVED',
          approvedBy: user?.name ?? 'Manager',
          approvedAt: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
        };
      }
      return r;
    }));
    showToast(`✅ Laporan ${name} berhasil di-ACC! Otomatis diteruskan ke Laporan BOD.`);
  };

  const handleReject = (id: string, name: string) => {
    setReports(reports.map(r => {
      if (r.id === id) {
        return { ...r, status: 'REJECTED' };
      }
      return r;
    }));
    showToast(`⚠️ Laporan ${name} dikembalikan untuk revisi Admin.`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up relative">
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
              {isBod ? 'Executive Monitoring 7 Divisi' : `Hanya Menampilkan Data Khusus Divisi ${userDivision}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!isPicViewOnly && (
              <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white text-xs shadow-md">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Input Omset Harian
              </Button>
            )}
          </div>
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

      {/* Main Table: Input & ACC Status per Divisi */}
      <section className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">Audit Trail & Status Verifikasi Divisi</h2>
            <p className="text-xs text-slate-500">Log transaksi harian yang disesuaikan dengan scope hak akses akun Anda</p>
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
                >
                  <option value="SEMUA">Semua Divisi (7 Divisi)</option>
                  <option value="WRAP">WRAP - Wrapping</option>
                  <option value="CELL">CELL - Cellular</option>
                  <option value="REFL">REFL - Refleksi</option>
                  <option value="MINI">MINI - Minimarket</option>
                  <option value="FNB">FNB - Food & Beverage</option>
                  <option value="FIN">FIN - Finance</option>
                  <option value="MC">MC - Money Changer</option>
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
              {filteredReports.length > 0 ? filteredReports.map((item) => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
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
                      <span className="inline-flex items-center gap-1 rounded-pill bg-success-light px-2.5 py-0.5 text-xs font-bold text-success">
                        <CheckCircle2 className="h-3 w-3" /> ACC Approved
                      </span>
                    )}
                    {item.status === 'PENDING_REVIEW' && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-warning-light px-2.5 py-0.5 text-xs font-bold text-warning">
                        <Clock className="h-3 w-3" /> Pending ACC
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-danger-light px-2.5 py-0.5 text-xs font-bold text-danger">
                        <AlertCircle className="h-3 w-3" /> Perlu Revisi
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {item.approvedBy ? (
                      <div>
                        <p className="font-bold text-success">Approved by {item.approvedBy}</p>
                        <p className="text-[10px] text-slate-400">Timestamp: {item.approvedAt ?? 'Real-Time'}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Menunggu persetujuan Manager</span>
                    )}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3.5 text-center">
                      {item.status === 'PENDING_REVIEW' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id, item.divisionName)}
                            className="inline-flex items-center gap-1 rounded-card bg-success px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-success-dark transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" /> ACC
                          </button>
                          <button
                            onClick={() => handleReject(item.id, item.divisionName)}
                            className="inline-flex items-center gap-1 rounded-card bg-danger/10 px-2 py-1 text-xs font-bold text-danger hover:bg-danger/20 transition-colors"
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
              )) : (
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

      {/* Modal Input Omset Harian (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-navy">Input Omset Harian</h3>
            <p className="text-xs text-slate-500 mt-1">Data akan terkirim ke Manager Divisi untuk di-ACC.</p>
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
                    <option value="FIN">FIN - Finance</option>
                    <option value="MC">MC - Money Changer</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Nominal Omset (Rp)</label>
                <Input type="number" value={formRevenue} onChange={(e) => setFormRevenue(e.target.value)} required placeholder="Contoh: 45000000" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Catatan Operasional</label>
                <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Contoh: Promo bundling weekend" />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit">Submit ke Manager</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
