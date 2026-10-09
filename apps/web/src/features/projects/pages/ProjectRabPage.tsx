import React, { useState, useEffect } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';
import { Project, ProjectRab } from '../../../types/project';
import { Button } from '../../../components/ui/Button';
import {
  Calculator,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Printer,
  FileCheck,
  Save,
  Loader2,
  Banknote,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { printRabPdf, downloadRabPdf } from '../../../utils/rabPdf';

interface RabRowItem {
  id?: number;
  item_name: string;
  category: string;
  volume: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

const DEFAULT_UNITS = ['Pcs', 'Set', 'Meter', 'Batang', 'Kg', 'Ls', 'Titik', 'Hari', 'Unit', 'Lembar'];

const CATEGORIES = [
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Upah / Tenaga Kerja' },
  { value: 'subcontractor', label: 'Subkontraktor' },
  { value: 'equipment', label: 'Sewa Alat & Perlengkapan' },
  { value: 'overhead', label: 'Overhead & Operasional' },
];

function ProjectRabContent({
  project,
  refreshProject,
  canManage,
}: {
  project: Project;
  refreshProject: () => Promise<void>;
  canManage: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [rows, setRows] = useState<RabRowItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize rows from project.rabs
  useEffect(() => {
    if (project.rabs && project.rabs.length > 0) {
      setRows(
        project.rabs.map((r) => ({
          id: r.id,
          item_name: r.item_name || '',
          category: r.category || 'material',
          volume: Number(r.volume) || 1,
          unit: r.unit || 'Pcs',
          unit_price: Number(r.unit_price) || 0,
          total_price: Number(r.total_price) || 0,
        }))
      );
    } else {
      setRows([]);
    }
    setIsDirty(false);
  }, [project.id, project.rabs]);

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleRowChange = (index: number, field: keyof RabRowItem, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const current: RabRowItem = {
        item_name: target.item_name,
        category: target.category,
        volume: target.volume,
        unit: target.unit,
        unit_price: target.unit_price,
        total_price: target.total_price,
        id: target.id,
        [field]: value,
      };

      if (field === 'volume' || field === 'unit_price') {
        const vol = Number(field === 'volume' ? value : current.volume) || 0;
        const price = Number(field === 'unit_price' ? value : current.unit_price) || 0;
        current.total_price = vol * price;
      }

      next[index] = current;
      return next;
    });
    setIsDirty(true);
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        item_name: '',
        category: 'material',
        volume: 1,
        unit: 'Pcs',
        unit_price: 0,
        total_price: 0,
      },
    ]);
    setIsDirty(true);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const grandTotal = rows.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const contract = parseFloat(project.contract_value?.toString() || '0');
  const projectedMargin = contract - grandTotal;
  const marginPercentage = contract > 0 ? (projectedMargin / contract) * 100 : 0;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const validItems = rows.filter((r) => r.item_name.trim().length > 0);
      if (validItems.length === 0 && rows.length > 0) {
        setError('Harap masukkan deskripsi pekerjaan atau material pada baris yang telah ditambahkan.');
        setSaving(false);
        return;
      }

      await projectApi.batchSyncRab(project.id, validItems);
      await refreshProject();
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan perubahan RAB.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    downloadRabPdf({
      project,
      items: rows,
      paymentMethod,
    });
  };

  const handlePrintPreview = () => {
    printRabPdf({
      project,
      items: rows,
      paymentMethod,
    });
  };

  const handleGoToLpj = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/projects/lpj?project_id=${project.id}`;
    }
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
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
    <div className="space-y-6">
      {/* TOP ACTION TOOLBAR */}
      <div className="rounded-card border border-line bg-white p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-input bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600">
            <FileSpreadsheet className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">Manajemen Lembar Kerja RAB</h3>
            <p className="text-xs text-slate-500">Edit langsung di halaman, kalkulasi otomatis, dan cetak dokumen resmi.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handlePrintPreview}
            className="text-xs text-slate-700 hover:text-navy"
            title="Preview & Cetak Dokumen RAB"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Preview & Setting
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleDownloadPdf}
            className="text-xs text-slate-700 hover:text-navy"
            title="Unduh Dokumen PDF RAB"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Download PDF
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoToLpj}
            className="text-xs text-slate-700 hover:text-navy"
            title="Lihat LPJ / Realisasi Pengeluaran"
          >
            <FileCheck className="h-3.5 w-3.5 mr-1" />
            LPJ / Penyelesaian
          </Button>

          {canManage && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saving}
              className="text-xs shadow-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          )}
        </div>
      </div>

      {/* ALERT FEEDBACKS */}
      {error && (
        <div className="rounded-card bg-danger-light p-3.5 border border-danger/30 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger font-medium">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-card bg-emerald-50 p-3.5 border border-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 font-medium">Rincian RAB berhasil disimpan ke database!</p>
        </div>
      )}

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pagu RAB</p>
          <h3 className="mt-1.5 text-2xl font-bold text-navy">{formatCurrency(grandTotal)}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{rows.length} item rincian biaya</p>
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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Anggaran</p>
            <h3 className={`mt-1.5 text-lg font-bold ${grandTotal <= contract ? 'text-emerald-700' : 'text-rose-600'}`}>
              {contract === 0 ? 'Draft RAB' : grandTotal <= contract ? 'Dalam Pagu' : 'Melebihi Kontrak'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {contract > 0 ? `${((grandTotal / contract) * 100).toFixed(1)}% dari nilai kontrak` : 'Belum ada nilai kontrak'}
            </p>
          </div>
          <div className="h-11 w-11 rounded-input bg-surface border border-line flex items-center justify-center text-primary-600">
            <Calculator className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* SECTION 1: METODE PEMBAYARAN RAB */}
      <div className="rounded-card border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Banknote className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Metode Pembayaran RAB
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Format Penagihan
          </span>
        </div>

        <div className="max-w-xs">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Metode Pembayaran
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs font-semibold text-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="Cash">Cash</option>
            <option value="Transfer">Transfer Bank</option>
            <option value="Termin">Termin / Bertahap</option>
          </select>
        </div>
      </div>

      {/* SECTION 2: RINCIAN MATERIAL & JASA (SPREADSHEET TABLE) */}
      <div className="rounded-card border border-line bg-white p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4.5 w-4.5 text-primary-600" />
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Rincian Material & Jasa
            </h3>
            {isDirty && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Ada perubahan belum disimpan
              </span>
            )}
          </div>

          {canManage && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddRow}
              className="text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border-primary-200"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              + Tambah Item RAB
            </Button>
          )}
        </div>

        {/* SPREADSHEET TABLE */}
        <div className="overflow-x-auto rounded-input border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-slate-600 font-bold uppercase border-b border-line">
              <tr>
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th className="px-3 py-3 min-w-[240px]">Deskripsi Pekerjaan / Material</th>
                <th className="px-3 py-3 w-40">Kategori</th>
                <th className="px-3 py-3 w-24 text-center">Qty</th>
                <th className="px-3 py-3 w-28 text-center">Satuan</th>
                <th className="px-3 py-3 w-36 text-right">Harga Satuan</th>
                <th className="px-3 py-3 w-40 text-right">Total (Rp)</th>
                {canManage && <th className="px-3 py-3 w-14 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length > 0 ? (
                rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface/60 transition-colors">
                    <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Deskripsi */}
                    <td className="px-3 py-2.5">
                      {canManage ? (
                        <input
                          type="text"
                          value={row.item_name}
                          onChange={(e) => handleRowChange(idx, 'item_name', e.target.value)}
                          placeholder="Deskripsi pekerjaan atau barang..."
                          className="w-full rounded-input border border-line bg-surface px-3 py-1.5 text-xs text-navy font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      ) : (
                        <span className="font-semibold text-navy">{row.item_name}</span>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className="px-3 py-2.5">
                      {canManage ? (
                        <select
                          value={row.category}
                          onChange={(e) => handleRowChange(idx, 'category', e.target.value)}
                          className="w-full rounded-input border border-line bg-surface px-2 py-1.5 text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getCategoryBadge(row.category)
                      )}
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-2.5">
                      {canManage ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={row.volume}
                          onChange={(e) => handleRowChange(idx, 'volume', Number(e.target.value))}
                          className="w-full rounded-input border border-line bg-surface px-2 py-1.5 text-xs text-center font-bold text-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      ) : (
                        <div className="text-center font-medium text-slate-700">{row.volume}</div>
                      )}
                    </td>

                    {/* Satuan */}
                    <td className="px-3 py-2.5">
                      {canManage ? (
                        <select
                          value={row.unit}
                          onChange={(e) => handleRowChange(idx, 'unit', e.target.value)}
                          className="w-full rounded-input border border-line bg-surface px-2 py-1.5 text-xs text-center font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {DEFAULT_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-center font-mono text-[11px] text-slate-500 uppercase">{row.unit}</div>
                      )}
                    </td>

                    {/* Harga Satuan */}
                    <td className="px-3 py-2.5 text-right">
                      {canManage ? (
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={row.unit_price}
                          onChange={(e) => handleRowChange(idx, 'unit_price', Number(e.target.value))}
                          className="w-full rounded-input border border-line bg-surface px-2 py-1.5 text-xs text-right font-medium text-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                        />
                      ) : (
                        <span className="text-slate-600 font-medium">{formatCurrency(row.unit_price)}</span>
                      )}
                    </td>

                    {/* Total Biaya */}
                    <td className="px-3 py-2.5 text-right font-bold text-navy whitespace-nowrap">
                      {formatCurrency(row.total_price)}
                    </td>

                    {/* Aksi */}
                    {canManage && (
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 rounded-input text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-5 py-12 text-center text-slate-500">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">Belum ada rincian item RAB</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {canManage
                        ? 'Mulai susun Rencana Anggaran Biaya dengan menekan tombol "+ Tambah Item RAB" di atas.'
                        : 'Belum ada rincian RAB yang dibuat untuk proyek ini.'}
                    </p>
                    {canManage && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddRow}
                        className="mt-3 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Buat Baris Pertama
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GRAND TOTAL SUMMARY BOX */}
        <div className="flex items-center justify-between pt-4 border-t border-line">
          <div className="text-xs text-slate-500 font-medium">
            Total {rows.length} baris pekerjaan & material
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              Grand Total RAB:
            </span>
            <span className="text-lg sm:text-2xl font-bold text-primary-700">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        {canManage && (
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleAddRow}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              + Tambah Baris
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleGoToLpj}
                className="text-xs text-slate-700"
              >
                <FileCheck className="h-4 w-4 mr-1" />
                LPJ / Penyelesaian
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={saving}
                className="text-xs shadow-xs"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectRabPage() {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));

  return (
    <ProjectPageLayout
      title="Rencana Anggaran Biaya (RAB)"
      description="Susun rincian pekerjaan & material secara langsung, kalkulasi otomatis, dan cetak dokumen resmi."
    >
      {(project, refreshProject) => (
        <ProjectRabContent
          project={project}
          refreshProject={refreshProject}
          canManage={canManage}
        />
      )}
    </ProjectPageLayout>
  );
}
