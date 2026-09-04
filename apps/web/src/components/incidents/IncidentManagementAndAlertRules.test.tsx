import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../ui/Toast';
import { AlertRuleConfigurator } from './AlertRuleConfigurator';
import { IncidentResolutionBoard } from './IncidentResolutionBoard';
import { AlertDryRunSimulator } from './AlertDryRunSimulator';
import KonfigurasiPage from '../../pages/KonfigurasiPage';

// Mock hooks
vi.mock('../../hooks/useBod', () => ({
  useDivisionConfigs: () => ({
    data: [
      { divisionCode: 'WRAP', enabledModules: ['dashboard', 'revenue'], enabledKpis: ['revenue.gross'], isActive: true },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useOutlets: () => ({
    data: [
      { code: 'OUT-01', name: 'Outlet Bandara CGK', divisionId: 'div-1', isActive: true },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('Fase 7: Enterprise Incident Management & Alert Rules Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AlertRuleConfigurator Component', () => {
    it('renders list of alert rules with title, threshold, and channels', () => {
      renderWithToast(<AlertRuleConfigurator />);

      expect(screen.getByTestId('alert-rule-configurator')).toBeInTheDocument();
      expect(screen.getByText('Konfigurator Ambang Batas Peringatan Dini')).toBeInTheDocument();

      expect(screen.getByTestId('rule-card-rule-01')).toBeInTheDocument();
      expect(screen.getByText('Ambang Batas Piutang Kritis (>60 Hari)')).toBeInTheDocument();
      expect(screen.getByTestId('rule-card-rule-02')).toBeInTheDocument();
      expect(screen.getByTestId('rule-card-rule-03')).toBeInTheDocument();
      expect(screen.getByTestId('rule-card-rule-04')).toBeInTheDocument();
    });

    it('modifies threshold value and toggles active status', () => {
      renderWithToast(<AlertRuleConfigurator />);

      const thresholdInput = screen.getByTestId('rule-threshold-input-rule-01') as HTMLInputElement;
      expect(thresholdInput.value).toBe('60');

      fireEvent.change(thresholdInput, { target: { value: '45' } });
      expect(thresholdInput.value).toBe('45');

      const toggle = screen.getByTestId('rule-toggle-rule-01');
      fireEvent.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('clamps negative input values to 0 using Math.max(0, value) and enforces min="0"', () => {
      renderWithToast(<AlertRuleConfigurator />);

      const arInput = screen.getByTestId('rule-threshold-input-rule-01') as HTMLInputElement;
      expect(arInput).toHaveAttribute('min', '0');

      // Test negative input: -30 should clamp to 0
      fireEvent.change(arInput, { target: { value: '-30' } });
      expect(arInput.value).toBe('0');

      // Test large negative input: -99999 should clamp to 0
      fireEvent.change(arInput, { target: { value: '-99999' } });
      expect(arInput.value).toBe('0');

      // Test 0: valid zero threshold
      fireEvent.change(arInput, { target: { value: '0' } });
      expect(arInput.value).toBe('0');

      // Test valid positive number: 90 days
      fireEvent.change(arInput, { target: { value: '90' } });
      expect(arInput.value).toBe('90');

      // Test cashier variance negative input: -500000 should clamp to 0
      const cashierInput = screen.getByTestId('rule-threshold-input-rule-04') as HTMLInputElement;
      fireEvent.change(cashierInput, { target: { value: '-500000' } });
      expect(cashierInput.value).toBe('0');
    });

    it('toggles notification channels on rule', () => {
      renderWithToast(<AlertRuleConfigurator />);

      const emailBtn = screen.getByTestId('channel-email-rule-04');
      // Initially rule-04 only has in_app
      expect(emailBtn).not.toHaveClass('bg-indigo-50');

      fireEvent.click(emailBtn);
      expect(emailBtn).toHaveClass('bg-indigo-50');
    });

    it('saves updated rules and triggers onSaveRules callback', async () => {
      const mockSave = vi.fn();
      renderWithToast(<AlertRuleConfigurator onSaveRules={mockSave} />);

      const saveBtn = screen.getByTestId('save-rules-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
        expect(screen.getByTestId('save-success-banner')).toBeInTheDocument();
      });
    });

    it('resets rules to default when reset button is clicked', () => {
      renderWithToast(<AlertRuleConfigurator />);

      const thresholdInput = screen.getByTestId('rule-threshold-input-rule-01') as HTMLInputElement;
      fireEvent.change(thresholdInput, { target: { value: '15' } });
      expect(thresholdInput.value).toBe('15');

      const resetBtn = screen.getByTestId('reset-rules-btn');
      fireEvent.click(resetBtn);

      expect(thresholdInput.value).toBe('60');
    });
  });

  describe('IncidentResolutionBoard Component', () => {
    it('renders metric counters and incident table', () => {
      renderWithToast(<IncidentResolutionBoard />);

      expect(screen.getByTestId('incident-resolution-board')).toBeInTheDocument();
      expect(screen.getByText('Total Anomali')).toBeInTheDocument();
      expect(screen.getByText('Perlu Tindakan Segera')).toBeInTheDocument();
      expect(screen.getAllByText('Dalam Penelusuran')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Terselesaikan')[0]).toBeInTheDocument();

      expect(screen.getByTestId('incident-row-inc-001')).toBeInTheDocument();
      expect(screen.getByTestId('incident-row-inc-002')).toBeInTheDocument();
    });

    it('filters incidents by status tabs', () => {
      renderWithToast(<IncidentResolutionBoard />);

      // Filter: Perlu Tindakan (Open)
      fireEvent.click(screen.getByTestId('status-filter-open'));
      expect(screen.getByTestId('incident-row-inc-001')).toBeInTheDocument();
      expect(screen.queryByTestId('incident-row-inc-004')).not.toBeInTheDocument();

      // Filter: Terselesaikan (Resolved)
      fireEvent.click(screen.getByTestId('status-filter-resolved'));
      expect(screen.getByTestId('incident-row-inc-004')).toBeInTheDocument();
      expect(screen.queryByTestId('incident-row-inc-001')).not.toBeInTheDocument();
    });

    it('filters incidents by search query', () => {
      renderWithToast(<IncidentResolutionBoard />);

      const searchInput = screen.getByTestId('incident-search-input');
      fireEvent.change(searchInput, { target: { value: 'Sarana Retail' } });

      expect(screen.getByTestId('incident-row-inc-001')).toBeInTheDocument();
      expect(screen.queryByTestId('incident-row-inc-002')).not.toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'KataKunciTidakAda999' } });
      expect(screen.getByTestId('incidents-empty-state')).toBeInTheDocument();
    });

    it('opens resolution modal and updates incident status to resolved', async () => {
      const mockUpdate = vi.fn();
      renderWithToast(<IncidentResolutionBoard onIncidentUpdate={mockUpdate} />);

      const resolveBtn = screen.getByTestId('resolve-btn-inc-001');
      fireEvent.click(resolveBtn);

      expect(screen.getByTestId('incident-resolution-modal')).toBeInTheDocument();
      expect(screen.getByText('Tindak Lanjut & Mitigasi Anomali')).toBeInTheDocument();

      // Select 'Terselesaikan'
      fireEvent.click(screen.getByTestId('opt-status-resolved'));

      // Fill assignee & notes
      const assigneeInput = screen.getByTestId('assignee-input');
      fireEvent.change(assigneeInput, { target: { value: 'Budi Santoso' } });

      const notesInput = screen.getByTestId('notes-input');
      fireEvent.change(notesInput, { target: { value: 'Invoice telah dilunasi via transfer Mandiri.' } });

      // Save
      fireEvent.click(screen.getByTestId('save-resolution-btn'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
        expect(screen.queryByTestId('incident-resolution-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('AlertDryRunSimulator Component', () => {
    it('renders simulator scenarios and parameter testing form', () => {
      renderWithToast(<AlertDryRunSimulator />);

      expect(screen.getByTestId('alert-dry-run-simulator')).toBeInTheDocument();
      expect(screen.getByText('Simulator Pemicu Peringatan Dini (Dry-Run Tester)')).toBeInTheDocument();
      expect(screen.getByTestId('scenario-btn-sc-1')).toBeInTheDocument();
      expect(screen.getByTestId('scenario-btn-sc-2')).toBeInTheDocument();
      expect(screen.getByTestId('scenario-btn-sc-3')).toBeInTheDocument();
      expect(screen.getByTestId('simulation-idle-box')).toBeInTheDocument();
    });

    it('switches scenarios and updates simulated values', () => {
      renderWithToast(<AlertDryRunSimulator />);

      const sc2Btn = screen.getByTestId('scenario-btn-sc-2');
      fireEvent.click(sc2Btn);

      const valInput = screen.getByTestId('simulation-value-input') as HTMLInputElement;
      expect(valInput.value).toBe('55');
    });

    it('runs simulation and triggers alert evaluation card', async () => {
      const mockTrigger = vi.fn();
      renderWithToast(<AlertDryRunSimulator onSimulateTrigger={mockTrigger} />);

      const runBtn = screen.getByTestId('run-simulation-btn');
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByTestId('simulation-result-box')).toBeInTheDocument();
        expect(screen.getByText('Peringatan Dini Berhasil Dipicu!')).toBeInTheDocument();
        expect(mockTrigger).toHaveBeenCalled();
      });
    });
  });

  describe('KonfigurasiPage Integration', () => {
    it('renders tab navigation and allows switching between tabs', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <MemoryRouter initialEntries={['/konfigurasi']}>
              <KonfigurasiPage />
            </MemoryRouter>
          </ToastProvider>
        </QueryClientProvider>,
      );

      expect(screen.getByTestId('konfigurasi-page')).toBeInTheDocument();
      expect(screen.getByText('Konfigurasi Sistem & Resolusi Anomali')).toBeInTheDocument();

      // Default tab: divisions
      expect(screen.getByTestId('tab-content-divisions')).toBeInTheDocument();

      // Switch to rules tab
      fireEvent.click(screen.getByTestId('tab-rules'));
      expect(screen.getByTestId('tab-content-rules')).toBeInTheDocument();

      // Switch to incidents tab
      fireEvent.click(screen.getByTestId('tab-incidents'));
      expect(screen.getByTestId('tab-content-incidents')).toBeInTheDocument();

      // Switch to simulator tab
      fireEvent.click(screen.getByTestId('tab-simulator'));
      expect(screen.getByTestId('tab-content-simulator')).toBeInTheDocument();
    });
  });
});
