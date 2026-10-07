import { describe, expect, it, vi } from 'vitest';
import { api } from './client';

describe('Respons penghapusan API', () => {
  it('menerima 204 tanpa mencoba membaca JSON kosong', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204, headers: { 'X-Trace-Id': 'delete-test' } })));
    await expect(api.delete<void>('/projects/1/documents/2')).resolves.toEqual({ data: undefined, meta: { trace_id: 'delete-test' } });
  });
});
