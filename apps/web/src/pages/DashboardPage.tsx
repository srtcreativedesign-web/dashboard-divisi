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
  Calendar,
  Target,
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

      {/* ==================== VIEW ROLE 1: EXECUTIVE (BOD) ==================== */}
      {isBod && <BodExecutiveDashboard />}

      {/* ==================== VIEW ROLE 2: MANAGER (SUPERADMIN) ==================== */}
      {isManager && (
        <div className="space-y-6" data-testid="manager-dashboard-view">
          {/* Manager Operational Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1: Antrean ACC Pending */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Antrean ACC Pending
                  </span>
                  <span className="rounded-pill bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                    {filteredPending.length} Laporan
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-navy">{filteredPending.length} Berkas</p>
                  <span className="text-xs font-medium text-slate-500">menunggu verifikasi</span>
                </div>
              </div>

              {/* Visual Antrean & SLA */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Beban Antrean Validasi</span>
                  <span className="font-bold text-amber-800">{filteredPending.length} Laporan Pending</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(filteredPending.length * 20, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Prioritas: Cepat</span>
                  <span className="text-amber-700 font-semibold">Target SLA: &lt; 24 Jam</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Nominal Menunggu ACC */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Total Nominal Menunggu ACC
                  </span>
                  <span className="rounded-pill bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-800 border border-primary-200">
                    Verifikasi
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-navy">
                    Rp {(totalPendingNominal / 1e6).toLocaleString('id-ID')} Jt
                  </p>
                  <span className="text-xs font-medium text-slate-500">omset dalam antrean</span>
                </div>
              </div>

              {/* Visual Distribusi Verifikasi */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Distribusi Verifikasi Kasir</span>
                  <span className="font-bold text-navy font-mono">100% Tercatat</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Rekonsiliasi Kas: Siap</span>
                  <span className="text-sky-700 font-semibold">Siap Di-ACC</span>
                </div>
              </div>
            </div>

            {/* Card 3: Approval Rate */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Approval Rate
                  </span>
                  <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    On-Time
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-emerald-800">96.8%</p>
                  <span className="text-xs font-medium text-slate-500">tepat waktu</span>
                </div>
              </div>

              {/* Visual Kepatuhan SLA */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Tingkat Kepatuhan SLA</span>
                  <span className="font-bold text-emerald-800 font-mono">96.8% (Target 95%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96.8%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Audit Kepatuhan: Prima</span>
                  <span className="text-emerald-700 font-semibold">+1.8% Melampaui SLA</span>
                </div>
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
          {/* Admin Metric Cards: Target vs Realisasi & Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1: Target Divisi Bulan Ini */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Target Divisi Bulan Ini
                  </span>
                  <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-200">
                    {userDivision ?? 'Divisi'} · RKAP 2026
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-navy">Rp 2.50 M</p>
                  <span className="text-xs font-medium text-slate-500">alokasi bulan ini</span>
                </div>
              </div>

              {/* Visual Pacing & Target Harian Operasional */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-sky-600" /> Pacing Waktu Kalender
                  </span>
                  <span className="font-bold text-navy">Hari ke-6 / 30 (20%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '20%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Target Harian: <strong className="text-slate-700 font-mono">Rp 83.3 Jt/hari</strong></span>
                  <span className="text-sky-700 font-semibold">24 Hari Tersisa</span>
                </div>
              </div>
            </div>

            {/* Card 2: Realisasi Input Berjalan */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Realisasi Input Berjalan
                  </span>
                  <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" /> 88.0% Capaian
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-emerald-800">Rp 2.20 M</p>
                  <span className="text-xs font-medium text-slate-500">tercatat s/d hari ini</span>
                </div>
              </div>

              {/* Visual Progress Bar Capaian & Gap to Target */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Progres Capaian terhadap Target</span>
                  <span className="font-bold text-emerald-800 font-mono">88.0% (Rp 2.20 M / Rp 2.50 M)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: '88%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="text-slate-500">
                    Sisa Gap: <strong className="text-rose-600 font-semibold font-mono">Rp 300 Jt</strong> (-12.0%)
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                    On Track
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Status Laporan Hari Ini */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Status Laporan Hari Ini
                  </span>
                  <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    Siap
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-base font-bold text-navy">Tersubmit & Approved</span>
                    <p className="text-[11px] text-slate-500">Log harian tanggal berjalan lengkap</p>
                  </div>
                </div>
              </div>

              {/* Visual Kelengkapan Shift */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Kelengkapan Shift Kasir</span>
                  <span className="font-bold text-emerald-800">100% (Pagi & Sore)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Settlement EDC: <strong className="text-slate-700">Klop</strong></span>
                  <span className="text-emerald-700 font-semibold">Tervalidasi ACC</span>
                </div>
              </div>
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
          {/* PIC Metric Cards: Status Pengawasan, Divisi Dipantau, dan Kepatuhan */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1: Status Pengawasan */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Status Pengawasan
                  </span>
                  <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    Aktif
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-navy">100% Real-Time</p>
                  <span className="text-xs font-medium text-slate-500">live stream</span>
                </div>
              </div>

              {/* Visual Integritas Log */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Integritas Log Real-Time</span>
                  <span className="font-bold text-emerald-800">100% Sinkron</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Sensor Audit: Aktif</span>
                  <span className="text-emerald-700 font-semibold">Tanpa Latensi</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Divisi Dipantau */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Total Divisi Dipantau
                  </span>
                  <span className="rounded-pill bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-200">
                    Seluruh Unit
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-navy">7 Unit Bisnis</p>
                  <span className="text-xs font-medium text-slate-500">operasional aktif</span>
                </div>
              </div>

              {/* Visual Cakupan Unit */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Cakupan Unit Bisnis</span>
                  <span className="font-bold text-navy">7 / 7 Divisi Ritel</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>58 Outlet Bandara</span>
                  <span className="text-sky-700 font-semibold">Terkoneksi Sobat API</span>
                </div>
              </div>
            </div>

            {/* Card 3: Tingkat Kepatuhan Laporan */}
            <div className="rounded-card-lg border border-line/60 bg-white/90 backdrop-blur-md p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tingkat Kepatuhan Laporan
                  </span>
                  <span className="rounded-pill bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    Tertib
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black text-emerald-800">98.2%</p>
                  <span className="text-xs font-medium text-slate-500">akurasi laporan</span>
                </div>
              </div>

              {/* Visual Kepatuhan Input */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Kepatuhan Input SOP</span>
                  <span className="font-bold text-emerald-800 font-mono">98.2% Tertib</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98.2%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>Standar Digital Tech IT</span>
                  <span className="text-emerald-700 font-semibold">Lulus Standar</span>
                </div>
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
