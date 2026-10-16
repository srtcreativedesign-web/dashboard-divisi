import { useState, useEffect } from 'react';
import { projectApi } from '../../../api/projects';
import { ProjectReportPreview } from '../../../api/bod';
import { formatRupiah } from '../../../utils/format';
import { useAuth } from '../../../session/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../components/states';
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  AlertCircle,
  RotateCcw,
  Check,
  Lock,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { MilestoneGanttChart } from '../components/MilestoneGanttChart';

export default function ProjectReportSubmitPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [preview, setPreview] = useState<ProjectReportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Return revision modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'rab' | 'petty_cash' | 'milestones'>('overview');

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' && (user?.divisionCode === 'PROJECT' || !user?.divisionCode);
  const isBod = user?.role === 'BOD';

  const fetchPreview = async (start = startDate, end = endDate) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getReportPreview(start, end);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pratinjau laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview(startDate, endDate);
  }, []);

  const handleApprove = async () => {
    if (!preview?.id) return;
    if (!window.confirm('Setujui laporan proyek ini dan teruskan langsung ke Dashboard BOD?')) {
      return;
    }

    try {
      setActionLoading(true);
      await projectApi.approveReport(preview.id);
      toast('Laporan berhasil disetujui & resmi diterbitkan ke Dashboard BOD', 'success');
      await fetchPreview(startDate, endDate);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menyetujui laporan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!preview?.id) return;
    if (!returnNotes.trim()) {
      toast('Catatan alasan revisi wajib diisi', 'error');
      return;
    }

    try {
      setActionLoading(true);
      await projectApi.returnReport(preview.id, returnNotes.trim());
      toast('Laporan berhasil dikembalikan ke Admin Project beserta catatan revisi', 'success');
      setReturnModalOpen(false);
      setReturnNotes('');
      await fetchPreview(startDate, endDate);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal mengembalikan laporan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const metricsMap = (preview?.metrics || []).reduce<Record<string, number>>((acc, m) => {
    acc[m.metric_key] = typeof m.metric_value === 'string' ? parseFloat(m.metric_value) : m.metric_value;
    return acc;
  }, {});

  // Chart 1: Financial conversion
  const financialChartData = [
    { name: 'Nilai Kontrak', value: metricsMap.contract_value_total || 0, color: '#0284c7' },
    { name: 'Anggaran RAB', value: metricsMap.total_budget_rab || 0, color: '#6366f1' },
    { name: 'Tagihan (Inv)', value: metricsMap.invoiced_period || 0, color: '#0ea5e9' },
    { name: 'Kas Masuk', value: metricsMap.cash_collected_period || 0, color: '#10b981' },
    { name: 'Biaya Aktual', value: metricsMap.actual_expenses_period || 0, color: '#f59e0b' },
    { name: 'Sisa Piutang', value: metricsMap.outstanding_receivables || 0, color: '#ef4444' },
  ];

  // Chart 2: Project status distribution
  const statusData = [
    { name: 'Berjalan', value: metricsMap.active_projects_count || 0, color: '#0284c7' },
    { name: 'Selesai', value: metricsMap.completed_projects_count || 0, color: '#10b981' },
    { name: 'Tertunda', value: metricsMap.on_hold_projects_count || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Chart 3: Progress per project
  const progressBreakdown = (preview?.breakdowns || []).map(b => ({
    name: b.entity_name.length > 20 ? b.entity_name.substring(0, 18) + '...' : b.entity_name,
    fullName: b.entity_name,
    progress: typeof b.figures.progress_pct === 'number' ? b.figures.progress_pct : parseFloat(String(b.figures.progress_pct || 0)),
    contract: Number(b.figures.contract_value || 0),
    expense: Number(b.figures.actual_expense || 0),
  }));

  return (
    <div className="space-y-6 pb-12" data-testid="project-report-submit-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-card-lg border border-line bg-white p-6 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold text-navy">Laporan Divisi ke BOD</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Input & sinkronisasi data proyek otomatis tersimpan sebagai pengajuan menunggu verifikasi Manager.'
              : isManager
              ? 'Tinjau konsolidasi data keuangan & progres proyek sebelum disahkan ke Dewan Direksi.'
              : 'Kompilasi otomatis data keuangan, progres fisik, dan portofolio proyek untuk Dewan Direksi.'}
          </p>
        </div>

        {/* Period Filter & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isManager ? (
            <div className="flex items-center gap-2 rounded-card border border-line bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Periode: <strong>{startDate}</strong> s/d <strong>{endDate}</strong></span>
              <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">Mode Review</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-card border border-line bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none"
                aria-label="Tanggal Awal"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-none"
                aria-label="Tanggal Akhir"
              />
            </div>
          )}

          {!isManager && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchPreview(startDate, endDate)}
              disabled={loading}
            >
              Sinkron Data
            </Button>
          )}
        </div>
      </div>

      {loading && <LoadingState label="Menghitung agregasi data proyek..." />}
      {error && <ErrorState title="Gagal Menyiapkan Laporan" description={error} onRetry={() => fetchPreview()} />}

      {!loading && !error && preview && (
        <>
          {/* Status & Action Bar */}
          <div className={`p-4 rounded-card-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            preview.status === 'ACKNOWLEDGED'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : preview.status === 'SUBMITTED'
              ? 'bg-sky-50/80 border-sky-200 text-sky-900'
              : preview.status === 'REVISION'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-3">
              {preview.status === 'ACKNOWLEDGED' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : preview.status === 'SUBMITTED' ? (
                <Check className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              ) : preview.status === 'REVISION' ? (
                <RotateCcw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {preview.status === 'ACKNOWLEDGED'
                      ? 'Diverifikasi Dewan Direksi (BOD)'
                      : preview.status === 'SUBMITTED'
                      ? 'Disetujui Manager & Terbit di BOD'
                      : preview.status === 'REVISION'
                      ? 'Dikembalikan untuk Revisi'
                      : 'Pengajuan Otomatis (Menunggu Approval Manager)'}
                  </span>
                  {isAdmin && preview.status === 'PENDING' && (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      Auto-Submitted
                    </span>
                  )}
                </div>

                {preview.status === 'REVISION' && preview.notes && (
                  <div className="mt-2 rounded border border-amber-300 bg-amber-100/60 p-2 text-xs text-amber-900">
                    <strong>Catatan Revisi dari Manager:</strong> {preview.notes}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {preview.submitted_at && (
                    <span>Diajukan: {new Date(preview.submitted_at).toLocaleString('id-ID')}</span>
                  )}
                  {preview.reviewed_at && (
                    <span>Direview: {new Date(preview.reviewed_at).toLocaleString('id-ID')}</span>
                  )}
                  {preview.acknowledged_at && (
                    <span>Diterima BOD: {new Date(preview.acknowledged_at).toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Manager Actions */}
            {(isManager || isBod) && preview.status !== 'ACKNOWLEDGED' && (
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReturnModalOpen(true)}
                  disabled={actionLoading}
                  className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Kembalikan
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  {preview.status === 'SUBMITTED' ? 'Perbarui Persetujuan' : 'Setujui (Approve ke BOD)'}
                </Button>
              </div>
            )}
          </div>

          {/* Metric KPI Cards */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" aria-label="Ringkasan Metrik">
            <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
              <span className="text-[11px] font-medium text-slate-500">Nilai Kontrak Total</span>
              <p className="mt-1 text-lg font-bold text-navy">{formatRupiah(metricsMap.contract_value_total || 0)}</p>
              <span className="mt-1 block text-[10px] text-slate-400">Piutang: {formatRupiah(metricsMap.outstanding_receivables || 0)}</span>
            </div>

            <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
              <span className="text-[11px] font-medium text-slate-500">Anggaran RAB</span>
              <p className="mt-1 text-lg font-bold text-sky-700">{formatRupiah(metricsMap.total_budget_rab || 0)}</p>
              <span className="mt-1 block text-[10px] text-slate-500">Sisa: {formatRupiah(metricsMap.remaining_budget_rab || 0)}</span>
            </div>

            <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
              <span className="text-[11px] font-medium text-slate-500">Realisasi Biaya (Kumulatif)</span>
              <p className="mt-1 text-lg font-bold text-amber-600">{formatRupiah(metricsMap.actual_expenses_cumulative || 0)}</p>
              <span className="mt-1 block text-[10px] text-slate-500">Periode: {formatRupiah(metricsMap.actual_expenses_period || 0)}</span>
            </div>

            <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
              <span className="text-[11px] font-medium text-slate-500">Kas Masuk (Cair)</span>
              <p className="mt-1 text-lg font-bold text-emerald-600">{formatRupiah(metricsMap.cash_collected_period || 0)}</p>
              <span className="mt-1 block text-[10px] text-slate-400">Tagihan: {formatRupiah(metricsMap.invoiced_period || 0)}</span>
            </div>

            <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
              <span className="text-[11px] font-medium text-slate-500">Kas Kecil Lapangan</span>
              <p className="mt-1 text-lg font-bold text-indigo-600">{formatRupiah(metricsMap.petty_cash_balance_total || 0)}</p>
              <span className="mt-1 block text-[10px] text-slate-500">Terpakai: {formatRupiah(metricsMap.petty_cash_disbursed_period || 0)}</span>
            </div>

            <div className="rounded-card border border-line bg-white p-3.5 shadow-card">
              <span className="text-[11px] font-medium text-slate-500">Progres & Milestone</span>
              <p className="mt-1 text-lg font-bold text-primary">{(metricsMap.average_physical_progress || 0).toFixed(1)}%</p>
              <span className="mt-1 block text-[10px] text-slate-500">
                {metricsMap.milestones_completed_count || 0} / {metricsMap.milestones_total_count || 0} Milestone Selesai
              </span>
            </div>
          </section>

          {/* Tab Navigation */}
          <div className="flex border-b border-line bg-white rounded-card-lg p-1.5 shadow-card gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-card transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-50'
              }`}
            >
              Ringkasan & Finansial
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rab')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-card transition-colors ${
                activeTab === 'rab'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-50'
              }`}
            >
              Rencana Anggaran Biaya (RAB)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('petty_cash')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-card transition-colors ${
                activeTab === 'petty_cash'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-50'
              }`}
            >
              Kas Kecil Lapangan (Petty Cash)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('milestones')}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-card transition-colors ${
                activeTab === 'milestones'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-50'
              }`}
            >
              Milestone & Fisik ({metricsMap.milestones_total_count || 0})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & CHARTS */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 1: Financial & Cash Conversion */}
                <div className="lg:col-span-2 rounded-card-lg border border-line bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-navy">Realisasi Keuangan & Arus Kas</h2>
                      <p className="text-xs text-slate-500">Perbandingan nilai kontrak, RAB, tagihan, kas masuk, dan pengeluaran</p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip
                          formatter={(val: number) => [formatRupiah(val), 'Jumlah']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {financialChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Project Status Ratio */}
                <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
                  <h2 className="text-base font-semibold text-navy">Status Portofolio</h2>
                  <p className="text-xs text-slate-500 mb-2">Komposisi status seluruh proyek</p>
                  <div className="h-64 w-full flex items-center justify-center">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                          >
                            {statusData.map((entry, idx) => (
                              <Cell key={`status-cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-xs text-slate-400">Belum ada data status proyek.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-navy">Rincian Proyek Terlampir</h3>
                    <p className="text-xs text-slate-500">Data konsolidasi kuantitatif per proyek</p>
                  </div>
                  <span className="text-xs text-slate-400">{preview.breakdowns.length} Proyek Tercatat</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-line">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Kode</th>
                        <th className="py-2.5 px-4 font-semibold">Nama Proyek</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Nilai Kontrak</th>
                        <th className="py-2.5 px-4 font-semibold text-right">RAB Total</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Pengeluaran</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Kas Masuk</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Progres Fisik</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {preview.breakdowns.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 font-mono text-slate-600">{b.entity_code}</td>
                          <td className="py-2.5 px-4 font-medium text-navy">{b.entity_name}</td>
                          <td className="py-2.5 px-4 text-right font-medium text-slate-700">{formatRupiah(Number(b.figures.contract_value || 0))}</td>
                          <td className="py-2.5 px-4 text-right text-sky-700 font-medium">{formatRupiah(Number(b.figures.rab_total || 0))}</td>
                          <td className="py-2.5 px-4 text-right text-amber-600">{formatRupiah(Number(b.figures.actual_expense || 0))}</td>
                          <td className="py-2.5 px-4 text-right text-emerald-600">{formatRupiah(Number(b.figures.paid || 0))}</td>
                          <td className="py-2.5 px-4 text-center font-medium text-primary">
                            {Number(b.figures.progress_pct || 0).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              b.figures.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.figures.status === 'in_progress'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {String(b.figures.status || '-')}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {preview.breakdowns.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Tidak ada transaksi proyek pada periode terpilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RAB (RENCANA ANGGARAN BIAYA) */}
          {activeTab === 'rab' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Total Anggaran RAB</span>
                  <p className="mt-1 text-xl font-bold text-navy">{formatRupiah(metricsMap.total_budget_rab || 0)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Pagu anggaran disetujui</p>
                </div>
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Realisasi Biaya Lapangan</span>
                  <p className="mt-1 text-xl font-bold text-amber-600">{formatRupiah(metricsMap.actual_expenses_cumulative || 0)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Penyerapan: {(metricsMap.budget_absorption_pct || 0).toFixed(1)}%</p>
                </div>
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Sisa Anggaran RAB (Variance)</span>
                  <p className="mt-1 text-xl font-bold text-emerald-600">{formatRupiah(metricsMap.remaining_budget_rab || 0)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Buffer anggaran tersisa</p>
                </div>
              </div>

              <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">Monitoring Anggaran RAB per Proyek</h3>
                  <span className="text-xs text-slate-500">Perbandingan Pagu vs Realisasi</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-line">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Kode</th>
                        <th className="py-2.5 px-4 font-semibold">Nama Proyek</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Pagu RAB</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Biaya Aktual</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Sisa Anggaran</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Penyerapan</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Status Anggaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {preview.breakdowns.map((b, idx) => {
                        const rab = Number(b.figures.rab_total || 0);
                        const exp = Number(b.figures.actual_expense || 0);
                        const rem = Number(b.figures.rab_remaining || 0);
                        const absorption = rab > 0 ? (exp / rab) * 100 : 0;
                        const isOver = exp > rab && rab > 0;
                        const isWarning = absorption > 90 && !isOver;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4 font-mono text-slate-600">{b.entity_code}</td>
                            <td className="py-2.5 px-4 font-medium text-navy">{b.entity_name}</td>
                            <td className="py-2.5 px-4 text-right font-medium text-slate-700">{formatRupiah(rab)}</td>
                            <td className="py-2.5 px-4 text-right text-amber-600">{formatRupiah(exp)}</td>
                            <td className={`py-2.5 px-4 text-right font-semibold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatRupiah(rem)}
                            </td>
                            <td className="py-2.5 px-4 text-center font-medium">
                              {absorption.toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                isOver
                                  ? 'bg-red-100 text-red-800'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isOver ? 'Over Budget' : isWarning ? 'Mendekati Limit' : 'Terkendali'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PETTY CASH (KAS KECIL LAPANGAN) */}
          {activeTab === 'petty_cash' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Penerimaan Kas Kecil Lapangan (Periode)</span>
                  <p className="mt-1 text-xl font-bold text-emerald-600">{formatRupiah(metricsMap.petty_cash_topup_period || 0)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Total topup kas operasional</p>
                </div>
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Pengeluaran Kas Kecil Lapangan (Periode)</span>
                  <p className="mt-1 text-xl font-bold text-amber-600">{formatRupiah(metricsMap.petty_cash_disbursed_period || 0)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Pengeluaran tunai lapangan</p>
                </div>
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Saldo Kas Kecil Lapangan (Total)</span>
                  <p className="mt-1 text-xl font-bold text-indigo-600">{formatRupiah(metricsMap.petty_cash_balance_total || 0)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Posisi likuiditas kas kecil saat ini</p>
                </div>
              </div>

              <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">Distribusi Kas Kecil Lapangan per Proyek</h3>
                  <span className="text-xs text-slate-500">Rincian Saldo Kas di Lokasi</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-line">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Kode</th>
                        <th className="py-2.5 px-4 font-semibold">Nama Proyek</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Kas Masuk (Topup)</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Pengeluaran Tunai</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Saldo Kas Lapangan</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Status Likuiditas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {preview.breakdowns.map((b, idx) => {
                        const pIn = Number(b.figures.petty_in || 0);
                        const pOut = Number(b.figures.petty_out || 0);
                        const pBalance = Number(b.figures.petty_balance || 0);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-4 font-mono text-slate-600">{b.entity_code}</td>
                            <td className="py-2.5 px-4 font-medium text-navy">{b.entity_name}</td>
                            <td className="py-2.5 px-4 text-right text-emerald-600 font-medium">{formatRupiah(pIn)}</td>
                            <td className="py-2.5 px-4 text-right text-amber-600 font-medium">{formatRupiah(pOut)}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-navy">{formatRupiah(pBalance)}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                pBalance <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : pBalance < 5000000
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {pBalance <= 0 ? 'Habis' : pBalance < 5000000 ? 'Perlu Topup' : 'Cukup'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MILESTONES & FISIK (GANTT CHART) */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Total Milestone Pekerjaan</span>
                  <p className="mt-1 text-xl font-bold text-navy">{metricsMap.milestones_total_count || 0}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Tahapan fisik terdaftar</p>
                </div>
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Milestone Selesai (100%)</span>
                  <p className="mt-1 text-xl font-bold text-emerald-600">{metricsMap.milestones_completed_count || 0}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Pekerjaan telah rampung</p>
                </div>
                <div className="rounded-card border border-line bg-white p-4 shadow-card">
                  <span className="text-xs text-slate-500">Milestone Sedang Berjalan</span>
                  <p className="mt-1 text-xl font-bold text-sky-600">{metricsMap.milestones_in_progress_count || 0}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Aktif dikerjakan di lapangan</p>
                </div>
              </div>

              {/* Gantt Chart per Proyek */}
              <div className="space-y-6">
                {preview.breakdowns.map((b, pIdx) => {
                  const milestones = (b.figures.milestones || []) as Array<{
                    title: string;
                    weight: number;
                    actual: number;
                    status: string;
                    start_date: string | null;
                    due_date: string | null;
                  }>;

                  return (
                    <div key={pIdx} className="rounded-card-lg border border-line bg-white p-5 shadow-card space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-500">{b.entity_code}</span>
                            <h4 className="text-sm font-semibold text-navy">{b.entity_name}</h4>
                          </div>
                          <span className="text-xs text-slate-500">
                            Progres Fisik: <strong className="text-primary">{Number(b.figures.progress_pct || 0).toFixed(1)}%</strong>
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {milestones.length} Tahapan Jadwal Lapangan
                        </span>
                      </div>

                      <MilestoneGanttChart
                        milestones={milestones.map(m => ({
                          ...m,
                          projectName: b.entity_name,
                          projectCode: b.entity_code,
                        }))}
                        defaultStart={startDate}
                        defaultEnd={endDate}
                      />
                    </div>
                  );
                })}

                {preview.breakdowns.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 rounded-card-lg border border-line bg-white">
                    Tidak ada proyek atau tahapan milestone pada periode ini.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Return Revision Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" data-testid="return-report-modal">
          <div className="w-full max-w-md rounded-card-lg border border-line bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-navy font-semibold">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <h3>Kembalikan Laporan ke Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Tutup Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Laporan akan dikembalikan ke Admin Project dengan status <strong>REVISION</strong>. Harap cantumkan alasan atau poin data yang perlu disesuaikan.
            </p>

            <div className="space-y-1">
              <label htmlFor="return-notes" className="text-xs font-semibold text-slate-700">
                Catatan Revisi <span className="text-red-500">*</span>
              </label>
              <textarea
                id="return-notes"
                rows={4}
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Contoh: Tolong periksa selisih biaya aktual semen & besi pada proyek Tower Bali..."
                className="w-full rounded-card border border-line p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReturnModalOpen(false)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReturnSubmit}
                disabled={actionLoading || !returnNotes.trim()}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 border-amber-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Kirim Pengembalian
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
