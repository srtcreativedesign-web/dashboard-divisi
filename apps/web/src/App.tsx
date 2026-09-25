import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteGuard } from './components/RouteGuard';
import { LoadingState } from './components/states';
import { ToastProvider } from './components/ui/Toast';
import { DisplayScaleProvider } from './context/DisplayScaleContext';
import { AppLayout } from './layout/AppLayout';
import { AuthProvider, useAuth } from './session/AuthContext';

const DashboardPage = lazy(() => import('./pages/core/DashboardPage'));
const LaporanPage = lazy(() => import('./pages/shared/LaporanPage'));
const LoginPage = lazy(() => import('./pages/core/LoginPage'));
const DailyReportPage = lazy(() => import('./pages/shared/DailyReportPage'));
const TenantRevenuePage = lazy(() => import('./pages/shared/TenantRevenuePage'));
const BudgetingPage = lazy(() => import('./pages/shared/BudgetingPage'));
const CashflowPage = lazy(() => import('./pages/shared/CashflowPage'));
const PnlPage = lazy(() => import('./pages/shared/PnlPage'));
const AccountingDashboardPage = lazy(() => import('./pages/accounting/AccountingDashboardPage'));
const AccountingJournalPage = lazy(() => import('./pages/accounting/AccountingJournalPage'));
const AccountingPeriodsPage = lazy(() => import('./pages/accounting/AccountingPeriodsPage'));
const AccountingMasterPage = lazy(() => import('./pages/accounting/AccountingMasterPage'));
const AccountingImportPage = lazy(() => import('./pages/accounting/AccountingImportPage'));
const AccountingOutstandingPage = lazy(() => import('./pages/accounting/AccountingOutstandingPage'));
const AccountingCashflowReportPage = lazy(() => import('./pages/accounting/AccountingCashflowReportPage'));
const AccountingReconciliationPage = lazy(() => import('./pages/accounting/AccountingReconciliationPage'));
const AccAdminOperationalPage = lazy(() => import('./pages/accounting/AccAdminOperationalPage'));
const ProjectDashboardPage = lazy(() => import('./pages/projects/ProjectDashboardPage'));
const ProjectListPage = lazy(() => import('./pages/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const ProjectVendorPage = lazy(() => import('./pages/projects/ProjectVendorPage'));
const ProjectProgressPage = lazy(() => import('./pages/projects/ProjectProgressPage'));
const ProjectPaymentsPage = lazy(() => import('./pages/projects/ProjectPaymentsPage'));
const ProjectDocumentsPage = lazy(() => import('./pages/projects/ProjectDocumentsPage'));
const ProjectRabPage = lazy(() => import('./pages/projects/ProjectRabPage'));
const ProjectTimelinePage = lazy(() => import('./pages/projects/ProjectTimelinePage'));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-sm text-slate-500">Memuat sesi...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.divisionCode === 'ACC' ? '/accounting' : (user.divisionCode === 'PROJECT' ? '/projects' : '/dashboard')} replace />;
}

function DivisionDashboard() {
  const { user } = useAuth();
  if (user?.divisionCode === 'ACC') return <Navigate to="/accounting" replace />;
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
                  <Route
                    path="/laporan-harian"
                    element={
                      <RouteGuard>
                        <RouteSuspense>
                          <DailyReportPage />
                        </RouteSuspense>
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/rincian-tenant"
                    element={
                      <RouteGuard>
                        <RouteSuspense>
                          <TenantRevenuePage />
                        </RouteSuspense>
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/laporan"
                    element={
                      <RouteGuard>
                        <RouteSuspense>
                          <LaporanPage />
                        </RouteSuspense>
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/budgeting"
                    element={
                      <RouteGuard>
                        <RouteSuspense>
                          <BudgetingPage />
                        </RouteSuspense>
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/cashflow"
                    element={
                      <RouteGuard>
                        <RouteSuspense>
                          <CashflowPage />
                        </RouteSuspense>
                      </RouteGuard>
                    }
                  />
                  <Route
                    path="/pnl"
                    element={
                      <RouteGuard>
                        <RouteSuspense>
                          <PnlPage />
                        </RouteSuspense>
                      </RouteGuard>
                    }
                  />
                  <Route path="/accounting" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingDashboardPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/jurnal" element={<RouteGuard capability="view:acc_journal" divisionCode="ACC"><RouteSuspense><AccountingJournalPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/impor" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingImportPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/outstanding" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingOutstandingPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/cashflow" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingCashflowReportPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/rekonsiliasi" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingReconciliationPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/periode" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccountingPeriodsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/master" element={<RouteGuard capability="view:acc_master" divisionCode="ACC"><RouteSuspense><AccountingMasterPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/accounting/operasional" element={<RouteGuard capability="view:acc_report" divisionCode="ACC"><RouteSuspense><AccAdminOperationalPage /></RouteSuspense></RouteGuard>} />
                  
                  {/* Project Division Routes */}
                  <Route path="/projects" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectDashboardPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/list" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectListPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/progress" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectProgressPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/payments" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectPaymentsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/vendors" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectVendorPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/documents" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectDocumentsPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/rab" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectRabPage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/timeline" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectTimelinePage /></RouteSuspense></RouteGuard>} />
                  <Route path="/projects/:id" element={<RouteGuard capability="view:projects" divisionCode="PROJECT"><RouteSuspense><ProjectDetailPage /></RouteSuspense></RouteGuard>} />
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
