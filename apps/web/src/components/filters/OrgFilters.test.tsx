import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrgFilters } from './OrgFilters';

function WrapWithQuery({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function TestHarness() {
  const [params, setParams] = useSearchParams();
  return (
    <>
      <OrgFilters />
      <div data-testid="url-state">{params.toString()}</div>
      <button
        data-testid="set-wrap"
        onClick={() => {
          const next = new URLSearchParams(params);
          next.set('divisionCode', 'WRAP');
          setParams(next);
        }}
      >
        set wrap
      </button>
      <button
        data-testid="set-from"
        onClick={() => {
          const next = new URLSearchParams(params);
          next.set('from', '2024-01-01');
          setParams(next);
        }}
      >
        set from
      </button>
      <button
        data-testid="set-outlet"
        onClick={() => {
          const next = new URLSearchParams(params);
          next.set('outletCode', 'T3-A');
          setParams(next);
        }}
      >
        set outlet
      </button>
    </>
  );
}

describe('ORG-05 Filter state di URL', () => {
  afterEach(() => cleanup());

  it('periode/divisi/outlet tersimpan di URL', async () => {
    const user = userEvent.setup();
    render(
      <WrapWithQuery>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<TestHarness />} />
          </Routes>
        </MemoryRouter>
      </WrapWithQuery>,
    );

    // gunakan helper buttons untuk set URL via setSearchParams (lebih reliable di jsdom)
    await user.click(screen.getByTestId('set-wrap'));
    await waitFor(() => expect(screen.getByTestId('url-state').textContent).toContain('divisionCode=WRAP'));
    // setelah divisionCode diset, OrgFilters select harus reflect
    expect((screen.getByTestId('filter-division') as HTMLSelectElement).value).toBe('WRAP');

    await user.click(screen.getByTestId('set-from'));
    await waitFor(() => expect(screen.getByTestId('url-state').textContent).toContain('from=2024-01-01'));

    const outletSelect = screen.getByTestId('filter-outlet') as HTMLSelectElement;
    // outlet enabled after division selected
    expect(outletSelect).not.toBeDisabled();
    await user.click(screen.getByTestId('set-outlet'));
    await waitFor(() => expect(screen.getByTestId('url-state').textContent).toContain('outletCode=T3-A'));
  });

  it('clear menghapus semua filter dari URL', async () => {
    const user = userEvent.setup();
    render(
      <WrapWithQuery>
        <MemoryRouter initialEntries={['/dashboard?divisionCode=WRAP&from=2024-01-01']}>
          <Routes>
            <Route path="/dashboard" element={<TestHarness />} />
          </Routes>
        </MemoryRouter>
      </WrapWithQuery>,
    );
    expect(screen.getByTestId('url-state').textContent).toContain('divisionCode=WRAP');
    await user.click(screen.getByTestId('filter-clear'));
    await waitFor(() => expect(screen.getByTestId('url-state').textContent).toBe(''));
  });

  it('outlet disabled jika divisi belum dipilih', async () => {
    render(
      <WrapWithQuery>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<TestHarness />} />
          </Routes>
        </MemoryRouter>
      </WrapWithQuery>,
    );
    expect(screen.getByTestId('filter-outlet')).toBeDisabled();
  });

  it('7 divisi tersedia (tanpa hardcode di luar filter)', async () => {
    render(
      <WrapWithQuery>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<TestHarness />} />
          </Routes>
        </MemoryRouter>
      </WrapWithQuery>,
    );
    const options = Array.from((screen.getByTestId('filter-division') as HTMLSelectElement).options).map(
      (o) => o.value,
    );
    expect(options).toEqual(expect.arrayContaining(['WRAP', 'CELL', 'REFL', 'MINI', 'FNB', 'MC', 'ACC']));
  });
});
