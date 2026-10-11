import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DocumentWorkflow } from './DocumentWorkflow';
afterEach(cleanup);
it.each([['draft', 'Admin'], ['correction', 'Admin'], ['submitted', 'Staff Accounting'], ['pending_approval', 'Manager'], ['approved', 'Staff Finance']])('voucher %s menunjukkan penanggung jawab %s', (status, owner) => {
  render(<DocumentWorkflow status={status} kind="voucher" version={3} />);
  expect(screen.getByText('Penanggung jawab tahap: ' + owner)).toBeInTheDocument();
  expect(screen.getByText('Versi 3')).toBeInTheDocument();
});
it('omzet tervalidasi menunjukkan langkah setoran tanpa menganggap Manager selalu menyetujui', () => {
  render(<DocumentWorkflow status="validated" kind="omzet" version={3} />);
  expect(screen.getByText('Penanggung jawab tahap: Admin / Finance untuk setoran')).toBeInTheDocument();
  expect(screen.getByText(/tanpa selisih dapat langsung tervalidasi/)).toBeInTheDocument();
});

it('voucher lunas tidak tetap ditampilkan sebagai pekerjaan Finance yang tertunda', () => {
  render(<DocumentWorkflow status="approved" kind="voucher" version={4} paymentStatus="PAID" />);
  expect(screen.getByText('Penanggung jawab tahap: Realisasi selesai')).toBeInTheDocument();
});
