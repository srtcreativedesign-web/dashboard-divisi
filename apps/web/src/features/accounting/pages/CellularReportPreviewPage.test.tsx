import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiException } from '../../../api/client';
import { cellularPreviewApi, comparePreviews, type PreviewProfile, type ReportPreview } from '../api/cellularPreview';
import { omzetApi } from '../../../api/omzet';
import CellularReportPreviewPage from './CellularReportPreviewPage';

vi.mock('../../../session/AuthContext', () => ({ useAuth: () => ({ user: { role: 'ADMIN', divisionCode: 'ACC' } }) }));

const fixture = (profile: PreviewProfile, gross = 1100, shift = 100): ReportPreview => ({ profile, profile_version: 1, month: '2026-09', outlet: 'DATA CELLULAR T3', filename: 'anonim.xlsx', sha256: profile, batch_id: `00000000-0000-4000-8000-${profile.padEnd(12, '0').slice(0, 12)}`, stage_status: 'staged',
  rows: [{ date: '2026-09-01', values: { gross: { value: gross, raw: String(gross), cell: 'J9', sheet: 'Sumber', formula: '=1+1', cached: true }, shift_1: { value: shift, raw: String(shift), cell: 'F9', sheet: 'Sumber', formula: null, cached: false } } }],
  issues: [], summary: { days: 1, gross, formula_cells: 1 }, can_commit: false, coverage: { loaded_sheets: ['Sumber'], ignored_sheets: ['Legacy'], scope: 'Ringkasan saja' } });
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><CellularReportPreviewPage /></MemoryRouter></QueryClientProvider>);
async function chooseFile(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText('Berkas XLS atau XLSX'), new File(['anonim'], 'anonim.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
}
async function selectOutlet(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('option', { name: 'Outlet Cellular' });
  const select = await screen.findByLabelText('Outlet Cellular') as HTMLSelectElement;
  if (select.value !== 'outlet-cell') await user.selectOptions(select, 'outlet-cell');
}
async function upload(profile: PreviewProfile) {
  const user = userEvent.setup();
  await selectOutlet(user);
  await user.selectOptions(screen.getByLabelText('Jenis laporan'), profile);
  await chooseFile(user);
  const button = screen.getByRole('button', { name: 'Periksa & simpan staging' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await screen.findByRole('button', { name: `Hapus ${profile === 'daily' ? 'Harian & stok' : 'Omzet per shift'}` });
}

describe('Preview Cellular', () => {
  beforeEach(() => {
    vi.spyOn(omzetApi, 'outlets').mockResolvedValue({ data: [{ id: 'outlet-cell', code: 'CELL-001', name: 'Outlet Cellular', divisionCode: 'CELL' }], meta: { trace_id: 'outlet' } });
    vi.spyOn(cellularPreviewApi, 'batches').mockResolvedValue({ data: [], meta: { trace_id: 'batch' } });
    vi.spyOn(cellularPreviewApi, 'preview').mockImplementation(async form => ({ data: fixture(form.get('profile') as PreviewProfile), meta: { trace_id: 'anonim' } }));
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });
  it('unggah memakai multipart server, memilih outlet, dan memperlihatkan provenance staging', async () => {
    mount(); fireEvent.change(screen.getByLabelText('Periode laporan'), { target: { value: '2026-09' } });
    await upload('daily');
    const form = vi.mocked(cellularPreviewApi.preview).mock.calls[0]?.[0];
    expect(form?.get('month')).toBe('2026-09'); expect(form?.get('profile')).toBe('daily'); expect(form?.get('outlet_id')).toBe('outlet-cell'); expect(form?.get('file')).toBeInstanceOf(File);
    fireEvent.click(screen.getByText('Lihat sumber angka dan formula'));
    expect(screen.getByRole('region', { name: 'Detail sumber tanggal' })).toHaveTextContent('Sumber!J9');
    expect(screen.getByRole('region', { name: 'Detail sumber tanggal' })).toHaveTextContent('Cache formula');
    expect(screen.getByRole('button', { name: 'Commit menjadi draf H+1' })).toBeDisabled();
  });
  it('tidak mengganti profil yang sudah dibaca diam-diam dan menghapus hasil saat bulan berubah', async () => {
    mount(); fireEvent.change(screen.getByLabelText('Periode laporan'), { target: { value: '2026-09' } });
    await upload('daily'); fireEvent.click(screen.getByRole('button', { name: 'Periksa & simpan staging' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Jenis laporan ini sudah dibaca'); expect(cellularPreviewApi.preview).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Periode laporan'), { target: { value: '2026-10' } });
    expect(screen.queryByRole('region', { name: 'Sumber yang sudah dibaca' })).not.toBeInTheDocument();
  });
  it('memperlihatkan error scanner dengan trace dari backend', async () => {
    vi.mocked(cellularPreviewApi.preview).mockRejectedValue(new ApiException(503, { code: 'SCANNER_UNAVAILABLE', message: 'Scanner belum siap', trace_id: 'trace-uji' }));
    const user = userEvent.setup();
    mount(); await selectOutlet(user); await chooseFile(user);
    const button = screen.getByRole('button', { name: 'Periksa & simpan staging' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
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
