import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiException } from '../../../api/client';
import { cellularPreviewApi, comparePreviews, type PreviewProfile, type ReportPreview } from '../api/cellularPreview';
import CellularReportPreviewPage from './CellularReportPreviewPage';

const fixture = (profile: PreviewProfile, gross = 1100, shift = 100): ReportPreview => ({ profile, profile_version: 1, month: '2026-09', outlet: 'DATA CELLULAR T3', filename: 'anonim.xlsx', sha256: profile,
  rows: [{ date: '2026-09-01', values: { gross: { value: gross, raw: String(gross), cell: 'J9', sheet: 'Sumber', formula: '=1+1', cached: true }, shift_1: { value: shift, raw: String(shift), cell: 'F9', sheet: 'Sumber', formula: null, cached: false } } }],
  issues: [], summary: { days: 1, gross, formula_cells: 1 }, can_commit: false, coverage: { loaded_sheets: ['Sumber'], ignored_sheets: ['Legacy'], scope: 'Ringkasan saja' } });
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><CellularReportPreviewPage /></QueryClientProvider>);
const chooseFile = () => fireEvent.change(screen.getByLabelText('Berkas XLS atau XLSX'), { target: { files: [new File(['anonim'], 'anonim.xlsx')] } });
async function upload(profile: PreviewProfile) {
  fireEvent.change(screen.getByLabelText('Profil sumber'), { target: { value: profile } });
  chooseFile(); fireEvent.click(screen.getByRole('button', { name: 'Baca preview' }));
  await screen.findByRole('button', { name: `Hapus ${profile === 'daily' ? 'Harian & stok' : 'Omzet per shift'}` });
}

describe('Preview Cellular', () => {
  beforeEach(() => { vi.spyOn(cellularPreviewApi, 'preview').mockImplementation(async form => ({ data: fixture(form.get('profile') as PreviewProfile), meta: { trace_id: 'anonim' } })); });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it('unggah memakai multipart server dan memperlihatkan provenance tanpa tombol commit', async () => {
    mount(); fireEvent.change(screen.getByLabelText('Periode laporan'), { target: { value: '2026-09' } });
    await upload('daily');
    const form = vi.mocked(cellularPreviewApi.preview).mock.calls[0]?.[0];
    expect(form?.get('month')).toBe('2026-09'); expect(form?.get('profile')).toBe('daily'); expect(form?.get('file')).toBeInstanceOf(File);
    expect(screen.getByRole('region', { name: 'Detail sumber tanggal' })).toHaveTextContent('Sumber!J9');
    expect(screen.getByRole('region', { name: 'Detail sumber tanggal' })).toHaveTextContent('Cache formula');
    expect(screen.queryByRole('button', { name: /commit|posting|simpan transaksi/i })).not.toBeInTheDocument();
  });
  it('tidak mengganti profil yang sudah dibaca diam-diam dan menghapus hasil saat bulan berubah', async () => {
    mount(); fireEvent.change(screen.getByLabelText('Periode laporan'), { target: { value: '2026-09' } });
    await upload('daily'); fireEvent.click(screen.getByRole('button', { name: 'Baca preview' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Profil sudah tersedia'); expect(cellularPreviewApi.preview).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Periode laporan'), { target: { value: '2026-10' } });
    expect(screen.queryByRole('region', { name: 'Sumber yang sudah dibaca' })).not.toBeInTheDocument();
  });
  it('memperlihatkan error scanner dengan trace dari backend', async () => {
    vi.mocked(cellularPreviewApi.preview).mockRejectedValue(new ApiException(503, { code: 'SCANNER_UNAVAILABLE', message: 'Scanner belum siap', trace_id: 'trace-uji' }));
    mount(); chooseFile(); fireEvent.click(screen.getByRole('button', { name: 'Baca preview' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Scanner belum siap (Trace: trace-uji)');
  });
  it('membedakan selisih bruto, shift dan tanggal yang belum lengkap', () => {
    const first = fixture('daily', 1300); const second = fixture('shift', 1100, 120);
    const result = comparePreviews([first, second])[0];
    expect(result?.delta).toBe(200); expect(result?.shift).toBe(true); expect(result?.mismatch).toBe(true);
    second.rows = [];
    expect(comparePreviews([first, second])[0]?.incomplete).toBe(true);
    expect(comparePreviews([first])[0]?.delta).toBeNull();
  });
});
