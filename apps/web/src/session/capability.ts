import type { Role } from '../mocks/session';

const ROLE_CAPABILITIES: Record<string, string[]> = {
  BOD: ['view:division', 'view:report', 'view:workforce', 'view:acc_report'],
  MANAGER: ['view:division', 'manage:division', 'view:report', 'write:target', 'write:assessment', 'write:revenue'],
  ADMIN: ['view:division', 'write:revenue', 'write:target', 'view:report'],
  SUPERADMIN: ['*', 'manage:config'],
  HRD: ['view:workforce', 'manage:workforce'],
  PIC: ['view:own'],
  USER: ['view:own'],
};

const ACC_MANAGER_CAPABILITIES = [
  'view:division',
  'manage:division',
  'view:acc_report',
  'view:acc_journal',
  'view:acc_master',
  'manage:acc_master',
  'manage:acc_period',
  'approve:acc_period',
];

const ACC_ADMIN_CAPABILITIES = [
  'view:division',
  'view:acc_report',
  'view:acc_journal',
  'view:acc_master',
  'write:acc_transaction',
  'import:acc_transaction',
  'write:acc_outstanding',
  'write:acc_bank',
  'submit:acc_period',
];

export function hasCapability(role: Role, capability: string, divisionCode?: string | null): boolean {
  if (capability.startsWith('acc:') || capability.includes(':acc_')) {
    if (role === 'BOD') {
      return capability === 'view:acc_report';
    }
    if (divisionCode === 'ACC') {
      if (role === 'MANAGER') return ACC_MANAGER_CAPABILITIES.includes(capability);
      if (role === 'ADMIN') return ACC_ADMIN_CAPABILITIES.includes(capability);
    }
    return false;
  }
  const caps = ROLE_CAPABILITIES[role] ?? [];
  return caps.includes('*') || caps.includes(capability);
}

export function canAccessDivision(
  user: { role: Role; divisionCode: string | null },
  divisionCode: string | null | undefined,
): boolean {
  if (!divisionCode) return true;
  if (user.role === 'BOD' && !user.divisionCode) return true;
  // SUPERADMIN juga lintas (untuk kompatibilitas lama)
  if (user.role === 'SUPERADMIN' && !user.divisionCode) return true;
  return user.divisionCode === divisionCode;
}

// New helper: Determines if a role can edit reporting data. PIC users (role 'USER') are view‑only.
export function canEditReporting(role: Role): boolean {
  // Assuming 'USER' is the PIC role; adjust if different.
  return role !== 'USER';
}
