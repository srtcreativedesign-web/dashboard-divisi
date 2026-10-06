import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CheckSquare,
  Calculator,
  Calendar,
  FileText,
  Camera,
  Edit3,
  Trash2,
  Printer,
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus
} from 'lucide-react';
import { projectApi } from '../../api/projects';
import { Project, ProjectMilestone } from '../../types/project';
import { LoadingState, EmptyState } from '../../components/states';
import { BeforeAfterGallery } from '../../components/projects/BeforeAfterGallery';
import { MilestoneUpdateModal } from '../../components/projects/MilestoneUpdateModal';
import { ProjectCostControl } from '../../components/projects/ProjectCostControl';
import { ProjectReportsExport } from '../../components/projects/ProjectReportsExport';
import { Button } from '../../components/ui/Button';

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
      await projectApi.addMilestone(Number(id), {
        title: milestoneForm.title,
        weight_percentage: milestoneForm.weight_percentage,
        due_date: milestoneForm.due_date || null,
        actual_percentage: 0,
        status: 'pending',
      });
      await fetchProject();
      setShowMilestoneModal(false);
      setMilestoneForm({ title: '', weight_percentage: 0, due_date: '' });
    } catch (err) {
      alert('Gagal menambah milestone');
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleUpdateMilestone = async (data: any) => {
    if (!id || !editingMilestone) return;
    try {
      await projectApi.updateMilestone(Number(id), editingMilestone.id, data);
      await fetchProject();
      setEditingMilestone(null);
    } catch (err) {
      alert('Gagal memperbarui milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!id) return;
    if (!confirm('Hapus tahapan milestone ini?')) return;
    try {
      await projectApi.deleteMilestone(Number(id), milestoneId);
      await fetchProject();
    } catch (err) {
      alert('Gagal menghapus milestone');
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

  if (loading) return <LoadingState label="Memuat detail data proyek..." />;
  if (error || !project) return <EmptyState title="Proyek Tidak Ditemukan" description={error || 'Data proyek tidak dapat diakses.'} />;

  // Calculate Cumulative Physical Progress
  let totalCumulativeProgress = 0;
  if (project.milestones && project.milestones.length > 0) {
    project.milestones.forEach((m) => {
      const weight = m.weight_percentage || 0;
      const actual = m.actual_percentage || 0;
      totalCumulativeProgress += (actual / 100) * weight;
    });
  }
  totalCumulativeProgress = Math.min(100, Math.round(totalCumulativeProgress * 10) / 10);

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
      {/* HERO HEADER CARD */}
      <div className="rounded-card-lg border border-line bg-white p-6 sm:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Daftar Proyek
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-mono bg-surface border border-line px-2 py-0.5 rounded-input text-[11px] font-bold text-slate-700">
                {project.project_code || `PRJ-${project.id}`}
              </span>
            </div>

            {/* Title & Status */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                {project.name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider ${
                project.status === 'in_progress' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                project.status === 'completed' ? 'bg-success-light text-success border border-success/30' :
                project.status === 'on_hold' ? 'bg-danger-light text-danger border border-danger/30' :
                'bg-surface text-slate-700 border border-line'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  project.status === 'in_progress' ? 'bg-primary-600 animate-pulse' :
                  project.status === 'completed' ? 'bg-success' : 'bg-slate-400'
                }`} />
                {project.status.replace('_', ' ')}
              </span>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-navy">{project.client_name || 'Klien Internal'}</span>
              </div>
              {project.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{project.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-navy">{formatCurrency(Number(project.contract_value))}</span>
              </div>
            </div>
          </div>

          {/* Overall Physical Progress Box */}
          <div className="lg:w-72 p-5 rounded-card bg-surface border border-line space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Progres Fisik Lapangan</span>
              <span className="text-base font-bold text-primary-600">{totalCumulativeProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-line rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalCumulativeProgress === 100 ? 'bg-success' : 'bg-primary-600'
                }`}
                style={{ width: `${totalCumulativeProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{project.milestones?.length || 0} Tahapan Milestone</span>
              <span>{project.status === 'completed' ? 'Selesai 100%' : 'Sedang Berjalan'}</span>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="mt-8 border-t border-line pt-4">
          <nav className="flex space-x-2 overflow-x-auto scrollbar-none" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-input text-xs font-semibold whitespace-nowrap transition-all duration-150
                    ${isActive
                      ? 'bg-primary-600 text-white shadow-card'
                      : 'text-slate-600 hover:bg-surface hover:text-navy border border-transparent'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* TAB CONTENT AREA */}
      <div className="min-h-[450px]">
        {/* 1. OVERVIEW & MILESTONES */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom Kiri: Informasi Rinci */}
              <div className="lg:col-span-1 rounded-card border border-line p-6 bg-white shadow-card space-y-4">
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                  Informasi Proyek
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Deskripsi Pekerjaan</span>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {project.description || 'Tidak ada catatan deskripsi.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-line flex justify-between">
                    <span className="text-slate-500">Nilai Kontrak</span>
                    <span className="font-bold text-navy">{formatCurrency(Number(project.contract_value))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Mulai</span>
                    <span className="font-medium text-slate-800">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Selesai</span>
                    <span className="font-medium text-slate-800">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lokasi</span>
                    <span className="font-medium text-slate-800">{project.location || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Rangkaian Milestone */}
              <div className="lg:col-span-2 rounded-card border border-line p-6 bg-white shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                      Tahapan Pekerjaan (Milestones)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kemajuan fisik berbobot dan status pembayaran termin
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowMilestoneModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Milestone
                  </Button>
                </div>

                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-3">
                    {project.milestones.map((ms, idx) => (
                      <div
                        key={ms.id}
                        className="p-4 rounded-card border border-line bg-surface space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-[10px] font-bold mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-navy">{ms.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Bobot Rencana: <span className="font-semibold text-slate-700">{ms.weight_percentage}%</span>
                                {ms.due_date && ` &bull; Target: ${ms.due_date}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-pill ${
                              ms.status === 'completed' ? 'bg-success-light text-success border border-success/30' :
                              ms.status === 'in_progress' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                              'bg-surface text-slate-700 border border-line'
                            }`}>
                              {ms.status || 'pending'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingMilestone(ms)}
                              className="p-1 rounded-input text-slate-400 hover:text-primary-600 hover:bg-white transition-colors border border-transparent hover:border-line"
                              title="Update Progres"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(ms.id)}
                              className="p-1 rounded-input text-slate-400 hover:text-danger hover:bg-danger-light transition-colors"
                              title="Hapus Milestone"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar Milestone */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Realisasi Fisik:</span>
                            <span className="font-bold text-primary-600">{ms.actual_percentage || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all duration-500"
                              style={{ width: `${ms.actual_percentage || 0}%` }}
                            />
                          </div>
                        </div>

                        {ms.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-input border border-line">
                            Catatan: {ms.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-line rounded-card">
                    Belum ada milestone tahapan pekerjaan.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. FOTO BEFORE - AFTER */}
        {activeTab === 'visuals' && (
          <BeforeAfterGallery projectId={project.id} milestones={project.milestones} />
        )}

        {/* 3. KONTROL BIAYA & TERMIN */}
        {activeTab === 'finance' && (
          <ProjectCostControl project={project} onRefresh={fetchProject} />
        )}

        {/* 4. TIME PLAN */}
        {activeTab === 'timeplan' && (
          <div className="rounded-card border border-line bg-white shadow-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                Linimasa Pelaksanaan Proyek (Time Plan)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimasi periode pelaksanaan kontrak dan jadwal target per milestone
              </p>
            </div>

            {project.start_date && project.end_date ? (
              <div className="space-y-6">
                <div className="flex justify-between text-xs font-semibold text-slate-600 p-3 rounded-card bg-surface border border-line">
                  <span>Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>Selesai: {new Date(project.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <div className="relative border-l-2 border-primary-200 ml-4 space-y-6 pl-6">
                  {project.milestones?.map((ms, i) => (
                    <div key={ms.id} className="relative">
                      <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                        ms.status === 'completed' ? 'bg-success' : 'bg-primary-600'
                      }`} />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-navy">{ms.title}</span>
                        <span className="font-semibold text-primary-600">Tahap {i + 1} ({ms.weight_percentage}%)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Target Selesai: {ms.due_date || 'Belum diatur'} &bull; Status: <span className="capitalize">{ms.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                Tanggal mulai atau selesai proyek belum diatur.
              </div>
            )}
          </div>
        )}

        {/* 5. LAPORAN & BAST */}
        {activeTab === 'reports' && (
          <ProjectReportsExport project={project} />
        )}

        {/* 6. DOKUMEN PROYEK */}
        {activeTab === 'docs' && (
          <div className="rounded-card border border-line bg-white shadow-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy uppercase tracking-wider">
                  Berkas & Dokumen Proyek
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsip kontrak kerja, surat penawaran, drawing teknis, dan dokumen legal
                </p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleUploadDocument} className="hidden" />
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
              >
                <Plus className="h-3.5 w-3.5" />
                {uploadingDoc ? 'Mengunggah...' : 'Unggah Dokumen'}
              </Button>
            </div>

            {project.documents && project.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-3 p-4 rounded-card border border-line bg-surface"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-input bg-primary-50 text-primary-600 border border-primary-200 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy truncate" title={doc.title}>
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(doc.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-slate-400 hover:text-danger p-1 transition-colors"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-line rounded-card">
                Belum ada dokumen yang diunggah.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH MILESTONE */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white p-6 shadow-2xl border border-line">
            <h3 className="text-base font-bold text-navy">Tambah Tahapan Milestone</h3>
            <form onSubmit={handleAddMilestone} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Tahapan / Milestone *
                </label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  placeholder="Misal: Pekerjaan Dinding & Plesteran"
                  className="w-full rounded-input border border-line bg-white px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot Tagihan (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={milestoneForm.weight_percentage}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-input border border-line bg-white px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Selesai
                  </label>
                  <input
                    type="date"
                    value={milestoneForm.due_date}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                    className="w-full rounded-input border border-line bg-white px-3 py-2 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowMilestoneModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingMilestone}
                >
                  {submittingMilestone ? 'Menyimpan...' : 'Simpan Tahapan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT MILESTONE */}
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
