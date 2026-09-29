import { useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { TableWrap, TableHead } from '../../components/ui/Table';
import { AccountingQueryState } from '../../components/accounting/AccountingStates';
import { useToast } from '../../components/ui/Toast';
import { useAccAdminStok, useSaveStok } from '../../hooks/useAccAdmin';
import type { StokPayload } from '../../api/accAdmin';

const BARANG_OPTIONS = ['Massage Oil', 'Massage Cream', 'Tissu', 'Gelas Kopi', 'Teh Celup'] as const;

export default function AccStokPage() {
  const { toast } = useToast();
  const stok = useAccAdminStok();
  const mutation = useSaveStok();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StokPayload>({ tanggal: '', barang_nama: BARANG_OPTIONS[0], stok_awal: 0, barang_datang: 0, pemakaian: 0 });

  const stokAkhir = form.stok_awal + form.barang_datang - form.pemakaian;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => {
        toast('Stok berhasil dicatat', 'success');
        setForm({ tanggal: '', barang_nama: BARANG_OPTIONS[0], stok_awal: 0, barang_datang: 0, pemakaian: 0 });
        setShowForm(false);
      },
      onError: (err) => toast(err instanceof Error ? err.message : 'Gagal menyimpan stok', 'error'),
    });
  };

  // Cari barang dengan stok rendah
  const lowStockItems = (stok.data ?? []).filter(r => r.stok_akhir < 5);

  return (
    <section className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500/10 text-amber-600">
              <Package className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-wider text-amber-600 uppercase">PERSEDIAAN & STOK</p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">Persediaan & Stok Opname</h1>
          <p className="mt-1 text-sm text-slate-500">Pantau stok barang habis pakai dan catat pemakaian harian.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void stok.refetch()}>Muat Ulang</Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Catat Stok
          </Button>
        </div>
      </header>

      {/* Peringatan stok rendah */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Peringatan Stok Rendah</p>
              <p className="text-sm text-amber-700 mt-1">
                {lowStockItems.map(r => r.barang_nama).filter((v, i, a) => a.indexOf(v) === i).join(', ')} — stok di bawah 5 unit.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Form Input */}
      {showForm && (
        <Card>
          <CardHeader title="Catat Pemakaian Stok" subtitle={`Sisa akhir: ${stokAkhir} unit`} />
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Tanggal</span>
              <Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Nama Barang</span>
              <Select value={form.barang_nama} onChange={e => setForm({ ...form, barang_nama: e.target.value })}>
                {BARANG_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Stok Awal</span>
              <Input type="number" min={0} value={form.stok_awal} onChange={e => setForm({ ...form, stok_awal: Number(e.target.value) })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Barang Datang</span>
              <Input type="number" min={0} value={form.barang_datang} onChange={e => setForm({ ...form, barang_datang: Number(e.target.value) })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Pemakaian</span>
              <Input type="number" min={0} value={form.pemakaian} onChange={e => setForm({ ...form, pemakaian: Number(e.target.value) })} required />
            </label>
            <div className="sm:col-span-2 lg:col-span-5 flex gap-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? 'Menyimpan...' : 'Simpan Stok'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabel */}
      <AccountingQueryState loading={stok.isLoading} error={stok.error} empty={!stok.data?.length} retry={() => void stok.refetch()} emptyTitle="Belum ada data stok" emptyDescription="Data stok akan muncul setelah Anda mencatat pemakaian barang.">
        <Card>
          <CardHeader title="Log Persediaan & Barang Habis Pakai" subtitle={`${stok.data?.length ?? 0} entri`} />
          <TableWrap minWidth="600px">
            <TableHead>
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Barang</th>
                <th className="p-3 text-right">Awal</th>
                <th className="p-3 text-right">Masuk</th>
                <th className="p-3 text-right">Keluar</th>
                <th className="p-3 text-right">Akhir</th>
              </tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {(stok.data ?? []).map(r => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 text-sm">{r.tanggal}</td>
                  <td className="p-3 text-sm font-medium">{r.barang_nama}</td>
                  <td className="p-3 text-sm text-right">{r.stok_awal}</td>
                  <td className="p-3 text-sm text-right text-emerald-600">+{r.barang_datang}</td>
                  <td className="p-3 text-sm text-right text-red-500">-{r.pemakaian}</td>
                  <td className={`p-3 text-sm text-right font-bold ${r.stok_akhir < 5 ? 'text-red-600' : 'text-navy'}`}>{r.stok_akhir}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </AccountingQueryState>
    </section>
  );
}
