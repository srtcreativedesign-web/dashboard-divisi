import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { depositsApi, type DepositReconciliation } from '../api/deposits';
import AccountingDepositReconciliationPage from './AccountingDepositReconciliationPage';

let role = 'ACCOUNTING';
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role, divisionCode: 'ACC' } }) }));
const fixture = (): DepositReconciliation => ({ month: '2026-10', page: 1, total: 1, as_of: '2026-10-07T09:00:00+07:00', items: [{ id: 'source', outlet_name: 'Outlet anonim', business_date: '2026-10-05', shift: '1', source_reference: 'OMZ-UJI', channels: [{ channel: 'cash', reported_amount: '999999999999.99', allocated_amount: '999999999999.98', received_amount: '200.10', unallocated_amount: '0.01', remaining_amount: '999999999799.88' }] }] });
const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AccountingDepositReconciliationPage /></MemoryRouter></QueryClientProvider>);
afterEach(() => { cleanup(); vi.restoreAllMocks(); role = 'ACCOUNTING'; });

it('menampilkan nominal eksak, sumber dan dasar pencocokan untuk Accounting', async () => {
  vi.spyOn(depositsApi, 'reconciliation').mockResolvedValue({ data: fixture(), meta: { trace_id: 'uji' } });
  show();
  const region = await screen.findByRole('region', { name: 'Kanal OMZ-UJI' });
  expect(within(region).getByRole('cell', { name: 'Rp 999.999.999.999,99' })).toBeInTheDocument();
  expect(within(region).getByRole('cell', { name: 'Rp 0,01' })).toBeInTheDocument();
  expect(screen.getByText(/Penerimaan tercatat dari semua tanggal/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Buka rekap setoran' })).toHaveAttribute('href', '/accounting/setoran');
});
it('role ringkasan tidak meminta rincian pencocokan', () => {
  role = 'HEAD_OPS';
  const request = vi.spyOn(depositsApi, 'reconciliation');
  show();
  expect(screen.getByRole('alert')).toHaveTextContent('Akses pencocokan');
  expect(request).not.toHaveBeenCalled();
});
it('kegagalan dapat dicoba kembali dan sumber kosong diberi arahan', async () => {
  vi.spyOn(depositsApi, 'reconciliation').mockRejectedValueOnce(new Error('Pencocokan gagal dimuat')).mockResolvedValue({ data: { ...fixture(), items: [], total: 0 }, meta: { trace_id: 'uji' } });
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Pencocokan gagal dimuat');
  fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));
  expect(await screen.findByText('Belum ada sumber omzet pada halaman ini')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
it('perubahan bulan mengembalikan pagination ke halaman pertama', async () => {
  const request = vi.spyOn(depositsApi, 'reconciliation').mockImplementation(async (month, page) => ({ data: { ...fixture(), month, page, total: 51 }, meta: { trace_id: 'uji' } }));
  show();
  await screen.findByText('Halaman 1 dari 2');
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
  await screen.findByText('Halaman 2 dari 2');
  fireEvent.change(screen.getByLabelText('Bulan tanggal bisnis omzet'), { target: { value: '2026-09' } });
  await waitFor(() => expect(request).toHaveBeenCalledWith('2026-09', 1));
  expect(await screen.findByText('Halaman 1 dari 2')).toBeInTheDocument();
});
