import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, downloadFile } from './client';

afterEach(() => { vi.unstubAllGlobals(); document.cookie = 'csrf_token=; Max-Age=0; path=/'; localStorage.clear(); });
describe('Sesi browser dan CSRF', () => {
  it('mutasi mengirim token CSRF tanpa membaca bearer dari localStorage', async () => {
    localStorage.setItem('access_token', 'legacy-token');
    document.cookie = 'csrf_token=signed-session-token; path=/';
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {}, meta: { trace_id: 'test' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    await api.post('/auth/logout');
    const init = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ 'X-CSRF-Token': 'signed-session-token' });
    expect(init.headers).not.toHaveProperty('Authorization');
  });
  it('GET dan unduh memakai cookie tanpa bearer di JavaScript', async () => {
    const fetch = vi.fn().mockImplementation(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    await api.get('/auth/me');
    await downloadFile('/projects/1/documents/1/download');
    for (const [, init] of fetch.mock.calls) expect((init as RequestInit).headers).not.toHaveProperty('Authorization');
  });
});
