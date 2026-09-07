import React from 'react';
import { Clock, Check, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export interface PendingApprovalItem {
  id: string;
  division: string;
  name: string;
  revenue: number;
  date: string;
  admin: string;
}

export interface ManagerApprovalQueueWidgetProps {
  items: PendingApprovalItem[];
  onApprove: (id: string) => void;
}

export function ManagerApprovalQueueWidget({ items, onApprove }: ManagerApprovalQueueWidgetProps) {
  return (
    <section className="rounded-card-lg border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white backdrop-blur-md p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-navy flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" /> Manager Approval Center (Pending ACC)
          </h2>
          <p className="text-xs text-slate-700 mt-1 font-medium">Crosscheck dan setujui laporan yang di-submit oleh Admin Divisi</p>
        </div>
        <span className="rounded-pill bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
          {items.length} Perlu Verifikasi
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-card border border-line/60 bg-white p-4 gap-3 shadow-2xs">
              <div>
                <span className="rounded-pill bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-navy">{item.division} - {item.name}</span>
                <p className="mt-1 text-sm font-bold text-navy">Omset Input: Rp {item.revenue.toLocaleString('id-ID')}</p>
                <p className="text-xs text-slate-700 font-medium">Disubmit oleh {item.admin} pada {item.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onApprove(item.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs">
                  <Check className="mr-1 h-3.5 w-3.5" /> Setujui (ACC)
                </Button>
                <Link to="/laporan-harian">
                  <Button size="sm" variant="secondary" className="text-xs font-semibold">Detail</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-card border border-emerald-200 bg-emerald-50/60 p-4 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-800" />
          <p className="mt-1 text-sm font-bold text-emerald-800">Semua Laporan Divisi Telah Di-ACC</p>
        </div>
      )}
    </section>
  );
}
