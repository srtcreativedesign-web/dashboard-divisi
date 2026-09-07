import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider } from '../ui/Toast';
import { AuthProvider } from '../../session/AuthContext';
import DailyReportPage from '../../pages/DailyReportPage';
import { useApprovalStore } from '../../store/approvalStore';
import {
  ApprovalInboxCentral,
  ApprovalReviewModal,
  ApprovalRequest,
  INITIAL_APPROVAL_REQUESTS,
} from './index';

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('Fase 8: Pusat Persetujuan Finansial Berjenjang (ISSUE-26)', () => {
  describe('ApprovalReviewModal Component', () => {
    const mockRequest: ApprovalRequest = {
      id: 'test-req-01',
      referenceNo: 'REQ-TEST-001',
      category: 'daily_revenue',
      title: 'Laporan Pendapatan Tes',
      description: 'Deskripsi uji coba laporan pendapatan.',
      divisionCode: 'WRAP',
      divisionName: 'Wrapping',
      amount: 45000000,
      priority: 'medium',
      status: 'pending_review',
      requesterId: 'user-01',
      requesterName: 'Budi Santoso',
      requesterRole: 'PIC Wrapping',
      submittedAt: '04 Sep 2026, 09:00 WIB',
      thresholdBreached: true,
      thresholdBreachDetails: 'Target deviasi melebihi 10%.',
      diffFields: [
        {
          label: 'Target',
          originalValue: 'Rp 40.000.000',
          proposedValue: 'Rp 40.000.000',
          isChanged: false,
        },
        {
          label: 'Realisasi',
          originalValue: 'Rp 0',
          proposedValue: 'Rp 45.000.000',
          diffText: '+Rp 45.000.000',
          isChanged: true,
        },
      ],
    };

    it('renders request details, badges, and diff table correctly', () => {
      render(
        <ApprovalReviewModal
          request={mockRequest}
          isOpen={true}
          onClose={vi.fn()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );

      expect(screen.getByText('REQ-TEST-001')).toBeInTheDocument();
      expect(screen.getByText('Laporan Pendapatan Tes')).toBeInTheDocument();
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
      expect(screen.getByText('Wrapping (WRAP)')).toBeInTheDocument();
      expect(screen.getByText('Peringatan Ambang Batas Risiko Finansial')).toBeInTheDocument();
      expect(screen.getByText('Target deviasi melebihi 10%.')).toBeInTheDocument();
      expect(screen.getByText('Realisasi')).toBeInTheDocument();
      expect(screen.getByText('+Rp 45.000.000')).toBeInTheDocument();
    });

    it('approves request with optional note when confirm approve is clicked', () => {
      const mockApprove = vi.fn();
      const mockClose = vi.fn();

      render(
        <ApprovalReviewModal
          request={mockRequest}
          isOpen={true}
          onClose={mockClose}
          onApprove={mockApprove}
          onReject={vi.fn()}
        />
      );

      // Switch to approve mode
      fireEvent.click(screen.getByTestId('btn-approve-mode'));

      // Add optional note
      const noteInput = screen.getByPlaceholderText('Contoh: Dokumen bukti lengkap dan valid.');
      fireEvent.change(noteInput, { target: { value: 'Dokumen lengkap dan valid' } });

      // Click confirm
      fireEvent.click(screen.getByTestId('btn-confirm-approve'));

      expect(mockApprove).toHaveBeenCalledWith('test-req-01', 'Dokumen lengkap dan valid');
      expect(mockClose).toHaveBeenCalled();
    });

    it('validates mandatory rejection reason and submits rejection only when valid (>=5 chars)', () => {
      const mockReject = vi.fn();
      const mockClose = vi.fn();

      render(
        <ApprovalReviewModal
          request={mockRequest}
          isOpen={true}
          onClose={mockClose}
          onApprove={vi.fn()}
          onReject={mockReject}
        />
      );

      // Switch to reject mode
      fireEvent.click(screen.getByTestId('btn-reject-mode'));

      const submitRejectBtn = screen.getByTestId('btn-confirm-reject');
      expect(submitRejectBtn).toBeDisabled();

      const textarea = screen.getByTestId('rejection-reason-textarea');
      // Enter short reason (< 5 chars)
      fireEvent.change(textarea, { target: { value: 'no' } });
      expect(submitRejectBtn).toBeDisabled();

      // Enter valid reason (>= 5 chars)
      fireEvent.change(textarea, { target: { value: 'Bukti transfer kasir belum terlampir.' } });
      expect(submitRejectBtn).not.toBeDisabled();

      fireEvent.click(submitRejectBtn);

      expect(mockReject).toHaveBeenCalledWith(
        'test-req-01',
        'Bukti transfer kasir belum terlampir.'
      );
      expect(mockClose).toHaveBeenCalled();
    });

    it('closes modal on Escape key press', () => {
      const mockClose = vi.fn();
      render(
        <ApprovalReviewModal
          request={mockRequest}
          isOpen={true}
          onClose={mockClose}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('ApprovalInboxCentral Component', () => {
    it('renders KPI metric summary cards correctly', () => {
      renderWithToast(
        <ApprovalInboxCentral
          initialRequests={INITIAL_APPROVAL_REQUESTS}
          userRole="BOD"
        />
      );

      expect(screen.getByTestId('stat-card-pending')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-approved')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-rejected')).toBeInTheDocument();
      expect(screen.getByText('Pusat Persetujuan Finansial Berjenjang')).toBeInTheDocument();
    });

    it('filters requests by division', () => {
      renderWithToast(
        <ApprovalInboxCentral
          initialRequests={INITIAL_APPROVAL_REQUESTS}
          userRole="BOD"
        />
      );

      const divisionSelect = screen.getByTestId('filter-division-select');
      fireEvent.change(divisionSelect, { target: { value: 'WRAP' } });

      // Only WRAP requests should be shown
      expect(screen.getByText('REQ-20260904-001')).toBeInTheDocument();
      expect(screen.queryByText('REQ-20260904-002')).not.toBeInTheDocument();
    });

    it('filters requests by search keyword', () => {
      renderWithToast(
        <ApprovalInboxCentral
          initialRequests={INITIAL_APPROVAL_REQUESTS}
          userRole="BOD"
        />
      );

      const searchInput = screen.getByTestId('approval-search-input');
      fireEvent.change(searchInput, { target: { value: 'Toko Berkah' } });

      // REQ-20260904-004 is for Toko Berkah
      expect(screen.getByText('REQ-20260904-004')).toBeInTheDocument();
      expect(screen.queryByText('REQ-20260904-001')).not.toBeInTheDocument();
    });

    it('opens review modal, approves request, and updates state optimistically', async () => {
      const mockApprove = vi.fn();
      renderWithToast(
        <ApprovalInboxCentral
          initialRequests={INITIAL_APPROVAL_REQUESTS}
          onApproveRequest={mockApprove}
          userRole="BOD"
        />
      );

      // Click review button for first item (app-01)
      const reviewBtn = screen.getByTestId('btn-review-app-01');
      fireEvent.click(reviewBtn);

      // In modal, click approve mode and confirm
      fireEvent.click(screen.getByTestId('btn-approve-mode'));
      fireEvent.click(screen.getByTestId('btn-confirm-approve'));

      expect(mockApprove).toHaveBeenCalledWith('app-01', undefined);
    });

    it('performs batch approval on selected requests', () => {
      renderWithToast(
        <ApprovalInboxCentral
          initialRequests={INITIAL_APPROVAL_REQUESTS}
          userRole="BOD"
        />
      );

      // Select first row checkbox
      const row1Checkbox = screen.getByLabelText('Pilih tiket REQ-20260904-001');
      fireEvent.click(row1Checkbox);

      // Batch approve button appears
      const batchBtn = screen.getByTestId('btn-batch-approve');
      expect(batchBtn).toBeInTheDocument();
      expect(screen.getByText('1 tiket dipilih')).toBeInTheDocument();

      fireEvent.click(batchBtn);

      // Selection clears after batch approve
      expect(screen.queryByTestId('btn-batch-approve')).not.toBeInTheDocument();
    });

    it('renders read-only state for submitter/PIC role without review decision rights', () => {
      renderWithToast(
        <ApprovalInboxCentral
          initialRequests={INITIAL_APPROVAL_REQUESTS}
          userRole="PIC"
          userDivision="WRAP"
        />
      );

      // Scope indicator indicates Maker (Submitter)
      expect(screen.getByText('Maker (Submitter)')).toBeInTheDocument();

      // Checkbox for review should not be rendered for PIC
      expect(screen.queryByLabelText('Pilih tiket REQ-20260904-001')).not.toBeInTheDocument();
    });
  });

  describe('Sinkronisasi Dua Arah DailyReportPage & ApprovalStore', () => {
    beforeEach(() => {
      useApprovalStore.getState().resetToInitial();
    });

    it('merender DailyReportPage dan menampilkan tab navigasi Laporan Harian dan Approval Hub', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <DailyReportPage />
          </ToastProvider>
        </AuthProvider>
      );

      expect(screen.getByTestId('tab-daily-table')).toBeInTheDocument();
      expect(screen.getByTestId('tab-approvals-hub')).toBeInTheDocument();
      expect(screen.getByText('Report Harian Divisi')).toBeInTheDocument();
    });

    it('berpindah tab ke Pusat Persetujuan (Approval Hub) dan merender ApprovalInboxCentral', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <DailyReportPage />
          </ToastProvider>
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('tab-approvals-hub'));
      expect(screen.getByTestId('approval-hub-tab-content')).toBeInTheDocument();
      expect(screen.getByTestId('approval-inbox-central')).toBeInTheDocument();

      // Kembali ke tab daily table
      fireEvent.click(screen.getByTestId('tab-daily-table'));
      expect(screen.getByText('Audit Trail & Status Verifikasi Divisi')).toBeInTheDocument();
    });

    it('menyetujui laporan dari DailyReportPage dan merefleksikan perubahan ke ApprovalStore', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <DailyReportPage />
          </ToastProvider>
        </AuthProvider>
      );

      // Pastikan item 1 awal adalah PENDING_REVIEW
      const row1 = screen.getByTestId('daily-row-1');
      expect(row1).toBeInTheDocument();

      // Klik ACC pada item 1
      const accBtn = screen.getByTestId('btn-acc-daily-1');
      fireEvent.click(accBtn);

      // Verifikasi status pada DailyReportPage ter-update ke ACC Approved
      expect(screen.getByText(/Laporan Wrapping berhasil di-ACC/)).toBeInTheDocument();

      // Verifikasi sinkronisasi ke ApprovalStore
      const matchingReq = useApprovalStore
        .getState()
        .requests.find((r) => r.relatedEntityId === '1');
      expect(matchingReq?.status).toBe('approved');
    });

    it('menolak laporan dari DailyReportPage dengan alasan wajib (min 5 karakter) dan merefleksikan ke ApprovalStore', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <DailyReportPage />
          </ToastProvider>
        </AuthProvider>
      );

      // Klik tombol reject pada item 1
      const rejectBtn = screen.getByTestId('btn-reject-daily-1');
      fireEvent.click(rejectBtn);

      // Modal penolakan muncul
      const submitRejectBtn = screen.getByTestId('btn-confirm-reject-daily');
      expect(submitRejectBtn).toBeDisabled();

      // Isi alasan penolakan
      const textarea = screen.getByTestId('daily-reject-reason-textarea');
      fireEvent.change(textarea, {
        target: { value: 'Slip setor tunai belum dilampirkan.' },
      });
      expect(submitRejectBtn).not.toBeDisabled();

      fireEvent.click(submitRejectBtn);

      // Verifikasi feedback toast
      expect(screen.getByText(/dikembalikan untuk revisi Admin/)).toBeInTheDocument();

      // Verifikasi di ApprovalStore
      const matchingReq = useApprovalStore
        .getState()
        .requests.find((r) => r.relatedEntityId === '1');
      expect(matchingReq?.status).toBe('rejected');
      expect(matchingReq?.rejectionReason).toBe('Slip setor tunai belum dilampirkan.');
    });

    it('menyetujui tiket di ApprovalStore dan otomatis memperbarui status di DailyReportPage', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <DailyReportPage />
          </ToastProvider>
        </AuthProvider>
      );

      // Lakukan approve melalui store action (mensimulasikan approval dari Approval Hub)
      act(() => {
        useApprovalStore
          .getState()
          .approveRequest('app-01', 'Direksi (BOD)', 'BOD', 'Disetujui dari Hub.');
      });

      // Cek apakah laporan harian #1 otomatis berubah menjadi APPROVED
      const updatedReport = useApprovalStore
        .getState()
        .dailyReports.find((d) => d.id === '1');
      expect(updatedReport?.status).toBe('APPROVED');
      expect(updatedReport?.approvedBy).toBe('Direksi (BOD)');
    });

    it('menambah laporan baru di DailyReportPage dan otomatis mendaftarkan tiket baru di ApprovalStore', () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <DailyReportPage />
          </ToastProvider>
        </AuthProvider>
      );

      // Buka modal input omset
      fireEvent.click(screen.getByTestId('btn-input-omset'));

      // Isi form omset
      fireEvent.change(screen.getByTestId('input-revenue'), {
        target: { value: '55000000' },
      });
      fireEvent.change(screen.getByTestId('input-notes'), {
        target: { value: 'Lonjakan penjualan aksesoris' },
      });

      fireEvent.click(screen.getByTestId('btn-submit-daily-report'));

      // Verifikasi tiket baru tercatat di ApprovalStore
      const newDailyReq = useApprovalStore
        .getState()
        .requests.find((r) => r.title.includes('Laporan Omzet Harian Divisi Wrapping'));
      expect(newDailyReq).toBeDefined();
      expect(newDailyReq?.amount).toBe(55000000);
      expect(newDailyReq?.status).toBe('pending_review');
    });
  });
});
