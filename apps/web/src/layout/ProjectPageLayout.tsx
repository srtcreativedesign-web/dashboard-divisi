import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { projectApi } from '../api/projects';
import { Project } from '../types/project';
import { ProjectSelector } from '../components/projects/ProjectSelector';
import { LoadingState, EmptyState } from '../components/states';
import { Button } from '../components/ui/Button';
import { BarChart, BarChartData } from '../components/charts';
import {
  Building2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  FolderKanban,
  Wallet,
  Calculator,
  Receipt,
  Clock,
  FileText,
  ClipboardCheck,
} from 'lucide-react';

interface ProjectPageLayoutProps {
  title: string;
  description: string;
  children: (project: Project, fetchProject: () => Promise<void>) => React.ReactNode;
}

export function ProjectPageLayout({ title, description, children }: ProjectPageLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const projectId = paramId || searchParams.get('project_id');

  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      setProject(null);
      fetchPortfolioSummary();
    }
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      setLoading(true);
      const data = await projectApi.getProject(Number(id));
      setProject(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail proyek');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioSummary = async () => {
    try {
      setPortfolioLoading(true);
      const res = await projectApi.getProjects({ per_page: 100 });
      setAllProjects(res.data);
    } catch (err) {
      console.error('Gagal memuat portofolio proyek', err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleSelectProject = (id: string) => {
    if (!id) {
      if (paramId) {
        navigate(location.pathname.replace(new RegExp(`/${paramId}$`), ''));
      } else {
        setSearchParams({});
      }
      return;
    }

    if (paramId) {
      navigate(`/projects/${id}`);
    } else {
      setSearchParams({ project_id: id });
    }
  };

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface text-muted border border-line">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Planning
          </span>
        );
    }
  };

  const getClassificationBadge = (classification?: string) => {
    if (classification === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Maintenance
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        Proyek Baru
      </span>
    );
  };

  // Calculate Cumulative Physical Progress for active project
  let cumulativeProgress = 0;
  if (project?.milestones && project.milestones.length > 0) {
    project.milestones.forEach((m) => {
      const weight = m.weight_percentage || 0;
      const actual = m.actual_percentage ?? (m.status === 'completed' ? 100 : 0);
      cumulativeProgress += (actual / 100) * weight;
    });
  }
  cumulativeProgress = Math.min(100, Math.round(cumulativeProgress * 10) / 10);

  // Render Portofolio Summary Chart bila belum ada proyek yang dipilih
  const renderPortfolioOverview = () => {
    const isPettyCash = location.pathname.includes('/projects/petty-cash');
    const isRab = location.pathname.includes('/projects/rab');
    const isPayments = location.pathname.includes('/projects/payments');
    const isTimeline = location.pathname.includes('/projects/timeline');
    const isProgress = location.pathname.includes('/projects/progress');
    const isDocuments = location.pathname.includes('/projects/documents');
    const isLpj = location.pathname.includes('/projects/lpj');

    const totalPortfolioValue = allProjects.reduce((acc, p) => acc + (parseFloat(p.contract_value?.toString() || '0')), 0);

    let metricTitle = 'Nilai Kontrak Proyek';
    let chartData: BarChartData[] = [];
    let summaryCards = [
      { label: 'Total Proyek', val: String(allProjects.length), sub: 'Seluruh portofolio' },
      { label: 'Total Nilai Kontrak', val: formatCurrency(totalPortfolioValue), sub: 'Nilai agregat' },
    ];

    if (isPettyCash) {
      metricTitle = 'Perbandingan Saldo Kas Masuk & Keluar (Petty Cash)';
      const totalIn = allProjects.reduce((acc, p) => {
        const pIn = p.pettyCashes?.filter(c => c.type === 'in').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        return acc + pIn;
      }, 0);
      const totalOut = allProjects.reduce((acc, p) => {
        const pOut = p.pettyCashes?.filter(c => c.type === 'out').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        return acc + pOut;
      }, 0);

      chartData = allProjects.map((p) => {
        const pIn = p.pettyCashes?.filter(c => c.type === 'in').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const pOut = p.pettyCashes?.filter(c => c.type === 'out').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const net = Math.max(0, pIn - pOut);
        return {
          label: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
          value: net > 0 ? net : pIn || 1,
          color: '#0284c7',
          subLabel: formatCurrency(net),
        };
      });

      summaryCards = [
        { label: 'Total Drop Kas Masuk', val: formatCurrency(totalIn), sub: 'Dari seluruh proyek' },
        { label: 'Total Pengeluaran Kas', val: formatCurrency(totalOut), sub: 'Realisasi lapangan' },
        { label: 'Sisa Saldo Kas Bersih', val: formatCurrency(totalIn - totalOut), sub: 'Saldo taktis berjalan' },
      ];
    } else if (isRab) {
      metricTitle = 'Total Anggaran RAB per Proyek';
      const totalRabSum = allProjects.reduce((acc, p) => {
        const rSum = p.rabs?.reduce((s, r) => s + Number(r.total_price), 0) || 0;
        return acc + rSum;
      }, 0);

      chartData = allProjects.map((p) => {
        const rabTotal = p.rabs?.reduce((s, r) => s + Number(r.total_price), 0) || 0;
        return {
          label: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
          value: rabTotal || 1,
          color: '#059669',
          subLabel: formatCurrency(rabTotal),
        };
      });

      summaryCards = [
        { label: 'Total Anggaran RAB Terbit', val: formatCurrency(totalRabSum), sub: 'Dari item RAB disetujui' },
        { label: 'Total Nilai Kontrak', val: formatCurrency(totalPortfolioValue), sub: 'Nilai plafon kerja' },
      ];
    } else if (isPayments) {
      metricTitle = 'Realisasi Termin & Pembayaran per Proyek';
      const totalInvoiced = allProjects.reduce((acc, p) => {
        return acc + (p.invoices?.reduce((s, inv) => s + Number(inv.amount), 0) || 0);
      }, 0);
      const totalPaid = allProjects.reduce((acc, p) => {
        return acc + (p.invoices?.filter(i => i.status === 'paid').reduce((s, inv) => s + Number(inv.amount), 0) || 0);
      }, 0);

      chartData = allProjects.map((p) => {
        const paid = p.invoices?.filter(i => i.status === 'paid').reduce((s, inv) => s + Number(inv.amount), 0) || 0;
        return {
          label: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
          value: paid || 1,
          color: '#16a34a',
          subLabel: formatCurrency(paid),
        };
      });

      summaryCards = [
        { label: 'Total Termin Ditagihkan', val: formatCurrency(totalInvoiced), sub: 'Invoice tercatat' },
        { label: 'Total Pelunasan Kas Masuk', val: formatCurrency(totalPaid), sub: 'Pembayaran diterima' },
        { label: 'Sisa Piutang Berjalan', val: formatCurrency(totalInvoiced - totalPaid), sub: 'Menunggu pelunasan' },
      ];
    } else {
      // Progress, Timeline, Documents, LPJ
      metricTitle = 'Progres Fisik Rata-rata Proyek (%)';
      chartData = allProjects.map((p) => {
        let prog = 0;
        if (p.milestones && p.milestones.length > 0) {
          p.milestones.forEach((m) => {
            const w = m.weight_percentage || 0;
            const a = m.actual_percentage ?? (m.status === 'completed' ? 100 : 0);
            prog += (a / 100) * w;
          });
        }
        prog = Math.min(100, Math.round(prog * 10) / 10);
        return {
          label: p.name.length > 15 ? `${p.name.slice(0, 15)}...` : p.name,
          value: prog || 1,
          color: prog === 100 ? '#16a34a' : '#0284c7',
          subLabel: `${prog}%`,
        };
      });
    }

    return (
      <div className="space-y-6">
        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="rounded-card border border-line bg-panel p-5 shadow-card">
              <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">{card.label}</p>
              <h3 className="mt-1 text-2xl font-bold text-navy">{card.val}</h3>
              <p className="text-xs text-muted mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* SUMMARY CHART */}
        <div className="rounded-card-lg border border-line bg-panel p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-navy">{metricTitle}</h2>
              <p className="text-xs text-muted mt-0.5">
                Gambaran komparatif portofolio. Klik pada bar atau tombol proyek untuk membuka detail modul.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded border border-primary-200">
              {allProjects.length} Proyek Terdaftar
            </span>
          </div>

          {allProjects.length > 0 ? (
            <div className="pt-2">
              <BarChart
                data={chartData}
                height={160}
                onBarClick={(_, index) => {
                  const targetProject = allProjects[index];
                  if (targetProject) handleSelectProject(String(targetProject.id));
                }}
              />
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted">Belum ada data proyek terdaftar.</div>
          )}
        </div>

        {/* LIST TABLE OF ALL PROJECTS FOR QUICK SELECTION */}
        <div className="rounded-card-lg border border-line bg-panel shadow-card overflow-hidden">
          <div className="p-4 border-b border-line bg-surface/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy">Pilih Proyek untuk Dikelola</h3>
            <span className="text-xs text-muted">Klik salah satu proyek di bawah untuk memuat data operasional</span>
          </div>
          <div className="divide-y divide-line">
            {allProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProject(String(p.id))}
                className="p-4 flex items-center justify-between hover:bg-surface/80 transition-colors cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-muted bg-surface border border-line px-1.5 py-0.5 rounded">
                      {p.project_code || `PRJ-${p.id}`}
                    </span>
                    <h4 className="text-sm font-bold text-navy group-hover:text-primary-700 transition-colors">
                      {p.name}
                    </h4>
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{p.client_name || 'Klien Internal'}</span>
                    <span>•</span>
                    <span className="font-semibold text-navy">{formatCurrency(Number(p.contract_value))}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-200 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-xs"
                  >
                    <span>Buka Data</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ENTERPRISE HERO BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-input text-[10px] font-bold tracking-wider uppercase bg-primary-50 text-primary-700 border border-primary-200">
              Divisi Proyek
            </span>
            <span className="text-xs text-slate-300">&bull;</span>
            <span className="text-xs text-muted font-medium">Manajemen Portofolio & Kontrol Lapangan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy mt-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSelector selectedProjectId={projectId} onSelectProject={handleSelectProject} />
        </div>
      </div>

      {/* ACTIVE PROJECT CONTEXT CARD */}
      {project && (
        <div className="rounded-card-lg border border-line bg-panel shadow-card overflow-hidden">
          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-surface to-panel">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-muted bg-panel border border-line px-2 py-0.5 rounded-input shadow-xs">
                  {project.project_code || `PRJ-${project.id}`}
                </span>
                {getClassificationBadge(project.classification)}
                <h2 className="text-lg font-bold text-navy">
                  {project.name}
                </h2>
                {getStatusBadge(project.status)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-navy">{project.client_name || 'Klien Internal'}</span>
                </div>
                {project.location && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-300">•</span>
                    <span>{project.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">•</span>
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-navy">{formatCurrency(Number(project.contract_value))}</span>
                </div>
              </div>
            </div>

            {/* Quick Progress Indicator & Action */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-40 sm:w-48 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium">Progres Fisik</span>
                  <span className="font-bold text-primary-600 dark:text-primary-300">{cumulativeProgress}%</span>
                </div>
                <div className="w-full h-2 bg-line rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      cumulativeProgress === 100 ? 'bg-success' : 'bg-primary-600'
                    }`}
                    style={{ width: `${cumulativeProgress}%` }}
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSelectProject('')}
                className="shrink-0 text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200"
                title="Tutup konteks proyek aktif dan kembali ke grafik ringkasan seluruh proyek"
              >
                <LayoutDashboard className="h-3.5 w-3.5 mr-1 text-primary-600" />
                Semua Proyek (Summary)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(paramId ? '/projects/list' : `/projects/${project.id}`)}
                className="shrink-0 text-xs"
              >
                {paramId ? 'Daftar Portofolio' : 'Detail Lengkap'}
                {paramId ? <ArrowRight className="h-3.5 w-3.5 ml-1" /> : <ExternalLink className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingState label="Memuat data proyek..." />}

      {!loading && error && <EmptyState title="Terjadi Kesalahan" description={error} />}

      {!loading && !error && !project && (portfolioLoading ? <LoadingState label="Memuat ringkasan portofolio..." /> : renderPortfolioOverview())}

      {!loading && !error && project && children(project, () => fetchProject(projectId!))}
    </div>
  );
}
