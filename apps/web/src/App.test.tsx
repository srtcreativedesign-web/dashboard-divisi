import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App, { queryClient } from './App';

afterEach(() => { cleanup(); queryClient.clear(); localStorage.clear(); history.pushState({}, '', '/'); });
describe('Workspace tiga modul MVP', () => {
  it('meminta login ketika belum terautentikasi', async () => {
    render(<App />);
    expect(await screen.findByLabelText(/Alamat Email/i)).toBeInTheDocument();
  });
  it('menampilkan tiga modul untuk BOD tanpa menu retail lama', async () => {
    localStorage.setItem('dashboard-divisi.role-demo', 'BOD');
    history.pushState({}, '', '/dashboard');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Workspace ERP' })).toBeInTheDocument();
    const modules = screen.getByRole('region', { name: 'Modul ERP' });
    expect(within(modules).getAllByRole('link')).toHaveLength(3);
    expect(within(modules).getByRole('heading', { name: 'Accounting' })).toBeInTheDocument();
    expect(within(modules).getByRole('heading', { name: 'Project' })).toBeInTheDocument();
    expect(within(modules).getByRole('heading', { name: 'Cellular' })).toBeInTheDocument();
    expect(screen.queryByText('Wrapping')).not.toBeInTheDocument();
  });
});
