import React, { useRef, useState } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { FileText } from 'lucide-react';
import { projectApi } from '../../../api/projects';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

export default function ProjectDocumentsPage() {
  const { user } = useAuth();
  const canManage = !!user && hasCapability(user.role, 'manage:projects', user.divisionCode);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <ProjectPageLayout
      title="Dokumentasi Proyek"
      description="Kelola file legalitas, BAST, foto progres, dan invoice proyek."
    >
      {(project, refreshProject) => {
        const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
          if (!e.target.files || e.target.files.length === 0) return;
          const file = e.target.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append('file', file);
          formData.append('document_type', 'General');
          formData.append('title', file.name);

          try {
            setUploadingDoc(true);
            await projectApi.uploadDocument(project.id, formData);
            await refreshProject();
          } catch {
      alert('Gagal mengunggah dokumen');
          } finally {
            setUploadingDoc(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };

        const handleDeleteDocument = async (docId: number) => {
          if (!confirm('Hapus dokumen ini?')) return;
          try {
            await projectApi.deleteDocument(project.id, docId);
            await refreshProject();
          } catch {
      alert('Gagal menghapus dokumen');
          }
        };

        return (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Berkas Terlampir</h3>
              {canManage && <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" ref={fileInputRef} onChange={handleUploadDocument} className="hidden" />}
              {canManage && <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
                className="text-sm font-semibold text-primary-600 hover:text-primary-500 disabled:opacity-50 flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100"
              >
                {uploadingDoc ? 'Mengunggah...' : '+ Unggah Dokumen'}
              </button>}
            </div>

            <div className="space-y-4 mt-6">
              {project.documents && project.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.documents.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary-300 transition-colors group">
                      <FileText className="w-8 h-8 text-primary-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={doc.title}>{doc.title}</p><button type="button" className="text-xs font-medium text-primary-600" onClick={() => void projectApi.downloadDocument(project.id, doc).catch(() => alert('Gagal mengunduh dokumen'))}>Unduh</button>
                        <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      {canManage && <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-slate-400 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Hapus dokumen" title="Hapus dokumen"
                      >
                        &times;
                      </button>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Belum ada dokumen</p>
                  <p className="text-xs text-slate-500 mt-1">Unggah dokumen pendukung untuk proyek ini.</p>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </ProjectPageLayout>
  );
}
