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

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="relative group min-w-[300px]">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
        Konteks Proyek
      </label>
      <div className="relative">
        <select
          value={selectedProjectId || ''}
          onChange={(e) => onSelectProject(e.target.value)}
          disabled={loading}
          className="w-full appearance-none rounded-xl border-2 border-slate-200/80 bg-white/50 py-2.5 pl-10 pr-10 text-sm font-semibold text-slate-700 shadow-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:opacity-50"
        >
          <option value="" disabled>-- Pilih Proyek Aktif --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.client_name ? `(${p.client_name})` : ''}
            </option>
          ))}
        </select>
        <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
