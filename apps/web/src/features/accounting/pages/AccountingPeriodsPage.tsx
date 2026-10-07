import { hasCapability } from '../../../session/capability';
import { useState } from "react";
import { CalendarDays, Clock, ShieldCheck, CheckCircle2, CalendarClock, History } from "lucide-react";
import { accountingApi } from "../../../api/accounting";
import { AccountingQueryState } from "../../../components/accounting/AccountingStates";
import { useToast } from "../../../components/ui/Toast";
import { useAccountingPeriods } from "../../../hooks/useAccounting";
import { useAuth } from "../../../session/AuthContext";
import { StatusPill } from "../../../components/StatusPill";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

export default function AccountingPeriodsPage() {
  const query = useAccountingPeriods();
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState("");

  const transition = async (id: string, status: string) => {
    setBusy(id);
    try {
      await accountingApi.transitionPeriod(id, status);
      toast("Status periode berhasil diperbarui", "success");
      await query.refetch();
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Gagal memperbarui periode",
        "error"
      );
    } finally {
      setBusy("");
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draf",
      pending_approval: "Menunggu persetujuan",
      needs_correction: "Perlu koreksi",
      approved: "Disetujui",
      closed: "Selesai",
      reopened: "Dibuka kembali",
    };
    return labels[status.toLowerCase()] || status;
  };

  const isAdmin = hasCapability(user?.role ?? '', 'submit:acc_period', user?.divisionCode);
  const isManager = hasCapability(user?.role ?? '', 'manage:acc_period', user?.divisionCode);

  // KPIs
  const totalPeriods = query.data?.length ?? 0;
  const pendingPeriods =
    query.data?.filter((p) => p.status === "pending_approval").length ?? 0;
  const closedPeriods =
    query.data?.filter((p) => p.status === "closed" || p.status === "approved").length ?? 0;

  return (
    <section className="space-y-8 pb-12 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-navy">
            Periode Accounting
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            {isAdmin
              ? "Kelola siklus akuntansi tiap bulan. Ajukan periode yang sudah direkonsiliasi kepada manager."
              : "Review dan setujui periode akuntansi yang telah diajukan oleh admin."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 rounded-md text-slate-600">
            <ShieldCheck className="w-4 h-4 text-primary" />
            {isAdmin ? "Akses Admin" : isManager ? "Akses Manager" : "Hanya baca"}
          </span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Total Periode
            </p>
            <p className="text-2xl font-black text-navy mt-1">{totalPeriods}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Menunggu Persetujuan
            </p>
            <p className="text-2xl font-black text-navy mt-1">
              {pendingPeriods}
            </p>
          </div>
        </Card>
        <Card className="p-5 flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Disetujui / Selesai
            </p>
            <p className="text-2xl font-black text-navy mt-1">
              {closedPeriods}
            </p>
          </div>
        </Card>
      </div>

      <div className="rounded-card border border-line bg-white flex flex-col overflow-hidden">
        <div className="border-b border-line bg-slate-50/50 p-4">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Histori & Status Siklus
          </h2>
        </div>

        <div className="p-6">
          <AccountingQueryState
            loading={query.isLoading}
            error={query.error}
            empty={!query.data?.length}
            retry={() => void query.refetch()}
          >
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {query.data?.map((p) => {
                const isDraft = ["draft", "reopened"].includes(p.status);
                const isPending = p.status === "pending_approval";
                
                return (
                  <Card
                    key={p.id}
                    className="flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow border-line"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-primary bg-primary/5 px-2 py-1 rounded-md">
                          <CalendarClock className="w-4 h-4" />
                          <h2 className="font-bold text-sm tracking-wide uppercase">
                            {p.periodMonth}
                          </h2>
                        </div>
                        <StatusPill status={getStatusLabel(p.status)} />
                      </div>
                      
                      <div className="space-y-2 mt-4 text-sm text-slate-600">
                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                          <span className="text-slate-400">Total Transaksi</span>
                          <span className="font-medium text-navy">{p.transactionCount ?? 0} tx</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-400">Terakhir Update</span>
                          <span className="font-medium text-navy">
                            {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-4 bg-slate-50/50 border-t border-line mt-auto">
                      {isAdmin && isDraft && (
                        <Button
                          disabled={busy === p.id}
                          onClick={() => void transition(p.id, "pending_approval")}
                          className="w-full shadow-sm"
                          size="sm"
                        >
                          Ajukan ke Manager
                        </Button>
                      )}
                      {isAdmin && !isDraft && (
                        <p className="text-[11px] text-center text-slate-400 font-medium italic">
                          Menunggu aksi Manager
                        </p>
                      )}

                      {isManager && isPending && (
                        <div className="flex w-full gap-2">
                          <Button
                            variant="secondary"
                            disabled={busy === p.id}
                            onClick={() => void transition(p.id, "needs_correction")}
                            className="flex-1 shadow-sm bg-white"
                            size="sm"
                          >
                            Koreksi
                          </Button>
                          <Button
                            disabled={busy === p.id}
                            onClick={() => void transition(p.id, "approved")}
                            className="flex-1 shadow-sm"
                            size="sm"
                          >
                            Setujui
                          </Button>
                        </div>
                      )}
                      {isManager && !isPending && (
                        <p className="text-[11px] text-center text-slate-400 font-medium italic">
                          {p.status === 'draft' ? 'Sedang direkonsiliasi oleh Admin' : 'Siklus ini telah selesai'}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </AccountingQueryState>
        </div>
      </div>
    </section>
  );
}
