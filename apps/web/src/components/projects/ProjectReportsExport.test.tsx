import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProjectReportsExport } from './ProjectReportsExport';
import { projectApi } from '../../api/projects';
import type { Project } from '../../types/project';
vi.mock('../../api/projects', () => ({ projectApi: { getProgressReport: vi.fn(), getBastReport: vi.fn(), getFinancialSummary: vi.fn(), getExpenses: vi.fn(), getInvoices: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const project = { id: 3, name: 'Proyek UAT berjalan', division_code: 'PROJECT', status: 'in_progress', contract_value: '200000000', milestones: [{id: 1, title: 'Persiapan', weight_percentage: 20, status: 'completed', due_date: '2026-09-01'}], rabs: [], created_at: '', updated_at: '' } as unknown as Project;
function sources() {
 vi.mocked(projectApi.getProgressReport).mockResolvedValue(null as never);
 vi.mocked(projectApi.getBastReport).mockResolvedValue(null as never);
 vi.mocked(projectApi.getFinancialSummary).mockResolvedValue({ total_rab_budget: 150000000, total_actual_expense: 14000000 } as never);
 vi.mocked(projectApi.getExpenses).mockResolvedValue([]);
 vi.mocked(projectApi.getInvoices).mockResolvedValue([]);
}
it('LPJ berjalan memakai RAB server dan tidak mengklaim penutupan audit atau tanggal selesai', async () => {
 sources(); render(<ProjectReportsExport project={project} initialReportType="lpj" />);
 expect(await screen.findByText('Draf laporan · belum diverifikasi')).toBeInTheDocument();
 expect(screen.getByText('Rp 150.000.000')).toBeInTheDocument();
 expect(screen.getByText('20.0%')).toBeInTheDocument();
 expect(screen.getByText('Berjalan')).toBeInTheDocument();
 expect(screen.getByText('Belum tercatat')).toBeInTheDocument();
 expect(screen.queryByText(/Closed & Accountable/i)).not.toBeInTheDocument();
 expect(screen.queryByText(/telah rampung/)).not.toBeInTheDocument();
});
it('kegagalan sumber keuangan tidak diubah menjadi laporan nol yang bisa dicetak', async () => {
 sources(); vi.mocked(projectApi.getFinancialSummary).mockRejectedValue(new Error('offline'));
 render(<ProjectReportsExport project={project} initialReportType="lpj" />);
 expect(await screen.findByRole('alert')).toHaveTextContent('Data laporan belum lengkap');
 expect(screen.queryByRole('button', {name:'Cetak / Ekspor PDF'})).not.toBeInTheDocument();
});
