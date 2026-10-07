import React, { useRef, useState } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';
import { Button } from '../../../components/ui/Button';
import {
  FileText,
  UploadCloud,
  Trash2,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  FolderOpen,
  Plus,
} from 'lucide-react';

import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

const DOC_TYPES = [
  { value: 'all', label: 'Semua Berkas' },
  { value: 'Kontrak / SPK', label: 'Kontrak & SPK' },
  { value: 'Gambar Kerja (DED)', label: 'Gambar Kerja (DED)' },
  { value: 'BAST & Serah Terima', label: 'BAST & Serah Terima' },
  { value: 'Addendum & Change Order', label: 'Addendum / Tambah Kurang' },
  { value: 'General', label: 'Lainnya / Umum' },
];

export default function ProjectDocumentsPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docCategory, setDocCategory] = useState('Kontrak / SPK');
  const [docTitle, setDocTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <ProjectPageLayout
      title="Repository Dokumen & Legalitas"
      description="Arsip terpusat dokumen kontrak SPK, blueprint gambar kerja teknis, adendum pekerjaan, dan Berita Acara Serah Terima (BAST)."
    >
      {(project, refreshProject) => {
        const documents = project.documents || [];

        const filteredDocs = documents.filter((doc) => {
          const matchSearch = (doc.title || '').toLowerCase().includes(search.toLowerCase());
          const matchCategory =
            activeCategory === 'all' || (doc.document_type || 'General').toLowerCase() === activeCategory.toLowerCase();
          return matchSearch && matchCategory;
        });

        const handleUpload = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!selectedFile) {
            alert('Pilih berkas dokumen terlebih dahulu');
            return;
          }

          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('document_type', docCategory);
          formData.append('title', docTitle || selectedFile.name);

          try {
            setUploadingDoc(true);
            await projectApi.uploadDocument(project.id, formData);
            await refreshProject();
            setShowUploadModal(false);
            setSelectedFile(null);
            setDocTitle('');
          } catch (err: any) {
            alert(err.message || 'Gagal mengunggah dokumen');
          } finally {
            setUploadingDoc(false);
          }
        };

        const handleDeleteDocument = async (docId: number) => {
          if (!confirm('Apakah Anda yakin ingin menghapus berkas dokumen ini?')) return;
          try {
            setDeletingId(docId);
            await projectApi.deleteDocument(project.id, docId);
            await refreshProject();
          } catch (err: any) {
            alert(err.message || 'Gagal menghapus dokumen');
          } finally {
            setDeletingId(null);
          }
        };

        return (
          <div className="space-y-6">
            {/* KPI STATS ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Berkas Tersimpan</p>
                <h3 className="mt-1.5 text-2xl font-bold text-navy">{documents.length}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Dokumen legal & teknis</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kontrak & SPK</p>
                <h3 className="mt-1.5 text-2xl font-bold text-blue-600">
                  {documents.filter((d) => (d.document_type || '').toLowerCase().includes('kontrak')).length}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Legalitas perjanjian</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gambar Teknis (DED)</p>
                <h3 className="mt-1.5 text-2xl font-bold text-purple-600">
                  {documents.filter((d) => (d.document_type || '').toLowerCase().includes('gambar')).length}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Blueprint arsitektur & ME</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Berita Acara (BAST)</p>
                  <h3 className="mt-1.5 text-2xl font-bold text-success">
                    {documents.filter((d) => (d.document_type || '').toLowerCase().includes('bast')).length}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Serah terima resmi</p>
                </div>
                <div className="h-11 w-11 rounded-input bg-surface border border-line flex items-center justify-center text-success">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="rounded-card-lg border border-line bg-white p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari judul berkas dokumen..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-input border border-line bg-surface focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div className="relative min-w-[200px]">
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-input border border-line bg-surface text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {canManage && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowUploadModal(true)}
                  className="shrink-0 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Unggah Dokumen
                </Button>
              )}
            </div>

            {/* DOCUMENTS TABLE */}
            <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">No</th>
                      <th className="px-5 py-3.5">Nama & Judul Berkas</th>
                      <th className="px-5 py-3.5">Klasifikasi Dokumen</th>
                      <th className="px-5 py-3.5 text-center">Tanggal Unggah</th>
                      <th className="px-5 py-3.5 text-right w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredDocs.length > 0 ? (
                      filteredDocs.map((doc, idx) => (
                        <tr key={doc.id} className="hover:bg-surface/80 transition-colors">
                          <td className="px-5 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-input bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-navy truncate max-w-md">{doc.title}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface border border-line text-slate-700">
                              {doc.document_type || 'General'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-slate-600 font-medium">
                            {new Date(doc.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => void projectApi.downloadDocument(project.id, doc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-input border border-line bg-white text-[11px] font-semibold text-slate-700 hover:text-primary-600 hover:border-primary-300 transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                Unduh
                              </button>
                              {canManage && (
                                <button
                                  type="button"
                                  aria-label="Hapus dokumen"
                                  disabled={deletingId === doc.id}
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-input border border-transparent text-[11px] font-semibold text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors disabled:opacity-50"
                                  title="Hapus dokumen"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Hapus dokumen
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                          <FolderOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">Belum ada dokumen yang diunggah</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search || activeCategory !== 'all'
                              ? 'Coba sesuaikan kata kunci atau filter klasifikasi Anda.'
                              : 'Unggah berkas kontrak, blueprint CAD, atau BAST untuk proyek ini.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL UNGGAH DOKUMEN */}
            {showUploadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
                    <div>
                      <h3 className="text-base font-bold text-navy">Unggah Dokumen Proyek</h3>
                      <p className="text-xs text-slate-500">Tambahkan berkas resmi ke repositori proyek</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleUpload} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Klasifikasi Dokumen <span className="text-danger">*</span>
                      </label>
                      <select
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value)}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      >
                        <option value="Kontrak / SPK">Surat Perintah Kerja (SPK) & Kontrak</option>
                        <option value="Gambar Kerja (DED)">Gambar Kerja (DED / Blueprint)</option>
                        <option value="BAST & Serah Terima">Berita Acara Serah Terima (BAST)</option>
                        <option value="Addendum & Change Order">Addendum & Pekerjaan Tambah/Kurang</option>
                        <option value="General">Dokumen Pendukung Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Judul Dokumen (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kontrak Utama Pekerjaan Sipil.pdf"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Pilih Berkas File <span className="text-danger">*</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                            if (!docTitle) setDocTitle(e.target.files[0].name);
                          }
                        }}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-line rounded-input p-1"
                      />
                    </div>

                    <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setShowUploadModal(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={uploadingDoc || !selectedFile}
                      >
                        {uploadingDoc ? 'Mengunggah...' : 'Unggah Dokumen'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ProjectPageLayout>
  );
}
