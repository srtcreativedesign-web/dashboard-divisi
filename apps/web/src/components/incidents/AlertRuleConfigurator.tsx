import { useState } from 'react';
import {
  Sliders,
  Bell,
  Mail,
  Webhook,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { INITIAL_ALERT_RULES, type AlertRuleConfig } from './incidentTypes';
import { useToast } from '../ui/Toast';

export interface AlertRuleConfiguratorProps {
  rules?: AlertRuleConfig[];
  onSaveRules?: (rules: AlertRuleConfig[]) => void;
  className?: string;
}

export function AlertRuleConfigurator({
  rules: initialRules = INITIAL_ALERT_RULES,
  onSaveRules,
  className = '',
}: AlertRuleConfiguratorProps) {
  const [rules, setRules] = useState<AlertRuleConfig[]>(initialRules);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { toast } = useToast();

  const handleThresholdChange = (id: string, value: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, thresholdValue: Math.max(0, value) } : r)),
    );
  };

  const handleToggleChannel = (id: string, channel: 'in_app' | 'email' | 'webhook') => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const exists = r.enabledChannels.includes(channel);
        const nextChannels = exists
          ? r.enabledChannels.filter((c) => c !== channel)
          : [...r.enabledChannels, channel];
        // Ensure at least in_app is kept
        return {
          ...r,
          enabledChannels: nextChannels.length > 0 ? nextChannels : ['in_app'],
        };
      }),
    );
  };

  const handleToggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
    );
  };

  const handleResetDefaults = () => {
    setRules(INITIAL_ALERT_RULES);
    toast('Aturan ambang batas dikembalikan ke default.', 'info');
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      if (onSaveRules) {
        onSaveRules(rules);
      }
      toast('Konfigurasi ambang batas peringatan berhasil disimpan.', 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="alert-rule-configurator">
      {/* Header Info Banner */}
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-sky-50/40 to-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] text-white shadow-md ring-1 ring-white/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy tracking-tight">
                Konfigurator Ambang Batas Peringatan Dini
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tentukan parameter pemicu alert finansial otomatis, toleransi deviasi omzet, dan kanal distribusi ke jajaran manajemen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              data-testid="reset-rules-btn"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Default</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
              data-testid="save-rules-btn"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div
            className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200"
            data-testid="save-success-banner"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Aturan peringatan aktif berhasil diperbarui dan disinkronkan ke audit trail.</span>
          </div>
        )}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`rounded-2xl border transition-all p-5 shadow-2xs ${
                rule.isActive
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-200/60 bg-slate-50/60 opacity-75'
              }`}
              data-testid={`rule-card-${rule.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rule.severity === 'danger'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {rule.severity === 'danger' ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {rule.severity === 'danger' ? 'Prioritas Kritis' : 'Peringatan Dini'}
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {rule.id}
                  </span>
                </div>

                {/* Active Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={() => handleToggleActive(rule.id)}
                    className="sr-only peer"
                    aria-label={`Aktifkan aturan ${rule.title}`}
                    data-testid={`rule-toggle-${rule.id}`}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              <h4 className="text-sm font-bold text-navy mt-3 leading-snug">
                {rule.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {rule.description}
              </p>

              {/* Threshold Value Input */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <label
                  htmlFor={`input-${rule.id}`}
                  className="text-xs font-semibold text-slate-700"
                >
                  Nilai Batas Ambang:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`input-${rule.id}`}
                    type="number"
                    value={rule.thresholdValue}
                    onChange={(e) => handleThresholdChange(rule.id, Number(e.target.value))}
                    disabled={!rule.isActive}
                    className="w-24 text-right px-2.5 py-1 text-xs font-bold font-mono bg-slate-50 border border-slate-200 rounded-lg text-navy focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                    data-testid={`rule-threshold-input-${rule.id}`}
                  />
                  <span className="text-xs font-medium text-slate-500 min-w-[70px]">
                    {rule.thresholdUnit}
                  </span>
                </div>
              </div>

              {/* Channels Selector */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">
                  Kanal Notifikasi:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleChannel(rule.id, 'in_app')}
                    disabled={!rule.isActive}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                      rule.enabledChannels.includes('in_app')
                        ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    data-testid={`channel-inapp-${rule.id}`}
                  >
                    <Bell className="h-3 w-3" />
                    <span>In-App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleChannel(rule.id, 'email')}
                    disabled={!rule.isActive}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                      rule.enabledChannels.includes('email')
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    data-testid={`channel-email-${rule.id}`}
                  >
                    <Mail className="h-3 w-3" />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleChannel(rule.id, 'webhook')}
                    disabled={!rule.isActive}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                      rule.enabledChannels.includes('webhook')
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    data-testid={`channel-webhook-${rule.id}`}
                  >
                    <Webhook className="h-3 w-3" />
                    <span>Webhook</span>
                  </button>
                </div>
              </div>

              {/* Timestamp Footer */}
              <div className="mt-3 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Pembaruan terakhir:</span>
                <span className="font-mono">{rule.lastUpdated}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
