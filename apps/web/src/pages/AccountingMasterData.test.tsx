import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const ok = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify({ data, meta: { trace_id: 'test' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  );

describe('Accounting Master Data CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    history.pushState({}, '', '/accounting/master');
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/categories') && url.includes('POST')) return ok({ id: 'cat-1', code: 'TEST', name: 'Test Kategori', isActive: true, requiresOutlet: false });
      if (url.includes('/accounts') && url.includes('POST')) return ok({ id: 'acc-1', code: '1101', displayName: 'Test Rekening', type: 'asset', outletIds: [] });
      if (url.includes('/categories') && url.includes('PATCH')) return ok({ id: 'cat-1', code: 'TEST', name: 'Test Kategori', isActive: true, requiresOutlet: false });
      if (url.includes('/accounts') && url.includes('PATCH')) return ok({ id: 'acc-1', code: '1101', displayName: 'Test Rekening', type: 'asset', outletIds: [] });
      if (url.includes('/categories') && url.includes('deactivate')) return ok({ id: 'cat-1', code: 'TEST', name: 'Test Kategori', isActive: false, requiresOutlet: false });
      if (url.includes('/accounts') && url.includes('deactivate')) return ok({ id: 'acc-1', code: '1101', displayName: 'Test Rekening', type: 'asset', outletIds: [] });
      return ok([]);
    }));
  });

  it('ACC user sees Master Data heading', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Master Data Accounting/i })).toBeInTheDocument();
  });

  it('shows empty state when no categories', async () => {
    render(<App />);
    const emptyStates = await screen.findAllByText(/Belum ada data/i);
    expect(emptyStates.length).toBeGreaterThan(0);
  });

  it('ACC user can add a category', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Master Data Accounting/i });
    const catForm = screen.getByRole('form', { name: /Form tambah kategori/i });
    const cat = within(catForm);
    fireEvent.change(cat.getByLabelText(/kode/i), { target: { value: 'TEST' } });
    fireEvent.change(cat.getByLabelText(/nama/i), { target: { value: 'Test Kategori' } });
    fireEvent.click(cat.getByRole('button', { name: /simpan/i }));
    await waitFor(() => {
      expect(screen.getByText(/Kategori berhasil dibuat/i)).toBeInTheDocument();
    });
  });

  it('ACC user can add a rekening', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Master Data Accounting/i });
    const accForm = screen.getByRole('form', { name: /Form tambah rekening/i });
    const acc = within(accForm);
    fireEvent.change(acc.getByLabelText(/kode/i), { target: { value: '1101' } });
    fireEvent.change(acc.getByLabelText(/nama tampilan/i), { target: { value: 'Test Rekening' } });
    fireEvent.click(acc.getByRole('button', { name: /simpan/i }));
    await waitFor(() => {
      expect(screen.getByText(/Rekening berhasil dibuat/i)).toBeInTheDocument();
    });
  });

  it('validates required fields on category form', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Master Data Accounting/i });
    const catForm = screen.getByRole('form', { name: /Form tambah kategori/i });
    const cat = within(catForm);
    fireEvent.click(cat.getByRole('button', { name: /simpan/i }));
    await waitFor(() => {
      expect(cat.getByText(/Kode wajib diisi/i)).toBeInTheDocument();
      expect(cat.getByText(/Nama wajib diisi/i)).toBeInTheDocument();
    });
  });

  it('validates required fields on account form', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: /Master Data Accounting/i });
    const accForm = screen.getByRole('form', { name: /Form tambah rekening/i });
    const acc = within(accForm);
    fireEvent.click(acc.getByRole('button', { name: /simpan/i }));
    await waitFor(() => {
      expect(acc.getByText(/Kode wajib diisi/i)).toBeInTheDocument();
      expect(acc.getByText(/Nama tampilan wajib diisi/i)).toBeInTheDocument();
    });
  });

  it('ACC user sees MASTER route via navigation', async () => {
    history.pushState({}, '', '/accounting');
    render(<App />);
    const masterLinks = await screen.findAllByRole('link', { name: /Master Data/i });
    expect(masterLinks.length).toBeGreaterThan(0);
    masterLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/accounting/master');
    });
  });
});