/**
 * SOP 1B + SOP 4: API client — semua fetch via hooks, bukan di page.
 * Envelope: { data, meta:{trace_id}, links:{self} } + Error { error:{code,message,trace_id} }
 * Auth: httpOnly cookie access_token (SOP: Zero Hardcoded Secrets, via .env)
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export interface ApiEnvelope<T> {
  data: T;
  meta: { trace_id: string; [k: string]: unknown };
  links?: { self?: string };
}

export interface ApiError {
  error: { code: string; message: string; fields?: { field: string; code: string; message: string }[]; trace_id: string };
}

export class ApiException extends Error {
  code: string;
  status: number;
  traceId: string;
  fields?: ApiError['error']['fields'];
  constructor(status: number, error: ApiError['error']) {
    super(error.message);
    this.code = error.code;
    this.status = status;
    this.traceId = error.trace_id;
    this.fields = error.fields;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const isForm = init.body instanceof FormData;
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  const res = await fetch(url, {
    credentials: 'include', // httpOnly cookie access_token
    headers,
    ...init,
  });

  const traceId = res.headers.get('X-Trace-Id') ?? '';

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: res.statusText, trace_id: traceId } }))) as Partial<ApiError> & { error?: ApiError['error'] };
    const err = body.error ?? { code: 'UNKNOWN', message: res.statusText, trace_id: traceId };
    // SOP: 401 → redirect ke login (kecuali di test)
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && (typeof import.meta === 'undefined' || (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE !== 'test')) {
      localStorage.removeItem('access_token');
      // simpan pesan untuk login page
      window.location.assign('/login?expired=1');
    }
    throw new ApiException(res.status, err);
  }

  // 2xx — ApiEnvelopeMiddleware membungkus jadi {data, meta, links}
  const json = (await res.json()) as ApiEnvelope<T> | T;
  // Jika sudah envelope (punya data+meta), return langsung; else bungkus
  if (typeof json === 'object' && json !== null && 'data' in (json as Record<string, unknown>) && 'meta' in (json as Record<string, unknown>)) {
    return json as ApiEnvelope<T>;
  }
  return { data: json as T, meta: { trace_id: traceId } };
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | undefined>) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '') as [string, string][]).toString()}` : '';
    const clean = qs === '?' ? '' : qs;
    return request<T>(`${path}${clean}`);
  },
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form, headers: {} as Record<string, string> }), // browser set multipart boundary
};
