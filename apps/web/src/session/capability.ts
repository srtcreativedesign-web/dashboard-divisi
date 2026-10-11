import type { Role } from '../config/session';
import { normalizeDivisionCode } from '../config/mvp';
import policy from './capabilities.generated.json';

export const DOMAIN_CAPABILITIES: Record<string, Partial<Record<Role, readonly string[]>>> = policy.domains;

export function hasCapability(role: string, capability: string, divisionCode?: string | null): boolean {
  role = role.toUpperCase();
  if (role === 'BOD') return policy.bod.includes(capability);
  const division = normalizeDivisionCode(divisionCode);
  const domain = division === 'FIN' && role === 'FINANCE' ? 'ACC' : division;
  return !!domain && Object.hasOwn(DOMAIN_CAPABILITIES, domain) && Object.hasOwn(DOMAIN_CAPABILITIES[domain]!, role) && (DOMAIN_CAPABILITIES[domain]?.[role as Role] ?? []).includes(capability);
}

export function canAccessDivision(user: { role: string; divisionCode: string | null }, divisionCode: string | null | undefined): boolean {
  if (!divisionCode) return true;
  const role = user.role.toUpperCase();
  const own = normalizeDivisionCode(user.divisionCode);
  if (role === 'BOD' && own === null) return true;
  const target = normalizeDivisionCode(divisionCode);
  if (role === 'FINANCE' && own === 'FIN' && target === 'ACC') return true;
  return own === target;
}

export function canEditReporting(role: Role): boolean {
  return ['ADMIN', 'ACCOUNTING', 'FINANCE'].includes(role);
}
