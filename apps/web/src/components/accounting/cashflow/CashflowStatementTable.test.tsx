import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CashflowStatementTable } from './CashflowStatementTable';
afterEach(cleanup);
const amounts = { initialBalance: 100, totalRevenue: 200, totalAvailable: 300, totalOperational: 40, totalBackoffice: 10, totalEndingBalance: 250, totalOutstanding: 20, projectedEndingBalance: 230 };
describe('Rincian cashflow dari data layanan', () => {
  it('menampilkan kategori sumber termasuk pembalikan, tanpa angka contoh lama', () => {
    render(<CashflowStatementTable {...amounts} revenueItems={[{ code: 'B990', name: 'UAT penerimaan dari database', amount: 200 }]} operationalExpenses={[{ code: 'C990', name: 'UAT koreksi pengeluaran', amount: -10 }]} backofficeExpenses={[]} />);
    expect(screen.getByText('B990. UAT penerimaan dari database')).toBeInTheDocument();
    expect(screen.getByText('C990. UAT koreksi pengeluaran')).toBeInTheDocument();
    expect(screen.queryByText(/484 Transaksi|4.760.786.093|290.105.479|25 pos|Wrapping/)).not.toBeInTheDocument();
  });
  it('tidak menyisipkan pendapatan fiktif ketika rincian kosong', () => {
    render(<CashflowStatementTable {...amounts} revenueItems={[]} operationalExpenses={[]} backofficeExpenses={[]} />);
    expect(screen.queryByText(/Sales Store Harian|Bunga Bank|pos beban operasional lainnya/)).not.toBeInTheDocument();
  });
});
