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

export interface AccountingNavGroup { id: string; label: string; children: MenuItem[] }
export const ACCOUNTING_NAV_GROUPS: AccountingNavGroup[] = [
  { id: 'documents', label: 'Dokumen & Persetujuan', children: [
    { path: '/accounting/dokumen/register', label: 'Register Dokumen', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/dokumen/pengajuan', label: 'Pengajuan Admin', roles: ['ADMIN'], capability: 'write:omzet' },
    { path: '/accounting/dokumen/pemeriksaan', label: 'Pemeriksaan Accounting', roles: ['ACCOUNTING'], capability: 'validate:omzet' },
    { path: '/accounting/dokumen/persetujuan', label: 'Persetujuan Manager', roles: ['MANAGER'], capability: 'approve:voucher' },
    { path: '/accounting/dokumen/realisasi', label: 'Realisasi Finance', roles: ['FINANCE'], capability: 'execute:payment' },
  ] },
  { id: 'revenue', label: 'Pendapatan Outlet', children: [
    { path: '/accounting/pendapatan/rekap', label: 'Rekap Omzet H+1', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/pendapatan/analisis', label: 'Analisis Omzet Outlet', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/pendapatan/sumber', label: 'Sumber Laporan Cellular', roles: MVP_ROLES, capability: 'preview:cellular_report' },
  ] },
  { id: 'expenses', label: 'Tagihan & Pengeluaran', children: [
    { path: '/accounting/pengeluaran/voucher', label: 'Voucher Pengeluaran', roles: MVP_ROLES, capability: 'view:acc_detail' },
  ] },
  { id: 'cash', label: 'Kas & Bank', children: [
    { path: '/accounting/kas-bank/setoran', label: 'Setoran & Penerimaan', roles: MVP_ROLES, capability: 'view:acc_deposits' },
    { path: '/accounting/kas-bank/pencocokan', label: 'Pencocokan Setoran', roles: MVP_ROLES, capability: 'view:acc_deposits' },
    { path: '/accounting/kas-bank/rekonsiliasi', label: 'Rekonsiliasi Bank', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/kas-bank/cashflow', label: 'Laporan Cashflow', roles: MVP_ROLES, capability: 'view:acc_detail' },
  ] },
  { id: 'people', label: 'Administrasi Pegawai', children: [
    { path: '/accounting/administrasi/pegawai', label: 'Cuti & Absensi', roles: MVP_ROLES, capability: 'view:acc_hr' },
  ] },
  { id: 'books', label: 'Pembukuan & Kontrol', children: [
    { path: '/accounting/pembukuan/transaksi', label: 'Catatan Transaksi', roles: MVP_ROLES, capability: 'view:acc_journal' },
    { path: '/accounting/pembukuan/hutang-piutang', label: 'Hutang & Piutang', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/pembukuan/periode', label: 'Periode & Penutupan', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/pembukuan/master', label: 'Master Akun & Kategori', roles: MVP_ROLES, capability: 'view:acc_master' },
    { path: '/accounting/pembukuan/impor', label: 'Impor Transaksi', roles: MVP_ROLES, capability: 'submit:acc_period' },
  ] },
];
export const ACCOUNTING_MENU_ITEMS: MenuItem[] = [
  { path: '/accounting', label: 'Dashboard Accounting', roles: MVP_ROLES, capability: 'view:acc_report' },
  ...ACCOUNTING_NAV_GROUPS.flatMap(group => group.children.map(item => ({ ...item, group: group.label }))),
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
