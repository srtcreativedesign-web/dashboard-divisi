import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ProjectStageCard } from './ProjectStageCard';
import { Project } from '../../types/project';

const mockProject: Project = {
  id: 1,
  division_code: 'PROJECT',
  project_code: 'WO/MAINT/2026/038',
  name: 'Pembersihan & Penggantian Filter AHU Lt. 2',
  client_name: 'Kuncoro',
  location: 'Warehouse',
  description: 'Wrapping Mesin & Listrik',
  contract_value: 3970000,
  classification: 'maintenance',
  status: 'in_progress',
  start_date: '2026-03-01',
  end_date: '2026-03-31',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  milestones: [
    {
      id: 101,
      project_id: 1,
      title: '1. SURVEI',
      weight_percentage: 20,
      status: 'completed',
      payment_status: false,
      notes: 'Survei lokasi',
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    },
    {
      id: 102,
      project_id: 1,
      title: '2. IZIN KERJA',
      weight_percentage: 20,
      status: 'completed',
      payment_status: false,
      notes: 'Disetujui',
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    },
    {
      id: 103,
      project_id: 1,
      title: '3. RAB',
      weight_percentage: 20,
      status: 'in_progress',
      payment_status: false,
      notes: 'Total RAB Rp 3.970.000',
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    },
  ],
  rabs: [
    {
      id: 1,
      project_id: 1,
      item_name: 'Filter AHU',
      category: 'material',
      volume: 1,
      unit_price: 3970000,
      total_price: 3970000,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    },
  ],
};

describe('ProjectStageCard', () => {
  it('renders project header info, RAB badge, and metadata properly', () => {
    const handleStageClick = vi.fn();
    const handleDelete = vi.fn();

    render(
      <BrowserRouter>
        <ProjectStageCard
          project={mockProject}
          onStageClick={handleStageClick}
          onDeleteProject={handleDelete}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('WO/MAINT/2026/038')).toBeInTheDocument();
    expect(screen.getByText('Pembersihan & Penggantian Filter AHU Lt. 2')).toBeInTheDocument();
    expect(screen.getByText('Warehouse')).toBeInTheDocument();
    expect(screen.getByText('Kuncoro')).toBeInTheDocument();
    expect(screen.getAllByText(/3\.970\.000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LPJ')).toBeInTheDocument();

    const deleteBtn = screen.getByTitle('Hapus Proyek');
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockProject);
  });

  it('renders 5 milestone stages and handles stage clicks', () => {
    const handleStageClick = vi.fn();

    render(
      <BrowserRouter>
        <ProjectStageCard
          project={mockProject}
          onStageClick={handleStageClick}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('1. SURVEI')).toBeInTheDocument();
    expect(screen.getByText('2. IZIN KERJA')).toBeInTheDocument();
    expect(screen.getByText('3. RAB')).toBeInTheDocument();
    expect(screen.getByText('4. PAYMENT')).toBeInTheDocument();
    expect(screen.getByText('5. EXECUTION')).toBeInTheDocument();

    expect(screen.getByText('Survei lokasi')).toBeInTheDocument();
    expect(screen.getByText('Disetujui')).toBeInTheDocument();
    expect(screen.getByText('Total RAB Rp 3.970.000')).toBeInTheDocument();

    // Click stage 1 box
    fireEvent.click(screen.getByText('1. SURVEI').closest('div')!);
    expect(handleStageClick).toHaveBeenCalledWith(
      mockProject,
      expect.objectContaining({ title: '1. SURVEI' })
    );
  });
});
