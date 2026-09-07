import { useState } from 'react';
import { StatusPill } from '../components/StatusPill';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { useTargetsCurrent, useTargetsRunRate, useUpsertTarget, useApproveTarget, useReturnTarget } from '../hooks/useTargets';
import { useOrgFilters } from '../components/filters/OrgFilters';
import { useAuth } from '../session/AuthContext';

export default function TargetPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isBod = user?.role === 'BOD';
  const { divisionCode } = useOrgFilters();
  const { data, isLoading, error, refetch } = useTargetsCurrent(divisionCode ? { divisionCode } : undefined);
  const runRate = useTargetsRunRate(divisionCode ? { divisionCode } : undefined);
  const upsert = useUpsertTarget();
  const approve = useApproveTarget();
  const ret = useReturnTarget();
  const [amount, setAmount] = useState('100');
  const [periodMonth, setPeriodMonth] = useState(new Date().toISOString().slice(0, 7));
  const [outletId, setOutletId] = useState('');

  if (isLoading) return <LoadingState label="Memuat target..." />;
  if (error) {
    const e = error as unknown as { message?: string; traceId?: string };
    return <ErrorState description={e.message ?? 'Gagal memuat target'} traceId={e.traceId} onRetry={() => void refetch()} />;
  }

  const list = Array.isArray(data) ? data as unknown as { id: string; outlet_id: string; amount: number; status: string; period_month: string }[] : [];
  const handleSubmit = async () => {
    if (!outletId) return;
    try {
      await upsert.mutateAsync({ outletId, periodMonth, amount: Number(amount), action: 'draft' });
      toast('Draft tersimpan', 'success');
      void refetch();
    } catch (e) {
      const err = e as unknown as { message?: string; traceId?: string };
      toast(`${err.message ?? 'Gagal simpan'}${err.traceId ? ` — ${err.traceId}` : ''}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Target Planning</p>
            <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-navy">Target & Realisasi</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Terhubung BE real — /targets/current-month & upsert tenant target (FormRequest).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={outletId} onChange={(e) => setOutletId(e.target.value)} placeholder="outletId (uuid)" aria-label="Outlet ID" />
            <Input value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} aria-label="Periode" />
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24" aria-label="Amount" />
            <Button onClick={handleSubmit} disabled={upsert.isPending}>Simpan Draft (BE)</Button>
          </div>
        </div>
        {upsert.isError && <p className="mt-2 text-sm text-danger">{(upsert.error as Error).message}</p>}
        {upsert.isSuccess && <p className="mt-2 text-sm text-success">Draft tersimpan</p>}
      </section>

      {list.length === 0 ? <EmptyState title="Belum ada target" description="Buat target per outlet — data akan muncul dari /targets/current-month (scope divisi)." /> : (
        <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-semibold text-navy">Target per outlet (real)</h2>
          <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-surface text-slate-500">
                <tr><th scope="col" className="px-4 py-3 font-medium">ID</th><th scope="col" className="px-4 py-3 font-medium">Periode</th><th scope="col" className="px-4 py-3 font-medium">Amount</th><th scope="col" className="px-4 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {list.map((r) => (
                  <tr key={r.id}><td className="px-4 py-3 font-medium text-navy">{r.id.slice(0, 8)}</td><td className="px-4 py-3 text-slate-600">{r.period_month}</td><td className="px-4 py-3 text-slate-600">{r.amount}</td><td className="px-4 py-3"><StatusPill status={r.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-400 lg:hidden">Geser → untuk lihat kolom</p>
        </section>
      )}

      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Run-rate (sisa harian)</h2>
        {(() => {
          if (runRate.isLoading) return <p className="text-sm text-slate-500">Memuat run-rate...</p>;
          if (runRate.error) return <p className="text-sm text-danger">{(runRate.error as Error).message}</p>;
          const r = runRate.data as unknown as { targetAmount?: string; achievedAmount?: string; remainingAmount?: string; daysRemaining?: number; dailyRequired?: string } | null;
          if (!r) return <p className="text-sm text-slate-500">Belum ada target periode ini.</p>;
          return (
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div className="rounded-card-lg border border-line/40 p-4 bg-surface/30"><p className="text-xs uppercase tracking-wider text-slate-400">Target</p><p className="mt-1 font-semibold text-navy">Rp {r.targetAmount ?? '0'}</p></div>
              <div className="rounded-card-lg border border-line/40 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Tercapai</p><p className="mt-1 font-semibold text-success">Rp {r.achievedAmount ?? '0'}</p></div>
              <div className="rounded-card-lg border border-line/40 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Sisa</p><p className="mt-1 font-semibold text-danger">Rp {r.remainingAmount ?? '0'}</p></div>
              <div className="rounded-card-lg border border-line/40 p-4 bg-primary-light/30"><p className="text-xs uppercase tracking-wider text-primary">Per hari</p><p className="mt-1 font-semibold text-primary">Rp {r.dailyRequired ?? '0'}</p><p className="text-xs text-slate-500">{r.daysRemaining ?? 0} hari tersisa</p></div>
            </div>
          );
        })()}
        <p className="mt-3 text-xs text-slate-400">Scope {divisionCode ?? 'semua'} · Superadmin 1:1, Executive lintas</p>
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">BOD review detail</h2>
        <p className="text-sm text-slate-500">Queue draft → approve/return via `POST /targets/{'{id}'}/approve` &amp; `/return` (SOP SoD: hanya BOD).</p>
        {isBod ? (
          list.filter((r)=> r.status==='draft').length===0 ? <p className="mt-3 text-sm text-slate-500">Tidak ada draft pending untuk direview.</p> : (
            <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40">
              <table className="min-w-[640px] w-full text-left text-sm">
                <caption className="sr-only">BOD review queue</caption>
                <thead className="bg-surface text-slate-500"><tr><th scope="col" className="px-4 py-3">ID</th><th scope="col" className="px-4 py-3">Periode</th><th scope="col" className="px-4 py-3">Amount</th><th scope="col" className="px-4 py-3">Aksi</th></tr></thead>
                <tbody className="divide-y divide-line/40">{list.filter((r)=> r.status==='draft').map((r)=> (
                  <tr key={r.id}><td className="px-4 py-3 font-mono text-xs">{r.id.slice(0,8)}</td><td className="px-4 py-3">{r.period_month}</td><td className="px-4 py-3 font-mono text-xs">Rp {r.amount}</td><td className="px-4 py-3 flex gap-2"><Button onClick={async()=>{ try{ await approve.mutateAsync(r.id); toast('Approved','success'); void refetch(); }catch(e){ const err=e as unknown as {message?:string;traceId?:string}; toast(`${err.message ?? 'Gagal approve'}${err.traceId ? ` — ${err.traceId}`:''}`,'error'); } }} disabled={approve.isPending || ret.isPending}>Approve</Button><Button variant="secondary" onClick={async()=>{ try{ await ret.mutateAsync({id:r.id, note:'Need revision'}); toast('Returned','success'); void refetch(); }catch(e){ const err=e as unknown as {message?:string;traceId?:string}; toast(`${err.message ?? 'Gagal return'}${err.traceId ? ` — ${err.traceId}`:''}`,'error'); } }} disabled={approve.isPending || ret.isPending}>Return</Button></td></tr>
                ))}</tbody>
              </table>
            </div>
          )
        ) : <p className="mt-3 text-sm text-slate-500">Hanya BOD dapat approve/return — SoD enforced (BE `capability:approve:target`).</p>}
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Governance target</h2>
        <p className="text-sm text-slate-500">Tetap ditampilkan sebagai SOP — bukan mock data.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-card-lg border border-line/40 p-4"><p className="font-medium text-navy">Segregation of duties</p><p className="text-sm text-slate-500">Pembuat tidak bisa approve</p><div className="mt-2"><StatusPill status="Enforced" /></div></div>
          <div className="rounded-card-lg border border-line/40 p-4"><p className="font-medium text-navy">Append-only approval</p><p className="text-sm text-slate-500">Event baru, bukan update diam</p><div className="mt-2"><StatusPill status="Audit" /></div></div>
          <div className="rounded-card-lg border border-line/40 p-4"><p className="font-medium text-navy">Privileged reopen</p><p className="text-sm text-slate-500">Hanya BOD</p><div className="mt-2"><StatusPill status="Restricted" /></div></div>
        </div>
      </section>
    </div>
  );
}
