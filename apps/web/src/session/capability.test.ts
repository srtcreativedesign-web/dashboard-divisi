import { describe, expect, it } from 'vitest';
import { hasCapability, canAccessDivision } from './capability';

describe('Policy yang berasal dari backend', () => {
  it('identitas tidak dikenal ditolak tanpa exception, termasuk nama properti bawaan', () => {
    for (const role of ['SUPERADMIN', '__proto__', 'constructor', 'toString']) {
      expect(hasCapability(role, 'manage:acc_master', 'ACC')).toBe(false);
    }
    for (const domain of ['OTHER', '__proto__', 'constructor', 'toString']) {
      expect(hasCapability('ADMIN', 'write:omzet', domain)).toBe(false);
    }
  });
  it('normalisasi role mengikuti backend tanpa membuka capability domain lain', () => {
    expect(hasCapability('admin', 'write:omzet', 'ACC')).toBe(true);
    expect(hasCapability('ADMIN', 'write:omzet', 'CELL')).toBe(false);
    expect(hasCapability('FINANCE', 'receive:acc_deposits', 'FIN')).toBe(true);
    expect(hasCapability('MANAGER', 'write:cellular_stock', 'CELLULAR')).toBe(true);
    expect(canAccessDivision({ role: 'finance', divisionCode: 'FIN' }, 'ACC')).toBe(true);
  });
  it('BOD hanya mendapat baca dan identitas domain tetap membatasi scope', () => {
    expect(hasCapability('BOD', 'view:projects', null)).toBe(true);
    for (const action of ['write:omzet', 'receive:acc_deposits', 'void:cellular_sale', 'manage:projects', 'approve:voucher']) expect(hasCapability('BOD', action, null)).toBe(false);
    expect(canAccessDivision({ role: 'BOD', divisionCode: 'ACC' }, 'CELL')).toBe(false);
    expect(canAccessDivision({ role: 'BOD', divisionCode: '' }, 'CELL')).toBe(false);
  });
});
