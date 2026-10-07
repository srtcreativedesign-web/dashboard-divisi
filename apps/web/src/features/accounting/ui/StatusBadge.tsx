const colors: Record<string,string> = {
 draft:'border-slate-200 bg-slate-50 text-slate-700', submitted:'border-sky-200 bg-sky-50 text-sky-800',
 correction:'border-rose-200 bg-rose-50 text-rose-800',pending_approval:'border-amber-200 bg-amber-50 text-amber-900',
 validated:'border-emerald-200 bg-emerald-50 text-emerald-800',approved:'border-emerald-200 bg-emerald-50 text-emerald-800',
 recorded:'border-sky-200 bg-sky-50 text-sky-800',voided:'border-slate-200 bg-slate-50 text-slate-600',
};
export function StatusBadge({status,label}:{status:string;label:string}) {
 return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${colors[status]??colors.draft}`}>{label}</span>;
}
