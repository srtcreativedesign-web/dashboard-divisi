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
import { Button } from '../../components/ui/Button';

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
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
          Dashboard Proyek
        </h1>
        <p className="text-slate-500 max-w-2xl text-sm leading-relaxed">
          Pusat kendali portofolio proyek. Pantau ringkasan performa fisik, penyerapan anggaran, dan identifikasi proyek yang membutuhkan intervensi segera.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="group relative overflow-hidden rounded-card-lg bg-gradient-to-br from-primary-600 to-primary-800 p-6 shadow-card hover:shadow-card-hover transition-all text-white">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Proyek Aktif</p>
              <p className="mt-2 text-3xl font-bold text-white">{activeProjects.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-white/20 backdrop-blur-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center text-xs font-medium text-primary-200">
            <span>Sedang dalam tahap konstruksi</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="group rounded-card-lg bg-white p-6 shadow-card hover:shadow-card-hover border border-line transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Nilai Kontrak (Aktif)</p>
              <p className="mt-2 text-2xl font-bold text-navy">
                Rp {(totalValue / 1000000000).toFixed(2)}M
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-success-light text-success border border-success/30">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-success">
            <TrendingUp className="h-4 w-4" />
            <span>+12.5% vs Q2</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="group rounded-card-lg bg-white p-6 shadow-card hover:shadow-card-hover border border-line transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Rata-rata Progres Fisik</p>
              <p className="mt-2 text-3xl font-bold text-navy">68.4%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-surface-2 text-primary-600 border border-primary/20">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 w-full rounded-pill bg-surface-2 border border-line h-2 overflow-hidden">
            <div className="bg-primary-600 h-full w-[68.4%] rounded-pill transition-all duration-700" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="group rounded-card-lg bg-white p-6 shadow-card hover:shadow-card-hover border border-line transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Risiko & Keterlambatan</p>
              <p className="mt-2 text-3xl font-bold text-danger">
                {delayedProjects.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-card bg-danger-light text-danger border border-danger/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-danger">
            <span>Membutuhkan eskalasi manajer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Chart & Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Overview */}
          <div className="rounded-card-lg bg-white shadow-card border border-line p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-navy">Status Penyerapan Proyek</h2>
                <p className="text-xs text-slate-500">Distribusi berdasarkan fase pelaksanaan</p>
              </div>
              <Link to="/projects/list" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-5">
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

          {/* Critical Projects Need Attention */}
          <div className="rounded-card-lg bg-white shadow-card border border-danger/30 overflow-hidden">
            <div className="bg-danger-light/40 p-4 border-b border-danger/20 flex justify-between items-center">
              <div className="flex items-center gap-2 text-danger font-bold text-sm">
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
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2.5 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-warning" /> Deadline dekat</span>
                      <span className="flex items-center gap-1.5"><HardHat className="h-3.5 w-3.5 text-slate-400" /> Vendor: PT Rekayasa Digital</span>
                    </div>
                  </div>
                  <Link 
                    to={`/projects/progress?project_id=${project.id}`}
                    className="shrink-0 bg-white border border-line text-navy text-xs font-semibold px-3 py-1.5 rounded-input hover:bg-surface hover:border-line-2 transition-all shadow-card"
                  >
                    Inspeksi
                  </Link>
                </div>
              ))}
              {delayedProjects.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                  Semua proyek terpantau aman. Tidak ada indikasi keterlambatan.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Aktivitas & Timeline */}
        <div className="space-y-6">
          
          <div className="rounded-card-lg bg-white shadow-card border border-line p-6 h-full min-h-[400px]">
            <h2 className="text-base font-bold text-navy mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Aktivitas Divisi Terbaru
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-line">
              
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-success-light text-success border border-success/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Termin 3 Dibayarkan</p>
                  <p className="text-xs text-slate-500 mt-0.5">Proyek Pembangunan Tower A</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block tracking-wider">2 JAM YANG LALU</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-primary-600 border border-primary/20">
                  <HardHat className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Laporan Fisik Mingguan Masuk</p>
                  <p className="text-xs text-slate-500 mt-0.5">Revitalisasi Area B - 45% selesai</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block tracking-wider">5 JAM YANG LALU</span>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-danger-light text-danger border border-danger/30">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Peringatan Keterlambatan Vendor</p>
                  <p className="text-xs text-slate-500 mt-0.5">PT Konstruksi Hebat terlambat 3 hari</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block tracking-wider">KEMARIN</span>
                </div>
              </div>
              
              <div className="relative flex items-start gap-4">
                <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-navy border border-line">
                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">Proyek Baru Didaftarkan</p>
                  <p className="text-xs text-slate-500 mt-0.5">Instalasi Jaringan Listrik Baru</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block tracking-wider">2 HARI YANG LALU</span>
                </div>
              </div>

            </div>
            
            <Button variant="secondary" className="mt-8 w-full">
              Lihat Log Lengkap
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
