# Rekap omzet H+1 — 5 Oktober 2026

Accounting adalah tim pusat: direktori outlet lintas divisi disediakan melalui OrgReadModelService. Rekap berada pada domain ACC; outlet dan divisi sumber disalin dari direktori server, tidak dipercaya dari payload.

Admin menyimpan draf per outlet/tanggal/shift, lalu mengajukan pada H+1, 00.00–23.59.59 WIB. Batas akhir H+1 dikonfirmasi pengguna pada 5 Oktober 2026. Pengajuan terlambat membutuhkan permintaan beralasan dan izin Manager. Izin mengikat rekap, berlaku 24 jam dan sekali pengajuan. Mengubah outlet/tanggal/shift membatalkan izin.

Staff Accounting dapat mengembalikan rekap untuk koreksi atau memvalidasi. Selisih pembayaran maupun AP memerlukan catatan dan persetujuan Manager. Rekap tervalidasi terkunci. Versi dan kunci transaksi mencegah perubahan bersamaan. Riwayat perubahan disimpan dalam transaksi yang sama; AuditService juga mencatat aktivitas.

Status: draft → submitted → validated, atau submitted → pending_approval → validated/correction. Rekap correction dapat diedit dan diajukan ulang dengan aturan H+1 yang sama. Manager hanya memutuskan selisih dan izin, bukan memasukkan atau memeriksa data. BOD dan role pembaca tetap hanya membaca.

Ringkasan bulanan hanya menghitung rekap tervalidasi. Selisih AP adalah perbandingan laporan, belum merupakan keuntungan perusahaan atau jurnal. Validasi belum mengisi jurnal/cashflow/PnL otomatis: pemetaan rekening, kategori, pengakuan pendapatan, dan sumber dokumen belum ditentukan. Unggah bukti, impor Excel omzet, dan koneksi POS merupakan tahap terpisah; halaman tidak menampilkan tombol integrasi yang belum bekerja.

## Hasil verifikasi

83 tes backend modul MVP lulus (413 assertions), termasuk 9 tes alur omzet. Seluruh 62 tes frontend lulus. TypeScript, ESLint, build produksi, pemeriksaan diff, dan pemformatan lima file PHP baru berhasil.

Regresi backend seluruh repository: 196 tes, 130 lulus, 64 gagal, 2 error. Kegagalan mencakup endpoint retail yang sudah dikeluarkan dari MVP, matriks role lama, jumlah divisi lama, dan ekspektasi laporan contoh. Ini tetap terbuka; hasil pengujian modul MVP tidak berarti seluruh suite repository hijau.

Aktivasi skema lokal selesai pada PostgreSQL 18 native, database dashboard_divisi_mvp di 127.0.0.1:5432. Seluruh 32 migrasi berhasil dijalankan, termasuk tiga tabel omzet; koneksi Laravel serta role aplikasi tanpa hak administrator terverifikasi. Database baru masih kosong: data master outlet dan akun Admin, Staff Accounting serta Manager perlu disiapkan sebelum uji operasional halaman /accounting/omzet. Database lama tidak ditimpa, dan seeder legacy tidak dijalankan. Panduan DBeaver: docs/LOCAL_DATABASE.md.
