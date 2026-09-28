# Task ADM-001: Implementasi Sistem Kerja & Modul Admin (14 Tugas)

*   **ID**: `ADM-001`
*   **Status**: `DONE`
*   **Prioritas**: `HIGH`
*   **Divisi**: `CROSS-DIVISION (ADMIN ROLE)`
*   **Deskripsi**: Digitasi dan implementasi end-to-end 14 tugas operasional admin divisi ke dalam backend Laravel dan frontend React.

## Subtask Implementasi

### Bagian 1: Database & Migration (Backend)
- [x] Buat file migration/skema untuk tabel `leave_records` dan `attendance_realizations` (Modul A - HRM)
- [x] Buat file migration/skema untuk `therapist_revenues` dan `acc_utilisasi_kursi` / `chair_usage_audits` (Modul B - POS)
- [x] Buat file migration/skema untuk `acc_storan_harian` (`deposits`) dan `acc_stok_opname` (`stock_cards`) (Modul C - Finance)
- [x] Buat file migration/skema untuk `admin_vouchers` (`vouchers`) (Modul C - Finance)
- [x] Buat file migration/skema untuk `acc_rekap_komisi` (`bonus_records`) (Modul D - Payroll)

### Bagian 2: Layanan & Logika Bisnis (Backend)
- [x] Implementasikan logika di `AdminController` untuk mengolah kalkulasi selisih counter vs POS vs CCTV.
- [x] Implementasikan formula kalkulasi HBP (COGS) & gross margin PnL support data.
- [x] Tambahkan validasi capability dan division scope di `routes/api.php` dan `PolicyService`.

### Bagian 3: Controller & Endpoint API (Backend)
- [x] Buat `AdminController` dengan endpoint lengkap sesuai API contract:
  - `GET / POST / PATCH /api/v1/admin/leaves`
  - `GET / POST / PATCH /api/v1/admin/attendance-realizations`
  - `POST /api/v1/admin/therapist-revenues`
  - `POST /api/v1/admin/chair-usage-audits`
  - `GET / POST /api/v1/admin/deposits`
  - `GET / POST /api/v1/admin/stock-cards`
  - `POST /api/v1/admin/vouchers`
  - `GET / POST /api/v1/admin/cashless`
  - `GET / POST /api/v1/admin/laundry`
  - `GET /api/v1/admin/pnl-support`
  - `GET / POST /api/v1/admin/bonus-records`

### Bagian 4: Antarmuka & Integrasi (Frontend)
- [x] Implementasikan halaman dashboard admin divisi baru per modul (Finance, POS, HRM, Payroll) di `DivisionAdminPage.tsx`.
- [x] Integrasikan form & tabel interaktif dengan status badge, ringkasan kalkulator, serta tombol aksi persetujuan.
- [x] Sediakan komponen ringkasan estimasi margin kotor dan kalkulasi bonus terapis berjenjang.
