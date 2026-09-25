# TODO Checklist: Implementasi Modul Admin Accounting

## Fase 1: Persiapan Database & API Contract
- [ ] Buat file migrasi database Laravel untuk 6 tabel sesuai skema di `docs/db-schema-admin-acc.md`.
- [ ] Daftarkan endpoint API baru pada file rute `@dashboard-divisi/contracts`.
- [ ] Daftarkan capability baru (`manage:acc_master`, `approve:acc_period`) di `PolicyService.php`.

## Fase 2: Pengembangan Backend (Laravel API)
- [ ] Bangun model dan logic controller untuk Modul Pemasukan & Ops (`RevenueController`).
- [ ] Bangun logic controller untuk Modul Persediaan & Stok (`InventoryController`).
- [ ] Implementasikan algoritma deteksi fraud untuk Modul Audit CCTV & Kursi.
- [ ] Bangun modul perhitungan otomatis komisi terapis (`CommissionController`).

## Fase 3: Pengembangan Frontend (React + TypeScript)
- [ ] Implementasikan tata letak sidebar dan rute navigasi baru sesuai `docs/ui-spec-admin-acc.md`.
- [ ] Bangun halaman Dashboard utama dengan KPI Cards dan tren analitik.
- [ ] Selesaikan form input spreadsheet untuk Pemasukan, Persediaan, dan Log CCTV.
- [ ] Selesaikan halaman kalkulasi komisi dan ekspor file rekap bulanan.

## Fase 4: Pengujian & Penyelesaian (QA & Launch)
- [ ] Jalankan uji coba fungsionalitas backend mengacu pada skenario di `docs/test-plan-acc.md`.
- [ ] Lakukan verifikasi pemblokiran hak akses lintas divisi (RBAC testing).
- [ ] Lakukan demo fungsional bersama tim Accounting dan serahkan dokumentasi SOP.

