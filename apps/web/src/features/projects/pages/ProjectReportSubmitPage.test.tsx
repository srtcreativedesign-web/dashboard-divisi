import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProjectReportSubmitPage from './ProjectReportSubmitPage';
import { projectApi } from '../../../api/projects';
import { ToastProvider } from '../../../components/ui/Toast';

let mockUser = { id: 'usr-manager-1', role: 'MANAGER', divisionCode: 'PROJECT', name: 'Manager Project' };

vi.mock('../../../session/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../../api/projects', () => ({
  projectApi: {
    getReportPreview: vi.fn(),
    submitReport: vi.fn(),
    approveReport: vi.fn(),
    returnReport: vi.fn(),
    getReportDetail: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockUser = { id: 'usr-manager-1', role: 'MANAGER', divisionCode: 'PROJECT', name: 'Manager Project' };
});

const mockPendingPreview = {
  id: 'rep-uuid-1',
  division_code: 'PROJECT',
  period_start: '2026-10-01',
  period_end: '2026-10-31',
  is_already_submitted: false,
  status: 'PENDING',
  submitted_at: '2026-10-16T09:00:00Z',
  reviewed_at: null,
  notes: null,
  metrics: [
    { category: 'FINANCIAL', metric_key: 'contract_value_total', metric_label: 'Total Nilai Kontrak', metric_value: 1500000000, unit: 'IDR', display_order: 1 },
    { category: 'FINANCIAL', metric_key: 'actual_expenses_period', metric_label: 'Biaya Lapangan (Periode)', metric_value: 350000000, unit: 'IDR', display_order: 2 },
    { category: 'FINANCIAL', metric_key: 'cash_collected_period', metric_label: 'Pembayaran Cair (Cash In)', metric_value: 300000000, unit: 'IDR', display_order: 3 },
    { category: 'PROGRESS', metric_key: 'average_physical_progress', metric_label: 'Rata-rata Progres Fisik', metric_value: 75.0, unit: 'PERCENT', display_order: 4 },
    { category: 'VOLUME', metric_key: 'active_projects_count', metric_label: 'Jumlah Proyek Berjalan', metric_value: 3, unit: 'COUNT', display_order: 5 },
  ],
  breakdowns: [
    {
      entity_code: 'PRJ-001',
      entity_name: 'Pembangunan Tower Seluler',
      figures: {
        contract_value: 1500000000,
        actual_expense: 350000000,
        invoiced: 500000000,
        paid: 300000000,
        progress_pct: 75.0,
        status: 'in_progress',
      },
      display_order: 1,
    },
  ],
};

describe('ProjectReportSubmitPage', () => {
  it('manager melihat data proyek, indikator mode review, serta tombol Setujui dan Kembalikan', async () => {
    vi.mocked(projectApi.getReportPreview).mockResolvedValue(mockPendingPreview as any);

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectReportSubmitPage />
        </MemoryRouter>
      </ToastProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Laporan Divisi ke BOD' })).toBeInTheDocument();
    expect(screen.getByText(/Mode Review/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Setujui \(Approve ke BOD\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kembalikan/i })).toBeInTheDocument();
  });

  it('manager dapat menyetujui laporan proyek untuk diteruskan ke BOD', async () => {
    vi.mocked(projectApi.getReportPreview).mockResolvedValue(mockPendingPreview as any);
    vi.mocked(projectApi.approveReport).mockResolvedValue({
      id: 'rep-uuid-1',
      division_code: 'PROJECT',
      period_start: '2026-10-01',
      period_end: '2026-10-31',
      status: 'SUBMITTED',
      metrics: [],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectReportSubmitPage />
        </MemoryRouter>
      </ToastProvider>
    );

    const approveBtn = await screen.findByRole('button', { name: /Setujui \(Approve ke BOD\)/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(projectApi.approveReport).toHaveBeenCalledWith('rep-uuid-1');
    });
  });

  it('manager dapat mengembalikan laporan dengan mengisi catatan revisi', async () => {
    vi.mocked(projectApi.getReportPreview).mockResolvedValue(mockPendingPreview as any);
    vi.mocked(projectApi.returnReport).mockResolvedValue({
      id: 'rep-uuid-1',
      division_code: 'PROJECT',
      period_start: '2026-10-01',
      period_end: '2026-10-31',
      status: 'REVISION',
      notes: 'Tolong cek biaya operasional',
      metrics: [],
    });

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectReportSubmitPage />
        </MemoryRouter>
      </ToastProvider>
    );

    const returnBtn = await screen.findByRole('button', { name: /Kembalikan/i });
    fireEvent.click(returnBtn);

    const modal = await screen.findByTestId('return-report-modal');
    expect(modal).toBeInTheDocument();

    const textarea = screen.getByRole('textbox', { name: /Catatan Revisi/i });
    fireEvent.change(textarea, { target: { value: 'Tolong cek biaya operasional' } });

    const sendReturnBtn = screen.getByRole('button', { name: /Kirim Pengembalian/i });
    fireEvent.click(sendReturnBtn);

    await waitFor(() => {
      expect(projectApi.returnReport).toHaveBeenCalledWith('rep-uuid-1', 'Tolong cek biaya operasional');
    });
  });

  it('admin project memiliki input tanggal unlocked, tombol sinkron data, dan tidak ada tombol approve manual', async () => {
    mockUser = { id: 'usr-admin-1', role: 'ADMIN', divisionCode: 'PROJECT', name: 'Admin Project' };
    vi.mocked(projectApi.getReportPreview).mockResolvedValue(mockPendingPreview as any);

    render(
      <ToastProvider>
        <MemoryRouter>
          <ProjectReportSubmitPage />
        </MemoryRouter>
      </ToastProvider>
    );

    expect(await screen.findByRole('heading', { name: 'Laporan Divisi ke BOD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sinkron Data/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal Awal')).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal Akhir')).toBeInTheDocument();

    // Admin should not see Approve or Return buttons
    expect(screen.queryByRole('button', { name: /Setujui \(Approve ke BOD\)/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kembalikan/i })).not.toBeInTheDocument();
  });
});
