import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Award,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  Menu,
  X,
  Calendar,
  Store,
  Calculator,
  DollarSign,
  PieChart,
  BookOpenText,
  Database,
  UploadCloud,
  Clock,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
} from 'lucide-react';
import { ACCOUNTING_MENU_ITEMS, MENU_ITEMS, roleDisplay } from '../mocks/session';
import { useAuth } from '../session/AuthContext';
import LogoutButton from '../components/LogoutButton';
import { hasCapability } from '../session/capability';
import { EmptyState } from '../components/states';
import { CommandPalette } from '../components/ui/CommandPalette';
import { DetailSheet } from '../components/ui/DetailSheet';
import { StickyContextFilterBar } from '../components/filters/StickyContextFilterBar';

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
  '/accounting': LayoutDashboard,
  '/accounting/jurnal': BookOpenText,
  '/accounting/impor': UploadCloud,
  '/accounting/outstanding': Clock,
  '/accounting/cashflow': DollarSign,
  '/accounting/rekonsiliasi': ShieldCheck,
  '/accounting/periode': Calendar,
  '/accounting/master': Database,
};

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dashboard-divisi.sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dashboard-divisi.sidebar-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCommandAction = (actionId: string) => {
    if (actionId === 'act-open-detail-sheet') {
      setDetailSheetOpen(true);
    } else if (actionId === 'act-toggle-sidebar') {
      toggleSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        if (isInput) return;
        e.preventDefault();
        toggleSidebar();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (isInput) return;
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (isInput) return;
        e.preventDefault();
        setDetailSheetOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'dashboard-divisi.sidebar-collapsed' && e.newValue !== null) {
        setSidebarCollapsed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const { user, loading: authLoading, logout: authLogout } = useAuth();
  const logout = async () => {
    await authLogout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('dashboard-divisi.role-demo');
    localStorage.removeItem('dashboard-divisi.division-demo');
    window.location.href = '/login';
  };

  const location = useLocation();

  if (authLoading) {
    return <EmptyState title="Memuat sesi..." description="Menunggu verifikasi token" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAccounting = user.divisionCode === 'ACC';
  const menuItems = isAccounting ? ACCOUNTING_MENU_ITEMS : MENU_ITEMS;
  const activeMenu = menuItems.find((item) => item.path === location.pathname);
  const roleLabel = roleDisplay(user.role);
  const scopeLabel = user.divisionCode ?? 'Semua divisi';

  const visibleMenu = menuItems.filter((item) => {
    if (!item.roles.includes(user.role as never)) return false;
    if (item.capability && !hasCapability(user.role as never, item.capability, user.divisionCode)) return false;
    return true;
  });

  const renderMenu = (variant: 'sidebar' | 'mobile') => {
    const isSidebar = variant === 'sidebar';
    const isCollapsed = isSidebar && sidebarCollapsed;

    return (
      <nav
        className={
          isSidebar
            ? 'flex flex-col gap-1.5 px-3'
            : 'flex gap-2 overflow-x-auto pb-2 scrollbar-thin'
        }
        aria-label={isSidebar ? 'Navigasi utama' : 'Navigasi mobile'}
      >
        {visibleMenu.map((item) => {
          const Icon = ICON_MAP[item.path] ?? LayoutDashboard;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                isActive
                  ? `group relative flex shrink-0 items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'
                    } rounded-xl bg-gradient-to-r from-primary-600 via-primary-700 to-dark text-sm font-semibold text-white shadow-md ring-1 ring-white/20 transition-all duration-200`
                  : `group relative flex shrink-0 items-center ${
                      isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'
                    } rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/12 hover:shadow-xs transition-all duration-200 ease-out ${
                      !isCollapsed ? 'hover:translate-x-1.5' : ''
                    }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
                  )}
                  <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className={isCollapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
                  {isCollapsed && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-slate-900/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl ring-1 ring-white/15 whitespace-nowrap group-hover:block transition-all animate-in fade-in zoom-in-95 duration-150"
                    >
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-mesh relative selection:bg-primary/20 selection:text-primary-dark">
      {/* Decorative ambient background for layout */}
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />

      {/* Drawer mobile overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-[#0c4a6e] via-[#075985] to-[#042f48] px-4 py-6 text-slate-200 shadow-2xl ring-1 ring-white/15 flex flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-dark text-white font-bold text-sm shadow-md ring-1 ring-white/30">
                  {isAccounting ? 'AC' : 'DD'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight leading-snug">
                    {isAccounting ? 'Accounting Center' : 'Dashboard Divisi'}
                  </p>
                  <p className="text-xs text-sky-200/80 font-medium leading-none mt-0.5">
                    {isAccounting ? 'Kontrol jurnal & periode' : '7 divisi · Real BE'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/15 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 scrollbar-thin" aria-label="Navigasi drawer">
              {visibleMenu.map((item) => {
                const Icon = ICON_MAP[item.path] ?? LayoutDashboard;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      isActive
                        ? 'group relative flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 via-primary-700 to-dark px-3.5 py-2.5 text-sm font-semibold text-white shadow-md ring-1 ring-white/20'
                        : 'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/12 hover:text-white transition-all duration-200'
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md ring-1 ring-white/10">
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-sky-200/80">{roleLabel} · {scopeLabel}</p>
                <LogoutButton
                  onLogout={() => void logout()}
                  className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-all"
                />
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Modern Clean Ocean-Sky Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 hidden bg-gradient-to-b from-[#0c4a6e] via-[#075985] to-[#042f48] text-slate-200 lg:flex flex-col border-r border-[#419cc3]/30 shadow-xl z-50 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Brand & Toggle Header */}
        <div
          className={`flex items-center ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          } py-5 border-b border-white/10 mb-3`}
        >
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-dark text-white font-bold text-sm shadow-md ring-1 ring-white/30">
                  {isAccounting ? 'AC' : 'DD'}
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-sm font-bold text-white tracking-tight leading-snug truncate">
                    {isAccounting ? 'Accounting Center' : 'Dashboard Divisi'}
                  </p>
                  <p className="text-xs text-sky-200/80 font-medium leading-none mt-0.5 truncate">
                    {isAccounting ? 'Kontrol jurnal & periode' : '7 divisi · Real BE'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Kecilkan sidebar"
                title="Kecilkan sidebar (Ctrl+B)"
                className="shrink-0 rounded-lg p-1.5 text-sky-200 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Perbesar sidebar"
              title="Perbesar sidebar (Ctrl+B)"
              className="group flex flex-col items-center gap-1.5 p-1 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 via-primary-500 to-dark text-white font-bold text-sm shadow-md ring-1 ring-white/30 group-hover:scale-105 transition-transform">
                {isAccounting ? 'AC' : 'DD'}
              </div>
              <PanelLeftOpen className="h-4 w-4 text-sky-200 group-hover:text-white group-hover:scale-110 transition-all" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/15 py-1">
          {renderMenu('sidebar')}
        </div>

        {/* Bottom user card */}
        {!sidebarCollapsed ? (
          <div className="border-t border-white/10 p-3.5">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md ring-1 ring-white/10 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-dark text-xs font-bold text-white shadow-xs ring-1 ring-white/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                  <p className="truncate text-[11px] text-sky-200/80">{roleLabel} · {scopeLabel}</p>
                </div>
              </div>
              <LogoutButton
                onLogout={() => void logout()}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-all active:scale-[0.98]"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 border-t border-white/10 p-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-primary-500 to-dark text-xs font-bold text-white shadow-sm ring-1 ring-white/20"
              title={`${user.name} (${roleLabel} · ${scopeLabel})`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <LogoutButton
              compact
              onLogout={() => void logout()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-rose-500/80 hover:text-white transition-all active:scale-95"
            />
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex min-h-screen flex-col relative z-10 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Modern Clean Ocean-Sky Header */}
        <header className="sticky top-0 z-40 border-b border-sage/25 bg-white/90 backdrop-blur-xl shadow-xs">
          {/* Top accent gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary-500 via-dark to-sage" />

          <div className="flex min-h-16 flex-col gap-3 px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Mobile drawer toggle */}
                <button
                  type="button"
                  aria-label="Buka menu"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden rounded-lg border border-line p-2 text-navy hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>

                {/* Desktop sidebar collapse/expand toggle button */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={sidebarCollapsed ? 'Perbesar sidebar (navbar)' : 'Kecilkan sidebar (navbar)'}
                  title={sidebarCollapsed ? 'Perbesar sidebar (Ctrl+B)' : 'Kecilkan sidebar (Ctrl+B)'}
                  className="hidden lg:flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-primary-50 active:scale-95 transition-all border border-transparent hover:border-primary-100"
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="h-5 w-5 text-primary-600" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5 text-slate-600" />
                  )}
                </button>

                <div>
                  <p className="text-sm font-semibold text-navy lg:hidden">Dashboard Divisi</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="hidden lg:inline font-medium text-slate-700">Dashboard Divisi</span>
                    {activeMenu && (
                      <>
                        <span className="text-slate-300">/</span>
                        <span className="font-semibold text-primary-900 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200/60 shadow-2xs">
                          {activeMenu.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-800 lg:hidden">{user.name}</span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Command Palette Trigger Button (Desktop & Tablet) */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Cari modul atau aksi (Ctrl+K)"
                className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:border-sky-300 hover:bg-sky-50/60 hover:text-sky-900 transition-all shadow-2xs active:scale-95 cursor-pointer"
                data-testid="navbar-search-btn"
              >
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden md:inline">Cari modul, menu, atau aksi...</span>
                <span className="md:hidden">Cari...</span>
                <kbd className="ml-1 inline-flex items-center rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Cari modul (Ctrl+K)"
                className="sm:hidden rounded-lg border border-line p-2 text-navy hover:bg-primary-50 hover:text-primary-700 transition-colors"
                data-testid="navbar-mobile-search-btn"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Active Role & Scope Pill */}
              <div className="hidden lg:flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200/60 px-3.5 py-1.5 text-xs shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-primary-900">{roleLabel}</span>
                <span className="text-primary-300">|</span>
                <span className="font-medium text-slate-600">{scopeLabel}</span>
              </div>
            </div>

            <div className="lg:hidden">{renderMenu('mobile')}</div>
          </div>
        </header>

        {/* Sticky Context Filter Bar */}
        <StickyContextFilterBar
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenDetailSheet={() => setDetailSheetOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />

      {/* Sliding Detail Sheet */}
      <DetailSheet
        isOpen={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        title="Rincian Operasional & Finansial"
        subtitle={`Inspeksi ringkasan metrik dan audit status: ${scopeLabel}`}
        badge={{ text: 'Aktif · Real-Time', variant: 'success' }}
      >
        <div className="space-y-4 text-sm text-slate-700">
          <div className="rounded-xl bg-sky-50 border border-sky-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Status Entitas Aktif</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Terverifikasi
              </span>
            </div>
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{roleLabel} · {scopeLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
              <p className="text-[11px] text-slate-500 font-medium">Realisasi MTD</p>
              <p className="text-base font-bold text-slate-900 mt-1">Rp 1.482.500.000</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ +14.2% vs target</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
              <p className="text-[11px] text-slate-500 font-medium">Rekonsiliasi Bank</p>
              <p className="text-base font-bold text-slate-900 mt-1">31/31 Klop</p>
              <p className="text-[10px] text-sky-600 font-semibold mt-0.5">100% Cocok Sempurna</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Panduan Pintasan Cepat</h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span>Buka Command Palette</span>
                <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]">Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span>Toggle Sidebar Desktop</span>
                <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]">Ctrl+B</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Buka Panel Rincian Cepat</span>
                <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]">Ctrl+D</kbd>
              </div>
            </div>
          </div>
        </div>
      </DetailSheet>
    </div>
  );
}
