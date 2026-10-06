import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../api/projects';
import { ProjectVendor } from '../../types/project';
import { LoadingState, EmptyState } from '../../components/states';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Edit3,
  Trash2,
  HardHat,
  Wrench,
  Truck,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori Rekanan' },
  { value: 'Sipil & Struktur', label: 'Sipil & Struktur' },
  { value: 'Mekanikal & Elektrikal', label: 'Mekanikal & Elektrikal (ME)' },
  { value: 'Finishing & Interior', label: 'Finishing & Interior' },
  { value: 'Supplier Bahan', label: 'Supplier Bahan & Material' },
  { value: 'Mandor Borongan', label: 'Mandor Borongan' },
];

export default function ProjectVendorPage() {
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<ProjectVendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'Sipil & Struktur',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    bank_account: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getVendors({ per_page: 100 });
      setVendors(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data vendor');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    const val = (cat || '').toLowerCase();
    if (val.includes('sipil') || val.includes('struktur')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <HardHat className="h-3 w-3" />
          Sipil & Struktur
        </span>
      );
    }
    if (val.includes('mekanikal') || val.includes('elektrikal') || val.includes('me')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-warning-light text-warning border border-warning/30">
          <Wrench className="h-3 w-3" />
          ME & Teknis
        </span>
      );
    }
    if (val.includes('supplier') || val.includes('bahan')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Truck className="h-3 w-3" />
          Supplier Material
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        <Briefcase className="h-3 w-3" />
        {cat || 'Mitra Umum'}
      </span>
    );
  };

  const filteredVendors = vendors.filter((v) => {
    const term = search.toLowerCase();
    const matchSearch =
      v.name.toLowerCase().includes(term) ||
      (v.contact_person || '').toLowerCase().includes(term) ||
      (v.phone || '').toLowerCase().includes(term);
    const matchCategory =
      categoryFilter === 'all' || (v.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchSearch && matchCategory;
  });

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setVendorForm({
      name: '',
      category: 'Sipil & Struktur',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      bank_name: '',
      bank_account: '',
    });
    setShowVendorModal(true);
  };

  const handleOpenEdit = (v: ProjectVendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name,
      category: v.category || 'Sipil & Struktur',
      contact_person: v.contact_person || '',
      phone: v.phone || '',
      email: v.email || '',
      address: v.address || '',
      bank_name: (v as any).bank_name || '',
      bank_account: (v as any).bank_account || '',
    });
    setShowVendorModal(true);
  };

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingVendor) {
        await vendorApi.updateVendor(editingVendor.id, vendorForm);
      } else {
        await vendorApi.createVendor(vendorForm);
      }
      await fetchVendors();
      setShowVendorModal(false);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id: number) => {
    if (!confirm('Hapus mitra / vendor ini dari direktori?')) return;
    try {
      await vendorApi.deleteVendor(id);
      await fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus vendor');
    }
  };

  if (loading) return <LoadingState label="Memuat direktori mitra & vendor..." />;
  if (error) return <EmptyState title="Terjadi Kesalahan" description={error} />;

  return (
    <div className="space-y-6">
      {/* ENTERPRISE HERO BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-input text-[10px] font-bold tracking-wider uppercase bg-primary-50 text-primary-700 border border-primary-200">
              Divisi Proyek
            </span>
            <span className="text-xs text-slate-300">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Manajemen Portofolio & Kontrol Lapangan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-navy mt-1">
            Direktori Mitra & Subkontraktor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pangkalan data mitra rekanan spesialis, mandor lapangan, subkontraktor sipil/ME, dan supplier pengadaan.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          className="shrink-0 text-xs"
        >
          <Plus className="h-4 w-4" />
          Tambah Mitra / Vendor
        </Button>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Mitra Rekanan</p>
          <h3 className="mt-1.5 text-2xl font-bold text-navy">{vendors.length}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Semua mitra aktif terdaftar</p>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sipil & Struktur</p>
          <h3 className="mt-1.5 text-2xl font-bold text-blue-600">
            {vendors.filter((v) => (v.category || '').toLowerCase().includes('sipil')).length}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Kontraktor & mandor fisik</p>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ME & Teknis</p>
          <h3 className="mt-1.5 text-2xl font-bold text-warning">
            {vendors.filter((v) => (v.category || '').toLowerCase().includes('mekanikal') || (v.category || '').toLowerCase().includes('me')).length}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Elektrikal & instalasi pipa</p>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier Material</p>
          <h3 className="mt-1.5 text-2xl font-bold text-emerald-600">
            {vendors.filter((v) => (v.category || '').toLowerCase().includes('supplier') || (v.category || '').toLowerCase().includes('bahan')).length}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Toko & distributor bahan</p>
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
              placeholder="Cari nama vendor, PIC, nomor telepon..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-input border border-line bg-surface focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>
          <div className="relative min-w-[200px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-input border border-line bg-surface text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VENDOR DATA TABLE */}
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5">Nama Perusahaan / Rekanan</th>
                <th className="px-5 py-3.5">Kategori Spesialis</th>
                <th className="px-5 py-3.5">Person In Charge (PIC)</th>
                <th className="px-5 py-3.5">Kontak / Telepon</th>
                <th className="px-5 py-3.5">Rekening Bank</th>
                <th className="px-5 py-3.5 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-surface/80 transition-colors">
                    <td className="px-5 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-navy">{v.name}</p>
                      {v.address && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{v.address}</p>}
                    </td>
                    <td className="px-5 py-3.5">{getCategoryBadge(v.category || '')}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {v.contact_person || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div className="space-y-0.5">
                        <p className="font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {v.phone || '-'}
                        </p>
                        {v.email && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {v.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                      {(v as any).bank_name ? (
                        <div>
                          <span className="font-bold text-navy">{(v as any).bank_name}</span>
                          <p className="text-slate-500">{(v as any).bank_account || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum disetel</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(v)}
                          className="text-[11px]"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(v.id)}
                          className="p-1 rounded-input text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors"
                          title="Hapus Rekanan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Tidak ada data mitra ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || categoryFilter !== 'all'
                        ? 'Coba sesuaikan kata kunci pencarian atau kategori Anda.'
                        : 'Mulai bangun direktori vendor dengan menekan tombol Tambah Mitra / Vendor.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT VENDOR */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
              <div>
                <h3 className="text-base font-bold text-navy">
                  {editingVendor ? 'Edit Data Mitra / Rekanan' : 'Tambah Mitra / Rekanan Baru'}
                </h3>
                <p className="text-xs text-slate-500">Lengkapi identitas badan usaha dan kontak penanggung jawab</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitVendor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Perusahaan / CV / Rekanan <span className="text-danger">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: PT Bangun Rekayasa Prima"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Spesialis <span className="text-danger">*</span>
                </label>
                <select
                  value={vendorForm.category}
                  onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                  className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                >
                  <option value="Sipil & Struktur">Sipil & Struktur</option>
                  <option value="Mekanikal & Elektrikal">Mekanikal & Elektrikal (ME)</option>
                  <option value="Finishing & Interior">Finishing & Interior</option>
                  <option value="Supplier Bahan">Supplier Bahan & Material</option>
                  <option value="Mandor Borongan">Mandor Borongan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama PIC (Penanggung Jawab)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Bambang"
                    value={vendorForm.contact_person}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxxxxx"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Bank Penerima
                  </label>
                  <input
                    type="text"
                    placeholder="BCA / Mandiri / BNI"
                    value={vendorForm.bank_name}
                    onChange={(e) => setVendorForm({ ...vendorForm, bank_name: e.target.value })}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={vendorForm.bank_account}
                    onChange={(e) => setVendorForm({ ...vendorForm, bank_account: e.target.value })}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Kantor / Workshop
                </label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Industri No. 45, Jakarta Barat"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full rounded-input border border-line p-3 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowVendorModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Mitra'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
