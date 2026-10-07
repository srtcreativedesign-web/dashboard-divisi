import { hasCapability } from '../../../session/capability';
import { cloneElement, useEffect, useState } from "react";
import { Plus, Pencil, XCircle, Tag, WalletCards, ShieldCheck } from "lucide-react";
import type {
  AccCategory,
  AccAccount,
  CategoryPayload,
  AccountPayload,
} from "../../../api/accounting";
import { AccountingQueryState } from "../../../components/accounting/AccountingStates";
import { useToast } from "../../../components/ui/Toast";
import {
  useAccountingCategories,
  useAccountingAccounts,
  useCategoryMutations,
  useAccountMutations,
} from "../../../hooks/useAccounting";
import { useAuth } from "../../../session/AuthContext";
import { DetailSheet } from "../../../components/ui/DetailSheet";
import { Button } from "../../../components/ui/Button";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactElement<{
    className?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}) {
  const id = `err-${label.toLowerCase().replace(/\W/g, "-")}`;
  return (
    <label className="text-sm font-medium">
      {label}
      <span className="block">
        {cloneElement(children, {
          className:
            "mt-1 w-full rounded-input border border-line p-2 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? id : undefined,
        })}
      </span>
      {error && (
        <span id={id} className="mt-1 block text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

const ACC_TYPES = ["asset", "liability", "equity", "revenue", "expense"] as const;

export default function AccountingMasterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canWrite = hasCapability(user?.role ?? '', 'manage:acc_master', user?.divisionCode);

  const categories = useAccountingCategories();
  const accounts = useAccountingAccounts();
  const catMut = useCategoryMutations();
  const accMut = useAccountMutations();

  const [catForm, setCatForm] = useState<CategoryPayload>({
    code: "",
    name: "",
    requires_outlet: false,
  });
  const [catErrors, setCatErrors] = useState<Record<string, string>>({});
  const [catEditing, setCatEditing] = useState<AccCategory | null>(null);

  const [accForm, setAccForm] = useState<AccountPayload>({
    code: "",
    display_name: "",
    type: "asset",
    outlet_ids: [],
  });
  const [accErrors, setAccErrors] = useState<Record<string, string>>({});
  const [accEditing, setAccEditing] = useState<AccAccount | null>(null);
  const [outletInput, setOutletInput] = useState("");

  const [activeTab, setActiveTab] = useState<'categories' | 'accounts'>('categories');
  const [editor, setEditor] = useState<'category' | 'account' | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!catEditing) return;
    setCatForm({
      code: catEditing.code,
      name: catEditing.name,
      requires_outlet: catEditing.requiresOutlet,
    });
  }, [catEditing]);

  useEffect(() => {
    if (!accEditing) return;
    setAccForm({
      code: accEditing.code,
      display_name: accEditing.displayName,
      type: accEditing.type,
      outlet_ids: [...(accEditing.outletIds ?? [])],
    });
  }, [accEditing]);

  const submitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!catForm.code.trim()) errs.code = "Kode wajib diisi";
    if (catForm.code.trim().length > 10) errs.code = "Maksimal 10 karakter";
    if (!catForm.name.trim()) errs.name = "Nama wajib diisi";
    setCatErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      if (catEditing) {
        await catMut.update.mutateAsync({ id: catEditing.id, payload: catForm });
        toast("Kategori berhasil diperbarui", "success");
        setCatEditing(null);
      } else {
        await catMut.create.mutateAsync(catForm);
        toast("Kategori berhasil dibuat", "success");
      }
      setCatForm({ code: "", name: "", requires_outlet: false });
      setEditor(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan kategori", "error");
    }
  };

  const deactivateCat = async (cat: AccCategory) => {
    if (!window.confirm(`Nonaktifkan kategori "${cat.name}"?`)) return;
    try {
      await catMut.deactivate.mutateAsync(cat.id);
      toast("Kategori dinonaktifkan", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menonaktifkan kategori", "error");
    }
  };

  const submitAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!accForm.code.trim()) errs.code = "Kode wajib diisi";
    if (accForm.code.trim().length > 10) errs.code = "Maksimal 10 karakter";
    if (!accForm.display_name.trim()) errs.display_name = "Nama tampilan wajib diisi";
    if (!ACC_TYPES.includes(accForm.type as (typeof ACC_TYPES)[number])) errs.type = "Tipe tidak valid";
    setAccErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      if (accEditing) {
        await accMut.update.mutateAsync({ id: accEditing.id, payload: accForm });
        toast("Rekening berhasil diperbarui", "success");
        setAccEditing(null);
      } else {
        await accMut.create.mutateAsync(accForm);
        toast("Rekening berhasil dibuat", "success");
      }
      setAccForm({ code: "", display_name: "", type: "asset", outlet_ids: [] });
      setEditor(null);
      setOutletInput("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan rekening", "error");
    }
  };

  const deactivateAcc = async (acc: AccAccount) => {
    if (!window.confirm(`Nonaktifkan rekening "${acc.displayName}"?`)) return;
    try {
      await accMut.deactivate.mutateAsync(acc.id);
      toast("Rekening dinonaktifkan", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menonaktifkan rekening", "error");
    }
  };

  const addOutletId = () => {
    const trimmed = outletInput.trim();
    if (!trimmed || accForm.outlet_ids?.includes(trimmed)) return;
    setAccForm({
      ...accForm,
      outlet_ids: [...(accForm.outlet_ids ?? []), trimmed],
    });
    setOutletInput("");
  };

  const removeOutletId = (id: string) => {
    setAccForm({
      ...accForm,
      outlet_ids: (accForm.outlet_ids ?? []).filter((x) => x !== id),
    });
  };

  const cancelCatEdit = () => {
    setCatEditing(null);
    setCatForm({ code: "", name: "", requires_outlet: false });
    setCatErrors({});
  };

  const cancelAccEdit = () => {
    setAccEditing(null);
    setAccForm({ code: "", display_name: "", type: "asset", outlet_ids: [] });
    setAccErrors({});
    setOutletInput("");
  };

  const filteredCategories = categories.data?.filter(item => `${item.code} ${item.name}`.toLowerCase().includes(search.toLowerCase()));
  const filteredAccounts = accounts.data?.filter(item => `${item.code} ${item.displayName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="space-y-8 pb-12 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-navy">Master Data Accounting</h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            {canWrite 
              ? "Kelola kategori buku kas, daftar rekening, dan relasi outlet. Pastikan kode unik sesuai standar perusahaan."
              : "Daftar referensi kategori dan rekening yang digunakan dalam penjurnalan dan pelaporan."}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 rounded-md text-slate-600">
             <ShieldCheck className="w-4 h-4 text-primary" />
             {canWrite ? 'Dapat mengelola' : 'Hanya baca'}
           </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" aria-label="Tipe master data">
          <Button variant={activeTab === 'categories' ? 'primary' : 'secondary'} onClick={() => { setActiveTab('categories'); setSearch(''); }}>Kategori ({categories.data?.length ?? '—'})</Button>
          <Button variant={activeTab === 'accounts' ? 'primary' : 'secondary'} onClick={() => { setActiveTab('accounts'); setSearch(''); }}>Rekening ({accounts.data?.length ?? '—'})</Button>
        </div>
        <input aria-label="Cari master data" value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari kode atau nama…" className="w-full rounded-lg border border-line bg-white px-3 text-sm sm:w-72" />
      </div>
      <div className="space-y-6">
        <div hidden={activeTab !== 'categories'}>
          <div className="rounded-card border border-line bg-white flex flex-col overflow-hidden">
            <div className="border-b border-line bg-slate-50/50 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-navy flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" /> Kategori Jurnal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Klasifikasi arus kas (mis. PNJL, BIAYA).</p>
              </div>
              {canWrite && (
                <Button
                  onClick={() => {
                    cancelCatEdit();
                    setEditor('category');
                  }}
                  size="sm"
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah kategori
                </Button>
              )}
            </div>
            
            <AccountingQueryState
              loading={categories.isLoading}
              error={categories.error}
              empty={!filteredCategories?.length}
              retry={() => void categories.refetch()}
            >
              <div
                role="region"
                aria-label="Daftar kategori"
                className="max-h-[65vh] overflow-auto" tabIndex={0}
              >
                <table className="w-full text-left text-sm" role="table">
                  <thead className="sticky top-0 bg-slate-50 border-b border-line z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="p-3 font-semibold text-slate-600 w-24">Kode</th>
                      <th scope="col" className="p-3 font-semibold text-slate-600">Nama Kategori</th>
                      <th scope="col" className="p-3 font-semibold text-slate-600 text-center w-24">Status</th>
                      <th scope="col" className="sr-only">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredCategories?.map((x) => (
                      <tr className="hover:bg-slate-50/50 transition-colors group" key={x.id}>
                        <td className="p-3 font-mono text-slate-600">{x.code}</td>
                        <td className="p-3 font-medium text-navy">
                          {x.name}
                          {x.requiresOutlet && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Wajib outlet</span>}
                        </td>
                        <td className="p-3 text-center">
                          {x.isActive 
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span>
                            : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Inaktif</span>
                          }
                        </td>
                        <td className="p-3 w-20">
                          {canWrite && (
                            <div className="flex gap-1 justify-end opacity-100 transition-opacity">
                              <button
                                type="button"
                                aria-label={`Edit kategori ${x.name}`}
                                onClick={() => {
                                  setCatEditing(x);
                                  setEditor('category');
                                }}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-navy transition-colors"
                                disabled={catMut.update.isPending}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Nonaktifkan kategori ${x.name}`}
                                onClick={() => void deactivateCat(x)}
                                className="rounded p-1.5 text-slate-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                disabled={!x.isActive || catMut.deactivate.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccountingQueryState>
          </div>

          {canWrite && (
            <DetailSheet isOpen={editor === 'category'} onClose={() => setEditor(null)} title={catEditing ? 'Edit kategori' : 'Tambah kategori'}>
            <form
              onSubmit={(e) => void submitCat(e)}
              className="rounded-card border border-line bg-white overflow-hidden"
              noValidate
              aria-label={catEditing ? "Form edit kategori" : "Form tambah kategori"}
            >
              <div className="border-b border-line bg-slate-50/50 p-4">
                <h2 className="font-bold text-navy">
                  {catEditing ? "Edit Kategori" : "Tambah Kategori"}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <Field label="Kode Unik" error={catErrors.code}>
                  <input
                    value={catForm.code}
                    onChange={(e) => setCatForm({ ...catForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. PNJL"
                    maxLength={10}
                    disabled={catMut.create.isPending || catMut.update.isPending}
                  />
                </Field>
                <Field label="Nama Deskriptif" error={catErrors.name}>
                  <input
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="e.g. Penjualan Barang"
                    disabled={catMut.create.isPending || catMut.update.isPending}
                  />
                </Field>
                <label className="flex items-center gap-2.5 text-sm p-3 border border-line rounded-input bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={catForm.requires_outlet ?? false}
                    onChange={(e) => setCatForm({ ...catForm, requires_outlet: e.target.checked })}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    disabled={catMut.create.isPending || catMut.update.isPending}
                  />
                  <div>
                    <span className="block font-medium text-navy leading-none">Wajibkan Outlet</span>
                    <span className="text-xs text-slate-500 mt-1 block">Jurnal untuk kategori ini wajib di-tag ke outlet.</span>
                  </div>
                </label>
                <div className="flex gap-2 pt-2">
                  {catEditing && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelCatEdit}
                      className="flex-1"
                      disabled={catMut.update.isPending}
                    >
                      Batal
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={catMut.create.isPending || catMut.update.isPending}
                    className="flex-1"
                  >
                    {catMut.create.isPending || catMut.update.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            </form>
            </DetailSheet>
          )}
        </div>

        <div hidden={activeTab !== 'accounts'}>
          <div className="rounded-card border border-line bg-white flex flex-col overflow-hidden">
            <div className="border-b border-line bg-slate-50/50 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-navy flex items-center gap-2">
                  <WalletCards className="w-4 h-4 text-slate-400" /> Daftar Rekening
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Pemetaan akun (Asset, Liability, Revenue).</p>
              </div>
              {canWrite && (
                <Button
                  onClick={() => {
                    cancelAccEdit();
                    setEditor('account');
                  }}
                  size="sm"
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah rekening
                </Button>
              )}
            </div>

            <AccountingQueryState
              loading={accounts.isLoading}
              error={accounts.error}
              empty={!filteredAccounts?.length}
              retry={() => void accounts.refetch()}
            >
              <div
                role="region"
                aria-label="Daftar rekening"
                className="max-h-[65vh] overflow-auto" tabIndex={0}
              >
                <table className="w-full text-left text-sm" role="table">
                  <thead className="sticky top-0 bg-slate-50 border-b border-line z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="p-3 font-semibold text-slate-600 w-24">Kode</th>
                      <th scope="col" className="p-3 font-semibold text-slate-600">Rekening</th>
                      <th scope="col" className="p-3 font-semibold text-slate-600 w-28">Tipe</th>
                      <th scope="col" className="p-3 font-semibold text-slate-600 w-32">Relasi outlet</th>
                      <th scope="col" className="sr-only">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredAccounts?.map((x) => (
                      <tr className="hover:bg-slate-50/50 transition-colors group" key={x.id}>
                        <td className="p-3 font-mono text-slate-600">{x.code}</td>
                        <td className="p-3 font-medium text-navy">
                           {x.displayName}
                           {!x.isActive && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Inaktif</span>}
                        </td>
                        <td className="p-3 text-slate-500 capitalize">{x.type}</td>
                        <td className="p-3">
                           {x.outletIds?.length 
                              ? <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium text-[11px]">{x.outletIds.length} Relasi</span>
                              : <span className="text-slate-400 text-xs italic">Semua</span>
                           }
                        </td>
                        <td className="p-3 w-20">
                          {canWrite && (
                            <div className="flex gap-1 justify-end opacity-100 transition-opacity">
                              <button
                                type="button"
                                aria-label={`Edit rekening ${x.displayName}`}
                                onClick={() => {
                                  setAccEditing(x);
                                  setEditor('account');
                                }}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-navy transition-colors"
                                disabled={accMut.update.isPending}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Nonaktifkan rekening ${x.displayName}`}
                                onClick={() => void deactivateAcc(x)}
                                className="rounded p-1.5 text-slate-400 hover:bg-danger/10 hover:text-danger transition-colors"
                                disabled={!x.isActive || accMut.deactivate.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccountingQueryState>
          </div>

          {canWrite && (
            <DetailSheet isOpen={editor === 'account'} onClose={() => setEditor(null)} title={accEditing ? 'Edit rekening' : 'Tambah rekening'}>
            <form
              onSubmit={(e) => void submitAcc(e)}
              className="rounded-card border border-line bg-white overflow-hidden"
              noValidate
              aria-label={accEditing ? "Form edit rekening" : "Form tambah rekening"}
            >
              <div className="border-b border-line bg-slate-50/50 p-4">
                <h2 className="font-bold text-navy">
                  {accEditing ? "Edit Rekening" : "Tambah Rekening"}
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <Field label="Kode Akun" error={accErrors.code}>
                  <input
                    value={accForm.code}
                    onChange={(e) => setAccForm({ ...accForm, code: e.target.value })}
                    placeholder="e.g. 1101"
                    maxLength={10}
                    disabled={accMut.create.isPending || accMut.update.isPending}
                  />
                </Field>
                <Field label="Nama Tampilan" error={accErrors.display_name}>
                  <input
                    value={accForm.display_name}
                    onChange={(e) => setAccForm({ ...accForm, display_name: e.target.value })}
                    placeholder="e.g. Kas Besar"
                    disabled={accMut.create.isPending || accMut.update.isPending}
                  />
                </Field>
                <Field label="Tipe Akun" error={accErrors.type}>
                  <select
                    value={accForm.type}
                    onChange={(e) => setAccForm({ ...accForm, type: e.target.value })}
                    disabled={accMut.create.isPending || accMut.update.isPending}
                    className="bg-white"
                  >
                    {ACC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <label className="text-sm font-medium block">
                    Relasi Outlet <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2 mt-0.5 leading-tight">Batasi akses akun ini hanya ke outlet tertentu. Kosongkan untuk akses global.</p>
                  <div className="flex gap-2">
                    <input
                      value={outletInput}
                      onChange={(e) => setOutletInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOutletId();
                        }
                      }}
                      placeholder="Outlet ID"
                      className="w-full rounded-input border border-line p-2 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={accMut.create.isPending || accMut.update.isPending}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addOutletId}
                      disabled={accMut.create.isPending || accMut.update.isPending}
                    >
                      Add
                    </Button>
                  </div>
                  {(accForm.outlet_ids ?? []).length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 border border-line rounded-lg">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Terhubung dengan:</p>
                      <ul
                        className="flex flex-wrap gap-2"
                        aria-label="Daftar outlet terpilih"
                      >
                        {accForm.outlet_ids?.map((id) => (
                          <li
                            key={id}
                            className="flex items-center gap-1.5 rounded-md bg-white border border-line px-2 py-1 text-xs font-medium text-navy shadow-sm"
                          >
                            <span>{id}</span>
                            <button
                              type="button"
                              aria-label={`Hapus outlet ${id}`}
                              onClick={() => removeOutletId(id)}
                              className="text-slate-400 hover:text-danger focus:outline-none"
                              disabled={accMut.create.isPending || accMut.update.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  {accEditing && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelAccEdit}
                      className="flex-1"
                      disabled={accMut.update.isPending}
                    >
                      Batal
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={accMut.create.isPending || accMut.update.isPending}
                    className="flex-1"
                  >
                    {accMut.create.isPending || accMut.update.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            </form>
            </DetailSheet>
          )}
        </div>
      </div>
    </section>
  );
}
