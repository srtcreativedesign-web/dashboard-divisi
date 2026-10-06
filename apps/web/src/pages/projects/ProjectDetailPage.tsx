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
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Daftar Proyek
              </button>
              <span>/</span>
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {project.project_code || `PRJ-${project.id}`}
              </span>
            </div>

            {/* Title & Status */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {project.name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                project.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                project.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                project.status === 'on_hold' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  project.status === 'in_progress' ? 'bg-blue-600 animate-pulse' :
                  project.status === 'completed' ? 'bg-emerald-600' : 'bg-slate-400'
                }`} />
                {project.status.replace('_', ' ')}
              </span>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">{project.client_name || 'Klien Internal'}</span>
              </div>
              {project.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{project.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(Number(project.contract_value))}</span>
              </div>
            </div>
          </div>

          {/* Overall Physical Progress Box */}
          <div className="lg:w-72 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Progres Fisik Lapangan</span>
              <span className="text-base font-black text-blue-600 dark:text-blue-400">{totalCumulativeProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  totalCumulativeProgress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${totalCumulativeProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{project.milestones?.length || 0} Tahapan Milestone</span>
              <span>{project.status === 'completed' ? 'Selesai 100%' : 'Sedang Dikerjakan'}</span>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-4">
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
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Informasi Proyek
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Deskripsi Pekerjaan</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {project.description || 'Tidak ada catatan deskripsi.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span className="text-slate-500">Nilai Kontrak</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(Number(project.contract_value))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Mulai</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Selesai</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lokasi</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{project.location || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Rangkaian Milestone */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Tahapan Pekerjaan (Milestones)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kemajuan fisik berbobot dan status pembayaran termin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMilestoneModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Milestone
                  </button>
                </div>

                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-3">
                    {project.milestones.map((ms, idx) => (
                      <div
                        key={ms.id}
                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-black mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ms.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Bobot Rencana: <span className="font-semibold text-slate-700 dark:text-slate-300">{ms.weight_percentage}%</span>
                                {ms.due_date && ` &bull; Target: ${ms.due_date}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              ms.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                              ms.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {ms.status || 'pending'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingMilestone(ms)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 transition-colors"
                              title="Update Progres"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(ms.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                            <span className="font-bold text-blue-600 dark:text-blue-400">{ms.actual_percentage || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${ms.actual_percentage || 0}%` }}
                            />
                          </div>
                        </div>

                        {ms.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            Catatan: {ms.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
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
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Linimasa Pelaksanaan Proyek (Time Plan)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimasi periode pelaksanaan kontrak dan jadwal target per milestone
              </p>
            </div>

            {project.start_date && project.end_date ? (
              <div className="space-y-6">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span>Mulai: {new Date(project.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>Selesai: {new Date(project.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <div className="relative border-l-2 border-blue-500/30 ml-4 space-y-6 pl-6">
                  {project.milestones?.map((ms, i) => (
                    <div key={ms.id} className="relative">
                      <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        ms.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{ms.title}</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Tahap {i + 1} ({ms.weight_percentage}%)</span>
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
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Berkas & Dokumen Proyek
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arsip kontrak kerja, surat penawaran, drawing teknis, dan dokumen legal
                </p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleUploadDocument} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingDoc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                {uploadingDoc ? 'Mengunggah...' : 'Unggah Dokumen'}
              </button>
            </div>

            {project.documents && project.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={doc.title}>
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
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Belum ada dokumen yang diunggah.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH MILESTONE */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Tahapan Milestone</h3>
            <form onSubmit={handleAddMilestone} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Tahapan / Milestone *
                </label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  placeholder="Misal: Pekerjaan Dinding & Plesteran"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bobot Tagihan (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={milestoneForm.weight_percentage}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Selesai
                  </label>
                  <input
                    type="date"
                    value={milestoneForm.due_date}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingMilestone}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submittingMilestone ? 'Menyimpan...' : 'Simpan Tahapan'}
                </button>
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
