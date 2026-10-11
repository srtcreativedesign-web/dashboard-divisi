import React, { useState, useEffect } from 'react';
import { ProjectProgressPhoto, ProjectMilestone } from '../../types/project';
import { projectApi } from '../../api/projects';
import {
  Camera,
  Upload,
  Trash2,
  SplitSquareVertical,
  Grid,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Image as ImageIcon,
  X,
  AlertCircle,
  Plus
} from 'lucide-react';
import { EmptyState, LoadingState } from '../states';
import { Button } from '../ui/Button';

interface BeforeAfterGalleryProps {
  projectId: number;
  milestones?: ProjectMilestone[];
}

export const BeforeAfterGallery: React.FC<BeforeAfterGalleryProps> = ({ projectId, milestones = [] }) => {
  const [photos, setPhotos] = useState<ProjectProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<'all' | 'before' | 'in_progress' | 'after'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compare'>('grid');

  // Comparison State
  const [compareArea, setCompareArea] = useState<string>('');
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStage, setUploadStage] = useState<'before' | 'in_progress' | 'after'>('before');
  const [uploadArea, setUploadArea] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadMilestoneId, setUploadMilestoneId] = useState<string>('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [projectId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getPhotos(projectId);
      setPhotos(data);
    } catch (err) {
      console.error('Failed to load photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Silakan pilih berkas foto');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('stage', uploadStage);
      if (uploadArea) form.append('area_name', uploadArea);
      if (uploadCaption) form.append('caption', uploadCaption);
      if (uploadMilestoneId) form.append('milestone_id', uploadMilestoneId);
      if (uploadDate) form.append('taken_at', uploadDate);

      await projectApi.uploadPhoto(projectId, form);
      await fetchPhotos();
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadCaption('');
      setUploadArea('');
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto dokumentasi ini?')) return;
    try {
      await projectApi.deletePhoto(projectId, photoId);
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err) {
      alert('Gagal menghapus foto');
    }
  };

  const areas = Array.from(new Set(photos.map(p => p.area_name).filter(Boolean))) as string[];

  const filteredPhotos = photos.filter(p => {
    if (stageFilter !== 'all' && p.stage !== stageFilter) return false;
    if (areaFilter !== 'all' && p.area_name !== areaFilter) return false;
    return true;
  });

  // Photos for compare mode
  const beforePhotosForCompare = photos.filter(p => p.stage === 'before' && (!compareArea || p.area_name === compareArea));
  const afterPhotosForCompare = photos.filter(p => p.stage === 'after' && (!compareArea || p.area_name === compareArea));

  const compareBefore = beforePhotosForCompare[0];
  const compareAfter = afterPhotosForCompare[0];

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'before':
        return <span className="inline-flex items-center gap-1 rounded-pill bg-warning-light px-2.5 py-0.5 text-xs font-semibold text-warning dark:text-amber-300 border border-warning/30">Sebelum (Pra-Kerja)</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-primary dark:text-primary-300 border border-primary/30">Sedang Berjalan</span>;
      case 'after':
        return <span className="inline-flex items-center gap-1 rounded-pill bg-success-light px-2.5 py-0.5 text-xs font-semibold text-success dark:text-emerald-300 border border-success/30">Sesudah (Hasil Jadi)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-panel dark:bg-navy-light p-5 rounded-card-lg border border-line dark:border-line/20 shadow-card">
        <div>
          <h2 className="text-base font-bold text-navy dark:text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary dark:text-primary-300" />
            Dokumentasi Visual (Before - After)
          </h2>
          <p className="text-xs text-subtle mt-1">
            Pantau transformasi fisik lapangan sebelum, selama, dan sesudah pengerjaan proyek.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch View Mode */}
          <div className="flex rounded-input bg-surface dark:bg-navy/60 p-1 border border-line dark:border-line/20">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-panel dark:bg-navy-light text-navy dark:text-white shadow-card'
                  : 'text-subtle hover:text-navy dark:hover:text-white'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Galeri
            </button>
            <button
              onClick={() => {
                setViewMode('compare');
                if (areas.length > 0 && !compareArea && areas[0]) setCompareArea(areas[0]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-input text-xs font-semibold transition-all ${
                viewMode === 'compare'
                  ? 'bg-panel dark:bg-navy-light text-navy dark:text-white shadow-card'
                  : 'text-subtle hover:text-navy dark:hover:text-white'
              }`}
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              Komparasi
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            Unggah Foto
          </Button>
        </div>
      </div>

      {/* Filters (Grid Mode) */}
      {viewMode === 'grid' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Stage Filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Semua Tahap' },
              { id: 'before', label: 'Sebelum (Before)' },
              { id: 'in_progress', label: 'Sedang Berjalan' },
              { id: 'after', label: 'Sesudah (After)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-input text-xs font-semibold transition-all ${
                  stageFilter === tab.id
                    ? 'bg-navy text-white dark:bg-primary dark:text-white shadow-card'
                    : 'bg-panel dark:bg-navy-light text-muted dark:text-slate-300 border border-line dark:border-line/20 hover:bg-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Area Filter */}
          {areas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle font-medium">Filter Area:</span>
              <select
                value={areaFilter}
                onChange={e => setAreaFilter(e.target.value)}
                className="rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-1.5 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="all">Semua Area</option>
                {areas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* COMPARE MODE */}
      {viewMode === 'compare' && (
        <div className="bg-panel dark:bg-navy-light p-6 rounded-card-lg border border-line dark:border-line/20 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line dark:border-line/20 pb-4">
            <div>
              <h3 className="text-sm font-bold text-navy dark:text-white">
                Komparasi Side-by-Side: Sebelum vs Sesudah
              </h3>
              <p className="text-xs text-subtle">
                Pilih area proyek untuk membandingkan kondisi awal dan hasil akhir serah terima.
              </p>
            </div>
            {areas.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-subtle font-medium">Pilih Zona Area:</span>
                <select
                  value={compareArea}
                  onChange={e => setCompareArea(e.target.value)}
                  className="rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-1.5 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">Semua Zona</option>
                  {areas.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {compareBefore && compareAfter ? (
            <div className="space-y-4">
              {/* Interactive Split Slider */}
              <div className="relative aspect-video w-full overflow-hidden rounded-card-lg border border-line dark:border-line/20 bg-navy select-none">
                {/* After Photo (Bottom Layer) */}
                <img
                  src={compareAfter.photo_path.startsWith('http') ? compareAfter.photo_path : `/storage/${compareAfter.photo_path}`}
                  alt="After"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-4 right-4 z-10">
                  <span className="rounded-card bg-success/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-card">
                    SESUDAH (AFTER)
                  </span>
                </div>

                {/* Before Photo (Top Layer Clipped) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={compareBefore.photo_path.startsWith('http') ? compareBefore.photo_path : `/storage/${compareBefore.photo_path}`}
                    alt="Before"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-card bg-warning/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-card">
                      SEBELUM (BEFORE)
                    </span>
                  </div>
                </div>

                {/* Slider Handle Divider */}
                <div
                  className="absolute inset-y-0 z-20 w-1 bg-panel shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="h-8 w-8 -ml-3.5 rounded-full bg-panel shadow-card-hover flex items-center justify-center border-2 border-primary text-primary dark:text-primary-300">
                    <SplitSquareVertical className="h-4 w-4" />
                  </div>
                </div>

                {/* Invisible input range for dragging */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={e => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-card bg-warning-light/40 border border-warning/30">
                  <p className="font-semibold text-warning dark:text-amber-300">Kondisi Awal ({compareBefore.area_name || 'Umum'})</p>
                  <p className="text-navy dark:text-slate-300 mt-0.5">{compareBefore.caption || 'Foto kondisi eksisting'}</p>
                  <p className="text-slate-400 mt-1 flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" /> {compareBefore.taken_at || 'Tanggal tidak dicatat'}
                  </p>
                </div>
                <div className="p-3.5 rounded-card bg-success-light/40 border border-success/30">
                  <p className="font-semibold text-success dark:text-emerald-300">Hasil Akhir ({compareAfter.area_name || 'Umum'})</p>
                  <p className="text-navy dark:text-slate-300 mt-0.5">{compareAfter.caption || 'Hasil serah terima fisik'}</p>
                  <p className="text-slate-400 mt-1 flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" /> {compareAfter.taken_at || 'Tanggal tidak dicatat'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-line dark:border-line/20 rounded-card-lg">
              <Camera className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-navy dark:text-white">
                Membutuhkan minimal 1 foto Before dan 1 foto After untuk komparasi
              </p>
              <p className="text-xs text-subtle mt-1">
                Silakan unggah foto dengan label "Before" dan "After" untuk area ini.
              </p>
            </div>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <LoadingState label="Memuat galeri foto dokumentasi..." />
          ) : filteredPhotos.length === 0 ? (
            <EmptyState
              title="Belum Ada Foto Dokumentasi"
              description="Unggah foto dokumentasi Before, In-Progress, dan After untuk memantau progres fisik lapangan."
              action={
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Unggah Foto Sekarang
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-2xl border border-line dark:border-slate-800 bg-panel dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-surface dark:bg-slate-800">
                    <img
                      src={photo.photo_path.startsWith('http') ? photo.photo_path : `/storage/${photo.photo_path}`}
                      alt={photo.caption || 'Foto Progres'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback image placeholder
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      {getStageBadge(photo.stage)}
                    </div>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-3 right-3 rounded-lg bg-black/60 backdrop-blur-sm p-1.5 text-white/80 hover:text-red-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
                      title="Hapus Foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {photo.area_name && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-300 dark:text-primary-400 mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{photo.area_name}</span>
                        </div>
                      )}
                      <p className="text-sm text-navy dark:text-slate-200 font-medium line-clamp-2">
                        {photo.caption || 'Dokumentasi lapangan'}
                      </p>
                      {photo.milestone && (
                        <p className="mt-2 text-xs text-subtle flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          Tahap: <span className="font-medium text-muted dark:text-slate-300">{photo.milestone.title}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-line dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {photo.taken_at ? new Date(photo.taken_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                      <span>Oleh: {photo.uploader?.name || 'Admin Proyek'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg rounded-card-lg bg-panel dark:bg-navy-light p-6 shadow-card-hover border border-line dark:border-line/20">
            <div className="flex items-center justify-between pb-4 border-b border-line dark:border-line/20">
              <h3 className="text-base font-bold text-navy dark:text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary dark:text-primary-300" />
                Unggah Dokumentasi Foto Proyek
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-input p-1.5 text-slate-400 hover:bg-surface hover:text-navy dark:hover:bg-navy/40 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mt-4 flex items-center gap-2 rounded-card bg-danger-light p-3 text-xs text-danger dark:text-red-300 border border-danger/30 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                  Berkas Foto *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-subtle file:mr-4 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-semibold file:bg-surface-2 file:text-primary hover:file:bg-primary-100 dark:file:bg-navy dark:file:text-slate-300"
                />
                {previewUrl && (
                  <div className="mt-3 relative aspect-video w-full rounded-card overflow-hidden border border-line dark:border-line/20">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Stage Select */}
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                  Tahapan Pengerjaan (Stage) *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'before', label: 'Before (Pra-Kerja)' },
                    { id: 'in_progress', label: 'In-Progress' },
                    { id: 'after', label: 'After (Selesai)' },
                  ].map(s => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setUploadStage(s.id as any)}
                      className={`p-2 rounded-input text-xs font-semibold border text-center transition-all ${
                        uploadStage === s.id
                          ? 'border-primary bg-surface-2 text-primary dark:text-primary-300 dark:bg-navy dark:text-primary-300'
                          : 'border-line dark:border-line/20 text-muted dark:text-slate-400 hover:bg-surface'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Name */}
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                  Nama Area / Zona Ruangan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Fasad Depan, Lantai 1, Ruang Server, Ruang Kasir"
                  value={uploadArea}
                  onChange={e => setUploadArea(e.target.value)}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* Milestone Selection (Optional) */}
              {milestones.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                    Kaitan dengan Milestone (Opsional)
                  </label>
                  <select
                    value={uploadMilestoneId}
                    onChange={e => setUploadMilestoneId(e.target.value)}
                    className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">-- Tidak Ditautkan ke Milestone --</option>
                    {milestones.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.weight_percentage}%)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                  Tanggal Pengambilan Foto
                </label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={e => setUploadDate(e.target.value)}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-navy dark:text-slate-200 uppercase tracking-wider mb-1">
                  Keterangan / Catatan Foto
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi kondisi lapangan, catatan spesifikasi material..."
                  value={uploadCaption}
                  onChange={e => setUploadCaption(e.target.value)}
                  className="w-full rounded-input border border-line dark:border-line/20 bg-panel dark:bg-navy/40 px-3 py-2 text-xs text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line dark:border-line/20">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={uploading}
                >
                  {uploading ? 'Mengunggah...' : 'Unggah Foto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
