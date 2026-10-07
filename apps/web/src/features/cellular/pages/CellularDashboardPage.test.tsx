import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CellularDashboardPage from './CellularDashboardPage';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><CellularDashboardPage /></QueryClientProvider>);
}
describe('Daftar outlet Cellular', () => {
  it('menampilkan outlet yang dikembalikan API tanpa data dummy', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [{ id: 'cell-1', code: 'CELL-A', name: 'Outlet Cellular Uji', isActive: true }], meta: { trace_id: 'test' } }), { status: 200 })));
    renderPage();
    expect(await screen.findByText('Outlet Cellular Uji')).toBeInTheDocument();
    expect(screen.getByText('CELL-A')).toBeInTheDocument();
  });
  it('menampilkan keadaan kosong ketika outlet belum terdaftar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [], meta: { trace_id: 'test' } }), { status: 200 })));
    renderPage();
    expect(await screen.findByText('Belum ada outlet Cellular')).toBeInTheDocument();
  });
  it('menampilkan kegagalan API tanpa membuat angka pengganti', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 'FORBIDDEN_CAPABILITY', message: 'Akses Cellular ditolak', trace_id: 'test' } }), { status: 403 })));
    renderPage();
    expect(await screen.findByText('Akses Cellular ditolak')).toBeInTheDocument();
    expect(screen.queryByText('Outlet Cellular Uji')).not.toBeInTheDocument();
  });
});
