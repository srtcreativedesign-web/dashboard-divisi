import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import ProjectDocumentsPage from './ProjectDocumentsPage';

const state = vi.hoisted(() => ({ role: 'ACCOUNTING' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: state.role, divisionCode: 'PROJECT' } }) }));
vi.mock('../../../layout/ProjectPageLayout', () => ({ ProjectPageLayout: ({ children }: { children: (project: unknown, refresh: () => Promise<void>) => ReactNode }) =>
  children({ id: 1, documents: [{ id: 2, title: 'Dokumen uji.pdf', created_at: '2026-10-06' }] }, async () => {}) }));
vi.mock('../../../api/projects', () => ({ projectApi: { uploadDocument: vi.fn(), deleteDocument: vi.fn(), downloadDocument: vi.fn() } }));

afterEach(cleanup);
describe('Dokumen Project menurut role', () => {
  it('pembaca dapat mengunduh tanpa tombol mutasi', () => {
    state.role = 'ACCOUNTING';
    render(<ProjectDocumentsPage />);
    expect(screen.getByRole('button', { name: 'Unduh' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unggah Dokumen/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus dokumen' })).not.toBeInTheDocument();
  });
  it('Admin Project dapat mengunggah dan menghapus', () => {
    state.role = 'ADMIN';
    render(<ProjectDocumentsPage />);
    expect(screen.getByRole('button', { name: /Unggah Dokumen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus dokumen' })).toBeInTheDocument();
  });
});
