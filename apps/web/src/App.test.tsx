import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App 7 Modul Resmi Dashboard Divisi', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
    window.history.pushState({}, '', '/');
  });

  it('merender aplikasi dengan layout utama dan dashboard', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Selamat Datang/i })).toBeTruthy();
  });

  it('navigasi ke dashboard dengan role BOD', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Selamat Datang/i })).toBeTruthy();
  });
});
