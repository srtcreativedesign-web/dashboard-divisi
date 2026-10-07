import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { depositsApi } from '../api/deposits';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { channelLabels, formatDate, formatRupiah } from '../ui/format';

export default function AccountingDepositReconciliationPage() {
  const { user } = useAuth();
  const allowed = Boolean(user && hasCapability(user.role, 'view:acc_deposits', user.divisionCode));
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).slice(0, 7));
  const [page, setPage] = useState(1);
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const report = useQuery({ queryKey: ['acc-deposits', 'reconciliation', month, page], queryFn: () => depositsApi.reconciliation(month, page), enabled: allowed && validMonth });
  const data = report.data?.data;
  if (!allowed) return <p role="alert">Akses pencocokan setoran tidak tersedia untuk akun ini.</p>;

  return <div className="space-y-6 pb-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">Penelusuran sumber</p><h1 className="mt-2 text-2xl font-semibold text-navy">Pencocokan omzet & setoran</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">Bandingkan pembayaran outlet, setoran yang dicatat, dan penerimaan Finance per kanal. Sisa pencatatan bukan laba atau rugi.</p></header>
    <section className="rounded-card-lg border border-line bg-panel p-5">
      <div className="flex flex-wrap items-end gap-4"><label className="text-sm font-medium text-navy">Bulan tanggal bisnis omzet<input type="month" required value={month} onChange={event => { setMonth(event.target.value); setPage(1); }} className="mt-2 block min-h-10 rounded-input border border-line px-3 py-2" /></label><button disabled={!validMonth || report.isFetching} onClick={() => void report.refetch()} className="min-h-10 rounded-input border border-line px-4 text-sm font-semibold disabled:opacity-50">Muat ulang</button></div>
      <p className="mt-4 text-sm leading-relaxed text-subtle">Bulan mengikuti omzet, bukan tanggal setoran. Penerimaan tercatat dari semua tanggal ikut dihitung, termasuk setelah bulan omzet. Ini belum merupakan rekonsiliasi rekening bank.</p>
      <nav aria-label="Tindak lanjut pencocokan" className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-primary-700 dark:text-primary-300"><Link to="/accounting/omzet" className="underline">Buka daftar omzet</Link><Link to="/accounting/setoran" className="underline">Buka rekap setoran</Link></nav>
    </section>
    {!validMonth ? <p role="alert">Pilih bulan omzet yang valid.</p> : report.isLoading ? <LoadingState label="Memuat pencocokan setoran..." /> : report.error ? <ErrorState description={report.error.message} onRetry={() => void report.refetch()} /> : data && <>
      <p className="text-sm text-subtle">{data.total} sumber tervalidasi · maksimal 50 sumber per halaman · dimuat {new Date(data.as_of).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB. Angka di bawah berlaku per sumber; tidak ada total seluruh bulan pada halaman ini.</p>
      {data.items.length === 0 ? <EmptyState title="Belum ada sumber omzet pada halaman ini" description="Laporan hanya memuat omzet tervalidasi. Periksa bulan atau selesaikan pemeriksaan rekap omzet." /> : data.items.map(source => <section key={source.id} aria-label={`Pencocokan ${source.source_reference}`} className="overflow-hidden rounded-card-lg border border-line bg-panel">
        <div className="border-b border-line p-5"><h2 className="font-semibold text-navy">{source.outlet_name}</h2><p className="mt-1 text-sm text-subtle">{formatDate(source.business_date)} · shift {source.shift} · referensi <span className="break-all font-medium text-navy">{source.source_reference}</span></p><Link to={`/accounting/setoran?omzet_id=${encodeURIComponent(source.id)}`} className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-primary-700 dark:text-primary-300 underline">Buka setoran sumber ini</Link></div>
        <div className="overflow-x-auto" role="region" tabIndex={0} aria-label={`Kanal ${source.source_reference}`}><table className="w-full min-w-[850px] text-sm"><caption className="sr-only">Pembayaran, alokasi setoran dan penerimaan per kanal untuk {source.source_reference}</caption><thead className="bg-surface text-xs text-muted"><tr><th scope="col" className="p-4 text-left">Kanal</th>{['Pembayaran outlet', 'Setoran tercatat', 'Penerimaan tercatat', 'Belum dialokasikan', 'Setoran belum diterima'].map(label => <th key={label} scope="col" className="p-4 text-right">{label}</th>)}</tr></thead><tbody>{source.channels.map(channel => <tr key={channel.channel} className="border-t border-line"><th scope="row" className="p-4 text-left font-medium">{channelLabels[channel.channel] ?? channel.channel}</th>{[channel.reported_amount, channel.allocated_amount, channel.received_amount, channel.unallocated_amount, channel.remaining_amount].map((value, index) => <td key={index} className={`whitespace-nowrap p-4 text-right tabular-nums ${index > 2 ? 'font-semibold text-navy' : 'text-muted'}`}>{formatRupiah(value)}</td>)}</tr>)}</tbody></table></div>
      </section>)}
      <nav aria-label="Halaman pencocokan setoran" className="flex flex-wrap items-center gap-4 text-sm"><button disabled={page === 1 || report.isFetching} onClick={() => setPage(page - 1)} className="min-h-10 rounded-input border border-line px-4 disabled:opacity-50">Sebelumnya</button><span>Halaman {page} dari {Math.max(1, Math.ceil(data.total / 50))}</span><button disabled={page * 50 >= data.total || report.isFetching} onClick={() => setPage(page + 1)} className="min-h-10 rounded-input border border-line px-4 disabled:opacity-50">Berikutnya</button></nav>
    </>}
  </div>;
}
