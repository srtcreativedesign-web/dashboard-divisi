import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { projectApi } from '../api/projects';
import { Project } from '../types/project';
import { ProjectSelector } from '../components/projects/ProjectSelector';
import { LoadingState, EmptyState } from '../components/states';

interface ProjectPageLayoutProps {
  title: string;
  description: string;
  children: (project: Project, fetchProject: () => Promise<void>) => React.ReactNode;
}

export function ProjectPageLayout({ title, description, children }: ProjectPageLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('project_id');
  
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
    setSearchParams({ project_id: id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div>
          <ProjectSelector selectedProjectId={projectId} onSelectProject={handleSelectProject} />
        </div>
      </div>

      {loading && <LoadingState />}
      
      {!loading && error && <EmptyState title="Error" description={error} />}
      
      {!loading && !error && !project && (
        <EmptyState 
          title="Pilih Proyek" 
          description="Silakan pilih proyek dari dropdown di atas untuk melihat detail halaman ini." 
        />
      )}
      
      {!loading && !error && project && children(project, () => fetchProject(projectId!))}
    </div>
  );
}
