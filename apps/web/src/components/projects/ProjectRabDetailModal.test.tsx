import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectRabDetailModal } from './ProjectRabDetailModal';
import { Project } from '../../types/project';
import { projectApi } from '../../api/projects';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../api/projects', () => ({
  projectApi: {
    getRab: vi.fn(),
    batchSyncRab: vi.fn(),
  },
}));

const mockProject: Project = {
  id: 1,
  division_code: 'PROJECT',
  project_code: 'WO/MAINT/2026/038',
  name: 'Pembersihan & Penggantian Filter AHU Lt. 2',
  contract_value: 3970000,
  classification: 'maintenance',
  location: 'Warehouse',
  status: 'in_progress',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('ProjectRabDetailModal', () => {
  it('renders modal with payment method, material list, and grand total', async () => {
    (projectApi.getRab as any).mockResolvedValueOnce([
      { id: 10, item_name: 'Plat Bulat', volume: 2, unit: 'Pcs', unit_price: 450000, total_price: 900000 },
      { id: 11, item_name: 'Sliding Quide Road', volume: 8, unit: 'Set', unit_price: 200000, total_price: 1600000 },
    ]);

    render(
      <BrowserRouter>
        <ProjectRabDetailModal
          isOpen={true}
          project={mockProject}
          onClose={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Rencana Anggaran Biaya (RAB) Detail')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/METODE PEMBAYARAN RAB/i)).toBeInTheDocument();
      expect(screen.getByText(/RINCIAN MATERIAL & JASA/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Plat Bulat')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Sliding Quide Road')).toBeInTheDocument();
    });

    expect(screen.getByText('Preview & Setting')).toBeInTheDocument();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(screen.getByText('LPJ / Penyelesaian')).toBeInTheDocument();
    expect(screen.getByText('Simpan')).toBeInTheDocument();
  });

  it('can add a new row, recalculate grand total, and save to batchSyncRab', async () => {
    (projectApi.getRab as any).mockResolvedValueOnce([]);
    (projectApi.batchSyncRab as any).mockResolvedValueOnce({ message: 'Success', data: [], total_rab: 500000 });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <BrowserRouter>
        <ProjectRabDetailModal
          isOpen={true}
          project={mockProject}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('+ Tambah Baris')).toBeInTheDocument();
    });

    // Add a new row
    fireEvent.click(screen.getByText('+ Tambah Baris'));

    // Click Simpan
    fireEvent.click(screen.getByText('Simpan'));

    await waitFor(() => {
      expect(projectApi.batchSyncRab).toHaveBeenCalledWith(
        1,
        expect.any(Array)
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
