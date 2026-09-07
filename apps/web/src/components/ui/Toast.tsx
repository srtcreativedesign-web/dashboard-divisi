import { createContext, useContext, useState, type ReactNode } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }

const ToastContext = createContext<{ toast: (msg: string, type?: Toast['type']) => void } | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 lg:bottom-6 lg:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-card border px-4 py-3 text-sm shadow-glass backdrop-blur ${
              t.type === 'success' ? 'bg-success-light border-success/20 text-success' : t.type === 'error' ? 'bg-danger-light border-danger/20 text-danger' : 'bg-white border-line text-navy'
            }`}
          >
            {t.message}
          </div>
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
