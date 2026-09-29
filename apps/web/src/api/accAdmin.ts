/**
 * API module: Acc Admin Operasional (storan, cashless, laundry, stok, utilisasi kursi, komisi)
 */
import { api } from './client';

// ── Types ──────────────────────────────────────────────────────────────
export interface AccDashboardKpis {
  total_omset: number;
  okupansi: number;
  total_pengeluaran: number;
  estimasi_profit: number;
}

export interface AccDashboardAlert {
  type: 'danger' | 'warning';
  message: string;
}

export interface AccDashboardData {
  kpis: AccDashboardKpis;
  alerts: AccDashboardAlert[];
}

export interface AccStoran {
  id: number;
  tanggal: string;
  shift: number;
  pendapatan_tunai: number;
  no_kysoft_sales: string | null;
  division_code: string;
}

export interface AccCashless {
  id: number;
  tanggal: string;
  shift: number;
  nominal_qris: number;
  nominal_edc: number;
  no_storan_finance: string | null;
  division_code: string;
}

export interface AccLaundry {
  id: number;
  tanggal: string;
  berat_kg: number;
  harga_per_kg: number;
  total_tagihan: number;
  division_code: string;
}

export interface AccStokOpname {
  id: number;
  tanggal: string;
  barang_nama: string;
  stok_awal: number;
  barang_datang: number;
  pemakaian: number;
  stok_akhir: number;
  division_code: string;
}

export interface AccUtilisasiKursi {
  id: number;
  tanggal: string;
  no_kursi: number;
  jam_mulai: string | null;
  jam_selesai: string | null;
  durasi_menit: number;
  terapis_nama: string | null;
  utilisasi_cctv: boolean;
  division_code: string;
}

export interface AccRekapKomisi {
  id: number;
  periode_awal: string;
  periode_akhir: string;
  karyawan_nama: string;
  sesi_30m: number;
  sesi_60m: number;
  sesi_90m: number;
  total_bonus: number;
  division_code: string;
}

// ── Payloads ───────────────────────────────────────────────────────────
export type StoranPayload = Pick<AccStoran, 'tanggal' | 'shift' | 'pendapatan_tunai' | 'no_kysoft_sales'>;
export type CashlessPayload = Pick<AccCashless, 'tanggal' | 'shift' | 'nominal_qris' | 'nominal_edc' | 'no_storan_finance'>;
export type LaundryPayload = Pick<AccLaundry, 'tanggal' | 'berat_kg' | 'harga_per_kg'>;
export type StokPayload = Pick<AccStokOpname, 'tanggal' | 'barang_nama' | 'stok_awal' | 'barang_datang' | 'pemakaian'>;
export type UtilisasiPayload = Pick<AccUtilisasiKursi, 'tanggal' | 'no_kursi' | 'jam_mulai' | 'jam_selesai' | 'durasi_menit' | 'terapis_nama' | 'utilisasi_cctv'>;
export type KomisiPayload = Pick<AccRekapKomisi, 'periode_awal' | 'periode_akhir' | 'karyawan_nama' | 'sesi_30m' | 'sesi_60m' | 'sesi_90m'>;

// ── API ────────────────────────────────────────────────────────────────
export const accAdminApi = {
  dashboard: () => api.get<AccDashboardData>('/acc-admin/dashboard'),

  getStoran: () => api.get<AccStoran[]>('/acc-admin/storan'),
  saveStoran: (p: StoranPayload) => api.post<AccStoran>('/acc-admin/storan', p),

  getCashless: () => api.get<AccCashless[]>('/acc-admin/cashless'),
  saveCashless: (p: CashlessPayload) => api.post<AccCashless>('/acc-admin/cashless', p),

  getLaundry: () => api.get<AccLaundry[]>('/acc-admin/laundry'),
  saveLaundry: (p: LaundryPayload) => api.post<AccLaundry>('/acc-admin/laundry', p),

  getStok: () => api.get<AccStokOpname[]>('/acc-admin/stok'),
  saveStok: (p: StokPayload) => api.post<AccStokOpname>('/acc-admin/stok', p),

  getUtilisasi: () => api.get<AccUtilisasiKursi[]>('/acc-admin/utilisasi'),
  saveUtilisasi: (p: UtilisasiPayload) => api.post<AccUtilisasiKursi>('/acc-admin/utilisasi', p),

  getKomisi: () => api.get<AccRekapKomisi[]>('/acc-admin/komisi'),
  hitungKomisi: (p: KomisiPayload) => api.post<AccRekapKomisi>('/acc-admin/komisi', p),
};
