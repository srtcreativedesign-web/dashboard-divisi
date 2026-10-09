# Arsitektur Workspace ERP Cellular

Tanggal: 9 Oktober 2026
Status: implementasi tahap fondasi

## Masalah yang diperbaiki

Cellular sebelumnya hanya menampilkan dashboard, penjualan, katalog, dan stok. Struktur itu membantu pencatatan dasar, tetapi belum mengikuti siklus kerja ERP dari transaksi sumber sampai pemeriksaan, pembukuan, dan analitik.

## Arsitektur informasi

1. **Pekerjaan Saya** — pusat kendali dan antrean pengecualian sesuai role.
2. **Penerimaan Harian** — transaksi penjualan dan rekap per tanggal bisnis.
3. **Tagihan & Pembayaran** — kontrol kesiapan pembelian, invoice supplier, dan settlement kanal pembayaran.
4. **Pembukuan** — buku persediaan dan jejak transaksi sebagai sumber rekonsiliasi.
5. **Laporan & Analitik** — omzet, unit, performa outlet, produk, dan kesehatan stok.
6. **Operasional Pendukung** — master produk, paket, stok, dan mutasi.
7. **Data & Integrasi** — input manual, spreadsheet operasional, ECSYS, staging, dan rekonsiliasi.

## Prinsip implementasi

- Angka hanya berasal dari API dan database aktual.
- Fitur yang kontrak backend-nya belum tersedia ditandai sebagai kontrol kesiapan dan tidak membuat transaksi semu.
- Menu dan route tetap dibatasi capability.
- Pencatatan baru wajib memiliki validasi, idempotency, histori status, audit aktor, serta isolasi divisi.
- Nilai HPP, PNL, settlement, dan jurnal otomatis belum dinyatakan selesai karena kebijakan perhitungannya belum ditetapkan.

## Tahap lanjutan

Backend berikutnya membutuhkan entitas tutup shift, kanal penerimaan, settlement, invoice supplier, penerimaan barang, pemetaan akun, batch impor, dan rekonsiliasi. Setiap entitas harus memiliki status workflow, pemilik tindakan, versi optimistic locking, dan event history.
