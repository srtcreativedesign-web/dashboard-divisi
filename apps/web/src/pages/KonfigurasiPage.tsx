import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Settings,
  Sliders,
  AlertOctagon,
  Sparkles,
  Store,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { useDivisionConfigs, useOutlets } from '../hooks/useBod';
import { useToast } from '../components/ui/Toast';
import { EmptyState, ErrorState, LoadingState } from '../components/states';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusPill } from '../components/StatusPill';
import {
  AlertRuleConfigurator,
  IncidentResolutionBoard,
  AlertDryRunSimulator,
} from '../components/incidents';

type ConfigTab = 'divisions' | 'rules' | 'incidents' | 'simulator';

export default function KonfigurasiPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ConfigTab) || 'divisions';
  const [activeTab, setActiveTab] = useState<ConfigTab>(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ConfigTab;
    if (tabParam && ['divisions', 'rules', 'incidents', 'simulator'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ConfigTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Division & Outlet config state (Real BE)
  const { data, isLoading, error, refetch } = useDivisionConfigs();
  const outletQ = useOutlets();
  const { toast } = useToast();
  const [code, setCode] = useState('WRAP');
  const [modules, setModules] = useState('dashboard,revenue');
  const [kpis, setKpis] = useState('revenue.gross');

  const mut = useMutation({
    mutationFn: () =>
      api
        .post<unknown>(`/division-configs/${code}`, {
          enabledModules: modules.split(',').map((s) => s.trim()).filter(Boolean),
          enabledKpis: kpis.split(',').map((s) => s.trim()).filter(Boolean),
        })
        .then((r) => r.data),
    onSuccess: () => {
      toast('Config disimpan', 'success');
      void refetch();
    },
    onError: () => {
      const err = mut.error as unknown as { message?: string; traceId?: string };
      toast(
        `${err.message ?? 'Gagal simpan'}${err.traceId ? ` — ${err.traceId}` : ''}`,
        'error',
      );
    },
  });

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="konfigurasi-page">
      {/* Modern Glassmorphic Top Header */}
      <section className="rounded-2xl border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/80 px-2.5 py-0.5 rounded-full">
                Tata Kelola & Konfigurasi
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-500">Real BE & Alert Engine</span>
            </div>
            <h1 className="mt-1.5 text-2xl lg:text-3xl font-bold tracking-tight text-navy">
              Konfigurasi Sistem & Resolusi Anomali
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl leading-relaxed">
              Pusat kendali pengaturan divisi, ambang batas peringatan dini finansial, tata kelola insiden operasional, serta simulasi respon sistem.
            </p>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="mt-6 flex items-center gap-2 border-b border-line/60 pb-px overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabChange('divisions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'divisions'
                ? 'border-sky-600 text-sky-900 bg-sky-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            data-testid="tab-divisions"
          >
            <Settings className="h-4 w-4" />
            <span>Divisi & Outlet</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'rules'
                ? 'border-sky-600 text-sky-900 bg-sky-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            data-testid="tab-rules"
          >
            <Sliders className="h-4 w-4" />
            <span>Aturan Ambang Batas</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('incidents')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'incidents'
                ? 'border-sky-600 text-sky-900 bg-sky-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            data-testid="tab-incidents"
          >
            <AlertOctagon className="h-4 w-4" />
            <span>Pusat Manajemen Insiden</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'simulator'
                ? 'border-sky-600 text-sky-900 bg-sky-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            data-testid="tab-simulator"
          >
            <Sparkles className="h-4 w-4" />
            <span>Simulasi Pemicu Alert</span>
          </button>
        </div>
      </section>

      {/* Tab 1: Divisi & Outlet (Preserved Real BE Implementation) */}
      {activeTab === 'divisions' && (
        <div className="space-y-6 animate-in fade-in duration-150" data-testid="tab-content-divisions">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              description={(error as Error).message}
              onRetry={() => void refetch()}
            />
          ) : !data ? (
            <EmptyState />
          ) : (
            <>
              {/* Section Divisi */}
              <section className="rounded-2xl border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-navy">Konfigurasi Modul Divisi</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      GET /division-configs & POST /division-configs/{'{divisionCode}'} (capability:manage:division).
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-line/40">
                  <table className="min-w-[720px] w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-line">
                      <tr>
                        <th scope="col" className="px-4 py-3">Kode</th>
                        <th scope="col" className="px-4 py-3">Modules</th>
                        <th scope="col" className="px-4 py-3">KPIs</th>
                        <th scope="col" className="px-4 py-3">Aktif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/40 bg-white">
                      {(
                        data as unknown as {
                          divisionCode: string;
                          enabledModules: string[];
                          enabledKpis: string[];
                          isActive: boolean;
                        }[]
                      ).map((d) => (
                        <tr key={d.divisionCode} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-navy">{d.divisionCode}</td>
                          <td className="px-4 py-3 text-slate-600">{d.enabledModules.join(', ')}</td>
                          <td className="px-4 py-3 text-slate-600">{d.enabledKpis.join(', ')}</td>
                          <td className="px-4 py-3">
                            <StatusPill status={d.isActive ? 'Aktif' : 'Nonaktif'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Section Outlet */}
              <section className="rounded-2xl border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm">
                <h2 className="text-base font-bold text-navy">Daftar Outlet Terdaftar</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  GET /org/outlets scoped per role/divisi.
                </p>

                {outletQ.isLoading ? (
                  <p className="mt-3 text-xs text-slate-500">Memuat outlet...</p>
                ) : outletQ.error ? (
                  <ErrorState
                    description={(outletQ.error as Error).message}
                    onRetry={() => void outletQ.refetch()}
                  />
                ) : (() => {
                  const rows = (outletQ.data ?? []) as unknown as {
                    code: string;
                    name: string;
                    divisionId: string;
                    isActive: boolean;
                  }[];
                  if (rows.length === 0)
                    return (
                      <EmptyState
                        title="Belum ada outlet"
                        description="Seed outlet belum tersedia — jalankan php artisan db:seed"
                      />
                    );
                  return (
                    <>
                      <div className="mt-4 overflow-x-auto rounded-xl border border-line/40">
                        <table className="min-w-[520px] w-full text-left text-xs">
                          <caption className="sr-only">Outlet per divisi</caption>
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-line">
                            <tr>
                              <th scope="col" className="px-4 py-3">Kode</th>
                              <th scope="col" className="px-4 py-3">Nama</th>
                              <th scope="col" className="px-4 py-3">Aktif</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line/40 bg-white">
                            {rows.slice(0, 20).map((o) => (
                              <tr key={o.code} className="hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-navy">{o.code}</td>
                                <td className="px-4 py-3 text-slate-600">{o.name}</td>
                                <td className="px-4 py-3">
                                  <StatusPill status={o.isActive ? 'Aktif' : 'Nonaktif'} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {rows.length} outlet terlihat (scope {rows.length > 7 ? 'BOD lintas' : '1:1'})
                      </p>
                    </>
                  );
                })()}
              </section>

              {/* Section Upsert */}
              <section className="rounded-2xl border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm">
                <h2 className="text-base font-bold text-navy">Upsert Parameter Divisi (Real BE)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Perbarui daftar modul dan KPI aktif.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-24"
                    placeholder="WRAP"
                    aria-label="Kode divisi"
                  />
                  <Input
                    value={modules}
                    onChange={(e) => setModules(e.target.value)}
                    className="flex-1 min-w-[200px]"
                    placeholder="dashboard,revenue"
                    aria-label="Modules"
                  />
                  <Input
                    value={kpis}
                    onChange={(e) => setKpis(e.target.value)}
                    className="flex-1 min-w-[200px]"
                    placeholder="revenue.gross"
                    aria-label="KPIs"
                  />
                  <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
                    Simpan
                  </Button>
                </div>
                {mut.isError && (
                  <p className="mt-2 text-xs text-danger font-medium">
                    {(mut.error as Error).message}
                  </p>
                )}
                {mut.isSuccess && (
                  <p className="mt-2 text-xs text-success font-semibold">Tersimpan</p>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Alert Rules Configurator */}
      {activeTab === 'rules' && (
        <div className="animate-in fade-in duration-150" data-testid="tab-content-rules">
          <AlertRuleConfigurator />
        </div>
      )}

      {/* Tab 3: Incident Management Board */}
      {activeTab === 'incidents' && (
        <div className="animate-in fade-in duration-150" data-testid="tab-content-incidents">
          <IncidentResolutionBoard />
        </div>
      )}

      {/* Tab 4: Alert Dry-Run Simulator */}
      {activeTab === 'simulator' && (
        <div className="animate-in fade-in duration-150" data-testid="tab-content-simulator">
          <AlertDryRunSimulator />
        </div>
      )}
    </div>
  );
}
