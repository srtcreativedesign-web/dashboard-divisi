import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ProjectDetailPage from './ProjectDetailPage';
import { projectApi } from '../../../api/projects';

const auth = vi.hoisted(() => ({ role: 'BOD' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: auth.role, divisionCode: auth.role === 'BOD' ? null : 'PROJECT' } }) }));
vi.mock('../../../api/projects', () => ({ projectApi: { getProject: vi.fn(), downloadDocument: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it('reader detail tidak memiliki aksi ubah milestone, RAB, dokumen atau status administratif', async () => {
  vi.mocked(projectApi.getProject).mockResolvedValue({ id: 1, division_code: 'PROJECT', name: 'Proyek uji', status: 'planning', contract_value: '100.00', created_at: '', updated_at: '', milestones: [{ id: 1, project_id: 1, title: 'Pekerjaan uji', weight_percentage: 100, status: 'pending', payment_status: false, created_at: '', updated_at: '' }], rabs: [], documents: [{ id: 1, project_id: 1, title: 'Dokumen uji', created_at: '2026-10-06', updated_at: '' }] });
  render(<MemoryRouter initialEntries={['/projects/1']}><Routes><Route path="/projects/:id" element={<ProjectDetailPage />} /></Routes></MemoryRouter>);
  await screen.findByText('Proyek uji');
  expect(screen.queryByRole('button', { name: /Tambah Milestone/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Pembayaran & Termin' }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByText('Belum ditandai selesai')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'RAB & Anggaran' }));
  expect(screen.queryByRole('button', { name: /Tambah Item/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Dokumentasi' }));
  expect(screen.queryByRole('button', { name: /Unggah/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Unduh' })).toBeInTheDocument();
});
