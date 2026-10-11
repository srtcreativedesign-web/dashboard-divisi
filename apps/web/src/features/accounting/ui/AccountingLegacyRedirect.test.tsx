import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { AccountingLegacyRedirect } from './AccountingLegacyRedirect';
function Destination() { const location = useLocation(); return <p>{location.pathname + location.search + location.hash}</p>; }
afterEach(cleanup);
it('alias mempertahankan bulan, UUID detail dan hash tanpa meneruskan tujuan eksternal', async () => {
  const query = '?month=2026-09&voucher=11111111-1111-4111-8111-111111111111&return=https://example.invalid#detail';
  render(<MemoryRouter initialEntries={['/accounting/vouchers' + query]}><Routes><Route path="/accounting/vouchers" element={<AccountingLegacyRedirect to="/accounting/pengeluaran/voucher" />} /><Route path="/accounting/pengeluaran/voucher" element={<Destination />} /></Routes></MemoryRouter>);
  expect(await screen.findByText('/accounting/pengeluaran/voucher' + query)).toBeInTheDocument();
});
