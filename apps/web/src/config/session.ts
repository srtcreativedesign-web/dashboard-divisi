export type Role =
  | 'BOD'
  | 'MANAGER'
  | 'HEAD_OPS'
  | 'SPV'
  | 'LEADER'
  | 'ADMIN'
  | 'ADMIN_GUDANG'
  | 'ACCOUNTING'
  | 'FINANCE'
  | 'SUPERADMIN'
  | 'HRD'
  | 'USER'
  | 'PIC';

export function roleDisplay(role: string): string {
  const displayMap: Record<string, string> = {
    BOD: 'Direksi / BOD',
    MANAGER: 'Manager',
    HEAD_OPS: 'Head Operasional',
    SPV: 'Supervisor',
    LEADER: 'Leader',
    ADMIN: 'Admin Divisi',
    ADMIN_GUDANG: 'Admin Gudang',
    ACCOUNTING: 'Staff Accounting',
    FINANCE: 'Staff Finance',
    SUPERADMIN: 'Superadmin',
    HRD: 'HRD',
    USER: 'User / PIC',
    PIC: 'User / PIC'
  };
  return displayMap[role] ?? role;
}
