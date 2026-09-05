import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DisplayScaleProvider, useDisplayScale, SCALE_STORAGE_KEY } from '../../context/DisplayScaleContext';
import { DisplayScaleControl } from './DisplayScaleControl';
import { ToastProvider } from './Toast';

function renderWithScale(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      <DisplayScaleProvider>{ui}</DisplayScaleProvider>
    </ToastProvider>,
  );
}

describe('Fitur Universal Display Scaling (Resize Ukuran Tampilan)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.zoom = '';
    document.documentElement.style.fontSize = '';
    document.documentElement.removeAttribute('data-display-scale');
    document.documentElement.removeAttribute('data-scale-ratio');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.style.zoom = '';
    document.documentElement.style.fontSize = '';
    document.documentElement.removeAttribute('data-display-scale');
  });

  it('1. Merender kontrol ukuran tampilan dengan nilai default 100%', () => {
    renderWithScale(<DisplayScaleControl />);

    expect(screen.getByTestId('display-scale-control')).toBeInTheDocument();
    expect(screen.getByTestId('scale-zoom-out-btn')).toBeInTheDocument();
    expect(screen.getByTestId('scale-zoom-in-btn')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Verifikasi atribut documentElement awal
    expect(document.documentElement.getAttribute('data-display-scale')).toBe('100%');
    expect(document.documentElement.style.zoom).toBe('100%');
  });

  it('2. Satu kali klik zoom in (+) langsung memperbesar skala ke 110% dan berefek ke seluruh DOM', () => {
    renderWithScale(<DisplayScaleControl />);

    const zoomInBtn = screen.getByTestId('scale-zoom-in-btn');
    fireEvent.click(zoomInBtn);

    // Tampilan berubah ke 110% dengan badge "Nyaman"
    expect(screen.getByText('110%')).toBeInTheDocument();
    expect(screen.getByText('Nyaman')).toBeInTheDocument();

    // Efek global ke document root
    expect(document.documentElement.style.zoom).toBe('110%');
    expect(document.documentElement.getAttribute('data-display-scale')).toBe('110%');
    expect(document.documentElement.style.fontSize).toBe('17.6px'); // 16 * 1.1

    // Tersimpan di localStorage
    expect(localStorage.getItem(SCALE_STORAGE_KEY)).toBe('110');
  });

  it('3. Satu kali klik zoom out (-) memperkecil skala dan memperbarui DOM', () => {
    localStorage.setItem(SCALE_STORAGE_KEY, '110');
    renderWithScale(<DisplayScaleControl />);

    expect(screen.getByText('110%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByTestId('scale-zoom-out-btn');
    fireEvent.click(zoomOutBtn);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(document.documentElement.style.zoom).toBe('100%');
    expect(localStorage.getItem(SCALE_STORAGE_KEY)).toBe('100');
  });

  it('4. Membuka menu popover dan memilih preset langsung (misal 120% Besar)', () => {
    renderWithScale(<DisplayScaleControl />);

    const triggerBtn = screen.getByTestId('scale-menu-trigger-btn');
    fireEvent.click(triggerBtn);

    // Popover terbuka
    const popover = screen.getByTestId('display-scale-popover');
    expect(popover).toBeInTheDocument();
    expect(screen.getByText('Ukuran Tampilan Sistem')).toBeInTheDocument();

    // Terdapat opsi preset
    expect(screen.getByTestId('scale-option-90')).toBeInTheDocument();
    expect(screen.getByTestId('scale-option-100')).toBeInTheDocument();
    expect(screen.getByTestId('scale-option-110')).toBeInTheDocument();
    expect(screen.getByTestId('scale-option-120')).toBeInTheDocument();
    expect(screen.getByTestId('scale-option-125')).toBeInTheDocument();

    // Klik opsi 120%
    fireEvent.click(screen.getByTestId('scale-option-120'));

    // Popover otomatis tertutup dan tampilan berubah ke 120%
    expect(screen.queryByTestId('display-scale-popover')).not.toBeInTheDocument();
    expect(screen.getByText('120%')).toBeInTheDocument();
    expect(screen.getByText('Besar')).toBeInTheDocument();
    expect(document.documentElement.style.zoom).toBe('120%');
    expect(document.documentElement.getAttribute('data-display-scale')).toBe('120%');
    expect(localStorage.getItem(SCALE_STORAGE_KEY)).toBe('120');
  });

  it('5. Tombol Reset mengembalikan skala ke 100% Standar', () => {
    localStorage.setItem(SCALE_STORAGE_KEY, '125');
    renderWithScale(<DisplayScaleControl />);

    expect(screen.getByText('125%')).toBeInTheDocument();

    // Buka popover
    fireEvent.click(screen.getByTestId('scale-menu-trigger-btn'));
    const resetBtn = screen.getByTestId('scale-reset-btn');
    fireEvent.click(resetBtn);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(document.documentElement.style.zoom).toBe('100%');
    expect(localStorage.getItem(SCALE_STORAGE_KEY)).toBe('100');
  });

  it('6. Mendukung shortcut keyboard Alt++ dan Alt+- untuk penyesuaian cepat', () => {
    renderWithScale(<DisplayScaleControl />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    // Alt + = (Zoom In)
    fireEvent.keyDown(window, { altKey: true, key: '=' });
    expect(screen.getByText('110%')).toBeInTheDocument();
    expect(document.documentElement.style.zoom).toBe('110%');

    // Alt + 0 (Reset)
    fireEvent.keyDown(window, { altKey: true, key: '0' });
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(document.documentElement.style.zoom).toBe('100%');
  });

  it('7. Menyinkronkan perubahan skala dari tab browser lain via StorageEvent', () => {
    renderWithScale(<DisplayScaleControl />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SCALE_STORAGE_KEY,
          newValue: '120',
        }),
      );
    });

    expect(screen.getByText('120%')).toBeInTheDocument();
    expect(document.documentElement.style.zoom).toBe('120%');
  });
});
