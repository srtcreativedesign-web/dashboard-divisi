import { AccountingLegacyRedirect } from './features/accounting/ui/AccountingLegacyRedirect';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteGuard } from './components/RouteGuard';
import { LoadingState } from './components/states';
import { ToastProvider } from './components/ui/Toast';
import { DisplayScaleProvider } from './context/DisplayScaleContext';
import { AppLayout } from './layout/AppLayout';
import { AuthProvider, useAuth } from './session/AuthContext';
import { moduleHome } from './config/mvp';
import { queryClient } from './api/queryClient';

const DashboardPage = lazy(() => import('./pages/core/DashboardPage'));
const LoginPage = lazy(() => import('./pages/core/LoginPage'));

// Accounting
const AccountingDepositsPage = lazy(() => import('./features/accounting/pages/AccountingDepositsPage'));
const AccountingDepositReconciliationPage = lazy(() => import('./features/accounting/pages/AccountingDepositReconciliationPage'));
const AccountingHrPage = lazy(() => import('./features/accounting/pages/AccountingHrPage'));
const AccountingVoucherPage = lazy(() => import('./features/accounting/pages/AccountingVoucherPage'));
const AccountingOmzetPage = lazy(() => import('./features/accounting/pages/AccountingOmzetPage'));
const AccountingAnnualOmzetPage = lazy(() => import('./features/accounting/pages/AccountingAnnualOmzetPage'));
const AccountingJournalPage = lazy(() => import('./features/accounting/pages/AccountingJournalPage'));
const AccountingPeriodsPage = lazy(() => import('./features/accounting/pages/AccountingPeriodsPage'));
const AccountingMasterPage = lazy(() => import('./features/accounting/pages/AccountingMasterPage'));
const AccountingImportPage = lazy(() => import('./features/accounting/pages/AccountingImportPage'));
const AccountingEntryPage = lazy(() => import('./features/accounting/pages/AccountingEntryPage'));
const AccountingWorkPage = lazy(() => import('./features/accounting/pages/AccountingWorkPage'));
const CellularReportPreviewPage = lazy(() => import('./features/accounting/pages/CellularReportPreviewPage'));
const AccountingOutstandingPage = lazy(() => import('./features/accounting/pages/AccountingOutstandingPage'));
const AccountingCashflowReportPage = lazy(() => import('./features/accounting/pages/AccountingCashflowReportPage'));
const AccountingReconciliationPage = lazy(() => import('./features/accounting/pages/AccountingReconciliationPage'));

// Projects
const ProjectDashboardPage = lazy(() => import('./features/projects/pages/ProjectDashboardPage'));
const ProjectListPage = lazy(() => import('./features/projects/pages/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('./features/projects/pages/ProjectDetailPage'));
const ProjectVendorPage = lazy(() => import('./features/projects/pages/ProjectVendorPage'));
const ProjectProgressPage = lazy(() => import('./features/projects/pages/ProjectProgressPage'));
const ProjectPaymentsPage = lazy(() => import('./features/projects/pages/ProjectPaymentsPage'));
const ProjectDocumentsPage = lazy(() => import('./features/projects/pages/ProjectDocumentsPage'));
const ProjectRabPage = lazy(() => import('./features/projects/pages/ProjectRabPage'));
const ProjectPettyCashPage = lazy(() => import('./features/projects/pages/ProjectPettyCashPage'));
const ProjectTimelinePage = lazy(() => import('./features/projects/pages/ProjectTimelinePage'));
const ProjectLpjPage = lazy(() => import('./features/projects/pages/ProjectLpjPage'));

const CellularOperationsPage = lazy(() => import('./features/cellular/pages/CellularOperationsPage'));
const CellularDashboardPage = lazy(() => import('./features/cellular/pages/CellularDashboardPage'));

export { queryClient } from './api/queryClient';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-slate-500">Memuat sesi...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={moduleHome(user.divisionCode)} replace />;
}

function DivisionDashboard() {
  const { user } = useAuth();
  if (user?.divisionCode === 'ACC') return <Navigate to="/accounting" replace />;
  if (user?.divisionCode === 'PROJECT') return <Navigate to="/projects" replace />;
  if (user?.divisionCode === 'CELL' || user?.divisionCode === 'CELLULAR') return <Navigate to="/cellular" replace />;
  return <RouteSuspense><DashboardPage /></RouteSuspense>;
}

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState label="Memuat halaman..." />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DisplayScaleProvider>
        <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<RouteSuspense><LoginPage /></RouteSuspense>} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RouteGuard>
                        <DivisionDashboard />
                      </RouteGuard>
                    }
                  />

                  {/* Accounting Routes */}
                  <Route path="/accounting/kas-bank/setoran" element={<RouteGuard capability="view:acc_deposits" divisionCode="ACC"><RouteSuspense><AccountingDepositsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/setoran" element={<AccountingLegacyRedirect to="/accounting/kas-bank/setoran" />} />
                  <Route path="/accounting/kas-bank/pencocokan" element={<RouteGuard capability="view:acc_deposits" divisionCode="ACC"><RouteSuspense><AccountingDepositReconciliationPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/pencocokan-setoran" element={<AccountingLegacyRedirect to="/accounting/kas-bank/pencocokan" />} />
                  <Route path="/accounting/administrasi/pegawai" element={<RouteGuard capability="view:acc_hr" divisionCode="ACC"><RouteSuspense><AccountingHrPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/kepegawaian" element={<AccountingLegacyRedirect to="/accounting/administrasi/pegawai" />} />
                  <Route path="/accounting/pengeluaran/voucher" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingVoucherPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/vouchers" element={<AccountingLegacyRedirect to="/accounting/pengeluaran/voucher" />} />
                  <Route path="/accounting/pendapatan/rekap" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingOmzetPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/omzet" element={<AccountingLegacyRedirect to="/accounting/pendapatan/rekap" />} />
                  <Route path="/accounting/pendapatan/analisis" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingAnnualOmzetPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/omzet-tahunan" element={<AccountingLegacyRedirect to="/accounting/pendapatan/analisis" />} />
                  <Route path="/accounting" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingEntryPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/dokumen/pengajuan" element={<RouteGuard capability="write:omzet" divisionCode="ACC"><RouteSuspense><AccountingWorkPage key="admin" mode="admin" /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/dokumen/pemeriksaan" element={<RouteGuard capability="validate:omzet" divisionCode="ACC"><RouteSuspense><AccountingWorkPage key="accounting" mode="accounting" /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/dokumen/persetujuan" element={<RouteGuard capability="approve:voucher" divisionCode="ACC"><RouteSuspense><AccountingWorkPage key="manager" mode="manager" /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/dokumen/realisasi" element={<RouteGuard capability="execute:payment" divisionCode="ACC"><RouteSuspense><AccountingWorkPage key="finance" mode="finance" /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/dokumen/register" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingWorkPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/pekerjaan" element={<AccountingLegacyRedirect to="/accounting/dokumen/register" />} />
                  <Route path="/accounting/dashboard" element={<AccountingLegacyRedirect to="/accounting" />} />
                  <Route path="/accounting/pembukuan/transaksi" element={<RouteGuard capability="view:acc_journal" divisionCode="ACC"><RouteSuspense><AccountingJournalPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/jurnal" element={<AccountingLegacyRedirect to="/accounting/pembukuan/transaksi" />} />
                  <Route path="/accounting/pendapatan/sumber" element={<RouteGuard capability="preview:cellular_report" divisionCode="ACC"><RouteSuspense><CellularReportPreviewPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/preview-cellular" element={<AccountingLegacyRedirect to="/accounting/pendapatan/sumber" />} />
                  <Route path="/accounting/pembukuan/impor" element={<RouteGuard capability="submit:acc_period" divisionCode="ACC"><RouteSuspense><AccountingImportPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/impor" element={<AccountingLegacyRedirect to="/accounting/pembukuan/impor" />} />
                  <Route path="/accounting/pembukuan/hutang-piutang" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingOutstandingPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/outstanding" element={<AccountingLegacyRedirect to="/accounting/pembukuan/hutang-piutang" />} />
                  <Route path="/accounting/kas-bank/cashflow" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingCashflowReportPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/cashflow" element={<AccountingLegacyRedirect to="/accounting/kas-bank/cashflow" />} />
                  <Route path="/accounting/kas-bank/rekonsiliasi" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingReconciliationPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/rekonsiliasi" element={<AccountingLegacyRedirect to="/accounting/kas-bank/rekonsiliasi" />} />
                  <Route path="/accounting/pembukuan/periode" element={<RouteGuard capability="view:acc_detail" divisionCode="ACC"><RouteSuspense><AccountingPeriodsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/periode" element={<AccountingLegacyRedirect to="/accounting/pembukuan/periode" />} />
                  <Route path="/accounting/pembukuan/master" element={<RouteGuard capability="view:acc_master" divisionCode="ACC"><RouteSuspense><AccountingMasterPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/master" element={<AccountingLegacyRedirect to="/accounting/pembukuan/master" />} />

                  {/* Project Routes */}
                  <Route path="/projects" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectDashboardPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/new" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectListPage forcedClassification="new" /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/maintenance" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectListPage forcedClassification="maintenance" /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/list" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectListPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/progress" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectProgressPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/payments" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectPaymentsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/vendors" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectVendorPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/documents" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectDocumentsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/rab" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectRabPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/petty-cash" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectPettyCashPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/timeline" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectTimelinePage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/lpj" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectLpjPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/:id" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectDetailPage /></RouteSuspense></RouteGuard>} />

                  <Route path="/cellular/operasional" element={<RouteGuard capability="view:cellular" divisionCode="CELL"><RouteSuspense><CellularOperationsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/cellular" element={<RouteGuard capability="view:cellular" divisionCode="CELL"><RouteSuspense><CellularDashboardPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/cellular/dashboard" element={<Navigate to="/cellular" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
        </ToastProvider>
      </DisplayScaleProvider>
    </ErrorBoundary>
  );
}
