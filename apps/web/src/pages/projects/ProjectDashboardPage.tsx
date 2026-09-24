import { useEffect, useState } from 'react';
import { projectApi } from '../../api/projects';
import { Project } from '../../types/project';
import { 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Clock,
  HardHat,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProjectDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectApi.getProjects({ per_page: 100 });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const delayedProjects = projects.filter(p => p.status === 'on_hold' || (p.status === 'in_progress' && Math.random() > 0.7)); // Simulated risk
  const totalValue = activeProjects.reduce((acc, curr) => acc + parseFloat(curr.contract_value.toString()), 0);

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard Proyek
        </h1>
        <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
          Pusat kendali portofolio proyek. Pantau ringkasan performa fisik, penyerapan anggaran, dan identifikasi proyek yang membutuhkan intervensi segera.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 shadow-lg shadow-primary-900/20">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Proyek Aktif</p>
              <p className="mt-2 text-3xl font-bold text-white">{activeProjects.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-sm font-medium text-primary-200">
            <span>Sedang dalam tahap konstruksi</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="group rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Nilai Kontrak (Aktif)</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                Rp {(totalValue / 1000000000).toFixed(2)}M
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span>+12.5% vs Q2</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="group rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rata-rata Progres Fisik</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">68.4%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/30">
              <Activity className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div className="mt-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
            <div className="bg-sky-500 h-full w-[68.4%]" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="group rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Risiko & Keterlambatan</p>
              <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-500">
                {delayedProjects.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/30">
              <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-rose-600 dark:text-rose-500">
            <span>Membutuhkan eskalasi manajer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Chart & Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Overview */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Status Penyerapan Proyek</h2>
                <p className="text-sm text-slate-500">Distribusi berdasarkan fase pelaksanaan</p>
              </div>
              <Link to="/projects/list" className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-5">
              {[
                { label: 'Persiapan & Planning', count: projects.filter(p => p.status === 'planning').length, color: 'bg-slate-400' },
                { label: 'Konstruksi Berjalan', count: activeProjects.length, color: 'bg-sky-500' },
                { label: 'Tertunda / On Hold', count: projects.filter(p => p.status === 'on_hold').length, color: 'bg-rose-500' },
                { label: 'Selesai / Handover', count: projects.filter(p => p.status === 'completed').length, color: 'bg-emerald-500' }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stat.count} Proyek</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} transition-all duration-1000 ease-out`} 
                      style={{ width: `${projects.length ? (stat.count / projects.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Projects Need Attention */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-rose-200 dark:ring-rose-900/30 overflow-hidden">
            <div className="bg-rose-50 dark:bg-rose-900/10 p-5 border-b border-rose-100 dark:border-rose-900/20 flex justify-between items-center">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold">
                <AlertTriangle className="h-5 w-5" />
                Sorotan Proyek Kritis
              </div>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded">Eskalasi Diperlukan</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {delayedProjects.slice(0, 3).map((project, idx) => (
                <div key={project.id || idx} className="p-5 flex items-start justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{project.name}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-orange-500" /> Deadline dekat</span>
                      <span className="flex items-center gap-1.5"><HardHat className="h-3.5 w-3.5 text-slate-400" /> Vendor: PT Maju Mundur</span>
                    </div>
                  </div>
                  <Link 
                    to={`/projects/progress?project_id=${project.id}`}
                    className="shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Inspeksi
                  </Link>
                </div>
              ))}
              {delayedProjects.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  Semua proyek terpantau aman. Tidak ada indikasi keterlambatan.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Aktivitas & Timeline */}
        <div className="space-y-6">
          
          <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 h-full min-h-[400px]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-sky-500" />
              Aktivitas Divisi Terbaru
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-white dark:ring-slate-900">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Termin 3 Dibayarkan</p>
                  <p className="text-xs text-slate-500 mt-0.5">Proyek Pembangunan Tower A</p>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">2 JAM YANG LALU</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 ring-4 ring-white dark:ring-slate-900">
                  <HardHat className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Laporan Fisik Mingguan Masuk</p>
                  <p className="text-xs text-slate-500 mt-0.5">Revitalisasi Area B - 45% selesai</p>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">5 JAM YANG LALU</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 ring-4 ring-white dark:ring-slate-900">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Peringatan Keterlambatan Vendor</p>
                  <p className="text-xs text-slate-500 mt-0.5">PT Konstruksi Hebat terlambat 3 hari</p>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">KEMARIN</span>
                </div>
              </div>
              
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white dark:ring-slate-900">
                  <Briefcase className="h-3.5 w-3.5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Proyek Baru Didaftarkan</p>
                  <p className="text-xs text-slate-500 mt-0.5">Instalasi Jaringan Listrik Baru</p>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">2 HARI YANG LALU</span>
                </div>
              </div>

            </div>
            
            <button className="mt-8 w-full rounded-xl bg-slate-50 dark:bg-slate-800/50 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Lihat Log Lengkap
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
