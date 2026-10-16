import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProjectGanttChart } from './ProjectGanttChart';
import { Project } from '../../types/project';

const baseProject: Project = {
  id: 1,
  division_code: 'PROJECT',
  project_code: 'PRJ-1',
  name: 'Proyek Renovasi Outlet',
  contract_value: 1000000,
  status: 'in_progress',
  start_date: '2026-09-01',
  end_date: '2026-10-02',
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  milestones: [
    {
      id: 1,
      project_id: 1,
      title: 'Survey Lokasi',
      weight_percentage: 20,
      status: 'completed',
      payment_status: true,
      start_date: '2026-09-01',
      due_date: '2026-09-04',
      actual_percentage: 100,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 2,
      project_id: 1,
      title: 'Design & Gambar Kerja',
      weight_percentage: 30,
      status: 'in_progress',
      payment_status: false,
      start_date: '2026-09-03',
      due_date: '2026-09-12',
      actual_percentage: 80,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 3,
      project_id: 1,
      title: 'Penyusunan RAB',
      weight_percentage: 50,
      status: 'pending',
      payment_status: false,
      due_date: '2026-09-16',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
  ],
};

describe('ProjectGanttChart', () => {
  it('menampilkan bar chart dengan status dan progres tiap milestone', () => {
    render(<ProjectGanttChart project={baseProject} />);

    expect(screen.getByText('Survey Lokasi')).toBeInTheDocument();
    expect(screen.getByText('Design & Gambar Kerja')).toBeInTheDocument();
    expect(screen.getByLabelText('Survey Lokasi, progres 100%')).toBeInTheDocument();
    expect(screen.getByLabelText('Design & Gambar Kerja, progres 80%')).toBeInTheDocument();
    expect(screen.getAllByText('Selesai').length).toBeGreaterThan(0);
    expect(screen.getByText('Berjalan')).toBeInTheDocument();
    expect(screen.getByText('50% bobot')).toBeInTheDocument();
  });

  it('menggunakan start_date proyek saat milestone tidak punya tanggal mulai', () => {
    render(<ProjectGanttChart project={baseProject} />);

    expect(screen.getByLabelText('Penyusunan RAB, progres 0%')).toBeInTheDocument();
  });

  it('menampilkan pesan kosong saat tidak ada tahapan berjadwal', () => {
    const emptyProject: Project = {
      ...baseProject,
      start_date: undefined,
      end_date: undefined,
      milestones: [{ ...baseProject.milestones![0]!, start_date: undefined, due_date: undefined }],
    };

    render(<ProjectGanttChart project={emptyProject} />);

    expect(screen.getByText(/Belum ada tahapan berjadwal/)).toBeInTheDocument();
  });
});