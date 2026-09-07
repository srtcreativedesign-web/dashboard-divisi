import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  DollarSign,
  CreditCard,
  QrCode,
  Wallet,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DIVISIONS, getRealOutlets, RealOutlet } from '../../config/divisions';
import type { DailyRecord } from '../../store/approvalStore';

export interface DailyReportInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userDivision?: string | null;
  userName?: string;
  onSubmit: (report: Omit<DailyRecord, 'id' | 'status' | 'submittedAt'>) => void;
}

// Target harian patokan per divisi (RKAP operasional)
const DEFAULT_TARGETS: Record<string, number> = {
  WRAP: 40000000,
  CELL: 100000000,
  REFL: 30000000,
  MINI: 60000000,
  FNB: 75000000,
  MC: 200000000,
  ACC: 140000000,
};

// Kategori produk/layanan spesifik per divisi
const DIVISION_SERVICE_CATEGORIES: Record<string, string[]> = {
  WRAP: [
    'Wrapping Bagasi Standar (S/M)',
    'Wrapping Bagasi Jumbo / Heavy (L/XL)',
    'Strapping Band & Segel Pengaman',
    'Penjualan Cover & Aksesoris Koper',
    'Layanan Penitipan & Perlindungan Bagasi',
  ],
  CELL: [
    'Kartu Perdana Turis & Aktivasi Paspor',
    'Paket Kuota Data & Roaming Internasional',
    'Aksesoris Fast Charging (Kabel/Adapter)',
    'Powerbank & Perangkat Seluler Darurat',
  ],
  REFL: [
    'Foot Reflexology (30 / 60 Menit)',
    'Body Massage & Relaksasi Transit',
    'Neck & Shoulder Express Massage',
    'Produk Aromatherapy & Essential Oils',
  ],
  MINI: [
    'Minuman Dingin, Kopi & Air Mineral',
    'Snacks, Roti & Makanan Siap Saji',
    'Travel Essentials & Perlengkapan Mandi',
    'Rokok & Permen Kasir Bandara',
    'Souvenir & Oleh-Oleh Khas Daerah',
  ],
  FNB: [
    'Menu Makanan Utama (Bakso / Nasi / Mie)',
    'Paket Makanan Cepat Saji (Fast Food)',
    'Kopi Seduh, Teh & Minuman Dingin',
    'Pastry, Donat & Snack Transit',
    'Paket Takeaway & Makanan Kotak',
  ],
  MC: [
    'Penukaran Valuta Asing Kertas (Banknotes)',
    'Transaksi Beli Valas (Inbound Passenger)',
    'Transaksi Jual Valas (Outbound Passenger)',
    'Layanan Remittance & Pengiriman Uang',
  ],
  ACC: [
    'Rekonsiliasi Kas Toko Seluruh Outlet',
    'Setoran Kas Fisik Kasir ke Rekening Utama',
    'Penyesuaian Selisih Kasir & Admin',
  ],
};

const DIVISION_NAMES: Record<string, string> = {
  WRAP: 'Wrapping & Luggage',
  CELL: 'Cellular & Gadget',
  REFL: 'Refleksi & Fragrance',
  MINI: 'Minimarket & Kiosk',
  FNB: 'Food & Beverage',
  MC: 'Money Changer',
  ACC: 'Accounting Center',
};

export function DailyReportInputModal({
  isOpen,
  onClose,
  userDivision,
  userName,
  onSubmit,
}: DailyReportInputModalProps) {
  const initialDivision: DailyRecord['division'] =
    userDivision && userDivision in DEFAULT_TARGETS
      ? (userDivision as DailyRecord['division'])
      : 'WRAP';

  const [formDivision, setFormDivision] = useState<DailyRecord['division']>(initialDivision);
  const activeDivision = userDivision ? (userDivision as DailyRecord['division']) : formDivision;

  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0] ?? '');
  const [formShift, setFormShift] = useState<DailyRecord['shift']>('Full Day (All Shifts)');
  const [formOutletCode, setFormOutletCode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formTarget, setFormTarget] = useState<string>('40000000');
  const [formRevenue, setFormRevenue] = useState<string>('');
  const [formCash, setFormCash] = useState<string>('');
  const [formEdc, setFormEdc] = useState<string>('');
  const [formQris, setFormQris] = useState<string>('');
  const [formTxCount, setFormTxCount] = useState<string>('');
  const [formBatchNo, setFormBatchNo] = useState<string>('');
  const [formAttachmentName, setFormAttachmentName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableOutlets: RealOutlet[] = getRealOutlets(activeDivision);

  // Reset form when modal opens or division changes
  useEffect(() => {
    if (isOpen) {
      const defTarget = DEFAULT_TARGETS[activeDivision] ?? 40000000;
      setFormTarget(String(defTarget));
      const categories = DIVISION_SERVICE_CATEGORIES[activeDivision] ?? [];
      if (categories.length > 0 && categories[0]) {
        setFormCategory(categories[0]);
      }
      if (availableOutlets.length > 0 && !formOutletCode && availableOutlets[0]) {
        setFormOutletCode(availableOutlets[0].code);
      }
    }
  }, [isOpen, activeDivision]);

  // When division changes, update outlets and categories
  const handleDivisionChange = (div: DailyRecord['division']) => {
    setFormDivision(div);
    const defTarget = DEFAULT_TARGETS[div] ?? 40000000;
    setFormTarget(String(defTarget));
    const categories = DIVISION_SERVICE_CATEGORIES[div] ?? [];
    if (categories.length > 0 && categories[0]) {
      setFormCategory(categories[0]);
    }
    const newOutlets = getRealOutlets(div);
    if (newOutlets.length > 0 && newOutlets[0]) {
      setFormOutletCode(newOutlets[0].code);
    } else {
      setFormOutletCode('');
    }
  };

  if (!isOpen) return null;

  // Perhitungan Otomatis
  const numRevenue = parseFloat(formRevenue) || 0;
  const numTarget = parseFloat(formTarget) || 1;
  const numCash = parseFloat(formCash) || 0;
  const numEdc = parseFloat(formEdc) || 0;
  const numQris = parseFloat(formQris) || 0;
  const sumBreakdown = numCash + numEdc + numQris;
  const isBalanced = Math.abs(numRevenue - sumBreakdown) < 1;
  const achievementPct = Math.round((numRevenue / numTarget) * 100);
  const numTxCount = parseInt(formTxCount, 10) || 0;
  const avgTicket = numTxCount > 0 ? Math.round(numRevenue / numTxCount) : 0;

  // Selected outlet object
  const selectedOutletObj = availableOutlets.find((o) => o.code === formOutletCode);

  // Auto-calculate Total Omset from Breakdown
  const handleSumToRevenue = () => {
    setFormRevenue(String(sumBreakdown));
  };

  // Auto-distribute Total Omset to Breakdown (45% EDC, 30% QRIS, 25% Tunai)
  const handleDistributePayment = () => {
    if (numRevenue > 0) {
      const edcVal = Math.round(numRevenue * 0.45);
      const qrisVal = Math.round(numRevenue * 0.3);
      const cashVal = numRevenue - edcVal - qrisVal;
      setFormEdc(String(edcVal));
      setFormQris(String(qrisVal));
      setFormCash(String(cashVal));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (numRevenue <= 0) {
      setValidationError('Nominal realisasi omset wajib diisi lebih dari 0.');
      return;
    }

    if (!formDate) {
      setValidationError('Tanggal laporan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    const divName = DIVISION_NAMES[activeDivision] ?? activeDivision;
    const outletName = selectedOutletObj ? selectedOutletObj.name : 'Konsolidasi Divisi';

    onSubmit({
      date: formDate,
      division: activeDivision,
      divisionName: divName,
      outletCode: formOutletCode || undefined,
      outletName: outletName,
      shift: formShift,
      categoryService: formCategory || undefined,
      revenue: numRevenue,
      target: numTarget,
      cashAmount: numCash,
      edcAmount: numEdc,
      qrisAmount: numQris,
      transactionCount: numTxCount,
      attachmentName: formAttachmentName || (formBatchNo ? `Batch EDC ${formBatchNo}` : undefined),
      notes: formNotes,
      updatedBy: userName ?? `Admin ${divName}`,
    });

    setIsSubmitting(false);
    onClose();
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-report-input-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      data-testid="daily-report-input-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in-up"
      >
        {/* Header - Compact Single Line */}
        <div className="shrink-0 px-5 py-3 border-b border-line bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FileCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 id="daily-report-input-title" className="text-sm sm:text-base font-bold text-navy leading-tight">
                Input Omset Harian — Divisi {DIVISION_NAMES[activeDivision] ?? activeDivision}
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencatatan realisasi omset, rincian kasir, dan settlement harian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            data-testid="btn-close-modal"
            aria-label="Tutup Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body - Clean, Compact Spacing */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {validationError && (
            <div className="rounded-lg bg-danger/10 border border-danger/30 p-2 flex items-center gap-2 text-danger font-medium text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* SEKSI 1: Outlet, Tanggal, Shift, Divisi */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Laporan <span className="text-danger">*</span>
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  data-testid="input-date"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Divisi <span className="text-danger">*</span>
                </label>
                {userDivision ? (
                  <div className="flex items-center justify-between h-8 px-2.5 rounded-input border border-line bg-white text-xs font-bold text-navy">
                    <span className="truncate">{userDivision} - {DIVISION_NAMES[userDivision]}</span>
                    <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                  </div>
                ) : (
                  <select
                    value={formDivision}
                    onChange={(e) => handleDivisionChange(e.target.value as DailyRecord['division'])}
                    className="w-full h-8 rounded-input border border-line bg-white px-2 text-xs font-medium text-navy focus:border-primary focus:outline-none"
                    data-testid="select-division"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value as DailyRecord['shift'])}
                  className="w-full h-8 rounded-input border border-line bg-white px-2 text-xs font-medium text-navy focus:border-primary focus:outline-none"
                >
                  <option value="Full Day (All Shifts)">Full Day (24 Jam)</option>
                  <option value="Pagi (06:00 - 14:00)">Pagi (06:00 - 14:00)</option>
                  <option value="Siang/Sore (14:00 - 22:00)">Siang/Sore (14:00 - 22:00)</option>
                </select>
              </div>
            </div>

            {/* Outlet Sobat API & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Outlet Bandara ({availableOutlets.length} Unit)
                </label>
                <select
                  value={formOutletCode}
                  onChange={(e) => setFormOutletCode(e.target.value)}
                  className="w-full h-8 rounded-input border border-line bg-white px-2 text-xs font-medium text-navy focus:border-primary focus:outline-none"
                  data-testid="select-outlet"
                >
                  <option value="">-- Pilih Outlet Bandara --</option>
                  {availableOutlets.map((o) => (
                    <option key={o.code} value={o.code}>
                      {o.code} — {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Layanan / Produk
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-8 rounded-input border border-line bg-white px-2 text-xs font-medium text-navy focus:border-primary focus:outline-none"
                >
                  {(DIVISION_SERVICE_CATEGORIES[activeDivision] ?? []).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEKSI 2: Target & Realisasi Omset */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-success" /> Omset & Target Harian
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                achievementPct >= 100 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
              }`}>
                Capaian: {achievementPct}%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Target Harian (Rp)</label>
                  <span className="text-[10px] text-slate-500 font-mono">Rp {numTarget.toLocaleString('id-ID')}</span>
                </div>
                <Input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="40000000"
                  data-testid="input-target"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Realisasi Omset (Rp) <span className="text-danger">*</span></label>
                  <span className="text-[10px] text-primary font-bold font-mono">Rp {numRevenue.toLocaleString('id-ID')}</span>
                </div>
                <Input
                  type="number"
                  value={formRevenue}
                  onChange={(e) => setFormRevenue(e.target.value)}
                  required
                  placeholder="45000000"
                  data-testid="input-revenue"
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* SEKSI 3: Rincian Kanal Pembayaran Kasir */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Rincian Metode Pembayaran Kasir
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSumToRevenue}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Gunakan total rincian sebagai nilai omset"
                >
                  Hitung Total
                </button>
                <button
                  type="button"
                  onClick={handleDistributePayment}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                  title="Bagi rata proporsi kasir otomatis"
                >
                  Bagi Rata
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-amber-600" /> Cash / Tunai
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Rp {numCash.toLocaleString('id-ID')}</span>
                </div>
                <Input
                  type="number"
                  value={formCash}
                  onChange={(e) => setFormCash(e.target.value)}
                  placeholder="0"
                  className="h-8 text-xs font-mono"
                  data-testid="input-cash"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-blue-600" /> Mesin EDC
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Rp {numEdc.toLocaleString('id-ID')}</span>
                </div>
                <Input
                  type="number"
                  value={formEdc}
                  onChange={(e) => setFormEdc(e.target.value)}
                  placeholder="0"
                  className="h-8 text-xs font-mono"
                  data-testid="input-edc"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                    <QrCode className="h-3 w-3 text-emerald-600" /> QRIS / Transfer
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Rp {numQris.toLocaleString('id-ID')}</span>
                </div>
                <Input
                  type="number"
                  value={formQris}
                  onChange={(e) => setFormQris(e.target.value)}
                  placeholder="0"
                  className="h-8 text-xs font-mono"
                  data-testid="input-qris"
                />
              </div>
            </div>

            {/* Status Klop Inline */}
            <div className={`px-2.5 py-1.5 rounded-md flex items-center justify-between text-[11px] font-semibold ${
              isBalanced ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}>
              <span>
                Total Rincian: Rp {sumBreakdown.toLocaleString('id-ID')}{' '}
                {isBalanced ? '(Klop 100%)' : `(Selisih Rp ${Math.abs(numRevenue - sumBreakdown).toLocaleString('id-ID')})`}
              </span>
              {!isBalanced && (
                <button type="button" onClick={handleSumToRevenue} className="underline font-bold">
                  Samakan
                </button>
              )}
            </div>
          </div>

          {/* SEKSI 4: Volume Transaksi & Lampiran Batch EDC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Transaksi (Pax / Struk)
              </label>
              <Input
                type="number"
                value={formTxCount}
                onChange={(e) => setFormTxCount(e.target.value)}
                placeholder="150"
                data-testid="input-tx-count"
                className="h-8 text-xs"
              />
              <p className="mt-1 text-[10px] text-slate-500 font-mono">
                Basket Size: <strong>Rp {avgTicket.toLocaleString('id-ID')}</strong> / pax
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
              <label className="block font-semibold text-slate-700 mb-1">
                Settlement EDC / Slip Bukti
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  type="text"
                  value={formBatchNo}
                  onChange={(e) => setFormBatchNo(e.target.value)}
                  placeholder="Batch EDC"
                  data-testid="input-batch-no"
                  className="h-8 text-xs"
                />
                <input
                  type="text"
                  value={formAttachmentName}
                  onChange={(e) => setFormAttachmentName(e.target.value)}
                  placeholder="Nama file bukti"
                  className="h-8 rounded-input border border-line px-2 text-xs bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SEKSI 5: Catatan Operasional */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Operasional (Opsional)
            </label>
            <Input
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Catatan kondisi operasional lapangan..."
              data-testid="input-notes"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Footer - Fixed Single Row */}
        <div className="shrink-0 px-5 py-3 border-t border-line bg-slate-50 flex items-center justify-between">
          <div className="text-[11px]">
            {numRevenue > 0 && isBalanced ? (
              <span className="text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Rincian klop 100%
              </span>
            ) : numRevenue > 0 ? (
              <span className="text-danger font-semibold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-danger" /> Selisih Rp {Math.abs(numRevenue - sumBreakdown).toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="text-slate-400">Masukkan omset kasir</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting} className="h-8 text-xs px-3">
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-8 bg-primary hover:bg-primary-dark text-white font-bold text-xs px-4 shadow-sm"
              data-testid="btn-submit-daily-report"
            >
              {isSubmitting ? 'Memproses...' : 'Submit Laporan ke Manager'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
