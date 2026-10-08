import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { EmptyState, ErrorState, LoadingState } from '../../../components/states';
import { DivisionPageHeader } from '../../../components/ui/DivisionPageHeader';
import { KPICard, KPICardGrid } from '../../../components/ui/primitives';
import { Package, Store } from 'lucide-react';

interface Outlet { id: string; code: string; name: string; isActive: boolean }

export default function CellularDashboardPage() {
  const query = useQuery({ queryKey: ['cellular', 'outlets'], queryFn: async () => (await api.get<Outlet[]>('/cellular/outlets')).data });
  if (query.isLoading) return <LoadingState label="Memuat outlet Cellular..." />;
  if (query.error) return <ErrorState description={query.error.message} onRetry={() => void query.refetch()} />;
  const outlets = query.data ?? [];
  return <div className="space-y-6 pb-10">
    <DivisionPageHeader division="Divisi Cellular" descriptor="Penjualan, Produk & Persediaan" title="Dashboard operasional Cellular" description="Pantau outlet, katalog kartu perdana dan aksesori, pergerakan stok, serta pencatatan penjualan manual." />
    <KPICardGrid columns={2}>
      <KPICard variant="gradient" label="Outlet aktif" value={outlets.length} note="Outlet Cellular yang terdaftar" icon={<Store aria-hidden="true" className="h-5 w-5" />} />
      <KPICard label="Model persediaan" value="Jumlah barang" note="SIM card dan aksesori tanpa serial/IMEI" icon={<Package aria-hidden="true" className="h-5 w-5" />} />
    </KPICardGrid>
    {outlets.length ? <section className="overflow-x-auto rounded-card-lg border border-line bg-panel shadow-card">
      <div className="border-b border-line px-5 py-4"><h2 className="font-bold text-navy">Direktori outlet</h2><p className="mt-1 text-xs text-subtle">Sumber outlet aktif untuk transaksi dan stok Cellular.</p></div>
      <table className="w-full text-left text-sm"><caption className="sr-only">Daftar outlet Cellular</caption>
        <thead className="bg-surface text-slate-500"><tr><th scope="col" className="px-5 py-3">Kode</th><th scope="col" className="px-5 py-3">Nama outlet</th></tr></thead>
        <tbody>{outlets.map(outlet => <tr key={outlet.id} className="border-t border-line"><td className="px-5 py-3 font-medium">{outlet.code}</td><td className="px-5 py-3">{outlet.name}</td></tr>)}</tbody>
      </table>
    </section> : <EmptyState title="Belum ada outlet Cellular" description="Daftar ini akan terisi setelah outlet didaftarkan." />}
  </div>;
}
