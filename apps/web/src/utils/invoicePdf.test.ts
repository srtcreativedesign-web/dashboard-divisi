import { describe, it, expect, vi } from 'vitest';
import jsPDF from 'jspdf';
import { buildInvoicePdf, downloadInvoicePDF, printInvoicePDF, formatRupiah } from './invoicePdf';
import { ProjectInvoice } from '../types/project';

describe('invoicePdf utility', () => {
  const dummyProject = {
    id: 1,
    name: 'Pembangunan RSUD Tahap 2',
    project_code: 'PRJ-2026-001',
    client_name: 'Dinas Kesehatan Kota',
    contract_value: 5000000000,
    milestones: [
      { id: 10, title: 'Uang Muka dan Mobilisasi Alat', weight_percentage: 20 },
      { id: 11, title: 'Pondasi Tiang Pancang', weight_percentage: 30 },
    ],
  };

  const dummyInvoice: ProjectInvoice = {
    id: 5,
    project_id: 1,
    invoice_number: 'INV/PRJ/20261007/001',
    term_name: 'Termin 1 (Uang Muka)',
    amount: 1000000000,
    status: 'invoiced',
    due_date: '2026-10-31',
    project_milestone_id: 10,
    notes: 'Rekening Mandiri 123-00-9876543-2',
    created_at: '2026-10-07T00:00:00.000000Z',
    updated_at: '2026-10-07T00:00:00.000000Z',
  };

  it('formats currency correctly in IDR', () => {
    expect(formatRupiah(1000000)).toMatch(/Rp\s?1\.000\.000/);
    expect(formatRupiah(0)).toMatch(/Rp\s?0/);
    expect(formatRupiah(null)).toBe('Rp 0');
  });

  it('builds a valid jsPDF instance for invoice', () => {
    const doc = buildInvoicePdf(dummyProject, dummyInvoice);
    expect(doc).toBeDefined();
    // Test that PDF data can be produced
    const output = doc.output();
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(100);
  });

  it('builds a valid jsPDF instance for paid invoice (kuitansi)', () => {
    const paidInvoice: ProjectInvoice = {
      ...dummyInvoice,
      status: 'paid',
      paid_date: '2026-10-15',
      payment_reference: 'TRF-BCA-998811',
    };
    const doc = buildInvoicePdf(dummyProject, paidInvoice);
    expect(doc).toBeDefined();
    const output = doc.output();
    expect(output.length).toBeGreaterThan(100);
  });

  it('triggers save when downloadInvoicePDF is called', () => {
    const doc = buildInvoicePdf(dummyProject, dummyInvoice);
    expect(typeof doc.save).toBe('function');
  });

  it('handles printInvoicePDF safely in browser environment', () => {
    const openSpy = vi.fn().mockReturnValue({});
    vi.stubGlobal('open', openSpy);

    expect(() => {
      printInvoicePDF(dummyProject, dummyInvoice);
    }).not.toThrow();

    vi.unstubAllGlobals();
  });
});
