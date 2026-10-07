import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { projectApi } from '../api/projects';
import { Project } from '../types/project';
import { ProjectSelector } from '../components/projects/ProjectSelector';
import { LoadingState, EmptyState } from '../components/states';
import { Button } from '../components/ui/Button';
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Calculator,
  Receipt,
  Clock,
  FileText,
  ArrowRight,
  ExternalLink,
  Wallet,
} from 'lucide-react';

interface ProjectPageLayoutProps {
  title: string;
  description: string;
  children: (project: Project, fetchProject: () => Promise<void>) => React.ReactNode;
}

export function ProjectPageLayout({ title, description, children }: ProjectPageLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = paramId || searchParams.get('project_id');
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    } else {
      setProject(null);
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

  const handleSelectProject = (id: string) => {
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface text-slate-600 border border-line">
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

  // Calculate Cumulative Physical Progress
  let cumulativeProgress = 0;
  if (project?.milestones && project.milestones.length > 0) {
    project.milestones.forEach((m) => {
      const weight = m.weight_percentage || 0;
      const actual = m.actual_percentage || 0;
      cumulativeProgress += (actual / 100) * weight;
    });
  }
  cumulativeProgress = Math.min(100, Math.round(cumulativeProgress * 10) / 10);

  const subNavLinks = project ? [
    { label: 'Detail & Tabular', path: `/projects/${project.id}`, icon: FolderKanban },
    { label: 'Tahapan & Progres', path: `/projects/progress?project_id=${project.id}`, icon: CheckSquare },
    { label: 'Anggaran & RAB', path: `/projects/rab?project_id=${project.id}`, icon: Calculator },
    { label: 'Termin & Pembayaran', path: `/projects/payments?project_id=${project.id}`, icon: Receipt },
    { label: 'Kas Kecil (Petty Cash)', path: `/projects/petty-cash?project_id=${project.id}`, icon: Wallet },
    { label: 'Time Plan', path: `/projects/timeline?project_id=${project.id}`, icon: Clock },
    { label: 'Berkas Dokumen', path: `/projects/documents?project_id=${project.id}`, icon: FileText },
  ] : [];

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
            <span className="text-xs text-slate-500 font-medium">Manajemen Portofolio & Kontrol Lapangan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy mt-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProjectSelector selectedProjectId={projectId} onSelectProject={handleSelectProject} />
        </div>
      </div>

      {/* ACTIVE PROJECT CONTEXT CARD */}
      {project && (
        <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
          <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-surface to-white">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-line px-2 py-0.5 rounded-input shadow-xs">
                  {project.project_code || `PRJ-${project.id}`}
                </span>
                {getClassificationBadge(project.classification)}
                <h2 className="text-lg font-bold text-navy">
                  {project.name}
                </h2>
                {getStatusBadge(project.status)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
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
                  <span className="text-slate-500 font-medium">Progres Fisik</span>
                  <span className="font-bold text-primary-600">{cumulativeProgress}%</span>
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
                onClick={() => navigate(paramId ? '/projects/list' : `/projects/${project.id}`)}
                className="shrink-0 text-xs"
              >
                {paramId ? 'Daftar Portofolio' : 'Detail Lengkap'}
                {paramId ? <ArrowRight className="h-3.5 w-3.5 ml-1" /> : <ExternalLink className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
          </div>

          {/* CONTEXTUAL SUB-NAV TABS */}
          <div className="border-t border-line bg-surface/50 px-3">
            <nav className="flex space-x-1 overflow-x-auto scrollbar-none" aria-label="Project Sub Navigation">
              {subNavLinks.map((tab) => {
                const Icon = tab.icon;
                const currentFull = `${location.pathname}${location.search}`;
                const isActive = location.pathname === tab.path.split('?')[0];

                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                      isActive
                        ? 'border-primary-600 text-primary-700 bg-white font-bold'
                        : 'border-transparent text-slate-600 hover:text-navy hover:bg-white/60'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {loading && <LoadingState label="Memuat data proyek..." />}
      
      {!loading && error && <EmptyState title="Terjadi Kesalahan" description={error} />}
      
      {!loading && !error && !project && (
        <EmptyState 
          title="Pilih Proyek Terlebih Dahulu" 
          description="Gunakan pemilih proyek di pojok kanan atas untuk memuat data operasional proyek yang ingin Anda pantau." 
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/projects/list')}
              className="mt-2"
            >
              Lihat Daftar Semua Proyek
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          }
        />
      )}
      
      {!loading && !error && project && children(project, () => fetchProject(projectId!))}
    </div>
  );
}
