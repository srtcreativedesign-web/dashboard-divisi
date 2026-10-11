import React from 'react';
import { Project, ProjectMilestone } from '../../types/project';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2,
  FileSpreadsheet,
  User,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProjectStageCardProps {
  project: Project;
  onStageClick: (project: Project, milestone: ProjectMilestone) => void;
  onDeleteProject?: (project: Project) => void;
  onRabClick?: (project: Project) => void;
}

const STANDARD_STAGES = [
  { index: 1, key: 'SURVEI', title: '1. SURVEI', defaultNote: 'Survei lokasi' },
  { index: 2, key: 'IZIN KERJA', title: '2. IZIN KERJA', defaultNote: 'Izin kerja & K3' },
  { index: 3, key: 'RAB', title: '3. RAB', defaultNote: 'Penyusunan RAB' },
  { index: 4, key: 'PAYMENT', title: '4. PAYMENT', defaultNote: '-' },
  { index: 5, key: 'EXECUTION', title: '5. EXECUTION', defaultNote: '-' },
];

export function ProjectStageCard({
  project,
  onStageClick,
  onDeleteProject,
  onRabClick,
}: ProjectStageCardProps) {
  const navigate = useNavigate();

  // Compute total RAB
  const totalRab = React.useMemo(() => {
    if (project.rabs && project.rabs.length > 0) {
      return project.rabs.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    }
    return Number(project.contract_value) || 0;
  }, [project.rabs, project.contract_value]);

  const formattedRab = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(totalRab);

  // Map milestones to 5 standard stages
  const mappedStages = React.useMemo(() => {
    const existingMilestones = project.milestones || [];
    return STANDARD_STAGES.map((std, idx) => {
      // Find matching milestone by title keyword or by index
      const found =
        existingMilestones.find((m) =>
          m.title.toUpperCase().includes(std.key)
        ) || existingMilestones[idx];

      if (found) {
        return {
          milestone: found,
          stageTitle: found.title.startsWith(`${idx + 1}.`) ? found.title : std.title,
          status: found.status || 'pending',
          note: found.notes || std.defaultNote,
        };
      }

      // Virtual milestone placeholder if not yet synced in DB
      const virtualMilestone: ProjectMilestone = {
        id: -100 - idx,
        project_id: project.id,
        title: std.title,
        weight_percentage: 20,
        status: 'pending',
        payment_status: false,
        notes: std.defaultNote,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        milestone: virtualMilestone,
        stageTitle: std.title,
        status: 'pending',
        note: std.defaultNote,
      };
    });
  }, [project.milestones, project.id]);

  const formattedDeadline = project.end_date
    ? new Date(project.end_date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '-';

  return (
    <div className="group rounded-card-lg border border-line bg-white p-5 shadow-card hover:shadow-card-hover transition-all">
      {/* Header Row: Code, Category, Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-line/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-navy bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
            {project.project_code || `PRJ-${project.id}`}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {project.classification === 'maintenance' ? 'Maintenance' : 'Proyek Baru'}
          </span>
          {project.description && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[140px]">
              {project.description}
            </span>
          )}
        </div>

        {/* Right Badges & Actions */}
        <div className="flex items-center gap-2">
          {/* RAB Badge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onRabClick) onRabClick(project);
              else navigate(`/projects/${project.id}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            title="Klik untuk melihat / edit rincian RAB & download PDF"
          >
            <span>RAB:</span>
            <span>{formattedRab}</span>
          </button>

          {/* LPJ Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/lpj?project_id=${project.id}`);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-line transition-colors"
            title="Lihat Laporan Pertanggungjawaban (LPJ)"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
            <span>LPJ</span>
          </button>

          {/* Delete Button */}
          {onDeleteProject && (
            <button
              type="button"
              onClick={() => onDeleteProject(project)}
              className="p-1 rounded text-slate-400 hover:text-danger hover:bg-danger-light transition-colors"
              title="Hapus Proyek"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Metadata Row */}
      <div className="py-3">
        <h3
          onClick={() => navigate(`/projects/${project.id}`)}
          className="text-base font-bold text-navy hover:text-primary-600 cursor-pointer transition-colors line-clamp-1"
        >
          {project.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-medium truncate max-w-xs">
              {project.location || 'Lokasi Belum Ditentukan'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              Teknisi / PIC: <strong className="text-navy font-semibold">{project.client_name || 'Tim Lapangan'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Deadline: {formattedDeadline}</span>
          </div>
        </div>
      </div>

      {/* 5 Milestone Stage Boxes Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-line/60">
        {mappedStages.map((stage, sIdx) => {
          const isCompleted = stage.status === 'completed';
          const isInProgress = stage.status === 'in_progress';

          return (
            <div
              key={sIdx}
              onClick={() => onStageClick(project, stage.milestone)}
              className={`group/stage relative rounded-card p-3 border cursor-pointer transition-all ${
                isCompleted
                  ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100/60 shadow-xs'
                  : isInProgress
                  ? 'bg-blue-50/70 border-blue-400 hover:border-blue-500 hover:bg-blue-100/60 shadow-xs ring-1 ring-blue-300'
                  : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
              }`}
              title="Klik untuk mengubah status dan keterangan tahapan ini"
            >
              {/* Header inside stage card */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span
                  className={`text-xs font-bold uppercase tracking-tight truncate ${
                    isCompleted
                      ? 'text-emerald-950'
                      : isInProgress
                      ? 'text-blue-950'
                      : 'text-slate-700'
                  }`}
                >
                  {stage.stageTitle}
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : isInProgress ? (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                )}
              </div>

              {/* Subtitle / note inside stage card */}
              <p
                className={`text-[11px] font-medium truncate ${
                  isCompleted
                    ? 'text-emerald-700'
                    : isInProgress
                    ? 'text-blue-700'
                    : 'text-slate-500'
                }`}
              >
                {stage.note}
              </p>

              {/* Progress bar line indicator */}
              <div className="mt-2 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 w-full'
                      : isInProgress
                      ? 'bg-blue-500 w-1/2'
                      : 'bg-transparent w-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
