import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Target, Award, Users, ClipboardList, BarChart3, Settings, Menu, X, Calendar, Store, Calculator, DollarSign, PieChart } from 'lucide-react';
import { MENU_ITEMS, roleDisplay } from '../mocks/session';
import { useAuth } from '../session/AuthContext';
import LogoutButton from '../components/LogoutButton';
import { hasCapability } from '../session/capability';

const ICON_MAP: Record<string, React.ElementType> = {
  '/dashboard': LayoutDashboard,
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
};

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [drawerOpen]);
  const { user, login: authLogin, logout: authLogout } = useAuth();
  const logout = async () => {
    await authLogout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('dashboard-divisi.role-demo');
    localStorage.removeItem('dashboard-divisi.division-demo');
    window.location.href = '/login';
  };

  const handleQuickSwitch = async (email: string) => {
    try {
      await authLogin(email, 'Password123!');
    } catch {
      alert('Gagal switch role instan. Pastikan backend berjalan.');
    }
  };

  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const activeMenu = MENU_ITEMS.find((item) => item.path === location.pathname);
  const roleLabel = roleDisplay(user.role);
  const scopeLabel = user.divisionCode ?? 'Semua divisi';

  const visibleMenu = MENU_ITEMS.filter((item) => {
    if (!item.roles.includes(user.role as never)) return false;
    if (item.capability && !hasCapability(user.role as never, item.capability, user.divisionCode)) return false;
    return true;
  });

  const renderMenu = (variant: 'sidebar' | 'mobile') => (
    <nav className={variant === 'sidebar' ? 'flex flex-col gap-1.5' : 'flex gap-2 overflow-x-auto pb-2 scrollbar-thin'} aria-label={variant === 'sidebar' ? 'Navigasi utama' : 'Navigasi mobile'}>
      {visibleMenu.map((item) => {
        const Icon = ICON_MAP[item.path] ?? LayoutDashboard;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? 'flex shrink-0 items-center gap-2.5 rounded-card bg-white/20 px-3 py-2.5 text-sm font-medium text-white shadow-glass backdrop-blur-md ring-1 ring-white/10'
                : 'flex shrink-0 items-center gap-2.5 rounded-card px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200'
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-mesh relative selection:bg-primary/20 selection:text-primary-dark">
      {/* Decorative ambient background for layout */}
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />
      
      {/* Drawer mobile overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-md" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-navy via-navy to-[#0b1221] px-4 py-6 text-slate-200 shadow-2xl ring-1 ring-white/10">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-card-lg bg-white/15 text-white font-bold text-sm">DD</div><p className="text-sm font-semibold text-white">Dashboard Divisi</p></div>
              <button type="button" aria-label="Tutup menu" onClick={() => setDrawerOpen(false)} className="rounded-input p-1 text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex flex-col gap-1.5" aria-label="Navigasi drawer">
              {visibleMenu.map((item) => {
                const Icon = ICON_MAP[item.path] ?? LayoutDashboard;
                return <NavLink key={item.path} to={item.path} onClick={() => setDrawerOpen(false)} className={({ isActive }) => isActive ? 'flex items-center gap-2.5 rounded-card-lg bg-white/15 px-3 py-2.5 text-sm font-medium text-white shadow-glass' : 'flex items-center gap-2.5 rounded-card-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10'}><Icon className="h-4 w-4" />{item.label}</NavLink>;
              })}
            </nav>
            
          </aside>
        </div>
      )}
      {/* Modern sidebar with gradient */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-gradient-to-b from-navy via-navy to-[#0b1221] px-4 py-6 text-slate-200 lg:block border-r border-white/5 shadow-glass z-50 flex flex-col">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-card bg-gradient-to-br from-primary to-info text-white font-bold text-sm shadow-md ring-1 ring-white/20">DD</div>
          <div>
            <p className="text-sm font-bold text-white leading-none tracking-tight">Dashboard Divisi</p>
            <p className="text-xs text-slate-400 mt-1">7 divisi · Real BE</p>
          </div>
        </div>
        {renderMenu('sidebar')}
        <div className="absolute bottom-4 left-4 right-4 rounded-card-lg bg-white/10 p-3">
          <p className="text-xs font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-300">{roleLabel} · {scopeLabel}</p>
          <LogoutButton onLogout={() => void logout()} className="mt-2 flex w-full items-center gap-1.5 rounded-input bg-white/10 px-2 py-1.5 text-xs font-medium text-white hover:bg-white/15 transition-colors" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:ml-64 relative z-10">
        {/* Glass header */}
        <header className="sticky top-0 z-40 border-b border-line/40 bg-white/60 glass backdrop-blur-xl">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button type="button" aria-label="Buka menu" onClick={() => setDrawerOpen(true)} className="lg:hidden rounded-input border border-line p-2 text-navy hover:bg-surface"><Menu className="h-5 w-5" /></button>
                <div>
                  <p className="text-sm font-semibold text-navy lg:hidden">Dashboard Divisi</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="hidden lg:inline">Dashboard Divisi</span>
                    {activeMenu && <><span className="text-slate-300">/</span><span className="font-medium text-navy">{activeMenu.label}</span></>}
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium lg:hidden">{user.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 rounded-full border border-line bg-white/90 px-3 py-1.5 text-xs shadow-sm">
                <span className="text-slate-500 font-semibold">⚡ Quick Role:</span>
                <select
                  value={user.email}
                  onChange={(e) => { if (e.target.value && e.target.value !== user.email) void handleQuickSwitch(e.target.value); }}
                  className="bg-transparent font-bold text-navy focus:outline-none cursor-pointer"
                >
                  <option value="bod1@dashboard.test">👔 Executive (BOD)</option>
                  <option value="manager.wrap@dashboard.test">⚡ Superadmin (Manager)</option>
                  <option value="admin.wrap@dashboard.test">📝 Admin Divisi</option>
                  <option value="pic@dashboard.test">🔒 PIC (View Only)</option>
                </select>
              </div>
              <div className="hidden lg:flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-medium text-navy">{roleLabel}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{scopeLabel}</span>
              </div>
            </div>
            <div className="lg:hidden">{renderMenu('mobile')}</div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
