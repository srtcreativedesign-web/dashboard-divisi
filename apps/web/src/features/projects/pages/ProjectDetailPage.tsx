import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CheckSquare,
  CreditCard,
  Calculator,
  FileText,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
} from 'lucide-react';
import { projectApi } from '../../../api/projects';
import { Project } from '../../../types/project';
import { LoadingState, EmptyState } from '../../../components/states';
import { Button } from '../../../components/ui/Button';
import { ProjectRabDetailModal } from '../../../components/projects/ProjectRabDetailModal';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RAB Detail Modal
  const [showRabDetailModal, setShowRabDetailModal] = useState(false);

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

      {/* SECTION 1: OVERVIEW & INFORMASI PROYEK (VIEW ONLY) */}
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
              <div>
                <h3 className="text-base font-bold text-navy">Milestone Progress</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Ringkasan capaian fisik pekerjaan</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/projects/progress?project_id=${project.id}`)}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                Halaman Progres <ExternalLink className="h-3 w-3" />
              </button>
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

      {/* SECTION 2: PEMBAYARAN & STATUS TERMIN (VIEW ONLY) */}
      <section id="sec-payment" className="space-y-4">
        <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
          <div className="p-4 border-b border-line bg-surface flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-navy">Pembayaran & Termin</h3>
              <p className="text-xs text-slate-500">Status penyelesaian termin dan penagihan (View Only)</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projects/payments?project_id=${project.id}`)}
              className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
            >
              Kelola di Halaman Pembayaran <ExternalLink className="h-3 w-3" />
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
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold ${ms.payment_status ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-surface text-slate-500 border border-line'}`}>
                            {ms.payment_status ? 'Lunas' : 'Belum ditandai selesai'}
                          </span>
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

      {/* SECTION 3: RAB & ANGGARAN (VIEW ONLY) */}
      <section id="sec-rab" className="space-y-4">
        <div className="rounded-card-lg border border-line bg-white shadow-card overflow-hidden">
          <div className="p-4 border-b border-line bg-surface flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-navy">Rencana Anggaran Biaya (RAB) Detail</h3>
              <p className="text-xs text-slate-500">Estimasi alokasi pengeluaran per item pekerjaan dan material (View Only)</p>
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
              <button
                type="button"
                onClick={() => navigate(`/projects/rab?project_id=${project.id}`)}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1 ml-2"
              >
                Kelola di Menu RAB <ExternalLink className="h-3 w-3" />
              </button>
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

      {/* SECTION 4: DOKUMENTASI (VIEW ONLY) */}
      <section id="sec-docs" className="space-y-4">
        <div className="rounded-card-lg border border-line bg-white shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-navy">Berkas Dokumen & Arsip</h3>
              <p className="text-xs text-slate-500">File SPK, BAST, surat jalan, dan berkas proyek (View & Download Only)</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projects/documents?project_id=${project.id}`)}
              className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
            >
              Kelola di Menu Dokumen <ExternalLink className="h-3 w-3" />
            </button>
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
                      className="px-2.5 py-1 text-xs font-semibold text-primary-600 hover:text-primary-800 border border-line bg-surface rounded-input transition-colors flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Unduh
                    </button>
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
    </div>
  );
}
