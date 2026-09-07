import { useQuery } from '@tanstack/react-query';
import { orgApi } from '../api/org';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import { StatusPill } from '../components/StatusPill';
import { useToast } from '../components/ui/Toast';

export default function KaryawanPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey:['org','assignments'], queryFn:()=>orgApi.assignments().then(r=>r.data)});
  const { toast } = useToast();
  if (isLoading) return <LoadingState label="Memuat assignment..." />;
  if (error) {
    const err = error as unknown as { message?: string; traceId?: string };
    toast(`${err.message ?? 'Gagal muat data'}${err.traceId ? ` — ${err.traceId}` : ''}`, 'error');
    return <ErrorState description={err.message ?? 'Gagal muat data'} traceId={err.traceId} onRetry={()=>void refetch()} />;
  }
  const list = (data ?? []) as unknown as { id:string; division_id:string; outlet_id:string; employee_id:string; effective_from:string; effective_to:string|null }[];
  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <p className="text-sm font-medium text-primary">HRD Master Data</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-navy">Data Karyawan</h1>
        <p className="mt-2 text-sm text-slate-500">Real BE — /org/assignments (scoped). Privacy guard: tanpa payroll nominal.</p>
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Assignment historis</h2>
        <p className="text-xs text-slate-400">Payroll detail tidak tampil</p>
         {list.length===0 ? <EmptyState title="Belum ada assignment" description="Data assignment kosong — seed atau buat via BE." action={<a href="/konfigurasi" className="mt-3 inline-flex rounded-input bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">Buka konfigurasi</a>} /> : (
          <>
            <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40">
              <table className="min-w-[720px] w-full text-left text-sm">
                <caption className="sr-only">Assignment historis</caption>
                <thead className="bg-surface text-slate-500"><tr><th scope="col" className="px-4 py-3">ID</th><th scope="col" className="px-4 py-3">Employee</th><th scope="col" className="px-4 py-3">Effective</th><th scope="col" className="px-4 py-3">Status</th></tr></thead>
                <tbody className="divide-y divide-line/40">{list.slice(0,20).map(a=> <tr key={a.id}><td className="px-4 py-3 font-medium text-navy">{a.id.slice(0,8)}</td><td className="px-4 py-3 text-slate-600">{a.employee_id.slice(0,8)}</td><td className="px-4 py-3 text-slate-600">{a.effective_from}</td><td className="px-4 py-3"><StatusPill status={a.effective_to ? 'Mutasi':'Aktif'} /></td></tr>)}</tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400 lg:hidden">Geser → untuk lihat kolom</p>
          </>
        )}
      </section>
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <h2 className="text-lg font-semibold text-navy">Resolusi UNMAPPED</h2>
        <p className="text-sm text-slate-500">SobatHR mapping HRD↔karyawan import — tampil saat ada unmapped (HR-04/05 blocker HR-01 sample). Privacy guard: tanpa NIK lengkap.</p>
        <EmptyState title="Tidak ada UNMAPPED" description="Semua employee sudah ter-mapping. Jika ada impor baru dengan NIK tak dikenal, entri UNMAPPED akan muncul di sini untuk resolusi." action={<a href="/workforce" className="mt-3 inline-flex rounded-input border border-line/40 bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-white/60">Lihat Workforce → Import SobatHR</a>} />
        <p className="mt-3 text-xs text-slate-400">Guard HR-05: mapping manual + audit log (SOP audit). Blocked sampai HR-01 contoh export tersedia.</p>
      </section>
    </div>
  );
}
