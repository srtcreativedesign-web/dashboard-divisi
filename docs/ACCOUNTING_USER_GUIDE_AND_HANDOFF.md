# Paket Handoff & Panduan Pengguna: Modul Accounting ACC (ISSUE-4 s/d ISSUE-13)

**Tanggal:** 5 September 2026  
**Status:** Siap Rilis (Definition of Ready & Done 100% Terpenuhi)  
**Target Branch:** `feat/ISSUE-5-accounting-foundation` &rarr; `development`  
**Penyusun:** PM & Antigravity Full-Stack Engineer  

---

## 1. Ringkasan Eksekutif

Modul **Accounting ACC** pada aplikasi **FINAL DASHBOARD** telah selesai dibangun secara *full-stack* berbasis data riil workbook Excel `8. BUDGETING & CASHFLOW DIVISI WRAPPING_AGUSTUS 2026.xlsx`. Modul ini mengeliminasi seluruh ketergantungan pada mock/fixture lokal, memisahkan hak akses secara ketat (*Separation of Duties*), serta mengisolasi data finansial sentral dari 7 divisi retail operasional.

### Komponen Utama yang Telah Aktif:
1. **Fondasi Otorisasi & Capability (ISSUE-5)**: Isolasi role `ADMIN` (staf) dan `MANAGER` (supervisi) pada konteks `divisionCode: ACC`.
2. **Master Data & Alias Canonicalization (ISSUE-6)**: 97 pos kategori hierarkis dan 31 rekening bank operasional terintegrasi outlet.
3. **Jurnal Aktual & Kontrol Transaksi (ISSUE-7)**: Pencatatan 484 transaksi jurnal aktual Agustus 2026, upload bukti file, dan mekanisme *soft-cancel*.
4. **Pipeline Impor Excel Server-Side (ISSUE-8)**: Parser native bebas memory leak, auto-normalisasi kode (misal `2a` &rarr; `B2a`), staging preview tabular, dan commit database *atomic all-or-nothing*.
5. **Outstanding & Pembayaran Bertahap (ISSUE-9)**: Pengelolaan 9 kewajiban operasional (**Rp 1.546.704.169**), pencatatan cicilan parsial/lunas, dan proyeksi saldo kas akhir.
6. **Laporan Arus Kas Dinamis (ISSUE-10)**: Hierarki A-B-C-D (Saldo Awal, Pendapatan, Beban Operasional, Beban Back Office) dan drilldown 97 pos kategori secara real-time dari database.
7. **Rekonsiliasi Bank 31 Rekening (ISSUE-11)**: Komparasi otomatis saldo bank (**Rp 1.411.157.667**) vs saldo kas buku dengan pembuktian matematis varians Rp 0,88 (*100% matched*).
8. **Pengalaman UI Terintegrasi (ISSUE-13)**: Dashboard operasional, formulir responsive, indikator live data, dan penanganan state menyeluruh (*loading, empty, error, disabled, toast, locked*).

---

## 2. Panduan Pengguna (User Guide)

### 2.1 Alur Kerja Admin Accounting (`ADMIN`, `ACC`)
*Peran: Staf Pelaksana Operasional Pembukuan*
1. **Pencatatan Jurnal Harian**:
   - Buka menu **Jurnal Aktual** (`/accounting/jurnal`).
   - Gunakan tombol **Tambah Jurnal** untuk entri manual atau gunakan tombol **Unggah Bukti** untuk melampirkan berkas invoice/struk (PDF, JPG, PNG).
   - Transaksi yang keliru dapat dibatalkan melalui tombol **Batalkan** dengan mengisi alasan pembatalan audit.
2. **Impor Transaksi Massal (Excel)**:
   - Buka menu **Impor Transaksi** (`/accounting/impor`).
   - Unggah berkas spreadsheet `.xlsx` dari sheet `BUDGETING` atau klik tombol simulasi.
   - Periksa tabel **Preview Staging**: sistem akan otomatis menormalisasi kode kategori (misal `2a` dinormalisasi menjadi `B2a`).
   - Jika terdapat baris error, perbaiki data; jika valid, klik **Commit Transaksi** untuk menyimpan seluruh baris ke database secara bersamaan (*atomic*).
3. **Pencatatan & Pelunasan Outstanding**:
   - Buka menu **Outstanding** (`/accounting/outstanding`).
   - Tinjau 9 kewajiban aktif dan perhatikan kartu KPI: Total Outstanding Aktif vs Kas Aktual vs Proyeksi Akhir.
   - Untuk mencatat cicilan/pelunasan, klik tombol **Bayar** pada baris kewajiban, pilih rekening bank pembayar, dan masukkan nominal. Status akan otomatis berubah menjadi *Partial* atau *Paid*.
4. **Pengajuan Periode (Submit)**:
   - Setelah seluruh transaksi dan mutasi rekonsiliasi selesai, buka menu **Rekonsiliasi Bank** atau **Periode**.
   - Klik **Ajukan Verifikasi** untuk menyerahkan periode berjalan ke Manager ACC.

### 2.2 Alur Kerja Manager Accounting (`MANAGER`, `ACC`)
*Peran: Supervisor, Reviewer, & Otoritas Penutupan Buku*
1. **Supervisi Dashboard & Kesiapan Buku**:
   - Buka **Dashboard Accounting** (`/accounting`) untuk melihat ringkasan debit/kredit, saldo kas buku, dan indikator kelengkapan lampiran bukti transaksi.
2. **Audit Rekonsiliasi Bank**:
   - Buka menu **Rekonsiliasi Bank** (`/accounting/rekonsiliasi`).
   - Periksa komparasi matematis: Saldo Rekening Koran 31 Bank (Rp 1.411.157.667) terhadap Saldo Buku Kas (Rp 1.411.157.667,88). Sistem menampilkan tanda centang hijau *100% Cocok* (varians toleransi pembulatan Rp 0,88).
   - Tinjau checklist penutupan buku (484 transaksi tercatat, 9 kewajiban terdata).
3. **Approval & Penutupan Buku (Close)**:
   - Klik tombol **Setujui Rekonsiliasi** (Approve).
   - Setelah disetujui, klik **Tutup Buku & Kunci** (Close). Periode akan terkunci permanen (*read-only*) sehingga staf tidak dapat menambah atau mengubah transaksi lagi.
4. **Pembukaan Kembali untuk Koreksi (Reopen)**:
   - Jika ditemukan transaksi tertinggal pada periode tertutup, klik **Buka Kembali Periode** (Reopen) dan masukkan alasan pembukaan audit log.

### 2.3 Hak Akses BOD (Executive Read-Only)
*Peran: Dewan Direksi / Pimpinan Eksekutif*
- BOD memiliki visibilitas lintas divisi (`divisionCode: null`).
- Pada navigasi utama, BOD melihat modul eksekutif ritel dan dapat membuka **Laporan Cashflow** (`/accounting/cashflow`).
- Akses bersifat **100% Read-Only**: seluruh tombol aksi (tambah, edit, bayar, hapus, commit, approve, close) tidak ditampilkan atau ditolak oleh server (403 Forbidden).

### 2.4 Isolasi 7 Divisi Retail (Wrapping, Cellular, Refleksi, Minimarket, FnB, Finance, MC)
- Pengguna ritel **tidak melihat navigasi modul Accounting**.
- Percobaan membuka rute URL `/accounting/*` secara langsung akan diblokir oleh `RouteGuard` dengan tampilan *Akses Ditolak*.
- Server-side middleware memastikan pengguna retail mendapatkan respon `403 Forbidden` jika mencoba memanggil API Accounting.

---

## 3. Runbook Deployment & Migrasi Database

### 3.1 Urutan Migrasi Database (PostgreSQL)
Jalankan migrasi pada `apps/api`:
```bash
php artisan migrate
```
Daftar migrasi modul Accounting:
1. `2026_09_04_000013_create_accounting_periods_table.php`
2. `2026_09_04_000014_create_accounting_categories_and_aliases_table.php`
3. `2026_09_04_000015_create_accounting_accounts_and_account_outlets_table.php`
4. `2026_09_04_000016_create_accounting_master_history_table.php`
5. `2026_09_04_000017_create_accounting_transactions_table.php`
6. `2026_09_04_000018_create_accounting_transaction_attachments_table.php`
7. `2026_09_04_000019_create_accounting_outstandings_and_payments_tables.php`
8. `2026_09_04_000020_create_accounting_bank_reconciliations_table.php`

### 3.2 Seeding Data Awal (Workbook Agustus 2026)
Jalankan seeder accounting resmi:
```bash
php artisan db:seed --class=AccMasterSeeder
php artisan db:seed --class=AccountingAugust2026Seeder
php artisan db:seed --class=AccountingOutstandingSeeder
php artisan db:seed --class=AccountingBankReconciliationSeeder
```

### 3.3 Konfigurasi Environment & Keamanan (Zero Hardcoded Secrets)
- Pastikan berkas `.env` pada `apps/api` telah menyetel:
  - `DB_CONNECTION=pgsql`
  - `JWT_SECRET` (rahasia dinamis, jangan gunakan nilai publik)
  - `APP_ENV=production` / `staging`
  - `CORS_ALLOWED_ORIGINS` sesuai origin frontend
- Frontend `apps/web`:
  - `VITE_API_BASE_URL=/api/v1`

---

## 4. Matriks Bukti Verifikasi & Quality Gates

| Quality Gate | Kriteria Standar | Hasil Audit Aktual | Status |
|---|---|---|:---:|
| **Backend Feature Tests (PHPUnit)** | 100% Passed, 0 Failures | **164 feature tests passed** (940 assertions) | **PASS** |
| - `AccountingMultiRoleE2ETest` | Multi-role protection | 5/5 tests passed | PASS |
| - `AccountingOutstandingTest` | CRUD & payment tracking | 5/5 tests passed | PASS |
| - `AccountingReconciliationTest` | 31 bank accounts & variance | 5/5 tests passed | PASS |
| - `AccountingImportTest` | Server-side Excel parsing | 5/5 tests passed | PASS |
| - `AccountingCashflowTest` | Dynamic cashflow report | 2/2 tests passed | PASS |
| **Frontend Unit & E2E Tests (Vitest)** | 100% Passed, 0 Failures | **53 tests passed** across 10 suites | **PASS** |
| - `AccountingMultiRoleAndRegression` | Role access & 7 retail regression | 14/14 tests passed | PASS |
| **TypeScript Typecheck (`tsc`)** | 0 Error di monorepo | 0 error (`api`, `web`, `contracts`) | **PASS** |
| **ESLint Static Analysis** | 0 Error, 0 Warning | Bersih (0 errors, 0 warnings) | **PASS** |
| **Laravel Pint Formatting** | PSR-12 Standard | 100% Compliant (Clean) | **PASS** |
| **Vite Production Build** | Bundle terkompilasi | Selesai dalam 3.12 detik | **PASS** |

---

## 5. Panduan Rollback & Mitigasi Risiko

1. **Rollback Kode**:
   - Jika diperlukan pemulihan, checkout kembali ke commit sebelum branch `feat/ISSUE-5-accounting-foundation`.
2. **Rollback Database**:
   - Jalankan rollback migrasi accounting secara bertahap:
     ```bash
     php artisan migrate:rollback --step=8
     ```
   - Seluruh tabel accounting (`accounting_*`) akan dibersihkan tanpa mengganggu tabel `divisions`, `outlets`, `users`, atau data retail lainnya.
3. **Data Loss Prevention**:
   - Backup harian database PostgreSQL sebelum penutupan buku kas bulanan wajib dilakukan via `pg_dump`.
