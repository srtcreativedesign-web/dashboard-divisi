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
      <div className="print:hidden flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReportType('progress')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              reportType === 'progress'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Laporan Kemajuan (Progress Report)
          </button>
          <button
            type="button"
            onClick={() => setReportType('bast')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              reportType === 'bast'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Camera className="h-4 w-4" />
            Lampiran Visual BAST (Handover)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Ready for Print) */}
      <div className="relative overflow-hidden rounded-2xl bg-white text-slate-900 p-8 sm:p-12 border border-slate-200 shadow-lg print:border-none print:shadow-none print:p-0">
        {/* WATERMARK DIAGONAL "DIGITAL TECH" */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden z-0"
        >
          <span
            className="text-slate-900 font-black tracking-widest uppercase opacity-[0.035] transform -rotate-45"
            style={{ fontSize: '13vw', lineHeight: 1 }}
          >
            DIGITAL TECH
          </span>
        </div>

        {/* DOCUMENT HEADER / KOP FORMAL */}
        <div className="relative z-10 border-b-2 border-slate-900 pb-5 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-blue-600">
                PT DIGITAL TECH REKAYASA &bull; DIVISI MANAJEMEN PROYEK
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 mt-1">
                {reportType === 'progress'
                  ? 'Laporan Kemajuan Pekerjaan Fisik & Finansial'
                  : 'Lampiran Visual Berita Acara Serah Terima (BAST)'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Proyek: <span className="font-semibold text-slate-800">{project.name}</span> ({project.project_code || `PRJ-${project.id}`})
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">Tanggal Cetak:</p>
              <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* 1. PROGRESS REPORT VIEW */}
        {reportType === 'progress' && progressData && (
          <div className="relative z-10 space-y-8 text-xs">
            {/* Metadata Ringkasan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">Klien / Pemberi Tugas</span>
                <span className="font-bold text-slate-900 text-sm">{project.client_name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Lokasi Pelaksanaan</span>
                <span className="font-bold text-slate-900 text-sm">{project.location || 'Indonesia'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Nilai Kontrak</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatCurrency(progressData.financial_progress?.contract_value)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Progres Fisik Kumulatif</span>
                <span className="font-black text-blue-600 text-sm">
                  {progressData.physical_progress?.actual_percentage}%
                </span>
              </div>
            </div>

            {/* TABEL MILESTONES / KURVA PROGRES */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                1. Rincian Realisasi Fisik per Tahap Pekerjaan (Milestone)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-100">
                    {progressData.physical_progress?.milestones?.map((ms: any, i: number) => (
                      <tr key={ms.id}>
                        <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {ms.title}
                          {ms.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{ms.notes}</p>}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700">{ms.weight_percentage}%</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-900">{ms.actual_percentage}%</td>
                        <td className="px-3 py-2 text-center font-semibold text-blue-600">{ms.contribution}%</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            ms.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            ms.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ms.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{ms.due_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RINGKASAN KEUANGAN */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                2. Status Penyerapan Anggaran (RAB vs Realisasi)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Plafon Anggaran RAB</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(progressData.financial_progress?.total_rab_budget)}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Realisasi Pengeluaran Riil</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatCurrency(progressData.financial_progress?.total_actual_expense)}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Sisa Pagu Anggaran (Variance)</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(progressData.financial_progress?.budget_variance)}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Penyerapan Anggaran</span>
                  <span className="font-bold text-blue-600 text-sm">
                    {progressData.financial_progress?.absorption_percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* DOKUMENTASI TERBARU */}
            {progressData.recent_photos && progressData.recent_photos.length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                  3. Lampiran Dokumentasi Visual Fisik Terkini
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {progressData.recent_photos.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <div className="aspect-video w-full overflow-hidden bg-slate-200">
                        <img
                          src={p.photo_path.startsWith('http') ? p.photo_path : `/storage/${p.photo_path}`}
                          alt={p.caption || 'Foto Proyek'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-[10px]">
                        <span className="font-semibold text-slate-800 block capitalize">{p.stage} - {p.area_name || 'Area Umum'}</span>
                        <span className="text-slate-500 truncate block">{p.caption || '-'}</span>
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
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  Status Verifikasi Fisik Serah Terima Proyek
                </p>
                <p className="text-slate-500 mt-0.5">
                  Menampilkan komparasi kondisi sebelum pekerjaan dimulai (Before) vs hasil serah terima akhir (After).
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                bastData.handover_summary?.is_eligible
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
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
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Dokumentasi Komparasi Fisik Lapangan (Before vs In-Progress vs After)
              </h3>

              {(!bastData.visual_comparison || bastData.visual_comparison.length === 0) ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Belum ada foto dokumentasi yang diunggah untuk komparasi BAST.
                </div>
              ) : (
                bastData.visual_comparison.map((area: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Area: {area.area_name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {area.total_photos} foto dokumentasi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* BEFORE */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-2.5">
                        <span className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                          1. Kondisi Awal (Before)
                        </span>
                        {area.before ? (
                          <div className="space-y-1.5">
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                              <img
                                src={area.before.photo_path.startsWith('http') ? area.before.photo_path : `/storage/${area.before.photo_path}`}
                                alt="Before"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-slate-600">{area.before.caption || 'Kondisi eksisting'}</p>
                            <p className="text-[9px] text-slate-400">{area.before.taken_at || 'Tanggal tidak dicatat'}</p>
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center text-[10px] text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                            Foto Before Belum Ada
                          </div>
                        )}
                      </div>

                      {/* IN PROGRESS */}
                      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-2.5">
                        <span className="block text-[11px] font-bold text-blue-900 uppercase mb-1">
                          2. Pelaksanaan (In-Progress)
                        </span>
                        {area.in_progress ? (
                          <div className="space-y-1.5">
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                              <img
                                src={area.in_progress.photo_path.startsWith('http') ? area.in_progress.photo_path : `/storage/${area.in_progress.photo_path}`}
                                alt="In Progress"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-slate-600">{area.in_progress.caption || 'Pelaksanaan pekerjaan'}</p>
                            <p className="text-[9px] text-slate-400">{area.in_progress.taken_at || 'Tanggal tidak dicatat'}</p>
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center text-[10px] text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                            Foto In-Progress Belum Ada
                          </div>
                        )}
                      </div>

                      {/* AFTER */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-2.5">
                        <span className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">
                          3. Hasil Akhir (After)
                        </span>
                        {area.after ? (
                          <div className="space-y-1.5">
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                              <img
                                src={area.after.photo_path.startsWith('http') ? area.after.photo_path : `/storage/${area.after.photo_path}`}
                                alt="After"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] text-slate-600">{area.after.caption || 'Hasil serah terima fisik'}</p>
                            <p className="text-[9px] text-slate-400">{area.after.taken_at || 'Tanggal tidak dicatat'}</p>
                          </div>
                        ) : (
                          <div className="aspect-video flex items-center justify-center text-[10px] text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
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
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                Daftar Verifikasi Deliverable Kontrak
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Deliverable</th>
                      <th className="px-3 py-2.5 text-center">Bobot</th>
                      <th className="px-3 py-2.5 text-center">Realisasi Fisik</th>
                      <th className="px-3 py-2.5 text-center">Verifikasi Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bastData.milestone_checklist?.map((ms: any) => (
                      <tr key={ms.id}>
                        <td className="px-3 py-2 font-medium text-slate-900">{ms.title}</td>
                        <td className="px-3 py-2 text-center">{ms.weight_percentage}%</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-900">{ms.actual_percentage}%</td>
                        <td className="px-3 py-2 text-center">
                          {ms.status === 'completed' ? (
                            <span className="font-semibold text-emerald-600 flex items-center justify-center gap-1">
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
        <div className="relative z-10 mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Dokumen ini digenerate secara otomatis oleh Sistem Dashboard Divisi &bull; PT Digital Tech Rekayasa
        </div>
      </div>
    </div>
  );
}
