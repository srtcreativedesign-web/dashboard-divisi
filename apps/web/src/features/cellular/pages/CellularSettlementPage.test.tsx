import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cellularApi, type Settlement } from '../api';
import CellularSettlementPage from './CellularSettlementPage';

const session = vi.hoisted(() => ({ role: 'FINANCE', divisionCode: 'CELL' }));
vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: session }) }));
const response = <T,>(data: T) => ({ data, meta: { trace_id: 'settlement-test' } });
const source = { daily_closing_id: 'closing-1', outlet_id: 'outlet-1', outlet_name: 'Data Cellular T3', business_date: '2026-10-08', shift_code: 'SHIFT-1', channel: 'qris' as const, expected: '1000000.00', submitted: '600000.00', reconciled: '400000.00', remaining: '600000.00' };
const settlement: Settlement = { id: 'settlement-1', daily_closing_id: 'closing-1', outlet_id: 'outlet-1', outlet_name: 'Data Cellular T3', business_date: '2026-10-08', shift_code: 'SHIFT-1', channel: 'qris', settlement_date: '2026-10-09', gross: '600000.00', fee: '3000.00', net: '597000.00', destination: 'BCA Operasional', reference: 'QRIS-001', status: 'submitted', review_note: null, created_by: 'finance-1', version: 2 };

function page() { const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); return render(<QueryClientProvider client={client}><CellularSettlementPage /></QueryClientProvider>); }

describe('Settlement Kanal Cellular', () => {
  beforeEach(() => { session.role = 'FINANCE'; vi.spyOn(cellularApi, 'settlementSources').mockResolvedValue(response([source])); vi.spyOn(cellularApi, 'settlements').mockResolvedValue(response([settlement])); vi.spyOn(cellularApi, 'saveSettlement').mockResolvedValue(response(settlement)); vi.spyOn(cellularApi, 'transitionSettlement').mockResolvedValue(response(settlement)); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it('memberi Finance kontrol sisa penerimaan dan formulir settlement', async () => {
    page(); expect(await screen.findByRole('heading', { name: 'Settlement Kanal Pembayaran' })).toBeInTheDocument();
    expect(screen.getAllByText(/600\.000/).length).toBeGreaterThan(0); fireEvent.click(screen.getByRole('button', { name: 'Catat dana' }));
    expect(screen.getByRole('heading', { name: 'Catat dana masuk' })).toBeInTheDocument(); expect(screen.getByLabelText('Nilai bruto')).toHaveValue('600000.00');
  });

  it('memberi Accounting tindakan rekonsiliasi dan koreksi', async () => {
    session.role = 'ACCOUNTING'; page(); await screen.findByRole('heading', { name: 'Settlement Kanal Pembayaran' }); fireEvent.click(screen.getByRole('button', { name: 'Register settlement' }));
    expect(screen.getByRole('button', { name: 'Rekonsiliasi' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Koreksi' })).toBeDisabled();
  });
});
