import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, CheckCircle2, FileCheck2, LockKeyhole, RefreshCw, UploadCloud } from 'lucide-react';
import type { AccImportPreviewResponse, AccImportRow } from '../../../api/accounting';
import { AccountingPageHeader } from '../../../components/accounting/AccountingPageHeader';
import { ImportCommitBar } from '../../../components/accounting/import/ImportCommitBar';
import { ImportStagingTable, type DisplayRow, type ImportRowStatus } from '../../../components/accounting/import/ImportStagingTable';
import { ImportSummaryCards } from '../../../components/accounting/import/ImportSummaryCards';
import { ImportUploadBox } from '../../../components/accounting/import/ImportUploadBox';
import { AccountingQueryState } from '../../../components/accounting/AccountingStates';
import { useAccountingPeriods, useImportMutations } from '../../../hooks/useAccounting';
import { useToast } from '../../../components/ui/Toast';

const MUTABLE_PERIODS = ['draft', 'reopened', 'needs_correction'];
const periodLabel = (value: string) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(`${value.slice(0, 7)}-01T00:00:00+07:00`));

function mapRows(rows: AccImportRow[]): DisplayRow[] {
  return rows.map(row => {
    let status: ImportRowStatus = 'valid';
    if (row.status === 'ERROR') status = 'error';
    else if (row.status === 'DUPLICATE') status = 'duplicate_warning';
    else if (row.status === 'WARNING') status = row.warnings?.some(note => note.toLowerCase().includes('normal')) ? 'normalized' : 'warning';
    return { rowNum: row.row_number, date: row.date, refNo: row.reference_no ?? '-', account: row.account_name ?? 'Rekening default', rawCategory: row.original_category ?? row.category_code, normalizedCategory: row.category_code, description: row.description, debit: Number(row.debit), credit: Number(row.credit), status, notes: row.errors?.join(', ') || row.warnings?.join(', ') || 'Terverifikasi valid' };
  });
}

export default function AccountingImportPage() {
  const { toast } = useToast();
  const periods = useAccountingPeriods();
  const mutations = useImportMutations();
  const editablePeriods = useMemo(() => (periods.data ?? []).filter(period => MUTABLE_PERIODS.includes(period.status)), [periods.data]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [stagedRows, setStagedRows] = useState<DisplayRow[]>([]);
  const [rawRows, setRawRows] = useState<AccImportRow[]>([]);
  const [summary, setSummary] = useState<AccImportPreviewResponse['summary'] | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | ImportRowStatus>('all');
  const [search, setSearch] = useState('');
  const [committed, setCommitted] = useState(false);
  const [duplicateAccepted, setDuplicateAccepted] = useState(false);

  useEffect(() => { if (!selectedPeriodId && editablePeriods[0]) setSelectedPeriodId(editablePeriods[0].id); }, [editablePeriods, selectedPeriodId]);
  const activePeriod = editablePeriods.find(period => period.id === selectedPeriodId);

  const reset = (notify = true) => {
    setFileName(null); setStagedRows([]); setRawRows([]); setSummary(null); setCommitted(false); setDuplicateAccepted(false); setFilterStatus('all'); setSearch('');
    if (notify) toast('Area staging dibersihkan', 'info');
  };
  const changePeriod = (id: string) => { if (stagedRows.length) reset(false); setSelectedPeriodId(id); };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!activePeriod) { toast('Pilih periode yang dapat diedit sebelum mengimpor.', 'error'); return; }
    reset(false); setFileName(file.name);
    const data = new FormData(); data.append('file', file); data.append('period_id', activePeriod.id);
    try {
      const response = await mutations.preview.mutateAsync(data);
      setRawRows(response.data.rows); setStagedRows(mapRows(response.data.rows)); setSummary(response.data.summary);
      toast(`${response.data.summary.total_rows} baris selesai diperiksa oleh server`, 'success');
    } catch (error) { setFileName(null); toast(error instanceof Error ? error.message : 'Berkas gagal diperiksa', 'error'); }
  };

  const downloadTemplate = () => {
    const blob = new Blob(['tanggal,ref,rekening,kategori,debit,kredit,keterangan\r\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'template-jurnal.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const commit = async () => {
    if (!activePeriod || !summary?.can_commit || !rawRows.length) return;
    if (summary.duplicate_candidates > 0 && !duplicateAccepted) { toast('Konfirmasi kandidat duplikat sebelum menyimpan.', 'error'); return; }
    try {
      const response = await mutations.commit.mutateAsync({ period_id: activePeriod.id, rows: rawRows });
      setCommitted(true);
      toast(`${response.data.inserted_count} transaksi berhasil masuk ke jurnal`, 'success');
    } catch (error) { toast(error instanceof Error ? error.message : 'Commit gagal; batch dibatalkan seluruhnya', 'error'); }
  };

  const counts: Record<ImportRowStatus, number> = { valid: stagedRows.filter(row => row.status === 'valid').length, normalized: stagedRows.filter(row => row.status === 'normalized').length, warning: stagedRows.filter(row => row.status === 'warning').length, duplicate_warning: stagedRows.filter(row => row.status === 'duplicate_warning').length, error: stagedRows.filter(row => row.status === 'error').length };
  const busy = mutations.preview.isPending || mutations.commit.isPending;

  return <section className="space-y-6 pb-12 animate-fade-in">
    <AccountingPageHeader area="Data & Integrasi · Staging transaksi" title="Impor transaksi Accounting" description="Pilih periode, unggah berkas, telaah setiap temuan, lalu pindahkan satu batch tervalidasi ke jurnal." />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-5">
        <div className="rounded-card-lg border border-line bg-panel p-5 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Proses impor terkendali</p><h2 className="mt-1 text-lg font-bold text-navy">Staging sebelum pencatatan resmi</h2><p className="mt-1 max-w-2xl text-sm text-subtle">Berkas belum mengubah jurnal saat diunggah. Server memvalidasi rekening, kategori, tanggal, nilai, dan kandidat duplikat terlebih dahulu.</p></div><div className="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted"><LockKeyhole className="h-4 w-4 text-primary" />Commit atomik</div></div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">{[{ icon: UploadCloud, label: 'Unggah', note: 'Masuk area staging' }, { icon: FileCheck2, label: 'Validasi', note: 'Periksa temuan server' }, { icon: CheckCircle2, label: 'Commit', note: 'Simpan satu batch' }].map((step, index) => <li key={step.label} className="flex items-center gap-3 rounded-card border border-line bg-panel p-3"><span className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary"><step.icon className="h-4 w-4" /></span><span><span className="block text-xs font-bold text-navy">{index + 1}. {step.label}</span><span className="text-[11px] text-subtle">{step.note}</span></span></li>)}</ol>
        </div>

        <AccountingQueryState loading={periods.isLoading} error={periods.error} empty={!periods.isLoading && editablePeriods.length === 0} emptyTitle="Tidak ada periode yang dapat diedit" emptyDescription="Buka atau koreksi periode Accounting sebelum melakukan impor." retry={() => void periods.refetch()}>
          <div className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><div className="flex items-start gap-3"><div className="rounded-card bg-primary/10 p-2 text-primary"><CalendarRange className="h-5 w-5" /></div><div className="min-w-0 flex-1"><label htmlFor="import-period" className="text-sm font-bold text-navy">Periode tujuan</label><p className="mt-0.5 text-xs text-subtle">Periode dikunci setelah berkas masuk staging agar batch tidak salah pembukuan.</p><select id="import-period" value={selectedPeriodId} onChange={event => changePeriod(event.target.value)} disabled={busy || stagedRows.length > 0} className="mt-3 w-full rounded-input border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-navy outline-none focus:border-primary"><option value="">Pilih periode</option>{editablePeriods.map(period => <option key={period.id} value={period.id}>{periodLabel(period.periodMonth)} · {period.status.replaceAll('_', ' ')}</option>)}</select></div></div></div>
        </AccountingQueryState>

        <ImportUploadBox fileName={fileName} onFileUpload={upload} onDownloadTemplate={downloadTemplate} onReset={() => reset()} isPending={busy || !activePeriod} hasStagedRows={stagedRows.length > 0} />

        {stagedRows.length > 0 && summary && <div className="space-y-4">
          <ImportSummaryCards totalRows={summary.total_rows} validCount={counts.valid} normalizedCount={counts.normalized} warningCount={counts.warning} duplicateCount={counts.duplicate_warning} errorCount={counts.error} totalDebit={Number(summary.total_debit)} totalCredit={Number(summary.total_credit)} />
          <div className="overflow-hidden rounded-card-lg border border-line bg-panel shadow-card"><ImportStagingTable rows={stagedRows} filterStatus={filterStatus} setFilterStatus={setFilterStatus} search={search} setSearch={setSearch} counts={counts} /><ImportCommitBar activePeriodMonth={activePeriod ? periodLabel(activePeriod.periodMonth) : 'Belum dipilih'} onReset={() => reset()} onCommit={commit} isCommitted={committed} hasErrors={!summary.can_commit || counts.error > 0} isPending={mutations.commit.isPending} stagedRowsCount={stagedRows.length} duplicateCount={counts.duplicate_warning} duplicateAccepted={duplicateAccepted} onDuplicateAccepted={setDuplicateAccepted} /></div>
        </div>}
      </div>

      <aside className="space-y-4">
        <div className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="font-bold text-navy">Kesiapan batch</h2><div className="mt-4 space-y-3">{[{ label: 'Periode dapat diedit', ok: Boolean(activePeriod) }, { label: 'Berkas sudah diperiksa', ok: Boolean(summary) }, { label: 'Tidak ada baris error', ok: Boolean(summary?.can_commit) }, { label: 'Duplikat sudah ditelaah', ok: Boolean(summary) && (counts.duplicate_warning === 0 || duplicateAccepted) }].map(item => <div key={item.label} className="flex items-center gap-2 text-xs"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${item.ok ? 'bg-success-light text-success' : 'bg-surface text-subtle'}`}>{item.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : '·'}</span><span className={item.ok ? 'font-semibold text-navy' : 'text-subtle'}>{item.label}</span></div>)}</div></div>
        <div className="rounded-card-lg border border-line bg-panel p-5 shadow-card"><h2 className="flex items-center gap-2 font-bold text-navy"><AlertTriangle className="h-4 w-4 text-warning" />Aturan penting</h2><ul className="mt-3 space-y-2 text-xs leading-relaxed text-subtle"><li>• Baris error harus diperbaiki pada sumber lalu diunggah ulang.</li><li>• Normalisasi menunjukkan kode sumber telah dipetakan ke master resmi.</li><li>• Kandidat duplikat perlu ditelaah oleh pengguna sebelum commit.</li><li>• Kegagalan satu baris membatalkan seluruh batch.</li></ul></div>
        {summary && <div className={`rounded-card-lg border p-5 shadow-card ${summary.can_commit ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}><div className="flex gap-3">{summary.can_commit ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <RefreshCw className="h-5 w-5 shrink-0 text-danger" />}<div><p className="text-sm font-bold text-navy">{summary.can_commit ? 'Validasi server selesai' : 'Batch perlu diperbaiki'}</p><p className="mt-1 text-xs text-subtle">{summary.can_commit ? `${summary.total_rows} baris dapat dilanjutkan setelah temuan ditelaah.` : `${summary.error_rows} baris error menghalangi commit.`}</p></div></div></div>}
      </aside>
    </div>
  </section>;
}
