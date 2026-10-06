export const MVP_MODULES = [
  { code: 'ACC', name: 'Accounting', path: '/accounting', capability: 'view:acc_report', description: 'Jurnal, arus kas, hutang piutang, dan rekonsiliasi.' },
  { code: 'PROJECT', name: 'Project', path: '/projects', capability: 'view:projects', description: 'Proyek, anggaran, progres, vendor, dan dokumen.' },
  { code: 'CELL', name: 'Cellular', path: '/cellular', capability: 'view:cellular', description: 'Katalog kartu dan aksesori, stok jumlah barang, serta penjualan manual.' },
] as const;

export function normalizeDivisionCode(code?: string | null): string | null {
  return code === 'CELLULAR' ? 'CELL' : code ?? null;
}

export function moduleHome(code?: string | null): string {
  return MVP_MODULES.find(module => module.code === normalizeDivisionCode(code))?.path ?? '/dashboard';
}
