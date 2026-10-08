import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ApiException } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { useCellularPreview } from '../hooks/useCellularPreview';
import { comparePreviews, metricLabels, previewProfiles, type PreviewProfile, type ReportPreview } from '../api/cellularPreview';

const inputClass = 'mt-1 w-full rounded-lg border border-line bg-panel p-2 text-navy';
const money = (value: number | null | undefined) => value == null ? 'Belum terbaca' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(value);

export default function CellularReportPreviewPage() {
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7));
  const [profile, setProfile] = useState<PreviewProfile>('daily');
  const [file, setFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<ReportPreview[]>([]);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState('');
  const [onlyProblems, setOnlyProblems] = useState(false);
  const mutation = useCellularPreview();
  const comparison = comparePreviews(previews);
  const issues = previews.flatMap(p => p.issues.map(issue => ({ ...issue, profile: p.profile })));
  const problematic = (date: string) => issues.some(i => i.date === date);
  const displayed = onlyProblems ? comparison.filter(r => r.mismatch || r.incomplete || problematic(r.date)) : comparison;
  const detail = comparison.find(r => r.date === selected);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!file) { setMessage('Pilih laporan terlebih dahulu.'); return; }
    if (previews.some(p => p.profile === profile)) { setMessage('Jenis laporan ini sudah dibaca. Hapus hasil sebelumnya untuk mengganti berkas.'); return; }
    const form = new FormData(); form.append('file', file); form.append('profile', profile); form.append('month', month);
    try {
      const { data } = await mutation.mutateAsync(form);
      if (data.month !== month || previews.some(p => p.outlet !== data.outlet)) { setMessage('Periode atau outlet sumber tidak cocok.'); return; }
      if (previews.some(p => p.sha256 === data.sha256)) { setMessage('Berkas identik sudah dibaca dalam sesi ini.'); return; }
      setPreviews(old => [...old, data]);
      setSelected(data.rows[0]?.date ?? '');
    } catch (error) {
      setMessage(error instanceof ApiException ? `${error.message} (Trace: ${error.traceId})` : 'Preview gagal. Coba ulang setelah memeriksa koneksi.');
    }
  }

  return <div className="space-y-6 text-navy">
    <header><Link className="text-sm font-semibold text-primary-700 dark:text-primary-300" to="/accounting/dokumen/register">← Kembali ke ruang kerja Accounting</Link><p className="mt-4 text-sm text-muted">Fasilitas pendukung pemeriksaan</p><h1 className="mt-1 text-2xl font-semibold">Periksa sumber laporan Excel</h1><p className="mt-2 max-w-3xl text-sm text-muted">Baca laporan DATA CELLULAR T3, bandingkan angka harian, lalu telusuri sel asal. Hasil belum menjadi transaksi atau persetujuan Accounting.</p></header>
    <form onSubmit={submit} className="rounded-xl border border-line bg-panel p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm">Periode laporan<input type="month" required min="2000-01" max="2099-12" className={inputClass} value={month} disabled={mutation.isPending} onChange={e => { setMonth(e.target.value); setPreviews([]); setSelected(''); setMessage(''); }} /></label>
        <label className="text-sm">Jenis laporan<select className={inputClass} value={profile} disabled={mutation.isPending} onChange={e => setProfile(e.target.value as PreviewProfile)}>{Object.entries(previewProfiles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm">Berkas XLS atau XLSX<input type="file" accept=".xls,.xlsx" className={inputClass} disabled={mutation.isPending} onChange={e => { setFile(e.target.files?.[0] ?? null); setMessage(''); }} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="submit" disabled={!file || !month || mutation.isPending}>{mutation.isPending ? 'Memindai dan membaca…' : 'Periksa laporan'}</Button><p className="text-xs text-muted">Maksimal 10 MB. Formula memakai cache; hasil hanya tersimpan pada sesi layar ini.</p></div>
      {message && <p role="alert" className="mt-3 text-sm text-danger dark:text-red-300">{message}</p>}
    </form>
    {!previews.length && <p className="rounded-lg border border-line p-5 text-sm text-muted">Unggah satu sumber untuk melihat nilai harian. Tambahkan profil lain pada periode yang sama untuk membandingkan omzet dan shift.</p>}
    {!!previews.length && <>
      <section aria-label="Sumber yang sudah dibaca" className="space-y-3"><h2 className="text-lg font-semibold">Sumber yang dibaca ({previews.length}/5)</h2>
        {previews.map(p => <div key={p.profile} className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3"><div><h3 className="font-medium">{previewProfiles[p.profile]} · {money(p.summary.gross)}</h3><p className="text-sm text-muted">{p.filename} · {p.summary.days} tanggal · {p.outlet}</p><details className="mt-1 text-xs text-muted"><summary className="cursor-pointer">Cakupan pembacaan</summary><p className="mt-1">{p.coverage.scope}</p><p>Sheet dibaca: {p.coverage.loaded_sheets.join(', ')}. Sheet diabaikan: {p.coverage.ignored_sheets.join(', ') || 'Tidak ada'}.</p><p className="break-all">SHA-256: {p.sha256}</p></details></div><Button variant="secondary" disabled={mutation.isPending} onClick={() => { setPreviews(old => old.filter(x => x.profile !== p.profile)); setMessage(''); }}>Hapus {previewProfiles[p.profile]}</Button></div>)}
      </section>
      <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Perbandingan harian</h2><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyProblems} onChange={e => setOnlyProblems(e.target.checked)} />Tanggal dengan masalah</label></div>
        <p className="text-sm text-muted">{previews.length < 2 ? 'Tambahkan sumber kedua untuk menghitung selisih.' : `${comparison.filter(r => r.mismatch).length} tanggal berbeda antar sumber.`} Kesamaan total tidak membuktikan kebenaran atau kelengkapan sumber.</p>
        <div className="overflow-x-auto rounded-lg border border-line"><table className="w-full text-sm"><thead className="bg-panel"><tr><th className="p-3 text-left">Tanggal</th>{previews.map(p => <th className="p-3 text-right" key={p.profile}>{previewProfiles[p.profile]}</th>)}<th className="p-3 text-left">Pemeriksaan</th></tr></thead><tbody>{displayed.map(r => <tr key={r.date} className="border-t border-line"><td className="p-3"><button type="button" onClick={() => setSelected(r.date)} aria-pressed={selected === r.date} className="text-primary dark:text-primary-300 underline underline-offset-4">{r.date}</button></td>{r.sources.map(s => <td key={s.preview.profile} className="whitespace-nowrap p-3 text-right tabular-nums">{money(s.row?.values.gross?.value)}</td>)}<td className="p-3">{r.delta !== null && r.delta >= 0.01 ? `Selisih bruto ${money(r.delta)}. ` : ''}{r.shift ? 'Shift berbeda. ' : ''}{r.incomplete ? 'Sumber belum lengkap. ' : ''}{problematic(r.date) ? 'Periksa isu sumber.' : (!r.mismatch && !r.incomplete ? (previews.length > 1 ? 'Total terbaca sama' : 'Satu sumber') : '')}</td></tr>)}</tbody></table></div>
        {!displayed.length && <p className="text-sm text-muted">Tidak ada tanggal yang cocok dengan filter masalah.</p>}
      </section>
      {!!issues.length && <section><h2 className="text-lg font-semibold">Catatan sumber ({issues.length})</h2><ul className="mt-3 space-y-2 text-sm">{issues.map((i, index) => <li key={index} className="border-l-2 border-line pl-3"><span className="font-medium">{previewProfiles[i.profile]}{i.date ? ` · ${i.date}` : ''}</span> — {i.message}{i.cell && <span className="text-muted"> ({i.sheet}!{i.cell})</span>}{i.difference != null && <span> {money(i.difference)}</span>}</li>)}</ul></section>}
      {detail && <details className="rounded-xl border border-line bg-panel p-5"><summary className="cursor-pointer text-sm font-semibold">Lihat sumber angka dan formula</summary><section className="mt-4" aria-label="Detail sumber tanggal"><h2 className="text-lg font-semibold">Asal angka · {detail.date}</h2><div className="mt-3 overflow-x-auto rounded-lg border border-line"><table className="w-full text-sm"><thead className="bg-panel"><tr>{['Sumber', 'Nilai', 'Rupiah', 'Sheet dan sel', 'Formula / literal'].map(label => <th key={label} className="p-3 text-left">{label}</th>)}</tr></thead><tbody>{detail.sources.flatMap(s => Object.entries(s.row?.values ?? {}).map(([metric, value]) => <tr key={`${s.preview.profile}-${metric}`} className="border-t border-line"><td className="p-3">{previewProfiles[s.preview.profile]}</td><td className="p-3">{metricLabels[metric] ?? metric}</td><td className="whitespace-nowrap p-3 tabular-nums">{money(value.value)}</td><td className="p-3">{value.sheet}!{value.cell}</td><td className="max-w-sm break-words p-3"><code className="text-xs">{value.formula ?? value.raw ?? 'Kosong'}</code>{value.cached && <p className="text-xs text-muted">Cache formula, belum dihitung ulang</p>}</td></tr>))}</tbody></table></div>{detail.sources.flatMap(source => (source.row?.references ?? []).map(ref => <p key={`${source.preview.profile}-${ref.cell}`} className="mt-2 text-sm text-muted">{ref.label}: {ref.raw || 'Belum dicatat'} · {ref.sheet}!{ref.cell}</p>))}</section></details>}
    </>}
  </div>;
}
