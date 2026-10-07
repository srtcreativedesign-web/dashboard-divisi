import type { Role } from './session';
import { MVP_MODULES } from './mvp';

export interface MenuItem {
  path: string;
  label: string;
  roles: readonly Role[];
  capability?: string;
  group?: string;
}

const MVP_ROLES: readonly Role[] = ['BOD', 'MANAGER', 'HEAD_OPS', 'SPV', 'LEADER', 'ADMIN', 'ADMIN_GUDANG', 'ACCOUNTING', 'FINANCE'];

export const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Workspace ERP', roles: MVP_ROLES },
  ...MVP_MODULES.map(module => ({ path: module.path, label: module.name, roles: MVP_ROLES, capability: module.capability })),
];

export const ACCOUNTING_MENU_ITEMS: MenuItem[] = [
  { path: '/accounting', label: 'Dashboard Accounting', group: 'Ringkasan', roles: MVP_ROLES, capability: 'view:acc_report' },
  { path: '/accounting/omzet', label: 'Rekap Omzet H+1', group: 'Pekerjaan harian', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/vouchers', label: 'Voucher Tagihan & Pembelian', group: 'Pekerjaan harian', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/setoran', label: 'Rekap Setoran', group: 'Pekerjaan harian', roles: MVP_ROLES, capability: 'view:acc_deposits' },
  { path: '/accounting/kepegawaian', label: 'Rekap Cuti & Absensi', group: 'Pekerjaan harian', roles: MVP_ROLES, capability: 'view:acc_hr' },
  { path: '/accounting/omzet-tahunan', label: 'Omzet Tahunan', group: 'Laporan & pencocokan', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/pencocokan-setoran', label: 'Pencocokan Setoran', group: 'Laporan & pencocokan', roles: MVP_ROLES, capability: 'view:acc_deposits' },
  { path: '/accounting/jurnal', label: 'Jurnal Transaksi', group: 'Laporan & pencocokan', roles: MVP_ROLES, capability: 'view:acc_journal' },
  { path: '/accounting/cashflow', label: 'Laporan Cashflow', group: 'Laporan & pencocokan', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/outstanding', label: 'Hutang & Piutang', group: 'Laporan & pencocokan', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/rekonsiliasi', label: 'Rekonsiliasi Bank', group: 'Laporan & pencocokan', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/impor', label: 'Impor Excel', group: 'Pengaturan', roles: MVP_ROLES, capability: 'submit:acc_period' },
  { path: '/accounting/periode', label: 'Periode Akuntansi', group: 'Pengaturan', roles: MVP_ROLES, capability: 'view:acc_detail' },
  { path: '/accounting/master', label: 'Master Data & COA', group: 'Pengaturan', roles: MVP_ROLES, capability: 'view:acc_master' },
];

export const PROJECT_MENU_ITEMS: MenuItem[] = [
  { path: '/projects', label: 'Dashboard Proyek', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/list', label: 'Proyek Berjalan', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/progress', label: 'Progres Proyek', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/payments', label: 'Progres Pembayaran', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/vendors', label: 'Mitra & Vendor', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/documents', label: 'Dokumentasi', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/rab', label: 'Anggaran & RAB', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/timeline', label: 'Time Plan', roles: MVP_ROLES, capability: 'view:projects' },
];

export const CELLULAR_MENU_ITEMS: MenuItem[] = [
  { path: '/cellular', label: 'Dashboard Cellular', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/operasional', label: 'Katalog, Stok & Penjualan', roles: MVP_ROLES, capability: 'view:cellular' }
];

export function homePathForRole(_role: Role): string {
  return '/dashboard';
}
