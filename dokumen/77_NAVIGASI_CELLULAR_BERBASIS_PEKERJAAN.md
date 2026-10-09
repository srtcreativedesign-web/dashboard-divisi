# Navigasi Cellular Berbasis Pekerjaan

Tanggal: 9 Oktober 2026
Status: selesai

## Perubahan

Menu gabungan **Katalog, Stok & Penjualan** dipecah menjadi halaman kerja yang memiliki URL, judul, deskripsi, dan status aktif sendiri:

- **Dashboard Cellular** (`/cellular`) — ringkasan dan prioritas pekerjaan.
- **Penjualan** (`/cellular/penjualan`) — pencatatan serta daftar penjualan per periode.
- **Katalog Produk** (`/cellular/produk`) — master kartu perdana, provider, kuota, dan aksesori.
- **Stok & Mutasi** (`/cellular/persediaan`) — saldo barang, mutasi, penerimaan, dan koreksi.

URL lama `/cellular/operasional` diarahkan ke Katalog Produk agar bookmark lama tetap berfungsi.

## Kewenangan menu

- Penjualan hanya muncul bagi role dengan `view:cellular_sales`.
- Katalog Produk dan Stok & Mutasi muncul bagi role dengan `view:cellular`.
- Form tambah produk, mutasi stok, pencatatan penjualan, dan pembatalan tetap dikontrol oleh kapabilitas khusus masing-masing.
- Admin Gudang tidak melihat menu Penjualan.
- Role pembaca tidak memperoleh form tulis meskipun dapat membuka Katalog atau Persediaan.

## Konsistensi UI

Navigasi memakai pengelompokan yang sama dengan workspace Project: judul kelompok, ikon per pekerjaan, active state berdasarkan halaman, serta header yang mengikuti konteks halaman. Isi dan kewenangannya tetap khusus Divisi Cellular.
