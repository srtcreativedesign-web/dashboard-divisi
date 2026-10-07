import React, { useState, useEffect } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';
import { ProjectRab } from '../../../types/project';
import { Button } from '../../../components/ui/Button';
import {
  Calculator,
  Plus,
  Trash2,
  DollarSign,
  Layers,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';

const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Upah / Tenaga Kerja' },
  { value: 'subcontractor', label: 'Subkontraktor' },
  { value: 'equipment', label: 'Sewa Alat & Perlengkapan' },
  { value: 'overhead', label: 'Overhead & Operasional' },
];

export default function ProjectRabPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const [showRabModal, setShowRabModal] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rabForm, setRabForm] = useState({
    item_name: '',
    category: 'material',
    volume: 1,
    unit: 'ls',
    unit_price: 0,
  });
  const [submittingRab, setSubmittingRab] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryBadge = (cat: string) => {
    const normalized = (cat || '').toLowerCase();
    switch (normalized) {
      case 'material':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Material
          </span>
        );
      case 'labor':
      case 'upah':
      case 'tenaga kerja':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-warning-light text-warning border border-warning/30">
            Tenaga Kerja
          </span>
        );
      case 'subcontractor':
      case 'subkon':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Subkontraktor
          </span>
        );
      case 'equipment':
      case 'alat':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Peralatan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {cat || 'Overhead'}
          </span>
        );
    }
  };

  return (
    <ProjectPageLayout
      title="Rencana Anggaran Biaya (RAB)"
      description="Susun, kalkulasi rincian harga satuan pekerjaan, dan pantau pagu anggaran terhadap nilai kontrak."
    >
      {(project, refreshProject) => {
        const rabs = project.rabs || [];
        const totalRab = rabs.reduce((acc, curr) => acc + parseFloat(curr.total_price?.toString() || '0'), 0);
        const contract = parseFloat(project.contract_value?.toString() || '0');
        const projectedMargin = contract - totalRab;
        const marginPercentage = contract > 0 ? (projectedMargin / contract) * 100 : 0;

        const filteredRabs = rabs.filter((item) => {
          const matchSearch = item.item_name.toLowerCase().includes(search.toLowerCase());
          const matchCategory = categoryFilter === 'all' || (item.category || '').toLowerCase() === categoryFilter.toLowerCase();
          return matchSearch && matchCategory;
        });

        const handleAddRab = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            setSubmittingRab(true);
            await projectApi.addRab(project.id, rabForm);
            await refreshProject();
            setShowRabModal(false);
            setRabForm({ item_name: '', category: 'material', volume: 1, unit: 'ls', unit_price: 0 });
          } catch (err: any) {
            alert(err.message || 'Gagal menambah item RAB');
          } finally {
            setSubmittingRab(false);
          }
        };

        const handleDeleteRab = async (rabId: number) => {
          if (!confirm('Apakah Anda yakin ingin menghapus item RAB ini?')) return;
          try {
            setDeletingId(rabId);
            await projectApi.deleteRab(project.id, rabId);
            await refreshProject();
          } catch (err: any) {
            alert(err.message || 'Gagal menghapus item RAB');
          } finally {
            setDeletingId(null);
          }
        };

        return (
          <div className="space-y-6">
            {/* KPI STATS CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pagu RAB</p>
                <h3 className="mt-1.5 text-2xl font-bold text-navy">{formatCurrency(totalRab)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{rabs.length} item rincian biaya</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai Kontrak</p>
                <h3 className="mt-1.5 text-2xl font-bold text-navy">{formatCurrency(contract)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Plafon maksimal penagihan</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimasi Margin Laba</p>
                <h3 className={`mt-1.5 text-2xl font-bold ${projectedMargin >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(projectedMargin)}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Proyeksi Margin: <span className={projectedMargin >= 0 ? 'text-success' : 'text-danger'}>{marginPercentage.toFixed(1)}%</span>
                </p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Item Terdaftar</p>
                  <h3 className="mt-1.5 text-2xl font-bold text-navy">{filteredRabs.length}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tersaring dalam tabel</p>
                </div>
                <div className="h-11 w-11 rounded-input bg-surface border border-line flex items-center justify-center text-primary-600">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* FILTER TOOLBAR & ACTION */}
            <div className="rounded-card-lg border border-line bg-white p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari uraian pekerjaan / spesifikasi..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-input border border-line bg-surface focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div className="relative min-w-[170px]">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-input border border-line bg-surface text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {canManage && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowRabModal(true)}
                  className="shrink-0 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Item RAB
                </Button>
              )}
            </div>

            {/* RAB DATA TABLE */}
            <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">No</th>
                      <th className="px-5 py-3.5">Uraian Pekerjaan / Material</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5 text-right">Volume</th>
                      <th className="px-5 py-3.5 text-center">Satuan</th>
                      <th className="px-5 py-3.5 text-right">Harga Satuan</th>
                      <th className="px-5 py-3.5 text-right">Total Biaya</th>
                      <th className="px-5 py-3.5 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredRabs.length > 0 ? (
                      filteredRabs.map((rab, idx) => {
                        const unitPrice = parseFloat(rab.unit_price?.toString() || '0');
                        const totalPrice = parseFloat(rab.total_price?.toString() || '0');
                        return (
                          <tr key={rab.id} className="hover:bg-surface/80 transition-colors">
                            <td className="px-5 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-bold text-navy">{rab.item_name}</td>
                            <td className="px-5 py-3.5">{getCategoryBadge(rab.category)}</td>
                            <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                              {Number(rab.volume).toLocaleString('id-ID')}
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono text-[11px] text-slate-500 uppercase">
                              {rab.unit || 'ls'}
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-600 font-medium">
                              {formatCurrency(unitPrice)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-navy">
                              {formatCurrency(totalPrice)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {canManage ? (
                                <button
                                  type="button"
                                  disabled={deletingId === rab.id}
                                  onClick={() => handleDeleteRab(rab.id)}
                                  className="p-1 rounded-input text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors disabled:opacity-50"
                                  title="Hapus Item RAB"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                          <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">Tidak ada item RAB ditemukan</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {search || categoryFilter !== 'all'
                              ? 'Coba sesuaikan kata kunci atau filter kategori Anda.'
                              : 'Mulai susun Rencana Anggaran Biaya dengan menekan tombol Tambah Item RAB.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredRabs.length > 0 && (
                    <tfoot className="bg-surface font-semibold border-t border-line text-slate-700">
                      <tr>
                        <td colSpan={6} className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-[11px] text-slate-500">
                          Subtotal RAB Tersaring:
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-navy text-sm">
                          {formatCurrency(filteredRabs.reduce((acc, curr) => acc + parseFloat(curr.total_price?.toString() || '0'), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* MODAL TAMBAH ITEM RAB */}
            {canManage && showRabModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-lg overflow-hidden">
                  <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
                    <div>
                      <h3 className="text-base font-bold text-navy">Tambah Item RAB Baru</h3>
                      <p className="text-xs text-slate-500">Masukkan rincian item pekerjaan dan analisa harga satuan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRabModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleAddRab} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nama / Uraian Pekerjaan <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Pekerjaan Pengecatan Dinding Interior"
                        value={rabForm.item_name}
                        onChange={(e) => setRabForm({ ...rabForm, item_name: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Kategori Pekerjaan <span className="text-danger">*</span>
                      </label>
                      <select
                        value={rabForm.category}
                        onChange={(e) => setRabForm({ ...rabForm, category: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      >
                        <option value="material">Material & Pasokan Bahan</option>
                        <option value="labor">Upah & Tenaga Kerja (Labor)</option>
                        <option value="subcontractor">Subkontraktor Rekanan</option>
                        <option value="equipment">Sewa Alat & Perlengkapan</option>
                        <option value="overhead">Overhead & Operasional Lapangan</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Volume <span className="text-danger">*</span>
                        </label>
                        <input
                          required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={rabForm.volume}
                          onChange={(e) => setRabForm({ ...rabForm, volume: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Satuan Ukur <span className="text-danger">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="m2 / m3 / unit / ls / ttk"
                          value={rabForm.unit}
                          onChange={(e) => setRabForm({ ...rabForm, unit: e.target.value })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Harga Satuan (Rp) <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          required
                          type="number"
                          min="0"
                          value={rabForm.unit_price}
                          onChange={(e) => setRabForm({ ...rabForm, unit_price: parseInt(e.target.value) || 0 })}
                          className="w-full rounded-input border border-line pl-9 pr-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Total Biaya Kalkulasi: <span className="font-bold text-navy">{formatCurrency(rabForm.volume * rabForm.unit_price)}</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setShowRabModal(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={submittingRab}
                      >
                        {submittingRab ? 'Menyimpan...' : 'Simpan Item RAB'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ProjectPageLayout>
  );
}
