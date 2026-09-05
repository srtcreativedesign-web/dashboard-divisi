import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type DisplayScaleLevel = 90 | 100 | 110 | 120 | 125;

export interface ScaleOption {
  value: DisplayScaleLevel;
  label: string;
  description: string;
  isRecommended?: boolean;
}

export const SCALE_OPTIONS: ScaleOption[] = [
  { value: 90, label: '90%', description: 'Kompak (Layar kecil / densitas data tinggi)' },
  { value: 100, label: '100%', description: 'Standar (Ukuran awal)' },
  { value: 110, label: '110%', description: 'Nyaman (Teks & kartu lebih lega)', isRecommended: true },
  { value: 120, label: '120%', description: 'Besar (Sangat jelas & mudah dibaca)' },
  { value: 125, label: '125%', description: 'Ekstra Besar (Keterbacaan maksimal)' },
];

export const SCALE_STORAGE_KEY = 'dashboard-divisi.display-scale';

interface DisplayScaleContextType {
  scale: DisplayScaleLevel;
  setScale: (newScale: DisplayScaleLevel) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetScale: () => void;
  options: ScaleOption[];
}

const DisplayScaleContext = createContext<DisplayScaleContextType | null>(null);

function applyScaleToDocument(scaleValue: DisplayScaleLevel) {
  if (typeof document === 'undefined') return;

  // 1. Terapkan CSS zoom pada root element (Chromium, Edge, Safari, Firefox 126+)
  // CSS zoom secara proporsional meresize seluruh elemen layout, kartu, teks, dan SVG
  document.documentElement.style.zoom = `${scaleValue}%`;

  // 2. Terapkan base font-size untuk rem scaling konsisten (1rem = 16px standar)
  const basePx = (16 * scaleValue) / 100;
  document.documentElement.style.fontSize = `${basePx}px`;

  // 3. Set data-attribute untuk styling atau verifikasi tes otomatis
  document.documentElement.setAttribute('data-display-scale', `${scaleValue}%`);
  document.documentElement.setAttribute('data-scale-ratio', `${scaleValue / 100}`);

  // 4. Set CSS Custom Property untuk komponen yang membaca variable kustom
  document.documentElement.style.setProperty('--display-scale', `${scaleValue / 100}`);
}

export function DisplayScaleProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScaleState] = useState<DisplayScaleLevel>(() => {
    if (typeof window === 'undefined') return 100;
    try {
      const saved = localStorage.getItem(SCALE_STORAGE_KEY);
      if (saved) {
        const parsed = Number(saved);
        if ([90, 100, 110, 120, 125].includes(parsed)) {
          return parsed as DisplayScaleLevel;
        }
      }
    } catch {
      // ignore
    }
    return 100;
  });

  const setScale = useCallback((newScale: DisplayScaleLevel) => {
    setScaleState(newScale);
    try {
      localStorage.setItem(SCALE_STORAGE_KEY, String(newScale));
    } catch {
      // ignore
    }
    applyScaleToDocument(newScale);
  }, []);

  const zoomIn = useCallback(() => {
    const scaleValues: DisplayScaleLevel[] = [90, 100, 110, 120, 125];
    const currentIndex = scaleValues.indexOf(scale);
    if (currentIndex < scaleValues.length - 1) {
      const next = scaleValues[currentIndex + 1];
      if (next !== undefined) setScale(next);
    }
  }, [scale, setScale]);

  const zoomOut = useCallback(() => {
    const scaleValues: DisplayScaleLevel[] = [90, 100, 110, 120, 125];
    const currentIndex = scaleValues.indexOf(scale);
    if (currentIndex > 0) {
      const prev = scaleValues[currentIndex - 1];
      if (prev !== undefined) setScale(prev);
    }
  }, [scale, setScale]);

  const resetScale = useCallback(() => {
    setScale(100);
  }, [setScale]);

  // Terapkan skala ke document saat pertama kali mount atau saat scale berubah
  useEffect(() => {
    applyScaleToDocument(scale);
  }, [scale]);

  // Sinkronisasi antar tab browser melalui event storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SCALE_STORAGE_KEY && e.newValue) {
        const parsed = Number(e.newValue);
        if ([90, 100, 110, 120, 125].includes(parsed)) {
          setScaleState(parsed as DisplayScaleLevel);
          applyScaleToDocument(parsed as DisplayScaleLevel);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Shortcut keyboard aksesibilitas: Alt + Plus (Zoom In), Alt + Minus (Zoom Out), Alt + 0 (Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isInput) return;

      if (e.altKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      } else if (e.altKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomOut();
      } else if (e.altKey && e.key === '0') {
        e.preventDefault();
        resetScale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetScale]);

  return (
    <DisplayScaleContext.Provider
      value={{
        scale,
        setScale,
        zoomIn,
        zoomOut,
        resetScale,
        options: SCALE_OPTIONS,
      }}
    >
      {children}
    </DisplayScaleContext.Provider>
  );
}

const fallbackScaleContext: DisplayScaleContextType = {
  scale: 100,
  setScale: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  resetScale: () => {},
  options: SCALE_OPTIONS,
};

export function useDisplayScale() {
  const context = useContext(DisplayScaleContext);
  return context || fallbackScaleContext;
}
