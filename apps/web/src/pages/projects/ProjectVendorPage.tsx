import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../api/projects';
import { Users } from 'lucide-react';
import { LoadingState, EmptyState } from '../../components/states';

export default function ProjectVendorPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getVendors();
      setVendors(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data vendor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Error" description={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mitra & Vendor</h1>
          <p className="text-sm text-slate-500">Direktori mitra kerja, sub-kontraktor, dan supplier</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
        >
          + Tambah Vendor
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {vendors.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{v.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{v.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>{v.contact_person}</div>
                    <div className="text-xs">{v.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Tidak ada vendor" description="Belum ada mitra atau vendor yang ditambahkan." />
        )}
      </div>
    </div>
  );
}
