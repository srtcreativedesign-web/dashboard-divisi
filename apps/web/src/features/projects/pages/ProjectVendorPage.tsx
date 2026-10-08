import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { ProjectVendor } from '../../../types/project';
import { vendorApi } from '../../../api/projects';
import { LoadingState, EmptyState, ErrorState } from '../../../components/states';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';

const emptyForm = { name: '', category: '', contact_person: '', phone: '', email: '' };

export default function ProjectVendorPage() {
  const { user } = useAuth();
  const canView = Boolean(user && hasCapability(user.role, 'view:projects', user.divisionCode));
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const canReadContact = canManage || user?.role === 'BOD';
  const [editing, setEditing] = useState<ProjectVendor | null | undefined>(undefined);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reload, setReload] = useState(0);
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    let active = true;
    setLoading(true); setError(null); setVendors([]);
    vendorApi.getVendors({ search: search || undefined, page, per_page: 50 })
      .then(data => { if (active) { setVendors(data.data); setLastPage(data.last_page ?? 1); setTotal(data.total ?? data.data.length); } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Gagal memuat data vendor'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canView, search, page, reload]);

  if (!canView) return <p role="alert">Akses direktori vendor tidak tersedia untuk akun ini.</p>;

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
      setReload(value => value + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan vendor');
    } finally { setSaving(false); }
  }

  return (
    <div className="min-w-0 space-y-6">
      <DivisionPageHeader division="Divisi Proyek" descriptor="Pengadaan · Mitra Kerja" title="Mitra & vendor" description="Kelola direktori mitra kerja, subkontraktor, dan pemasok sesuai kewenangan akun." actions={canManage ? <button
          disabled={saving}
          onClick={() => openForm(null)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
        >
          + Tambah Vendor
        </button> : undefined} />

      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {!canReadContact && <p className="text-sm text-subtle dark:text-slate-400">Kontak vendor hanya tersedia untuk pengguna yang berwenang.</p>}
      {canManage && editing !== undefined && <form onSubmit={save} className="space-y-4 rounded-card-lg border border-line bg-panel p-5 dark:bg-slate-900" aria-label={editing ? 'Edit vendor' : 'Tambah vendor'}>
        <h2 className="font-semibold text-navy">{editing ? 'Edit vendor' : 'Tambah vendor'}</h2>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          {(['name', 'category', 'contact_person', 'phone', 'email'] as const).map(key => <label key={key} className="text-sm text-muted dark:text-slate-300">
            {{ name: 'Nama vendor', category: 'Kategori', contact_person: 'Nama kontak', phone: 'Telepon', email: 'Email' }[key]}
            <input required={key === 'name'} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} maxLength={255} value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full rounded-input border border-line px-3 py-2" />
          </label>)}
        </fieldset>
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <div className="flex gap-3"><button type="submit" disabled={saving} className="rounded-input bg-primary px-4 py-2 text-sm text-white">{saving ? 'Menyimpan...' : 'Simpan vendor'}</button><button type="button" disabled={saving} onClick={() => setEditing(undefined)} className="rounded-input border border-line px-4 py-2 text-sm">Batal</button></div>
      </form>}

      <label className="block text-sm text-muted dark:text-slate-300">Cari vendor<input type="search" maxLength={255} disabled={saving} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="mt-2 w-full rounded-input border border-line bg-panel px-3 py-2 dark:bg-slate-900 dark:text-white" /></label>
      {loading && <LoadingState />}
      {error && <ErrorState description={error} onRetry={() => setReload(value => value + 1)} />}
      {!loading && !error && <><p className="text-sm text-subtle dark:text-slate-400">{total} vendor sesuai pencarian · maksimal 50 vendor per halaman</p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-line dark:border-slate-800 bg-panel dark:bg-slate-900 shadow-sm">
        {vendors.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-surface dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Nama Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Kategori</th>
                {canReadContact && <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Kontak</th>}
                {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-subtle uppercase tracking-wider">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-panel dark:bg-slate-900">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-surface dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy dark:text-white">{v.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle dark:text-slate-400">{v.category}</td>
                  {canReadContact && <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle dark:text-slate-400">
                    <div>{v.contact_person}</div>
                    <div className="text-xs">{v.phone}</div>
                  </td>}
                  {canManage && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button disabled={saving} onClick={() => openForm(v)} aria-label={`Edit ${v.name}`} className="min-h-10 text-primary-600 dark:text-primary-300 hover:text-primary-900 dark:text-primary-300">Edit</button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Tidak ada vendor" description={search ? 'Tidak ada vendor yang cocok dengan pencarian. Ubah kata pencarian.' : 'Belum ada mitra atau vendor yang ditambahkan.'} />
        )}
      </div>
      {(vendors.length > 0 || page > 1) && <nav aria-label="Halaman direktori vendor" className="flex flex-wrap items-center gap-4 text-sm">
        <button className="min-h-10 rounded-input border border-line px-3 disabled:opacity-50" disabled={saving || page <= 1} onClick={() => setPage(value => value - 1)}>Sebelumnya</button>
        <span>Halaman {page} dari {lastPage}</span>
        <button className="min-h-10 rounded-input border border-line px-3 disabled:opacity-50" disabled={saving || page >= lastPage} onClick={() => setPage(value => value + 1)}>Berikutnya</button>
      </nav>}</>}
    </div>
  );
}
