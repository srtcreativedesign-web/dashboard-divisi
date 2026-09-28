import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { TableWrap, TableHead } from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import { adminApi, type AttendanceRealization, type LeaveRecord } from '../../../api/admin';
import { AdminField, StatusBadge, monthStart, today, toneForAttendance, toneForLeave } from './AdminBits';

const LEAVE_TYPES = [
  { value: 'TAHUNAN', label: 'Cuti Tahunan' },
  { value: 'SAKIT', label: 'Sakit (Surat Dokter)' },
  { value: 'IZIN', label: 'Izin Tertulis' },
];

export default function AdminHrmTab({ divCode }: { divCode: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leaveList, setLeaveList] = useState<LeaveRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRealization[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRecord>>({ start_date: today(), end_date: today(), leave_type: 'TAHUNAN', days_taken: 1 });
  const [attendanceForm, setAttendanceForm] = useState<Partial<AttendanceRealization>>({
    period_start: monthStart(), period_end: today(),
    days_scheduled: 26, days_present: 24, days_absent: 0, days_leave: 0, days_sick: 0, minutes_late: 0,
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [leaves, attendance] = await Promise.all([
        adminApi.getLeaves({ division_code: divCode }),
        adminApi.getAttendanceRealizations({ division_code: divCode }),
      ]);
      setLeaveList(leaves.data ?? []);
      setAttendanceList(attendance.data ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal memuat data HRM', 'error');
    } finally {
      setLoading(false);
    }
  }, [divCode, toast]);

  useEffect(() => { void reload(); }, [reload]);

  const err = (e: unknown, fallback: string) => toast(e instanceof Error ? e.message : fallback, 'error');

  const saveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('leave');
    try {
      const res = await adminApi.createLeave({
        division_code: divCode,
        employee_id: Number(leaveForm.employee_id) || 1,
        leave_type: leaveForm.leave_type || 'TAHUNAN',
        start_date: leaveForm.start_date!,
        end_date: leaveForm.end_date!,
        days_taken: Number(leaveForm.days_taken) || 1,
        notes: leaveForm.notes,
      });
      setLeaveList((p) => [res.data, ...p]);
      setLeaveForm({ start_date: today(), end_date: today(), leave_type: 'TAHUNAN', days_taken: 1 });
      toast('Rekap cuti tercatat', 'success');
    } catch (e) { err(e, 'Gagal menyimpan cuti'); } finally { setSaving(null); }
  };

  const saveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('attendance');
    try {
      const res = await adminApi.createAttendanceRealization({
        division_code: divCode,
        employee_id: Number(attendanceForm.employee_id) || 1,
        period_start: attendanceForm.period_start!,
        period_end: attendanceForm.period_end!,
        days_scheduled: Number(attendanceForm.days_scheduled) || 0,
        days_present: Number(attendanceForm.days_present) || 0,
        days_absent: Number(attendanceForm.days_absent) || 0,
        days_leave: Number(attendanceForm.days_leave) || 0,
        days_sick: Number(attendanceForm.days_sick) || 0,
        minutes_late: Number(attendanceForm.minutes_late) || 0,
      });
      setAttendanceList((p) => [res.data, ...p]);
      toast('Realisasi absensi tersimpan', 'success');
    } catch (e) { err(e, 'Gagal menyimpan absensi'); } finally { setSaving(null); }
  };

  const setLeaveStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await adminApi.updateLeaveStatus(id, status);
      setLeaveList((p) => p.map((r) => (r.id === id ? res.data : r)));
      toast(`Status cuti diubah ke ${status}`, 'success');
    } catch (e) { err(e, 'Gagal mengubah status cuti'); }
  };

  const setAttendanceStatus = async (id: number, status: 'SUBMITTED' | 'LOCKED') => {
    try {
      const res = await adminApi.updateAttendanceStatus(id, status);
      setAttendanceList((p) => p.map((r) => (r.id === id ? res.data : r)));
      toast(`Status absensi diubah ke ${status}`, 'success');
    } catch (e) { err(e, 'Gagal mengubah status absensi'); }
  };

  return (
    <div className="space-y-6">
      {/* Cuti */}
      <Card>
        <CardHeader title="Rekap Cuti Karyawan & Terapis" subtitle="Catat permohonan cuti tahunan, sakit, dan izin staf outlet." />
        <form onSubmit={saveLeave} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="ID Karyawan"><Input type="number" min={1} value={leaveForm.employee_id ?? ''} onChange={(e) => setLeaveForm((p) => ({ ...p, employee_id: Number(e.target.value) }))} placeholder="1" required /></AdminField>
          <AdminField label="Jenis Cuti">
            <Select value={leaveForm.leave_type ?? 'TAHUNAN'} onChange={(e) => setLeaveForm((p) => ({ ...p, leave_type: e.target.value }))}>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </AdminField>
          <AdminField label="Mulai Cuti"><Input type="date" value={leaveForm.start_date ?? ''} onChange={(e) => setLeaveForm((p) => ({ ...p, start_date: e.target.value }))} required /></AdminField>
          <AdminField label="Selesai Cuti"><Input type="date" value={leaveForm.end_date ?? ''} onChange={(e) => setLeaveForm((p) => ({ ...p, end_date: e.target.value }))} required /></AdminField>
          <AdminField label="Jumlah Hari"><Input type="number" min={1} value={leaveForm.days_taken ?? 1} onChange={(e) => setLeaveForm((p) => ({ ...p, days_taken: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Alasan / Catatan" span="sm:col-span-2">
            <Input value={leaveForm.notes ?? ''} onChange={(e) => setLeaveForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Keperluan keluarga" />
          </AdminField>
          <div className="flex items-end">
            <Button type="submit" disabled={saving === 'leave'} className="w-full">
              <Plus className="h-4 w-4" /> {saving === 'leave' ? 'Menyimpan...' : 'Simpan Cuti'}
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <TableWrap minWidth="840px">
            <TableHead>
              <tr>{['ID Karyawan', 'Jenis', 'Periode', 'Hari', 'Status', 'Catatan'].map((h) => (
                <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}<th className="p-3 text-right text-xs font-semibold uppercase tracking-wider">Aksi</th></tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {leaveList.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-slate-400">Belum ada data cuti</td></tr>
              ) : leaveList.map((row) => (
                <tr key={row.id} className="hover:bg-surface/50">
                  <td className="p-3 text-sm font-semibold">Emp #{row.employee_id}</td>
                  <td className="p-3"><StatusBadge tone="blue">{row.leave_type}</StatusBadge></td>
                  <td className="p-3 text-xs text-slate-600">{row.start_date} s/d {row.end_date}</td>
                  <td className="p-3 text-sm">{row.days_taken} hari</td>
                  <td className="p-3"><StatusBadge tone={toneForLeave(row.status)}>{row.status || 'PENDING'}</StatusBadge></td>
                  <td className="p-3 text-xs text-slate-500">{row.notes || '-'}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      {row.status !== 'APPROVED' && (
                        <Button size="sm" variant="secondary" onClick={() => void setLeaveStatus(row.id, 'APPROVED')}>Setujui</Button>
                      )}
                      {row.status !== 'REJECTED' && (
                        <Button size="sm" variant="danger" onClick={() => void setLeaveStatus(row.id, 'REJECTED')}>Tolak</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>

      {/* Absensi */}
      <Card>
        <CardHeader title="Laporan Realisasi Absensi" subtitle="Verifikasi kehadiran bulanan sebagai data pendukung perhitungan gaji." />
        <form onSubmit={saveAttendance} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminField label="ID Karyawan"><Input type="number" min={1} value={attendanceForm.employee_id ?? ''} onChange={(e) => setAttendanceForm((p) => ({ ...p, employee_id: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Awal Cut-Off"><Input type="date" value={attendanceForm.period_start ?? ''} onChange={(e) => setAttendanceForm((p) => ({ ...p, period_start: e.target.value }))} required /></AdminField>
          <AdminField label="Akhir Cut-Off"><Input type="date" value={attendanceForm.period_end ?? ''} onChange={(e) => setAttendanceForm((p) => ({ ...p, period_end: e.target.value }))} required /></AdminField>
          <AdminField label="Jadwal Kerja (Hari)"><Input type="number" min={0} value={attendanceForm.days_scheduled ?? 0} onChange={(e) => setAttendanceForm((p) => ({ ...p, days_scheduled: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Hadir (Hari)"><Input type="number" min={0} value={attendanceForm.days_present ?? 0} onChange={(e) => setAttendanceForm((p) => ({ ...p, days_present: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Mangkir (Hari)"><Input type="number" min={0} value={attendanceForm.days_absent ?? 0} onChange={(e) => setAttendanceForm((p) => ({ ...p, days_absent: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Cuti (Hari)"><Input type="number" min={0} value={attendanceForm.days_leave ?? 0} onChange={(e) => setAttendanceForm((p) => ({ ...p, days_leave: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Sakit (Hari)"><Input type="number" min={0} value={attendanceForm.days_sick ?? 0} onChange={(e) => setAttendanceForm((p) => ({ ...p, days_sick: Number(e.target.value) }))} required /></AdminField>
          <AdminField label="Terlambat (Menit)"><Input type="number" min={0} value={attendanceForm.minutes_late ?? 0} onChange={(e) => setAttendanceForm((p) => ({ ...p, minutes_late: Number(e.target.value) }))} required /></AdminField>
          <div className="sm:col-span-2 flex items-end">
            <Button type="submit" disabled={saving === 'attendance'} className="w-full">
              <Plus className="h-4 w-4" /> {saving === 'attendance' ? 'Menyimpan...' : 'Simpan Realisasi Absensi'}
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <TableWrap minWidth="840px">
            <TableHead>
              <tr>{['ID Karyawan', 'Periode', 'Jadwal', 'Hadir', 'Mangkir', 'Cuti', 'Sakit', 'Status'].map((h) => (
                <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}<th className="p-3 text-right text-xs font-semibold uppercase tracking-wider">Aksi</th></tr>
            </TableHead>
            <tbody className="divide-y divide-line">
              {attendanceList.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-sm text-slate-400">Belum ada laporan realisasi absensi</td></tr>
              ) : attendanceList.map((row) => (
                <tr key={row.id} className="hover:bg-surface/50">
                  <td className="p-3 text-sm font-semibold">Emp #{row.employee_id}</td>
                  <td className="p-3 text-xs text-slate-600">{row.period_start} ~ {row.period_end}</td>
                  <td className="p-3 text-sm">{row.days_scheduled} hari</td>
                  <td className="p-3 text-sm font-medium text-emerald-600">{row.days_present}</td>
                  <td className="p-3 text-sm text-rose-600">{row.days_absent}</td>
                  <td className="p-3 text-sm">{row.days_leave}</td>
                  <td className="p-3 text-sm">{row.days_sick}</td>
                  <td className="p-3"><StatusBadge tone={toneForAttendance(row.status)}>{row.status || 'DRAFT'}</StatusBadge></td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      {row.status !== 'SUBMITTED' && row.status !== 'LOCKED' && (
                        <Button size="sm" variant="secondary" onClick={() => void setAttendanceStatus(row.id, 'SUBMITTED')}>Submit</Button>
                      )}
                      {row.status !== 'LOCKED' && (
                        <Button size="sm" variant="secondary" onClick={() => void setAttendanceStatus(row.id, 'LOCKED')}>Kunci</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      </Card>
    </div>
  );
}
