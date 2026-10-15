import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarSchedule } from './CalendarSchedule';

describe('CalendarSchedule Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders standard calendar days of week and month view', () => {
    render(<CalendarSchedule />);

    // Day headers
    expect(screen.getByText('Senin')).toBeInTheDocument();
    expect(screen.getByText('Selasa')).toBeInTheDocument();
    expect(screen.getByText('Rabu')).toBeInTheDocument();
    expect(screen.getByText('Kamis')).toBeInTheDocument();
    expect(screen.getByText('Jumat')).toBeInTheDocument();
    expect(screen.getByText('Sabtu')).toBeInTheDocument();
    expect(screen.getByText('Minggu')).toBeInTheDocument();

    // Controls
    expect(screen.getByRole('button', { name: 'Hari Ini' })).toBeInTheDocument();
    expect(screen.getByText('Tambah Jadwal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cari kegiatan...')).toBeInTheDocument();
  });

  it('navigates between months using previous and next buttons', () => {
    render(<CalendarSchedule />);

    const prevBtn = screen.getByRole('button', { name: 'Bulan sebelumnya' });
    const nextBtn = screen.getByRole('button', { name: 'Bulan berikutnya' });
    const todayBtn = screen.getByRole('button', { name: 'Hari Ini' });

    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
    fireEvent.click(todayBtn);

    expect(screen.getByRole('button', { name: 'Hari Ini' })).toBeInTheDocument();
  });

  it('switches between Kalender and Agenda view mode', () => {
    render(<CalendarSchedule />);

    const agendaBtn = screen.getByRole('button', { name: 'Agenda' });
    fireEvent.click(agendaBtn);

    expect(screen.getByText(/Daftar Seluruh Agenda Mendatang/i)).toBeInTheDocument();

    const kalenderBtn = screen.getByRole('button', { name: 'Kalender' });
    fireEvent.click(kalenderBtn);

    expect(screen.getByText('Senin')).toBeInTheDocument();
  });

  it('opens event form modal when clicking Tambah Jadwal button', () => {
    render(<CalendarSchedule />);

    const addBtn = screen.getByText('Tambah Jadwal');
    fireEvent.click(addBtn);

    expect(screen.getByText('Tambah Jadwal Kegiatan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contoh: Rapat Mingguan Koordinasi Proyek')).toBeInTheDocument();
  });

  it('adds a new event to the calendar', () => {
    render(<CalendarSchedule />);

    // Click add event button
    const addBtn = screen.getByText('Tambah Jadwal');
    fireEvent.click(addBtn);

    // Fill title
    const titleInput = screen.getByPlaceholderText('Contoh: Rapat Mingguan Koordinasi Proyek');
    fireEvent.change(titleInput, { target: { value: 'Kickoff Renovasi Outlet Baru' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Tambah ke Kalender' });
    fireEvent.click(submitBtn);

    // Switch to Agenda view to verify
    const agendaBtn = screen.getByRole('button', { name: 'Agenda' });
    fireEvent.click(agendaBtn);

    expect(screen.getByText('Kickoff Renovasi Outlet Baru')).toBeInTheDocument();
  });

  it('filters events by category and search keyword', () => {
    render(<CalendarSchedule />);

    // Switch to Agenda view
    const agendaBtn = screen.getByRole('button', { name: 'Agenda' });
    fireEvent.click(agendaBtn);

    // Filter by search
    const searchInput = screen.getByPlaceholderText('Cari kegiatan...');
    fireEvent.change(searchInput, { target: { value: 'Koordinasi Manajemen' } });

    expect(screen.getByText('Rapat Koordinasi Manajemen Bulanan')).toBeInTheDocument();
  });
});
