import { useState } from 'react';
import { DollarSign, Banknote, WashingMachine, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { TableWrap, TableHead } from '../../components/ui/Table';
import { AccountingQueryState } from '../../components/accounting/AccountingStates';
import { useToast } from '../../components/ui/Toast';
import {
  useAccAdminStoran,
  useAccAdminCashless,
  useAccAdminLaundry,
  useSaveStoran,
  useSaveCashless,
  useSaveLaundry,
} from '../../hooks/useAccAdmin';
import type { StoranPayload, CashlessPayload, LaundryPayload } from '../../api/accAdmin';

const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function StoranForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const mutation = useSaveStoran();
  const [form, setForm] = useState<StoranPayload>({ tanggal: '', shift: 1, pendapatan_tunai: 0, no_kysoft_sales: '' });
  const [open, setOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => { toast('Storan berhasil disimpan', 'success'); setForm({ tanggal: '', shift: 1, pendapatan_tunai: 0, no_kysoft_sales: '' }); onSuccess(); },
      onError: (err) => toast(err instanceof Error ? err.message : 'Gagal menyimpan storan', 'error'),
    });
  };

  return (
    <Card>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <CardHeader title="Input Storan Kasir" subtitle="Catat pendapatan tunai harian per shift" />
        {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Tanggal</span>
            <Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Shift</span>
            <Select value={form.shift} onChange={e => setForm({ ...form, shift: Number(e.target.value) })}>
              <option value={1}>Shift 1</option>
              <option value={2}>Shift 2</option>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Pendapatan Tunai (Rp)</span>
            <Input type="number" min={0} value={form.pendapatan_tunai} onChange={e => setForm({ ...form, pendapatan_tunai: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">No Kysoft Sales</span>
            <Input type="text" value={form.no_kysoft_sales ?? ''} onChange={e => setForm({ ...form, no_kysoft_sales: e.target.value })} placeholder="KY-9921" />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              <Plus className="h-4 w-4" /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Storan'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function CashlessForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const mutation = useSaveCashless();
  const [form, setForm] = useState<CashlessPayload>({ tanggal: '', shift: 1, nominal_qris: 0, nominal_edc: 0, no_storan_finance: '' });
  const [open, setOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => { toast('Data cashless berhasil disimpan', 'success'); setForm({ tanggal: '', shift: 1, nominal_qris: 0, nominal_edc: 0, no_storan_finance: '' }); onSuccess(); },
      onError: (err) => toast(err instanceof Error ? err.message : 'Gagal menyimpan cashless', 'error'),
    });
  };

  return (
    <Card>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <CardHeader title="Input Cashless (QRIS / EDC)" subtitle="Catat pemasukan non-tunai harian" />
        {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Tanggal</span>
            <Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Shift</span>
            <Select value={form.shift} onChange={e => setForm({ ...form, shift: Number(e.target.value) })}>
              <option value={1}>Shift 1</option>
              <option value={2}>Shift 2</option>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Nominal QRIS (Rp)</span>
            <Input type="number" min={0} value={form.nominal_qris} onChange={e => setForm({ ...form, nominal_qris: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Nominal EDC (Rp)</span>
            <Input type="number" min={0} value={form.nominal_edc} onChange={e => setForm({ ...form, nominal_edc: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">No Storan Finance</span>
            <Input type="text" value={form.no_storan_finance ?? ''} onChange={e => setForm({ ...form, no_storan_finance: e.target.value })} placeholder="SF-0021" />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              <Plus className="h-4 w-4" /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Cashless'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

function LaundryForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const mutation = useSaveLaundry();
  const [form, setForm] = useState<LaundryPayload>({ tanggal: '', berat_kg: 0, harga_per_kg: 0 });
  const [open, setOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => { toast('Data laundry berhasil disimpan', 'success'); setForm({ tanggal: '', berat_kg: 0, harga_per_kg: 0 }); onSuccess(); },
      onError: (err) => toast(err instanceof Error ? err.message : 'Gagal menyimpan laundry', 'error'),
    });
  };

  return (
    <Card>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <CardHeader title="Input Pengeluaran Laundry" subtitle="Catat tagihan laundry harian" />
        {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Tanggal</span>
            <Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Berat (kg)</span>
            <Input type="number" min={0} step="0.1" value={form.berat_kg} onChange={e => setForm({ ...form, berat_kg: Number(e.target.value) })} required />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-slate-600">Harga/kg (Rp)</span>
            <Input type="number" min={0} value={form.harga_per_kg} onChange={e => setForm({ ...form, harga_per_kg: Number(e.target.value) })} required />
          </label>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              <Plus className="h-4 w-4" /> {mutation.isPending ? 'Menyimpan...' : 'Simpan Laundry'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function AccPemasukanPage() {
  const storan = useAccAdminStoran();
  const cashless = useAccAdminCashless();
  const laundry = useAccAdminLaundry();

  const reload = () => { void storan.refetch(); void cashless.refetch(); void laundry.refetch(); };

  // KPI ringkasan
  const totalTunai = (storan.data ?? []).reduce((s, r) => s + Number(r.pendapatan_tunai), 0);
  const totalQris = (cashless.data ?? []).reduce((s, r) => s + Number(r.nominal_qris), 0);
  const totalEdc = (cashless.data ?? []).reduce((s, r) => s + Number(r.nominal_edc), 0);
  const totalLaundry = (laundry.data ?? []).reduce((s, r) => s + Number(r.total_tagihan), 0);

  return (
    <section className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-wider text-emerald-600 uppercase">PEMASUKAN & STORAN</p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">Pemasukan & Storan Harian</h1>
          <p className="mt-1 text-sm text-slate-500">Catat dan pantau pendapatan tunai, cashless, serta pengeluaran laundry.</p>
        </div>
        <Button variant="secondary" onClick={reload}>Muat Ulang</Button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Tunai', value: fmt(totalTunai), color: 'text-emerald-600', icon: Banknote },
          { label: 'Total QRIS', value: fmt(totalQris), color: 'text-blue-600', icon: DollarSign },
          { label: 'Total EDC', value: fmt(totalEdc), color: 'text-violet-600', icon: DollarSign },
          { label: 'Pengeluaran Laundry', value: fmt(totalLaundry), color: 'text-red-500', icon: WashingMachine },
        ].map(kpi => (
          <Card key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color} truncate`}>{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Forms */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StoranForm onSuccess={reload} />
        <CashlessForm onSuccess={reload} />
        <LaundryForm onSuccess={reload} />
      </div>

      {/* Tabel Storan */}
      <AccountingQueryState loading={storan.isLoading} error={storan.error} empty={!storan.data?.length} retry={() => void storan.refetch()} emptyTitle="Belum ada data storan" emptyDescription="Data storan akan muncul setelah Anda mencatat pemasukan tunai harian.">
        <Card>
          <CardHeader title="Riwayat Storan Harian" subtitle={`${storan.data?.length ?? 0} entri`} />
          <TableWrap minWidth="520px">
            <TableHead>
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Shift</th>
                <th className="p-3 text-right">Pendapatan Tunai</th>
                <th className="p-3">Kysoft Ref</th>
              </tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {(storan.data ?? []).map(r => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 text-sm">{r.tanggal}</td>
                  <td className="p-3 text-sm">Shift {r.shift}</td>
                  <td className="p-3 text-sm text-right font-semibold text-emerald-600">{fmt(Number(r.pendapatan_tunai))}</td>
                  <td className="p-3 text-sm text-slate-500">{r.no_kysoft_sales || '—'}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </AccountingQueryState>

      {/* Tabel Cashless */}
      <AccountingQueryState loading={cashless.isLoading} error={cashless.error} empty={!cashless.data?.length} retry={() => void cashless.refetch()} emptyTitle="Belum ada data cashless" emptyDescription="Data akan muncul setelah Anda mencatat pemasukan QRIS/EDC.">
        <Card>
          <CardHeader title="Riwayat Cashless (QRIS / EDC)" subtitle={`${cashless.data?.length ?? 0} entri`} />
          <TableWrap minWidth="580px">
            <TableHead>
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Shift</th>
                <th className="p-3 text-right">QRIS</th>
                <th className="p-3 text-right">EDC</th>
                <th className="p-3">Ref Finance</th>
              </tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {(cashless.data ?? []).map(r => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 text-sm">{r.tanggal}</td>
                  <td className="p-3 text-sm">Shift {r.shift}</td>
                  <td className="p-3 text-sm text-right font-semibold text-blue-600">{fmt(Number(r.nominal_qris))}</td>
                  <td className="p-3 text-sm text-right font-semibold text-violet-600">{fmt(Number(r.nominal_edc))}</td>
                  <td className="p-3 text-sm text-slate-500">{r.no_storan_finance || '—'}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </AccountingQueryState>

      {/* Tabel Laundry */}
      <AccountingQueryState loading={laundry.isLoading} error={laundry.error} empty={!laundry.data?.length} retry={() => void laundry.refetch()} emptyTitle="Belum ada data laundry" emptyDescription="Data akan muncul setelah Anda mencatat pengeluaran laundry.">
        <Card>
          <CardHeader title="Log Pengeluaran Laundry" subtitle={`${laundry.data?.length ?? 0} entri`} />
          <TableWrap minWidth="480px">
            <TableHead>
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3 text-right">Berat (kg)</th>
                <th className="p-3 text-right">Harga/kg</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {(laundry.data ?? []).map(r => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-3 text-sm">{r.tanggal}</td>
                  <td className="p-3 text-sm text-right">{r.berat_kg}</td>
                  <td className="p-3 text-sm text-right">{fmt(Number(r.harga_per_kg))}</td>
                  <td className="p-3 text-sm text-right font-semibold text-red-500">{fmt(Number(r.total_tagihan))}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </AccountingQueryState>
    </section>
  );
}
