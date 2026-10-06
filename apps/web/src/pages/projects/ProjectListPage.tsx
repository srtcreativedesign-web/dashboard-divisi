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
} from 'lucide-react';
import { LoadingState, EmptyState } from '../../components/states';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';
import { Button } from '../../components/ui/Button';
import { BarChart } from '../../components/charts';

export default function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    projectApi.getProjects({ per_page: 100 }).then(res => setAllProjects(res.data)).catch(() => {});
  }, []);

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
      if (!search && !statusFilter) {
        setAllProjects(data.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data proyek');
    } finally {
      setLoading(false);
    }
  };

  const portfolioSource = allProjects.length > 0 ? allProjects : projects;
  const activeProjectsCount = portfolioSource.filter(p => p.status === 'in_progress').length;
  const completedProjectsCount = portfolioSource.filter(p => p.status === 'completed').length;
  const totalValue = portfolioSource.reduce((acc, curr) => acc + parseFloat(curr.contract_value.toString()), 0);

  const statusConfig = [
    { key: 'planning', label: 'Planning', idLabel: 'Perencanaan', color: '#94a3b8' },
    { key: 'in_progress', label: 'In Progress', idLabel: 'Sedang Berjalan', color: '#0284c7' },
    { key: 'on_hold', label: 'On Hold', idLabel: 'Ditunda', color: '#f59e0b' },
    { key: 'completed', label: 'Completed', idLabel: 'Selesai', color: '#16a34a' },
  ];

  const totalCount = portfolioSource.length;

  const statusBreakdown = statusConfig.map(cfg => {
    const matched = portfolioSource.filter(p => p.status === cfg.key);
    const count = matched.length;
    const value = matched.reduce((sum, p) => sum + parseFloat(p.contract_value?.toString() || '0'), 0);
    const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return {
      ...cfg,
      count,
      value,
      percentage,
      formattedValue: formatCurrency(value),
    };
  });

  const statusChart = statusBreakdown.map(s => ({
    label: s.label,
    value: s.count,
    color: s.color,
    subLabel: `${s.percentage}%`,
  }));

  const activeStatusConfig = statusConfig.find(s => s.key === statusFilter);
  const activeStatusLabel = activeStatusConfig ? activeStatusConfig.label : undefined;

  function formatCurrency(val: number | undefined | null) {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-success-light text-success border border-success/30">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Completed
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-danger-light text-danger border border-danger/30">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            On Hold
          </span>
        );
      case 'planning':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface text-slate-600 border border-line">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Planning
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER HERO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-input text-[10px] font-bold tracking-wider uppercase bg-primary-50 text-primary-700 border border-primary-200">
              Divisi Proyek
            </span>
            <span className="text-xs text-slate-300">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Manajemen Portofolio & Kontrol Lapangan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy mt-1">
            Daftar Proyek & Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pantau progres fisik, tahapan milestone, kontrol anggaran RAB, galeri visual, dan BAST.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          Tambah Proyek Baru
        </Button>
      </div>

      {/* KPI STATS ROW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Portofolio</p>
            <h3 className="mt-1 text-2xl font-bold text-navy">{totalCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua proyek terdaftar</p>
          </div>
          <div className="h-10 w-10 rounded-input bg-surface flex items-center justify-center text-slate-600 border border-line">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proyek Berjalan</p>
            <h3 className="mt-1 text-2xl font-bold text-primary-600">{activeProjectsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Fisik aktif di lapangan</p>
          </div>
          <div className="h-10 w-10 rounded-input bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proyek Selesai</p>
            <h3 className="mt-1 text-2xl font-bold text-success">{completedProjectsCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Serah terima BAST selesai</p>
          </div>
          <div className="h-10 w-10 rounded-input bg-success-light flex items-center justify-center text-success border border-success/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Nilai Kontrak</p>
            <h3 className="mt-1 text-xl font-bold text-navy truncate">
              {formatCurrency(totalValue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi nilai transaksi</p>
          </div>
          <div className="h-10 w-10 rounded-input bg-warning-light flex items-center justify-center text-warning border border-warning/30">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Chart Overview & Portfolio Distribution */}
      <div className="rounded-card border border-line bg-white p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-navy">Distribusi Status Proyek</h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-surface px-2 py-0.5 rounded-pill border border-line">
                {totalCount} Total Proyek
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Ringkasan proporsi portofolio berdasarkan fase pelaksanaan</p>
          </div>
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold bg-primary-50 px-2.5 py-1 rounded-input border border-primary-200 transition-colors self-start sm:self-auto"
            >
              Tampilkan Semua ({totalCount})
            </button>
          )}
        </div>

        {/* 2-Column Responsive Layout: Visual Bar Chart (Left) + Interactive Distribution Breakdown (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Responsive Bar Chart */}
          <div className="lg:col-span-7 bg-surface/50 rounded-card p-4 border border-line/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grafik Jumlah Proyek</span>
              <span className="text-[11px] text-slate-400">Klik batang untuk memfilter</span>
            </div>
            <BarChart
              data={statusChart}
              height={140}
              showValues={true}
              activeLabel={activeStatusLabel}
              onBarClick={(item) => {
                const matched = statusConfig.find(s => s.label.toLowerCase() === item.label.toLowerCase());
                if (matched) {
                  setStatusFilter(statusFilter === matched.key ? '' : matched.key);
                }
              }}
            />
          </div>

          {/* Right Column: Macro Progress Bar + Status Cards */}
          <div className="lg:col-span-5 space-y-3">
            {/* Horizontal Macro Distribution Bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
                <span>Proporsi Portofolio</span>
                <span className="font-mono text-navy font-bold">100%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-pill overflow-hidden flex gap-0.5 p-0.5 border border-line/60">
                {statusBreakdown.map((s) => (
                  s.percentage > 0 && (
                    <div
                      key={s.key}
                      className="h-full rounded-pill transition-all duration-500"
                      style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                      title={`${s.label}: ${s.count} proyek (${s.percentage}%)`}
                    />
                  )
                ))}
              </div>
            </div>

            {/* Quick Status Chips / Filter Badges */}
            <div className="grid grid-cols-2 gap-2">
              {statusBreakdown.map((s) => {
                const isActive = statusFilter === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatusFilter(isActive ? '' : s.key)}
                    className={`flex flex-col text-left p-2.5 rounded-card border transition-all ${
                      isActive
                        ? 'border-primary-500 bg-primary-50/70 shadow-xs ring-1 ring-primary-500'
                        : 'border-line bg-white hover:bg-surface hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs font-semibold text-navy truncate">{s.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                        {s.count}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{s.percentage}%</span>
                      <span className="font-medium text-slate-500 truncate ml-1">{s.formattedValue}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-card bg-white border border-line shadow-card">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-input border border-line bg-surface py-2 pl-9 pr-3 text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="Cari berdasarkan nama proyek, kode, atau klien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-input border border-line bg-surface px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Status</option>
            <option value="planning">Perencanaan (Planning)</option>
            <option value="in_progress">Sedang Berjalan (In Progress)</option>
            <option value="on_hold">Ditunda (On Hold)</option>
            <option value="completed">Selesai (Completed)</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-input bg-surface p-0.5 border border-line">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-navy'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-slate-500 hover:text-navy'
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
        <div className="rounded-card bg-danger-light p-5 border border-danger/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-danger">Terjadi Kesalahan</h4>
            <p className="text-xs text-danger mt-0.5">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingState label="Memuat data portofolio proyek..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Tidak Ada Proyek Ditemukan"
          description={search || statusFilter ? 'Coba ubah kata kunci pencarian atau filter status proyek Anda.' : 'Belum ada proyek yang dibuat. Buat proyek pertama Anda sekarang.'}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="mt-3"
            >
              <Plus className="h-4 w-4" />
              Buat Proyek Pertama
            </Button>
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
                className="group relative flex flex-col justify-between rounded-card-lg border border-line bg-white p-5 shadow-card hover:shadow-card-hover hover:border-primary-400 transition-all cursor-pointer overflow-hidden"
              >
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-surface border border-line px-2 py-0.5 rounded-input">
                      {project.project_code || `PRJ-${project.id}`}
                    </span>
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-navy group-hover:text-primary-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {project.description || 'Tidak ada deskripsi detail pekerjaan.'}
                  </p>

                  {/* Client & Location */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
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
                <div className="mt-5 pt-4 border-t border-line flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Nilai Kontrak</span>
                    <span className="font-bold text-navy text-sm">
                      {formatCurrency(contract)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Tenggat Waktu</span>
                    <span className="font-semibold text-slate-700">
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
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                <tr>
                  <th className="px-5 py-3.5">Kode & Nama Proyek</th>
                  <th className="px-5 py-3.5">Klien & Lokasi</th>
                  <th className="px-5 py-3.5 text-right">Nilai Kontrak</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Jadwal Selesai</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="hover:bg-surface cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-surface border border-line px-1.5 py-0.5 rounded-input">
                          {project.project_code || `PRJ-${project.id}`}
                        </span>
                        <span className="font-bold text-navy">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-medium text-navy">{project.client_name || '-'}</p>
                      <p className="text-[11px] text-slate-400">{project.location || 'Indonesia'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-navy">
                      {formatCurrency(Number(project.contract_value))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600 font-medium">
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
        onSuccess={() => {
          fetchProjects();
          projectApi.getProjects({ per_page: 100 }).then(res => setAllProjects(res.data)).catch(() => {});
        }}
      />
    </div>
  );
}
