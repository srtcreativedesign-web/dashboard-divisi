import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { omzetApi } from '../../../api/omzet';
import { LoadingState, ErrorState, EmptyState } from '../../../components/states';

const rupiah = (value: string | null) => {
  if (value === null) return 'Belum ada rekap tervalidasi';
  if (!/^\d+\.\d{2}$/.test(value)) return 'Nominal sumber tidak valid';
  return `Rp ${new Intl.NumberFormat('id-ID').format(BigInt(value.slice(0, -3)))},${value.slice(-2)}`;
};
export default function AccountingAnnualOmzetPage() {
  const [year, setYear] = useState(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date()));
  const valid = /^\d{4}$/.test(year) && Number(year) >= 1900;
  const report = useQuery({ queryKey: ['omzet', 'annual', year], enabled: valid, queryFn: async () => (await omzetApi.annual(Number(year))).data });
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-semibold text-navy">Omzet tahunan</h1><p className="mt-2 text-sm text-slate-500">Omzet outlet dari rekap tervalidasi. Angka ini belum menyatakan laba, setoran, atau kelengkapan seluruh shift.</p></header>
    <label className="block text-sm">Tahun<input className="ml-3 rounded-input border border-line px-3 py-2" type="number" min="1900" max="9999" value={year} onChange={event => setYear(event.target.value)} /></label>
    {!valid ? <p role="alert">Masukkan tahun empat digit antara 1900 dan 9999.</p> : report.isLoading ? <LoadingState /> : report.error ? <ErrorState description={report.error.message} onRetry={() => void report.refetch()} /> : report.data && <>
      <section className="rounded-card-lg border border-line bg-white p-5"><h2 className="font-semibold">Total omzet tercatat {report.data.year}</h2><p className="mt-2 text-xl">{rupiah(report.data.amount)}</p><p className="mt-2 text-sm text-slate-500">{report.data.validated_count} rekap tervalidasi; {report.data.pending_count} rekap belum tervalidasi dan belum masuk nominal.</p></section>
      <div className="overflow-x-auto rounded-card-lg border border-line bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Omzet per bulan</caption><thead><tr>{['Bulan', 'Omzet tervalidasi', 'Rekap tervalidasi', 'Rekap tertunda'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{report.data.months.map(month => <tr key={month.month} className="border-t border-line"><td className="p-3">{month.month}</td><td className="p-3">{rupiah(month.amount)}</td><td className="p-3">{month.validated_count}</td><td className="p-3">{month.pending_count}</td></tr>)}</tbody></table></div>
      {report.data.outlets.length ? <div className="overflow-x-auto rounded-card-lg border border-line bg-white"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Komparasi omzet tercatat per outlet</caption><thead><tr>{['Outlet', 'Divisi sumber', 'Omzet', 'Bulan dengan data', 'Rekap'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{report.data.outlets.map(outlet => <tr key={outlet.outlet_id} className="border-t border-line"><td className="p-3">{outlet.outlet_name}</td><td className="p-3">{outlet.source_division_code}</td><td className="p-3">{rupiah(outlet.amount)}</td><td className="p-3">{outlet.months_with_data}/12</td><td className="p-3">{outlet.validated_count}</td></tr>)}</tbody></table></div> : <EmptyState title="Belum ada omzet outlet tervalidasi" description="Rekap akan tampil setelah pemeriksaan dan persetujuan yang diperlukan selesai." />}
    </>}
  </div>;
}
