# UI/UX Specifications: Modul Admin Accounting

## 1. Tata Letak Navigasi & Layout Utama (Sidebar)
- Sidebar navigasi yang bersih dan efisien tanpa dekorasi non-fungsional.
- Link menu dikelompokkan berdasarkan fungsionalitas utama divisi Accounting:
  - **Dashboard** (Visualisasi utama & Alerting)
  - **Pemasukan & Ops** (Storan, QR/EDC, Laundry)
  - **Manajemen Persediaan** (Stok, Minuman Gratis, Pasokan)
  - **Audit Kursi & CCTV** (Okupansi & Komparasi)
  - **Kalkulasi Komisi** (Durasi & Perhitungan Gaji)

## 2. Standar Desain Komponen (Anti-Slop & Taste Skill)
- **Dashboard Widgets**: Menggunakan kartu statistik minimalis dengan kontras visual tinggi, font tebal untuk angka nominal, dan label abu-abu halus.
- **Alert Indicator**: Alarm deteksi fraud log CCTV menggunakan border merah statis yang elegan alih-alih animasi kelap-kelip berlebihan.
- **Form Input Sheet Style**: Tampilan form input harian didesain dengan grid yang menyerupai spreadsheet Excel asli untuk mempermudah admin operasional menyalin baris data secara bertahap.
- **Confirmation Modals**: Setiap aksi penting (menyimpan storan shift, menutup buku bulanan) harus memicu modal konfirmasi satu tombol dengan ringkasan data sebelum disimpan ke database.

