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
  AlertCircle
} from 'lucide-react';
import { EmptyState, LoadingState } from '../states';

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
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">Sebelum (Pra-Kerja)</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">Sedang Berjalan</span>;
      case 'after':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Sesudah (Hasil Jadi)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Dokumentasi Visual (Before - After)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau transformasi fisik lapangan sebelum, selama, dan sesudah pengerjaan proyek.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Mode */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'compare'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              Komparasi
            </button>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-primary-500 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            Unggah Foto
          </button>
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
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  stageFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Area Filter */}
          {areas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter Area:</span>
              <select
                value={areaFilter}
                onChange={e => setAreaFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Komparasi Side-by-Side: Sebelum vs Sesudah
              </h3>
              <p className="text-xs text-slate-500">
                Pilih area proyek untuk membandingkan kondisi awal dan hasil akhir serah terima.
              </p>
            </div>
            {areas.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Pilih Zona Area:</span>
                <select
                  value={compareArea}
                  onChange={e => setCompareArea(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 select-none">
                {/* After Photo (Bottom Layer) */}
                <img
                  src={compareAfter.photo_path.startsWith('http') ? compareAfter.photo_path : `/storage/${compareAfter.photo_path}`}
                  alt="After"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-4 right-4 z-10">
                  <span className="rounded-lg bg-emerald-600/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-lg">
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
                    <span className="rounded-lg bg-amber-600/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-lg">
                      SEBELUM (BEFORE)
                    </span>
                  </div>
                </div>

                {/* Slider Handle Divider */}
                <div
                  className="absolute inset-y-0 z-20 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="h-8 w-8 -ml-3.5 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-primary-600 text-primary-600">
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
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">Kondisi Awal ({compareBefore.area_name || 'Umum'})</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{compareBefore.caption || 'Foto kondisi eksisting'}</p>
                  <p className="text-slate-400 mt-1 flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" /> {compareBefore.taken_at || 'Tanggal tidak dicatat'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">Hasil Akhir ({compareAfter.area_name || 'Umum'})</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{compareAfter.caption || 'Hasil serah terima fisik'}</p>
                  <p className="text-slate-400 mt-1 flex items-center gap-1 text-[11px]">
                    <Calendar className="h-3 w-3" /> {compareAfter.taken_at || 'Tanggal tidak dicatat'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Camera className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Membutuhkan minimal 1 foto Before dan 1 foto After untuk komparasi
              </p>
              <p className="text-xs text-slate-500 mt-1">
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
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Unggah Foto Sekarang
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Photo Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{photo.area_name}</span>
                        </div>
                      )}
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium line-clamp-2">
                        {photo.caption || 'Dokumentasi lapangan'}
                      </p>
                      {photo.milestone && (
                        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          Tahap: <span className="font-medium text-slate-700 dark:text-slate-300">{photo.milestone.title}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary-600" />
                Unggah Dokumentasi Foto Proyek
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Berkas Foto *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-slate-800 dark:file:text-slate-300"
                />
                {previewUrl && (
                  <div className="mt-3 relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Stage Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
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
                      className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        uploadStage === s.id
                          ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nama Area / Zona Ruangan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Fasad Depan, Lantai 1, Ruang Server, Ruang Kasir"
                  value={uploadArea}
                  onChange={e => setUploadArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Milestone Selection (Optional) */}
              {milestones.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Kaitan dengan Milestone (Opsional)
                  </label>
                  <select
                    value={uploadMilestoneId}
                    onChange={e => setUploadMilestoneId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Tanggal Pengambilan Foto
                </label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={e => setUploadDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Keterangan / Catatan Foto
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi kondisi lapangan, catatan spesifikasi material..."
                  value={uploadCaption}
                  onChange={e => setUploadCaption(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-primary-500 disabled:opacity-50"
                >
                  {uploading ? 'Mengunggah...' : 'Unggah Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
