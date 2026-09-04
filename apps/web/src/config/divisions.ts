/**
 * SOP 1B: Single Source of Truth untuk 7 Divisi
 * Digunakan oleh OrgFilters, RoleSwitcher, SessionContext, API hooks.
 * Sumber: SOP Internal IT §1 + Roadmap 7 divisi (WRAP, CELL, REFL, MINI, FNB, FIN, MC)
 */

export const DIVISIONS = [
  { code: 'WRAP', name: 'Wrapping' },
  { code: 'CELL', name: 'Cellular' },
  { code: 'REFL', name: 'Refleksi' },
  { code: 'MINI', name: 'Minimarket' },
  { code: 'FNB', name: 'FnB' },
  { code: 'FIN', name: 'Finance' },
  { code: 'MC', name: 'Money Changer' },
  { code: 'ACC', name: 'Accounting' },
] as const;

export type DivisionCode = (typeof DIVISIONS)[number]['code'];

export const DIVISION_CODES = DIVISIONS.map((d) => d.code) as readonly DivisionCode[];

export const DIVISION_MAP = Object.fromEntries(
  DIVISIONS.map((d) => [d.code, d.name]),
) as Record<DivisionCode, string>;

export function isDivisionCode(value: string): value is DivisionCode {
  return (DIVISION_CODES as readonly string[]).includes(value);
}

/**
 * @deprecated — diganti hooks/useOrg.ts GET /org/outlets (real BE, 2026-09-01).
 * Dipertahankan untuk kompatibilitas test lama.
 */
export function getMockOutlets(divisionCode: string): string[] {
  if (!isDivisionCode(divisionCode)) return [];
  return [`${divisionCode}-001`, `${divisionCode}-002`];
}
