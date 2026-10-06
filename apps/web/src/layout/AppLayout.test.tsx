import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../session/AuthContext';
import { AppLayout } from './AppLayout';

vi.mock('../session/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../components/LogoutButton', () => ({ default: () => null }));
vi.mock('../components/ui/DetailSheet', () => ({ DetailSheet: () => null }));
vi.mock('../components/filters/StickyContextFilterBar', () => ({ StickyContextFilterBar: () => null }));
vi.mock('../components/reports/ExportReportModal', () => ({ ExportReportModal: () => null }));
vi.mock('../components/notifications', () => ({ NotificationBell: () => null, AuditLogModal: () => null }));

const session = {
  user: null, loading: true, error: null,
  login: vi.fn(), logout: vi.fn(), refresh: vi.fn(),
};
const user = { id: 'test-project', email: 'manager.project@dashboard.test', name: 'Manager Project', role: 'MANAGER', divisionCode: 'PROJECT' };
const view = () => (
  <MemoryRouter initialEntries={['/projects']}>
    <Routes>
      <Route element={<AppLayout />}><Route path="/projects" element={<h1>Project siap</h1>} /></Route>
      <Route path="/login" element={<h1>Halaman login</h1>} />
    </Routes>
  </MemoryRouter>
);

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Urutan hook layout saat sesi berubah', () => {
  it('beralih dari loading ke sesi valid dan kembali loading tanpa mengubah urutan hook', () => {
    vi.mocked(useAuth).mockReturnValue(session);
    const { rerender } = render(view());
    expect(screen.getByText('Memuat sesi...')).toBeTruthy();
    vi.mocked(useAuth).mockReturnValue({ ...session, loading: false, user });
    rerender(view());
    expect(screen.getByRole('heading', { name: 'Project siap' })).toBeTruthy();
    vi.mocked(useAuth).mockReturnValue({ ...session, user });
    rerender(view());
    expect(screen.getByText('Memuat sesi...')).toBeTruthy();
  });

  it('mengarahkan sesi kosong ke login setelah loading selesai', () => {
    vi.mocked(useAuth).mockReturnValue(session);
    const { rerender } = render(view());
    vi.mocked(useAuth).mockReturnValue({ ...session, loading: false });
    rerender(view());
    expect(screen.getByRole('heading', { name: 'Halaman login' })).toBeTruthy();
  });
});
