import { useState } from 'react';
import { Coins, Plus, Calculator } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TableWrap, TableHead } from '../../components/ui/Table';
import { AccountingQueryState } from '../../components/accounting/AccountingStates';
import { useToast } from '../../components/ui/Toast';
import { useAccAdminKomisi, useHitungKomisi } from '../../hooks/useAccAdmin';
import type { KomisiPayload } from '../../api/accAdmin';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const RATE = { 30: 2_500, 60: 5_000, 90: 7_500 } as const;

export default function AccKomisiPage() {
  const { toast } = useToast();
  const komisi = useAccAdminKomisi();
  const mutation = useHitungKomisi();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<KomisiPayload>({
    periode_awal: '', periode_akhir: '', karyawan_nama: '',
    sesi_30m: 0, sesi_60m: 0, sesi_90m: 0,
  });

  const estimasi = (form.sesi_30m * RATE[30]) + (form.sesi_60m * RATE[60]) + (form.sesi_90m * RATE[90]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => {
        toast('Komisi berhasil dihitung & disimpan', 'success');
        setForm({ periode_awal: '', periode_akhir: '', karyawan_nama: '', sesi_30m: 0, sesi_60m: 0, sesi_90m: 0 });
        setShowForm(false);
      },
      onError: (err) => toast(err instanceof Error ? err.message : 'Gagal menghitung komisi', 'error'),
    });
  };

  const data = komisi.data ?? [];
  const totalBonus = data.reduce((s, r) => s + Number(r.total_bonus), 0);
  const totalSesi = data.reduce((s, r) => s + r.sesi_30m + r.sesi_60m + r.sesi_90m, 0);

  return (
    <section className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-500/10 text-violet-600">
              <Coins className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-wider text-violet-600 uppercase">KOMISI & BONUS</p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">Komisi & Bonus Terapis</h1>
          <p className="mt-1 text-sm text-slate-500">Hitung dan rekap insentif terapis berdasarkan jumlah sesi layanan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void komisi.refetch()}>Muat Ulang</Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Hitung Komisi
          </Button>
        </div>
      </header>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-slate-500">Total Entri</p>
          <p className="text-2xl font-bold text-navy mt-1">{data.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Total Sesi</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalSesi}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500">Total Bonus Dibayar</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(totalBonus)}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-500">Tarif Sesi</p>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-slate-600">30m: {fmt(RATE[30])} · 60m: {fmt(RATE[60])} · 90m: {fmt(RATE[90])}</p>
          </div>
        </Card>
      </div>

      {/* Form Kalkulator */}
      {showForm && (
        <Card>
          <CardHeader title="Kalkulator Komisi & Bonus Terapis" subtitle={`Estimasi: ${fmt(estimasi)}`}
            action={<div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><Calculator className="h-4 w-4" />{fmt(estimasi)}</div>}
          />
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Periode Awal</span>
              <Input type="date" value={form.periode_awal} onChange={e => setForm({ ...form, periode_awal: e.target.value })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Periode Akhir</span>
              <Input type="date" value={form.periode_akhir} onChange={e => setForm({ ...form, periode_akhir: e.target.value })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Nama Karyawan / Terapis</span>
              <Input type="text" value={form.karyawan_nama} onChange={e => setForm({ ...form, karyawan_nama: e.target.value })} placeholder="Nama terapis" required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Sesi 30 Menit</span>
              <Input type="number" min={0} value={form.sesi_30m} onChange={e => setForm({ ...form, sesi_30m: Number(e.target.value) })} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Sesi 60 Menit</span>
              <Input type="number" min={0} value={form.sesi_60m} onChange={e => setForm({ ...form, sesi_60m: Number(e.target.value) })} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Sesi 90 Menit</span>
              <Input type="number" min={0} value={form.sesi_90m} onChange={e => setForm({ ...form, sesi_90m: Number(e.target.value) })} />
            </label>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? 'Menghitung...' : 'Hitung & Simpan Bonus'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabel */}
      <AccountingQueryState loading={komisi.isLoading} error={komisi.error} empty={!data.length} retry={() => void komisi.refetch()} emptyTitle="Belum ada data komisi" emptyDescription="Data akan muncul setelah Anda menghitung komisi terapis.">
        <Card>
          <CardHeader title="Rekap Komisi Bulanan Terapis" subtitle={`${data.length} entri`} />
          <TableWrap minWidth="680px">
            <TableHead>
              <tr>
                <th className="p-3">Periode</th>
                <th className="p-3">Nama Karyawan</th>
                <th className="p-3 text-center">30m</th>
                <th className="p-3 text-center">60m</th>
                <th className="p-3 text-center">90m</th>
                <th className="p-3 text-right">Total Insentif</th>
              </tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {data.map(r => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 text-sm text-slate-600">{r.periode_awal} — {r.periode_akhir}</td>
                  <td className="p-3 text-sm font-medium">{r.karyawan_nama}</td>
                  <td className="p-3 text-sm text-center">{r.sesi_30m}</td>
                  <td className="p-3 text-sm text-center">{r.sesi_60m}</td>
                  <td className="p-3 text-sm text-center">{r.sesi_90m}</td>
                  <td className="p-3 text-sm text-right font-bold text-emerald-600">{fmt(Number(r.total_bonus))}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </AccountingQueryState>
    </section>
  );
}
