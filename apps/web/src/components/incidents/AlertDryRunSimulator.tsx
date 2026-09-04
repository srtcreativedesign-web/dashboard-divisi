import { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Send,
  RefreshCw,
  HelpCircle,
  Bell,
  Mail,
  Webhook,
} from 'lucide-react';
import { formatCurrencyIDR } from '../reports/exportUtils';
import { useToast } from '../ui/Toast';

interface SimulationScenario {
  id: string;
  name: string;
  category: string;
  division: string;
  testValue: number;
  testDays?: number;
  unit: string;
  description: string;
}

const PRESET_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sc-1',
    name: 'Lonjakan Tagihan Piutang Melewati 90 Hari',
    category: 'Piutang Kritis',
    division: 'PT Nusantara Megah Logistics',
    testValue: 85000000,
    testDays: 92,
    unit: 'IDR',
    description: 'Simulasi tagihan macet melebihi batas toleransi 60 hari.',
  },
  {
    id: 'sc-2',
    name: 'Drop Target Penjualan Ritel Ekstrem (55% MTD)',
    category: 'Deviasi Target',
    division: 'Divisi Cellular & Accessories',
    testValue: 55,
    unit: '% MTD',
    description: 'Simulasi realisasi penjualan berada di bawah batas ambang 75%.',
  },
  {
    id: 'sc-3',
    name: 'Selisih Mutasi Bank Menggantung Rp 12.500.000',
    category: 'Rekonsiliasi Bank',
    division: 'BCA Rekening Operasional',
    testValue: 12500000,
    unit: 'IDR',
    description: 'Simulasi selisih saldo mutasi bank melebihi batas toleransi Rp 0.',
  },
];

export interface AlertDryRunSimulatorProps {
  onSimulateTrigger?: (scenario: SimulationScenario) => void;
  className?: string;
}

export function AlertDryRunSimulator({
  onSimulateTrigger,
  className = '',
}: AlertDryRunSimulatorProps) {
  const defaultScenario = PRESET_SCENARIOS[0]!;
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(defaultScenario);
  const [simulatedValue, setSimulatedValue] = useState<number>(defaultScenario.testValue);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    status: 'triggered' | 'safe';
    severity: 'danger' | 'warning';
    message: string;
    dispatchedChannels: string[];
  } | null>(null);

  const { toast } = useToast();

  const handleSelectScenario = (sc: SimulationScenario) => {
    setSelectedScenario(sc);
    setSimulatedValue(sc.testValue);
    setSimulationResult(null);
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      setIsSimulating(false);

      // Evaluation logic based on scenario
      let isTriggered = false;
      let severity: 'danger' | 'warning' = 'warning';
      let message = '';
      let channels: string[] = ['In-App Popover'];

      if (selectedScenario.id === 'sc-1') {
        isTriggered = simulatedValue >= 40000000;
        severity = 'danger';
        message = `Nilai piutang ${formatCurrencyIDR(simulatedValue)} melampaui batas kritis Rp 40.000.000 dan usia > 60 hari.`;
        channels = ['In-App Popover', 'Email Direksi', 'Webhook Log'];
      } else if (selectedScenario.id === 'sc-2') {
        isTriggered = simulatedValue < 75;
        severity = 'warning';
        message = `Realisasi target ${simulatedValue}% berada di bawah batas ambang 75% MTD.`;
        channels = ['In-App Popover', 'Email Manager Divisi'];
      } else {
        isTriggered = simulatedValue > 0;
        severity = 'danger';
        message = `Selisih mutasi ${formatCurrencyIDR(simulatedValue)} melampaui batas toleransi Rp 0 (Nol Selisih).`;
        channels = ['In-App Popover', 'Email Direksi', 'Webhook Rekon'];
      }

      const result = {
        status: isTriggered ? ('triggered' as const) : ('safe' as const),
        severity,
        message: isTriggered ? message : 'Nilai yang diuji masih dalam parameter batas aman.',
        dispatchedChannels: isTriggered ? channels : [],
      };

      setSimulationResult(result);
      if (isTriggered && onSimulateTrigger) {
        onSimulateTrigger(selectedScenario);
      }
      toast(
        isTriggered
          ? 'Simulasi selesai: Kondisi pemicu alert terpenuhi!'
          : 'Simulasi selesai: Parameter dalam batas aman.',
        isTriggered ? 'info' : 'success',
      );
    }, 400);
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="alert-dry-run-simulator">
      {/* Top Banner */}
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-sky-50/40 to-white p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] text-white shadow-md ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy tracking-tight">
              Simulator Pemicu Peringatan Dini (Dry-Run Tester)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Uji coba validasi respon sistem dan kanal notifikasi terhadap skenario deviasi data tanpa mempengaruhi integritas database operasional riil.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Preset Scenarios Selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Pilih Skenario Uji Coba
          </h4>
          <div className="space-y-2">
            {PRESET_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedScenario.id === sc.id
                    ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-400'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                data-testid={`scenario-btn-${sc.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded">
                    {sc.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{sc.id}</span>
                </div>
                <p className="font-semibold text-navy text-xs mt-1.5">{sc.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{sc.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Testing Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Parameter Simulasi
          </h4>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Entitas / Divisi Target:</span>
              <p className="font-bold text-navy mt-0.5">{selectedScenario.division}</p>
            </div>

            <div>
              <label htmlFor="sim-val-input" className="block font-semibold text-slate-700 mb-1">
                Nilai Uji Coba ({selectedScenario.unit}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="sim-val-input"
                  type="number"
                  value={simulatedValue}
                  onChange={(e) => setSimulatedValue(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-navy focus:outline-none focus:border-sky-500"
                  data-testid="simulation-value-input"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ubah nilai untuk menguji apakah batas pemicu terlampaui.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0c4a6e] to-[#0284c7] hover:opacity-90 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
              data-testid="run-simulation-btn"
            >
              {isSimulating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{isSimulating ? 'Mengevaluasi Aturan...' : 'Jalankan Uji Coba (Dry Run)'}</span>
            </button>
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Hasil Evaluasi & Pemicu
          </h4>

          {simulationResult ? (
            <div
              className={`rounded-xl border p-4 space-y-3 animate-in fade-in duration-200 ${
                simulationResult.status === 'triggered'
                  ? 'border-rose-200 bg-rose-50/60'
                  : 'border-emerald-200 bg-emerald-50/60'
              }`}
              data-testid="simulation-result-box"
            >
              <div className="flex items-center gap-2">
                {simulationResult.status === 'triggered' ? (
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <h5
                    className={`font-bold text-xs ${
                      simulationResult.status === 'triggered' ? 'text-rose-900' : 'text-emerald-900'
                    }`}
                  >
                    {simulationResult.status === 'triggered'
                      ? 'Peringatan Dini Berhasil Dipicu!'
                      : 'Data Dalam Batas Aman'}
                  </h5>
                  <span className="text-[10px] text-slate-500">
                    Status: {simulationResult.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {simulationResult.message}
              </p>

              {simulationResult.status === 'triggered' && (
                <div className="pt-2 border-t border-rose-200/60 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    Kanal yang akan dikirim:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {simulationResult.dispatchedChannels.map((ch, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white border border-rose-200 text-rose-800 px-2 py-0.5 rounded-md"
                      >
                        <Bell className="h-2.5 w-2.5" />
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl"
              data-testid="simulation-idle-box"
            >
              <HelpCircle className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">Belum ada simulasi dijalankan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih skenario dan klik tombol jalankan untuk melihat respon pemicu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
