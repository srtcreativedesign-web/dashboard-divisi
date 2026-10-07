import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';

interface Outlet { id: string; code: string; name: string; isActive: boolean }

export default function CellularDashboardPage() {
  const query = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: async () => (await api.get<Outlet[]>('/cellular/outlets')).data });
  if (query.isLoading) return <LoadingState label="Memuat outlet Cellular..." />;
  if (query.error) return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  const outlets = query.data ?? [];
  return <div className="space-y-6">
    <section className="rounded-card-lg border border-line bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-navy">Cellular</h1>
      <p className="mt-2 text-sm text-slate-500">Outlet aktif yang terdaftar dalam sistem.</p>
      <p className="mt-4 text-3xl font-semibold text-navy">{outlets.length}<span className="ml-2 text-sm font-normal text-slate-500">outlet aktif</span></p>
    </section>
    {outlets.length ? <section className="overflow-x-auto rounded-card-lg border border-line bg-white shadow-card">
      <table className="w-full text-left text-sm"><caption className="sr-only">Daftar outlet Cellular</caption>
        <thead className="bg-surface text-slate-500"><tr><th scope="col" className="px-5 py-3">Kode</th><th scope="col" className="px-5 py-3">Nama outlet</th></tr></thead>
        <tbody>{outlets.map(outlet => <tr key={outlet.id} className="border-t border-line"><td className="px-5 py-3 font-medium">{outlet.code}</td><td className="px-5 py-3">{outlet.name}</td></tr>)}</tbody>
      </table>
    </section> : <EmptyState title="Belum ada outlet Cellular" description="Daftar ini akan terisi setelah outlet didaftarkan." />}
  </div>;
}
