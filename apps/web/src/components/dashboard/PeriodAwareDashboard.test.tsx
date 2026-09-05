import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';
import BodExecutiveDashboard from './BodExecutiveDashboard';
import { AuthProvider } from '../../session/AuthContext';
import { getPeriodSummary } from '../../data/dashboardPeriodData';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

describe('Fungsionalitas Filter Rentang Waktu Dashboard (7 Hari, Sebulan, Setahun, Hari Ini)', () => {
  afterEach(() => {
    localStorage.clear();
    cleanup();
  });

  describe('1. Verifikasi Data Generator Periode', () => {
    it('menghasilkan data yang berbeda dan proporsional untuk masing-masing periode', () => {
      const todayData = getPeriodSummary('today');
      const sevenDaysData = getPeriodSummary('7d');
      const monthData = getPeriodSummary('month');
      const ytdData = getPeriodSummary('ytd');

      // Nominal hari ini harus skala ratusan juta (~Rp 600 Jt)
      expect(todayData.totalRevenue).toBeLessThan(1e9);
      expect(todayData.totalRevenue).toBeGreaterThan(1e8);

      // 7 Hari harus skala beberapa miliar (~Rp 4 M)
      expect(sevenDaysData.totalRevenue).toBeGreaterThan(3e9);
      expect(sevenDaysData.totalRevenue).toBeLessThan(1e10);

      // Sebulan harus skala belasan miliar (~Rp 17 M)
      expect(monthData.totalRevenue).toBeGreaterThan(1e10);
      expect(monthData.totalRevenue).toBeLessThan(3e10);

      // Setahun (YTD) harus skala ratusan miliar (~Rp 160 M)
      expect(ytdData.totalRevenue).toBeGreaterThan(1e11);
    });
  });

  describe('2. Integrasi BOD Executive Dashboard dengan Filter Periode', () => {
    it('menampilkan data 7 Hari Terakhir saat period=7d disetel pada URL', async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/dashboard?period=7d']}>
            <BodExecutiveDashboard />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Badge periode harus menunjukkan 7 Hari Terakhir
      const badge = await screen.findByTestId('bod-period-badge');
      expect(badge).toHaveTextContent(/7 Hari Terakhir/i);

      // Nilai KPI Omset harus mencerminkan Rp 4.29 M (bukan Rp 17 M)
      expect(await screen.findByText('Rp 4.29')).toBeInTheDocument();
    });

    it('menampilkan data Setahun (YTD) saat period=ytd disetel pada URL', async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/dashboard?period=ytd']}>
            <BodExecutiveDashboard />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Badge periode harus menunjukkan Tahun Berjalan (YTD)
      const badge = await screen.findByTestId('bod-period-badge');
      expect(badge).toHaveTextContent(/Tahun Berjalan/i);

      // Nilai KPI Omset harus mencerminkan ratusan miliar (Rp 161.15 M)
      expect(await screen.findByText('Rp 161.15')).toBeInTheDocument();
    });

    it('menampilkan data Hari Ini saat period=today disetel pada URL', async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/dashboard?period=today']}>
            <BodExecutiveDashboard />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      const badge = await screen.findByTestId('bod-period-badge');
      expect(badge).toHaveTextContent(/Hari Ini/i);
      expect(await screen.findByText('Rp 0.61')).toBeInTheDocument();
    });
  });

  describe('3. Integrasi Admin Dashboard dengan Filter Periode', () => {
    it('menyesuaikan Target dan Realisasi Admin Divisi untuk periode 7 Hari', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter initialEntries={['/dashboard?period=7d']}>
              <DashboardPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>,
      );

      // Card target harus merefleksikan 7 hari
      expect(screen.getByText('Target 7 Hari Terakhir')).toBeInTheDocument();
      expect(screen.getByText('Pacing Siklus 7 Hari')).toBeInTheDocument();
      expect(screen.getByText('14/14 Shift Mingguan Terverifikasi')).toBeInTheDocument();
    });

    it('menyesuaikan Target dan Realisasi Admin Divisi untuk periode Setahun (YTD)', () => {
      localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
      localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <MemoryRouter initialEntries={['/dashboard?period=ytd']}>
              <DashboardPage />
            </MemoryRouter>
          </AuthProvider>
        </QueryClientProvider>,
      );

      // Card target harus merefleksikan YTD
      expect(screen.getByText('Target Divisi YTD (9 Bulan)')).toBeInTheDocument();
      expect(screen.getAllByText(/45 M/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Pacing Tahun Anggaran')).toBeInTheDocument();
      expect(screen.getByText('Bulan ke-9 / 12 (75%)')).toBeInTheDocument();
    });
  });
});
