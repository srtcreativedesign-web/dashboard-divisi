import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  QrCode,
  Wallet,
  Receipt,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Calculator,
  Upload,
  Sparkles,
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
    'Pijat Relaksasi Refleksi 30 Menit',
    'Pijat Relaksasi Refleksi 60 Menit',
    'Head, Shoulder & Back Acupressure',
    'Sewa Kursi Pijat Digital Terminal',
    'Minyak Aromaterapi & Herbal Care',
  ],
  MINI: [
    'Minuman Dingin, Kopi Botol & Air Mineral',
    'Snack, Makanan Ringan & Biskuit',
    'Travel Toiletries & Perlengkapan Pribadi',
    'Rokok, Korek Api & Permen Kasir',
    'Oleh-oleh & Merchandise Bandara',
  ],
  FNB: [
    'Menu Makanan Utama (Bakso / Nasi / Mie)',
    'Kopi Spesialis & Minuman Segar',
    'Roti, Pastry & Kudapan Cepat Saji',
    'Paket Sarapan & Makan Siang Combo',
    'Central Kitchen & Bahan Baku Olahan',
  ],
  MC: [
    'Penukaran Valas Mayor (USD, EUR, SGD)',
    'Penukaran Valas Regional (MYR, THB, AUD)',
    'Penukaran Valas Haji/Umrah (SAR)',
    'Komisi Transaksi Kurs & Remittance',
  ],
  ACC: [
    'Pendapatan Jasa Shared Services',
    'Manajemen Fee Head Office',
    'Pendapatan Jasa Pembukuan & Rekonsiliasi',
    'Jasa Administrasi & Verifikasi Laporan',
  ],
};

const DIVISION_NAMES: Record<string, string> = {
  WRAP: 'Wrapping',
  CELL: 'Cellular',
  REFL: 'Refleksi',
  MINI: 'Minimarket',
  FNB: 'Food & Beverage',
  MC: 'Money Changer',
  ACC: 'Accounting & Finance',
};

export function DailyReportInputModal({
  isOpen,
  onClose,
  userRole,
  userDivision,
  userName,
  onSubmit,
}: DailyReportInputModalProps) {
  // Form State
  const [formDate, setFormDate] = useState('2026-09-03');
  const [formDivision, setFormDivision] = useState<DailyRecord['division']>(
    (userDivision as DailyRecord['division']) ?? 'WRAP'
  );
  const [formOutletCode, setFormOutletCode] = useState<string>('');
  const [formShift, setFormShift] = useState<DailyRecord['shift']>('Full Day (All Shifts)');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formRevenue, setFormRevenue] = useState<string>('45000000');
  const [formTarget, setFormTarget] = useState<string>('40000000');

  // Breakdown kanal pembayaran kasir
  const [formCash, setFormCash] = useState<string>('15000000');
  const [formEdc, setFormEdc] = useState<string>('20000000');
  const [formQris, setFormQris] = useState<string>('10000000');

  // Metrik transaksi & bukti
  const [formTxCount, setFormTxCount] = useState<string>('150');
  const [formBatchNo, setFormBatchNo] = useState<string>('');
  const [formAttachmentName, setFormAttachmentName] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // UI state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active division context
  const activeDivision = userDivision ? (userDivision as DailyRecord['division']) : formDivision;

  // Real outlets according to current division
  const availableOutlets = getRealOutlets(activeDivision);

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

  // Auto-distribute Total Omset to Breakdown (40% EDC, 35% QRIS, 25% Tunai)
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      data-testid="daily-report-input-modal"
    >
      <div className="relative w-full max-w-3xl my-8 rounded-card-lg bg-white p-6 shadow-2xl border border-slate-200 animate-fade-in-up">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              <FileCheck className="h-3.5 w-3.5" /> Formulir Standar Pelaporan Omset Harian
            </div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-navy">
              Input Omset Harian — Divisi {DIVISION_NAMES[activeDivision] ?? activeDivision}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              SOP Otorisasi: Rekam transaksi per outlet bandara, rincian pembayaran kasir, dan lampiran settlement EDC.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-card p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            data-testid="btn-close-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mt-4 rounded-card bg-danger/10 border border-danger/30 p-3 flex items-center gap-2 text-xs text-danger font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* SECTION 1: Identitas & Lokasi Outlet */}
          <div className="rounded-card-lg border border-line bg-slate-50/60 p-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> 1. Identitas Unit Operasional & Jadwal
            </h4>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Laporan <span className="text-danger">*</span>
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  data-testid="input-date"
                />
              </div>

              {/* Divisi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Divisi Operasional <span className="text-danger">*</span>
                </label>
                {userDivision ? (
                  <div className="flex items-center justify-between rounded-input border border-line bg-white p-2.5 text-xs font-bold text-navy shadow-2xs">
                    <span>{userDivision} - {DIVISION_NAMES[userDivision]}</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                      <Lock className="h-3 w-3" /> Scope Terkunci
                    </span>
                  </div>
                ) : (
                  <select
                    value={formDivision}
                    onChange={(e) => handleDivisionChange(e.target.value as DailyRecord['division'])}
                    className="w-full rounded-input border border-line bg-white p-2.5 text-xs font-medium text-navy focus:border-primary focus:outline-none shadow-2xs"
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

              {/* Shift Kerja */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Operasional</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value as DailyRecord['shift'])}
                  className="w-full rounded-input border border-line bg-white p-2.5 text-xs font-medium text-navy focus:border-primary focus:outline-none shadow-2xs"
                >
                  <option value="Full Day (All Shifts)">Full Day (Akumulasi 24 Jam)</option>
                  <option value="Pagi (06:00 - 14:00)">Shift Pagi (06:00 - 14:00)</option>
                  <option value="Siang/Sore (14:00 - 22:00)">Shift Siang/Sore (14:00 - 22:00)</option>
                </select>
              </div>
            </div>

            {/* Pilihan Outlet Sobat API Nyata */}
            <div className="pt-2 border-t border-line/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Outlet / Titik Layanan Bandara ({availableOutlets.length} Unit Tersedia)
                </label>
                {selectedOutletObj?.address && (
                  <span className="text-[11px] text-slate-500 font-mono italic">
                    Lokasi: {selectedOutletObj.address}
                  </span>
                )}
              </div>

              <select
                value={formOutletCode}
                onChange={(e) => setFormOutletCode(e.target.value)}
                className="w-full rounded-input border border-line bg-white p-2.5 text-xs font-semibold text-navy focus:border-primary focus:outline-none shadow-2xs"
                data-testid="select-outlet"
              >
                <option value="">-- Pilih Outlet / Cabang Spesifik --</option>
                {availableOutlets.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code} — {o.name} {o.address ? `(${o.address})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori Layanan Spesifik Divisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Layanan / Kategori Produk Dominan
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-input border border-line bg-white p-2.5 text-xs font-medium text-navy focus:border-primary focus:outline-none shadow-2xs"
              >
                {(DIVISION_SERVICE_CATEGORIES[activeDivision] ?? []).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 2: Target & Realisasi Omset Finansial */}
          <div className="rounded-card-lg border border-line bg-slate-50/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-success" /> 2. Omset & Target Operasional
              </h4>
              <span
                className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-bold ${
                  achievementPct >= 100
                    ? 'bg-success/10 text-success border border-success/30'
                    : achievementPct >= 80
                    ? 'bg-info/10 text-info border border-info/30'
                    : 'bg-warning/10 text-warning border border-warning/30'
                }`}
              >
                <Sparkles className="h-3 w-3" /> Pencapaian Target: {achievementPct}%
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Target Harian */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Harian (Rp)
                </label>
                <Input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="Contoh: 40000000"
                  data-testid="input-target"
                />
                <p className="mt-1 text-[11px] text-slate-500 font-mono">
                  Rp {numTarget.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Realisasi Omset */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Realisasi Omset Kasir (Rp) <span className="text-danger">*</span>
                </label>
                <Input
                  type="number"
                  value={formRevenue}
                  onChange={(e) => setFormRevenue(e.target.value)}
                  required
                  placeholder="Contoh: 45000000"
                  data-testid="input-revenue"
                />
                <p className="mt-1 text-[11px] font-bold font-mono text-primary">
                  Rp {numRevenue.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Rincian Kanal Pembayaran Kasir (SOP Rekonsiliasi Kasir & Bank) */}
          <div className="rounded-card-lg border border-line bg-slate-50/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-primary" /> 3. Rincian Metode Pembayaran Kasir
                </h4>
                <p className="text-[11px] text-slate-500">
                  Digunakan sebagai dasar pencocokan otomatis pada modul Rekonsiliasi Bank.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSumToRevenue}
                  className="inline-flex items-center gap-1 rounded-card bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 text-xs font-bold transition-colors"
                  title="Gunakan jumlah rincian kasir sebagai total omset"
                >
                  <Calculator className="h-3 w-3" /> Jumlahkan ke Total
                </button>
                <button
                  type="button"
                  onClick={handleDistributePayment}
                  className="inline-flex items-center gap-1 rounded-card bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 text-xs font-semibold transition-colors"
                  title="Bagi rata proporsi kasir otomatis"
                >
                  Bagi Otomatis
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-2">
              {/* Cash / Tunai */}
              <div className="rounded-card border border-line bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Wallet className="h-3.5 w-3.5 text-amber-600" /> Uang Tunai / Cash
                </div>
                <Input
                  type="number"
                  value={formCash}
                  onChange={(e) => setFormCash(e.target.value)}
                  placeholder="0"
                  className="text-xs font-mono"
                  data-testid="input-cash"
                />
                <p className="mt-1 text-[10px] text-slate-400 font-mono">
                  Rp {numCash.toLocaleString('id-ID')}
                </p>
              </div>

              {/* EDC Mesin */}
              <div className="rounded-card border border-line bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" /> EDC (BCA / Mandiri)
                </div>
                <Input
                  type="number"
                  value={formEdc}
                  onChange={(e) => setFormEdc(e.target.value)}
                  placeholder="0"
                  className="text-xs font-mono"
                  data-testid="input-edc"
                />
                <p className="mt-1 text-[10px] text-slate-400 font-mono">
                  Rp {numEdc.toLocaleString('id-ID')}
                </p>
              </div>

              {/* QRIS / Transfer */}
              <div className="rounded-card border border-line bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <QrCode className="h-3.5 w-3.5 text-emerald-600" /> QRIS & Transfer Bank
                </div>
                <Input
                  type="number"
                  value={formQris}
                  onChange={(e) => setFormQris(e.target.value)}
                  placeholder="0"
                  className="text-xs font-mono"
                  data-testid="input-qris"
                />
                <p className="mt-1 text-[10px] text-slate-400 font-mono">
                  Rp {numQris.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Rekapitulasi Klop Status */}
            <div
              className={`rounded-card p-2.5 flex items-center justify-between text-xs font-semibold ${
                isBalanced
                  ? 'bg-success/10 text-success border border-success/30'
                  : 'bg-warning/10 text-warning border border-warning/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>
                  Total Rincian: Rp {sumBreakdown.toLocaleString('id-ID')}{' '}
                  {isBalanced ? '(100% Klop dengan Total Omset)' : `(Selisih Rp ${Math.abs(numRevenue - sumBreakdown).toLocaleString('id-ID')})`}
                </span>
              </div>
              {!isBalanced && (
                <button
                  type="button"
                  onClick={handleSumToRevenue}
                  className="text-[11px] underline font-bold hover:text-navy"
                >
                  Samakan Total
                </button>
              )}
            </div>
          </div>

          {/* SECTION 4: Volume Transaksi & Lampiran Slip Settlement */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Volume Transaksi */}
            <div className="rounded-card-lg border border-line bg-slate-50/60 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-slate-600" /> 4. Volume Transaksi Kasir
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Transaksi / Struk (Pax)
                </label>
                <Input
                  type="number"
                  value={formTxCount}
                  onChange={(e) => setFormTxCount(e.target.value)}
                  placeholder="Contoh: 150"
                  data-testid="input-tx-count"
                />
                <p className="mt-1 text-[11px] text-slate-500 font-mono">
                  Rata-rata Nilai Belanja (Basket Size):{' '}
                  <strong className="text-navy">Rp {avgTicket.toLocaleString('id-ID')}</strong> / pax
                </p>
              </div>
            </div>

            {/* Lampiran Slip Settlement EDC / Kasir */}
            <div className="rounded-card-lg border border-line bg-slate-50/60 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-slate-600" /> 5. Lampiran Bukti Setoran / EDC
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Referensi / Batch Settlement EDC
                </label>
                <Input
                  type="text"
                  value={formBatchNo}
                  onChange={(e) => setFormBatchNo(e.target.value)}
                  placeholder="Contoh: BATCH-BCA-849102"
                  data-testid="input-batch-no"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={formAttachmentName}
                    onChange={(e) => setFormAttachmentName(e.target.value)}
                    placeholder="Nama file lampiran (slip_edc_outlet.pdf)"
                    className="w-full text-[11px] rounded-input border border-line p-1.5 bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Catatan Operasional */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Catatan Operasional & Kendala Lapangan
            </label>
            <Input
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Contoh: Lonjakan penumpang penerbangan malam, promosi bundling berhasil..."
              data-testid="input-notes"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md"
              data-testid="btn-submit-daily-report"
            >
              {isSubmitting ? 'Memproses...' : 'Submit Laporan ke Manager'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
