import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, CheckSquare, CreditCard, Calculator, FileText, Plus, ExternalLink } from 'lucide-react';
import { projectApi } from '../../../api/projects';
import { Project } from '../../../types/project';
import { LoadingState, EmptyState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';

export default function ProjectDetailPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // RAB State
  const [showRabModal, setShowRabModal] = useState(false);
  const [rabForm, setRabForm] = useState({ item_name: '', category: 'Material', volume: 1, unit: 'ls', unit_price: 0 });
  const [submittingRab, setSubmittingRab] = useState(false);

  // Document State
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  if (loading) return <LoadingState label="Memuat rincian proyek..." />;
  if (error || !project) return <EmptyState title="Proyek Tidak Ditemukan" description={error || 'Data proyek tidak dapat dimuat.'} />;

  const tabs = [
    { id: 'overview', label: 'Overview & Milestone', icon: CheckSquare },
    { id: 'payment', label: 'Pembayaran & Termin', icon: CreditCard },
    { id: 'rab', label: 'RAB & Anggaran', icon: Calculator },
    { id: 'docs', label: 'Dokumentasi', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/projects/list')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar proyek
      </button>

      <DivisionPageHeader
        division="Divisi Project"
        descriptor={`${project.project_code || `PRJ-${project.id}`} · ${project.client_name || 'Klien Internal'}`}
        title={project.name}
        description="Pantau progres, pembayaran, RAB, milestone, dan dokumen proyek dalam satu ruang kerja."
        actions={(
          <span className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${
            project.status === 'in_progress' ? 'bg-primary-50 text-primary-700 dark:text-primary-300 border border-primary-200' :
            project.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            project.status === 'on_hold' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-surface text-muted border border-line'
          }`}>
            {project.status.replace('_', ' ').toUpperCase()}
          </span>
        )}
      />

      {/* TABS - CLEAN UNIFIED LIGHT BORDER */}
      <div className="border-b border-line">
        <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 border-b-2 py-3.5 px-1 text-xs font-semibold whitespace-nowrap transition-colors
                  ${isActive
                    ? 'border-primary-600 text-primary-700 dark:text-primary-300 font-bold'
                    : 'border-transparent text-muted hover:border-slate-300 hover:text-navy'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600 dark:text-primary-300' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[400px]">
        {/* OVERVIEW & MILESTONES */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-card-lg border border-line p-5 bg-panel shadow-card">
                <h3 className="text-base font-bold text-navy mb-4">Informasi Proyek</h3>
                <dl className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-line">
                    <dt className="text-subtle font-medium">Nilai Kontrak</dt>
                    <dd className="font-bold text-navy">Rp {parseFloat(project.contract_value.toString()).toLocaleString('id-ID')}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line">
                    <dt className="text-subtle font-medium">Tanggal Mulai</dt>
                    <dd className="font-semibold text-muted">{project.start_date ? new Date(project.start_date).toLocaleDateString('id-ID') : '-'}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-subtle font-medium">Tenggat Waktu</dt>
                    <dd className="font-semibold text-muted">{project.end_date ? new Date(project.end_date).toLocaleDateString('id-ID') : '-'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-card-lg border border-line p-5 bg-panel shadow-card">
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
                        <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 px-2 py-0.5 rounded-input border border-primary-200">
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
          </div>
        )}

        {/* PEMBAYARAN & TERMIN */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <div className="rounded-card-lg border border-line bg-panel shadow-card overflow-hidden">
              <div className="p-4 border-b border-line bg-surface flex justify-between items-center">
                <h3 className="text-sm font-bold text-navy">Jadwal Pembayaran & Status Termin</h3>
                <span className="text-xs text-subtle font-medium">Berdasarkan penyelesaian milestone</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-muted font-semibold border-b border-line">
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
                            <td className="px-5 py-3 text-center font-mono font-bold text-muted">{ms.weight_percentage}%</td>
                            <td className="px-5 py-3 text-right font-bold text-navy">Rp {amount.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-center">
                              {canManage ? (
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={ms.payment_status}
                                    onChange={() => handleTogglePayment(ms.id, ms.payment_status)}
                                    className="rounded border-line text-primary-600 dark:text-primary-300 focus:ring-primary-500 h-4 w-4"
                                  />
                                  <span className={`text-xs font-semibold ${ms.payment_status ? 'text-emerald-700' : 'text-subtle'}`}>
                                    {ms.payment_status ? 'Lunas' : 'Belum ditandai selesai'}
                                  </span>
                                </label>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold ${ms.payment_status ? 'bg-emerald-50 text-emerald-700' : 'bg-surface text-subtle border border-line'}`}>
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
          </div>
        )}

        {/* RAB & ANGGARAN */}
        {activeTab === 'rab' && (
          <div className="space-y-4">
            <div className="rounded-card-lg border border-line bg-panel shadow-card overflow-hidden">
              <div className="p-4 border-b border-line bg-surface flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-navy">Rencana Anggaran Biaya (RAB)</h3>
                  <p className="text-xs text-subtle">Estimasi alokasi pengeluaran per item</p>
                </div>
                {canManage && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowRabModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Item
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-muted font-semibold border-b border-line">
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
                          <td className="px-5 py-3 text-muted">{rab.category}</td>
                          <td className="px-5 py-3 text-center font-mono">{rab.volume} {rab.unit}</td>
                          <td className="px-5 py-3 text-right text-muted">Rp {Number(rab.unit_price).toLocaleString('id-ID')}</td>
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
          </div>
        )}

        {/* DOKUMENTASI */}
        {activeTab === 'docs' && (
          <div className="space-y-4">
            <div className="rounded-card-lg border border-line bg-panel shadow-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-navy">Berkas Dokumen & Arsip</h3>
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
                        <div className="h-8 w-8 rounded-input bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 dark:text-primary-300 shrink-0">
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
                          className="px-2.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-800 border border-line bg-surface rounded-input transition-colors"
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
          </div>
        )}
      </div>

      {/* RAB MODAL */}
      {canManage && showRabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="bg-panel rounded-card-lg border border-line shadow-card-hover w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="text-sm font-bold text-navy">Tambah Item RAB</h3>
              <button onClick={() => setShowRabModal(false)} className="text-slate-400 hover:text-navy text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleAddRab} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Nama Item</label>
                <input required type="text" value={rabForm.item_name} onChange={(e) => setRabForm({ ...rabForm, item_name: e.target.value })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Kategori</label>
                <input required type="text" value={rabForm.category} onChange={(e) => setRabForm({ ...rabForm, category: e.target.value })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Volume</label>
                  <input required type="number" min="0.01" step="0.01" value={rabForm.volume} onChange={(e) => setRabForm({ ...rabForm, volume: parseFloat(e.target.value) })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs" />
                </div>
                <div>
                  <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Satuan</label>
                  <input required type="text" value={rabForm.unit} onChange={(e) => setRabForm({ ...rabForm, unit: e.target.value })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Harga Satuan (Rp)</label>
                <input required type="number" min="0" value={rabForm.unit_price} onChange={(e) => setRabForm({ ...rabForm, unit_price: parseInt(e.target.value) })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-mono" />
              </div>
              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowRabModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingRab}>{submittingRab ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MILESTONE MODAL */}
      {canManage && showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="bg-panel rounded-card-lg border border-line shadow-card-hover w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="text-sm font-bold text-navy">Tambah Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-navy text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Judul milestone</label>
                <input required type="text" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} placeholder="Misal: Pemasangan tahap awal" className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Bobot milestone (%)</label>
                <input required type="number" min="0" max="100" value={milestoneForm.weight_percentage} onChange={(e) => setMilestoneForm({ ...milestoneForm, weight_percentage: parseFloat(e.target.value) })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-muted uppercase tracking-wider mb-1">Tanggal Jatuh Tempo (Opsional)</label>
                <input type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} className="w-full rounded-input border border-line px-3 py-2 text-navy text-xs" />
              </div>
              <div className="pt-3 border-t border-line flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowMilestoneModal(false)}>Batal</Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingMilestone}>{submittingMilestone ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
