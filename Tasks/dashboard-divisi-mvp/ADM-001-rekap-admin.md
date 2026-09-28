# Task ADM-001: Implementasi Sistem Kerja & Modul Admin (14 Tugas)

*   **ID**: `ADM-001`
*   **Status**: `PENDING`
*   **Prioritas**: `HIGH`
*   **Divisi**: `CROSS-DIVISION (ADMIN ROLE)`
*   **Deskripsi**: Implementasi 14 tugas operasional admin divisi ke dalam backend Laravel dan frontend React.

## Subtask Implementasi

### Bagian 1: Database & Migration (Backend)
- [ ] Buat file migration untuk tabel `leave_records` dan `attendance_realizations` (Modul A)
- [ ] Buat file migration untuk `therapist_shift_revenues` dan `chair_usage_audits` (Modul B)
- [ ] Buat file migration untuk `deposits` dan `stock_cards` (Modul C)
- [ ] Buat file migration untuk `vouchers` (Modul C)
- [ ] Buat file migration untuk `bonus_records` (Modul D)

### Bagian 2: Layanan & Logika Bisnis (Backend)
- [ ] Implementasikan `AdminService` untuk mengolah kalkulasi selisih counter vs POS vs CCTV.
- [ ] Implementasikan formula kalkulasi HBP (COGS) di `StockService` dengan metode Average.
- [ ] Tambahkan validasi capability baru untuk admin divisi di `PolicyService`.

### Bagian 3: Controller & Endpoint API (Backend)
- [ ] Buat `AdminController` dengan endpoint lengkap sesuai API contract:
  - `GET /api/v1/admin/leave-records`
  - `POST /api/v1/admin/attendance-realizations`
  - `POST /api/v1/admin/therapist-revenues`
  - `POST /api/v1/admin/chair-usage-audits`
  - `POST /api/v1/admin/deposits`
  - `POST /api/v1/admin/stock-cards`
  - `POST /api/v1/admin/vouchers`

### Bagian 4: Antarmuka & Integrasi (Frontend)
- [ ] Implementasikan halaman dashboard admin divisi baru per modul (A, B, C, D) di `apps/web`.
- [ ] Integrasikan form upload bukti transfer setoran harian (Modul C).
- [ ] Sediakan tampilan alert / warning restock barang jika sisa stok di bawah batas kritis.
