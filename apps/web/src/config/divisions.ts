/**
 * SOP 1B: Single Source of Truth untuk Divisi Operasional Nyata & Outlet Sobat API
 * Digunakan oleh OrgFilters, SessionContext, API hooks, dan Approval Hub.
 * Sumber: Sobat API /lms/outlets + Unit Bisnis Aktual (WRAP, CELL, REFL, MINI, FNB, MC, ACC)
 */

export const DIVISIONS = [
  { code: 'WRAP', name: 'Wrapping' },
  { code: 'CELL', name: 'Cellular' },
  { code: 'REFL', name: 'Refleksi' },
  { code: 'MINI', name: 'Minimarket' },
  { code: 'FNB', name: 'FnB' },
  { code: 'MC', name: 'Money Changer' },
  { code: 'ACC', name: 'Accounting' },
] as const;

export type DivisionCode = (typeof DIVISIONS)[number]['code'];

export const DIVISION_CODES = DIVISIONS.map((d) => d.code) as readonly DivisionCode[];

export const DIVISION_MAP = Object.fromEntries(
  DIVISIONS.map((d) => [d.code, d.name]),
) as Record<DivisionCode, string>;

export function isDivisionCode(value: string): value is DivisionCode {
  return (DIVISION_CODES as readonly string[]).includes(value as DivisionCode);
}

export interface RealOutlet {
  code: string;
  name: string;
  divisionCode: DivisionCode;
  address?: string;
}

/**
 * Daftar 58 Outlet Nyata dari Integrasi Upstream Sobat API (/lms/outlets)
 * Terpetakan secara presisi ke unit bisnis operasional bandara.
 */
export const REAL_SOBAT_OUTLETS: readonly RealOutlet[] = [
  // WRAP (19 real outlets)
  { code: 'T3-A', name: 'FIRST SECURE-T3-A', divisionCode: 'WRAP', address: 'TERMINAL 3 B INTER' },
  { code: 'T3 B', name: 'ROBUSTPACK-T3 B', divisionCode: 'WRAP', address: 'TERMINAL 3 C INTER' },
  { code: 'T3E', name: 'FIRST SECURE-T3E', divisionCode: 'WRAP', address: 'TERMINAL 3 E INTER' },
  { code: 'T2D', name: 'KINGTECH-T2D', divisionCode: 'WRAP', address: 'terminal 2D CGK' },
  { code: 'T2D1', name: 'STAR WRAP-T2D1', divisionCode: 'WRAP', address: 'TERMINAL 2 D' },
  { code: 'T2E', name: 'GALAXY PORT-T2E', divisionCode: 'WRAP', address: 'TERMINAL 2 E' },
  { code: 'T2E4', name: 'FIRST SECURE-T2E4', divisionCode: 'WRAP', address: 'TERMINAL 2 E' },
  { code: 'T2F', name: 'KINGTECH-T2F', divisionCode: 'WRAP', address: 'TERMINAL 2 F' },
  { code: 'T2F5', name: 'ROBUST PACK-T2F5', divisionCode: 'WRAP', address: 'TERMINAL 2 F' },
  { code: 'T2F2', name: 'KINGCELL-T2F2', divisionCode: 'WRAP', address: 'TERMINAL 2 F' },
  { code: 'T1C', name: 'PIONER WRAP-T1C', divisionCode: 'WRAP', address: 'TERMINAL 1 C' },
  { code: 'YIA', name: 'KINGTECH-YIA', divisionCode: 'WRAP', address: 'Yogyakarta international airport' },
  { code: 'SUB', name: 'KINGTECH-SUB', divisionCode: 'WRAP', address: 'Juanda International Airport' },
  { code: 'DPS', name: 'KINGTECH-DPS', divisionCode: 'WRAP', address: 'Denpasar international airport' },
  { code: 'HLP', name: 'KINGTECH-HLP', divisionCode: 'WRAP', address: 'halim perdana kusuma' },
  { code: 'BDG', name: 'PIONEER WRAP-BDG', divisionCode: 'WRAP', address: 'husein sastranegara' },
  { code: 'YIA-B', name: 'KINGTECH-YIA-B', divisionCode: 'WRAP', address: 'YIA' },
  { code: 'PN-BDG', name: 'PIONEER-PN-BDG', divisionCode: 'WRAP', address: 'husein sastranegara' },
  { code: 'HO', name: 'KINGTECH-HO', divisionCode: 'WRAP', address: 'Head Office' },

  // MINI (20 real outlets)
  { code: 'T3I', name: 'M-MART-T3I', divisionCode: 'MINI', address: 'kantin terminal T3 International bandara soekarno-hatta (CGK)' },
  { code: '2D1', name: 'POINT ONE -2D1', divisionCode: 'MINI', address: 'TERMINAL 2 D' },
  { code: 'T2D2', name: 'AMBIL BEKAL YUK-T2D2', divisionCode: 'MINI', address: 'TERMINAL 2 D 2' },
  { code: 'T2D3', name: 'POINT ONE-T2D3', divisionCode: 'MINI', address: 'TERMINAL 2 D 3' },
  { code: 'T2D5', name: 'POINT ONE-T2D5', divisionCode: 'MINI', address: 'TERMINAL 2 D 5' },
  { code: 'T2D6', name: 'AMBIL BEKAL YUK-T2D6', divisionCode: 'MINI', address: 'TERMINAL 2 D6' },
  { code: 'T2D7', name: 'POINT ONE-T2D7', divisionCode: 'MINI', address: 'TERMINAL 2 D 7' },
  { code: 'T1E3', name: 'PAPIMART-T1E3', divisionCode: 'MINI', address: 'TERMINAL 1 E3' },
  { code: 'T2E7', name: 'LATTE STORY-T2E7', divisionCode: 'MINI', address: 'TERMINAL 2 E' },
  { code: 'T2E41', name: 'PAPIMART-T2E41', divisionCode: 'MINI', address: 'TERMINAL 2 E' },
  { code: 'T2E51', name: 'PAPIMART-T2E51', divisionCode: 'MINI', address: 'TERMINAL 2 E5' },
  { code: 'T2FB', name: 'LATTE STORY-T2FB', divisionCode: 'MINI', address: 'TERMINAL 2 F' },
  { code: 'LST1C', name: 'LATTE STORY-LST1C', divisionCode: 'MINI', address: 'TERMINAL 1 C' },
  { code: 'T1B6', name: 'URBAN-T1B6', divisionCode: 'MINI', address: 'terminal 1 b' },
  { code: 'T1B4', name: 'URBAN-T1B4', divisionCode: 'MINI', address: 'term 1 b 4' },
  { code: 'T1B7', name: 'URBAN-T1B7', divisionCode: 'MINI', address: 'terminal 1 b 7' },
  { code: 'T1B5', name: 'PAPI COFFEE-T1B5', divisionCode: 'MINI', address: 'terminal 1 b 5' },
  { code: 'T3G18', name: 'PAPIMART-T3G18', divisionCode: 'MINI', address: 'Terminal 3 gate 18' },
  { code: 'BIM', name: 'PAPIMART-BIM', divisionCode: 'MINI', address: 'Bandara International Minangkabau' },
  { code: 'PDG', name: 'PAPAMAXX COFFEE-PDG', divisionCode: 'MINI', address: 'Bandara International Minangkabau' },

  // FNB (8 real outlets)
  { code: 'T3INT', name: 'BAKSO ZURO-T3INT', divisionCode: 'FNB', address: 'Terminal 3 Internastional bandara soekarno hatta' },
  { code: 'T3ICGK', name: 'MASSURO-T3ICGK', divisionCode: 'FNB', address: 'massuro terminal 3 international soekarno hatta' },
  { code: 'MAX-3I', name: 'MAXIMUM T3-MAX-3I', divisionCode: 'FNB', address: 'maximum kantin T3 Inter' },
  { code: '600', name: 'MAXIMUM -600', divisionCode: 'FNB', address: 'maximum gedung 600' },
  { code: 'T1B', name: 'BAKSO ZURO-T1B', divisionCode: 'FNB', address: 'TERMINAL 1 B' },
  { code: 'BM', name: 'CENTRAL KITCHEN-BM', divisionCode: 'FNB', address: 'bandara mas' },
  { code: 'TUNG', name: 'WAROENG KOPI TUNGTAU-TUNG', divisionCode: 'FNB', address: 'Tung Tau' },
  { code: 'TUNG TAU', name: 'CK PAPAMAX-TUNG TAU', divisionCode: 'FNB', address: 'ck papamax tungtau' },

  // REFL (6 real outlets)
  { code: 'T2FA', name: 'SERENITY BLOSSOMS-T2FA', divisionCode: 'REFL', address: 'TERMINAL 2 F' },
  { code: 'REFT3', name: 'SERENITY BLOSSOM-REFT3', divisionCode: 'REFL', address: 'TERMINAL 3' },
  { code: 'T3CGK', name: 'SERENITY BLOSSOMS-T3CGK', divisionCode: 'REFL', address: 'terminal 3 CGK' },
  { code: 'HLP-G8', name: 'SERENITY BLOSSOM-HLP-G8', divisionCode: 'REFL', address: 'Halim Perdana Kusuma Gate 8' },
  { code: 'HLP-G4', name: 'SERENITY BLOSSOM-HLP-G4', divisionCode: 'REFL', address: 'Halim Perdana Kusuma Gate 4' },
  { code: 'HLP2', name: 'HANS-HLP2', divisionCode: 'REFL', address: 'halim perdanakusuma' },

  // CELL (4 real outlets)
  { code: 'T3IOUT', name: 'POINT CELLULLER-T3IOUT', divisionCode: 'CELL', address: 'point cell terminal 3 soekarno-hatta' },
  { code: '3I', name: 'TSEL-3I', divisionCode: 'CELL', address: 'telkomsel T3 Internasional soekarno hatta' },
  { code: 'DC3I', name: 'DATA CELL-DC3I', divisionCode: 'CELL', address: 'terminal 3 inter arrival' },
  { code: 'T2F1', name: 'DATA CELLULLER-T2F1', divisionCode: 'CELL', address: 'TERMINAL 2 F 1' },

  // MC (1 real outlet)
  { code: 'MCT3-I', name: 'MONEY CHANGER-MCT3-I', divisionCode: 'MC', address: 'Terminal 3 international arrival' },

  // ACC (1 entity)
  { code: 'ACC-001', name: 'Accounting Head Office', divisionCode: 'ACC', address: 'Head Office Finance & Accounting' },
] as const;

export function getRealOutlets(divisionCode?: string): RealOutlet[] {
  if (!divisionCode) {
    return [...REAL_SOBAT_OUTLETS];
  }
  return REAL_SOBAT_OUTLETS.filter((o) => o.divisionCode === divisionCode);
}

/**
 * @deprecated — diganti getRealOutlets. Dipertahankan sebagai fallback kompatibilitas nama lama.
 */
export function getMockOutlets(divisionCode: string): string[] {
  const outlets = getRealOutlets(divisionCode);
  return outlets.map((o) => o.code);
}

