import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CheckSquare,
  CreditCard,
  Calculator,
  FileText,
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { projectApi } from '../../../api/projects';
import { Project } from '../../../types/project';
import { LoadingState, EmptyState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import { ProjectRabDetailModal } from '../../../components/projects/ProjectRabDetailModal';

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RAB Detail Modal
  const [showRabDetailModal, setShowRabDetailModal] = useState(false);

  // RAB Add Modal
  const [showRabModal, setShowRabModal] = useState(false);
  const [rabForm, setRabForm] = useState({ item_name: '', category: 'Material', volume: 1, unit: 'ls', unit_price: 0 });
  const [submittingRab, setSubmittingRab] = useState(false);

  // Document State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Milestone State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail proyek');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setSubmittingRab(true);
      await projectApi.addRab(Number(id), rabForm);
      await fetchProject();
      setShowRabModal(false);
      setRabForm({ item_name: '', category: 'Material', volume: 1, unit: 'ls', unit_price: 0 });
    } catch {
      alert('Gagal menambah RAB');
    } finally {
      setSubmittingRab(false);
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
    } catch {
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
    } catch {
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
    } catch {
      alert('Gagal menambah termin/milestone');
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleTogglePayment = async (milestoneId: number, currentStatus: boolean) => {
    if (!id || !canManage) return;
    try {
      await projectApi.togglePayment(Number(id), milestoneId, !currentStatus);
      await fetchProject();
    } catch {
      alert('Gagal memperbarui status pembayaran');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) return <LoadingState label="Memuat rincian proyek..." />;
  if (error || !project) {
    return <EmptyState title="Proyek Tidak Ditemukan" description={error || 'Data proyek tidak dapat dimuat.'} />;
  }

  const contractValue = parseFloat(project.contract_value.toString()) || 0;
  const totalRab = (project.rabs || []).reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const estimatedMargin = contractValue - totalRab;
  const marginPct = contractValue > 0 ? (estimatedMargin / contractValue) * 100 : 0;

  const sectionLinks = [
    { id: 'sec-overview', label: 'Overview & Milestone', icon: CheckSquare },
    { id: 'sec-payment', label: 'Pembayaran & Termin', icon: CreditCard },
    { id: 'sec-rab', label: 'RAB & Anggaran', icon: Calculator },
    { id: 'sec-docs', label: 'Dokumentasi', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER HERO BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-line bg-white hover:bg-surface text-slate-600 transition-colors shadow-2xs"
            title="Kembali"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-slate-600 bg-surface border border-line px-2 py-0.5 rounded-input">
                {project.project_code || `PRJ-${project.id}`}
              </span>
              <span className="text-xs text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">{project.client_name || 'Klien Internal'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy mt-0.5">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowRabDetailModal(true)}
            className="text-xs shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            Detail RAB & Unduh PDF
          </Button>

          <span className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${
            project.status === 'in_progress' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
            project.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            project.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-surface text-slate-700 border border-line'
          }`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* QUICK SECTION JUMP BAR */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-line">
        {sectionLinks.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-semibold bg-white hover:bg-surface text-slate-600 hover:text-navy border border-line transition-all whitespace-nowrap shadow-xs"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* FINANCIAL & CONTRACT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-card border border-line bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nilai Kontrak</span>
          <p className="text-xl font-bold text-navy mt-1">Rp {contractValue.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Plafon resmi penagihan</p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pagu RAB</span>
            <button
              type="button"
              onClick={() => setShowRabDetailModal(true)}
              className="text-[10px] font-bold text-primary-600 hover:underline"
            >
              Lihat Detail
            </button>
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-1">Rp {totalRab.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{(project.rabs || []).length} rincian material & jasa</p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Margin Laba</span>
          <p className={`text-xl font-bold mt-1 ${estimatedMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            Rp {estimatedMargin.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
            Margin: <span className={estimatedMargin >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>{marginPct.toFixed(1)}%</span>
          </p>
        </div>

        <div className="rounded-card border border-line bg-white p-4 shadow-card">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jadwal Proyek</span>
          <p className="text-sm font-bold text-navy mt-1">
            {project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'} s/d {project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lokasi: {project.location || 'Warehouse / Lapangan'}</p>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW & INFORMASI PROYEK */}
      <section id="sec-overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-card-lg border border-line p-5 bg-white shadow-card">
            <h3 className="text-base font-bold text-navy mb-4">Informasi Proyek & Spesifikasi</h3>
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Klasifikasi</dt>
                <dd className="font-bold text-navy">{project.classification === 'maintenance' ? 'Maintenance' : 'Proyek Baru'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Klien / Penanggung Jawab</dt>
                <dd className="font-semibold text-slate-700">{project.client_name || '-'}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500 font-medium">Lokasi Pengerjaan</dt>
                <dd className="font-semibold text-slate-700">{project.location || '-'}</dd>
              </div>
              <div className="py-1">
                <dt className="text-slate-500 font-medium mb-1">Deskripsi Pekerjaan</dt>
                <dd className="text-slate-600 bg-surface p-2.5 rounded-input border border-line">
                  {project.description || 'Tidak ada deskripsi detail tambahan.'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-card-lg border border-line p-5 bg-white shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-navy">Milestone Progress</h3>
              {canManage && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowMilestoneModal(true)}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Milestone
                </Button>
              )}
            </div>
            {project.milestones && project.milestones.length > 0 ? (
              <div className="space-y-3">
                {project.milestones.map((ms) => (
                  <div key={ms.id} className="flex items-center justify-between p-3 rounded-card border border-line bg-surface/50">
                    <div className="flex items-center gap-3">
                      {ms.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-navy">{ms.title}</p>
                        <p className="text-[11px] text-slate-400">Target: {ms.due_date ? new Date(ms.due_date).toLocaleDateString('id-ID') : '-'}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-input border border-primary-200">
                      {ms.weight_percentage}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada milestone tercatat.</p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: PEMBAYARAN & STATUS TERMIN */}
      <section id="sec-payment" className="space-y-4">
        <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
          <div className="p-4 border-b border-line bg-surface flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-navy">Pembayaran & Termin</h3>
              <p className="text-xs text-slate-500">Status penyelesaian termin dan penagihan</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projects/payments?project_id=${project.id}`)}
              className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
            >
              Halaman Pembayaran <ExternalLink className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                <tr>
                  <th className="px-5 py-3">Termin / Milestone</th>
                  <th className="px-5 py-3 text-center">Bobot</th>
                  <th className="px-5 py-3 text-right">Nilai Termin</th>
                  <th className="px-5 py-3 text-center">Status Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {project.milestones && project.milestones.length > 0 ? (
                  project.milestones.map((ms) => {
                    const amount = (parseFloat(project.contract_value.toString()) * (ms.weight_percentage / 100));
                    return (
                      <tr key={ms.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-navy">{ms.title}</td>
                        <td className="px-5 py-3 text-center font-mono font-bold text-slate-700">{ms.weight_percentage}%</td>
                        <td className="px-5 py-3 text-right font-bold text-navy">Rp {amount.toLocaleString('id-ID')}</td>
                        <td className="px-5 py-3 text-center">
                          {canManage ? (
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ms.payment_status}
                                onChange={() => handleTogglePayment(ms.id, ms.payment_status)}
                                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                              />
                              <span className={`text-xs font-semibold ${ms.payment_status ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {ms.payment_status ? 'Lunas' : 'Belum ditandai selesai'}
                              </span>
                            </label>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold ${ms.payment_status ? 'bg-emerald-50 text-emerald-700' : 'bg-surface text-slate-500 border border-line'}`}>
                              {ms.payment_status ? 'Sudah Dibayar' : 'Belum ditandai selesai'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic">Belum ada termin milestone.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 3: RAB & ANGGARAN */}
      <section id="sec-rab" className="space-y-4">
        <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
          <div className="p-4 border-b border-line bg-surface flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-navy">Rencana Anggaran Biaya (RAB) Detail</h3>
              <p className="text-xs text-slate-500">Estimasi alokasi pengeluaran per item pekerjaan dan material</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRabDetailModal(true)}
                className="text-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                Spreadsheet & Unduh PDF
              </Button>
              {canManage && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRabModal(true)}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Item
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                <tr>
                  <th className="px-5 py-3">Item Pekerjaan</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3 text-center">Volume</th>
                  <th className="px-5 py-3 text-right">Harga Satuan</th>
                  <th className="px-5 py-3 text-right">Total Anggaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {project.rabs && project.rabs.length > 0 ? (
                  project.rabs.map((rab) => (
                    <tr key={rab.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-navy">{rab.item_name}</td>
                      <td className="px-5 py-3 text-slate-600">{rab.category}</td>
                      <td className="px-5 py-3 text-center font-mono">{rab.volume} {rab.unit}</td>
                      <td className="px-5 py-3 text-right text-slate-700">Rp {Number(rab.unit_price).toLocaleString('id-ID')}</td>
                      <td className="px-5 py-3 text-right font-bold text-navy">Rp {Number(rab.total_price).toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">Belum ada rincian RAB.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4: DOKUMENTASI */}
      <section id="sec-docs" className="space-y-4">
        <div className="rounded-card-lg border border-line bg-white shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy">Berkas Dokumen & Arsip</h3>
              <p className="text-xs text-slate-500">File SPK, BAST, surat jalan, dan foto dokumentasi</p>
            </div>
            {canManage && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadDocument}
                  className="hidden"
                  id="doc-upload-input"
                />
                <label
                  htmlFor="doc-upload-input"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Unggah
                </label>
              </div>
            )}
          </div>

          {project.documents && project.documents.length > 0 ? (
            <div className="divide-y divide-line">
              {project.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-input bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy">{doc.title}</p>
                      <p className="text-[11px] text-slate-400">{new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void projectApi.downloadDocument(project.id, doc)}
                      className="px-2.5 py-1 text-xs font-semibold text-primary-600 hover:text-primary-800 border border-line bg-surface rounded-input transition-colors"
                    >
                      Unduh
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-slate-400 hover:text-rose-600 text-base font-bold px-1"
                        title="Hapus dokumen"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada dokumen yang diunggah.</p>
          )}
        </div>
      </section>

      {/* MODAL DETAIL RAB (SPREADSHEET & PDF) */}
      {showRabDetailModal && (
        <ProjectRabDetailModal
          isOpen={showRabDetailModal}
          project={project}
          onClose={() => setShowRabDetailModal(false)}
          onSuccess={fetchProject}
        />
      )}

      {/* MODAL TAMBAH ITEM RAB SATUAN */}
      {showRabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-card-lg bg-white border border-line shadow-card-hover p-6">
            <h3 className="text-base font-bold text-navy mb-4">Tambah Item RAB</h3>
            <form onSubmit={handleAddRab} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Item Pekerjaan</label>
                <input
                  type="text"
                  required
                  value={rabForm.item_name}
                  onChange={(e) => setRabForm({ ...rabForm, item_name: e.target.value })}
                  className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Volume</label>
                  <input
                    type="number"
                    min="1"
                    value={rabForm.volume}
                    onChange={(e) => setRabForm({ ...rabForm, volume: Number(e.target.value) })}
                    className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={rabForm.unit}
                    onChange={(e) => setRabForm({ ...rabForm, unit: e.target.value })}
                    className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={rabForm.unit_price}
                  onChange={(e) => setRabForm({ ...rabForm, unit_price: Number(e.target.value) })}
                  className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowRabModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingRab}>Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH MILESTONE */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-card-lg bg-white border border-line shadow-card-hover p-6">
            <h3 className="text-base font-bold text-navy mb-4">Tambah Milestone</h3>
            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Judul Tahapan</label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bobot Persentase (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={milestoneForm.weight_percentage}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: Number(e.target.value) })}
                  className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Selesai (Due Date)</label>
                <input
                  type="date"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                  className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowMilestoneModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingMilestone}>Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
