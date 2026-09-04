import '@testing-library/jest-dom';

// Mock fetch untuk test tanpa BE real — kembalikan envelope mock
const mockBodOverview = [
  { divisionCode: 'WRAP', divisionName: 'Wrapping', revenue: { gross: 344, source: 'revenue.daily', freshness: new Date().toISOString() }, target: { value: 370, achievement: 93, source: 'target.monthly' }, performance: { score: 88, level: 'C', source: 'performance.score' }, workforce: { count: 20, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=WRAP' } },
  { divisionCode: 'CELL', divisionName: 'Cellular', revenue: { gross: 431, source: 'revenue.daily', freshness: new Date().toISOString() }, target: { value: 415, achievement: 104, source: 'target.monthly' }, performance: { score: 90, level: 'B', source: 'performance.score' }, workforce: { count: 20, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=CELL' } },
  { divisionCode: 'MINI', divisionName: 'Minimarket', revenue: { gross: 482, source: 'revenue.daily', freshness: new Date().toISOString() }, target: { value: 550, achievement: 87, source: 'target.monthly' }, performance: { score: 91, level: 'A', source: 'performance.score' }, workforce: { count: 30, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=MINI' } },
  { divisionCode: 'FNB', divisionName: 'FnB', revenue: { gross: 386, source: 'revenue.daily', freshness: new Date().toISOString() }, target: { value: 395, achievement: 98, source: 'target.monthly' }, performance: { score: 89, level: 'B', source: 'performance.score' }, workforce: { count: 20, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=FNB' } },
  { divisionCode: 'REFL', divisionName: 'Refleksi', revenue: { gross: 300, source: 'revenue.daily', freshness: new Date().toISOString() }, target: { value: 300, achievement: 100, source: 'target.monthly' }, performance: { score: 85, level: 'B', source: 'performance.score' }, workforce: { count: 15, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=REFL' } },
  { divisionCode: 'FIN', divisionName: 'Finance', revenue: { gross: 200, source: 'revenue.daily', freshness: new Date().toISOString() }, target: { value: 200, achievement: 100, source: 'target.monthly' }, performance: { score: 88, level: 'B', source: 'performance.score' }, workforce: { count: 10, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=FIN' } },
  { divisionCode: 'MC', divisionName: 'Money Changer', revenue: { gross: null, source: 'forex.volume', freshness: new Date().toISOString() }, target: { value: 0, achievement: 0, source: 'target.monthly' }, performance: { score: 0, level: 'C', source: 'performance.score' }, workforce: { count: 5, risk: 'low', source: 'workforce.count' }, period: { from: '2026-09-01', to: '2026-09-30' }, drillDown: { href: '/dashboard?divisionCode=MC' } },
];

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, _init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

  // Auth me — fallback ke 401 jika tidak ada role di localStorage, biar AuthContext fallback ke mock
  if (url.includes('/auth/me')) {
    const role = (globalThis as unknown as { localStorage: Storage }).localStorage?.getItem('dashboard-divisi.role-demo');
    const div = (globalThis as unknown as { localStorage: Storage }).localStorage?.getItem('dashboard-divisi.division-demo');
    if (role) {
      const divisionCode = role === 'BOD' ? null : (div ?? 'WRAP');
      return new Response(JSON.stringify({ data: { id: 'test', email: `${role.toLowerCase()}@dashboard.test`, name: `${role} Test`, role, divisionCode }, meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Trace-Id': 'test-trace' } });
    }
    return new Response(JSON.stringify({ error: { code: 'AUTH_REQUIRED', message: 'Unauthorized', trace_id: 'test-trace' } }), { status: 401, headers: { 'Content-Type': 'application/json', 'X-Trace-Id': 'test-trace' } });
  }

  if (url.includes('/bod/overview')) {
    return new Response(JSON.stringify({ data: mockBodOverview, meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Trace-Id': 'test-trace' } });
  }
  if (url.includes('/bod/executive-read-model')) {
    return new Response(JSON.stringify({ data: [{ divisionCode: 'WRAP', divisionName: 'Wrapping', metrics: [{ kpiCode: 'revenue.gross' }], compatibleDivisions: { 'revenue.gross': ['CELL'] } }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/org/me/context')) {
    return new Response(JSON.stringify({ data: { user: { id: 'u1', email: 'hrd@test', role: 'HRD', divisionCode: null }, divisions: [{ code: 'WRAP', name: 'Wrapping' }], outlets: [{ code: 'WRAP-001', name: 'Wrapping Pusat' }], assignments: [], scope: 'ALL_7_DIVISI' }, meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/org/divisions')) {
    return new Response(JSON.stringify({ data: [{ id: '1', code: 'WRAP', name: 'Wrapping', isActive: true, sortOrder: 1 }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/org/outlets')) {
    return new Response(JSON.stringify({ data: [{ id: '1', code: 'WRAP-001', name: 'Wrapping Pusat', divisionId: '1', isActive: true }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/org/assignments')) {
    return new Response(JSON.stringify({ data: [{ id: 'test-1', division_id: '1', outlet_id: '1', employee_id: 'emp-1', effective_from: '2026-09-01', effective_to: null }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/division-configs')) {
    return new Response(JSON.stringify({ data: [{ divisionCode: 'WRAP', divisionName: 'Wrapping', enabledModules: ['dashboard'], enabledKpis: ['revenue.gross'], isActive: true }, { divisionCode: 'MC', divisionName: 'Money Changer', enabledModules: ['forex'], enabledKpis: ['forex.volume'], isActive: true }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/targets/current-month')) {
    return new Response(JSON.stringify({ data: [{ id: 't1', outlet_id: 'out-1', amount: 100, status: 'draft', period_month: '2026-09' }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/revenue/daily') || url.includes('/reports/') || url.includes('/org/')) {
    return new Response(JSON.stringify({ data: [], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/sobathr/status')) {
    return new Response(JSON.stringify({
      data: {
        provider: 'Sobat API',
        configured: false,
        status: 'UNCONFIGURED',
        base_url: null,
        has_api_key: false,
        has_company_id: false,
        last_sync: null,
        scheduler: 'MANUAL_ONLY',
      },
      meta: { trace_id: 'test-trace' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/sobathr/sync-tenants')) {
    return new Response(JSON.stringify({
      data: {
        provider: 'Sobat API',
        source: 'LIVE_SOBAT_API',
        division_code: 'WRAP',
        total_tenants: 1,
        synced_at: '2026-09-03T07:00:00Z',
        tenants: [
          {
            id: 'TNT-001',
            name: 'Wrapping Master Outlet 1',
            division: 'WRAP',
            category: 'Wrapping',
            location: 'Lantai 1 - A01',
            monthlyRevenue: 125000000,
            monthlyTarget: 100000000,
            status: 'Over Target',
            growth: 14.2,
          },
        ],
      },
      meta: { trace_id: 'test-trace' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // Accounting Endpoints Mock
  if (url.includes('/accounting/outstandings')) {
    return new Response(JSON.stringify({
      data: {
        kpis: { total_active_outstanding: 1546704169, total_paid: 0, total_items_count: 9, active_items_count: 9, actual_cash_balance: 1411157668, projected_ending_balance: -135546501 },
        items: [{ id: 'ots-1', code: 'OTS-2026-08-01', description: 'GAJI LAPANGAN', amount: 500000000, paid_amount: 0, remaining_amount: 500000000, due_date: '2026-08-25', status: 'unpaid' }],
      },
      meta: { trace_id: 'test-trace' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/accounting/reconciliations')) {
    return new Response(JSON.stringify({
      data: {
        period: { id: 'p1', period_month: '2026-08', status: 'draft' },
        summary: { total_bank_accounts: 31, total_bank_jul: 941786678.76, total_bank_aug: 1411157667, total_mutation: 469370988.24, cashflow_ending_balance: 1411157667.88, variance: 0.88, is_matched: true, unattached_transactions_count: 484 },
        items: [{ id: 'b1', number: 1, account_number: '155-00-1485895-8', account_name: 'MANDIRI PIONER', bank_name: 'MANDIRI', outlet_name: 'PIONER', jul_balance: 1000000, aug_balance: 2505042, mutation: 1505042, is_verified: true }],
      },
      meta: { trace_id: 'test-trace' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/accounting/cashflow/report')) {
    return new Response(JSON.stringify({
      data: {
        period: { period_month: '2026-08', status: 'draft' },
        kpis: { initial_cash_balance: 941786678.76, total_revenue: 5050891572.12, total_available: 5992678250.88, total_operational_expenses: 3735973049, total_backoffice_expenses: 845547534, total_expenses: 4581520583, ending_cash_balance: 1411157667.88, total_bank_ending_balance: 1411157667, reconciliation_variance: 0.88, is_reconciled: true, total_active_outstanding: 1546704169, projected_ending_balance: -135546501.12 },
        breakdown: {
          revenue: [{ code: 'B1', name: 'Sales Store Harian', amount: 4760786093 }],
          operational: [{ code: 'C1', name: 'Tagihan PT Angkasa Pura Indonesia', amount: 1720636274 }],
          backoffice: [{ code: 'D1', name: 'Gaji Back Office', amount: 114510000 }],
        },
      },
      meta: { trace_id: 'test-trace' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/accounting/periods')) {
    return new Response(JSON.stringify({ data: [{ id: 'p1', periodMonth: '2026-08', status: 'draft', version: 1 }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/accounting/categories')) {
    return new Response(JSON.stringify({ data: [{ id: 'c1', code: 'C1', name: 'Tagihan PT Angkasa Pura Indonesia', isActive: true, requiresOutlet: false }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/accounting/accounts')) {
    return new Response(JSON.stringify({ data: [{ id: 'a1', code: '1110', displayName: 'MANDIRI PIONER', type: 'bank', isActive: true }], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (url.includes('/accounting/transactions')) {
    return new Response(JSON.stringify({ data: [], meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  // fallback ke fetch asli jika ada
  if (originalFetch) return originalFetch(input as RequestInfo, _init);
  return new Response(JSON.stringify({ data: null, meta: { trace_id: 'test-trace' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// Polyfill localStorage in jsdom / Node 25 environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: storageMock,
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

window.HTMLElement.prototype.scrollIntoView = () => {};
