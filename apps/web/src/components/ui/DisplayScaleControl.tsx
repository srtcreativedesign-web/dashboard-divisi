import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Scaling, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useDisplayScale, type DisplayScaleLevel } from '../../context/DisplayScaleContext';
import { useToast } from './Toast';

interface DisplayScaleControlProps {
  compact?: boolean;
  className?: string;
}

export function DisplayScaleControl({ compact = false, className = '' }: DisplayScaleControlProps) {
  const { scale, setScale, zoomIn, zoomOut, resetScale, options } = useDisplayScale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toastContext = useToastSafe();

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelectScale = (newScale: DisplayScaleLevel, label: string) => {
    setScale(newScale);
    setIsOpen(false);
    if (toastContext?.toast) {
      toastContext.toast(`Ukuran tampilan disetel ke ${newScale}% (${label})`, 'info');
    }
  };

  const handleReset = () => {
    resetScale();
    setIsOpen(false);
    if (toastContext?.toast) {
      toastContext.toast('Ukuran tampilan dikembalikan ke Standar (100%)', 'info');
    }
  };

  const isAtMin = scale <= 90;
  const isAtMax = scale >= 125;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Kontrol Utama Stepper + Dropdown Trigger */}
      <div
        className="flex items-center rounded-xl border border-slate-200/90 bg-slate-50/90 p-0.5 shadow-2xs transition-all hover:border-sky-300"
        data-testid="display-scale-control"
      >
        {/* Tombol Perkecil (-) */}
        <button
          type="button"
          onClick={zoomOut}
          disabled={isAtMin}
          aria-label="Perkecil ukuran tampilan"
          title="Perkecil tampilan (-10%) (Alt+-)"
          data-testid="scale-zoom-out-btn"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-navy hover:shadow-2xs active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>

        {/* Tombol Buka Menu Pilihan Skala */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={`Skala ukuran tampilan ${scale}%. Klik untuk pilihan preset`}
          title="Klik untuk memilih ukuran tampilan (90% - 125%)"
          data-testid="scale-menu-trigger-btn"
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-700 hover:text-primary-700 hover:bg-white/80 rounded-md transition-all cursor-pointer"
        >
          <Scaling className="h-3.5 w-3.5 text-primary-600" />
          <span>{scale}%</span>
          {scale === 110 && !compact && (
            <span className="hidden sm:inline rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-semibold border border-emerald-200">
              Nyaman
            </span>
          )}
          {scale >= 120 && !compact && (
            <span className="hidden sm:inline rounded-full bg-sky-100 text-sky-800 px-1.5 py-0.2 text-[9px] font-semibold border border-sky-200">
              Besar
            </span>
          )}
        </button>

        {/* Tombol Perbesar (+) */}
        <button
          type="button"
          onClick={zoomIn}
          disabled={isAtMax}
          aria-label="Perbesar ukuran tampilan"
          title="Perbesar tampilan (+10%) (Alt++)"
          data-testid="scale-zoom-in-btn"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-navy hover:shadow-2xs active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Popover Menu Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pengaturan Skala Tampilan"
          data-testid="display-scale-popover"
          className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-sky-200/90 ring-1 ring-black/5 p-3.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5"
        >
          {/* Header Popover */}
          <div className="border-b border-slate-100 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <Scaling className="h-4 w-4 text-primary-600" />
                <span>Ukuran Tampilan Sistem</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Alt + / -</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Satu kali klik mengubah ukuran seluruh dashboard, form, tabel, dan modal secara langsung dan tersimpan otomatis.
            </p>
          </div>

          {/* Opsi Preset Skala */}
          <div className="space-y-1">
            {options.map((opt) => {
              const isSelected = scale === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectScale(opt.value, opt.description.split(' ')[0] ?? opt.label)}
                  data-testid={`scale-option-${opt.value}`}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-primary-50 text-primary-900 font-bold border border-primary-200/80 shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center h-6 w-11 rounded-lg text-xs font-mono font-bold ${
                        isSelected ? 'bg-primary-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs truncate">{opt.description}</span>
                        {opt.isRecommended && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            <Sparkles className="h-2.5 w-2.5" /> Disarankan
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {/* Footer: Reset Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              data-testid="scale-reset-btn"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-700 hover:underline py-1 px-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset ke Standar (100%)</span>
            </button>
            <span className="text-[10px] text-slate-400 font-medium">Auto-saved</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper hook agar aman jika dipanggil di luar ToastProvider saat testing
function useToastSafe() {
  try {
    return useToast();
  } catch {
    return null;
  }
}
