# Test Plan: Modul Admin Accounting

## 1. Unit Testing & API Validation (Backend Laravel)
- **Scoping Divisi**: Pastikan setiap query ke tabel `storan_harian`, `stok_barang`, dan `utilisasi_kursi` dipasang scope regional `division_code = "ACC"`.
- **Validasi Transaksi**:
  - `POST /api/accounting/storan`: Harus menolak input jika nominal negatif.
  - `POST /api/accounting/stok`: Validasi bahwa jumlah stok akhir tidak boleh negatif.

## 2. Pengujian Skenario Anti-Fraud (CCTV vs Kursi)
- **Skenario Discrepancy Terdeteksi**:
  - Input: Kursi 3 terisi pada pukul 14:00 (diinput di Okupansi Kursi), namun transaksi Kysoft nihil untuk periode jam tersebut.
  - Ekspektasi Output: Dashboard memunculkan alert kritis "Selisih Kursi #3 Terdeteksi pukul 14:00" dengan warna merah.

## 3. Pengujian Kalkulator Komisi (Payroll Test Cases)
- **Skenario Terapis A**:
  - Data Input: 10 Sesi 30 menit, 5 Sesi 60 menit, 2 Sesi 90 menit. Peran: Crew Leader (Tarif 30m = Rp 2.500).
  - Formula: `(10 * Tarif) + (5 * Tarif) + (2 * Tarif)` dengan penyesuaian durasi.
  - Ekspektasi Output: Nilai total bonus sesuai dengan perhitungan matematika Excel asli.

## 4. Pengujian Keamanan Hak Akses (RBAC & SoD)
- Admin ACC diizinkan melakukan Input & Modifikasi Draft Jurnal (`write:acc_transaction`).
- Admin ACC **tidak diizinkan** melakukan persetujuan penutupan periode (Hanya bisa dilakukan oleh Manager ACC).
- User Divisi Non-ACC diblokir total dari seluruh rute `/api/accounting/*`.

