# Penerimaan Harian dan Penyelarasan UI Cellular

Tanggal: 9 Oktober 2026
Status: selesai teknis, UAT pengguna terbuka

## Acuan UI

Divisi Project menjadi acuan bahasa visual lintas ERP: struktur header, KPI, panel, tabel, filter, status badge, empty state, spacing, warna, tema gelap/terang, dan pola tindakan. Isi, route, data, dan kewenangan Cellular tetap mengikuti pekerjaan Cellular.

Pemeriksaan `origin/development` pada 9 Oktober 2026 menunjukkan tidak ada commit baru di atas `REQ`; merge menghasilkan `Already up to date`. Bundle cadangan dibuat sebelum pemeriksaan dan perubahan lokal Project dikembalikan tanpa dimasukkan ke pekerjaan Cellular.

## Workflow Penerimaan Harian

1. Admin memilih outlet, tanggal bisnis, shift, lalu mengisi tunai, QRIS, EDC, transfer, dan referensi laporan.
2. Omzet sistem dihitung dari penjualan Cellular berstatus `posted` pada outlet dan tanggal tersebut.
3. Sistem menghitung selisih kanal pembayaran terhadap omzet sistem.
4. Admin menyimpan draf dan mengajukan paling lambat H+1 pukul 23.59 WIB.
5. Accounting memvalidasi atau meminta koreksi dengan alasan.
6. Manager menyetujui hasil yang sudah divalidasi.

Status: `draft`, `submitted`, `validated`, `approved`, `correction`. Setiap mutasi memakai version check, transaksi database, scope divisi, capability role, serta audit wajib.

## Data UAT

Seeder anonim menambahkan lima produk, saldo stok, 27 transaksi penjualan, dan sembilan tutup shift Oktober 2026. Referensi menggunakan prefiks `UAT-`. Data tersimpan di database dan tidak ditanamkan pada komponen UI.

## Batas saat ini

Penerimaan yang disetujui belum otomatis membuat setoran bank atau jurnal. Tahap berikutnya adalah settlement dan rekonsiliasi, lalu posting jurnal setelah mapping akun disepakati.
