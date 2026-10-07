import { useState, useEffect, type FormEvent } from 'react';
import type { ProjectVendor } from '../../../types/project';
import { vendorApi } from '../../../api/projects';
import { LoadingState, EmptyState, ErrorState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  CreditCard,
  HardHat,
  Trash2,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

const emptyForm = {
  name: '',
  category: '',
  contact_person: '',
  phone: '',
  email: '',
};

export default function ProjectVendorPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const canReadContact = canManage || user?.role === 'BOD';

  const [editing, setEditing] = useState<ProjectVendor | null | undefined>(undefined);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getVendors({ per_page: 100 });
      setVendors(data.data || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data vendor');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (v: ProjectVendor | null) => {
    setEditing(v);
    setForm(
      v
        ? {
            name: v.name,
            category: v.category ?? '',
            contact_person: v.contact_person ?? '',
            phone: v.phone ?? '',
            email: v.email ?? '',
          }
        : { ...emptyForm }
    );
    setSaveError(null);
    setNotice('');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canManage || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) {
        await vendorApi.updateVendor(editing.id, form);
      } else {
        await vendorApi.createVendor(form);
      }
      setEditing(undefined);
      setNotice('Data vendor berhasil disimpan.');
      await fetchVendors();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus mitra / vendor ini dari direktori?')) return;
    try {
      await vendorApi.deleteVendor(id);
      await fetchVendors();
      setNotice('Vendor berhasil dihapus.');
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Gagal menghapus vendor');
    }
  };

  if (loading) return <LoadingState label="Memuat direktori mitra & vendor..." />;
  if (error) return <ErrorState description={error} onRetry={() => { void fetchVendors(); }} />;

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.contact_person && v.contact_person.toLowerCase().includes(search.toLowerCase())) ||
      (v.category && v.category.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'SIPIL' && (v.category || '').toLowerCase().includes('sipil')) ||
      (categoryFilter === 'ME' && (v.category || '').toLowerCase().includes('me')) ||
      (categoryFilter === 'SUPPLIER' && (v.category || '').toLowerCase().includes('supplier'));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* HEADER HERO */}
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
        {canManage && (
          <Button
            variant="primary"
            size="md"
            disabled={saving}
            onClick={() => openForm(null)}
            className="shrink-0 text-xs"
          >
            <Plus className="h-4 w-4" />
            Tambah Vendor
          </Button>
        )}
      </div>

      {notice && (
        <div role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {notice}
        </div>
      )}

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Mitra Rekanan</p>
          <h3 className="mt-1.5 text-2xl font-bold text-navy">{vendors.length}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Semua mitra aktif terdaftar</p>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sipil & Struktur</p>
          <h3 className="mt-1.5 text-2xl font-bold text-primary-600">
            {vendors.filter((v) => (v.category || '').toLowerCase().includes('sipil')).length}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Kontraktor & mandor fisik</p>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ME & Teknis</p>
          <h3 className="mt-1.5 text-2xl font-bold text-amber-600">
            {vendors.filter((v) => (v.category || '').toLowerCase().includes('me')).length}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Elektrikal & instalasi pipa</p>
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supplier Material</p>
          <h3 className="mt-1.5 text-2xl font-bold text-emerald-600">
            {vendors.filter((v) => (v.category || '').toLowerCase().includes('supplier')).length}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Toko & distributor bahan</p>
        </div>
      </div>

      {/* MODAL / FORM ADD & EDIT VENDOR */}
      {canManage && editing !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="bg-white rounded-card-lg border border-line shadow-card-hover w-full max-w-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-navy">
              {editing ? 'Edit vendor' : 'Tambah vendor'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4" aria-label={editing ? 'Edit vendor' : 'Tambah vendor'}>
              <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama vendor
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Nama PT / CV / Perorangan"
                      className="mt-1 w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                      placeholder="Sipil / ME / Supplier"
                      className="mt-1 w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama kontak
                    <input
                      type="text"
                      value={form.contact_person}
                      onChange={(e) => setForm((c) => ({ ...c, contact_person: e.target.value }))}
                      placeholder="PIC Lapangan"
                      className="mt-1 w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Telepon
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                      placeholder="0812xxxxxxx"
                      className="mt-1 w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                      placeholder="kontak@vendor.id"
                      className="mt-1 w-full rounded-input border border-line px-3 py-2 text-navy text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </label>
                </div>
              </fieldset>

              {saveError && (
                <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-input">
                  {saveError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => setEditing(undefined)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan vendor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-card border border-line bg-white p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama vendor, kontak, atau keahlian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-input border border-line pl-9 pr-3.5 py-2 text-xs font-medium text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'SIPIL', 'ME', 'SUPPLIER'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-input text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-slate-600 hover:bg-slate-100 hover:text-navy'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* VENDORS TABLE - CLEAN LIGHT UNIFIED THEME */}
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        {filteredVendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                <tr>
                  <th className="px-5 py-3.5">Nama Vendor & Entitas</th>
                  <th className="px-5 py-3.5">Kategori Bidang</th>
                  {canReadContact && <th className="px-5 py-3.5">Kontak & Alamat</th>}
                  {canManage && <th className="px-5 py-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredVendors.map((v) => (
                  <tr key={v.id} className="hover:bg-surface/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-input bg-primary-50 text-primary-700 border border-primary-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {v.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-navy">{v.name}</p>
                          <p className="text-[11px] text-slate-400">ID Mitra #{v.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                        {v.category || 'Umum'}
                      </span>
                    </td>
                    {canReadContact && (
                      <td className="px-5 py-3.5 text-slate-600 space-y-0.5">
                        <p className="font-medium text-navy">{v.contact_person || '-'}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          {v.phone && <span>{v.phone}</span>}
                          {v.email && <span>{v.email}</span>}
                        </div>
                      </td>
                    )}
                    {canManage && (
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => openForm(v)}
                          aria-label={`Edit ${v.name}`}
                          className="font-semibold text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleDelete(v.id)}
                          aria-label={`Hapus ${v.name}`}
                          className="font-semibold text-rose-600 hover:text-rose-800 ml-2"
                        >
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Tidak ada mitra ditemukan"
            description="Belum ada data vendor yang cocok dengan filter pencarian."
          />
        )}
      </div>
    </div>
  );
}
