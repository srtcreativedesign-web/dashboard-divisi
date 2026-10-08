import { ArrowRight, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

export function AccountingStart({ month }: { month: string }) {
  const { user } = useAuth();
  const can = (capability: string) => Boolean(user && hasCapability(user.role, capability, user.divisionCode));
  const job = can('write:omzet')
    ? { title: 'Siapkan laporan dan pengajuan', description: 'Mulai dari draf atau dokumen yang dikembalikan. Lengkapi sumber dan bukti sebelum mengajukan.', path: 'pengajuan', action: 'Buka pengajuan saya', steps: ['Lengkapi draf', 'Periksa sumber & bukti', 'Ajukan ke Accounting'] }
    : can('validate:omzet')
    ? { title: 'Periksa laporan dari Admin', description: 'Bandingkan rincian dengan sumber dan bukti. Catat alasan jika dokumen perlu diperbaiki.', path: 'pemeriksaan', action: 'Buka antrean pemeriksaan', steps: ['Pilih dokumen', 'Periksa rincian & bukti', 'Validasi atau kembalikan'] }
    : can('approve:voucher')
    ? { title: 'Tinjau pengajuan yang sudah diperiksa', description: 'Baca hasil pemeriksaan dan bukti sebelum menyetujui atau mengembalikan pengajuan.', path: 'persetujuan', action: 'Buka antrean persetujuan', steps: ['Baca pemeriksaan', 'Tinjau kebutuhan & bukti', 'Berikan keputusan'] }
    : can('execute:payment')
    ? { title: 'Catat realisasi voucher disetujui', description: 'Periksa sisa pembayaran, lalu catat realisasi dan buktinya pada dokumen yang sama.', path: 'realisasi', action: 'Buka realisasi Finance', steps: ['Pilih voucher disetujui', 'Periksa sisa pembayaran', 'Catat realisasi & bukti'] }
    : null;
  if (!job) return null;
  return <section aria-label="Mulai pekerjaan Accounting" className="overflow-hidden rounded-xl border border-primary-200 bg-panel dark:border-primary-900">
    <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="max-w-2xl"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300"><ClipboardCheck aria-hidden="true" className="h-4 w-4" />Mulai pekerjaan Anda</p><h2 className="text-lg font-bold tracking-tight text-navy">{job.title}</h2><p className="mt-2 text-sm leading-relaxed text-subtle">{job.description}</p></div>
      <Link to={'/accounting/dokumen/' + job.path + '?month=' + month} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{job.action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <ol className="grid gap-3 border-t border-line bg-surface px-5 py-4 text-xs text-muted sm:grid-cols-3 sm:px-6">{job.steps.map((step,index) => <li key={step} className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-panel font-semibold tabular-nums">{index + 1}</span>{step}</li>)}</ol>
  </section>;
}