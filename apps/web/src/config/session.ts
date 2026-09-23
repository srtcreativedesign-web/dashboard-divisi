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

export function roleDisplay(role: string): string {
  return ROLE_LABEL[role] ?? role;
}

export interface SessionUser {
  name: string;
  role: Role;
  divisionCode: string | null; // null = lintas 7 divisi (BOD)
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value) || (LEGACY_ROLES as readonly string[]).includes(value);
}
