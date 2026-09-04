import { useState } from 'react';
import { Calculator, DollarSign, PieChart, TrendingDown, Edit2, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../session/AuthContext';
import { hasCapability } from '../session/capability';

interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  used: number;
  division: string;
  status: 'Approved' | 'Pending Review' | 'Over Budget';
}

const INITIAL_BUDGETS: BudgetItem[] = [
  { id: '1', category: 'Biaya Operasional (Opex)', allocated: 450000000, used: 310000000, division: 'WRAP', status: 'Approved' },
  { id: '2', category: 'Pemasaran & Promosi', allocated: 200000000, used: 185000000, division: 'WRAP', status: 'Approved' },
  { id: '3', category: 'Pengembangan SDM & Pelatihan', allocated: 120000000, used: 75000000, division: 'WRAP', status: 'Approved' },
  { id: '4', category: 'Investasi Peralatan (CapEx)', allocated: 350000000, used: 340000000, division: 'WRAP', status: 'Approved' },
  { id: '5', category: 'Teknologi & Infrastruktur IT', allocated: 180000000, used: 120000000, division: 'WRAP', status: 'Approved' },
];

export default function BudgetingPage() {
  const { user } = useAuth();
  const isPicViewOnly = !hasCapability(user?.role as never, 'write:target', user?.divisionCode);

  const [budgets, setBudgets] = useState<BudgetItem[]>(INITIAL_BUDGETS);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [newAllocated, setNewAllocated] = useState<number>(0);

  const totalAllocated = budgets.reduce((acc, curr) => acc + curr.allocated, 0);
  const totalUsed = budgets.reduce((acc, curr) => acc + curr.used, 0);
  const remaining = totalAllocated - totalUsed;
  const utilization = Math.round((totalUsed / totalAllocated) * 100);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setBudgets(budgets.map(b => {
      if (b.id === selectedItem.id) {
        return { ...b, allocated: newAllocated };
      }
      return b;
    }));
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-navy via-[#0f172a] to-navy p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-primary-light backdrop-blur-md">
              <Calculator className="h-3.5 w-3.5" /> Perencanaan & Pengendalian Anggaran
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">Format Budgeting Divisi</h1>
            <p className="mt-1 text-sm text-slate-300">
              Alokasi budget operasional, pemasaran, SDM, dan investasi modal divisi.
            </p>
          </div>
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
            <Download className="mr-2 h-4 w-4" /> Export Proposal Budget
          </Button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Total Budget Disetujui</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalAllocated.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Tahun Anggaran 2026</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Budget Terpakai</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-info/10 text-info">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {totalUsed.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">{utilization}% Penggunaan</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Sisa Budget Available</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-navy">Rp {remaining.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-success font-bold">{100 - utilization}% Aman</p>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Status Kelayakan</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xl font-bold text-success">On Budget Target</p>
          <p className="mt-1 text-xs text-slate-500">Sesuai Alokasi Q3</p>
        </article>
      </section>

      {/* Budget Table */}
      <section className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">Alokasi & Penggunaan Budget Per Kategori</h2>
        <div className="mt-4 overflow-x-auto rounded-card-lg border border-line/40">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Kategori Anggaran</th>
                <th className="px-4 py-3.5 text-right">Alokasi Budget (Rp)</th>
                <th className="px-4 py-3.5 text-right">Realisasi / Used (Rp)</th>
                <th className="px-4 py-3.5 text-right">Sisa Budget (Rp)</th>
                <th className="px-4 py-3.5 text-center">Progres %</th>
                {!isPicViewOnly && <th className="px-4 py-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 font-medium">
              {budgets.map((item) => {
                const rem = item.allocated - item.used;
                const pct = Math.round((item.used / item.allocated) * 100);
                return (
                  <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-navy">{item.category}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-navy">
                      Rp {item.allocated.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      Rp {item.used.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-success">
                      Rp {rem.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-bold ${
                        pct > 90 ? 'bg-danger-light text-danger' : 'bg-success-light text-success'
                      }`}>
                        {pct}%
                      </span>
                    </td>
                    {!isPicViewOnly && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setNewAllocated(item.allocated);
                          }}
                          className="rounded-input p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy transition-colors"
                          title="Edit Alokasi"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-card-lg bg-white p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-navy">Edit Alokasi Budget</h3>
            <p className="text-xs text-slate-500 mt-1">Ubah nominal alokasi budget untuk {selectedItem.category}</p>
            <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Alokasi Budget Baru (Rp)</label>
                <Input
                  type="number"
                  value={newAllocated}
                  onChange={(e) => setNewAllocated(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setSelectedItem(null)}>Batal</Button>
                <Button type="submit">Simpan Alokasi</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
