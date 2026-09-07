import { useExecutiveReadModel } from '../hooks/useBod';
import { EmptyState, ErrorState, LoadingState } from '../components/states';

export default function PenilaianPage() {
  const { data, isLoading, error, refetch } = useExecutiveReadModel();
  if (isLoading) return <LoadingState label="Memuat executive read model..." />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={()=>void refetch()} />;
  if (!data || (Array.isArray(data) && data.length===0)) return <EmptyState title="Belum ada KPI" description="Executive read model kosong." />;
  const list = data as unknown as { divisionCode:string; divisionName:string; metrics:{kpiCode:string}[] }[];
  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <p className="text-sm font-medium text-primary">Performance Assessment</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-navy">Penilaian Performa</h1>
        <p className="mt-2 text-sm text-slate-500">Real BE — /bod/executive-read-model (KPI compatibility config-driven, bukan hardcode).</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {list.map(d=> (
          <article key={d.divisionCode} className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold text-navy">{d.divisionCode} — {d.divisionName}</h2><p className="mt-1 text-sm text-slate-500">{d.metrics.map(m=>m.kpiCode).join(', ')}</p></div>
              <span className="rounded-pill bg-success-light px-2 py-1 text-xs font-medium text-success border border-success/20">{d.metrics.length} KPI</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-surface overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-primary-dark" style={{ width: `${Math.min(100, d.metrics.length * 18)}%` }} /></div>
            <p className="mt-2 text-xs text-slate-400">Compatibility config-driven</p>
          </article>
        ))}
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">BOD approval assessment</h2>
        <p className="text-sm text-slate-500">Weighted score server-side</p>
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Governance penilaian</h2>
        <p className="text-sm text-slate-500">Guarded — scoring server-side.</p>
      </section>
    </div>
  );
}
