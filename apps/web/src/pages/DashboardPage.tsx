import React, { useState } from 'react';
import {
  ChevronRight,
  Lock,
  Clock,
  CheckCircle2,
  Plus,
  Check,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  FileSpreadsheet,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../session/AuthContext';
import { roleDisplay } from '../mocks/session';
import { Button } from '../components/ui/Button';
import BodExecutiveDashboard from '../components/dashboard/BodExecutiveDashboard';
import { SparklineSvg } from '../components/dashboard/SparklineSvg';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const isBod = role === 'BOD';
  const isManager = role === 'MANAGER' || role === 'SUPERADMIN';
  const isAdmin = role === 'ADMIN';
  const isPicViewOnly = role === 'PIC' || role === 'USER';

  const userDivision = user?.divisionCode;

  // State antrean ACC untuk Manager
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: '1', division: 'WRAP', name: 'Wrapping', revenue: 45000000, date: '2026-09-03', admin: 'Admin Wrapping' },
    { id: '4', division: 'MINI', name: 'Minimarket', revenue: 65000000, date: '2026-09-03', admin: 'Admin Minimarket' },
    { id: '6', division: 'FIN', name: 'Finance', revenue: 150000000, date: '2026-09-03', admin: 'Admin Finance' },
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

      {/* ==================== VIEW ROLE 1: EXECUTIVE (BOD) ==================== */}
      {isBod && <BodExecutiveDashboard />}

      {/* ==================== VIEW ROLE 2: MANAGER (SUPERADMIN) ==================== */}
      {isManager && (
        <div className="space-y-6" data-testid="manager-dashboard-view">
          {/* Manager Operational Metric Cards with Sparklines */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Antrean ACC Pending
                </span>
                <span className="rounded-pill bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                  {filteredPending.length} Laporan
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-navy">{filteredPending.length} Berkas</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[12, 10, 8, 7, 5, 4, filteredPending.length]} color="#f59e0b" height={28} />
              </div>
            </div>

            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Total Nominal Menunggu ACC
                </span>
                <span className="rounded-pill bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-800 border border-primary-200">
                  Verifikasi
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-navy">
                Rp {(totalPendingNominal / 1e6).toLocaleString('id-ID')} Jt
              </p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[450, 420, 380, 310, 290, 270, totalPendingNominal / 1e6]} color="#0284c7" height={28} />
              </div>
            </div>

            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Approval Rate
                </span>
                <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  On-Time
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-800">96.8%</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[91, 92, 94, 95, 96, 96.5, 96.8]} color="#059669" height={28} />
              </div>
            </div>
          </div>

          {/* Approval Queue Widget */}
          <section className="rounded-card-lg border border-amber-200 bg-gradient-to-br from-amber-50/40 to-white backdrop-blur-md p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" /> Manager Approval Center (Pending ACC)
                </h2>
                <p className="text-xs text-slate-700 mt-1 font-medium">Crosscheck dan setujui laporan yang di-submit oleh Admin Divisi</p>
              </div>
              <span className="rounded-pill bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-xs">
                {filteredPending.length} Perlu Verifikasi
              </span>
            </div>

            {filteredPending.length > 0 ? (
              <div className="mt-4 space-y-3">
                {filteredPending.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-card border border-line/60 bg-white p-4 gap-3 shadow-2xs">
                    <div>
                      <span className="rounded-pill bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-navy">{item.division} - {item.name}</span>
                      <p className="mt-1 text-sm font-bold text-navy">Omset Input: Rp {item.revenue.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-slate-700 font-medium">Disubmit oleh {item.admin} pada {item.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleQuickApprove(item.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs">
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
          {/* Admin Metric Cards with Sparklines */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Divisi Bulan Ini
                </span>
                <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-200">
                  {userDivision ?? 'Divisi'}
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-navy">Rp 2.50 M</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[2.2, 2.3, 2.35, 2.4, 2.45, 2.48, 2.5]} color="#0284c7" height={28} />
              </div>
            </div>

            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Realisasi Input Berjalan
                </span>
                <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  88.0% Capaian
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-800">Rp 2.20 M</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[1.8, 1.9, 1.95, 2.05, 2.1, 2.15, 2.2]} color="#059669" height={28} />
              </div>
            </div>

            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status Laporan Hari Ini
                </span>
                <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Siap
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-800" />
                <span className="text-base font-bold text-navy">Tersubmit & Approved</span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium mt-2">Log harian tanggal berjalan lengkap</p>
            </div>
          </div>

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
          {/* PIC Metric Cards with Sparklines */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status Pengawasan
                </span>
                <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Aktif
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-navy">100% Real-Time</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[100, 100, 100, 100, 100, 100, 100]} color="#059669" height={28} />
              </div>
            </div>

            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Total Divisi Dipantau
                </span>
                <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-200">
                  Seluruh Unit
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-navy">7 Unit Bisnis</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[7, 7, 7, 7, 7, 7, 7]} color="#0284c7" height={28} />
              </div>
            </div>

            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tingkat Kepatuhan Laporan
                </span>
                <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Tertib
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-800">98.2%</p>
              <div className="mt-2 pt-1 border-t border-slate-100">
                <SparklineSvg data={[95, 96, 96.5, 97, 97.8, 98, 98.2]} color="#059669" height={28} />
              </div>
            </div>
          </div>

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
