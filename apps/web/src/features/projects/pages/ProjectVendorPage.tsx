import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { ProjectVendor } from '../../../types/project';
import { vendorApi } from '../../../api/projects';
import { LoadingState, EmptyState, ErrorState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

const emptyForm = { name: '', category: '', contact_person: '', phone: '', email: '' };

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

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getVendors();
      setVendors(data.data || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data vendor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={() => { void fetchVendors(); }} />;

  function openForm(vendor: ProjectVendor | null) {
    setEditing(vendor);
    setForm(vendor ? { name: vendor.name, category: vendor.category ?? '', contact_person: vendor.contact_person ?? '', phone: vendor.phone ?? '', email: vendor.email ?? '' } : { ...emptyForm });
    setSaveError(null);
    setNotice('');
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!canManage || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing) await vendorApi.updateVendor(editing.id, form);
      else await vendorApi.createVendor(form);
      setEditing(undefined);
      setNotice('Data vendor berhasil disimpan.');
      await fetchVendors();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan vendor');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mitra & Vendor</h1>
          <p className="text-sm text-slate-500">Direktori mitra kerja, sub-kontraktor, dan supplier</p>
        </div>
        {canManage && <button
          disabled={saving}
          onClick={() => openForm(null)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
        >
          + Tambah Vendor
        </button>}
      </div>

      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {!canReadContact && <p className="text-sm text-slate-500">Kontak vendor hanya tersedia untuk pengguna yang berwenang.</p>}
      {canManage && editing !== undefined && <form onSubmit={save} className="space-y-4 rounded-card-lg border border-line bg-white p-5" aria-label={editing ? 'Edit vendor' : 'Tambah vendor'}>
        <h2 className="font-semibold text-navy">{editing ? 'Edit vendor' : 'Tambah vendor'}</h2>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          {(['name', 'category', 'contact_person', 'phone', 'email'] as const).map(key => <label key={key} className="text-sm text-slate-700">
            {{ name: 'Nama vendor', category: 'Kategori', contact_person: 'Nama kontak', phone: 'Telepon', email: 'Email' }[key]}
            <input required={key === 'name'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} maxLength={255} value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full rounded-input border border-line px-3 py-2" />
          </label>)}
        </fieldset>
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <div className="flex gap-3"><button type="submit" disabled={saving} className="rounded-input bg-primary px-4 py-2 text-sm text-white">{saving ? 'Menyimpan...' : 'Simpan vendor'}</button><button type="button" disabled={saving} onClick={() => setEditing(undefined)} className="rounded-input border border-line px-4 py-2 text-sm">Batal</button></div>
      </form>}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {vendors.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                {canReadContact && <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kontak</th>}
                {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{v.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{v.category}</td>
                  {canReadContact && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>{v.contact_person}</div>
                    <div className="text-xs">{v.phone}</div>
                  </td>}
                  {canManage && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button disabled={saving} onClick={() => openForm(v)} aria-label={`Edit ${v.name}`} className="text-primary-600 hover:text-primary-900">Edit</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Tidak ada vendor" description="Belum ada mitra atau vendor yang ditambahkan." />
        )}
      </div>
    </div>
  );
}
