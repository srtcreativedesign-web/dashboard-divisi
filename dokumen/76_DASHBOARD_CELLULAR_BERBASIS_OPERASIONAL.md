# Dashboard Cellular Berbasis Operasional

Tanggal: 9 Oktober 2026  
Status: selesai

## Masalah yang diperbaiki

Dashboard Cellular sebelumnya hanya menampilkan jumlah outlet, model persediaan, dan direktori outlet. Halaman tersebut belum membantu pengguna memahami kondisi penjualan, stok, atau pekerjaan yang perlu dilakukan.

## Dashboard baru

Dashboard sekarang menyatukan data aktual dari katalog, outlet, saldo stok, mutasi, dan penjualan manual menjadi:

- meja kerja yang menyesuaikan role pengguna;
- omzet dan unit terjual pada periode yang dipilih;
- jumlah saldo stok serta item dengan saldo lima unit atau kurang;
- tren omzet harian;
- performa outlet berdasarkan omzet posted;
- daftar stok kritis;
- aktivitas stok terbaru;
- komposisi kartu perdana dan aksesori untuk role tanpa akses data penjualan;
- pintasan ke pekerjaan operasional.

Tidak ada angka transaksi yang di-hardcode. Keadaan kosong ditampilkan ketika database belum mempunyai transaksi atau saldo.

## Perilaku sesuai kewenangan

- **Manager**: melihat omzet, performa outlet, stok kritis, dan kontrol operasional.
- **Admin**: melihat penjualan serta diarahkan ke pencatatan transaksi manual.
- **Admin Gudang**: melihat persediaan dan diarahkan ke pencatatan mutasi stok.
- **Accounting/Finance dalam domain Cellular**: membaca ringkasan penjualan sesuai kapabilitas untuk pemeriksaan berikutnya.
- **SPV/Leader/Head Operasional**: membaca ringkasan katalog, outlet, stok, dan aktivitas tanpa meminta endpoint penjualan yang tidak dimiliki.

## Batas data

Dashboard mengikuti batas endpoint operasional saat ini: maksimal 500 produk/saldo, 100 mutasi terbaru, dan 100 penjualan terbaru dalam bulan terpilih. Angka dashboard harus dibaca sebagai ringkasan data yang dimuat sampai endpoint agregasi khusus tersedia.

## Verifikasi

- Pengujian tampilan berbasis data aktual, role tanpa akses penjualan, dan keadaan gagal API.
- TypeScript, lint, regresi operasional Cellular, serta build produksi dijalankan sebelum commit ke branch `REQ`.
- Pemeriksaan visual dilakukan langsung pada halaman `/cellular` dalam mode gelap.

