export const ROLES = ['BOD', 'MANAGER', 'ADMIN', 'PIC'] as const;
export const LEGACY_ROLES = ['SUPERADMIN', 'HRD', 'USER'] as const;
export type Role = (typeof ROLES)[number] | (typeof LEGACY_ROLES)[number];

export const ROLE_LABEL: Record<string, string> = {
  BOD: 'Executive (BOD)',
  MANAGER: 'Superadmin (Manager)',
  ADMIN: 'Admin',
  PIC: 'PIC',
  SUPERADMIN: 'Superadmin (Manager)',
  HRD: 'HRD',
  USER: 'PIC',
};
export function roleDisplay(role: string): string { return ROLE_LABEL[role] ?? role; }

export interface SessionUser {
  name: string;
  role: Role;
  divisionCode: string | null; // null = lintas 7 divisi (BOD)
}

export const MOCK_SESSIONS: Record<string, SessionUser> = {
  BOD: { name: 'Bodi Demo', role: 'BOD', divisionCode: null },
  MANAGER: { name: 'Mina Demo', role: 'MANAGER', divisionCode: 'WRAP' },
  ADMIN: { name: 'Admin Demo', role: 'ADMIN', divisionCode: 'WRAP' },
  PIC: { name: 'PIC Demo (View Only)', role: 'USER', divisionCode: 'WRAP' },
  SUPERADMIN: { name: 'Super Demo', role: 'SUPERADMIN', divisionCode: null },
  HRD: { name: 'Hera Demo', role: 'HRD', divisionCode: null },
  USER: { name: 'Usman Demo (PIC)', role: 'USER', divisionCode: null },
};

export interface MenuItem {
  path: string;
  label: string;
  roles: readonly Role[];
  capability?: string; // untuk ORG-06: filter per capability, bukan hanya role
}

export const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/laporan-harian', label: 'Report Harian', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/rincian-tenant', label: 'Rincian Omset Tenant', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/laporan', label: 'Detail Laporan', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/budgeting', label: 'Format Budgeting', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/cashflow', label: 'Cashflow', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
  { path: '/pnl', label: 'PNL', roles: ['BOD', 'MANAGER', 'ADMIN', 'PIC', 'SUPERADMIN', 'HRD', 'USER'] },
];

export const ACCOUNTING_MENU_ITEMS: MenuItem[] = [
  { path: '/accounting', label: 'Dashboard Accounting', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_report' },
  { path: '/accounting/jurnal', label: 'Jurnal Aktual', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_journal' },
  { path: '/accounting/impor', label: 'Impor Transaksi', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_report' },
  { path: '/accounting/outstanding', label: 'Outstanding', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_report' },
  { path: '/accounting/cashflow', label: 'Laporan Cashflow', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_report' },
  { path: '/accounting/rekonsiliasi', label: 'Rekonsiliasi Bank', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_report' },
  { path: '/accounting/periode', label: 'Periode', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_report' },
  { path: '/accounting/master', label: 'Master Data', roles: ['MANAGER', 'ADMIN'], capability: 'view:acc_master' },
];

export function homePathForRole(role: Role): string {
  return role === 'USER' ? '/profil' : '/dashboard';
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
