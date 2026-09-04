import { useState } from 'react';
import { Plus, Clock, ArrowUpRight, Search, X, Check, XCircle } from 'lucide-react';
import { ACCOUNTING_EXCEL_DATA } from '../data/accountingExcelData';
import { useToast } from '../components/ui/Toast';
import { useAccountingOutstandings, useOutstandingMutations } from '../hooks/useAccounting';

interface OutstandingItem {
  id: string;
  code: string;
  description: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  category: string;
}

const rupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AccountingOutstandingPage() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPayItem, setSelectedPayItem] = useState<OutstandingItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBank, setSelectedBank] = useState('155-00-1485895-8 (MANDIRI PIONER)');

  // Form tambah outstanding
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-09-30');
  const [newCategory, setNewCategory] = useState('Operasional Wrapping');

  // React Query backend hooks
  const { data: serverData, isLoading } = useAccountingOutstandings({
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: search ? search : undefined,
  });
  const mutations = useOutstandingMutations();

  // Local fallback items if serverData not loaded yet
  const fallbackItems: OutstandingItem[] = ACCOUNTING_EXCEL_DATA.cashflow.outstandingItems.map((x) => ({
    ...x,
    status: x.status as 'unpaid' | 'partial' | 'paid' | 'cancelled',
  }));

  const items: OutstandingItem[] = serverData?.items
    ? serverData.items.map((it) => ({
        id: it.id,
        code: it.code,
        description: it.description,
        amount: it.amount,
        paidAmount: it.paid_amount,
        remainingAmount: it.remaining_amount,
        dueDate: it.due_date,
        status: it.status,
        category: it.category_name ?? 'Operasional Wrapping',
      }))
    : fallbackItems;

  const kpis = serverData?.kpis ?? {
    total_active_outstanding: items.filter((x) => x.status !== 'cancelled' && x.status !== 'paid').reduce((sum, x) => sum + x.remainingAmount, 0),
    total_paid: items.reduce((sum, x) => sum + x.paidAmount, 0),
    actual_cash_balance: ACCOUNTING_EXCEL_DATA.cashflow.totalEndingBalance,
    projected_ending_balance: ACCOUNTING_EXCEL_DATA.cashflow.totalEndingBalance - items.filter((x) => x.status !== 'cancelled' && x.status !== 'paid').reduce((sum, x) => sum + x.remainingAmount, 0),
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newAmount);
    if (!newDesc.trim() || isNaN(num) || num <= 0) {
      toast('Isi deskripsi dan nominal yang valid', 'error');
      return;
    }

    try {
      await mutations.create.mutateAsync({
        description: newDesc.trim(),
        amount: num,
        due_date: newDueDate,
        category_name: newCategory,
      });
      toast(`Kewajiban "${newDesc}" senilai ${rupiah(num)} berhasil disimpan di backend`, 'success');
      setShowAddModal(false);
      setNewDesc('');
      setNewAmount('');
    } catch {
      toast('Gagal menyimpan kewajiban ke backend', 'error');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayItem) return;
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast('Nominal pembayaran tidak valid', 'error');
      return;
    }
    if (amountNum > selectedPayItem.remainingAmount) {
      toast(`Nominal melebihi sisa tagihan (${rupiah(selectedPayItem.remainingAmount)})`, 'error');
      return;
    }

    try {
      await mutations.pay.mutateAsync({
        id: selectedPayItem.id,
        payload: {
          amount: amountNum,
          payment_date: payDate,
          notes: `Realisasi via ${selectedBank}`,
        },
      });
      toast(`Realisasi pembayaran ${rupiah(amountNum)} berhasil dicatat di backend dari rekening ${selectedBank}`, 'success');
      setSelectedPayItem(null);
      setPayAmount('');
    } catch {
      toast('Gagal memproses pembayaran ke backend', 'error');
    }
  };

  const handleCancel = async (item: OutstandingItem) => {
    if (!confirm(`Batalkan kewajiban "${item.description}"? (Akan ditandai soft-cancel)`)) return;
    try {
      await mutations.cancel.mutateAsync({
        id: item.id,
        reason: 'Dibatalkan oleh Admin ACC',
      });
      toast('Kewajiban berhasil dibatalkan di backend (soft-cancel)', 'info');
    } catch {
      toast('Gagal membatalkan kewajiban', 'error');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchSearch = item.description.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">ACCOUNTING CONTROL CENTER</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Outstanding Accounting</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pencatatan kewajiban belum lunas, realisasi pembayaran, dan proyeksi saldo kas akhir.
            {isLoading && <span className="ml-2 text-xs text-primary animate-pulse">(Menyinkronkan backend...)</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-primary-dark transition"
        >
          <Plus className="h-4 w-4" />
          Catat Kewajiban Baru
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outstanding Aktif</p>
          <p className="mt-2 text-2xl font-bold text-warning-dark">{rupiah(kpis.total_active_outstanding)}</p>
          <p className="mt-1 text-xs text-slate-500">{items.filter((x) => x.status !== 'cancelled' && x.status !== 'paid').length} item kewajiban operasional</p>
        </div>

        <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Realisasi Bayar</p>
          <p className="mt-2 text-2xl font-bold text-success">{rupiah(kpis.total_paid)}</p>
          <p className="mt-1 text-xs text-slate-500">Tertaut ke transaksi jurnal</p>
        </div>

        <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Kas Aktual (Buku)</p>
          <p className="mt-2 text-2xl font-bold text-navy">{rupiah(kpis.actual_cash_balance)}</p>
          <p className="mt-1 text-xs text-slate-500">Per 31 Agustus 2026</p>
        </div>

        <div className="rounded-card-lg border border-line bg-white p-5 shadow-glass bg-rose-50/50 border-rose-200">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Proyeksi Saldo Setelah Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">{rupiah(kpis.projected_ending_balance)}</p>
          <p className="mt-1 text-xs text-rose-600/80">Saldo Kas - Total Outstanding</p>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="rounded-card-lg border border-line bg-white shadow-glass">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Status:</span>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'unpaid', label: 'Belum Bayar' },
              { id: 'partial', label: 'Sebagian' },
              { id: 'paid', label: 'Lunas' },
              { id: 'cancelled', label: 'Dibatalkan' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filterStatus === st.id
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-surface text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari deskripsi / kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-card border border-line pl-9 pr-3 py-1.5 text-xs text-navy focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-surface/60 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Deskripsi Kewajiban</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3 text-right">Nominal Awal</th>
                <th className="px-4 py-3 text-right">Terbayar</th>
                <th className="px-4 py-3 text-right">Sisa Tagihan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data kewajiban sesuai filter
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{it.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy">{it.description}</p>
                      <p className="text-[10px] text-slate-400">{it.category}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{it.dueDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                      {rupiah(it.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-success">
                      {it.paidAmount > 0 ? rupiah(it.paidAmount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      {it.remainingAmount > 0 ? rupiah(it.remainingAmount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          it.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : it.status === 'partial'
                            ? 'bg-primary-light text-primary-dark'
                            : it.status === 'cancelled'
                            ? 'bg-slate-200 text-slate-600 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {it.status === 'paid' ? (
                          <>
                            <Check className="h-3 w-3" /> Lunas
                          </>
                        ) : it.status === 'partial' ? (
                          <>
                            <ArrowUpRight className="h-3 w-3" /> Sebagian
                          </>
                        ) : it.status === 'cancelled' ? (
                          <>
                            <XCircle className="h-3 w-3" /> Batal
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" /> Belum Bayar
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {it.status !== 'paid' && it.status !== 'cancelled' && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayItem(it);
                              setPayAmount(it.remainingAmount.toString());
                            }}
                            className="rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition"
                          >
                            Bayar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleCancel(it)}
                            title="Batalkan kewajiban"
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Kewajiban */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-navy">Catat Kewajiban / Outstanding Baru</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-navy">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Deskripsi Tagihan / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TAGIHAN LISTRIK BANDARA T3"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full rounded-card border border-line p-2.5 text-navy focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="Contoh: 150000000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="mt-1 w-full rounded-card border border-line p-2.5 font-mono text-navy focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="mt-1 w-full rounded-card border border-line p-2.5 text-navy focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Kategori Beban</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full rounded-card border border-line p-2.5 text-navy focus:border-primary focus:outline-none"
                  >
                    <option value="Operasional Wrapping">Operasional Wrapping</option>
                    <option value="Biaya Sewa & Gudang">Biaya Sewa & Gudang</option>
                    <option value="Gaji & Tunjangan">Gaji & Tunjangan</option>
                    <option value="Back Office">Back Office</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-card border border-line px-4 py-2 font-medium text-slate-600 hover:bg-surface"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mutations.create.isPending}
                  className="rounded-card bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {mutations.create.isPending ? 'Menyimpan...' : 'Simpan Kewajiban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Realisasi Pembayaran */}
      {selectedPayItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-navy">Realisasi Pembayaran Kewajiban</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedPayItem.code}</p>
              </div>
              <button type="button" onClick={() => setSelectedPayItem(null)} className="text-slate-400 hover:text-navy">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-card bg-surface p-3 text-xs space-y-1">
              <p className="text-slate-500">Kewajiban: <span className="font-semibold text-navy">{selectedPayItem.description}</span></p>
              <p className="text-slate-500">Sisa Tagihan: <span className="font-bold text-rose-600 font-mono">{rupiah(selectedPayItem.remainingAmount)}</span></p>
            </div>

            <form onSubmit={handlePay} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedPayItem.remainingAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded-card border border-line p-2.5 font-mono text-navy focus:border-primary focus:outline-none font-bold"
                />
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedPayItem.remainingAmount.toString())}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Bayar Lunas ({rupiah(selectedPayItem.remainingAmount)})
                  </button>
                  {selectedPayItem.remainingAmount > 10000000 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount((selectedPayItem.remainingAmount / 2).toString())}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      Bayar 50%
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Sumber Rekening Bank Operasional</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="mt-1 w-full rounded-card border border-line p-2.5 text-navy focus:border-primary focus:outline-none font-mono"
                >
                  <option value="155-00-1485895-8 (MANDIRI PIONER)">155-00-1485895-8 (MANDIRI PIONER T1C)</option>
                  <option value="551-0480491 (BCA PIONER)">551-0480491 (BCA PIONER T1C)</option>
                  <option value="155-00-1511537-4 (MANDIRI ROBUSTPACK)">155-00-1511537-4 (MANDIRI ROBUSTPACK T3B)</option>
                  <option value="155-00-1268016-4 (MANDIRI ROBUSTPACK T2F)">155-00-1268016-4 (MANDIRI ROBUSTPACK T2F)</option>
                  <option value="155-00-1302784-5 (MANDIRI FIRST SECURE)">155-00-1302784-5 (MANDIRI FIRST SECURE T2E)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Tanggal Bayar</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="mt-1 w-full rounded-card border border-line p-2.5 text-navy focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setSelectedPayItem(null)}
                  className="rounded-card border border-line px-4 py-2 font-medium text-slate-600 hover:bg-surface"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mutations.pay.isPending}
                  className="rounded-card bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 shadow"
                >
                  {mutations.pay.isPending ? 'Memproses...' : 'Konfirmasi Realisasi Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
