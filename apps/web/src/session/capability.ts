import type { Role } from '../config/session';

const ROLE_CAPABILITIES: Record<string, string[]> = {
  BOD: ['view:division', 'view:report', 'view:workforce', 'view:acc_report', 'view:projects'],
  MANAGER: ['view:division', 'manage:division', 'view:report', 'write:assessment', 'approve:target', 'approve:revenue'],
  ADMIN: ['view:division', 'write:revenue', 'view:report'],
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

const PROJECT_MANAGER_CAPABILITIES = [
  'view:division',
  'manage:division',
  'view:projects',
  'manage:projects',
  'view:report',
];

const PROJECT_ADMIN_CAPABILITIES = [
  'view:division',
  'view:projects',
  'manage:projects',
];

function getStoredDivision(): string | null {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem('dashboard-divisi.division-demo');
    } catch {
      return null;
    }
  }
  return null;
}

export function hasCapability(role: Role, capability: string, divisionCode?: string | null): boolean {
  const activeDivision = divisionCode !== undefined ? divisionCode : getStoredDivision();

  // SUPERADMIN selalu diizinkan mengakses apapun
  if (role === 'SUPERADMIN') {
    return true;
  }

  // Domain Accounting (ACC)
  if (capability.startsWith('acc:') || capability.includes(':acc_')) {
    if (role === 'BOD') return capability === 'view:acc_report';
    if (activeDivision === 'ACC') {
      if (role === 'MANAGER') return ACC_MANAGER_CAPABILITIES.includes(capability);
      if (role === 'ADMIN') return ACC_ADMIN_CAPABILITIES.includes(capability);
    }
    return false;
  }

  // Domain Project
  if (capability.startsWith('view:projects') || capability.startsWith('manage:projects')) {
    if (role === 'BOD') return capability === 'view:projects';
    if (activeDivision === 'PROJECT') {
      if (role === 'MANAGER') return PROJECT_MANAGER_CAPABILITIES.includes(capability);
      if (role === 'ADMIN') return PROJECT_ADMIN_CAPABILITIES.includes(capability);
    }
    return false;
  }

  // Pengguna dengan konteks/divisi ACC atau PROJECT memiliki kapabilitas khusus dan terisolasi
  // Blok ini memastikan bahwa meskipun tidak memanggil capability dengan prefix acc_ atau projects 
  // (misalnya 'view:division' atau 'view:report'), mereka tetap difilter secara spesifik.
  if (activeDivision === 'ACC') {
    if (role === 'BOD') return capability === 'view:acc_report' || capability === 'view:division';
    if (role === 'MANAGER') return ACC_MANAGER_CAPABILITIES.includes(capability);
    if (role === 'ADMIN') return ACC_ADMIN_CAPABILITIES.includes(capability);
    return false;
  }

  if (activeDivision === 'PROJECT') {
    if (role === 'BOD') return capability === 'view:projects' || capability === 'view:division';
    if (role === 'MANAGER') return PROJECT_MANAGER_CAPABILITIES.includes(capability);
    if (role === 'ADMIN') return PROJECT_ADMIN_CAPABILITIES.includes(capability);
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
