import React, { useState, useEffect, useCallback } from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { projectApi } from '../../../api/projects';
import { ProjectInvoice } from '../../../types/project';
import { Button } from '../../../components/ui/Button';
import {
  Plus,
  DollarSign,
  CreditCard,
  Calendar,
  FileText,
  CheckCircle2,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  Trash2,
  Receipt,
  Printer,
  Download,
} from 'lucide-react';

import { useAuth } from '../../../session/AuthContext';
import { hasCapability } from '../../../session/capability';
import { downloadInvoicePDF, printInvoicePDF } from '../../../utils/invoicePdf';

function ProjectPaymentsContent({ project, refreshProject }: { project: any; refreshProject: any }) {
  const { user } = useAuth();
  const canManage = Boolean(user && hasCapability(user.role, 'manage:projects', user.divisionCode));
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<ProjectInvoice | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    term_name: '',
    amount: '',
    due_date: '',
    project_milestone_id: '',
    notes: '',
  });

  const [payForm, setPayForm] = useState({
    paid_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-success-light text-success border border-success/30">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Lunas (Paid)
          </span>
        );
      case 'invoiced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-pulse" />
            Ditagihkan
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-danger-light text-danger border border-danger/30">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            Jatuh Tempo
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-surface text-slate-600 border border-line">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Draft
          </span>
        );
    }
  };

  const loadInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const data = await projectApi.getInvoices(project.id);
      setInvoices(data || []);
    } catch (e) {
      console.error('Failed to load invoices', e);
    } finally {
      setLoadingInvoices(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

        const contract = parseFloat(project.contract_value?.toString() || '0');
        const totalInvoiced = invoices.reduce((acc, curr) => acc + parseFloat(curr.amount?.toString() || '0'), 0);
        const totalPaid = invoices
          .filter((inv) => inv.status === 'paid')
          .reduce((acc, curr) => acc + parseFloat(curr.amount?.toString() || '0'), 0);
        const remainingUnpaid = contract - totalPaid;
        const paidPercentage = contract > 0 ? (totalPaid / contract) * 100 : 0;

        const handleAddInvoice = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            setSubmitting(true);
            await projectApi.addInvoice(project.id, {
              term_name: invoiceForm.term_name,
              amount: parseFloat(invoiceForm.amount) || 0,
              due_date: invoiceForm.due_date || undefined,
              project_milestone_id: invoiceForm.project_milestone_id ? Number(invoiceForm.project_milestone_id) : undefined,
              notes: invoiceForm.notes || undefined,
            });
            await loadInvoices();
            await refreshProject();
            setShowAddInvoiceModal(false);
            setInvoiceForm({ term_name: '', amount: '', due_date: '', project_milestone_id: '', notes: '' });
          } catch (err: any) {
            alert(err.message || 'Gagal menambahkan tagihan termin');
          } finally {
            setSubmitting(false);
          }
        };

        const handleConfirmPayment = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!payingInvoice) return;
          try {
            setSubmitting(true);
            await projectApi.markInvoicePaid(project.id, payingInvoice.id, {
              paid_date: payForm.paid_date,
              payment_reference: payForm.payment_reference,
              notes: payForm.notes,
            });
            await loadInvoices();
            await refreshProject();
            setPayingInvoice(null);
            setPayForm({ paid_date: new Date().toISOString().split('T')[0], payment_reference: '', notes: '' });
          } catch (err: any) {
            alert(err.message || 'Gagal memproses konfirmasi pelunasan');
          } finally {
            setSubmitting(false);
          }
        };

        const handleDeleteInvoice = async (invId: number) => {
          if (!confirm('Hapus faktur / termin tagihan ini?')) return;
          try {
            await projectApi.deleteInvoice(project.id, invId);
            await loadInvoices();
            await refreshProject();
          } catch (err: any) {
            alert(err.message || 'Gagal menghapus tagihan');
          }
        };

        return (
          <div className="space-y-6">
            {/* KPI STATS ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Kontrak</p>
                <h3 className="mt-1.5 text-2xl font-bold text-navy">{formatCurrency(contract)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Nilai bruto proyek</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Termin Ditagihkan</p>
                <h3 className="mt-1.5 text-2xl font-bold text-primary-600">{formatCurrency(totalInvoiced)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{invoices.length} faktur penagihan</p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kas Masuk (Lunas)</p>
                <h3 className="mt-1.5 text-2xl font-bold text-success">{formatCurrency(totalPaid)}</h3>
                <p className="text-xs font-semibold text-success mt-0.5">
                  {paidPercentage.toFixed(1)}% dari nilai kontrak
                </p>
              </div>

              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sisa Piutang Berjalan</p>
                <h3 className="mt-1.5 text-2xl font-bold text-slate-700">{formatCurrency(remainingUnpaid)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Belum terealisasi kas</p>
              </div>
            </div>

            {/* ACTION TOOLBAR */}
            <div className="rounded-card-lg border border-line bg-white p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-navy">Faktur & Termin Penagihan Klien</h3>
                <p className="text-xs text-slate-500">Daftar termin resmi yang diterbitkan dan status pencairan</p>
              </div>
              {canManage && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowAddInvoiceModal(true)}
                  className="shrink-0 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  Terbitkan Faktur Termin Baru
                </Button>
              )}
            </div>

            {/* INVOICES TABLE */}
            <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface text-slate-600 font-semibold border-b border-line">
                    <tr>
                      <th className="px-5 py-3.5 w-12 text-center">No</th>
                      <th className="px-5 py-3.5">Faktur / Uraian Termin</th>
                      <th className="px-5 py-3.5">Milestone Terkait</th>
                      <th className="px-5 py-3.5 text-right">Nominal Tagihan</th>
                      <th className="px-5 py-3.5 text-center">Jatuh Tempo</th>
                      <th className="px-5 py-3.5 text-center">Status Pembayaran</th>
                      <th className="px-5 py-3.5">Ref. Transaksi</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {invoices.length > 0 ? (
                      invoices.map((inv, idx) => {
                        const amount = parseFloat(inv.amount?.toString() || '0');
                        const isPaid = inv.status === 'paid';
                          const relatedMilestone = project.milestones?.find((m: any) => m.id === inv.project_milestone_id);

                        return (
                          <tr key={inv.id} className="hover:bg-surface/80 transition-colors">
                            <td className="px-5 py-3.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-navy">{inv.term_name}</p>
                              {inv.notes && <p className="text-[11px] text-slate-400 mt-0.5">{inv.notes}</p>}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {relatedMilestone ? (
                                <span className="inline-flex items-center gap-1 font-medium text-navy">
                                  {relatedMilestone.title} ({relatedMilestone.weight_percentage}%)
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">-</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-navy text-sm">
                              {formatCurrency(amount)}
                            </td>
                            <td className="px-5 py-3.5 text-center text-slate-600 font-medium">
                              {inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {getInvoiceStatusBadge(inv.status)}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                              {inv.payment_reference || (isPaid ? 'Transfer Bank' : '-')}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => printInvoicePDF(project, inv)}
                                  className="p-1.5 rounded-input text-slate-500 hover:text-navy hover:bg-slate-100 transition-colors"
                                  title="Cetak Faktur (Print)"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadInvoicePDF(project, inv)}
                                  className="p-1.5 rounded-input text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                  title="Unduh Dokumen Faktur (PDF)"
                                >
                                  <Download className="h-4 w-4" />
                                </button>

                                {canManage && (
                                  <>
                                    {!isPaid ? (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setPayingInvoice(inv)}
                                        className="text-[11px] text-success hover:border-success/40 ml-1"
                                      >
                                        <Check className="h-3 w-3 mr-1 text-success" />
                                        Tandai Lunas
                                      </Button>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium ml-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                        {inv.paid_date ? new Date(inv.paid_date).toLocaleDateString('id-ID') : 'Lunas'}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInvoice(inv.id)}
                                      className="p-1.5 rounded-input text-slate-400 hover:text-danger hover:bg-danger-light/50 transition-colors ml-0.5"
                                      title="Hapus Faktur"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                          <Receipt className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">Belum ada faktur termin yang diterbitkan</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Buat tagihan termin baru untuk mengelola arus kas penagihan proyek ini.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MILESTONE PAYMENT CHECKLIST */}
            <div className="rounded-card border border-line bg-white shadow-card p-5">
              <h4 className="text-sm font-bold text-navy mb-1">Status Termin Berdasarkan Milestone Fisik</h4>
              <p className="text-xs text-slate-500 mb-4">
                Sinkronisasi cepat pembayaran termin dengan tahapan capaian fisik di lapangan.
              </p>

              <div className="divide-y divide-line">
                {project.milestones && project.milestones.length > 0 ? (
                  project.milestones.map((ms: any) => (
                    <div key={ms.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-navy">{ms.title}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Bobot: <strong>{ms.weight_percentage}%</strong></span>
                          <span>&bull;</span>
                          <span>Progres: <strong>{ms.actual_percentage || 0}%</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-pill border ${
                            ms.payment_status
                              ? 'bg-success-light text-success border-success/30'
                              : 'bg-surface text-slate-600 border-line'
                          }`}
                        >
                          {ms.payment_status ? 'Ditandai selesai secara administratif' : 'Belum ditandai selesai'}
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            aria-label={`Ubah penandaan administratif ${ms.title}`}
                            disabled={submitting}
                            onClick={async () => {
                              try {
                                await projectApi.togglePayment(project.id, ms.id, !ms.payment_status);
                                await refreshProject();
                              } catch (e: any) {
                                alert('Gagal update status pembayaran milestone');
                              }
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              ms.payment_status ? 'bg-success' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                ms.payment_status ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 italic">Belum ada tahapan milestone terdaftar.</p>
                )}
              </div>
            </div>

            {/* MODAL TERBITKAN FAKTUR BARU */}
            {showAddInvoiceModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-lg overflow-hidden">
                  <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
                    <div>
                      <h3 className="text-base font-bold text-navy">Terbitkan Faktur Termin Baru</h3>
                      <p className="text-xs text-slate-500">Buat penagihan termin berdasarkan milestone pekerjaan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddInvoiceModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleAddInvoice} className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Judul / Nama Termin <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: Termin 1 - Uang Muka DP 30%"
                        value={invoiceForm.term_name}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, term_name: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tautkan ke Milestone (Opsional)
                      </label>
                      <select
                        value={invoiceForm.project_milestone_id}
                        onChange={(e) => {
                          const mId = e.target.value;
                          const                           selectedM = project.milestones?.find((m: any) => String(m.id) === String(mId));
                          let calculatedAmount = invoiceForm.amount;
                          if (selectedM && contract > 0) {
                            calculatedAmount = String(Math.round((selectedM.weight_percentage / 100) * contract));
                          }
                          setInvoiceForm({
                            ...invoiceForm,
                            project_milestone_id: mId,
                            amount: calculatedAmount || invoiceForm.amount,
                          });
                        }}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                      >
                        <option value="">-- Tanpa Kaitan Milestone --</option>
                        {                        project.milestones?.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.title} ({m.weight_percentage}% Bobot)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nominal Tagihan (Rp) <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                          <input
                            required
                            type="number"
                            min="0"
                            value={invoiceForm.amount}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                            className="w-full rounded-input border border-line pl-9 pr-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Jatuh Tempo <span className="text-danger">*</span>
                        </label>
                        <input
                          required
                          type="date"
                          value={invoiceForm.due_date}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                          className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Catatan Rekening / Lampiran
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: No Rekening BCA 88301xxx a/n Perusahaan"
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                        className="w-full rounded-input border border-line p-3 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setShowAddInvoiceModal(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={submitting}
                      >
                        {submitting ? 'Menerbitkan...' : 'Terbitkan Faktur'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL KONFIRMASI PEMBAYARAN */}
            {payingInvoice && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-fade-in">
                <div className="bg-white rounded-card-lg shadow-xl border border-line w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-line flex justify-between items-center bg-surface">
                    <div>
                      <h3 className="text-base font-bold text-navy">Konfirmasi Penerimaan Dana</h3>
                      <p className="text-xs text-slate-500">{payingInvoice.term_name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPayingInvoice(null)}
                      className="text-slate-400 hover:text-slate-600 text-lg p-1"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
                    <div className="p-3.5 rounded-input bg-primary-50 border border-primary-200 text-xs">
                      <span className="text-slate-500">Nominal Pelunasan:</span>
                      <p className="text-lg font-bold text-navy">{formatCurrency(Number(payingInvoice.amount))}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tanggal Penerimaan Dana <span className="text-danger">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        value={payForm.paid_date}
                        onChange={(e) => setPayForm({ ...payForm, paid_date: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nomor Referensi Transaksi / Bukti Transfer
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: TRF-BCA-20261006-001"
                        value={payForm.payment_reference}
                        onChange={(e) => setPayForm({ ...payForm, payment_reference: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Catatan Tambahan
                      </label>
                      <input
                        type="text"
                        placeholder="Diterima via rekening operasional"
                        value={payForm.notes}
                        onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                        className="w-full rounded-input border border-line px-3.5 py-2 text-xs font-medium text-navy focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-line flex justify-end gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setPayingInvoice(null)}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={submitting}
                      >
                        {submitting ? 'Menyimpan...' : 'Konfirmasi Lunas'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

}

export default function ProjectPaymentsPage() {
  return (
    <ProjectPageLayout
      title="Progres Pembayaran & Termin"
      description="Kelola faktur penagihan termin ke klien, catat riwayat pelunasan kas masuk, dan pantau status piutang proyek."
    >
      {(project, refreshProject) => (
        <ProjectPaymentsContent project={project} refreshProject={refreshProject} />
      )}
    </ProjectPageLayout>
  );
}
