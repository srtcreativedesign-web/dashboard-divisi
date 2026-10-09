import { api } from '../../../api/client';

export const previewProfiles = { daily: 'Harian & stok', income: 'Pendapatan & pengeluaran', shift: 'Omzet per shift', ecsys: 'Rekap Ecsys', update: 'Update Cellular' } as const;
export type PreviewProfile = keyof typeof previewProfiles;
export interface SourceValue { value: number | null; raw: string | null; sheet: string; cell: string; formula: string | null; cached: boolean }
export interface PreviewRow { date: string; values: Record<string, SourceValue>; references?: { label: string; sheet: string; cell: string; raw: string | null }[] }
export interface ReportPreview {
  profile: PreviewProfile; profile_version: number; month: string; outlet: string; filename: string; sha256: string;
  rows: PreviewRow[]; issues: { code: string; message: string; date: string | null; sheet: string | null; cell: string | null; difference: number | null }[];
  summary: { days: number; gross: number | null; formula_cells: number }; can_commit: false; batch_id: string; stage_status: 'staged';
  coverage: { loaded_sheets: string[]; ignored_sheets: string[]; scope: string };
}
export interface CellularImportBatch {
  id: string; outlet_id: string; outlet_name: string; source_division_code: string; profile: PreviewProfile; profile_version: number;
  period: string; original_name: string; sha256: string; status: 'staged' | 'committed' | 'superseded'; version: number;
  summary: ReportPreview['summary']; issues: ReportPreview['issues']; created_at: string; committed_at: string | null;
}
export interface CellularImportCommit { created_count: number; record_ids: string[]; period: string; outlet_id: string }
export const cellularPreviewApi = {
  preview: (form: FormData) => api.upload<ReportPreview>('/accounting/cellular-preview', form),
  batches: (month: string, outlet_id: string) => api.get<CellularImportBatch[]>('/accounting/cellular-imports', { month, outlet_id }),
  commit: (batch_ids: string[], acknowledge_warnings: boolean) => api.post<CellularImportCommit>('/accounting/cellular-imports/commit', { batch_ids, acknowledge_warnings }),
};
export const metricLabels: Record<string, string> = { gross: 'Omzet bruto', cash: 'Kas', edc: 'EDC', qris: 'QRIS', expense: 'Pengeluaran', expected_deposit: 'Rencana setoran', transfer_1: 'Transfer Mandiri', transfer_2: 'Transfer BCA', shift_1: 'Shift 1', shift_2: 'Shift 2', shift_3: 'Shift 3', source_net: 'Neto sumber', ecsys_realization: 'Realisasi Ecsys', ecsys_net: 'Net sales Ecsys', ecsys_entered: 'Masuk Ecsys' };

export function comparePreviews(previews: ReportPreview[]) {
  const dates = [...new Set(previews.flatMap(p => p.rows.map(r => r.date)))].sort();
  return dates.map(date => {
    const sources = previews.map(p => ({ preview: p, row: p.rows.find(r => r.date === date) }));
    const gross = sources.map(s => s.row?.values.gross?.value).filter((v): v is number => typeof v === 'number');
    const delta = gross.length > 1 ? Math.round((Math.max(...gross) - Math.min(...gross)) * 100) / 100 : null;
    const shift = ['shift_1', 'shift_2', 'shift_3'].some(metric => {
      const amounts = sources.map(s => s.row?.values[metric]?.value).filter((v): v is number => typeof v === 'number');
      return amounts.length > 1 && Math.round((Math.max(...amounts) - Math.min(...amounts)) * 100) >= 1;
    });
    return { date, sources, delta, shift, incomplete: gross.length !== previews.length, mismatch: (delta !== null && delta >= 0.01) || shift };
  });
}
