import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Banknote, BookOpenText, ChevronDown, ClipboardCheck, FileText, LayoutDashboard, TrendingUp, Users } from 'lucide-react';
import { ACCOUNTING_MENU_ITEMS, ACCOUNTING_NAV_GROUPS, type MenuItem } from '../../config/menus';
import type { AuthUser } from '../../api/auth';
import { canAccessDivision, hasCapability } from '../../session/capability';

const icons = { documents: ClipboardCheck, revenue: TrendingUp, expenses: FileText, cash: Banknote, people: Users, books: BookOpenText };
const linkClass = 'flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ';
export function AccountingNavigation({ user, compact = false, onNavigate }: { user: AuthUser; compact?: boolean; onNavigate: () => void }) {
  const location = useLocation();
  const id = useId();
  const visible = (item: MenuItem) => item.roles.includes(user.role as never) && canAccessDivision(user, 'ACC') && (!item.capability || hasCapability(user.role, item.capability, user.divisionCode));
  const groups = ACCOUNTING_NAV_GROUPS.map(group => ({ ...group, children: group.children.filter(visible) })).filter(group => group.children.length);
  const activeGroup = groups.find(group => group.children.some(item => item.path === location.pathname))?.id;
  const [expanded, setExpanded] = useState<string[]>(() => activeGroup ? [activeGroup] : ['documents']);
  useEffect(() => { if (activeGroup) setExpanded(previous => previous.includes(activeGroup) ? previous : [...previous, activeGroup]); }, [activeGroup]);
  const leaf = (item: MenuItem, nested = false) => <NavLink key={item.path} to={item.path} end onClick={onNavigate} title={compact ? item.label : undefined} className={({ isActive }) => linkClass + (isActive ? 'bg-primary-50 font-semibold text-primary-800 dark:bg-primary-950 dark:text-primary-200' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800') + (nested && !compact ? ' ml-4 border-l border-line' : '')}>
    {(!nested || compact) && <LayoutDashboard aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />}<span className={compact ? 'sr-only' : ''}>{item.label}</span>
  </NavLink>;
  const dashboard = ACCOUNTING_MENU_ITEMS[0]!;
  return <nav aria-label="Navigasi Accounting" className="space-y-2 px-3">
    {visible(dashboard) && leaf(dashboard)}
    {!compact && <p className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-widest text-subtle">Proses bisnis</p>}
    {groups.map(group => {
      const Icon = icons[group.id as keyof typeof icons];
      const open = expanded.includes(group.id);
      if (compact) return <div key={group.id} className="space-y-1 border-t border-line pt-2">{group.children.map(item => leaf(item))}</div>;
      return <div key={group.id}>
        <button type="button" aria-expanded={open} aria-controls={id + group.id} onClick={() => setExpanded(previous => open ? previous.filter(value => value !== group.id) : [...previous, group.id])} className={'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary ' + (activeGroup === group.id ? 'text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-300')}><Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" /><span className="flex-1">{group.label}</span><ChevronDown aria-hidden="true" className={'h-3.5 w-3.5 transition-transform ' + (open ? '' : '-rotate-90')} /></button>
        <div id={id + group.id} hidden={!open} className="space-y-1 pb-1">{group.children.map(item => leaf(item, true))}</div>
      </div>;
    })}
  </nav>;
}
