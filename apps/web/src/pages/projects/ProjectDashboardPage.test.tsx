import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { projectApi } from '../../api/projects';
import type { ProjectDashboard } from '../../types/project';
import ProjectDashboardPage from './ProjectDashboardPage';

vi.mock('../../api/projects', () => ({ projectApi: { getDashboard: vi.fn() } }));
vi.mock('recharts', () => {
  const Wrapper = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return Object.fromEntries(['Bar', 'BarChart', 'CartesianGrid', 'Cell', 'ComposedChart', 'Legend', 'Line', 'ResponsiveContainer', 'Tooltip', 'XAxis', 'YAxis'].map(name => [name, Wrapper]));
});

const summary: ProjectDashboard = {
  as_of: '2026-10-06T09:00:00+07:00', total_projects: 121, active_projects: 110,
  active_contract_value: '1234567.89', average_recorded_progress: 40, progress_covered_projects: 1,
  status_counts: { in_progress: 110, on_hold: 11 }, overdue_projects: 1,
  attention_projects: [{ id: 12, name: 'Renovasi Outlet', overdue_milestones_count: 2 }],
  monthly_trend: [{ month: '2026-10', new_count: 10, total_count: 121 }],
};

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Dashboard Project berbasis data', () => {
  it('menampilkan agregat, cakupan progres dan tautan tindak lanjut tanpa angka simulasi', async () => {
    vi.mocked(projectApi.getDashboard).mockResolvedValue(summary);
    render(<MemoryRouter><ProjectDashboardPage /></MemoryRouter>);
    expect(await screen.findByText('Ringkasan seluruh 121 proyek berdasarkan data tercatat.')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByText('1 dari 110 proyek aktif memiliki bobot 100%')).toBeTruthy();
    expect(screen.getByText(/1\.234\.567,89/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Renovasi Outlet/ }).getAttribute('href')).toBe('/projects/12');
    expect(screen.queryByText('68.4%')).toBeNull();
    expect(screen.queryByText('+12.5% vs Q2')).toBeNull();
    expect(screen.queryByText('Termin 3 Dibayarkan')).toBeNull();
  });

  it('membedakan kegagalan dari nol data dan menyediakan retry', async () => {
    vi.mocked(projectApi.getDashboard).mockRejectedValueOnce(new Error('Layanan gagal')).mockResolvedValueOnce(summary);
    render(<MemoryRouter><ProjectDashboardPage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Layanan gagal')).toBeTruthy();
    expect(screen.queryByText('Proyek Aktif')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(await screen.findByText('40%')).toBeTruthy();
    expect(projectApi.getDashboard).toHaveBeenCalledTimes(2);
  });

  it('tidak menganggap progres yang belum tersedia sebagai nol', async () => {
    vi.mocked(projectApi.getDashboard).mockResolvedValue({ ...summary, total_projects: 0, active_projects: 0, average_recorded_progress: null, progress_covered_projects: 0, attention_projects: [], overdue_projects: 0 });
    render(<MemoryRouter><ProjectDashboardPage /></MemoryRouter>);
    expect(await screen.findByText('Belum ada proyek')).toBeTruthy();
    expect(screen.getByText('Belum tersedia')).toBeTruthy();
    expect(screen.queryByText('0%')).toBeNull();
  });
});
