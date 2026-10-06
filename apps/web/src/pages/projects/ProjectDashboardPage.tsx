import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, Briefcase, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { projectApi } from '../../api/projects';
import type { ProjectDashboard } from '../../types/project';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';

const axisTick = { fontSize: 11, fill: '#64748b' };
const statuses = [
  { key: 'planning', label: 'Perencanaan', color: '#94a3b8' },
  { key: 'in_progress', label: 'Berjalan', color: '#0284c7' },
  { key: 'on_hold', label: 'Ditunda', color: '#b45309' },
  { key: 'completed', label: 'Selesai', color: '#15803d' },
];
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 });

export default function ProjectDashboardPage() {
  const [summary, setSummary] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  async function load() {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await projectApi.getDashboard();
      if (id === requestId.current) setSummary(result);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'Ringkasan proyek gagal dimuat.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    return () => { requestId.current++; };
  }, []);

  if (loading) return <LoadingState label="Memuat ringkasan proyek..." />;
  if (error || !summary) return <ErrorState description={error ?? 'Ringkasan proyek belum tersedia.'} onRetry={() => void load()} />;

  const distribution = statuses.map(status => ({ ...status, value: summary.status_counts[status.key] ?? 0 }));
  const trend = summary.monthly_trend.map(month => ({
    label: new Date(`${month.month}-01T00:00:00+07:00`).toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: 'Asia/Jakarta' }),
    baru: month.new_count,
    total: month.total_count,
  }));
  const progress = summary.average_recorded_progress;
  const kpis = [
    { label: 'Proyek Aktif', value: summary.active_projects, description: 'Status sedang berjalan', icon: Briefcase },
    { label: 'Nilai Kontrak Aktif', value: currency.format(Number(summary.active_contract_value)), description: 'Jumlah kontrak proyek berjalan', icon: Wallet },
    { label: 'Rata-rata Progres Tercatat', value: progress === null ? 'Belum tersedia' : `${progress.toLocaleString('id-ID')}%`, description: `${summary.progress_covered_projects} dari ${summary.active_projects} proyek aktif memiliki bobot 100%`, icon: Activity },
    { label: 'Proyek dengan Milestone Terlambat', value: summary.overdue_projects, description: 'Proyek aktif dengan tenggat sebelum hari ini (WIB)', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">Divisi Project</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">Dashboard Portofolio Proyek</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan seluruh {summary.total_projects} proyek berdasarkan data tercatat.</p>
          <p className="mt-1 text-xs text-slate-500">Diperbarui {new Date(summary.as_of).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
        </div>
        <Link to="/projects/list" className="inline-flex items-center gap-2 rounded-input border border-line bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">
          Lihat Semua Proyek <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, description, icon: Icon }) => (
          <section key={label} className="min-w-0 rounded-card-lg border border-line bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-600">{label}</h2>
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-primary-700" />
            </div>
            <p className="mt-3 break-words text-2xl font-bold tabular-nums text-navy">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{description}</p>
          </section>
        ))}
      </div>

      {summary.total_projects === 0 ? (
        <EmptyState title="Belum ada proyek" description="Ringkasan akan tersedia setelah data proyek dicatat." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="min-w-0 rounded-card-lg border border-line bg-white p-5 shadow-card">
            <h2 className="font-bold text-navy">Status Portofolio</h2>
            <p className="mt-1 text-xs text-slate-500">Jumlah proyek menurut status pelaksanaan.</p>
            <div className="mt-4 h-56" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Jumlah proyek" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {distribution.map(status => <Cell key={status.key} fill={status.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              {distribution.map(status => <li key={status.key}>{status.label}: <strong>{status.value} proyek</strong></li>)}
            </ul>
          </section>

          <section className="min-w-0 rounded-card-lg border border-line bg-white p-5 shadow-card">
            <h2 className="font-bold text-navy">Pencatatan Proyek per Bulan</h2>
            <p className="mt-1 text-xs text-slate-500">Berdasarkan tanggal pencatatan, enam bulan terakhir (WIB).</p>
            <div className="mt-4 h-56" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="baru" name="Baru dicatat" fill="#7dd3fc" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line dataKey="total" name="Akumulasi pencatatan" stroke="#0284c7" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-3 text-xs text-slate-600">
              <summary className="cursor-pointer">Lihat angka bulanan</summary>
              <ul className="mt-2 space-y-1">{trend.map(month => <li key={month.label}>{month.label}: {month.baru} baru, {month.total} akumulasi</li>)}</ul>
            </details>
          </section>
        </div>
      )}

      <section className="rounded-card-lg border border-line bg-white p-5 shadow-card">
        <h2 className="font-bold text-navy">Milestone yang Perlu Ditinjau</h2>
        <p className="mt-1 text-xs text-slate-500">Maksimal lima proyek aktif dengan milestone melewati tenggat dan belum selesai. Proyek ditunda dihitung terpisah pada status portofolio.</p>
        {summary.attention_projects.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Tidak ada milestone terlambat pada proyek aktif yang tercatat.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {summary.attention_projects.map(project => (
              <li key={project.id}>
                <Link to={`/projects/${project.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary-700">
                  <div className="min-w-0"><p className="break-words font-semibold">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.client_name || 'Klien belum dicatat'} · {project.overdue_milestones_count} milestone terlambat</p></div>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 border-t border-line pt-3 text-xs text-slate-500">Progres merupakan rata-rata sederhana kontribusi milestone dari proyek aktif dengan total bobot 100%. Angka ini belum menyatakan verifikasi pekerjaan atau persetujuan serah terima.</p>
      </section>
    </div>
  );
}
