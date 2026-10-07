import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah, formatDate } from '../../../utils/format';
import { projectApi } from '../../../api/projects';
import { Project } from '../../../types/project';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { LoadingState, EmptyState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { ProjectCreateForm } from '../ProjectCreateForm';

export default function ProjectListPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const [creating, setCreating] = useState(false);
  const canView = Boolean(user && hasCapability(user.role, 'view:projects', user.divisionCode));
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!canView) return;
    let active = true;
    setLoading(true); setError(null); setProjects([]);
    projectApi.getProjects({ search: search || undefined, status: statusFilter || undefined, per_page: 50, page })
      .then(data => { if (active) { setProjects(data.data); setLastPage(data.last_page ?? 1); } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Gagal memuat data proyek'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, statusFilter, page, reload, canView]);

  const activeProjectsCount = projects.filter(p => p.status === 'in_progress').length;
  if (!canView) return <p role="alert">Akses proyek tidak tersedia untuk akun ini.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">Daftar Proyek</h1>
          <p className="text-sm text-subtle">Manajemen portofolio proyek dan pemantauan status</p>
        </div>
        {canManage && <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <Plus className="h-4 w-4" />
          Proyek Baru
        </button>}
      </div>
      {canManage && creating && <ProjectCreateForm onCancel={() => setCreating(false)} onCreated={async () => { setCreating(false); setReload(value => value + 1); }} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line dark:border-slate-800 bg-panel dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-sm font-medium text-subtle">Proyek pada halaman ini</div>
          <div className="mt-2 text-3xl font-bold text-navy dark:text-white">{loading || error ? '—' : projects.length}</div>
        </div>
        <div className="rounded-xl border border-line dark:border-slate-800 bg-panel dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-sm font-medium text-subtle">Berjalan pada halaman ini</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{loading || error ? '—' : activeProjectsCount}</div>
        </div>
        <div className="rounded-xl border border-line dark:border-slate-800 bg-panel dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-sm font-medium text-subtle">Batas per halaman</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            50 proyek
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-navy ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
            aria-label="Cari proyek" maxLength={255}
            placeholder="Cari proyek..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          aria-label="Status proyek"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="block w-full sm:w-48 rounded-lg border-0 py-2 pl-3 pr-10 text-navy ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
        >
          <option value="">Semua Status</option>
          <option value="planning">Perencanaan</option>
          <option value="in_progress">Berjalan</option>
          <option value="on_hold">Ditunda</option>
          <option value="completed">Selesai</option>
        </select>
      </div>

      {error ? (
        <div role="alert" className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p><button type="button" className="mt-3 min-h-10 underline" onClick={() => setReload(value => value + 1)}>Coba lagi</button>
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Tidak ada proyek"
          description="Belum ada proyek yang ditambahkan atau tidak ada yang cocok dengan pencarian Anda."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line dark:border-slate-800 bg-panel dark:bg-slate-900 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-surface dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Nama Proyek</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Klien</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Nilai Kontrak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Tenggat</th>
                <th className="px-6 py-3 relative">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-panel dark:bg-slate-900">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-surface dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-navy dark:text-white">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle dark:text-slate-400">
                    {project.client_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-navy dark:text-white">
                    {formatRupiah(project.contract_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'on_hold' ? 'bg-red-100 text-red-800' :
                      'bg-surface text-navy'
                    }`}>
                      {{ planning: 'Perencanaan', in_progress: 'Berjalan', on_hold: 'Ditunda', completed: 'Selesai' }[project.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle dark:text-slate-400">
                    {project.end_date ? formatDate(project.end_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/projects/${project.id}`} aria-label={`Detail proyek ${project.name}`} className="inline-flex min-h-10 items-center text-primary-600 dark:text-primary-300 underline focus-visible:outline focus-visible:outline-2">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && projects.length > 0 && <nav aria-label="Halaman daftar proyek" className="flex flex-wrap items-center gap-4 text-sm">
        <button className="min-h-10 rounded-lg border border-line px-3 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
        <span>Halaman {page} dari {lastPage}</span>
        <button className="min-h-10 rounded-lg border border-line px-3 disabled:opacity-50" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>Berikutnya</button>
      </nav>}
    </div>
  );
}
