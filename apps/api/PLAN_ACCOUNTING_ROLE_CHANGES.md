# Rencana Perubahan Role, Database, dan Flow untuk Modul Accounting

## Latar Belakang
- Fokus awal pada divisi accounting.
- Role saat ini yang relevan: manager, admin, accounting, finance (belum ada di kode, hanya konsep).
- Databases akan diisi per role dan per divisi (row-level filter pada kolom `division_code` dan mungkin `role`).
- Flow yang disetujui: Finance -> Accounting -> Manager.
- Extensibilitas ke divisi lain menggunakan modular monolith Laravel.

## Tujuan
1. Menambahkan role baru `ACCOUNTING` dan `FINANCE` ke sistem.
2. Menetapkan capability yang sesuai untuk masing-masing role berdasarkan input user.
3. Menjamin akses data strict 1:1 per divisi (user hanya bisa lihat/data milik division_code nya).
4. Mengatur alur transaksi agar sesuai dengan flow Finance → Accounting → Manager.
5. Menyiapkan struktur kode agar mudah menambahkan role/divisi lain di masa depan.

## Capability yang Diperlukan
Berdasarkan jawaban user:
- **Role ACCOUNTING**: mengelola PnL, mengelola Outstanding, mengelola neraca (balance sheet).
- **Role FINANCE**: mengelola transaksi, mengelola jurnal besar, laporan.

### Capability yang sudah ada (dari PolicyService.php)
- `view:acc_report` – laporan umum
- `view:acc_journal` – jurnal
- `view:acc_master` – master data (kategori, rekening)
- `manage:acc_master` – mengelola master data
- `manage:acc_period` – mengelola periode
- `approve:acc_period` – menyetujui periode
- `write:acc_transaction` – membuat/mengubah transaksi jurnal
- `import:acc_transaction` – impor transaksi
- `write:acc_outstanding` – membuat/mengubah outstanding
- `write:acc_bank` – rekonsiliasi bank
- `submit:acc_period` – mengajukan periode untuk approval

### Capability baru yang mungkin diperlukan
- `view:acc_pnl` – laporan PnL
- `view:acc_balance_sheet` – neraca
- (opsional) `manage:acc_journal` – jika perlu mengubah jurnal yang sudah dipost (kemungkinan tidak diperlukan karena jurnal biasanya hanya ditambah, tidak diubah)

## Perubahan yang Diperlukan

### 1. `app/Services/PolicyService.php`
- Tambahkan konstanta baru:
  ```php
  public const ACCOUNTING_CAPABILITIES = [
      'view:division',
      'manage:division',
      'view:acc_report',
      'view:acc_journal',
      'view:acc_master',
      'view:acc_pnl',
      'view:acc_balance_sheet',
      'write:acc_outstanding',
      'write:acc_bank',
      'submit:acc_period',
      // ACCOUNTING tidak boleh approve periode (hak manager)
  ];
  public const FINANCE_CAPABILITIES = [
      'view:division',
      // FINANCE bisa lihat laporan dasar
      'view:acc_report',
      'view:acc_journal',
      // FINANCE bisa membuat/mengubah transaksi (draft)
      'write:acc_transaction',
      'import:acc_transaction',
      // FINANCE bisa mengelola outstanding (mis. menandai pembayaran)
      'write:acc_outstanding',
      // TIDAK boleh mengubah master data
      // TIDAK boleh submit/approve periode
  ];
  ```
- Tambahkan penanganan role baru di method `hasCapability`, serupa dengan blok untuk `MANAGER`/`ADMIN` tetapi menggunakan konstanta di atas.
- Pastikan kondisi BOD tetap seperti sekarang (read-only untuk laporan ACC).
- Pastikan wildcard `*` (BOD) tetap memblokir mutasi pada divisi ACC.

### 2. `database/seeders/DatabaseSeeder.php`
- Tambahkan role baru ke array `USERS` dengan contoh email dan division_code yang sesuai:
  - Role `ACCOUNTING` dengan `division_code` => 'ACC'
  - Role `FINANCE` dengan `division_code` => 'FIN'
- Gunakan password hash sama seperti user lain.

### 3. `database/migrations/xxxx_xx_xx_xxxxxx_create_users_table.php` (tidak perlu diubah, kolom `role` dan `division_code` sudah ada)

### 4. Routes
- Jika ditambahkan capability string baru (mis. `view:acc_pnl`, `view:acc_balance_sheet`), tidak perlu mengubah routes karena middleware `capability:` hanya memeriksa string tersebut; cukup pastikan string tersebut digunakan di controller atau blade jika diperlukan.
- Controller yang sudah ada (mis. `AccountingController`) mungkin sudah mengembalikan data PnL dan neraca; jika belum, akan ditambahkan nanti.

### 5. Testing
- Pastikan fitur test yang ada masih berlaku (seperti `AccountingMultiRoleE2ETest.php`).
- Tambahkan test baru jika diperlukan untuk memverifikasi role baru tidak bisa melakukan tindakan yang dilarang.

### 6. Extensibilitas (Modular Monolith)
- Untuk memudahkan penambahan divisi lain di masa depan, pastikan semua query yang terkait accounting menggunakan scoping division secara otomatis (mis. melalui local scope pada model atau middleware `ScopeMiddleware` yang sudah ada).
- Pastikan tidak ada hard-coded division code selain melalui konfigurasi atau seed.

## Alur Transaksi yang Disetujui (Finance → Accounting → Manager)
1. **Finance** membuat jurnal transaksi (status draft) melalui endpoint `POST /accounting/transactions` (menggunakan capability `write:acc_transaction`).
2. **Accounting** meninjau transaksi draft, bisa melakukan perubahan atau menyetel sebagai jurnal resmi (mungkin melalui endpoint `PUT /accounting/transactions/{id}` atau sebuah action "post" yang mengubah status `is_draft` ke false). Role ACCOUNTING memiliki capability `write:acc_transaction` dan juga bisa mengelola outstanding (`write:acc_outstanding`) dan bank (`write:acc_bank`).
3. **Manager ACC** (role MANAGER dengan division_code ACC) memiliki capability `approve:acc_period` untuk menyetujui periode akhir bulan setelah semua transaksi sudah dipost dan outstanding sudah dikonversi. Manager tidak boleh mengubah transaksi individu (tidak ada capability `write:acc_transaction` di MANAGER reguler, kecuali jika MANAGER juga memiliki role ACCOUNTING — hal ini tidak diperbolehkan karena satu user hanya satu role).
4. BOD hanya bisa melihat laporan (`view:acc_report`) dan tidak boleh melakukan apapun yang mengubah data (mutasi diblokir oleh policy).

## Catatan tentang Pembagian Database (Row-Level Filter)
- Saat ini, tabel seperti `accounting_transactions`, `accounting_outstandings`, `accounting_outstanding_payments`, dll. sudah memiliki kolom `division_id` yang merujuk ke tabel `divisions`.
- ScopeMiddleware dan model scope (mis. pada `AccountingTransaction`) seharusnya sudah menambahkan kondisi `where('division_id', auth()->user()->division_id)` secara otomatis.
- Perlukan verifikasi bahwa scoping sudah bekerja untuk kolom `division_id` pada semua tabel accounting.
- Jika belum, ditambahkan local scope pada model masing-masing.

## Langkah Selanjutnya
1. Implementasikan perubahan di PolicyService.php dan DatabaseSeeder.php.
2. Jalankan migrasi dan seeder untuk memastikan role baru dapat dibuat dan memiliki capability yang sesuai.
3. Uji manual dengan login sebagai user baru (accounting dan finance) untuk memastikan mereka hanya bisa melakukan tindakan yang diizinkan.
4. Pastikan tidak ada regresi pada role existing (MANAGER, ADMIN, BOD).
5. Dokumentasikan keputusan di `Decisions/` atau `Lessons/` bila diperlukan.

## Referensi
- CLAUDE.md (petunjuk kerja repo)
- PolicyService.php
- DatabaseSeeder.php
- Routes api.php (bagian accounting)