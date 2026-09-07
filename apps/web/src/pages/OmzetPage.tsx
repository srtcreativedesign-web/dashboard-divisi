import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { useRevenueDaily, useBatchUpload } from '../hooks/useRevenue';
import { useOrgFilters } from '../components/filters/OrgFilters';

export default function OmzetPage() {
  const { divisionCode } = useOrgFilters();
  const { data, isLoading, error, refetch } = useRevenueDaily(divisionCode ? { divisionCode } : undefined);
  const upload = useBatchUpload();
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();
  const handleUpload = async () => {
    if (!file) return;
    try {
      await upload.mutateAsync({ file, divisionCode: divisionCode || undefined });
      toast('Upload berhasil', 'success');
      setFile(null);
      void refetch();
    } catch (e) {
      const err = e as unknown as { message?: string; traceId?: string };
      toast(`${err.message ?? 'Gagal upload'}${err.traceId ? ` — ${err.traceId}` : ''}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Revenue Import</p>
            <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-navy">Data Omzet</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Terhubung ke BE real — upload .xlsx ke /revenue/batch-upload, validasi & posting via envelope.</p>
          </div>
          <label className="rounded-input bg-primary px-4 py-2 text-sm font-medium text-white cursor-pointer">
            Pilih File
            <input type="file" accept=".xlsx,.zip" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-card-lg border border-dashed border-primary bg-white p-6 shadow-card">
          <p className="text-sm font-medium text-primary">Upload Excel</p>
          <h2 className="mt-2 text-lg font-semibold text-navy">Tarik file omzet ke sini</h2>
          <p className="mt-2 text-sm text-slate-500">Format .xlsx maksimal 10 MB. File disimpan private (SOP: private upload).</p>
          <div className="mt-5 rounded-card-lg bg-surface p-4 text-sm text-slate-600">
            <p className="font-medium text-navy">{file ? file.name : 'Belum ada file dipilih'}</p>
            <p className="mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Pilih .xlsx untuk upload ke BE' }</p>
          </div>
          <Button onClick={handleUpload} disabled={!file || upload.isPending} className="mt-5 w-full">
            {upload.isPending ? 'Mengunggah...' : 'Upload ke BE'}
          </Button>
          {upload.isError && <p className="mt-2 text-sm text-danger">{(upload.error as Error).message}</p>}
          {upload.isSuccess && <p className="mt-2 text-sm text-success">Upload berhasil — trace_id di meta</p>}
        </article>
        <article className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-semibold text-navy">Revenue Daily (real)</h2>
          {(() => {
            if (isLoading) return <LoadingState />;
            if (error) {
              const e = error as unknown as { message?: string; traceId?: string };
              return <ErrorState description={e.message ?? 'Gagal memuat revenue'} traceId={e.traceId} onRetry={() => void refetch()} />;
            }
            const rows = Array.isArray(data) ? (data as unknown as { id?: string; date?: string; division_code?: string; outlet_code?: string; amount?: string; gross_amount?: string }[]) : [];
            if (!data || rows.length === 0) return <EmptyState description="Belum ada revenue daily untuk filter ini." />;
            return (
              <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40">
                <table className="min-w-[520px] w-full text-left text-sm">
                  <caption className="sr-only">Revenue daily</caption>
                  <thead className="bg-surface text-slate-500"><tr><th scope="col" className="px-4 py-3">Tanggal</th><th scope="col" className="px-4 py-3">Outlet</th><th scope="col" className="px-4 py-3">Nominal</th></tr></thead>
                  <tbody className="divide-y divide-line/40">{rows.slice(0,10).map((r, i)=> <tr key={r.id ?? `${r.date}-${i}`}><td className="px-4 py-3 font-mono text-xs text-navy">{r.date ?? '—'}</td><td className="px-4 py-3 text-slate-600">{r.outlet_code ?? r.division_code ?? '—'}</td><td className="px-4 py-3 font-mono text-xs font-semibold text-navy">Rp {r.amount ?? r.gross_amount ?? '0'}</td></tr>)}</tbody>
                </table>
              </div>
            );
          })()}
          <p className="mt-2 text-xs text-slate-400 lg:hidden">Geser → untuk lihat kolom</p>
        </article>
      </section>

      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Rekonsiliasi daily vs monthly</h2>
        <p className="text-sm text-slate-500">Real BE — /reports/reconciliation.</p>
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Correction workflow</h2>
        <p className="text-sm text-slate-500">Koreksi via superseded batch — real BE.</p>
      </section>
    </div>
  );
}
