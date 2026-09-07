import React, { useState } from 'react';
import {
  Lock,
  Plus,
  FileCheck,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../session/AuthContext';
import { roleDisplay } from '../mocks/session';
import { Button } from '../components/ui/Button';
import BodExecutiveDashboard from '../components/dashboard/BodExecutiveDashboard';
import { DualToneAreaChart } from '../components/dashboard/DualToneAreaChart';
import { DashboardTimeframeBar } from '../components/dashboard/DashboardTimeframeBar';
import { OperationalKpiCards } from '../components/dashboard/OperationalKpiCards';
import { ManagerApprovalQueueWidget } from '../components/dashboard/ManagerApprovalQueueWidget';
import { getPeriodSummary } from '../data/dashboardPeriodData';
import { type PeriodFilterOption } from '../components/filters/StickyContextFilterBar';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const isBod = role === 'BOD';
  const isManager = role === 'MANAGER' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';
  const isPicViewOnly = role === 'PIC' || role === 'USER' || role === 'HRD';

  const userDivision = user?.divisionCode;

  const [searchParams, setSearchParams] = useSearchParams();
  const rawPeriod = searchParams.get('period');
  const activePeriod: PeriodFilterOption =
    rawPeriod && ['today', '7d', 'month', 'ytd'].includes(rawPeriod)
      ? (rawPeriod as PeriodFilterOption)
      : 'month';
  const divisionParam = searchParams.get('divisionCode') || userDivision || 'ALL';

  const periodData = getPeriodSummary(activePeriod, divisionParam);

  const handlePeriodChange = (newPeriod: PeriodFilterOption) => {
    const next = new URLSearchParams(searchParams);
    if (newPeriod !== 'month') {
      next.set('period', newPeriod);
    } else {
      next.delete('period');
    }
    setSearchParams(next);
  };

  // State antrean ACC untuk Manager
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: '1', division: 'WRAP', name: 'Wrapping', revenue: 45000000, date: '2026-09-03', admin: 'Admin Wrapping' },
    { id: '4', division: 'MINI', name: 'Minimarket', revenue: 65000000, date: '2026-09-03', admin: 'Admin Minimarket' },
    { id: '6', division: 'ACC', name: 'Accounting & Finance', revenue: 150000000, date: '2026-09-03', admin: 'Admin Accounting' },
  ]);

  const filteredPending = pendingApprovals.filter((a) => {
    if (isBod || !userDivision) return true;
    return a.division === userDivision;
  });

  const handleQuickApprove = (id: string) => {
    setPendingApprovals(pendingApprovals.filter((a) => a.id !== id));
  };

  const totalPendingNominal = filteredPending.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="dashboard-page">
      {/* Header Welcome Banner */}
      <section className="relative overflow-hidden rounded-card-lg border border-line/40 bg-gradient-to-r from-[#042f48] via-[#075985] to-[#0c4a6e] p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-200 backdrop-blur-md border border-white/15">
              <span>Dashboard Terpersonalisasi ({roleDisplay(role)})</span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Selamat Datang, {user?.name ?? 'Pengguna'}
            </h1>
            <p className="mt-1 text-sm text-cyan-100/90">
              Scope Operasional: <span className="font-semibold text-white">{user?.divisionCode ?? 'Semua Divisi (7 Divisi)'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isBod && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-cyan-500/20 border border-cyan-400/40 px-3.5 py-1.5 text-xs font-semibold text-cyan-200">
                👔 Panel Executive BOD
              </span>
            )}
            {isManager && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-200">
                ⚡ Panel Approval Manager
              </span>
            )}
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-sky-500/20 border border-sky-400/40 px-3.5 py-1.5 text-xs font-semibold text-sky-200">
                📝 Panel Input Admin Divisi
              </span>
            )}
            {isPicViewOnly && (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-500/20 border border-amber-400/40 px-3.5 py-1.5 text-xs font-semibold text-amber-200">
                <Lock className="h-3.5 w-3.5" /> Panel Monitor PIC (View Only)
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Universal Period Filter Toolbar (Untuk Semua Akun & Role) */}
      <DashboardTimeframeBar
        activePeriod={activePeriod}
        periodLabel={periodData.periodLabel}
        onPeriodChange={handlePeriodChange}
      />

      {/* ==================== VIEW ROLE 1: EXECUTIVE (BOD) ==================== */}
      {isBod && <BodExecutiveDashboard />}

      {/* ==================== VIEW ROLE 2: MANAGER (SUPERADMIN) ==================== */}
      {isManager && (
        <div className="space-y-6" data-testid="manager-dashboard-view">
          {/* Manager Financial & Target Overview for the selected timeframe */}
          <OperationalKpiCards
            periodData={periodData}
            activePeriod={activePeriod}
            userDivision={userDivision}
            role="MANAGER"
            pendingCount={filteredPending.length}
            pendingNominal={totalPendingNominal}
            approvalRate={96.8}
          />

          {/* Dual-Tone Area Chart untuk Manager Divisi */}
          <DualToneAreaChart
            activePeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
            dataOverride={periodData.chartPoints}
          />

          {/* Approval Queue Widget */}
          <ManagerApprovalQueueWidget
            items={filteredPending}
            onApprove={handleQuickApprove}
          />

          {/* Shortcut Pengelolaan Manager */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/laporan-harian" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Report Harian & ACC</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Kelola verifikasi omset harian divisi</p>
            </Link>
            <Link to="/rincian-tenant" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Target Tenant</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Ubah target bulanan tenant/outlet</p>
            </Link>
            <Link to="/budgeting" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Format Budgeting</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Alokasi & pengawasan anggaran</p>
            </Link>
          </div>
        </div>
      )}

      {/* ==================== VIEW ROLE 3: ADMIN ==================== */}
      {isAdmin && (
        <div className="space-y-6" data-testid="admin-dashboard-view">
          {/* Admin Metric Cards: Target vs Realisasi & Status */}
          <OperationalKpiCards
            periodData={periodData}
            activePeriod={activePeriod}
            userDivision={userDivision}
            role="ADMIN"
          />

          {/* Dual-Tone Area Chart untuk Admin Divisi */}
          <DualToneAreaChart
            activePeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
            dataOverride={periodData.chartPoints}
          />

          <section className="rounded-card-lg border border-primary-200 bg-gradient-to-br from-primary-50/50 to-white backdrop-blur-md p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary-600" />
                  Panel Input Admin Divisi
                </h2>
                <p className="text-xs text-slate-700 font-medium mt-1">Catat omset harian divisi Anda. Data akan terkirim ke Manager untuk di-ACC.</p>
              </div>
              <Link to="/laporan-harian">
                <Button className="bg-primary text-white text-xs font-bold shadow-xs">
                  <Plus className="mr-1.5 h-4 w-4" /> Input Omset Hari Ini
                </Button>
              </Link>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/laporan-harian" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Log Input Omset Harian</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Pantau status laporan (Pending ACC / Approved)</p>
            </Link>
            <Link to="/rincian-tenant" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Data Tenant Outlet</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Lihat rincian pencapaian tenant divisi</p>
            </Link>
          </div>
        </div>
      )}

      {/* ==================== VIEW ROLE 4: PIC (VIEW ONLY) ==================== */}
      {isPicViewOnly && (
        <div className="space-y-6" data-testid="pic-dashboard-view">
          {/* PIC Financial & Target Overview for the selected timeframe */}
          <OperationalKpiCards
            periodData={periodData}
            activePeriod={activePeriod}
            userDivision={userDivision}
            role="PIC"
          />

          {/* Dual-Tone Area Chart untuk PIC */}
          <DualToneAreaChart
            activePeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
            dataOverride={periodData.chartPoints}
          />

          {/* Banner Read-Only untuk PIC */}
          <section className="rounded-card-lg border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-800">
                Mode Akses PIC (Read-Only) — Pengisian data dilakukan oleh Admin Divisi dan di-ACC oleh Manager Divisi.
              </p>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/laporan-harian" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Laporan Harian Divisi</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Lihat perkembangan omset harian divisi</p>
            </Link>
            <Link to="/rincian-tenant" className="rounded-card-lg border border-line/60 p-5 bg-white shadow-xs hover:border-primary/60 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy group-hover:text-primary-700 transition-colors">Rincian Tenant</h3>
                <ArrowRight className="h-4 w-4 text-slate-700 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">Lihat pencapaian omset per tenant</p>
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Shortcut Cards untuk Semua Role */}
      <section className="rounded-card-lg border border-line/50 bg-white/90 backdrop-blur-md p-6 shadow-xs">
        <h2 className="text-base font-bold text-navy mb-4">Navigasi Cepat Modul Laporan & Finansial</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Link to="/laporan-harian" className="rounded-card border border-line/60 p-3.5 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center justify-between group">
            <span className="text-xs font-bold text-navy group-hover:text-primary-700">Report Harian</span>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/rincian-tenant" className="rounded-card border border-line/60 p-3.5 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center justify-between group">
            <span className="text-xs font-bold text-navy group-hover:text-primary-700">Rincian Omset Tenant</span>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/laporan" className="rounded-card border border-line/60 p-3.5 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center justify-between group">
            <span className="text-xs font-bold text-navy group-hover:text-primary-700">Detail Laporan</span>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/budgeting" className="rounded-card border border-line/60 p-3.5 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center justify-between group">
            <span className="text-xs font-bold text-navy group-hover:text-primary-700">Format Budgeting</span>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/cashflow" className="rounded-card border border-line/60 p-3.5 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center justify-between group">
            <span className="text-xs font-bold text-navy group-hover:text-primary-700">Cashflow</span>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link to="/pnl" className="rounded-card border border-line/60 p-3.5 bg-slate-50/50 hover:bg-white hover:border-primary/50 transition-all flex items-center justify-between group">
            <span className="text-xs font-bold text-navy group-hover:text-primary-700">PNL (Profit & Loss)</span>
            <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
