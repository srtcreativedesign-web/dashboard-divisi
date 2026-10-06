import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, CheckSquare, CreditCard, Calculator, Calendar, FileText, Camera, Edit3, Trash2, Printer } from 'lucide-react';
import { projectApi } from '../../api/projects';
import { Project, ProjectMilestone } from '../../types/project';
import { LoadingState, EmptyState } from '../../components/states';
import { BeforeAfterGallery } from '../../components/projects/BeforeAfterGallery';
import { MilestoneUpdateModal } from '../../components/projects/MilestoneUpdateModal';
import { ProjectCostControl } from '../../components/projects/ProjectCostControl';
import { ProjectReportsExport } from '../../components/projects/ProjectReportsExport';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Document State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Milestone State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', weight_percentage: 0, due_date: '' });
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;
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

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'General');
    formData.append('title', file.name);

    try {
      setUploadingDoc(true);
      await projectApi.uploadDocument(Number(id), formData);
      await fetchProject();
    } catch (err) {
      alert('Gagal mengunggah dokumen');
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!id) return;
    if (!confirm('Hapus dokumen ini?')) return;
    try {
      await projectApi.deleteDocument(Number(id), docId);
      await fetchProject();
    } catch (err) {
      alert('Gagal menghapus dokumen');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSubmittingMilestone(true);
      await projectApi.addMilestone(Number(id), milestoneForm);
      await fetchProject();
      setShowMilestoneModal(false);
      setMilestoneForm({ title: '', weight_percentage: 0, due_date: '' });
    } catch (err) {
      alert('Gagal menambah termin/milestone');
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleUpdateMilestone = async (milestoneId: number, data: Partial<ProjectMilestone>) => {
    if (!id) return;
    await projectApi.updateMilestone(Number(id), milestoneId, data);
    await fetchProject();
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus milestone ini?')) return;
    try {
      await projectApi.deleteMilestone(Number(id), milestoneId);
      await fetchProject();
    } catch (err) {
      alert('Gagal menghapus milestone');
    }
  };

  if (loading) return <LoadingState />;
  if (error || !project) return <EmptyState title="Error" description={error || 'Proyek tidak ditemukan'} />;

  const tabs = [
    { id: 'overview', label: 'Overview & Milestone', icon: CheckSquare },
    { id: 'visuals', label: 'Foto Before - After', icon: Camera },
    { id: 'finance', label: 'Kontrol Biaya & Termin', icon: Calculator },
    { id: 'timeplan', label: 'Time Plan', icon: Calendar },
    { id: 'reports', label: 'Laporan & BAST', icon: Printer },
    { id: 'docs', label: 'Dokumentasi', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
          <p className="text-sm text-slate-500">{project.client_name || 'Klien Internal'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            project.status === 'completed' ? 'bg-green-100 text-green-800' :
            project.status === 'on_hold' ? 'bg-red-100 text-red-800' :
            'bg-slate-100 text-slate-800'
          }`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-primary-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Informasi Proyek</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Nilai Kontrak</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">Rp {parseFloat(project.contract_value.toString()).toLocaleString('id-ID')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tanggal Mulai</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tenggat Waktu</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">{project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Milestone Progress</h3>
                  <button 
                    onClick={() => setShowMilestoneModal(true)}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-500"
                  >
                    + Tambah Termin
                  </button>
                </div>
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-3">
                    {project.milestones.map((ms) => (
                      <div key={ms.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {ms.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{ms.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              ms.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                              ms.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' :
                              ms.status === 'review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {ms.status || 'pending'}
                            </span>
                            <button
                              onClick={() => setEditingMilestone(ms)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                              title="Edit Milestone"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMilestone(ms.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="Hapus Milestone"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress comparison bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Realisasi: <b className="text-primary-600 dark:text-primary-400">{ms.actual_percentage ?? 0}%</b></span>
                            <span>Target Bobot: {ms.weight_percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 dark:bg-primary-500 rounded-full transition-all"
                              style={{ width: `${Math.min(ms.actual_percentage ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>

                        {ms.notes && (
                          <p className="text-xs text-slate-500 bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 italic">
                            "{ms.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic">Belum ada milestone tercatat.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visuals' && (
          <BeforeAfterGallery projectId={project.id} milestones={project.milestones} />
        )}

        {activeTab === 'finance' && (
          <ProjectCostControl project={project} onRefresh={fetchProject} />
        )}

        {activeTab === 'timeplan' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Time Plan & Linimasa</h3>
            </div>
            {project.start_date && project.end_date ? (
              <div className="space-y-6">
                <div className="flex justify-between text-sm font-medium text-slate-500">
                  <span>Mulai: {new Date(project.start_date).toLocaleDateString()}</span>
                  <span>Selesai: {new Date(project.end_date).toLocaleDateString()}</span>
                </div>
                
                <div className="relative w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-primary-500/20 w-full" />
                  {/* Progress bar logic - if status completed, 100% else maybe based on date */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all" 
                    style={{ 
                      width: project.status === 'completed' ? '100%' : 
                             project.status === 'planning' ? '10%' : '50%' 
                    }} 
                  />
                </div>
                
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Milestone Timeline</h4>
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                    {project.milestones && project.milestones.length > 0 ? (
                      project.milestones.map((ms, i) => (
                        <div key={ms.id} className="relative pl-6">
                          <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${ms.payment_status ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900 dark:text-white">{ms.title}</p>
                            <span className="text-xs text-slate-500">Termin {i + 1} ({ms.weight_percentage}%)</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">Status Pembayaran: {ms.payment_status ? 'Lunas' : 'Tertunda'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="pl-6 text-sm text-slate-500">Belum ada termin.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-sm text-slate-500">
                Data tanggal mulai dan selesai proyek belum diatur.
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <ProjectReportsExport project={project} />
        )}

        {activeTab === 'docs' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Dokumentasi Proyek</h3>
              <input type="file" ref={fileInputRef} onChange={handleUploadDocument} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadingDoc}
                className="text-sm font-semibold text-primary-600 hover:text-primary-500 disabled:opacity-50"
              >
                {uploadingDoc ? 'Mengunggah...' : '+ Unggah Dokumen'}
              </button>
            </div>

            <div className="space-y-4">
              {project.documents && project.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.documents.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <FileText className="w-8 h-8 text-primary-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={doc.title}>{doc.title}</p>
                        <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)} 
                        className="text-slate-400 hover:text-red-500 shrink-0"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">Belum ada dokumen yang diunggah.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tambah Termin (Milestone)</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-500">&times;</button>
            </div>
            <form onSubmit={handleAddMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul / Nama Termin</label>
                <input required type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Misal: Termin 1 (Uang Muka)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bobot Tagihan (%)</label>
                <input required type="number" min="0" max="100" value={milestoneForm.weight_percentage} onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: parseFloat(e.target.value) })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Jatuh Tempo (Opsional)</label>
                <input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={submittingMilestone} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {submittingMilestone ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Edit Modal */}
      {editingMilestone && (
        <MilestoneUpdateModal
          milestone={editingMilestone}
          isOpen={!!editingMilestone}
          onClose={() => setEditingMilestone(null)}
          onSave={handleUpdateMilestone}
        />
      )}
    </div>
  );
}
