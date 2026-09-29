import { createContext, useContext, useState, type ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; traceId?: string }

const ToastContext = createContext<{ toast: (msg: string, type?: Toast['type'], traceId?: string) => void } | null>(null);

let idCounter = 0;

function ToastItem({ t }: { t: Toast }) {
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
      <div>{t.message}</div>
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
  const toast = (message: string, type: Toast['type'] = 'info', traceId?: string) => {
    const id = ++idCounter;
    // Don't auto-dismiss if there's a traceId so user has time to copy it, or extend timeout
    const timeout = traceId ? 10000 : 3000;
    setToasts((t) => [...t, { id, message, type, traceId }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 lg:bottom-6 lg:right-6 max-w-xs sm:max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} />
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
