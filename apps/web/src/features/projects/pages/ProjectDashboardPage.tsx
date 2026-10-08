import { useEffect, useState } from 'react';
import { projectApi } from '../../../api/projects';
import { Project } from '../../../types/project';
import {
  Briefcase,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Clock,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorState, LoadingState } from '../../../components/states';
import { formatRupiah, formatDate } from '../../../utils/format';
import { Button } from '../../../components/ui/Button';

const axisTick = { fontSize: 11, fill: 'var(--color-subtle)' };

function buildMonthlyTrend(projects: Project[], months = 6) {
  const now = new Date();
  const created = projects.map(p => new Date(p.created_at));
  return Array.from({ length: months }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      label: start.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      baru: created.filter(d => d >= start && d < end).length,
      total: created.filter(d => d < end).length,
    };
  });
}

export default function ProjectDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await projectApi.getProjects({ per_page: 100 });
      setProjects(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat proyek');
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const delayedProjects = projects.filter(p => p.status === 'on_hold' || (p.status === 'in_progress' && Boolean(p.end_date) && p.end_date! < new Date().toLocaleDateString('en-CA')));

  const totalValue = activeProjects.reduce((acc, curr) => acc + parseFloat(curr.contract_value.toString()), 0);

  // Chart data
  const statusDistribution = [
    { label: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: '#94a3b8' },
    { label: 'Berjalan', value: activeProjects.length, color: '#0284c7' },
    { label: 'Tertunda', value: projects.filter(p => p.status === 'on_hold').length, color: '#b45309' },
    { label: 'Selesai', value: projects.filter(p => p.status === 'completed').length, color: '#15803d' },
  ];

  const monthlyTrend = buildMonthlyTrend(projects);


  if (loading) return <LoadingState label="Memuat proyek..." />;
  if (error) return <ErrorState title="Data proyek gagal dimuat" description={error} onRetry={() => void fetchProjects()} />;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* ENTERPRISE HERO BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-input text-[10px] font-bold tracking-wider uppercase bg-primary-50 text-primary-700 dark:text-primary-300 border border-primary-200">
              Divisi Proyek
            </span>
            <span className="text-xs text-slate-300">&bull;</span>
            <span className="text-xs text-subtle font-medium">Manajemen Portofolio & Kontrol Lapangan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy mt-1">
            Dashboard Portofolio Proyek
          </h1>
          <p className="text-xs sm:text-sm text-subtle mt-0.5">
            Ringkasan hingga 100 proyek yang dimuat. Buka daftar proyek untuk menelusuri seluruh halaman.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/projects/list">
            <Button variant="secondary" size="md" className="text-xs">
              Lihat Semua Proyek
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="group relative overflow-hidden rounded-card-lg bg-gradient-to-br from-primary-600 to-primary-800 p-6 shadow-card hover:shadow-card-hover transition-all text-white">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-panel/10 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Proyek Aktif</p>
              <p className="mt-2 text-3xl font-bold text-white">{activeProjects.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-panel/20 backdrop-blur-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-xs font-medium text-primary-200">
            <span>Sedang dalam tahap konstruksi</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="group rounded-card-lg bg-panel p-6 shadow-card hover:shadow-card-hover border border-line transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-subtle">Total Nilai Kontrak (Aktif)</p>
              <p className="mt-2 text-2xl font-bold text-navy">
                {formatRupiah(totalValue)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-success-light text-success dark:text-emerald-300 border border-success/30">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-success dark:text-emerald-300">
            <TrendingUp className="h-4 w-4" />
            <span>Nilai kontrak proyek yang dimuat</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="group rounded-card-lg bg-panel p-6 shadow-card hover:shadow-card-hover border border-line transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-subtle">Rata-rata Progres Fisik</p>
              <p className="mt-2 text-sm font-semibold text-muted">Belum tersedia</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-surface-2 text-primary-600 dark:text-primary-300 border border-primary/20">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-xs text-subtle">Lihat milestone pada detail masing-masing proyek.</p>
        </div>

        {/* KPI 4 */}
        <div className="group rounded-card-lg bg-panel p-6 shadow-card hover:shadow-card-hover border border-line transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-subtle">Risiko & Keterlambatan</p>
              <p className="mt-2 text-3xl font-bold text-danger dark:text-red-300">
                {delayedProjects.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-danger-light text-danger dark:text-red-300 border border-danger/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-danger dark:text-red-300">
            <span>Membutuhkan eskalasi manajer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Chart & Progress */}
        <div className="lg:col-span-2 space-y-6">

          {/* Progress Overview */}
          <div className="rounded-card-lg bg-panel shadow-card border border-line p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-navy">Status Penyerapan Proyek</h2>
                <p className="text-xs text-subtle">Distribusi berdasarkan fase pelaksanaan</p>
              </div>
              <Link to="/projects/list" className="text-xs font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-700 flex items-center gap-1 transition-colors">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-5">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'var(--color-surface)' }}
                      formatter={(value) => [`${value} proyek`, 'Jumlah']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-line)', backgroundColor: 'var(--color-panel)', color: 'var(--color-navy)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {statusDistribution.map(s => <Cell key={s.label} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {[
                { label: 'Persiapan & Planning', count: projects.filter(p => p.status === 'planning').length, color: 'bg-slate-400' },
                { label: 'Konstruksi Berjalan', count: activeProjects.length, color: 'bg-primary-600' },
                { label: 'Tertunda / On Hold', count: projects.filter(p => p.status === 'on_hold').length, color: 'bg-warning' },
                { label: 'Selesai / Handover', count: projects.filter(p => p.status === 'completed').length, color: 'bg-success' }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-navy">{stat.label}</span>
                    <span className="font-bold text-navy tabular-nums">{stat.count} Proyek</span>
                  </div>
                  <div className="w-full h-2 bg-surface-2 border border-line rounded-pill overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-pill transition-all duration-1000 ease-out`}
                      style={{ width: `${projects.length ? (stat.count / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="rounded-card-lg bg-panel shadow-card border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-navy">Tren Jumlah Proyek</h2>
                <p className="text-xs text-subtle">Perkembangan portofolio bulanan</p>
              </div>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--color-surface)' }}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-line)', backgroundColor: 'var(--color-panel)', color: 'var(--color-navy)' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="baru" name="Proyek baru" fill="#7dd3fc" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line dataKey="total" name="Total portofolio" type="monotone" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical Projects Need Attention */}
          <div className="rounded-card-lg bg-panel shadow-card border border-danger/30 overflow-hidden">
            <div className="bg-danger-light/40 p-4 border-b border-danger/20 flex justify-between items-center">
              <div className="flex items-center gap-2 text-danger dark:text-red-300 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                Sorotan Proyek Kritis
              </div>
              <span className="bg-danger text-white text-[11px] font-bold px-2 py-0.5 rounded-pill shadow-xs">
                Eskalasi Diperlukan
              </span>
            </div>
            <div className="divide-y divide-line">
              {delayedProjects.slice(0, 3).map((project, idx) => (
                <div key={project.id || idx} className="p-4 flex items-start justify-between hover:bg-surface transition-colors">
                  <div>
                    <h4 className="font-semibold text-navy text-sm">{project.name}</h4>
                    <p className="text-xs text-subtle mt-0.5 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2.5 text-xs font-medium text-subtle">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warning dark:text-amber-300" /> {project.status === 'on_hold' ? 'Proyek ditunda' : 'Melewati tanggal selesai'}</span>
                    </div>
                  </div>
                  <Link
                    to={`/projects/progress?project_id=${project.id}`}
                    className="shrink-0 bg-panel border border-line text-navy text-xs font-semibold px-3 py-1.5 rounded-input hover:bg-surface hover:border-line-2 transition-all shadow-card"
                  >
                    Inspeksi
                  </Link>
                </div>
              ))}
              {delayedProjects.length === 0 && (
                <div className="p-8 text-center text-sm text-subtle flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-success dark:text-emerald-300 mb-2" />
                  Tidak ada proyek terlambat pada data yang dimuat.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Aktivitas & Timeline */}
        <div className="space-y-6">

          <div className="rounded-card-lg bg-panel shadow-card border border-line p-6 h-full min-h-[400px]">
            <h2 className="text-base font-bold text-navy mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              Proyek Terakhir Diperbarui
            </h2>

            <ul className="divide-y divide-line">
              {[...projects].sort((a,b) => b.updated_at.localeCompare(a.updated_at)).slice(0,5).map(project => <li key={project.id} className="py-4">
                <Link to={`/projects/${project.id}`} className="text-sm font-semibold text-primary-700 dark:text-primary-300 underline">{project.name}</Link>
                <p className="mt-1 text-xs text-subtle">Diperbarui {formatDate(project.updated_at.slice(0,10))}</p>
              </li>)}
            </ul>
            {projects.length === 0 && <p className="text-sm text-subtle">Belum ada proyek yang tercatat.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
