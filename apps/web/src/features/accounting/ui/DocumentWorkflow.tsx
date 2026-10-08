import { CheckCircle2, Circle, UserRound } from 'lucide-react';
const steps = ['Admin', 'Staff Accounting', 'Manager', 'Staff Finance'];
export function DocumentWorkflow({ status, kind, version, paymentStatus }: { status: string; kind: 'omzet' | 'voucher'; version: number; paymentStatus?: string }) {
  const current = kind === 'voucher' && paymentStatus === 'PAID' ? 4 : status === 'draft' || status === 'correction' ? 0 : status === 'submitted' ? 1 : status === 'pending_approval' ? 2 : 3;
  const labels = kind === 'voucher' ? ['Pengajuan', 'Pemeriksaan', 'Persetujuan', 'Realisasi'] : ['Pengajuan H+1', 'Pemeriksaan', 'Keputusan selisih', 'Setoran & penerimaan'];
  const owner = current === 4 ? 'Realisasi selesai' : status === 'validated' ? 'Admin / Finance untuk setoran' : steps[current];
  return <section aria-label="Tahapan dokumen" className="rounded-xl border border-line bg-surface p-4">
    <div className="flex flex-wrap justify-between gap-2 text-xs"><p className="flex items-center gap-2 font-semibold"><UserRound aria-hidden="true" className="h-4 w-4" />Penanggung jawab tahap: {owner}</p><span className="text-subtle">Versi {version}</span></div>
    <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{steps.map((role, index) => { const completed = index < current && !(kind === 'omzet' && index === 2); const Icon = completed ? CheckCircle2 : Circle; return <li key={role} className={'flex items-start gap-2 text-xs ' + (index === current ? 'font-semibold text-primary-700 dark:text-primary-300' : 'text-subtle')}><Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><div><span className="block">{labels[index]}</span><span className="mt-1 block text-[10px] font-normal">{role}</span></div></li>; })}</ol>
    {kind === 'omzet' && <p className="mt-3 text-[11px] text-subtle">Rekap tanpa selisih dapat langsung tervalidasi setelah pemeriksaan Accounting.</p>}
    {status === 'correction' && <p className="mt-3 text-xs font-medium text-danger dark:text-red-300">Dikembalikan kepada Admin untuk koreksi; lihat alasan pemeriksaan di bawah.</p>}
  </section>;
}
