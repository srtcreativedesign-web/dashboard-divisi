import { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  X,
  FileText,
  Calendar,
  Layers,
  Save,
} from 'lucide-react';
import { INITIAL_INCIDENTS, type FinancialIncident, type IncidentStatus } from './incidentTypes';
import { formatCurrencyIDR } from '../reports/exportUtils';
import { useToast } from '../ui/Toast';

export interface IncidentResolutionBoardProps {
  incidents?: FinancialIncident[];
  onIncidentUpdate?: (incident: FinancialIncident) => void;
  className?: string;
}

export function IncidentResolutionBoard({
  incidents: initialIncidents = INITIAL_INCIDENTS,
  onIncidentUpdate,
  className = '',
}: IncidentResolutionBoardProps) {
  const [incidents, setIncidents] = useState<FinancialIncident[]>(initialIncidents);
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<FinancialIncident | null>(null);

  // Form states for resolution modal
  const [resolutionStatus, setResolutionStatus] = useState<IncidentStatus>('investigating');
  const [assignedPic, setAssignedPic] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const metrics = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === 'open').length;
    const investigating = incidents.filter((i) => i.status === 'investigating').length;
    const resolved = incidents.filter((i) => i.status === 'resolved').length;
    return { total, open, investigating, resolved };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.divisionName.toLowerCase().includes(q) ||
        item.divisionCode.toLowerCase().includes(q) ||
        item.traceId.toLowerCase().includes(q) ||
        (item.assignedPic && item.assignedPic.toLowerCase().includes(q))
      );
    });
  }, [incidents, statusFilter, searchQuery]);

  const handleOpenResolveModal = (incident: FinancialIncident) => {
    setSelectedIncident(incident);
    setResolutionStatus(incident.status === 'open' ? 'investigating' : incident.status);
    setAssignedPic(incident.assignedPic && incident.assignedPic !== 'Belum Ditugaskan' ? incident.assignedPic : 'Siti Rahmawati (Manager ACC)');
    setNotes(incident.notes || '');
  };

  const handleSaveResolution = () => {
    if (!selectedIncident) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const updated: FinancialIncident = {
        ...selectedIncident,
        status: resolutionStatus,
        assignedPic: assignedPic.trim() || 'Tim Investigasi',
        notes: notes.trim(),
        resolvedAt: resolutionStatus === 'resolved' ? new Date().toLocaleString('id-ID') : selectedIncident.resolvedAt,
      };

      setIncidents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setIsSubmitting(false);
      setSelectedIncident(null);

      if (onIncidentUpdate) {
        onIncidentUpdate(updated);
      }

      toast(
        resolutionStatus === 'resolved'
          ? `Anomali ${updated.id} berhasil ditandai terselesaikan.`
          : `Status anomali ${updated.id} diperbarui menjadi ${resolutionStatus}.`,
        'success',
      );
    }, 350);
  };

  const renderStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Perlu Tindakan
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Dalam Penelusuran
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Terselesaikan
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="incident-resolution-board">
      {/* Metric Cards Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Anomali</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-navy mt-1.5">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Seluruh temuan sistem</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold">Perlu Tindakan Segera</span>
            <AlertOctagon className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1.5">{metrics.open}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Menunggu penugasan PIC</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-semibold">Dalam Penelusuran</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-800 mt-1.5">{metrics.investigating}</p>
          <p className="text-[11px] text-amber-700/80 mt-0.5">Sedang dalam mitigasi</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold">Terselesaikan</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-800 mt-1.5">{metrics.resolved}</p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">Selesai & terverifikasi</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            data-testid="status-filter-all"
          >
            Semua ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'open'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
            data-testid="status-filter-open"
          >
            Perlu Tindakan ({metrics.open})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('investigating')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'investigating'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
            data-testid="status-filter-investigating"
          >
            Penelusuran ({metrics.investigating})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
            data-testid="status-filter-resolved"
          >
            Terselesaikan ({metrics.resolved})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, trace ID, divisi, PIC..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-navy placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            data-testid="incident-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table / Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {filteredIncidents.length === 0 ? (
          <div
            className="p-12 text-center flex flex-col items-center justify-center"
            data-testid="incidents-empty-state"
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-navy">Tidak ada anomali finansial</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Semua transaksi dan indikator finansial berada dalam parameter batas aman.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-slate-50/80 text-slate-500 font-semibold text-[11px]">
                  <th className="py-3 px-4">Anomali & Trace ID</th>
                  <th className="py-3 px-4">Divisi & Nilai</th>
                  <th className="py-3 px-4">Status & Waktu</th>
                  <th className="py-3 px-4">Penanggung Jawab (PIC)</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 bg-white">
                {filteredIncidents.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-sky-50/40 transition-colors"
                    data-testid={`incident-row-${item.id}`}
                  >
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-navy text-xs leading-snug">{item.title}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.traceId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ID: {item.id}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200">
                        {item.divisionName} ({item.divisionCode})
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {formatCurrencyIDR(item.amount)}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 align-top whitespace-nowrap">
                      <div>{renderStatusBadge(item.status)}</div>
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                        {item.detectedAt}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <p className="font-semibold text-slate-800 text-xs">
                        {item.assignedPic || 'Belum Ditugaskan'}
                      </p>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                          "{item.notes}"
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenResolveModal(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
                        data-testid={`resolve-btn-${item.id}`}
                      >
                        <span>Tindak Lanjuti</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Dialog Modal */}
      {selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolution-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          data-testid="incident-resolution-modal"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0c4a6e] via-[#0284c7] to-[#89b4e1]" />

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line/70 px-5 py-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] text-white shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="resolution-modal-title" className="text-base font-bold text-navy">
                    Tindak Lanjut & Mitigasi Anomali
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {selectedIncident.id} · Trace: {selectedIncident.traceId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                data-testid="modal-close-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Incident Summary Card */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900 text-xs">{selectedIncident.title}</span>
                  <span className="font-mono font-bold text-sky-800">
                    {formatCurrencyIDR(selectedIncident.amount)}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{selectedIncident.description}</p>
                <div className="text-[11px] text-slate-400">
                  Divisi: <strong>{selectedIncident.divisionName}</strong> · Terdeteksi:{' '}
                  {selectedIncident.detectedAt}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Perbarui Status Penanganan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('open')}
                    className={`py-2 px-2.5 rounded-xl border font-semibold text-center transition-all ${
                      resolutionStatus === 'open'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    data-testid="opt-status-open"
                  >
                    Perlu Tindakan
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('investigating')}
                    className={`py-2 px-2.5 rounded-xl border font-semibold text-center transition-all ${
                      resolutionStatus === 'investigating'
                        ? 'bg-amber-50 border-amber-400 text-amber-800 ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    data-testid="opt-status-investigating"
                  >
                    Penelusuran
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionStatus('resolved')}
                    className={`py-2 px-2.5 rounded-xl border font-semibold text-center transition-all ${
                      resolutionStatus === 'resolved'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    data-testid="opt-status-resolved"
                  >
                    Terselesaikan
                  </button>
                </div>
              </div>

              {/* Assignee PIC */}
              <div>
                <label htmlFor="assignee-input" className="block font-semibold text-slate-700 mb-1">
                  Penanggung Jawab (PIC):
                </label>
                <input
                  id="assignee-input"
                  type="text"
                  value={assignedPic}
                  onChange={(e) => setAssignedPic(e.target.value)}
                  placeholder="Nama PIC (contoh: Siti Rahmawati / Manager ACC)"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-navy focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  data-testid="assignee-input"
                />
              </div>

              {/* Notes / Mitigation input */}
              <div>
                <label htmlFor="notes-input" className="block font-semibold text-slate-700 mb-1">
                  Catatan Mitigasi / Tindak Lanjut:
                </label>
                <textarea
                  id="notes-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tuliskan keterangan perbaikan, bukti transaksi, atau alasan resolusi..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-navy focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                  data-testid="notes-input"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-line/70 px-5 py-3 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100"
                data-testid="cancel-resolution-btn"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveResolution}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                data-testid="save-resolution-btn"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Resolusi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
