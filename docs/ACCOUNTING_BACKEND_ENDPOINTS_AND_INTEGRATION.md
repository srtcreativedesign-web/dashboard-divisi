# Dokumentasi Teknis: Endpoint Backend Accounting & Integrasi UI (ISSUE-8, ISSUE-9, ISSUE-10, ISSUE-11)

**Status:** Selesai & Terverifikasi (Definition of Done 100%)  
**Penulis:** PM & Antigravity Full-Stack Engineer  
**Tanggal:** 4 September 2026  
**Scope:** Endpoint Backend Server-Side, Migrasi DB, Seeder Riil Excel, API Client, React Query Hooks, dan Halaman UI Terintegrasi.

---

## 1. Arsitektur & Ringkasan Perubahan

Untuk mengeliminasi ketergantungan UI pada mock/fixture lokal (`accountingExcelData.ts`), seluruh alur bisnis data modul Accounting kini dipindahkan ke backend server-side Laravel dengan persistensi PostgreSQL:

1. **Outstanding Items & Pembayaran Bertahap (`ISSUE-9`, Tahap 5)**:
   - Tabel `accounting_outstandings` dan `accounting_outstanding_payments`.
   - Seeding 9 item kewajiban riil dari sheet `CASHFLOW` senilai **Rp 1.546.704.169**.
   - Endpoint: `GET /api/v1/accounting/outstandings`, `POST /api/v1/accounting/outstandings`, `POST /api/v1/accounting/outstandings/{id}/pay`, `POST /api/v1/accounting/outstandings/{id}/cancel`.
   - Kalkulasi dinamis KPI: Total Outstanding Aktif, Realisasi Pembayaran, Kas Aktual, dan Proyeksi Saldo Kas Akhir.

2. **Rekonsiliasi Bank 31 Rekening (`ISSUE-11`, Tahap 7)**:
   - Tabel `accounting_bank_reconciliations` dengan relasi ke akun kas/bank dan periode.
   - Seeding 31 rekening koran operasional riil dari sheet `SALDO AKHIR BANK` senilai **Rp 1.411.157.667**.
   - Endpoint: `GET /api/v1/accounting/reconciliations`, `POST /api/v1/accounting/reconciliations/submit`, `POST /api/v1/accounting/reconciliations/approve`, `POST /api/v1/accounting/reconciliations/close`, `POST /api/v1/accounting/reconciliations/reopen`.
   - Komparasi matematis: Saldo Bank Rekening Koran vs Saldo Kas Buku Besar, varians pembulatan terverifikasi **Rp 0,88**, status 100% matched.

3. **Pipeline Parser Excel Server-Side (`ISSUE-8`, Tahap 4)**:
   - Service `AccExcelParserService` menggunakan pustaka native PHP (`ZipArchive` & `SimpleXMLElement`) tanpa third-party dependency.
   - Canonicalization otomatis kode kategori (misal `2a`/`2.a` &rarr; `B2a`, `C30. BIAYA BANK...` &rarr; `C30`).
   - Validasi data per baris: tanggal, rekening bank terdaftar, debit/kredit seimbang, deteksi duplikasi intra-batch & database.
   - Endpoint: `POST /api/v1/accounting/import/preview` (staging & audit trail) dan `POST /api/v1/accounting/import/commit` (commit atomic DB transaction all-or-nothing).

4. **Laporan Arus Kas Dinamis (`ISSUE-10`, Tahap 6)**:
   - Service `AccCashflowReportService` mengagregasi 484 transaksi jurnal aktual, rekonsiliasi saldo bank awal & akhir, serta 97 pos kategori.
   - Endpoint: `GET /api/v1/accounting/cashflow/report`.
   - Struktur hierarki A-B-C-D lengkap dengan rincian pendapatan, beban operasional, dan beban back office.

---

## 2. Struktur Database & Migrasi

### 2.1 Tabel `accounting_outstandings`
- `id` (UUID, Primary Key)
- `division_id` (UUID, Foreign Key ke `divisions`)
- `period_id` (UUID, Nullable, Foreign Key ke `accounting_periods`)
- `account_id` (UUID, Nullable, Foreign Key ke `accounting_accounts`)
- `code` (VARCHAR(64), misal `OTS-2026-08-01`)
- `description` (TEXT)
- `category_name` (VARCHAR(128))
- `amount` (BIGINT, Nominal kewajiban awal)
- `paid_amount` (BIGINT, Akumulasi pembayaran)
- `remaining_amount` (BIGINT, Sisa kewajiban aktif)
- `due_date` (DATE)
- `status` (`unpaid`, `partial`, `paid`, `cancelled`)
- `cancelled_at`, `cancellation_reason`
- Timestamps

### 2.2 Tabel `accounting_outstanding_payments`
- `id` (UUID, Primary Key)
- `outstanding_id` (UUID, Foreign Key ke `accounting_outstandings`)
- `account_id` (UUID, Nullable, Foreign Key ke `accounting_accounts`)
- `payment_date` (DATE)
- `amount` (BIGINT)
- `notes` (TEXT)
- Timestamps

### 2.3 Tabel `accounting_bank_reconciliations`
- `id` (UUID, Primary Key)
- `division_id` (UUID, Foreign Key ke `divisions`)
- `period_id` (UUID, Foreign Key ke `accounting_periods`)
- `account_id` (UUID, Nullable, Foreign Key ke `accounting_accounts`)
- `account_number` (VARCHAR(128))
- `account_name` (VARCHAR(255))
- `bank_name` (VARCHAR(64))
- `outlet_name` (VARCHAR(128))
- `number` (INTEGER, Nomor urut sheet Excel)
- `jul_balance` (NUMERIC(18, 2), Saldo Awal per 31 Juli 2026)
- `aug_balance` (NUMERIC(18, 2), Saldo Akhir per 31 Agustus 2026)
- `mutation` (NUMERIC(18, 2), Mutasi saldo)
- `is_verified` (BOOLEAN)
- `verified_at` (TIMESTAMP)
- Timestamps

---

## 3. Integrasi Frontend (`apps/web`)

### 3.1 API Client (`apps/web/src/api/accounting.ts`)
- Interface TypeScript lengkap: `AccOutstandingItem`, `AccOutstandingResponse`, `AccBankItem`, `AccReconciliationResponse`, `AccImportRow`, `AccImportPreviewResponse`, `AccCashflowReportResponse`.
- Fungsi client:
  - `accountingApi.outstandings(params)`
  - `accountingApi.createOutstanding(payload)`
  - `accountingApi.payOutstanding(id, payload)`
  - `accountingApi.cancelOutstanding(id, reason)`
  - `accountingApi.reconciliations(params)`
  - `accountingApi.submitReconciliation(payload)`
  - `accountingApi.approveReconciliation(payload)`
  - `accountingApi.closeReconciliation(payload)`
  - `accountingApi.reopenReconciliation(payload)`
  - `accountingApi.previewImport(payload)`
  - `accountingApi.commitImport(payload)`
  - `accountingApi.cashflowReport(params)`

### 3.2 React Query Hooks (`apps/web/src/hooks/useAccounting.ts`)
- `useAccountingOutstandings()` & `useOutstandingMutations()`
- `useAccountingReconciliations()` & `useReconciliationMutations()`
- `useAccountingCashflowReport()`
- `useImportMutations()`

### 3.3 Halaman UI yang Telah Diperbarui
- `AccountingOutstandingPage.tsx`: Menampilkan KPI dinamis backend, formulir tambah kewajiban, modal pencatatan pembayaran cicilan, filter status, pencarian, dan pembatalan transaksi dengan invalidasi cache otomatis.
- `AccountingReconciliationPage.tsx`: Komparasi 31 rekening koran bank vs saldo buku besar, indikator varians Rp 0,88, checklist audit penutupan buku, dan kontrol transisi status periode (Submit &rarr; Approve &rarr; Close &rarr; Reopen).
- `AccountingImportPage.tsx`: Form upload berkas `.xlsx` atau paste tabular staging, preview normalisasi alias kategori (misal `2a` &rarr; `B2a`), deteksi error & duplikasi, serta tombol commit DB transaction dengan status progres.
- `AccountingCashflowReportPage.tsx`: Hierarki Arus Kas A-B-C-D dinamis dari endpoint backend dengan fallback resilien dan tab visualisasi detail 97 pos kategori.

---

## 4. Bukti Verifikasi & Quality Gates

| Gate | Target / Standar | Hasil | Status |
|---|---|---|:---:|
| **Backend Feature Tests (PHPUnit)** | 100% Passed, 0 Failures | **167 tests passed** (950+ assertions) | **PASS** |
| - `AccountingOutstandingTest` | 5/5 passed | 25 assertions | PASS |
| - `AccountingReconciliationTest` | 5/5 passed | 25 assertions | PASS |
| - `AccountingImportTest` | 5/5 passed | 23 assertions | PASS |
| - `AccountingCashflowTest` | 2/2 passed | 31 assertions | PASS |
| **Frontend Unit Tests (Vitest)** | 100% Passed, 0 Failures | **39 tests passed** across 9 test suites | **PASS** |
| **TypeScript Typecheck (`tsc`)** | 0 error di `@dashboard-divisi/*` | 0 errors (api, web, contracts) | **PASS** |
| **ESLint Static Analysis** | 0 error, 0 warning | 0 errors / warnings | **PASS** |
| **Vite Production Build** | Bundle berhasil tanpa error | dist/assets terkompilasi dalam 3.32s | **PASS** |
| **Database Consistency (PostgreSQL)** | Sesuai Buku Kas Agustus 2026 | 9 Outstandings (Rp 1,54 M), 31 Bank Accounts (Rp 1,41 M), 484 Jurnal Trx | **PASS** |
