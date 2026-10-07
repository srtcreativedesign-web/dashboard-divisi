import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectApi } from '../../../api/projects';
import type { PaginatedResponse, Project } from '../../../types/project';
import ProjectDashboardPage from './ProjectDashboardPage';

beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Dashboard Project hasil pull', () => {
  it('tidak menampilkan angka dan aktivitas fiktif saat sumber kosong', async () => {
    vi.spyOn(projectApi, 'getProjects').mockResolvedValue({ data: [], total: 0 } as unknown as PaginatedResponse<Project>);
    render(<MemoryRouter><ProjectDashboardPage /></MemoryRouter>);
    expect(await screen.findByText('Belum ada proyek yang tercatat.')).toBeInTheDocument();
    expect(screen.getByText('Belum tersedia')).toBeInTheDocument();
    expect(screen.queryByText('68.4%')).not.toBeInTheDocument();
    expect(screen.queryByText('+12.5% vs Q2')).not.toBeInTheDocument();
    expect(screen.queryByText('Termin 3 Dibayarkan')).not.toBeInTheDocument();
  });
  it('menampilkan kegagalan dan dapat mencoba ulang', async () => {
    const load = vi.spyOn(projectApi, 'getProjects').mockRejectedValueOnce(new Error('API proyek tidak tersedia')).mockResolvedValueOnce({ data: [], total: 0 } as unknown as PaginatedResponse<Project>);
    render(<MemoryRouter><ProjectDashboardPage /></MemoryRouter>);
    expect(await screen.findByText('API proyek tidak tersedia')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Coba lagi/i }));
    await screen.findByText('Belum ada proyek yang tercatat.');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
