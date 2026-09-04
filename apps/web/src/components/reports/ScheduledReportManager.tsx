import { useState } from 'react';
import {
  Clock,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Power,
  Sparkles,
  Smartphone,
  Globe,
  Loader2,
} from 'lucide-react';

export interface ScheduledReport {
  id: string;
  title: string;
  description: string;
  frequency: string;
  triggerTime: string;
  channels: ('email' | 'whatsapp' | 'webhook')[];
  recipients: string;
  lastSentAt: string;
  isActive: boolean;
  format: 'PDF' | 'Excel/CSV' | 'Both';
}

const DEFAULT_SCHEDULES: ScheduledReport[] = [
  {
    id: 'sch-daily-flash',
    title: 'Flash Report Penutupan Omzet Harian',
    description: 'Ringkasan setoran kasir, omzet aktual per divisi, dan deviasi target',
    frequency: 'Harian (Setiap Hari)',
    triggerTime: '21:00 WIB',
    channels: ['email', 'whatsapp'],
    recipients: 'Direksi (BOD), GM Operasional, Kepala Toko',
    lastSentAt: '04 Sep 2026, 21:00 WIB',
    isActive: true,
    format: 'Both',
  },
  {
    id: 'sch-weekly-aging',
    title: 'Rekapitulasi Aging Tagihan Piutang Mingguan',
    description: 'Daftar invoice outstanding bucket 31-60 dan >60 hari untuk tim penagihan',
    frequency: 'Mingguan (Setiap Senin)',
    triggerTime: '08:00 WIB',
    channels: ['email'],
    recipients: 'Manager Finance, Tim Piutang (AR), Auditor Internal',
    lastSentAt: '01 Sep 2026, 08:00 WIB',
    isActive: true,
    format: 'Excel/CSV',
  },
  {
    id: 'sch-monthly-consolidation',
    title: 'Laporan Konsolidasi Finansial & P&L Bulanan',
    description: 'Paket lengkap laporan keuangan komprehensif, arus kas waterfall, dan audit',
    frequency: 'Bulanan (Setiap Tanggal 1)',
    triggerTime: '07:00 WIB',
    channels: ['email', 'webhook'],
    recipients: 'Dewan Komisaris, Direksi Utama, Partner Finansial',
    lastSentAt: '01 Sep 2026, 07:00 WIB',
    isActive: true,
    format: 'PDF',
  },
  {
    id: 'sch-daily-reconciliation',
    title: 'Hasil Pencocokan Rekonsiliasi 31 Bank',
    description: 'Verifikasi kesesuaian saldo mutasi bank vs pencatatan buku besar',
    frequency: 'Harian (Senin - Jumat)',
    triggerTime: '17:30 WIB',
    channels: ['email'],
    recipients: 'Supervisor Akuntansi, Tim Treasury',
    lastSentAt: '04 Sep 2026, 17:30 WIB',
    isActive: false,
    format: 'PDF',
  },
];

interface ScheduledReportManagerProps {
  onManualTrigger?: (reportId: string) => void;
}

export function ScheduledReportManager({ onManualTrigger }: ScheduledReportManagerProps) {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(DEFAULT_SCHEDULES);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item,
      ),
    );
  };

  const handleSendNow = (report: ScheduledReport) => {
    setSendingId(report.id);
    setTimeout(() => {
      setSendingId(null);
      setSuccessToast(`Laporan "${report.title}" berhasil dikirimkan ke ${report.recipients}!`);
      onManualTrigger?.(report.id);
      setTimeout(() => {
        setSuccessToast(null);
      }, 4000);
    }, 600);
  };

  return (
    <div className="space-y-4" data-testid="scheduled-report-manager">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-card-lg border border-line/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-navy">Jadwal Distribusi Laporan Otomatis</h3>
            <span className="rounded-md bg-sky-100 text-sky-800 font-bold text-[10px] px-2 py-0.5 border border-sky-200">
              Cron Engine Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem pengiriman laporan otomatis berbasis waktu ke email eksekutif & grup WhatsApp operasional
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div
          className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 animate-in fade-in"
          data-testid="schedule-success-toast"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Cards List */}
      <div className="grid gap-3.5 md:grid-cols-2">
        {schedules.map((sch) => {
          const isSending = sendingId === sch.id;
          return (
            <div
              key={sch.id}
              className={`rounded-xl border p-4.5 transition-all duration-200 ${
                sch.isActive
                  ? 'bg-white border-sky-200/80 shadow-xs hover:border-sky-300'
                  : 'bg-slate-50/70 border-slate-200 opacity-80'
              }`}
              data-testid={`schedule-card-${sch.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        sch.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                      data-testid={`schedule-status-${sch.id}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          sch.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {sch.isActive ? 'Aktif Terjadwal' : 'Dijeda'}
                    </span>
                    <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                      Format: {sch.format}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-navy mt-1.5 leading-snug">{sch.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{sch.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleActive(sch.id)}
                  title={sch.isActive ? 'Jeda pengiriman otomatis' : 'Aktifkan jadwal pengiriman'}
                  aria-pressed={sch.isActive}
                  className={`shrink-0 rounded-lg p-1.5 border transition-all ${
                    sch.isActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 border-slate-300 text-slate-400 hover:text-slate-700'
                  }`}
                  data-testid={`toggle-schedule-${sch.id}`}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>

              {/* Schedule Metadata */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">{sch.frequency} · {sch.triggerTime}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-slate-400">Kanal:</span>
                  <div className="flex items-center gap-1">
                    {sch.channels.includes('email') && (
                      <span title="Distribusi Email" className="p-1 rounded bg-slate-100 text-slate-600">
                        <Mail className="h-3 w-3" />
                      </span>
                    )}
                    {sch.channels.includes('whatsapp') && (
                      <span title="Notifikasi WhatsApp" className="p-1 rounded bg-emerald-100 text-emerald-700">
                        <Smartphone className="h-3 w-3" />
                      </span>
                    )}
                    {sch.channels.includes('webhook') && (
                      <span title="Webhook Sistem" className="p-1 rounded bg-purple-100 text-purple-700">
                        <Globe className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipients & Last Sent Footer */}
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
                <p className="text-slate-500 truncate">
                  Penerima: <strong className="text-slate-700">{sch.recipients}</strong>
                </p>

                <button
                  type="button"
                  onClick={() => handleSendNow(sch)}
                  disabled={isSending}
                  className="flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-100 active:scale-95 disabled:opacity-50 transition-all shrink-0"
                  data-testid={`send-now-${sch.id}`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-sky-700" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
                      <span>Kirim Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
