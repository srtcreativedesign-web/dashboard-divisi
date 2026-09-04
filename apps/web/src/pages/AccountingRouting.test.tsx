import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const ok = (data: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify({ data, meta: { trace_id: 'test' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );

describe('Accounting Master Data CRUD isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    history.pushState({}, '', '/accounting/master');
    vi.stubGlobal('fetch', vi.fn(() => ok([])));
  });

  it('renders ACC Master Data page and shows empty state when no data', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Master Data Accounting/i })).toBeInTheDocument();
    const emptyStates = await screen.findAllByText(/Belum ada data/i);
    expect(emptyStates.length).toBeGreaterThan(0);
  });

  it('ACC user can access Master Data with CRUD actions', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: /Tambah kategori/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Tambah rekening/i })).toBeInTheDocument();
  });

  it('rejects non-ACC direct master data route', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'MANAGER');
    localStorage.setItem('dashboard-divisi.division-demo', 'WRAP');
    history.pushState({}, '', '/accounting/master');
    render(<App />);
    expect(await screen.findByText(/tidak memiliki izin/i)).toBeInTheDocument();
  });
});

describe('Accounting Master Data form accessibility', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dashboard-divisi.role-demo', 'ADMIN');
    localStorage.setItem('dashboard-divisi.division-demo', 'ACC');
    history.pushState({}, '', '/accounting/master');
    vi.stubGlobal('fetch', vi.fn(() => ok([])));
  });

  it('form has proper headings and interactive buttons', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Master Data Accounting/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Tambah kategori/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Tambah rekening/i })).toBeInTheDocument();
  });
});