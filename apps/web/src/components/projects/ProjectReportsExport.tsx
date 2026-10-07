import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Project } from '../../types/project';
import { projectApi } from '../../api/projects';
import { LoadingState } from '../states';
import { Button } from '../ui/Button';

interface ProjectReportsExportProps {
  project: Project;
}

export function ProjectReportsExport({ project }: ProjectReportsExportProps) {
  const [reportType, setReportType] = useState<'progress' | 'bast'>('progress');
  const [progressData, setProgressData] = useState<any>(null);
  const [bastData, setBastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [project.id]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [prog, bast] = await Promise.all([
        projectApi.getProgressReport(project.id).catch(() => null),
        projectApi.getBastReport(project.id).catch(() => null),
      ]);
      setProgressData(prog);
      setBastData(bast);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return <LoadingState label="Menyiapkan data generator laporan proyek..." />;
  }

  return (
    <div className="space-y-6">
      {/* ACTION BAR (Hidden when printing) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 p-4 rounded-card-lg bg-panel dark:bg-navy-light border border-line dark:border-line/20 shadow-card">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReportType('progress')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
              reportType === 'progress'
                ? 'bg-primary text-white shadow-card'
                : 'text-muted dark:text-slate-400 hover:bg-surface dark:hover:bg-navy/40'
            }`}
          >
            <FileText className="h-4 w-4" />
            Laporan Kemajuan (Progress Report)
          </button>
          <button
            type="button"
            onClick={() => setReportType('bast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-input text-xs font-semibold transition-all ${
              reportType === 'bast'
                ? 'bg-primary text-white shadow-card'
                : 'text-muted dark:text-slate-400 hover:bg-surface dark:hover:bg-navy/40'
            }`}
          >
            <Camera className="h-4 w-4" />
            Lampiran Visual BAST (Handover)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Cetak / Ekspor PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Ready for Print) */}
      <div className="relative overflow-hidden rounded-card-lg bg-panel text-navy p-8 sm:p-12 border border-line shadow-card-hover print:border-none print:shadow-none print:p-0">
        {/* WATERMARK DIAGONAL "DIGITAL TECH" */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden z-0"
        >
          <span
            className="text-navy font-black tracking-widest uppercase opacity-[0.035] transform -rotate-45"
            style={{ fontSize: '13vw', lineHeight: 1 }}
          >
            DIGITAL TECH
          </span>
        </div>

        {/* DOCUMENT HEADER / KOP FORMAL */}
        <div className="relative z-10 border-b-2 border-navy pb-5 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-primary dark:text-primary-300">
                PT DIGITAL TECH REKAYASA &bull; DIVISI MANAJEMEN PROYEK
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-navy mt-1">
                {reportType === 'progress'
                  ? 'Laporan Kemajuan Pekerjaan Fisik & Finansial'
                  : 'Lampiran Visual Berita Acara Serah Terima (BAST)'}
              </h1>
              <p className="text-xs text-subtle mt-0.5">
                Proyek: <span className="font-semibold text-navy">{project.name}</span> ({project.project_code || `PRJ-${project.id}`})
              </p>
            </div>
            <div className="text-right text-xs text-subtle">
              <p className="font-semibold text-navy">Tanggal Cetak:</p>
              <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* 1. PROGRESS REPORT VIEW */}
        {reportType === 'progress' && progressData && (
          <div className="relative z-10 space-y-8 text-xs">
            {/* Metadata Ringkasan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-card bg-surface border border-line">
              <div>
                <span className="text-subtle block text-[11px]">Klien / Pemberi Tugas</span>
                <span className="font-bold text-navy text-sm">{project.client_name || '-'}</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px]">Lokasi Pelaksanaan</span>
                <span className="font-bold text-navy text-sm">{project.location || 'Indonesia'}</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px]">Nilai Kontrak</span>
                <span className="font-bold text-navy text-sm">
                  {formatCurrency(progressData.financial_progress?.contract_value)}
                </span>
              </div>
              <div>
                <span className="text-subtle block text-[11px]">Progres Fisik Kumulatif</span>
                <span className="font-black text-primary dark:text-primary-300 text-sm">
                  {progressData.physical_progress?.actual_percentage}%
                </span>
              </div>
            </div>

            {/* TABEL MILESTONES / KURVA PROGRES */}
            <div>
              <h3 className="font-bold text-sm text-navy uppercase tracking-wider mb-3">
                1. Rincian Realisasi Fisik per Tahap Pekerjaan (Milestone)
              </h3>
              <div className="border border-line rounded-card overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface text-muted font-semibold border-b border-line">
                    <tr>
                      <th className="px-3 py-2.5">No</th>
                      <th className="px-3 py-2.5">Item Pekerjaan</th>
                      <th className="px-3 py-2.5 text-center">Bobot Rencana (%)</th>
                      <th className="px-3 py-2.5 text-center">Realisasi Fisik (%)</th>
                      <th className="px-3 py-2.5 text-center">Kontribusi Kumulatif (%)</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5">Target Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {progressData.physical_progress?.milestones?.map((ms: any, i: number) => (
                      <tr key={ms.id}>
                        <td className="px-3 py-2 text-subtle">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-navy">
                          {ms.title}
                          {ms.notes && <p className="text-[10px] text-subtle italic mt-0.5">{ms.notes}</p>}
                        </td>
                        <td className="px-3 py-2 text-center text-muted">{ms.weight_percentage}%</td>
                        <td className="px-3 py-2 text-center font-bold text-navy">{ms.actual_percentage}%</td>
                        <td className="px-3 py-2 text-center font-semibold text-primary dark:text-primary-300">{ms.contribution}%</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            ms.status === 'completed' ? 'bg-success-light text-success dark:text-emerald-300 border border-success/30' :
                            ms.status === 'in_progress' ? 'bg-surface-2 text-primary dark:text-primary-300 border border-primary/30' : 'bg-surface text-muted border border-line'
                          }`}>
                            {ms.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted">{ms.due_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RINGKASAN KEUANGAN */}
            <div>
              <h3 className="font-bold text-sm text-navy uppercase tracking-wider mb-3">
                2. Status Penyerapan Anggaran (RAB vs Realisasi)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-card border border-line bg-surface">
                  <span className="text-subtle block text-[11px]">Plafon Anggaran RAB</span>
                  <span className="font-bold text-navy text-sm">
                    {formatCurrency(progressData.financial_progress?.total_rab_budget)}
                  </span>
                </div>
                <div className="p-3 rounded-card border border-line bg-surface">
                  <span className="text-subtle block text-[11px]">Realisasi Pengeluaran Riil</span>
                  <span className="font-bold text-success dark:text-emerald-300 text-sm">
                    {formatCurrency(progressData.financial_progress?.total_actual_expense)}
                  </span>
                </div>
                <div className="p-3 rounded-card border border-line bg-surface">
                  <span className="text-subtle block text-[11px]">Sisa Pagu Anggaran (Variance)</span>
                  <span className="font-bold text-navy text-sm">
                    {formatCurrency(progressData.financial_progress?.budget_variance)}
                  </span>
                </div>
                <div className="p-3 rounded-card border border-line bg-surface">
                  <span className="text-subtle block text-[11px]">Penyerapan Anggaran</span>
                  <span className="font-bold text-primary dark:text-primary-300 text-sm">
                    {progressData.financial_progress?.absorption_percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* DOKUMENTASI TERBARU */}
            {progressData.recent_photos && progressData.recent_photos.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-navy uppercase tracking-wider mb-3">
                  3. Lampiran Dokumentasi Visual Fisik Terkini
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {progressData.recent_photos.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="border border-line rounded-xl overflow-hidden bg-surface">
                      <div className="aspect-video w-full overflow-hidden bg-slate-200">
                        <img
                          src={p.photo_path.startsWith('http') ? p.photo_path : `/storage/${p.photo_path}`}
                          alt={p.caption || 'Foto Proyek'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-[10px]">
                        <span className="font-semibold text-navy block capitalize">{p.stage} - {p.area_name || 'Area Umum'}</span>
                        <span className="text-subtle truncate block">{p.caption || '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. BAST VISUAL HANDOVER VIEW */}
        {reportType === 'bast' && bastData && (
          <div className="relative z-10 space-y-8 text-xs">
            {/* Status Kelaikan Serah Terima */}
            <div className="p-4 rounded-card bg-surface border border-line flex items-center justify-between">
              <div>
                <p className="font-bold text-navy text-sm">
                  Status Verifikasi Fisik Serah Terima Proyek
                </p>
                <p className="text-subtle mt-0.5">
                  Menampilkan komparasi kondisi sebelum pekerjaan dimulai (Before) vs hasil serah terima akhir (After).
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-bold ${
                bastData.handover_summary?.is_eligible
                  ? 'bg-success-light text-success dark:text-emerald-300 border border-success/30'
                  : 'bg-warning-light text-warning dark:text-amber-300 border border-warning/30'
              }`}>
                {bastData.handover_summary?.is_eligible ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Siap Serah Terima Fisik (BAST)
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" /> Dalam Proses Penyelesaian
                  </>
                )}
              </span>
            </div>

            {/* MATRIKS KOMPARASI BEFORE VS AFTER PER AREA */}
            <div className="space-y-6">
              <h3 className="font-bold text-sm text-navy uppercase tracking-wider">
                Dokumentasi Komparasi Fisik Lapangan (Before vs In-Progress vs After)
              </h3>

              {(!bastData.visual_comparison || bastData.visual_comparison.length === 0) ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-line rounded-card">
                  Belum ada foto dokumentasi yang diunggah untuk komparasi BAST.
                </div>
              ) : (
                bastData.visual_comparison.map((area: any, idx: number) => (
                  <div key={idx} className="border border-line rounded-card-lg p-4 bg-surface/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="font-bold text-navy text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary dark:text-primary-300" />
                        Area: {area.area_name}
                      </span>
                      <span className="text-[11px] text-subtle font-medium">
                        {area.total_photos} foto dokumentasi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* BEFORE */}
                      <div className="rounded-card border border-warning/30 bg-warning-light/40 p-2.5">
                        <span className="block text-[11px] font-bold text-warning dark:text-amber-300 uppercase mb-1">
                          1. Kondisi Awal (Before)
                        </span>
                        {area.before ? (
                          <div className="space-y-1.5">
                            <div className="aspect-video w-full rounded-input overflow-hidden bg-surface">
                              <img
                                src={area.before.photo_path.startsWith('http') ? area.before.photo_path : `/storage/${area.before.photo_path}`}
                                alt="Before"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-navy font-medium">{area.before.caption || 'Kondisi eksisting'}</p>
                            <p className="text-[9px] text-slate-400">{area.before.taken_at || 'Tanggal tidak dicatat'}</p>
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center text-[10px] text-slate-400 italic bg-panel rounded-input border border-dashed border-line">
                            Foto Before Belum Ada
                          </div>
                        )}
                      </div>

                      {/* IN PROGRESS */}
                      <div className="rounded-card border border-primary/30 bg-surface-2/60 p-2.5">
                        <span className="block text-[11px] font-bold text-primary dark:text-primary-300 uppercase mb-1">
                          2. Pelaksanaan (In-Progress)
                        </span>
                        {area.in_progress ? (
                          <div className="space-y-1.5">
                            <div className="aspect-video w-full rounded-input overflow-hidden bg-surface">
                              <img
                                src={area.in_progress.photo_path.startsWith('http') ? area.in_progress.photo_path : `/storage/${area.in_progress.photo_path}`}
                                alt="In Progress"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-navy font-medium">{area.in_progress.caption || 'Pelaksanaan pekerjaan'}</p>
                            <p className="text-[9px] text-slate-400">{area.in_progress.taken_at || 'Tanggal tidak dicatat'}</p>
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center text-[10px] text-slate-400 italic bg-panel rounded-input border border-dashed border-line">
                            Foto In-Progress Belum Ada
                          </div>
                        )}
                      </div>

                      {/* AFTER */}
                      <div className="rounded-card border border-success/30 bg-success-light/40 p-2.5">
                        <span className="block text-[11px] font-bold text-success dark:text-emerald-300 uppercase mb-1">
                          3. Hasil Akhir (After)
                        </span>
                        {area.after ? (
                          <div className="space-y-1.5">
                            <div className="aspect-video w-full rounded-input overflow-hidden bg-surface">
                              <img
                                src={area.after.photo_path.startsWith('http') ? area.after.photo_path : `/storage/${area.after.photo_path}`}
                                alt="After"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-navy font-medium">{area.after.caption || 'Hasil serah terima fisik'}</p>
                            <p className="text-[9px] text-slate-400">{area.after.taken_at || 'Tanggal tidak dicatat'}</p>
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center text-[10px] text-slate-400 italic bg-panel rounded-input border border-dashed border-line">
                            Foto After Belum Ada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CHECKLIST DELIVERABLE PEKERJAAN */}
            <div>
              <h3 className="font-bold text-sm text-navy uppercase tracking-wider mb-3">
                Daftar Verifikasi Deliverable Kontrak
              </h3>
              <div className="border border-line rounded-card overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface text-muted font-semibold border-b border-line">
                    <tr>
                      <th className="px-3 py-2.5">Deliverable</th>
                      <th className="px-3 py-2.5 text-center">Bobot</th>
                      <th className="px-3 py-2.5 text-center">Realisasi Fisik</th>
                      <th className="px-3 py-2.5 text-center">Verifikasi Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {bastData.milestone_checklist?.map((ms: any) => (
                      <tr key={ms.id}>
                        <td className="px-3 py-2 font-medium text-navy">{ms.title}</td>
                        <td className="px-3 py-2 text-center">{ms.weight_percentage}%</td>
                        <td className="px-3 py-2 text-center font-bold text-navy">{ms.actual_percentage}%</td>
                        <td className="px-3 py-2 text-center">
                          {ms.status === 'completed' ? (
                            <span className="font-semibold text-success dark:text-emerald-300 flex items-center justify-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
                            </span>
                          ) : (
                            <span className="text-slate-400">Dalam Pengerjaan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CATATAN: Kepatuhan aturan user: "tapi gak perlu kolom ttd" - TIDAK ADA KOLOM TANDA TANGAN */}
        <div className="relative z-10 mt-12 pt-4 border-t border-line text-center text-[10px] text-slate-400">
          Dokumen ini digenerate secara otomatis oleh Sistem Dashboard Divisi &bull; PT Digital Tech Rekayasa
        </div>
      </div>
    </div>
  );
}
