import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, RefreshCw, Filter, Search, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { useAccountingPeriods, useImportMutations } from '../hooks/useAccounting';
import type { AccImportRow } from '../api/accounting';

interface DisplayRow {
  rowNum: number;
  date: string;
  refNo: string;
  account: string;
  rawCategory: string;
  normalizedCategory: string;
  description: string;
  debit: number;
  credit: number;
  status: 'valid' | 'normalized' | 'duplicate_warning' | 'error';
  notes: string;
}

const SAMPLE_ROWS = [
  { tanggal: '2026-08-01', ref: 'SLS-0801-01', rekening: '155-00-1241716-1', kategori: '1', debit: 45200000, kredit: 0, keterangan: 'Sales Store Harian T2D Mandiri' },
  { tanggal: '2026-08-01', ref: 'SLS-0801-02', rekening: '551-0480491', kategori: 'B1', debit: 68400000, kredit: 0, keterangan: 'Sales Store Harian Pioner BCA' },
  { tanggal: '2026-08-02', ref: 'EXP-0802-01', rekening: '155-00-1243142-8', kategori: '2a', debit: 0, kredit: 15400000, keterangan: 'Processing & Packaging Gudang' },
  { tanggal: '2026-08-03', ref: 'EXP-0803-01', rekening: '155-00-1268016-4', kategori: 'C1', debit: 0, kredit: 120500000, keterangan: 'Tagihan PT Angkasa Pura Indonesia' },
  { tanggal: '2026-08-03', ref: 'EXP-0803-02', rekening: '155-00-1492058-4', kategori: 'C30', debit: 0, kredit: 30000, keterangan: 'C30. BIAYA BANK - ADM BANK KINGTECH BALI' },
  { tanggal: '2026-08-04', ref: 'SLS-0804-01', rekening: '155-00-1511537-4', kategori: '2', debit: 35000000, kredit: 0, keterangan: 'Pendapatan Jasa Manajemen T3B' },
  { tanggal: '2026-08-04', ref: '', rekening: '551-0461217', kategori: 'B1', debit: 22100000, kredit: 0, keterangan: 'Sales Store Harian T3A Tanpa Ref' },
  { tanggal: '2026-08-05', ref: 'EXP-0805-01', rekening: '155-00-1302784-5', kategori: 'C13', debit: 0, kredit: 85000000, keterangan: 'Gaji Lapangan Periode Agustus 2026' },
];

const rupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export default function AccountingImportPage() {
  const { toast } = useToast();
  const periods = useAccountingPeriods();
  const importMutations = useImportMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [stagedRows, setStagedRows] = useState<DisplayRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'normalized' | 'duplicate_warning' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [committed, setCommitted] = useState(false);
  const [backendRawRows, setBackendRawRows] = useState<AccImportRow[]>([]);

  const activePeriod = periods.data?.find((p) => ['draft', 'pending_approval', 'reopened'].includes(p.status)) ?? periods.data?.[0];

  const mapBackendRows = (rows: AccImportRow[]): DisplayRow[] => {
    return rows.map((r) => {
      let st: DisplayRow['status'] = 'valid';
      if (r.status === 'ERROR') st = 'error';
      else if (r.status === 'DUPLICATE') st = 'duplicate_warning';
      else if (r.warnings?.some((w) => w.toLowerCase().includes('normalisasi'))) st = 'normalized';

      return {
        rowNum: r.row_number,
        date: r.date,
        refNo: r.reference_no ?? '-',
        account: r.account_name ?? 'Bank Default',
        rawCategory: r.original_category ?? r.category_code,
        normalizedCategory: r.category_code,
        description: r.description,
        debit: r.debit,
        credit: r.credit,
        status: st,
        notes: (r.errors?.join(', ') || r.warnings?.join(', ')) || 'Terverifikasi valid',
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    setFileName(uploaded.name);
    setCommitted(false);

    const formData = new FormData();
    formData.append('file', uploaded);
    if (activePeriod?.id) formData.append('period_id', activePeriod.id);

    try {
      const res = await importMutations.preview.mutateAsync(formData);
      const data = res.data;
      setBackendRawRows(data.rows);
      setStagedRows(mapBackendRows(data.rows));
      toast(`Berkas ${uploaded.name} berhasil diproses server (${data.summary.total_rows} baris terbaca)`, 'success');
    } catch {
      toast('Gagal memproses berkas Excel di backend', 'error');
    }
  };

  const handleSimulateUpload = async () => {
    setFileName('BUDGETING_AGUSTUS_2026.xlsx');
    setCommitted(false);

    try {
      const res = await importMutations.preview.mutateAsync({
        period_id: activePeriod?.id,
        rows: SAMPLE_ROWS,
      });
      const data = res.data;
      setBackendRawRows(data.rows);
      setStagedRows(mapBackendRows(data.rows));
      toast('Server berhasil men-staging 8 transaksi simulasi dengan normalisasi kategori', 'success');
    } catch {
      toast('Gagal memproses simulasi staging di server', 'error');
    }
  };

  const handleCommit = async () => {
    if (stagedRows.length === 0) return;
    if (stagedRows.some((r) => r.status === 'error')) {
      toast('Batch mengandung baris error. Perbaiki sebelum commit', 'error');
      return;
    }

    try {
      await importMutations.commit.mutateAsync({
        period_id: activePeriod?.id,
        rows: backendRawRows.length > 0 ? backendRawRows : stagedRows.map((s) => ({
          date: s.date,
          reference_no: s.refNo,
          category_code: s.normalizedCategory,
          description: s.description,
          debit: s.debit,
          credit: s.credit,
          status: 'VALID',
        })),
      });
      setCommitted(true);
      toast(`Commit atomic sukses! ${stagedRows.length} transaksi resmi masuk ke buku besar jurnal`, 'success');
    } catch {
      toast('Commit batch gagal di backend (all-or-nothing rollback aman)', 'error');
    }
  };

  const handleReset = () => {
    setFileName(null);
    setStagedRows([]);
    setBackendRawRows([]);
    setCommitted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Staging transaksi dibersihkan', 'info');
  };

  const filteredRows = stagedRows.filter((row) => {
    const matchStatus = filterStatus === 'all' || row.status === filterStatus;
    const matchSearch =
      row.description.toLowerCase().includes(search.toLowerCase()) ||
      row.refNo.toLowerCase().includes(search.toLowerCase()) ||
      row.account.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const validCount = stagedRows.filter((r) => r.status === 'valid').length;
  const normalizedCount = stagedRows.filter((r) => r.status === 'normalized').length;
  const warnCount = stagedRows.filter((r) => r.status === 'duplicate_warning').length;
  const errCount = stagedRows.filter((r) => r.status === 'error').length;
  const totalDebit = stagedRows.reduce((acc, cur) => acc + cur.debit, 0);
  const totalCredit = stagedRows.reduce((acc, cur) => acc + cur.credit, 0);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">ACCOUNTING CONTROL CENTER</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Impor Transaksi Accounting</h1>
          <p className="mt-1 text-sm text-slate-600">
            Impor batch dari sheet terlihat <span className="font-mono font-semibold text-navy">BUDGETING</span> dengan staging, validasi, normalisasi otomatis, dan commit aman.
          </p>
        </div>
      </header>

      {/* Upload Box */}
      <div className="rounded-card-lg border border-dashed border-line bg-white p-8 text-center shadow-glass transition hover:border-primary/50">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => void handleFileUpload(e)}
          className="hidden"
          id="excel-file-input"
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="mt-3 text-base font-bold text-navy">
          {fileName ? `Berkas Terpilih: ${fileName}` : 'Unggah Lembar Kerja Excel (.xlsx)'}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          Membaca sheet <span className="font-semibold text-navy">BUDGETING</span>. Kolom Tanggal, Ref, Rekening, Kategori, Debit, Kredit, dan Deskripsi akan divalidasi dan dinormalisasi.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <label
            htmlFor="excel-file-input"
            className="cursor-pointer inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-dark transition"
          >
            <UploadCloud className="h-4 w-4" />
            {importMutations.preview.isPending ? 'Memproses Server...' : 'Pilih Berkas Excel'}
          </label>
          <button
            type="button"
            onClick={() => void handleSimulateUpload()}
            disabled={importMutations.preview.isPending}
            className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-navy hover:bg-slate-200 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Simulasikan Data Excel
          </button>
          {stagedRows.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-card border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Staging Summary & Data Table */}
      {stagedRows.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-card border border-line bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Baris</p>
              <p className="mt-1 text-xl font-bold text-navy">{stagedRows.length}</p>
            </div>
            <div className="rounded-card border border-line bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Valid Langsung</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{validCount}</p>
            </div>
            <div className="rounded-card border border-line bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Dinormalisasi</p>
              <p className="mt-1 text-xl font-bold text-blue-600">{normalizedCount}</p>
            </div>
            <div className="rounded-card border border-line bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Kandidat Duplikat</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{warnCount}</p>
            </div>
            <div className="rounded-card border border-line bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Debit</p>
              <p className="mt-1 text-sm font-bold text-emerald-600 font-mono">{rupiah(totalDebit)}</p>
            </div>
            <div className="rounded-card border border-line bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Kredit</p>
              <p className="mt-1 text-sm font-bold text-rose-600 font-mono">{rupiah(totalCredit)}</p>
            </div>
          </div>

          <div className="rounded-card-lg border border-line bg-white shadow-glass">
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 mr-1" />
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filterStatus === 'all' ? 'bg-navy text-white' : 'bg-surface text-slate-600'
                  }`}
                >
                  Semua ({stagedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('valid')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filterStatus === 'valid' ? 'bg-emerald-600 text-white' : 'bg-surface text-slate-600'
                  }`}
                >
                  Valid ({validCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('normalized')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filterStatus === 'normalized' ? 'bg-blue-600 text-white' : 'bg-surface text-slate-600'
                  }`}
                >
                  Dinormalisasi ({normalizedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('duplicate_warning')}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filterStatus === 'duplicate_warning' ? 'bg-amber-600 text-white' : 'bg-surface text-slate-600'
                  }`}
                >
                  Warning Duplikat ({warnCount})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-card border border-line pl-9 pr-3 py-1.5 text-xs text-navy focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-surface/60 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Baris</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">No Ref</th>
                    <th className="px-4 py-3">Rekening Bank</th>
                    <th className="px-4 py-3">Kategori Asli &rarr; Hasil</th>
                    <th className="px-4 py-3">Deskripsi Transaksi</th>
                    <th className="px-4 py-3 text-right">Debit</th>
                    <th className="px-4 py-3 text-right">Kredit</th>
                    <th className="px-4 py-3">Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredRows.map((r) => (
                    <tr key={r.rowNum} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">#{r.rowNum}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{r.date}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{r.refNo}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700">{r.account}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-400">{r.rawCategory}</span>
                          <span className="text-slate-300">&rarr;</span>
                          <span className="font-mono font-bold text-navy bg-slate-100 px-1.5 py-0.5 rounded">
                            {r.normalizedCategory}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-navy">{r.description}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">
                        {r.debit > 0 ? rupiah(r.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">
                        {r.credit > 0 ? rupiah(r.credit) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'valid' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        )}
                        {r.status === 'normalized' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800" title={r.notes}>
                            <RefreshCw className="h-3 w-3" /> Canonicalized
                          </span>
                        )}
                        {r.status === 'duplicate_warning' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800" title={r.notes}>
                            <AlertTriangle className="h-3 w-3" /> Warning
                          </span>
                        )}
                        {r.status === 'error' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800" title={r.notes}>
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Commit Control Bar */}
            <div className="flex flex-col gap-3 border-t border-line bg-surface/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-navy">
                  Siap commit ke periode <span className="text-primary">{activePeriod?.periodMonth ?? 'Agustus 2026'}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Transaksi commit bersifat all-or-nothing. Jika terjadi galat sistem, seluruh batch dibatalkan.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-card border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-surface"
                >
                  Batalkan Staging
                </button>
                <button
                  type="button"
                  disabled={committed || errCount > 0 || importMutations.commit.isPending}
                  onClick={() => void handleCommit()}
                  className={`inline-flex items-center gap-2 rounded-card px-5 py-2 text-xs font-semibold text-white shadow transition ${
                    committed
                      ? 'bg-emerald-600 cursor-default'
                      : errCount > 0
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {committed
                    ? '✓ Berhasil Di-commit'
                    : importMutations.commit.isPending
                    ? 'Menyimpan ke Database...'
                    : `Commit ${stagedRows.length} Transaksi`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
