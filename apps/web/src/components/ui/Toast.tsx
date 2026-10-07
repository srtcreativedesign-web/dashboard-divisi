import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; traceId?: string }

const ToastContext = createContext<{ toast: (msg: string, type?: Toast['type'], traceId?: string) => void } | null>(null);

let idCounter = 0;

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!t.traceId) return;
    try {
      await navigator.clipboard.writeText(t.traceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy traceId', e);
    }
  };

  return (
    <div
      className={`rounded-card border px-4 py-3 text-sm shadow-glass backdrop-blur flex flex-col gap-2 ${
        t.type === 'success' ? 'bg-success-light border-success/20 text-success' : t.type === 'error' ? 'bg-danger-light border-danger/20 text-danger' : 'bg-white border-line text-navy'
      }`}
    >
      <div className="flex items-start gap-3"><p className="flex-1">{t.message}</p><button type="button" onClick={onDismiss} aria-label="Tutup notifikasi" className="shrink-0 rounded p-1 hover:bg-black/5"><X className="h-4 w-4" /></button></div>
      {t.traceId && (
        <div className="flex items-center justify-between gap-3 text-xs bg-black/5 p-1.5 rounded-md mt-1">
          <code className="font-mono text-[10px] break-all">{t.traceId}</code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 shrink-0 bg-white/60 hover:bg-white rounded px-2 py-1 shadow-sm transition-colors text-slate-700"
            title="Salin Trace ID"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Tersalin' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => { const pending = timers.current; return () => pending.forEach(clearTimeout); }, []);
  const dismiss = useCallback((id: number) => setToasts(items => items.filter(item => item.id !== id)), []);
  const toast = useCallback((message: string, type: Toast['type'] = 'info', traceId?: string) => {
    const id = ++idCounter;
    // Don't auto-dismiss if there's a traceId so user has time to copy it, or extend timeout
    const timeout = traceId ? 10000 : 3000;
    setToasts((items) => [...items.filter(item => item.message !== message), { id, message, type, traceId }].slice(-3));
    const timer = setTimeout(() => { dismiss(id); timers.current.delete(timer); }, timeout);
    timers.current.add(timer);
  }, [dismiss]);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" aria-relevant="additions" className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 lg:bottom-6 lg:right-6 max-w-[calc(100vw-2rem)] sm:max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
