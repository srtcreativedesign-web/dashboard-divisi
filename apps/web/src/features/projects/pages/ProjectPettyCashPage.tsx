import React, { useState, useEffect, useCallback } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';
import { ProjectPettyCash, ProjectPettyCashSummary } from '../../../types/project';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { Button } from '../../../components/ui/Button';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  FileText,
  Download,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  AlertCircle,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  'Operasional Lapangan',
  'Material Darurat',
  'Konsumsi & Lembur',
  'Transport & Logistik',
  'Alat & Perlengkapan',
  'Retribusi & Izin',
  'Top-Up Kas',
  'Lain-lain',
];

function ProjectPettyCashContent({ project, refreshProject }: { project: any; refreshProject: any }) {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));

  const [items, setItems] = useState<ProjectPettyCash[]>([]);
  const [summary, setSummary] = useState<ProjectPettyCashSummary>({
    total_in: 0,
    total_out: 0,
    balance: 0,
    transaction_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: 'out' as 'in' | 'out',
    category: 'Operasional Lapangan',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    recipient_or_vendor: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await projectApi.getPettyCash(project.id, {
        type: filterType === 'all' ? undefined : filterType,
        category: filterCategory === 'all' ? undefined : filterCategory,
        search: search.trim() || undefined,
      });
      setItems(res?.data || []);
      if (res?.summary) {
        setSummary(res.summary);
      }
    } catch (e) {
      console.error('Gagal memuat petty cash:', e);
    } finally {
      setLoading(false);
    }
  }, [project.id, filterType, filterCategory, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      type: 'out',
      category: 'Operasional Lapangan',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      recipient_or_vendor: '',
    });
    setReceiptFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: ProjectPettyCash) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      category: item.category,
      amount: String(item.amount),
      transaction_date: item.transaction_date,
      description: item.description,
      recipient_or_vendor: item.recipient_or_vendor || '',
    });
    setReceiptFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Nominal harus lebih besar dari 0');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('category', form.category);
      formData.append('amount', form.amount);
      formData.append('transaction_date', form.transaction_date || '');
      formData.append('description', form.description);
      if (form.recipient_or_vendor) {
        formData.append('recipient_or_vendor', form.recipient_or_vendor);
      }
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      if (editingId) {
        await projectApi.updatePettyCash(project.id, editingId, formData);
        setNotice('Transaksi kas kecil berhasil diperbarui.');
      } else {
        await projectApi.addPettyCash(project.id, formData);
        setNotice('Transaksi kas kecil berhasil ditambahkan.');
      }

      setShowModal(false);
      await loadData();
      await refreshProject();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi kas kecil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus transaksi kas kecil ini?')) return;
    try {
      setDeletingId(id);
      await projectApi.deletePettyCash(project.id, id);
      setNotice('Transaksi kas kecil berhasil dihapus.');
      await loadData();
      await refreshProject();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi kas kecil');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (item: ProjectPettyCash) => {
    try {
      await projectApi.downloadPettyCashReceipt(project.id, item.id, `nota-${item.id}-${item.transaction_date}`);
    } catch {
      alert('Gagal mengunduh bukti kuitansi / nota');
    }
  };

  return (
    <div className="space-y-6">
      {/* NOTICE TOAST / BANNER */}
      {notice && (
        <div role="status" className="rounded-card bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {notice}
        </div>
      )}

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* SALDO BERJALAN */}
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Saldo Kas Kecil Proyek
          </p>
          <h3 className={`mt-1.5 text-2xl font-bold ${summary.balance >= 0 ? 'text-primary-600' : 'text-danger'}`}>
            {formatCurrency(summary.balance)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.balance >= 0 ? 'Likuiditas dana taktis aman' : 'Peringatan: Saldo kas minus!'}
          </p>
        </div>

        {/* TOTAL KAS MASUK (TOP-UP) */}
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Drop Dana (Masuk)
            </p>
            <span className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ArrowDownLeft className="h-3.5 w-3.5" />
            </span>
          </div>
          <h3 className="mt-1.5 text-2xl font-bold text-emerald-600">
            {formatCurrency(summary.total_in)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Penerimaan dana kas operasional</p>
        </div>

        {/* TOTAL KAS KELUAR */}
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Belanja Lapangan
            </p>
            <span className="p-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          <h3 className="mt-1.5 text-2xl font-bold text-slate-700">
            {formatCurrency(summary.total_out)}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Realisasi pengeluaran kas kecil</p>
        </div>

        {/* JUMLAH TRANSAKSI */}
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Transaksi
          </p>
          <h3 className="mt-1.5 text-2xl font-bold text-navy">
            {summary.transaction_count}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Catatan kas kecil terdaftar</p>
        </div>
      </div>

      {/* FILTER & ACTION TOOLBAR */}
      <div className="rounded-card-lg border border-line bg-white p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* TYPE TOGGLE BUTTONS */}
          <div className="flex bg-surface p-1 rounded-input border border-line text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-input transition-colors ${
                filterType === 'all' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterType('out')}
              className={`px-3 py-1 rounded-input transition-colors ${
                filterType === 'out' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Kas Keluar
            </button>
            <button
              type="button"
              onClick={() => setFilterType('in')}
              className={`px-3 py-1 rounded-input transition-colors ${
                filterType === 'in' ? 'bg-white shadow-xs text-navy font-bold' : 'text-slate-600 hover:text-navy'
              }`}
            >
              Kas Masuk (Top-Up)
            </button>
          </div>

          {/* CATEGORY FILTER */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 text-xs font-semibold rounded-input border border-line bg-surface text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* SEARCH INPUT */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari uraian atau toko..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-input border border-line bg-surface focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>
        </div>

        {canManage && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAdd}
            className="shrink-0 text-xs"
          >
            <Plus className="h-4 w-4" />
            Catat Transaksi Kas
          </Button>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
              <tr>
                <th className="px-5 py-3.5 w-12 text-center">No</th>
                <th className="px-5 py-3.5 w-28">Tanggal</th>
                <th className="px-5 py-3.5 w-28 text-center">Jenis</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Uraian / Keperluan</th>
                <th className="px-5 py-3.5">Penerima / Toko</th>
                <th className="px-5 py-3.5 text-right">Nominal (Rp)</th>
                <th className="px-5 py-3.5 text-center w-20">Bukti</th>
                <th className="px-5 py-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const isIn = item.type === 'in';
                  return (
                    <tr key={item.id} className="hover:bg-surface/80 transition-colors">
                      <td className="px-5 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-success-light text-success border border-success/30">
                            <ArrowDownLeft className="h-3 w-3" />
                            Kas Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowUpRight className="h-3 w-3" />
                            Kas Keluar
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-700 bg-surface px-2 py-0.5 rounded border border-line text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-navy">
                        <p>{item.description}</p>
                        {item.created_by && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Dicatat oleh: {item.created_by}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {item.recipient_or_vendor || '-'}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold ${isIn ? 'text-success' : 'text-slate-800'}`}>
                        {isIn ? `+ ${formatCurrency(item.amount)}` : `- ${formatCurrency(item.amount)}`}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {item.receipt_path ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            className="p-1 rounded text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                            title="Unduh Bukti Nota / Kuitansi"
                          >
                            <Download className="h-4 w-4 mx-auto" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {canManage ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-surface transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors disabled:opacity-50"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    <Receipt className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Belum ada transaksi kas kecil</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || filterCategory !== 'all' || filterType !== 'all'
                        ? 'Tidak ada transaksi kas kecil yang cocok dengan filter.'
                        : 'Mulai catat pengeluaran operasional lapangan atau top-up kas kecil proyek.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM CATAT TRANSAKSI KAS */}
      {canManage && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
              <div>
                <h3 className="text-base font-bold text-navy">
                  {editingId ? 'Edit Transaksi Kas Kecil' : 'Catat Transaksi Kas Kecil'}
                </h3>
                <p className="text-xs text-slate-500">
                  Pencatatan kas operasional lapangan dan drop dana proyek
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* JENIS TRANSAKSI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis Transaksi <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((c) => ({ ...c, type: 'out' }))}
                    className={`py-2 px-3 rounded-input text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      form.type === 'out'
                        ? 'border-rose-400 bg-rose-50 text-rose-700 shadow-xs'
                        : 'border-line bg-surface text-slate-600 hover:bg-white'
                    }`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Kas Keluar (Belanja)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((c) => ({ ...c, type: 'in', category: 'Top-Up Kas' }))}
                    className={`py-2 px-3 rounded-input text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      form.type === 'in'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'border-line bg-surface text-slate-600 hover:bg-white'
                    }`}
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" />
                    Kas Masuk (Top-Up Dana)
                  </button>
                </div>
              </div>

              {/* NOMINAL & TANGGAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nominal (Rp) <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Contoh: 150000"
                    value={form.amount}
                    onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Transaksi <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => setForm((c) => ({ ...c, transaction_date: e.target.value }))}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* KATEGORI & TOKO / PENERIMA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {form.type === 'in' ? 'Sumber Drop Dana' : 'Penerima / Toko'}
                  </label>
                  <input
                    type="text"
                    placeholder={form.type === 'in' ? 'Kas Besar Pusat / Finance' : 'TB Sinar Makmur / Mandor'}
                    value={form.recipient_or_vendor}
                    onChange={(e) => setForm((c) => ({ ...c, recipient_or_vendor: e.target.value }))}
                    className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* URAIAN DESKRIPSI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Uraian & Keterangan <span className="text-danger">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Rincian pembelian material darurat, konsumsi, bensin, atau keperluan taktis..."
                  value={form.description}
                  onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                  className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* UPLOAD BUKTI NOTA / KUITANSI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bukti Nota / Kuitansi (Opsional, PDF/JPG/PNG max 5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-input file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-primary-700 hover:file:bg-primary-50 border border-line rounded-input p-1"
                />
              </div>

              {/* BUTTONS */}
              <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectPettyCashPage() {
  return (
    <ProjectPageLayout
      title="Kas Kecil Proyek (Petty Cash)"
      description="Pencatatan dana taktis operasional lapangan, belanja darurat, konsumsi kerja, dan drop dana proyek."
    >
      {(project, refreshProject) => (
        <ProjectPettyCashContent project={project} refreshProject={refreshProject} />
      )}
    </ProjectPageLayout>
  );
}
