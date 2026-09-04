import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../ui/Toast';
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
});
