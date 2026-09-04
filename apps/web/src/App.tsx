import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteGuard } from './components/RouteGuard';
import { LoadingState } from './components/states';
import { ToastProvider } from './components/ui/Toast';
import { AppLayout } from './layout/AppLayout';
import { AuthProvider, useAuth } from './session/AuthContext';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LaporanPage = lazy(() => import('./pages/LaporanPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DailyReportPage = lazy(() => import('./pages/DailyReportPage'));
const TenantRevenuePage = lazy(() => import('./pages/TenantRevenuePage'));
const BudgetingPage = lazy(() => import('./pages/BudgetingPage'));
const CashflowPage = lazy(() => import('./pages/CashflowPage'));
const PnlPage = lazy(() => import('./pages/PnlPage'));
const AccountingDashboardPage = lazy(() => import('./pages/AccountingDashboardPage'));
const AccountingJournalPage = lazy(() => import('./pages/AccountingJournalPage'));
const AccountingPeriodsPage = lazy(() => import('./pages/AccountingPeriodsPage'));
const AccountingMasterPage = lazy(() => import('./pages/AccountingMasterPage'));
const AccountingImportPage = lazy(() => import('./pages/AccountingImportPage'));
const AccountingOutstandingPage = lazy(() => import('./pages/AccountingOutstandingPage'));
const AccountingCashflowReportPage = lazy(() => import('./pages/AccountingCashflowReportPage'));
const AccountingReconciliationPage = lazy(() => import('./pages/AccountingReconciliationPage'));

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
  return <Navigate to={user.divisionCode === 'ACC' ? '/accounting' : '/dashboard'} replace />;
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
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
