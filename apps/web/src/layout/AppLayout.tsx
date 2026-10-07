import { Fragment, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Target, Award, Users, ClipboardList, BarChart3, Settings, Menu, Calendar, Store, Calculator, DollarSign, PieChart, BookOpenText, Database, UploadCloud, ShieldCheck, ShieldAlert, CreditCard, PanelLeftClose, PanelLeftOpen, Moon, Sun, FileText, CheckSquare, Package, Coins, FolderKanban, ClipboardCheck } from 'lucide-react';
import { ACCOUNTING_MENU_ITEMS, MENU_ITEMS, PROJECT_MENU_ITEMS, CELLULAR_MENU_ITEMS } from '../config/menus';
import { roleDisplay } from '../config/session';
import { useAuth } from '../session/AuthContext';
import LogoutButton from '../components/LogoutButton';
import { canAccessDivision, hasCapability } from '../session/capability';
import { EmptyState } from '../components/states';
import { DetailSheet } from '../components/ui/DetailSheet';
import { normalizeDivisionCode } from '../config/mvp';

const ICON_MAP: Record<string, React.ElementType> = {
  '/dashboard': LayoutDashboard,
  '/admin': ClipboardCheck,
  '/omzet': TrendingUp,
  '/target': Target,
  '/penilaian': Award,
  '/karyawan': Users,
  '/workforce': ClipboardList,
  '/laporan': BarChart3,
  '/konfigurasi': Settings,
  '/laporan-harian': Calendar,
  '/rincian-tenant': Store,
  '/budgeting': Calculator,
  '/cashflow': DollarSign,
  '/pnl': PieChart,
  // Accounting routes
  '/accounting': LayoutDashboard,
  '/accounting/omzet': TrendingUp,
  '/accounting/omzet-tahunan': BarChart3,
  '/accounting/vouchers': FileText,
  '/accounting/setoran': DollarSign,
  '/accounting/kepegawaian': Users,
  '/accounting/dashboard': LayoutDashboard,
  '/accounting/pemasukan': DollarSign,
  '/accounting/stok': Package,
  '/accounting/audit': ShieldAlert,
  '/accounting/komisi': Coins,
  '/accounting/jurnal': BookOpenText,
  '/accounting/impor': UploadCloud,
  '/accounting/outstanding': CreditCard,
  '/accounting/cashflow': DollarSign,
  '/accounting/rekonsiliasi': ShieldCheck,
  '/accounting/periode': Calendar,
  '/accounting/master': Database,
  '/accounting/master-data': Database,
  '/accounting/tutup-shift': ClipboardCheck,
  '/accounting/laporan': FileText,
  // Project routes
  '/projects': LayoutDashboard,
  '/projects/list': FolderKanban,
  '/projects/progress': CheckSquare,
  '/projects/payments': DollarSign,
  '/projects/vendors': Users,
  '/projects/documents': FileText,
  '/projects/rab': Calculator,
  '/projects/timeline': Calendar,
};


export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('dashboard-divisi.sidebar-collapsed') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dashboard-divisi.dark-mode') === 'true');
  const { user, loading: authLoading, logout: authLogout, error } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('dashboard-divisi.dark-mode', String(isDarkMode));
  }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('dashboard-divisi.sidebar-collapsed', String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setSidebarCollapsed(value => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const logout = async () => {
    try { await authLogout(); } catch { return; }
    localStorage.removeItem('access_token');
    localStorage.removeItem('dashboard-divisi.role-demo');
    localStorage.removeItem('dashboard-divisi.division-demo');
    window.location.href = '/login';
  };
  if (authLoading) return <EmptyState title="Memuat sesi..." description="Menunggu verifikasi token" />;
  if (!user) return <Navigate to="/login" replace />;

  const normalizedDiv = normalizeDivisionCode(user.divisionCode);
  const isAccounting = location.pathname.startsWith('/accounting') || (normalizedDiv === 'ACC' && location.pathname === '/dashboard');
  const isProject = location.pathname.startsWith('/projects') || (normalizedDiv === 'PROJECT' && location.pathname === '/dashboard');
  const isCellular = location.pathname.startsWith('/cellular') || ((normalizedDiv === 'CELL' || normalizedDiv === 'CELLULAR') && location.pathname === '/dashboard');
  const menuItems = isAccounting ? ACCOUNTING_MENU_ITEMS : isProject ? PROJECT_MENU_ITEMS : isCellular ? CELLULAR_MENU_ITEMS : MENU_ITEMS;
  const moduleCode = (itemPath: string) => itemPath.startsWith('/accounting') ? 'ACC' : itemPath.startsWith('/projects') ? 'PROJECT' : itemPath.startsWith('/cellular') ? 'CELL' : null;
  const rawList = (isProject || isAccounting || isCellular) ? menuItems : [{ path: '/dashboard', label: 'Workspace ERP', roles: [user.role], capability: undefined, group: undefined }, ...menuItems.filter(item => item.path !== '/dashboard')];
  const visibleMenu = rawList.filter(item => item.roles.includes(user.role as never) && canAccessDivision(user, moduleCode(item.path)) && (!item.capability || hasCapability(user.role as never, item.capability, user.divisionCode)));
  const activeMenu = menuItems.find(item => item.path === location.pathname);
  const roleLabel = roleDisplay(user.role);
  const scopeLabel = normalizeDivisionCode(user.divisionCode) ?? 'Semua modul MVP';
  const navigation = (compact = false) => (
    <nav aria-label="Navigasi utama" className="space-y-1 px-3">
      {visibleMenu.map((item,index) => {
        const Icon = ICON_MAP[item.path] ?? LayoutDashboard;
        return <Fragment key={item.path}>
          {!compact && item.group && item.group !== visibleMenu[index-1]?.group && <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.group}</p>}
          <NavLink to={item.path} end onClick={() => setDrawerOpen(false)}
          title={compact ? item.label : undefined}
          className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${compact ? 'justify-center' : ''} ${isActive ? 'bg-primary-50 font-semibold text-primary-800' : 'text-slate-600 hover:bg-slate-100 hover:text-navy'}`}>
          <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          <span className={compact ? 'sr-only' : ''}>{item.label}</span>
        </NavLink></Fragment>;
      })}
    </nav>
  );
  const profile = (compact = false) => (
    <div className="border-t border-line p-4">
      {!compact && <div className="mb-3"><p className="truncate text-sm font-semibold text-navy">{user.name}</p><p className="mt-1 text-xs text-slate-500">{roleLabel} · {scopeLabel}</p></div>}
      <LogoutButton compact={compact} onLogout={() => void logout()} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm text-slate-600 hover:bg-slate-50" />
    </div>
  );
  return (
    <div className="min-h-screen bg-surface text-navy">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3">Lewati navigasi</a>
      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-white lg:flex ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex h-20 items-center gap-3 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white">{scopeLabel === 'Semua divisi' ? 'DD' : scopeLabel.slice(0, 2)}</div>
          {!sidebarCollapsed && <div><p className="text-sm font-bold tracking-tight">Dashboard Divisi</p><p className="mt-0.5 text-xs text-slate-500">{isAccounting ? 'Accounting workspace' : isProject ? 'Manajemen proyek' : scopeLabel}</p></div>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-5">{navigation(sidebarCollapsed)}</div>
        {profile(sidebarCollapsed)}
      </aside>
      <DetailSheet isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Navigasi" subtitle={scopeLabel} size="sm">
        {navigation()}{profile()}
      </DetailSheet>
      <div className={sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Buka menu" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
            <button type="button" aria-label={sidebarCollapsed ? 'Perbesar sidebar' : 'Kecilkan sidebar'} title="Ctrl+B" onClick={() => setSidebarCollapsed(value => !value)} className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block">{sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
            <p className="truncate text-sm font-medium text-slate-600">{activeMenu?.label ?? 'Dashboard Divisi'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">{roleLabel} · {scopeLabel}</span>
            <button type="button" onClick={() => setIsDarkMode(value => !value)} aria-label={isDarkMode ? 'Gunakan tema terang' : 'Gunakan tema gelap'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">{isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="workspace-content mx-auto min-w-0 max-w-[1600px] p-4 sm:p-6 lg:p-8">{error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Outlet /></main>
      </div>
    </div>
  );
}
