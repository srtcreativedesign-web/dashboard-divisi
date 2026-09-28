import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { TableWrap, TableHead } from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import { adminApi, type ChairUsageAudit, type TherapistRevenue } from '../../../api/admin';
import { AdminField, StatusBadge, rupiah, today } from './AdminBits';

export default function AdminPosTab({ divCode }: { divCode: string }) {
  const { toast } = useToast();
  const [chairList, setChairList] = useState<ChairUsageAudit[]>([]);
  const [therapistList, setTherapistList] = useState<TherapistRevenue[]>([]);
  const [chairForm, setChairForm] = useState<Partial<ChairUsageAudit>>({ date: today() });
  const [therapistForm, setTherapistForm] = useState<Partial<TherapistRevenue>>({ date: today(), shift: 1 });
  const [saving, setSaving] = useState<string | null>(null);

  // ponytail: backend belum punya endpoint GET untuk audit kursi & pendapatan terapis,
  // jadi tabel baru terisi setelah submit. Tambahkan endpoint read bila riwayat perlu tampil.
  const deviation = (Number(chairForm.counter_end) || 0) - (Number(chairForm.counter_start) || 0) - (Number(chairForm.pos_used) || 0);
  const hasDeviation = deviation !== 0;

  const err = (e: unknown, fallback: string) => toast(e instanceof Error ? e.message : fallback, 'error');

  const saveChair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDeviation && !chairForm.notes?.trim()) {
      toast('Catatan wajib diisi karena ada deviasi', 'error');
      return;
    }
    setSaving('chair');
    try {
      const res = await adminApi.createChairAudit({
        division_code: divCode,
        outlet_id: 1,
        date: chairForm.date!,
        chair_no: Number(chairForm.chair_no) || 0,
        counter_start: Number(chairForm.counter_start) || 0,
        counter_end: Number(chairForm.counter_end) || 0,
        cctv_used: Number(chairForm.cctv_used) || 0,
        pos_used: Number(chairForm.pos_used) || 0,
        notes: chairForm.notes,
      });
      setChairList((p) => [res.data, ...p]);
      setChairForm({ date: today() });
      toast('Audit kursi tersimpan', 'success');
    } catch (e) { err(e, 'Gagal menyimpan audit kursi'); } finally { setSaving(null); }
  };

  const saveTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('therapist');
    try {
      const res = await adminApi.createTherapistRevenue({
        division_code: divCode,
        outlet_id: Number(therapistForm.outlet_id) || 1,
        employee_id: Number(therapistForm.employee_id) || 0,
        date: therapistForm.date!,
        shift: Number(therapistForm.shift) || 1,
        treatments_count: Number(therapistForm.treatments_count) || 0,
        revenue_share: Number(therapistForm.revenue_share) || 0,
        tips: Number(therapistForm.tips) || 0,
      });
      setTherapistList((p) => [res.data, ...p]);
      setTherapistForm({ date: today(), shift: 1 });
      toast('Pendapatan terapis tersimpan', 'success');
    } catch (e) { err(e, 'Gagal menyimpan pendapatan terapis'); } finally { setSaving(null); }
  };

  return (
    <div className="space-y-6">
      {/* Audit Kursi */}
      <Card>
        <CardHeader
          title="Audit Kursi Pijat & CCTV (Anti-Leak)"
          subtitle="Cocokkan counter fisik kursi dengan rekaman CCTV dan transaksi POS."
          action={<StatusBadge tone={hasDeviation ? 'amber' : 'green'}>{hasDeviation ? `Deviasi ${deviation > 0 ? '+' : ''}${deviation}` : 'Cocok'}</StatusBadge>}
        />
        {hasDeviation && (
          <div role="alert" className="mt-3 flex items-center gap-2 rounded-card border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Counter selisih {deviation > 0 ? '+' : ''}{deviation} dari POS. Catatan wajib diisi.
          </div>
        )}
        <form onSubmit={saveChair} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="Tanggal"><Input type="date" value={chairForm.date ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, date: e.target.value }))} required /></AdminField>
          <AdminField label="No. Kursi"><Input type="number" min={0} value={chairForm.chair_no ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, chair_no: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Counter Awal"><Input type="number" min={0} value={chairForm.counter_start ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, counter_start: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Counter Akhir"><Input type="number" min={0} value={chairForm.counter_end ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, counter_end: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Jumlah CCTV"><Input type="number" min={0} value={chairForm.cctv_used ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, cctv_used: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Jumlah POS"><Input type="number" min={0} value={chairForm.pos_used ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, pos_used: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Catatan" span="sm:col-span-2 lg:col-span-4">
            <Input value={chairForm.notes ?? ''} onChange={(e) => setChairForm((p) => ({ ...p, notes: e.target.value }))} placeholder={hasDeviation ? 'Wajib diisi karena ada deviasi' : 'Opsional'} required={hasDeviation} />
          </AdminField>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" disabled={saving === 'chair'}>
              <Plus className="h-4 w-4" /> {saving === 'chair' ? 'Menyimpan...' : 'Simpan Audit Kursi'}
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <TableWrap minWidth="860px">
            <TableHead>
              <tr>{['Tanggal', 'Kursi', 'Counter', 'CCTV', 'POS', 'Deviasi', 'Status', 'Catatan'].map((h) => (
                <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}</tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {chairList.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-sm text-slate-400">Belum ada data audit kursi</td></tr>
              ) : chairList.map((row) => (
                <tr key={row.id} className={row.deviation !== 0 ? 'bg-amber-50/60' : 'hover:bg-surface/50'}>
                  <td className="p-3 text-sm">{row.date}</td>
                  <td className="p-3 text-sm font-semibold">Kursi #{row.chair_no}</td>
                  <td className="p-3 text-sm">{row.counter_end - row.counter_start}</td>
                  <td className="p-3 text-sm">{row.cctv_used}</td>
                  <td className="p-3 text-sm">{row.pos_used}</td>
                  <td className="p-3 text-sm font-medium text-amber-700">{row.deviation > 0 ? `+${row.deviation}` : row.deviation}</td>
                  <td className="p-3"><StatusBadge tone={row.deviation !== 0 ? 'amber' : 'green'}>{row.deviation !== 0 ? 'Deviasi' : 'OK'}</StatusBadge></td>
                  <td className="p-3 text-xs text-slate-500">{row.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>

      {/* Pendapatan Terapis */}
      <Card>
        <CardHeader title="Pendapatan Shift Terapis" subtitle="Produktivitas per shift sebagai dasar perhitungan komisi & bonus." />
        <form onSubmit={saveTherapist} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="Tanggal"><Input type="date" value={therapistForm.date ?? ''} onChange={(e) => setTherapistForm((p) => ({ ...p, date: e.target.value }))} required /></AdminField>
          <AdminField label="Shift">
            <Select value={therapistForm.shift ?? 1} onChange={(e) => setTherapistForm((p) => ({ ...p, shift: Number(e.target.value) }))}>
              <option value={1}>Shift 1</option><option value={2}>Shift 2</option>
            </Select>
          </AdminField>
          <AdminField label="Terapis (Employee ID)"><Input type="number" min={0} value={therapistForm.employee_id ?? ''} onChange={(e) => setTherapistForm((p) => ({ ...p, employee_id: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Outlet ID"><Input type="number" min={0} value={therapistForm.outlet_id ?? ''} onChange={(e) => setTherapistForm((p) => ({ ...p, outlet_id: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Jumlah Treatment"><Input type="number" min={0} value={therapistForm.treatments_count ?? ''} onChange={(e) => setTherapistForm((p) => ({ ...p, treatments_count: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Revenue Share (Rp)"><Input type="number" min={0} step="0.01" value={therapistForm.revenue_share ?? ''} onChange={(e) => setTherapistForm((p) => ({ ...p, revenue_share: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Tips (Rp)"><Input type="number" min={0} step="0.01" value={therapistForm.tips ?? ''} onChange={(e) => setTherapistForm((p) => ({ ...p, tips: Number(e.target.value) }))} required /></AdminField>
          <div className="flex items-end">
            <Button type="submit" disabled={saving === 'therapist'} className="w-full">
              <Plus className="h-4 w-4" /> {saving === 'therapist' ? 'Menyimpan...' : 'Simpan Pendapatan'}
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <TableWrap minWidth="720px">
            <TableHead>
              <tr>{['Tanggal', 'Shift', 'Terapis', 'Treatment', 'Revenue Share', 'Tips'].map((h) => (
                <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}</tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {therapistList.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-400">Belum ada data pendapatan terapis</td></tr>
              ) : therapistList.map((row) => (
                <tr key={row.id} className="hover:bg-surface/50">
                  <td className="p-3 text-sm">{row.date}</td>
                  <td className="p-3 text-sm">Shift {row.shift}</td>
                  <td className="p-3 text-sm font-medium">Emp #{row.employee_id}</td>
                  <td className="p-3 text-sm">{row.treatments_count} sesi</td>
                  <td className="p-3 text-sm font-semibold text-emerald-600">Rp {rupiah(row.revenue_share)}</td>
                  <td className="p-3 text-sm">Rp {rupiah(row.tips)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>
    </div>
  );
}
