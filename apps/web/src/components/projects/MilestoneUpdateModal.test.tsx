import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MilestoneUpdateModal } from './MilestoneUpdateModal';
import { Project, ProjectMilestone } from '../../types/project';
import { projectApi } from '../../api/projects';

vi.mock('../../api/projects', () => ({
  projectApi: {
    updateMilestone: vi.fn(),
  },
}));

const mockProject: Project = {
  id: 1,
  division_code: 'PROJECT',
  project_code: 'WO/MAINT/2026/038',
  name: 'Pembersihan & Penggantian Filter AHU Lt. 2',
  contract_value: 3970000,
  classification: 'maintenance',
  status: 'in_progress',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

const mockMilestone: ProjectMilestone = {
  id: 101,
  project_id: 1,
  title: '1. SURVEI',
  weight_percentage: 20,
  status: 'pending',
  payment_status: false,
  notes: 'Survei lokasi',
  start_date: '2026-03-05',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('MilestoneUpdateModal', () => {
  it('renders modal with milestone and project info', () => {
    render(
      <MilestoneUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        milestone={mockMilestone}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('WO/MAINT/2026/038')).toBeInTheDocument();
    expect(screen.getByText('1. SURVEI')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Survei lokasi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-03-05')).toBeInTheDocument();
    expect(screen.getByText('Selesai')).toBeInTheDocument();
    expect(screen.getByText('Sedang Berjalan')).toBeInTheDocument();
  });

  it('updates status and submits changes to projectApi', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();
    (projectApi.updateMilestone as any).mockResolvedValueOnce({
      ...mockMilestone,
      status: 'completed',
      notes: 'Survei lokasi selesai disetujui',
    });

    render(
      <MilestoneUpdateModal
        isOpen={true}
        onClose={handleClose}
        project={mockProject}
        milestone={mockMilestone}
        onSuccess={handleSuccess}
      />
    );

    // Select completed
    fireEvent.click(screen.getByText('Selesai'));

    // Change notes
    const noteInput = screen.getByDisplayValue('Survei lokasi');
    fireEvent.change(noteInput, { target: { value: 'Survei lokasi selesai disetujui' } });

    // Submit form
    fireEvent.click(screen.getByText('Simpan Perubahan'));

    await waitFor(() => {
      expect(projectApi.updateMilestone).toHaveBeenCalledWith(
        1,
        101,
        expect.objectContaining({
          status: 'completed',
          notes: 'Survei lokasi selesai disetujui',
          start_date: '2026-03-05',
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('menampilkan linimasa gantt proyek saat showTimeline aktif', () => {
    const timelineProject: Project = {
      ...mockProject,
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      milestones: [
        { ...mockMilestone, due_date: '2026-03-10' },
        {
          ...mockMilestone,
          id: 102,
          title: '2. IZIN KERJA',
          start_date: '2026-03-11',
          due_date: '2026-03-20',
        },
      ],
    };

    render(
      <MilestoneUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        project={timelineProject}
        milestone={timelineProject.milestones![0]!}
        showTimeline
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Linimasa Gantt Proyek')).toBeInTheDocument();
    expect(screen.getByText('2. IZIN KERJA')).toBeInTheDocument();
  });

  it('tidak menampilkan gantt saat showTimeline tidak aktif', () => {
    render(
      <MilestoneUpdateModal
        isOpen={true}
        onClose={vi.fn()}
        project={mockProject}
        milestone={mockMilestone}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByText('Linimasa Gantt Proyek')).not.toBeInTheDocument();
  });
});
