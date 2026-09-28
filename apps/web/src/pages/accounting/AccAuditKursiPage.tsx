import { useState } from 'react';
import { ShieldAlert, Plus, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TableWrap, TableHead } from '../../components/ui/Table';
import { AccountingQueryState } from '../../components/accounting/AccountingStates';
import { useToast } from '../../components/ui/Toast';
import { useAccAdminUtilisasi, useSaveUtilisasi } from '../../hooks/useAccAdmin';
import type { UtilisasiPayload } from '../../api/accAdmin';

export default function AccAuditKursiPage() {
  const { toast } = useToast();
  const utilisasi = useAccAdminUtilisasi();
  const mutation = useSaveUtilisasi();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UtilisasiPayload>({
    tanggal: '', no_kursi: 1, jam_mulai: '10:00', jam_selesai: '11:00',
    durasi_menit: 60, terapis_nama: '', utilisasi_cctv: true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => {
        toast('Utilisasi kursi berhasil dicatat', 'success');
        setForm({ tanggal: '', no_kursi: 1, jam_mulai: '10:00', jam_selesai: '11:00', durasi_menit: 60, terapis_nama: '', utilisasi_cctv: true });
        setShowForm(false);
      },
      onError: (err) => toast(err instanceof Error ? err.message : 'Gagal menyimpan utilisasi', 'error'),
    });
  };

  const data = utilisasi.data ?? [];
  const totalSesi = data.length;
  const anomaliCount = data.filter(r => !r.utilisasi_cctv).length;
  const tanpaTerapis = data.filter(r => r.utilisasi_cctv && !r.terapis_nama).length;

  return (
    <section className="space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-rose-500/10 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold tracking-wider text-rose-600 uppercase">AUDIT KURSI & CCTV</p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy">Audit Kursi & Rekaman CCTV</h1>
          <p className="mt-1 text-sm text-slate-500">Validasi utilisasi kursi terapis terhadap rekaman CCTV untuk deteksi anomali.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void utilisasi.refetch()}>Muat Ulang</Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Catat Utilisasi
          </Button>
        </div>
      </header>

      {/* KPI ringkasan */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-medium text-slate-500">Total Sesi</p>
          <p className="text-2xl font-bold text-navy mt-1">{totalSesi}</p>
        </Card>
        <Card className={anomaliCount > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <p className="text-xs font-medium text-slate-500">Anomali CCTV</p>
          <p className={`text-2xl font-bold mt-1 ${anomaliCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{anomaliCount}</p>
        </Card>
        <Card className={tanpaTerapis > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          <p className="text-xs font-medium text-slate-500">CCTV Tanpa Terapis</p>
          <p className={`text-2xl font-bold mt-1 ${tanpaTerapis > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{tanpaTerapis}</p>
        </Card>
      </div>

      {/* Peringatan fraud */}
      {tanpaTerapis > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Peringatan Kritis — Potensi Fraud</p>
              <p className="text-sm text-red-700 mt-1">
                Terdapat {tanpaTerapis} pemakaian kursi terdeteksi CCTV tanpa data transaksi POS (nama terapis kosong). Segera investigasi.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader title="Input Utilisasi Kursi & CCTV" />
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Tanggal</span>
              <Input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Nomor Kursi (1–10)</span>
              <Input type="number" min={1} max={10} value={form.no_kursi} onChange={e => setForm({ ...form, no_kursi: Number(e.target.value) })} required />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Jam Mulai</span>
              <Input type="time" value={form.jam_mulai ?? ''} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Durasi (Menit)</span>
              <Input type="number" min={0} value={form.durasi_menit} onChange={e => setForm({ ...form, durasi_menit: Number(e.target.value) })} required />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-slate-600">Nama Terapis</span>
              <Input type="text" value={form.terapis_nama ?? ''} onChange={e => setForm({ ...form, terapis_nama: e.target.value })} placeholder="Nama terapis dari POS" />
            </label>
            <div className="flex items-end gap-3 sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.utilisasi_cctv}
                  onChange={e => setForm({ ...form, utilisasi_cctv: e.target.checked })}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-slate-700">Tervalidasi CCTV</span>
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
              <Button type="submit" disabled={mutation.isPending} className="flex-1">
                {mutation.isPending ? 'Menyimpan...' : 'Catat Utilisasi'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabel */}
      <AccountingQueryState loading={utilisasi.isLoading} error={utilisasi.error} empty={!data.length} retry={() => void utilisasi.refetch()} emptyTitle="Belum ada data utilisasi" emptyDescription="Data akan muncul setelah Anda mencatat pemakaian kursi.">
        <Card>
          <CardHeader title="Log Audit Kursi & CCTV" subtitle={`${data.length} entri`} />
          <TableWrap minWidth="640px">
            <TableHead>
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Kursi</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Terapis</th>
                <th className="p-3 text-center">CCTV</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {data.map(r => {
                const isFraud = r.utilisasi_cctv && !r.terapis_nama;
                const isAnomali = !r.utilisasi_cctv;
                return (
                  <tr key={r.id} className={`transition-colors ${isFraud ? 'bg-red-50/50' : isAnomali ? 'bg-amber-50/50' : 'hover:bg-surface/50'}`}>
                    <td className="p-3 text-sm">{r.tanggal}</td>
                    <td className="p-3 text-sm font-bold">#{r.no_kursi}</td>
                    <td className="p-3 text-sm">{r.jam_mulai ?? '—'} <span className="text-slate-400">({r.durasi_menit}m)</span></td>
                    <td className="p-3 text-sm">{r.terapis_nama || <span className="text-red-500 font-medium">Tidak Tercatat</span>}</td>
                    <td className="p-3 text-center">
                      {r.utilisasi_cctv
                        ? <Eye className="h-4 w-4 text-emerald-500 mx-auto" />
                        : <EyeOff className="h-4 w-4 text-slate-400 mx-auto" />}
                    </td>
                    <td className="p-3 text-center">
                      {isFraud ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Fraud?</span>
                      ) : isAnomali ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Anomali</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Valid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Card>
      </AccountingQueryState>
    </section>
  );
}
