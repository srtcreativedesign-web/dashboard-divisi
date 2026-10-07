import { describe, expect, it } from 'vitest';
import { MVP_MODULES, moduleHome } from './mvp';
import { ACCOUNTING_MENU_ITEMS } from './menus';
import { canAccessDivision, hasCapability } from '../session/capability';

describe('Akses modul MVP', () => {
  it('menggunakan CELL untuk akun Cellular lama maupun baru', () => {
    expect(moduleHome('CELL')).toBe('/cellular');
    expect(moduleHome('CELLULAR')).toBe('/cellular');
    expect(hasCapability('MANAGER', 'view:cellular', 'CELL')).toBe(true);
    expect(hasCapability('MANAGER', 'view:cellular', 'CELLULAR')).toBe(true);
  });
  it('membatasi BOD ke baca dan menolak role tidak dikenal', () => {
    expect(hasCapability('BOD', 'manage:projects', null)).toBe(false);
    expect(hasCapability('BOD', 'submit:acc_period', null)).toBe(false);
    expect(hasCapability('SUPERADMIN', 'manage:acc_master', 'ACC')).toBe(false);
    expect(MVP_MODULES.every(module => hasCapability('BOD', module.capability, null))).toBe(true);
  });
  it('memisahkan input Admin dan persetujuan Manager Accounting', () => {
    expect(hasCapability('ADMIN', 'submit:acc_period', 'ACC')).toBe(true);
    expect(hasCapability('ADMIN', 'approve:acc_period', 'ACC')).toBe(false);
    expect(hasCapability('MANAGER', 'submit:acc_period', 'ACC')).toBe(false);
    expect(hasCapability('MANAGER', 'approve:acc_period', 'ACC')).toBe(true);
  });
  it('tidak memberi akun Cellular akses modul Project atau Accounting', () => {
    const user = { role: 'MANAGER', divisionCode: 'CELL' };
    expect(canAccessDivision(user, 'ACC')).toBe(false);
    expect(canAccessDivision(user, 'PROJECT')).toBe(false);
    expect(hasCapability(user.role, 'view:acc_report', user.divisionCode)).toBe(false);
    expect(hasCapability(user.role, 'view:projects', user.divisionCode)).toBe(false);
  });
  it('memberi Staff Accounting jalur laporan Accounting', () => {
    expect(hasCapability('ACCOUNTING', 'view:acc_report', 'ACC')).toBe(true);
    expect(hasCapability('ACCOUNTING', 'view:acc_journal', 'ACC')).toBe(true);
    expect(hasCapability('ACCOUNTING', 'approve:acc_period', 'ACC')).toBe(false);
  });
});


describe('Menu jurnal dan impor sesuai izin API', () => {
  it('menyembunyikan jurnal dan impor dari role yang hanya membaca laporan', () => {
    for (const role of ['HEAD_OPS', 'SPV', 'LEADER', 'ADMIN_GUDANG']) {
      for (const path of ['/accounting/jurnal', '/accounting/impor', '/accounting/vouchers', '/accounting/omzet', '/accounting/cashflow', '/accounting/outstanding', '/accounting/rekonsiliasi', '/accounting/periode']) {
        const menu = ACCOUNTING_MENU_ITEMS.find(item => item.path === path)!;
        expect(hasCapability(role, menu.capability!, 'ACC')).toBe(false);
      }
    }
  });
  it('Manager membaca jurnal, sementara impor mengikuti aktor pengajuan periode', () => {
    const journal = ACCOUNTING_MENU_ITEMS.find(item => item.path === '/accounting/jurnal')!;
    const importMenu = ACCOUNTING_MENU_ITEMS.find(item => item.path === '/accounting/impor')!;
    expect(hasCapability('MANAGER', journal.capability!, 'ACC')).toBe(true);
    expect(hasCapability('MANAGER', importMenu.capability!, 'ACC')).toBe(false);
    for (const role of ['ADMIN', 'ACCOUNTING', 'FINANCE']) {
      expect(hasCapability(role, importMenu.capability!, 'ACC')).toBe(true);
    }
  });
});
