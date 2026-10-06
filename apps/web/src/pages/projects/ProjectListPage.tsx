import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../../api/projects';
import { Project } from '../../types/project';
import {
  Plus,
  Search,
  AlertCircle,
  LayoutGrid,
  List,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { LoadingState, EmptyState } from '../../components/states';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getProjects({
        search: search || undefined,
        status: statusFilter || undefined,
        per_page: 50,
      });
      setProjects(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data proyek');
    } finally {
      setLoading(false);
    }
  };

  const activeProjectsCount = projects.filter(p => p.status === 'in_progress').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length;
  const totalValue = projects.reduce((acc, curr) => acc + parseFloat(curr.contract_value.toString()), 0);

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            Berjalan (In Progress)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Selesai (Completed)
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            Tertunda (On Hold)
          </span>
        );
      case 'planning':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Perencanaan (Planning)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER HERO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              Divisi Proyek
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Manajemen Portofolio & Lapangan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Daftar Proyek & Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pantau progres fisik, milestone, kontrol anggaran RAB, galeri before-after, dan berita acara serah terima.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          Tambah Proyek Baru
        </button>
      </div>

      {/* KPI STATS ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Portofolio</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{projects.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua proyek terdaftar</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proyek Berjalan</p>
            <h3 className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">{activeProjectsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Fisik aktif di lapangan</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proyek Selesai</p>
            <h3 className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedProjectsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Serah terima BAST selesai</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Nilai Kontrak</p>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(totalValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi nilai transaksi</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Cari berdasarkan nama proyek, kode, atau klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="planning">Perencanaan (Planning)</option>
            <option value="in_progress">Sedang Berjalan (In Progress)</option>
            <option value="on_hold">Ditunda (On Hold)</option>
            <option value="completed">Selesai (Completed)</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Tabel"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ERROR / LOADING / EMPTY STATE */}
      {error ? (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-5 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Terjadi Kesalahan</h4>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingState label="Memuat data portofolio proyek..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Tidak Ada Proyek Ditemukan"
          description={search || statusFilter ? 'Coba ubah kata kunci pencarian atau filter status proyek Anda.' : 'Belum ada proyek yang dibuat. Buat proyek pertama Anda sekarang.'}
          action={
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Buat Proyek Pertama
            </button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const contract = parseFloat(project.contract_value.toString());
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer overflow-hidden"
              >
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {project.project_code || `PRJ-${project.id}`}
                    </span>
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {project.description || 'Tidak ada deskripsi detail pekerjaan.'}
                  </p>

                  {/* Client & Location */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.client_name || 'Klien Internal'}</span>
                    </div>
                    {project.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Contract & Date */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Nilai Kontrak</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(contract)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Tenggat Waktu</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Kode & Nama Proyek</th>
                  <th className="px-5 py-3.5">Klien & Lokasi</th>
                  <th className="px-5 py-3.5 text-right">Nilai Kontrak</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Jadwal Selesai</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {project.project_code || `PRJ-${project.id}`}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{project.client_name || '-'}</p>
                      <p className="text-[11px] text-slate-400">{project.location || 'Indonesia'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(Number(project.contract_value))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400 font-medium">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400">
                      <ChevronRight className="h-4 w-4 inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PROYEK */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchProjects()}
      />
    </div>
  );
}
