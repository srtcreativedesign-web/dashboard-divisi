import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  FolderKanban,
  Smartphone,
  CheckCircle2,
  Clock,
  Eye,
  Check,
  Building2,
  Activity,
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
import { MilestoneGanttChart } from '../../features/projects/components/MilestoneGanttChart';
import { MVP_MODULES } from '../../config/mvp';
import { useAuth } from '../../session/AuthContext';
import { canAccessDivision, hasCapability } from '../../session/capability';
import { NoAccessState, LoadingState } from '../../components/states';
import { bodApi, BodDivisionReportItem } from '../../api/bod';
import { formatRupiah } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const icons = { ACC: BookOpenText, PROJECT: FolderKanban, CELL: Smartphone };

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const isBod = user?.role === 'BOD';

  const [reports, setReports] = useState<BodDivisionReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BodDivisionReportItem | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    if (isBod) {
      fetchReports();
    }
  }, [isBod]);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await bodApi.getReports();
      setReports(res.data?.data || []);
    } catch (e) {
      console.error('Gagal memuat daftar laporan BOD', e);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleOpenDetail = async (reportId: string) => {
    try {
      const res = await bodApi.getReportDetail(reportId);
      setSelectedReport(res.data);
    } catch {
      toast('Gagal memuat rincian laporan', 'error');
    }
  };

  const handleAcknowledge = async (reportId: string) => {
    try {
      setAcknowledging(true);
      await bodApi.acknowledgeReport(reportId);
      toast('Laporan berhasil ditandai telah ditinjau (Acknowledged)', 'success');
      await fetchReports();
      if (selectedReport?.id === reportId) {
        const updated = await bodApi.getReportDetail(reportId);
        setSelectedReport(updated.data);
      }
    } catch {
      toast('Gagal menyetujui laporan', 'error');
    } finally {
      setAcknowledging(false);
    }
  };

  if (!user) return null;

  const modules = MVP_MODULES.filter(
    (module) =>
      canAccessDivision(user, module.code) &&
      hasCapability(user.role, module.capability, user.divisionCode)
  );

  // Aggregate stats from the latest submitted project report if available
  const latestProjectReport = reports.find((r) => r.division_code === 'PROJECT');
  const projectMetrics = (latestProjectReport?.metrics || []).reduce<Record<string, number>>(
    (acc, m) => {
      acc[m.metric_key] = typeof m.metric_value === 'string' ? parseFloat(m.metric_value) : m.metric_value;
      return acc;
    },
    {}
  );

  const totalContract = projectMetrics.contract_value_total || 0;
  const totalExpense = projectMetrics.actual_expenses_period || 0;
  const totalCashIn = projectMetrics.cash_collected_period || 0;
  const totalOutstanding = projectMetrics.outstanding_receivables || 0;

  // Chart 1: Financial Bar Chart
  const financialChartData = [
    { name: 'Nilai Kontrak', value: totalContract, color: '#0284c7' },
    { name: 'Anggaran RAB', value: projectMetrics.total_budget_rab || 0, color: '#6366f1' },
    { name: 'Tagihan (Inv)', value: projectMetrics.invoiced_period || 0, color: '#0ea5e9' },
    { name: 'Kas Masuk', value: totalCashIn, color: '#10b981' },
    { name: 'Biaya Aktual', value: totalExpense, color: '#f59e0b' },
    { name: 'Sisa Piutang', value: totalOutstanding, color: '#ef4444' },
  ];

  // Chart 2: Project status breakdown
  const statusPieData = [
    { name: 'Berjalan', value: projectMetrics.active_projects_count || 0, color: '#0284c7' },
    { name: 'Selesai', value: projectMetrics.completed_projects_count || 0, color: '#10b981' },
    { name: 'Tertunda', value: projectMetrics.on_hold_projects_count || 0, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 pb-12" data-testid="dashboard-page">
      {/* Standard Header */}
      <section className="rounded-card-lg border border-line bg-white p-6 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Workspace ERP</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isBod
              ? 'Konsolidasi eksekutif BOD: pantau laporan berkala divisi dan akses seluruh modul perusahaan.'
              : 'Pilih modul sesuai kewenangan Anda.'}
          </p>
        </div>
        {isBod && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 w-fit">
            <Building2 className="h-3.5 w-3.5" /> Dewan Direksi (BOD)
          </span>
        )}
      </section>

      {/* Module Shortcuts Grid */}
      {modules.length ? (
        <section className="grid gap-4 md:grid-cols-3" aria-label="Modul ERP">
          {modules.map((module) => {
            const Icon = icons[module.code];
            const targetPath = isBod
              ? module.code === 'PROJECT'
                ? '/projects/report-to-bod'
                : module.code === 'ACC'
                ? '/accounting/pendapatan/analisis'
                : '/cellular/laporan'
              : module.path;
            const buttonLabel = isBod ? 'Buka laporan divisi' : 'Buka modul';

            return (
              <Link
                key={module.code}
                to={targetPath}
                className="rounded-card-lg border border-line bg-white p-6 shadow-card transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-lg font-semibold text-navy">{module.name}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {isBod ? `Laporan berkala ${module.name} yang telah diserahkan oleh Manager ke BOD.` : module.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {buttonLabel} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </section>
      ) : (
        <NoAccessState description="Akun Anda belum ditugaskan ke modul MVP. Hubungi pengelola akses perusahaan." />
      )}

      {/* Additional Executive Dashboard Section for BOD */}
      {isBod && (
        <div className="space-y-6 pt-4 border-t border-line/60">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold text-navy">Laporan Terlapor ke BOD (Kuantitatif)</h2>
          </div>

          {/* KPI Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metrik Ringkasan Eksekutif">
            <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Portofolio Kontrak</span>
              <p className="mt-2 text-2xl font-bold text-navy">{formatRupiah(totalContract)}</p>
              <span className="mt-1 block text-xs text-slate-500">Divisi Project Terlapor</span>
            </div>

            <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Realisasi Biaya Lapangan</span>
              <p className="mt-2 text-2xl font-bold text-amber-600">{formatRupiah(totalExpense)}</p>
              <span className="mt-1 block text-xs text-slate-500">Pengeluaran Periode Berjalan</span>
            </div>

            <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pembayaran Diterima (Kas)</span>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{formatRupiah(totalCashIn)}</p>
              <span className="mt-1 block text-xs text-slate-500">Realisasi Invoice Cair</span>
            </div>

            <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Piutang Tagihan (Outstanding)</span>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatRupiah(totalOutstanding)}</p>
              <span className="mt-1 block text-xs text-slate-500">Perlu Pengawasan Penagihan</span>
            </div>
          </section>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Financial & Cash Conversion */}
            <div className="lg:col-span-2 rounded-card-lg border border-line bg-white p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-navy">Struktur Keuangan & Realisasi Kas Divisi Project</h3>
                  <p className="text-xs text-slate-500">Perbandingan nilai kontrak, tagihan, penerimaan kas, dan pengeluaran</p>
                </div>
                {latestProjectReport && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                    Periode: {latestProjectReport.period_start} s/d {latestProjectReport.period_end}
                  </span>
                )}
              </div>

              <div className="h-64 w-full">
                {totalContract > 0 ? (
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
                          <Cell key={`bod-chart-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                    Belum ada data laporan Project yang diserahkan untuk periode ini.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Project Status Donut */}
            <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
              <h3 className="text-base font-semibold text-navy">Komposisi Proyek Terlapor</h3>
              <p className="text-xs text-slate-500 mb-2">Sebaran status kesehatan proyek</p>
              <div className="h-64 w-full flex items-center justify-center">
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {statusPieData.map((entry, idx) => (
                          <Cell key={`bod-pie-${idx}`} fill={entry.color} />
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

          {/* Reports Inbox Table */}
          <section className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
            <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-navy">Daftar Laporan Masuk dari Divisi</h3>
                <p className="text-xs text-slate-500">Laporan kuantitatif berkala yang diserahkan para manajer divisi ke BOD</p>
              </div>
              <Button variant="secondary" size="sm" onClick={fetchReports} disabled={loadingReports}>
                Segarkan Daftar
              </Button>
            </div>

            {loadingReports ? (
              <div className="p-8">
                <LoadingState label="Memuat laporan masuk..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-line">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Divisi</th>
                      <th className="py-3 px-4 font-semibold">Periode Pelaporan</th>
                      <th className="py-3 px-4 font-semibold">Diserahkan Oleh</th>
                      <th className="py-3 px-4 font-semibold">Waktu Penyerahan</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-navy">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 font-semibold text-slate-800">
                            {r.division_code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {r.period_start} s/d {r.period_end}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {r.submitter ? r.submitter.name : 'Manager Divisi'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              r.status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {r.status === 'ACKNOWLEDGED' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Diverifikasi
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" /> Menunggu Review
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenDetail(r.id)}
                              className="gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" /> Lihat Detail
                            </Button>
                            {r.status !== 'ACKNOWLEDGED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAcknowledge(r.id)}
                                disabled={acknowledging}
                                className="gap-1.5"
                              >
                                <Check className="h-3.5 w-3.5" /> Acknowledge
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          Belum ada laporan divisi yang diserahkan ke BOD.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Modal Detail Laporan */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="bg-white rounded-card-lg border border-line shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="p-5 border-b border-line flex items-center justify-between bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary text-white text-xs font-bold font-mono">
                        {selectedReport.division_code}
                      </span>
                      <h3 className="text-lg font-bold text-navy">
                        Laporan Divisi Periode {selectedReport.period_start} s/d {selectedReport.period_end}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Diserahkan oleh {selectedReport.submitter?.name || 'Manager Divisi'} pada{' '}
                      {selectedReport.submitted_at ? new Date(selectedReport.submitted_at).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-navy hover:bg-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedReport.metrics.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-card border border-line">
                        <span className="text-[11px] text-slate-500 block truncate">{m.metric_label}</span>
                        <span className="text-base font-bold text-navy mt-1 block">
                          {m.unit === 'IDR'
                            ? formatRupiah(Number(m.metric_value))
                            : m.unit === 'PERCENT'
                            ? `${Number(m.metric_value).toFixed(1)}%`
                            : `${m.metric_value} ${m.unit.toLowerCase()}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Breakdowns Table with RAB, Petty Cash, and Progress */}
                  {selectedReport.breakdowns && selectedReport.breakdowns.length > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-navy mb-2">Rincian Data Portofolio & Keuangan Proyek</h4>
                        <div className="rounded-card border border-line overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/70 text-slate-600 border-b border-line">
                              <tr>
                                <th className="py-2 px-3 font-semibold">Kode</th>
                                <th className="py-2 px-3 font-semibold">Nama Proyek</th>
                                <th className="py-2 px-3 font-semibold text-right">Nilai Kontrak</th>
                                <th className="py-2 px-3 font-semibold text-right">Pagu RAB</th>
                                <th className="py-2 px-3 font-semibold text-right">Pengeluaran</th>
                                <th className="py-2 px-3 font-semibold text-right">Saldo Kas Kecil</th>
                                <th className="py-2 px-3 font-semibold text-center">Progres</th>
                                <th className="py-2 px-3 font-semibold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {selectedReport.breakdowns.map((b, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 px-3 font-mono text-slate-500">{b.entity_code}</td>
                                  <td className="py-2 px-3 font-medium text-navy">{b.entity_name}</td>
                                  <td className="py-2 px-3 text-right">{formatRupiah(Number(b.figures.contract_value || 0))}</td>
                                  <td className="py-2 px-3 text-right font-medium text-sky-700">{formatRupiah(Number(b.figures.rab_total || 0))}</td>
                                  <td className="py-2 px-3 text-right text-amber-600">{formatRupiah(Number(b.figures.actual_expense || 0))}</td>
                                  <td className="py-2 px-3 text-right font-medium text-indigo-600">{formatRupiah(Number(b.figures.petty_balance || 0))}</td>
                                  <td className="py-2 px-3 text-center font-medium text-primary">
                                    {Number(b.figures.progress_pct || 0).toFixed(1)}%
                                  </td>
                                  <td className="py-2 px-3 text-center uppercase text-[10px] font-semibold text-slate-600">
                                    {String(b.figures.status || '-')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Milestones per Project Gantt Chart */}
                      {selectedReport.breakdowns.some(b => Array.isArray(b.figures.milestones) && b.figures.milestones.length > 0) && (
                        <div>
                          <h4 className="text-sm font-semibold text-navy mb-2">Jadwal & Realisasi Milestone Lapangan (Gantt Chart)</h4>
                          <div className="space-y-4">
                            {selectedReport.breakdowns.map((b, idx) => {
                              const milestones = (b.figures.milestones || []) as Array<{
                                title: string;
                                weight: number;
                                actual: number;
                                status: string;
                                start_date?: string | null;
                                due_date: string | null;
                              }>;
                              if (milestones.length === 0) return null;

                              return (
                                <div key={idx} className="p-3.5 bg-slate-50/70 rounded-card border border-line space-y-2">
                                  <div className="flex justify-between items-center pb-2 border-b border-line">
                                    <span className="font-semibold text-navy text-xs">{b.entity_name} ({b.entity_code})</span>
                                    <span className="text-[11px] text-slate-500">Progres Rata-rata: <strong className="text-primary">{Number(b.figures.progress_pct || 0).toFixed(1)}%</strong></span>
                                  </div>
                                  <MilestoneGanttChart
                                    milestones={milestones.map(m => ({
                                      ...m,
                                      projectName: b.entity_name,
                                      projectCode: b.entity_code,
                                    }))}
                                    defaultStart={selectedReport.period_start}
                                    defaultEnd={selectedReport.period_end}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-line bg-slate-50 flex items-center justify-between">
                  <div>
                    {selectedReport.status === 'ACKNOWLEDGED' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Telah ditinjau oleh {selectedReport.acknowledger?.name || 'BOD'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Menunggu persetujuan peninjauan dari Direksi</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSelectedReport(null)}>
                      Tutup
                    </Button>
                    {selectedReport.status !== 'ACKNOWLEDGED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledge(selectedReport.id)}
                        disabled={acknowledging}
                        className="gap-1.5"
                      >
                        <Check className="h-4 w-4" /> Tandai Telah Ditinjau (Acknowledge)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
