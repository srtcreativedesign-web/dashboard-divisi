import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { NotificationPopover } from './NotificationPopover';
import { AuditLogModal } from './AuditLogModal';
import {
  type NotificationItem,
  type AuditLogItem,
} from './notificationTypes';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Smart Notification Center & Audit Trail Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window.URL.createObjectURL === 'undefined') {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  describe('NotificationBell Component', () => {
    it('renders bell button and badge with initial unread count', () => {
      render(
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>,
      );

      const bellBtn = screen.getByTestId('notification-bell-btn');
      expect(bellBtn).toBeInTheDocument();
      expect(bellBtn).toHaveAttribute('aria-label', 'Pusat Notifikasi & Peringatan Dini');

      const badge = screen.getByTestId('notification-unread-badge');
      expect(badge).toBeInTheDocument();
      // Initially 3 items are unread in INITIAL_NOTIFICATIONS
      expect(badge.textContent).toBe('3');
    });

    it('toggles NotificationPopover when bell button is clicked', () => {
      render(
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>,
      );

      expect(screen.queryByTestId('notification-popover')).not.toBeInTheDocument();

      const bellBtn = screen.getByTestId('notification-bell-btn');
      fireEvent.click(bellBtn);

      expect(screen.getByTestId('notification-popover')).toBeInTheDocument();
      expect(screen.getByText('Pusat Notifikasi')).toBeInTheDocument();

      // Click backdrop to close
      const backdrop = screen.getByTestId('notification-popover-backdrop');
      fireEvent.click(backdrop);
      expect(screen.queryByTestId('notification-popover')).not.toBeInTheDocument();
    });

    it('marks all as read when button in popover is clicked', () => {
      render(
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByTestId('notification-bell-btn'));
      const markAllBtn = screen.getByTestId('mark-all-read-btn');
      fireEvent.click(markAllBtn);

      // Badge should disappear when all are read
      expect(screen.queryByTestId('notification-unread-badge')).not.toBeInTheDocument();
      expect(screen.getByText('Semua notifikasi telah dibaca')).toBeInTheDocument();
    });
  });

  describe('NotificationPopover Component', () => {
    const mockOnMarkAsRead = vi.fn();
    const mockOnMarkAllAsRead = vi.fn();
    const mockOnClearAll = vi.fn();
    const mockOnOpenAuditModal = vi.fn();
    const mockOnClose = vi.fn();

    const sampleNotifications: NotificationItem[] = [
      {
        id: 'n-1',
        title: 'Overdue AR',
        message: 'Invoice AR overdue',
        category: 'financial',
        severity: 'danger',
        timestamp: '2026-09-04T10:00:00Z',
        relativeTime: '10m ago',
        isRead: false,
        actionPath: '/accounting/outstanding',
        actionLabel: 'Periksa Piutang',
      },
      {
        id: 'n-2',
        title: 'Target Retail Achieved',
        message: 'Target 100% achieved',
        category: 'operational',
        severity: 'success',
        timestamp: '2026-09-04T09:00:00Z',
        relativeTime: '1h ago',
        isRead: true,
      },
    ];

    it('does not render when isOpen is false', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={false}
            onClose={mockOnClose}
            notifications={sampleNotifications}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      expect(screen.queryByTestId('notification-popover')).not.toBeInTheDocument();
    });

    it('filters notifications by category tab', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={true}
            onClose={mockOnClose}
            notifications={sampleNotifications}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      expect(screen.getByText('Overdue AR')).toBeInTheDocument();
      expect(screen.getByText('Target Retail Achieved')).toBeInTheDocument();

      // Click Tab Finansial
      fireEvent.click(screen.getByTestId('notif-tab-financial'));
      expect(screen.getByText('Overdue AR')).toBeInTheDocument();
      expect(screen.queryByText('Target Retail Achieved')).not.toBeInTheDocument();

      // Click Tab Operasional
      fireEvent.click(screen.getByTestId('notif-tab-operational'));
      expect(screen.queryByText('Overdue AR')).not.toBeInTheDocument();
      expect(screen.getByText('Target Retail Achieved')).toBeInTheDocument();
    });

    it('filters notifications by severity button', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={true}
            onClose={mockOnClose}
            notifications={sampleNotifications}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      const dangerFilterBtn = screen.getByTestId('severity-filter-danger');
      fireEvent.click(dangerFilterBtn);

      expect(screen.getByText('Overdue AR')).toBeInTheDocument();
      expect(screen.queryByText('Target Retail Achieved')).not.toBeInTheDocument();
    });

    it('triggers mark as read single item', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={true}
            onClose={mockOnClose}
            notifications={sampleNotifications}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      const markReadBtn = screen.getByTestId('mark-read-btn-n-1');
      fireEvent.click(markReadBtn);
      expect(mockOnMarkAsRead).toHaveBeenCalledWith('n-1');
    });

    it('navigates to action path and closes popover when action button is clicked', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={true}
            onClose={mockOnClose}
            notifications={sampleNotifications}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      const actionBtn = screen.getByTestId('notif-action-btn-n-1');
      expect(actionBtn).toHaveTextContent('Periksa Piutang');
      fireEvent.click(actionBtn);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/accounting/outstanding');
    });

    it('calls onOpenAuditModal and closes popover when audit link in footer is clicked', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={true}
            onClose={mockOnClose}
            notifications={sampleNotifications}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      const auditBtn = screen.getByTestId('open-audit-trail-btn');
      fireEvent.click(auditBtn);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnOpenAuditModal).toHaveBeenCalled();
    });

    it('shows empty state when no notifications match filter', () => {
      render(
        <MemoryRouter>
          <NotificationPopover
            isOpen={true}
            onClose={mockOnClose}
            notifications={[]}
            onMarkAsRead={mockOnMarkAsRead}
            onMarkAllAsRead={mockOnMarkAllAsRead}
            onClearAll={mockOnClearAll}
            onOpenAuditModal={mockOnOpenAuditModal}
          />
        </MemoryRouter>,
      );

      expect(screen.getByTestId('notification-list')).toBeInTheDocument();
      expect(screen.getByText('Tidak ada notifikasi saat ini')).toBeInTheDocument();
    });
  });

  describe('AuditLogModal Component', () => {
    const mockOnClose = vi.fn();

    const sampleAuditLogs: AuditLogItem[] = [
      {
        id: 'aud-1',
        user: 'Edy Hartono Nasrah',
        role: 'BOD / Direktur Utama',
        action: 'Ekspor Data Finansial Konsolidasi (CSV BOM)',
        target: 'LaporanPage',
        timestamp: '04 Sep 2026, 21:05:12 WIB',
        ipAddress: '192.168.1.102',
        traceId: 'TRC-9921-X8B1',
        status: 'success',
      },
      {
        id: 'aud-2',
        user: 'Siti Rahmawati',
        role: 'Manager Accounting',
        action: 'Konfirmasi Rekonsiliasi Bank',
        target: 'RekonsiliasiPage',
        timestamp: '04 Sep 2026, 18:30:00 WIB',
        ipAddress: '192.168.1.115',
        traceId: 'TRC-8812-B4F2',
        status: 'warning',
      },
      {
        id: 'aud-3',
        user: 'Security Sentinel',
        role: 'System Daemon',
        action: 'Gagal Login 3x Percobaan',
        target: 'LoginPage',
        timestamp: '04 Sep 2026, 14:15:00 WIB',
        ipAddress: '203.114.2.11',
        traceId: 'TRC-1100-FAIL',
        status: 'error',
      },
    ];

    it('does not render when isOpen is false', () => {
      render(<AuditLogModal isOpen={false} onClose={mockOnClose} auditLogs={sampleAuditLogs} />);
      expect(screen.queryByTestId('audit-log-modal')).not.toBeInTheDocument();
    });

    it('renders header, title, and initial audit logs', () => {
      render(<AuditLogModal isOpen={true} onClose={mockOnClose} auditLogs={sampleAuditLogs} />);

      expect(screen.getByTestId('audit-log-modal')).toBeInTheDocument();
      expect(screen.getByText('Pusat Jejak Audit & Keamanan Sistem')).toBeInTheDocument();
      expect(screen.getByText('Immutable Ledger')).toBeInTheDocument();

      expect(screen.getByTestId('audit-row-aud-1')).toBeInTheDocument();
      expect(screen.getByTestId('audit-row-aud-2')).toBeInTheDocument();
      expect(screen.getByTestId('audit-row-aud-3')).toBeInTheDocument();
    });

    it('filters logs by search query (user, action, traceId, ip)', () => {
      render(<AuditLogModal isOpen={true} onClose={mockOnClose} auditLogs={sampleAuditLogs} />);

      const searchInput = screen.getByTestId('audit-search-input');

      // Search by user name
      fireEvent.change(searchInput, { target: { value: 'Edy' } });
      expect(screen.getByTestId('audit-row-aud-1')).toBeInTheDocument();
      expect(screen.queryByTestId('audit-row-aud-2')).not.toBeInTheDocument();

      // Search by trace ID
      fireEvent.change(searchInput, { target: { value: 'TRC-8812' } });
      expect(screen.queryByTestId('audit-row-aud-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('audit-row-aud-2')).toBeInTheDocument();

      // Search with non-matching term shows empty state
      fireEvent.change(searchInput, { target: { value: 'TidakKetemuXYZ' } });
      expect(screen.getByTestId('audit-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Tidak ada catatan audit yang cocok')).toBeInTheDocument();
    });

    it('filters logs by status dropdown', () => {
      render(<AuditLogModal isOpen={true} onClose={mockOnClose} auditLogs={sampleAuditLogs} />);

      const statusSelect = screen.getByTestId('audit-status-select');

      fireEvent.change(statusSelect, { target: { value: 'error' } });
      expect(screen.queryByTestId('audit-row-aud-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('audit-row-aud-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('audit-row-aud-3')).toBeInTheDocument();
    });

    it('calls onClose when close button or footer close button is clicked', () => {
      render(<AuditLogModal isOpen={true} onClose={mockOnClose} auditLogs={sampleAuditLogs} />);

      fireEvent.click(screen.getByTestId('audit-close-btn'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('audit-footer-close-btn'));
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it('handles export CSV click', () => {
      render(<AuditLogModal isOpen={true} onClose={mockOnClose} auditLogs={sampleAuditLogs} />);

      const exportBtn = screen.getByTestId('audit-export-btn');
      expect(exportBtn).toBeInTheDocument();
      fireEvent.click(exportBtn);

      // Verify button responds
      expect(exportBtn).toBeInTheDocument();
    });
  });
});
