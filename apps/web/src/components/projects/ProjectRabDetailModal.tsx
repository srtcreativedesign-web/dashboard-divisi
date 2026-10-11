import React, { useState, useEffect } from 'react';
import { Project, ProjectRab } from '../../types/project';
import { projectApi } from '../../api/projects';
import {
  FileSpreadsheet,
  Download,
  Printer,
  X,
  Plus,
  Trash2,
  FileCheck,
  Save,
  Loader2,
  Banknote,
  ListChecks,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { printRabPdf, downloadRabPdf } from '../../utils/rabPdf';

interface ProjectRabDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess?: () => void;
}

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

export function ProjectRabDetailModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectRabDetailModalProps) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [rows, setRows] = useState<RabRowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRabItems();
    }
  }, [isOpen, project.id]);

  const loadRabItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectApi.getRab(project.id);
      if (data && data.length > 0) {
        setRows(
          data.map((r) => ({
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
        // Default rows if project has none yet
        setRows([
          { item_name: 'Plat Bulat', category: 'material', volume: 2, unit: 'Pcs', unit_price: 450000, total_price: 900000 },
          { item_name: 'Besi Plat Ukuran 100cm X 40mm', category: 'material', volume: 2, unit: 'Pcs', unit_price: 135000, total_price: 270000 },
          { item_name: 'Sliding Quide Road', category: 'material', volume: 8, unit: 'Set', unit_price: 200000, total_price: 1600000 },
          { item_name: 'Jasa Bor & Tap M 10.', category: 'labor', volume: 16, unit: 'Pcs', unit_price: 75000, total_price: 1200000 },
        ]);
      }
    } catch {
      // Fallback
      setRows([
        { item_name: '', category: 'material', volume: 1, unit: 'Pcs', unit_price: 0, total_price: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const grandTotal = rows.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const formattedGrandTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(grandTotal);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const validItems = rows.filter((r) => r.item_name.trim().length > 0);
      if (validItems.length === 0) {
        setError('Harap masukkan setidaknya satu baris deskripsi pekerjaan/material.');
        setSaving(false);
        return;
      }

      await projectApi.batchSyncRab(project.id, validItems);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan rincian RAB.');
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
    onClose();
    navigate(`/projects/lpj?project_id=${project.id}`);
  };

  const subTitle = `${project.classification === 'maintenance' ? 'Maintenance' : 'Proyek Baru'} - ${project.location || 'Warehouse'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl rounded-card-lg bg-surface border border-line shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header matching reference */}
        <div className="bg-navy px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-card bg-primary-900/80 border border-primary-500/30 flex items-center justify-center text-primary-300">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Rencana Anggaran Biaya (RAB) Detail
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {subTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
              title="Preview & Cetak Dokumen RAB"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Preview & Setting</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
              title="Unduh Dokumen PDF RAB"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-input transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/70">
          {error && (
            <div className="rounded-card bg-danger-light p-3.5 border border-danger/30 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <p className="text-xs text-danger font-medium">{error}</p>
            </div>
          )}

          {/* Section 1: Metode Pembayaran RAB */}
          <div className="rounded-card-lg border border-line bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line/60">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Metode Pembayaran RAB
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Cash / Transfer
              </span>
            </div>

            <div className="max-w-xs">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-input border border-line bg-surface px-3 py-2 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer Bank</option>
                <option value="Termin">Termin / Bertahap</option>
              </select>
            </div>
          </div>

          {/* Section 2: Rincian Material & Jasa */}
          <div className="rounded-card-lg border border-line bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line/60">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary-600" />
                <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Rincian Material & Jasa
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-input bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah Baris</span>
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600 mb-2" />
                Memuat rincian RAB...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-y border-line">
                    <tr>
                      <th className="px-3 py-3 w-12 text-center">No</th>
                      <th className="px-3 py-3 min-w-[240px]">Deskripsi Pekerjaan / Material</th>
                      <th className="px-3 py-3 w-24 text-center">Qty</th>
                      <th className="px-3 py-3 w-32 text-center">Satuan</th>
                      <th className="px-3 py-3 w-36 text-right">Harga Satuan</th>
                      <th className="px-3 py-3 w-40 text-right">Total (Rp)</th>
                      <th className="px-3 py-3 w-14 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.item_name}
                            onChange={(e) => handleRowChange(idx, 'item_name', e.target.value)}
                            placeholder="Deskripsi pekerjaan atau barang..."
                            className="w-full rounded-input border border-line bg-surface px-3 py-1.5 text-xs text-navy font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.volume}
                            onChange={(e) => handleRowChange(idx, 'volume', Number(e.target.value))}
                            className="w-full rounded-input border border-line bg-surface px-2 py-1.5 text-xs text-center font-bold text-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-3 py-2">
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
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={row.unit_price}
                            onChange={(e) => handleRowChange(idx, 'unit_price', Number(e.target.value))}
                            className="w-full rounded-input border border-line bg-surface px-2 py-1.5 text-xs text-right font-medium text-navy focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-navy whitespace-nowrap">
                          Rp {row.total_price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grand Total Summary Box */}
            <div className="flex items-center justify-end gap-6 pt-5 mt-4 border-t border-line/60">
              <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
                Grand Total RAB:
              </span>
              <span className="text-base sm:text-xl font-bold text-primary-700">
                {formattedGrandTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="border-t border-line bg-white px-6 py-4 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-input border border-line bg-white text-slate-700 hover:bg-surface text-xs font-semibold transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGoToLpj}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-input bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <FileCheck className="h-4 w-4" />
              <span>LPJ / Penyelesaian</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-input bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
