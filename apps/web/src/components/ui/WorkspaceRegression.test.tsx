import { useEffect } from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModuleWorkspace } from './ModuleWorkspace';
import { ToastProvider, useToast } from './Toast';
import { DetailSheet } from './DetailSheet';
import { accountingApi } from '../../api/accounting';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Workspace regression', () => {
  it('does not re-run consumers when a toast is shown', async () => {
    const calls = vi.fn();
    function Consumer() {
      const { toast } = useToast();
      useEffect(() => { calls(); }, [toast]);
      return <button onClick={() => toast('Tersimpan')}>Simpan</button>;
    }
    render(<ToastProvider><Consumer /></ToastProvider>);
    fireEvent.click(screen.getByText('Simpan'));
    await screen.findByText('Tersimpan');
    expect(calls).toHaveBeenCalledTimes(1);
  });

  it('keeps a draft and supports keyboard navigation across task tabs', () => {
    function Panel({ title }: { title: string }) { return <input aria-label={title} />; }
    render(<ModuleWorkspace><Panel title="Kas" /><Panel title="Stok" /></ModuleWorkspace>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Kas' }), { target: { value: 'Draft belum disimpan' } });
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Kas' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Stok' })).toHaveFocus();
    fireEvent.click(screen.getByRole('tab', { name: 'Kas' }));
    expect(screen.getByRole('textbox', { name: 'Kas' })).toHaveValue('Draft belum disimpan');
  });

  it('labels modal panels and closes through Escape', () => {
    const close = vi.fn();
    render(<DetailSheet isOpen onClose={close} title="Edit rekening"><input aria-label="Nama rekening" /></DetailSheet>);
    const dialog = screen.getByRole('dialog', { name: 'Edit rekening' });
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('preserves transaction pagination from the server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'journal-1' }], meta: { total: 484, per_page: 20, current_page: 2 } }), { status: 200 }));
    const result = await accountingApi.transactions({ page: '2' });
    expect(result.data.data).toHaveLength(1);
    expect(result.data.meta).toEqual({ total: 484, per_page: 20, current_page: 2 });
  });

  it('normalizes account names, active status, and assigned outlets', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'bank-1', code: '1101', display_name: 'BCA Operasional', type: 'ASSET', is_active: true, outlets: [{ id: 'outlet-1', isActive: true }] }], meta: { trace_id: 'test' } }), { status: 200 }));
    const result = await accountingApi.accounts();
    await waitFor(() => expect(result.data[0]).toMatchObject({ displayName: 'BCA Operasional', type: 'asset', isActive: true, outletIds: ['outlet-1'] }));
  });
});
