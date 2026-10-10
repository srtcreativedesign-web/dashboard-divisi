import { useQueries, useQuery } from '@tanstack/react-query';
import { omzetApi } from '../../../api/omzet';
import { voucherApi } from '../../../api/vouchers';
import { hasCapability } from '../../../session/capability';
import { useAuth } from '../../../session/AuthContext';

export type WorkKind = 'omzet' | 'voucher';
export const workStatuses = ['correction', 'draft', 'submitted', 'pending_approval', 'done'] as const;
export type WorkStatus = typeof workStatuses[number];
export const workLabels: Record<WorkStatus, string> = { correction: 'Perlu koreksi', draft: 'Draf', submitted: 'Menunggu pemeriksaan', pending_approval: 'Menunggu Manager', done: 'Selesai diperiksa' };
export const currentWorkMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return parts.find(p => p.type === 'year')!.value + '-' + parts.find(p => p.type === 'month')!.value;
};
const isNonZero = (value: string | null | undefined) => Boolean(value && Number(value) !== 0);
const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function useAccountingWork(kind: WorkKind, month: string, outlet: string, status: WorkStatus, page: number) {
  const { user } = useAuth();
  const can = (capability: string) => hasCapability(user?.role ?? '', capability, user?.divisionCode);
  const writer = can(kind === 'omzet' ? 'write:omzet' : 'write:voucher');
  const reviewer = can(kind === 'omzet' ? 'validate:omzet' : 'validate:voucher');
  const approver = can(kind === 'omzet' ? 'approve:omzet' : 'approve:voucher');
  const allowed = can('view:acc_detail');
  const validMonth = /^20\d{2}-(0[1-9]|1[0-2])$/.test(month);
  const list = async (state: WorkStatus, requestedPage: number) => {
    const actualStatus = state === 'done' ? (kind === 'omzet' ? 'validated' : 'approved') : state;
    if (kind === 'omzet') {
      const { data } = await omzetApi.list({ month, outlet_id: outlet, status: actualStatus, page: String(requestedPage) });
      return { ...data, items: data.items.map(r => {
        const apRisk = r.requires_ap && isNonZero(r.ap_difference);
        const paymentRisk = isNonZero(r.payment_difference);
        return { id: r.id, date: r.business_date, context: `Shift ${r.shift}`, outlet: r.outlet_name, division: r.source_division_code, amount: r.outlet_amount, reference: r.source_reference, note: r.review_notes || r.decision_notes || r.notes, version: r.version, deadline: r.submission_window.deadline, canSubmit: r.submission_window.can_submit, requiresAp: r.requires_ap, paymentStatus: null as string | null, riskLevel: apRisk ? 'critical' : paymentRisk ? 'attention' : 'normal', riskNote: apRisk ? `Selisih laporan AP ${r.ap_difference}` : paymentRisk ? `Selisih kanal pembayaran ${r.payment_difference}` : r.requires_ap ? 'Laporan AP cocok' : 'Tanpa sumber AP' };
      }) };
    }
    const { data } = await voucherApi.list({ month, outlet_id: outlet, status: actualStatus, type: '', page: String(requestedPage) });
    return { ...data, items: data.items.map(r => {
      const overdue = r.due_date < localDate(); const urgent = r.priority === 'URGENT';
      return { id: r.id, date: r.voucher_date, context: r.voucher_no, outlet: r.outlet_name, division: r.source_division_code, amount: r.amount, reference: r.entity_name, note: r.review_notes || r.decision_notes || r.description, version: r.version, deadline: r.due_date, canSubmit: true, requiresAp: false, paymentStatus: r.payment_summary?.status ?? null, riskLevel: overdue || urgent ? 'critical' : r.payment_method === 'UNDECIDED' ? 'attention' : 'normal', riskNote: overdue ? 'Lewat jatuh tempo' : urgent ? 'Prioritas mendesak' : r.payment_method === 'UNDECIDED' ? 'Metode pembayaran belum ditetapkan' : `Rencana ${r.payment_method === 'BANK' ? 'bank' : 'tunai'}` };
    }) };
  };
  const query = useQuery({ queryKey: ['accounting-work', kind, month, outlet, status, page], queryFn: () => list(status, page), enabled: allowed && validMonth });
  const counts = useQueries({ queries: workStatuses.map(state => ({ queryKey: ['accounting-work', kind, month, outlet, state, 1], queryFn: () => list(state, 1), enabled: allowed && validMonth })) });
  const directory = useQuery({ queryKey: ['omzet', 'outlets'], queryFn: async () => (await omzetApi.outlets()).data, enabled: allowed });
  return { query, counts, directory, writer, reviewer, approver, validMonth, can, refresh: () => { void query.refetch(); counts.forEach(q => { void q.refetch(); }); void directory.refetch(); } };
}
