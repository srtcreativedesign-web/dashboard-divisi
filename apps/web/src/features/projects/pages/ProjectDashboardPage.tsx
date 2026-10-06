import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectApi } from '../../../api/projects';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';

const labels: Record<string,string> = { planning: 'Perencanaan', in_progress: 'Berjalan', on_hold: 'Ditunda', completed: 'Selesai' };
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export default function ProjectDashboardPage() {
  const query = useQuery({ queryKey: ['projects', 'dashboard'], queryFn: () => projectApi.getProjects({ per_page: 100 }) });
  if (query.isLoading) return <LoadingState label="Memuat proyek..." />;
  if (query.error) return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  const projects = query.data?.data ?? [];
  const active = projects.filter(project => project.status === 'in_progress');
  const delayed = projects.filter(project => project.status === 'on_hold' || (project.status === 'in_progress' && project.end_date && project.end_date.slice(0,10) < new Date().toLocaleDateString('en-CA')));
  const metrics = [
    { label: 'Proyek berjalan', value: String(active.length) },
    { label: 'Proyek selesai', value: String(projects.filter(project => project.status === 'completed').length) },
    { label: 'Ditunda / melewati tanggal akhir', value: String(delayed.length) },
    { label: 'Nilai kontrak proyek berjalan', value: rupiah(active.reduce((sum, project) => sum + Number(project.contract_value),0)) },
  ];
  return <div className="space-y-6">
    <section className="rounded-card-lg border border-line bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-navy">Dashboard Proyek</h1>
      <p className="mt-2 text-sm text-slate-500">Ringkasan {projects.length} proyek terbaru yang dimuat dari total {query.data?.total ?? projects.length} proyek tercatat.</p>
      <Link to="/projects/list" className="mt-4 inline-flex text-sm font-medium text-primary">Buka daftar proyek</Link>
    </section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan proyek">
      {metrics.map(metric => <article key={metric.label} className="rounded-card-lg border border-line bg-white p-5 shadow-card"><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-xl font-semibold text-navy">{metric.value}</p></article>)}
    </section>
    {projects.length ? <section className="overflow-x-auto rounded-card-lg border border-line bg-white shadow-card"><table className="w-full text-left text-sm">
      <caption className="px-5 py-4 text-left font-semibold">Proyek terbaru</caption>
      <thead className="bg-surface text-slate-500"><tr>{['Proyek','Status','Tanggal akhir','Nilai kontrak'].map(label => <th key={label} scope="col" className="px-5 py-3">{label}</th>)}</tr></thead>
      <tbody>{projects.slice(0,10).map(project => <tr key={project.id} className="border-t border-line"><td className="px-5 py-3"><Link className="font-medium text-primary" to={'/projects/'+project.id}>{project.name}</Link></td><td className="px-5 py-3">{labels[project.status] ?? project.status}</td><td className="px-5 py-3">{project.end_date?.slice(0,10) ?? 'Belum ditetapkan'}</td><td className="px-5 py-3">{rupiah(Number(project.contract_value))}</td></tr>)}</tbody>
    </table></section> : <EmptyState title="Belum ada proyek" description="Proyek yang sudah dicatat akan muncul di sini." />}
  </div>;
}
