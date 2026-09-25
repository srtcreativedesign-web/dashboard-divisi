import type { Role } from './session';

export interface MenuItem {
  path: string;
  label: string;
  roles: readonly Role[];
  capability?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/laporan-harian', label: 'Report Harian', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/rincian-tenant', label: 'Rincian Omset Tenant', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/laporan', label: 'Detail Laporan', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/budgeting', label: 'Format Budgeting', roles: ['BOD', 'MANAGER', 'SUPERADMIN'] },
  { path: '/cashflow', label: 'Cashflow', roles: ['BOD', 'MANAGER', 'SUPERADMIN'] },
  { path: '/pnl', label: 'PNL', roles: ['BOD', 'MANAGER', 'SUPERADMIN'] },
];

export const ACCOUNTING_MENU_ITEMS: MenuItem[] = [
  { path: '/accounting', label: 'Dashboard Accounting', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_report' },
  { path: '/accounting/operasional', label: 'Operasional Harian', roles: ['ADMIN', 'MANAGER'], capability: 'view:acc_report' },
  { path: '/accounting/jurnal', label: 'Jurnal Aktual', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_journal' },
  { path: '/accounting/impor', label: 'Impor Transaksi', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_report' },
  { path: '/accounting/outstanding', label: 'Outstanding', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_report' },
  { path: '/accounting/cashflow', label: 'Laporan Cashflow', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_report' },
  { path: '/accounting/rekonsiliasi', label: 'Rekonsiliasi Bank', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_report' },
  { path: '/accounting/periode', label: 'Periode', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_report' },
  { path: '/accounting/master', label: 'Master Data', roles: ['MANAGER', 'ADMIN', 'ACCOUNTING', 'FINANCE'], capability: 'view:acc_master' },
];

export const PROJECT_MENU_ITEMS: MenuItem[] = [
  { path: '/projects', label: 'Dashboard Proyek', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/list', label: 'Proyek Berjalan', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/progress', label: 'Progres Proyek', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/payments', label: 'Progres Pembayaran', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/vendors', label: 'Mitra & Vendor', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/documents', label: 'Dokumentasi', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/rab', label: 'Anggaran & RAB', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
  { path: '/projects/timeline', label: 'Time Plan', roles: ['MANAGER', 'ADMIN', 'BOD'], capability: 'view:projects' },
];

export function homePathForRole(role: Role): string {
  return role === 'USER' ? '/profil' : '/dashboard';
}
