import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api/projects';
import { Project } from '../../types/project';
import { ChevronDown, FolderKanban } from 'lucide-react';

interface ProjectSelectorProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
}

export function ProjectSelector({ selectedProjectId, onSelectProject }: ProjectSelectorProps) {
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
      console.error('Failed to fetch projects for selector', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => String(p.id) === String(selectedProjectId));

  return (
    <div className="relative group min-w-[280px]">
      <label className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1">
        Konteks Proyek
      </label>
      <div className="relative">
        <select
          value={selectedProjectId || ''}
          onChange={(e) => onSelectProject(e.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-input border border-line bg-panel py-2 pl-9 pr-9 text-xs sm:text-sm font-semibold text-navy shadow-card transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 cursor-pointer"
        >
          <option value="" disabled>-- Pilih Proyek Aktif --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.project_code ? `[${p.project_code}] ` : ''}{p.name} {p.client_name ? `• ${p.client_name}` : ''}
            </option>
          ))}
        </select>
        <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-600 transition-colors pointer-events-none" />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
