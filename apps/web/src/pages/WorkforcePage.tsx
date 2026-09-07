import { useOrgContext } from '../hooks/useBod';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import { useToast } from '../components/ui/Toast';

export default function WorkforcePage() {
  const ctx = useOrgContext();
  const { toast } = useToast();
  if (ctx.isLoading) return <LoadingState />;
  if (ctx.error) {
    const err = ctx.error as unknown as { message?: string; traceId?: string };
    toast(`${err.message ?? 'Gagal muat context'}${err.traceId ? ` — ${err.traceId}` : ''}`, 'error');
    return <ErrorState description={err.message ?? 'Gagal muat context'} traceId={err.traceId} onRetry={()=>void ctx.refetch()} />;
  }
  if (!ctx.data) return <EmptyState />;
  const data = ctx.data as unknown as { user: {id?: string; email?: string; role:string; divisionCode:string|null}; divisions:{code:string;name:string}[]; outlets:{code:string;name:string}[]; scope:string };
  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <p className="text-sm font-medium text-primary">Workforce</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-navy">Kehadiran, Cuti, Lembur</h1>
        <p className="mt-2 text-sm text-slate-500">Real BE — /org/me/context (scope: {data.scope}) — Privacy guard aktif. Payroll guarded.</p>
        <button className="mt-3 rounded-input border border-line/40 px-3 py-2 text-sm">Import SobatHR</button>
        <p className="mt-2 text-sm text-slate-500">Privacy guard</p>
        <p className="mt-1 text-sm text-slate-500">Payroll</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300"><p className="text-sm text-slate-500">Divisi terlihat</p><p className="mt-2 text-2xl lg:text-3xl font-semibold text-navy">{data.divisions.length}</p></div>
        <div className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300"><p className="text-sm text-slate-500">Outlet terlihat</p><p className="mt-2 text-2xl lg:text-3xl font-semibold text-navy">{data.outlets.length}</p></div>
        <div className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300"><p className="text-sm text-slate-500">Scope</p><p className="mt-2 text-sm font-semibold text-navy">{data.scope}</p></div>
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Konteks real — {data.user.role} · {data.scope}</h2>
        <p className="text-sm text-slate-500">User {data.user.email ?? data.user.id} · Division {data.user.divisionCode ?? '—'}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-card-lg border border-line/40 p-4 bg-surface/30">
            <p className="text-xs uppercase tracking-wider text-slate-400">Divisi terlihat ({data.divisions.length})</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{data.divisions.map((d)=> <span key={d.code} className="rounded-pill bg-white border border-line/40 px-2 py-1 text-xs font-medium text-navy">{d.code} · {d.name}</span>)}</div>
          </div>
          <div className="rounded-card-lg border border-line/40 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Outlet terlihat ({data.outlets.length})</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{data.outlets.length===0 ? <span className="text-xs text-slate-400">Tidak ada outlet</span> : data.outlets.slice(0,8).map((o)=> <span key={o.code} className="rounded-pill bg-primary-light border border-primary/20 px-2 py-1 text-xs font-medium text-primary">{o.code}</span>)}{data.outlets.length>8 && <span className="text-xs text-slate-400">+{data.outlets.length-8} lagi</span>}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">Source /org/me/context · scope {data.scope} · Privacy guard aktif</p>
      </section>
    </div>
  );
}
