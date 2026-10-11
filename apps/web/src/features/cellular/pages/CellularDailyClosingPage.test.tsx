import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi, type DailyClosing } from '../api';
import CellularDailyClosingPage from './CellularDailyClosingPage';

const session = vi.hoisted(() => ({ role: 'ADMIN', divisionCode: 'CELL' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: session }) }));
const response = <T,>(data: T) => ({ data, meta: { trace_id: 'h1-test' } });
const row: DailyClosing = { id: 'closing-1', outlet_id: 'outlet-1', outlet_name: 'Cellular T3', business_date: '2026-10-01', shift_code: 'SHIFT-1', system_sales: '150000.00', cash: '100000.00', qris: '50000.00', edc: '0.00', transfer: '0.00', difference: '0.00', source_reference: 'CLOSE-T3-1', status: 'draft', review_note: null, maker_name: 'Admin Cellular', reviewer_name: null, approver_name: null, deadline_at: '2026-10-02T23:59:59+07:00', is_overdue: true, current_pic: { role: 'ADMIN', name: 'Admin Cellular' }, late_submission: { state: 'required', reason: null, requested_at: null, requested_by_name: null, approved_at: null, approved_by_name: null }, timeline: [{ id: 'event-1', action: 'saved', actor_name: 'Admin Cellular', actor_role: 'ADMIN', note: null, created_at: '2026-10-01T18:00:00+07:00' }], version: 1 };

function page() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><MemoryRouter><CellularDailyClosingPage /></MemoryRouter></QueryClientProvider>); }

describe('Pusat Closing H+1 Cellular', () => {
  beforeEach(() => { session.role = 'ADMIN'; vi.spyOn(cellularApi, 'outlets').mockResolvedValue(response([{ id: 'outlet-1', code: 'T3', name: 'Cellular T3' }])); vi.spyOn(cellularApi, 'dailyClosings').mockResolvedValue(response([row])); vi.spyOn(cellularApi, 'transitionDailyClosing').mockResolvedValue(response({ ...row, version: 2, late_submission: { ...row.late_submission!, state: 'requested', reason: 'Rekap kanal terlambat diterima' } })); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('menampilkan PIC, tenggat, izin terlambat, dan histori dokumen', async () => {
    const user = userEvent.setup(); page();
    expect(await screen.findByRole('heading', { name: 'Pusat Closing dan Penerimaan Harian' })).toBeInTheDocument();
    expect(screen.getByText('Izin dibutuhkan')).toBeInTheDocument();
    expect(screen.getAllByText('Admin Cellular').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Buka' }));
    expect(screen.getByRole('dialog', { name: 'Detail closing H+1' })).toBeInTheDocument();
    expect(screen.getByText('Draf disimpan')).toBeInTheDocument();
  });

  it('mewajibkan alasan sebelum Admin meminta izin terlambat', async () => {
    const user = userEvent.setup(); page(); await screen.findByText('Izin dibutuhkan');
    await user.click(screen.getByRole('button', { name: 'Minta izin' }));
    const submit = screen.getByRole('button', { name: 'Kirim permintaan' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Alasan'), 'Rekap kanal terlambat diterima');
    await user.click(submit);
    expect(cellularApi.transitionDailyClosing).toHaveBeenCalledWith(row, 'request-late', 'Rekap kanal terlambat diterima');
  });
});
