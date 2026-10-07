import { cleanup, render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { omzetApi } from '../../../api/omzet';
import AccountingAnnualOmzetPage from './AccountingAnnualOmzetPage';

vi.mock('../../../api/omzet', () => ({ omzetApi: { annual: vi.fn() } }));
const fixture = { year: 2026, source: 'acc_omzet_records:validated', amount: '0.00', validated_count: 1, pending_count: 2,
  months: [{ month: '2026-01', amount: '0.00', validated_count: 1, pending_count: 0 }, { month: '2026-02', amount: null, validated_count: 0, pending_count: 2 }], outlets: [] };
function show() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AccountingAnnualOmzetPage /></QueryClientProvider>); }
afterEach(() => { cleanup(); vi.resetAllMocks(); });
describe('Omzet tahunan dari sumber tervalidasi', () => {
  it('membedakan nol dan bulan tanpa data serta menampilkan rekap tertunda', async () => {
    vi.mocked(omzetApi.annual).mockResolvedValue({ data: fixture, meta: { trace_id: 'test' } });
    show();
    const zeroRow = (await screen.findByText('2026-01')).closest('tr')!;
    const missingRow = screen.getByText('2026-02').closest('tr')!;
    expect(within(zeroRow).getByText(/Rp/)).toHaveTextContent('0,00');
    expect(within(missingRow).getByText('Belum ada rekap tervalidasi')).toBeInTheDocument();
    expect(screen.getByText(/2 rekap belum tervalidasi/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tahun'), { target: { value: '2025' } });
    await waitFor(() => expect(omzetApi.annual).toHaveBeenCalledWith(2025));
  });
  it('error sumber tidak menjadi angka nol', async () => {
    vi.mocked(omzetApi.annual).mockRejectedValue(new Error('Sumber tidak tersedia'));
    show();
    await screen.findByText('Sumber tidak tersedia');
    expect(screen.queryByText(/Rp/)).not.toBeInTheDocument();
  });
  it('nominal besar mempertahankan dua desimal tanpa pembulatan Number', async () => {
    vi.mocked(omzetApi.annual).mockResolvedValue({ data: { ...fixture, amount: '90000000000000.01', months: [{ month: '2026-01', amount: '90000000000000.01', validated_count: 1, pending_count: 0 }] }, meta: { trace_id: 'test' } });
    show();
    const row = (await screen.findByText('2026-01')).closest('tr')!;
    expect(within(row).getByText(/Rp/)).toHaveTextContent('Rp 90.000.000.000.000,01');
  });
});
