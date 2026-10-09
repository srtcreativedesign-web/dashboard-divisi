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
  { id: 'work', label: 'Pekerjaan Saya', children: [
    { path: '/accounting/dokumen/register', label: 'Semua Dokumen', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/dokumen/pengajuan', label: 'Draf & Koreksi Saya', roles: ['ADMIN'], capability: 'write:omzet' },
    { path: '/accounting/dokumen/pemeriksaan', label: 'Antrean Pemeriksaan', roles: ['ACCOUNTING'], capability: 'validate:omzet' },
    { path: '/accounting/dokumen/persetujuan', label: 'Keputusan Menunggu', roles: ['MANAGER'], capability: 'approve:voucher' },
    { path: '/accounting/dokumen/realisasi', label: 'Realisasi Menunggu', roles: ['FINANCE'], capability: 'execute:payment' },
  ] },
  { id: 'daily', label: 'Penerimaan Harian', children: [
    { path: '/accounting/pendapatan/rekap', label: 'Rekap Omzet H+1', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/kas-bank/setoran', label: 'Setoran Outlet', roles: MVP_ROLES, capability: 'view:acc_deposits' },
    { path: '/accounting/kas-bank/pencocokan', label: 'Cocokkan Omzet & Setoran', roles: MVP_ROLES, capability: 'view:acc_deposits' },
  ] },
  { id: 'payments', label: 'Tagihan & Pembayaran', children: [
    { path: '/accounting/pengeluaran/voucher', label: 'Voucher Pengeluaran', roles: MVP_ROLES, capability: 'view:acc_detail' },
  ] },
  { id: 'books', label: 'Pembukuan', children: [
    { path: '/accounting/pembukuan/transaksi', label: 'Jurnal Transaksi', roles: MVP_ROLES, capability: 'view:acc_journal' },
    { path: '/accounting/pembukuan/hutang-piutang', label: 'Hutang & Piutang', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/pembukuan/periode', label: 'Periode & Penutupan', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/kas-bank/rekonsiliasi', label: 'Rekonsiliasi Bank', roles: MVP_ROLES, capability: 'view:acc_detail' },
  ] },
  { id: 'reports', label: 'Laporan & Analisis', children: [
    { path: '/accounting/pendapatan/analisis', label: 'Kinerja Omzet Outlet', roles: MVP_ROLES, capability: 'view:acc_detail' },
    { path: '/accounting/kas-bank/cashflow', label: 'Laporan Cashflow', roles: MVP_ROLES, capability: 'view:acc_detail' },
  ] },
  { id: 'support', label: 'Operasional Pendukung', children: [
    { path: '/accounting/administrasi/pegawai', label: 'Cuti & Absensi', roles: MVP_ROLES, capability: 'view:acc_hr' },
  ] },
  { id: 'data', label: 'Data & Integrasi', children: [
    { path: '/accounting/pendapatan/sumber', label: 'Sumber Laporan Cellular', roles: MVP_ROLES, capability: 'preview:cellular_report' },
    { path: '/accounting/pembukuan/master', label: 'Master Akun & Kategori', roles: MVP_ROLES, capability: 'view:acc_master' },
    { path: '/accounting/pembukuan/impor', label: 'Impor Data Transaksi', roles: MVP_ROLES, capability: 'submit:acc_period' },
  ] },
];
export const ACCOUNTING_MENU_ITEMS: MenuItem[] = [
  { path: '/accounting', label: 'Dashboard Accounting', roles: MVP_ROLES, capability: 'view:acc_report' },
  ...ACCOUNTING_NAV_GROUPS.flatMap(group => group.children.map(item => ({ ...item, group: group.label }))),
];


export const PROJECT_MENU_ITEMS: MenuItem[] = [
  // Kategori Project
  { path: '/projects', label: 'Dashboard Proyek', group: 'Project', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/new', label: 'Proyek Baru', group: 'Project', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/maintenance', label: 'Proyek Maintenance', group: 'Project', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/timeline', label: 'Time Plan', group: 'Project', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/vendors', label: 'Mitra & Vendor', group: 'Project', roles: MVP_ROLES, capability: 'view:projects' },

  // Kategori Keuangan
  { path: '/projects/rab', label: 'Anggaran & RAB', group: 'Keuangan', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/payments', label: 'Progres Pembayaran', group: 'Keuangan', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/petty-cash', label: 'Petty Cash Proyek', group: 'Keuangan', roles: MVP_ROLES, capability: 'view:projects' },

  // Kategori Laporan
  { path: '/projects/progress', label: 'Progres Proyek', group: 'Laporan', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/lpj', label: 'LPJ & Laporan', group: 'Laporan', roles: MVP_ROLES, capability: 'view:projects' },
  { path: '/projects/documents', label: 'Dokumentasi', group: 'Laporan', roles: MVP_ROLES, capability: 'view:projects' },
];

export const CELLULAR_MENU_ITEMS: MenuItem[] = [
  { path: '/cellular', label: 'Pusat Kendali', group: 'Pekerjaan Saya', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/pekerjaan', label: 'Antrean Pekerjaan', group: 'Pekerjaan Saya', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/penerimaan', label: 'Rekap Harian', group: 'Penerimaan Harian', roles: MVP_ROLES, capability: 'view:cellular_sales' },
  { path: '/cellular/penjualan', label: 'Transaksi Penjualan', group: 'Penerimaan Harian', roles: MVP_ROLES, capability: 'view:cellular_sales' },
  { path: '/cellular/tagihan', label: 'Tagihan & Settlement', group: 'Tagihan & Pembayaran', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/pembukuan', label: 'Buku Persediaan', group: 'Pembukuan', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/laporan', label: 'Kinerja Cellular', group: 'Laporan & Analitik', roles: MVP_ROLES, capability: 'view:cellular_sales' },
  { path: '/cellular/produk', label: 'Produk & Paket', group: 'Operasional Pendukung', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/persediaan', label: 'Stok & Mutasi', group: 'Operasional Pendukung', roles: MVP_ROLES, capability: 'view:cellular' },
  { path: '/cellular/integrasi', label: 'Sumber & Integrasi', group: 'Data & Integrasi', roles: MVP_ROLES, capability: 'view:cellular' },
];

export function homePathForRole(_role: Role): string {
  return '/dashboard';
}
