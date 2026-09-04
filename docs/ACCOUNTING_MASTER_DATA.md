# Master Data Accounting (ISSUE-6) — Dokumentasi

Dokumentasi domain master data Accounting sebagai sumber kebenaran (source of truth) untuk Periode, Kategori, Alias, Rekening, Relasi Outlet, dan Histori Audit. Seluruh struktur telah diselaraskan dengan sheet `PENJELASAN CASHFLOW` dan `BUDGETING` pada workbook resmi divisi.

---

## 1. ERD Domain ISSUE-6

### Tabel Master Data

| Tabel | Keterangan |
|---|---|
| `accounting_periods` | Periode Accounting dengan state machine dan kontrol approval |
| `accounting_categories` | Master 97 kategori transaksi B/C/D resmi workbook |
| `accounting_category_aliases` | Alias normalisasi kode kategori (deterministik & unik) |
| `accounting_accounts` | Master rekening CoA Accounting dengan `display_order` |
| `accounting_account_outlets` | Relasi rekening ↔ outlet ACC dengan status aktif |
| `accounting_master_history` | Histori audit append-only (actor, role, trace_id, sanitasi) |

### Relasi Antar Tabel

```
divisions (ACC) ──1:N── accounting_periods
divisions (ACC) ──1:N── accounting_accounts
divisions (ACC) ──1:N── accounting_account_outlets
outlets (ACC)   ──1:N── accounting_account_outlets
accounting_categories ──1:N── accounting_category_aliases
accounting_categories ──1:N── accounting_accounts
accounting_accounts   ──1:N── accounting_account_outlets
```

---

## 2. Data Dictionary

### `accounting_periods`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | string (UUID) | NO | auto | Primary key |
| `division_id` | string (UUID) | NO | — | FK → `divisions.id` (harus divisi ACC) |
| `period_month` | date | NO | — | Bulan periode (`YYYY-MM-01`) |
| `status` | string | NO | `draft` | `draft`, `pending_approval`, `needs_correction`, `approved`, `closed`, `reopened` |
| `created_by_id` | string (UUID) | YES | — | ID user pembuat (Admin ACC) |
| `updated_by_id` | string (UUID) | YES | — | ID user terakhir update |
| `approved_by_id` | string (UUID) | YES | — | ID user persetujuan (Manager ACC) |
| `closed_by_id` | string (UUID) | YES | — | ID user penutupan (Manager ACC) |
| `approved_at` | timestamp | YES | — | Waktu persetujuan |
| `closed_at` | timestamp | YES | — | Waktu penutupan |
| `notes` | text | YES | — | Catatan transisi / koreksi |
| `version` | integer | NO | 1 | Versi optimistik locking |

- **Unique Constraint**: `UNIQUE (division_id, period_month)`
- **Index**: `(division_id, status)`

---

### `accounting_categories`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | string (UUID) | NO | auto | Primary key |
| `code` | string | NO | — | Kode kanonik workbook (`B2a`, `C14`, `C25`, dsb.) |
| `name` | string | NO | — | Nama resmi kategori dari sheet PENJELASAN CASHFLOW |
| `parent` | string(1) | YES | — | Grup utama: `B`, `C`, atau `D` |
| `display_order` | integer | NO | 0 | Urutan tampilan sesuai urutan di workbook |
| `is_active` | boolean | NO | true | Status aktif kategori |
| `requires_outlet` | boolean | NO | false | Wajib relasi outlet (misal `C25` = PB 1) |
| `effective_from` | timestamp | YES | — | Masa berlaku mulai |
| `effective_to` | timestamp | YES | — | Masa berlaku selesai |
| `version` | string | NO | '1.0' | Versi kategori |
| `created_by_id` | string (UUID) | YES | — | ID user pembuat |
| `updated_by_id` | string (UUID) | YES | — | ID user pengubah |

- **Unique Constraint**: `UNIQUE (code)`
- **Index**: `(parent, display_order)`, `(is_active)`

---

### `accounting_category_aliases`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | string (UUID) | NO | auto | Primary key |
| `alias_code` | string | NO | — | Kode alias mentah (`2a`, `14c`, `25c`, `30c`) |
| `canonical_id` | string (UUID) | NO | — | FK → `accounting_categories.id` (cascade on delete) |
| `normalized_alias` | string | NO | — | Alias ternormalisasi huruf kecil & trimmed (`2a`, `14c`) |
| `created_at` | timestamp | YES | auto | Waktu pembuatan |
| `updated_at` | timestamp | YES | auto | Waktu update |

- **Unique Constraint**: `UNIQUE (normalized_alias)`
- **Index**: `(canonical_id)`

---

### `accounting_accounts`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | string (UUID) | NO | auto | Primary key |
| `code` | string | NO | — | Kode rekening (`ACC-1001`, dsb.) |
| `display_name` | string | NO | — | Nama tampilan rekening |
| `type` | string | NO | — | `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE` |
| `display_order` | integer | NO | 0 | Urutan tampilan daftar rekening |
| `is_active` | boolean | NO | true | Status aktif rekening |
| `division_id` | string (UUID) | NO | — | FK → `divisions.id` (divisi ACC) |
| `category_id` | string (UUID) | YES | — | FK → `accounting_categories.id` (`nullOnDelete`) |
| `description` | text | YES | — | Deskripsi fungsi rekening |
| `effective_from` | timestamp | YES | — | Berlaku mulai |
| `effective_to` | timestamp | YES | — | Berlaku selesai |
| `version` | string | NO | '1.0' | Versi rekening |
| `created_by_id` | string (UUID) | YES | — | ID user pembuat |
| `updated_by_id` | string (UUID) | YES | — | ID user pengubah |

- **Unique Constraint**: `UNIQUE (division_id, code)`
- **Index**: `(division_id, type)`, `(category_id)`

---

### `accounting_account_outlets`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | string (UUID) | NO | auto | Primary key |
| `account_id` | string (UUID) | NO | — | FK → `accounting_accounts.id` (cascade on delete) |
| `outlet_id` | string (UUID) | NO | — | FK → `outlets.id` (cascade on delete) |
| `division_id` | string (UUID) | NO | — | FK → `divisions.id` (divisi ACC) |
| `is_active` | boolean | NO | true | Status aktif relasi outlet |
| `effective_from` | timestamp | YES | — | Berlaku mulai |
| `effective_to` | timestamp | YES | — | Berlaku selesai |
| `created_at` | timestamp | YES | auto | Waktu pembuatan |
| `updated_at` | timestamp | YES | auto | Waktu update |

- **Unique Constraint**: `UNIQUE (account_id, outlet_id)`
- **Index**: `(division_id)`, `(outlet_id)`

---

### `accounting_master_history`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | string (UUID) | NO | auto | Primary key |
| `entity_type` | string | NO | — | `PERIOD`, `CATEGORY`, `ACCOUNT` |
| `entity_id` | string | NO | — | ID entitas yang mengalami perubahan |
| `action` | string | NO | — | `CREATE`, `UPDATE`, `DEACTIVATE` |
| `changes` | json | YES | — | JSON payload field diff: `{ field: [old, new] }` |
| `actor_id` | string (UUID) | YES | — | ID user yang melakukan aksi |
| `actor_email` | string | YES | — | Email user |
| `actor_role` | string | YES | — | Role user (`ADMIN`, `MANAGER`, dsb.) |
| `division_code` | string | YES | 'ACC' | Kode divisi |
| `trace_id` | string(100) | YES | — | Sanitized trace identifier (alphanumeric, max 100) |
| `created_at` | timestamp | YES | auto | Timestamp append-only log |

- **Index**: `(entity_type, entity_id)`, `(trace_id)`, `(created_at)`

---

## 3. State Machine Periode

### Daftar Status Resmi

- `draft`: Periode baru dibuat oleh Admin ACC, data transaksi dapat diisi atau diperbaiki.
- `pending_approval`: Periode diajukan oleh Admin ACC untuk ditinjau oleh Manager ACC.
- `needs_correction`: Dikembalikan oleh Manager ACC untuk perbaikan transaksi oleh Admin ACC.
- `approved`: Disetujui resmi oleh Manager ACC. Laporan final dapat dibaca oleh BOD.
- `closed`: Periode ditutup resmi oleh Manager ACC setelah seluruh audit dan closing tuntas.
- `reopened`: Dibuka kembali secara khusus oleh Manager ACC jika ada pembetulan lanjutan.

### Diagram Transisi & Matriks Wewenang

```
[ draft ] ──(Admin: submit)──> [ pending_approval ] ──(Manager: approve)──> [ approved ] ──(Manager: close)──> [ closed ]
    ▲                                    │                                        │                                   │
    │                              (Manager: koreksi)                       (Manager: koreksi)                   (Manager: reopen)
    │                                    ▼                                        ▼                                   │
    └──(Admin: re-draft)─────── [ needs_correction ] <────────────────────────────┴───────────────────────────────────┘
```

| Dari | Ke | Target Status | Role Berwenang | Catatan |
|---|---|---|---|---|
| `draft` | `pending_approval` | `pending_approval` | Admin ACC | Pengajuan periode untuk approval |
| `pending_approval` | `approved` | `approved` | Manager ACC | Persetujuan periode |
| `pending_approval` | `needs_correction` | `needs_correction` | Manager ACC | Pengembalian untuk koreksi |
| `needs_correction` | `draft` | `draft` | Admin ACC | Reset ke draft untuk perbaikan |
| `approved` | `closed` | `closed` | Manager ACC | Penutupan buku periode |
| `approved` | `needs_correction` | `needs_correction` | Manager ACC | Permintaan koreksi pasca-approve |
| `closed` | `reopened` | `reopened` | Manager ACC | Buka kembali periode tertutup |
| `reopened` | `draft` | `draft` | Manager ACC / Admin ACC | Reset periode yang dibuka kembali |

### Prinsip Keamanan & Fail-Closed

1. Setiap transisi di luar matriks di atas ditolak dengan error `INVALID_STATE_TRANSITION` (HTTP 409).
2. Admin ACC **dilarang** melakukan transisi ke `approved`, `needs_correction`, `closed`, atau `reopened` (`FORBIDDEN_CAPABILITY`, HTTP 403).
3. BOD **dilarang** melihat periode yang berstatus `draft`, `pending_approval`, atau `needs_correction` (`FORBIDDEN_CAPABILITY`, HTTP 403). BOD hanya dapat melihat periode `approved` atau `closed`.

---

## 4. Master 97 Kategori Buku Kas (Workbook Resmi)

Kategori berikut diekstrak langsung dari file resmi `8. BUDGETING & CASHFLOW DIVISI WRAPPING_AGUSTUS 2026.xlsx` (Sheet `PENJELASAN CASHFLOW` & `BUDGETING`):

### Grup B: Pendapatan & Penerimaan (16 Kategori)

| Kode | Nama Kategori | requires_outlet | display_order |
|---|---|---|---|
| `B1` | PENDAPATAN ATAS SALES | Tidak (false) | 1 |
| `B2` | PENDAPATAN JASA MANAGEMENT | Tidak (false) | 2 |
| `B2a` | Processing & Gudang | Tidak (false) | 3 |
| `B2b` | Konsesi | Tidak (false) | 4 |
| `B2c` | Jasa Manajemen | Tidak (false) | 5 |
| `B2d` | Sewa Ruang | Tidak (false) | 6 |
| `B2e` | Surcharge | Tidak (false) | 7 |
| `B2f` | Jampel | Tidak (false) | 8 |
| `B2g` | Utilitas & Kargo | Tidak (false) | 9 |
| `B2h` | Reimbursement | Tidak (false) | 10 |
| `B3` | PENDAPATAN LAIN-LAIN | Tidak (false) | 11 |
| `B3a` | Piutang Antar Departement | Tidak (false) | 12 |
| `B3b` | Pendapatan Bunga Bank | Tidak (false) | 13 |
| `B3c` | Pinjaman dari Departement | Tidak (false) | 14 |
| `B3d` | Pinjaman dari Bank | Tidak (false) | 15 |
| `B3e` | Lain-Lain | Tidak (false) | 16 |

### Grup C: Pengeluaran Operasional / Kas Keluar (58 Kategori)

| Kode | Nama Kategori | requires_outlet | display_order |
|---|---|---|---|
| `C1` | Tagihan PT Angkasa Pura Indonesia | Tidak (false) | 1 |
| `C2` | Tagihan KSO HLP | Tidak (false) | 2 |
| `C3` | Tagihan PT Angkasa Pura Aviasi | Tidak (false) | 3 |
| `C4` | Tagihan Koperasi Jasa Karyawan Angkasa (Kokapura) | Tidak (false) | 4 |
| `C5` | Tagihan Koperasi Satya Ardhia (KSA) | Tidak (false) | 5 |
| `C6` | Tagihan PT Integrasi Aviasi Solusi (Kargo) | Tidak (false) | 6 |
| `C7` | PT Tagihan Trans Aviasi Sinergi (MDC) | Tidak (false) | 7 |
| `C8` | Tagihan Lain-lain | Tidak (false) | 8 |
| `C9` | Franchise Fee | Tidak (false) | 9 |
| `C10` | Royalty Fee | Tidak (false) | 10 |
| `C11` | Komisi | Tidak (false) | 11 |
| `C12` | Pengembalian Dana (Mitra/ Bank) | Tidak (false) | 12 |
| `C13` | Gaji , THR & Insentif Karyawan Lapangan | Tidak (false) | 13 |
| `C13a` | Gaji Karyawan Lapangan | Tidak (false) | 14 |
| `C13b` | Insentif Karyawan Lapangan | Tidak (false) | 15 |
| `C13c` | THR Karyawan Lapangan | Tidak (false) | 16 |
| `C14` | Service Charge Karyawan Lapangan | Tidak (false) | 17 |
| `C15` | Pinjaman | Tidak (false) | 18 |
| `C15a` | Pinjaman Departement | Tidak (false) | 19 |
| `C15b` | Pinjaman Karyawan/ Kasbon | Tidak (false) | 20 |
| `C16` | Pembayaran Angsuran Hutang Leasing | Tidak (false) | 21 |
| `C16a` | Adira Finance | Tidak (false) | 22 |
| `C16b` | Mitsui Leasing | Tidak (false) | 23 |
| `C17` | Pembayaran Angsuran Hutang Bank | Tidak (false) | 24 |
| `C17a` | BRI | Tidak (false) | 25 |
| `C17b` | Mandiri | Tidak (false) | 26 |
| `C17c` | PNM | Tidak (false) | 27 |
| `C17d` | BFI | Tidak (false) | 28 |
| `C18` | Pembayaran Hutang Ke Departement | Tidak (false) | 29 |
| `C19` | Pembayaran Hutang Lain-lain | Tidak (false) | 30 |
| `C20` | Belanja Ke Supplier/Distributor | Tidak (false) | 31 |
| `C21` | Petty Cash | Tidak (false) | 32 |
| `C22` | Biaya Marketing | Tidak (false) | 33 |
| `C22a` | Marketing - Investasi Operasional Tenant | Tidak (false) | 34 |
| `C22b` | Marketing - Investasi Operasional Umum | Tidak (false) | 35 |
| `C22c` | Marketing - Investasi Pra Operasional | Tidak (false) | 36 |
| `C23` | Zakat Maal | Tidak (false) | 37 |
| `C24` | BPJS Ketenagakerjaan & Kesehatan | Tidak (false) | 38 |
| `C25` | PB 1 | Ya (true) | 39 |
| `C26` | Biaya Pajak | Tidak (false) | 40 |
| `C26a` | PPh 21 | Tidak (false) | 41 |
| `C26b` | PPh Unifikasi 23 & 4(2) | Tidak (false) | 42 |
| `C26c` | PPN | Tidak (false) | 43 |
| `C26d` | PPh Ps. 25 | Tidak (false) | 44 |
| `C26e` | PPh Ps. 29 | Tidak (false) | 45 |
| `C26f` | Surat Tagihan Pajak | Tidak (false) | 46 |
| `C27` | Biaya Mess Karyawan | Tidak (false) | 47 |
| `C28` | Biaya Operasional | Tidak (false) | 48 |
| `C29` | Biaya Project & Maintenance | Tidak (false) | 49 |
| `C29a` | Biaya Renovasi | Tidak (false) | 50 |
| `C29b` | Biaya Perbaikan | Tidak (false) | 51 |
| `C29c` | Biaya Gaji Tukang | Tidak (false) | 52 |
| `C30` | Biaya Bank | Tidak (false) | 53 |
| `C31` | Biaya Lain-lain | Tidak (false) | 54 |
| `C32` | Saving | Tidak (false) | 55 |
| `C32a` | THR | Tidak (false) | 56 |
| `C32b` | Gaji Karyawan | Tidak (false) | 57 |
| `C32c` | Bonus | Tidak (false) | 58 |

### Grup D: Pembiayaan, Investasi & Non-Operasional (23 Kategori)

| Kode | Nama Kategori | requires_outlet | display_order |
|---|---|---|---|
| `D1` | Tagihan Virtual Office | Tidak (false) | 1 |
| `D2` | Gaji , THR & Insentif Karyawan | Tidak (false) | 2 |
| `D2a` | Gaji Karyawan Departement | Tidak (false) | 3 |
| `D2b` | Gaji Karyawan Support | Tidak (false) | 4 |
| `D2c` | THR Karyawan Departement | Tidak (false) | 5 |
| `D2d` | THR Karyawan Support | Tidak (false) | 6 |
| `D2e` | Bonus Karyawan Departement | Tidak (false) | 7 |
| `D2f` | Bonus Karyawan Support | Tidak (false) | 8 |
| `D2g` | Insentif Karyawan Departement | Tidak (false) | 9 |
| `D2h` | Insentif Karyawan Support | Tidak (false) | 10 |
| `D3` | Service Charge Karyawan | Tidak (false) | 11 |
| `D4` | Pinjaman | Tidak (false) | 12 |
| `D4a` | Pinjaman Departement/Divisi | Tidak (false) | 13 |
| `D4b` | Pinjaman Karyawan/ Kasbon | Tidak (false) | 14 |
| `D5` | Office Charge | Tidak (false) | 15 |
| `D6` | Prive | Tidak (false) | 16 |
| `D7` | Biaya Mess Karyawan | Tidak (false) | 17 |
| `D8` | Biaya Bank | Tidak (false) | 18 |
| `D9` | Biaya Lain-lain | Tidak (false) | 19 |
| `D10` | Saving | Tidak (false) | 20 |
| `D10a` | THR | Tidak (false) | 21 |
| `D10b` | Gaji Karyawan | Tidak (false) | 22 |
| `D10c` | Bonus | Tidak (false) | 23 |

---

## 5. Resolusi Alias Kategori (Idempotent & Deterministik)

- Kode kanonik disimpan sesuai format kanonik workbook (contoh: `B2a`, `C14`, `C25`, `C30`). Huruf sub-kategori kecil (`a`, `b`, `c`) dipertahankan secara konsisten.
- Alias dasar di-seed secara non-redundan:
  - `B2a` → `2a`
  - `C14` → `14c`
  - `C25` → `25c`
  - `C30` → `30c`
- Mesin resolusi `AccCategoryService::resolve($query)`:
  1. Membersihkan spasi di awal dan akhir (`trim`).
  2. Memeriksa kecocokan langsung case-insensitive terhadap kode kanonik (`B2a`, `b2a`, `B2A` langsung match ke `B2a`).
  3. Memeriksa terhadap tabel `accounting_category_aliases` melalui kolom `normalized_alias` (`strtolower(trim($query))`), sehingga input variatif seperti `' 2A '`, `'2a'`, `' 2a '` semuanya secara deterministik menghasilkan kategori yang tepat tanpa redundansi row.

---

## 6. Matriks Hak Akses & Scope

| Endpoint / Operasi | Admin ACC | Manager ACC | BOD | Divisi Lain (Non-ACC) | Anonymous |
|---|---|---|---|---|---|
| `GET /categories` | ✅ (200) | ✅ (200) | ❌ (403 FORBIDDEN) | ❌ (403 SCOPE_VIOLATION) | ❌ (401) |
| `POST /categories` | ❌ (403) | ✅ (201) | ❌ (403) | ❌ (403) | ❌ (401) |
| `PUT /categories/<built-in function id>` | ❌ (403) | ✅ (200) | ❌ (403) | ❌ (403) | ❌ (401) |
| `POST /categories/<built-in function id>/deactivate` | ❌ (403) | ✅ (200) | ❌ (403) | ❌ (403) | ❌ (401) |
| `GET /accounts` | ✅ (200) | ✅ (200) | ❌ (403 FORBIDDEN) | ❌ (403 SCOPE_VIOLATION) | ❌ (401) |
| `POST /accounts` | ❌ (403) | ✅ (201) | ❌ (403) | ❌ (403) | ❌ (401) |
| `GET /master/history` | ✅ (200) | ✅ (200) | ❌ (403 FORBIDDEN) | ❌ (403 SCOPE_VIOLATION) | ❌ (401) |
| `POST /periods` (buat draft) | ✅ (201) | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (401) |
| `POST /periods/<built-in function id>/transition` (submit) | ✅ (200) | ✅ (200) | ❌ (403) | ❌ (403) | ❌ (401) |
| `POST /periods/<built-in function id>/transition` (approve/close/reopen) | ❌ (403) | ✅ (200) | ❌ (403) | ❌ (403) | ❌ (401) |
| `GET /periods` (semua draft/pending) | ✅ (200) | ✅ (200) | ❌ (Hanya filter approved/closed) | ❌ (403) | ❌ (401) |
| `GET /periods` (approved/closed) | ✅ (200) | ✅ (200) | ✅ (200) | ❌ (403) | ❌ (401) |

---

## 7. Verifikasi & Prosedur Rollback

### Menjalankan Migrasi & Seeder
```bash
# Jalankan migrasi master data
php artisan migrate

# Seed data master accounting (idempotent, dapat dijalankan berulang)
php artisan db:seed --class=AccMasterSeeder
```

### Rollback Aman (Clean Down Migration)
```bash
# Rollback 4 batch migrasi ISSUE-6
php artisan migrate:rollback --step=4

# Jalankan ulang pengujian integritas sistem
php artisan test
```
