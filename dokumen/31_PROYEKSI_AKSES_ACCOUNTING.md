# Hak baca ringkasan dan rincian Accounting

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Application Security Engineer, Senior Product Designer dan Senior Fullstack Programmer.

## Aturan awal

Pengguna mengizinkan pekerjaan berlanjut secara mandiri. Karena rincian kebutuhan akses operasional belum tersedia, implementasi memakai pembatasan awal yang konservatif. Ini keputusan teknis sementara; belum merupakan konfirmasi matriks bisnis oleh pemilik proses.

Manager, Admin, Staff Accounting dan Staff Finance pada ACC memiliki `view:acc_detail`. Head Operasional, SPV, Leader dan Admin Gudang pada ACC tetap dapat melihat dashboard ringkasan. Akun Project/Cellular tidak memperoleh akses Accounting dari kesamaan nama role. BOD mempertahankan hak baca lintas divisi yang sudah ada, tanpa hak mutasi, jurnal atau master tambahan.

## Kontrak dan tampilan

GET `/accounting/cashflow/summary` mengikuti `view:acc_report`, dengan hanya period dan tiga KPI: total_revenue, total_expenses, ending_cash_balance. Tidak menyertakan nomor rekening, breakdown transaksi, nominal outstanding atau selisih rekonsiliasi. Daftar periode bagi role ringkasan hanya memuat id, periodMonth dan status, tanpa notes/identitas pembuat/persetujuan.

Daftar metadata `/accounting/reports` bagi role ringkasan hanya memuat id, period, title dan status, tanpa nama/waktu approver atau closer.

Voucher, omzet, outstanding, rekonsiliasi, cashflow lengkap dan detail periode memerlukan `view:acc_detail`. Menu dan route guard mengikuti API; menyembunyikan menu bukan satu-satunya kontrol. Jurnal dan master tetap memakai capability masing-masing. Daftar dan lookup periode dibatasi pada ACC. Parameter cashflow menerima YYYY-MM maupun YYYY-MM-DD; YYYY-MM dinormalisasi menjadi tanggal awal bulan agar query PostgreSQL valid.

Dashboard memakai endpoint summary untuk semua role. Tautan laporan lengkap hanya ditampilkan kepada role detail. Data query dibersihkan setelah login akun lain atau logout berhasil agar data pengguna sebelumnya tidak muncul pada akun berikutnya. Logout gagal tetap menampilkan sesi aktif dengan pesan kegagalan.

## Bukti dan sisa pekerjaan

AccountingReadProjectionTest menguji empat role operasional, empat role keuangan, endpoint terlarang, allowlist field, bulan tidak valid dan objek periode divisi lain. Pengujian UI memeriksa dashboard ringkasan tanpa meminta laporan lengkap; pengujian sesi memeriksa pembersihan cache. Suite backend: 226 tes / 1607 assertions lulus.

Delegasi akses, field Project/Cellular, hak ekspor rinci, dan matriks final pemilik data masih terbuka. Kebijakan status laporan BOD yang sudah ada tidak diubah pada tahap ini. Tidak ada rumus keuangan baru atau periode/transaksi contoh yang dimasukkan ke database operasional.

Smoke server aktif PostgreSQL melalui proxy frontend: 25 akun, 125 pemeriksaan GET lulus, dengan sesi uji terpisah. Role detail membaca daftar kosong; role ringkasan ditolak pada detail; domain lain ditolak pada Accounting. Summary/report yang diizinkan mengembalikan PERIOD_NOT_FOUND karena belum ada periode, bukan angka contoh. Bukti: `C:/ERP/accounting-projection-smoke-2026-10-06.json`. Akun browser pengguna tidak dikeluarkan. Regresi web 77 tes, contracts 2 tes, typecheck/lint/build lulus; warning chunk Cashflow dan anotasi Zod masih ada.

Setelah proyeksi metadata reports ditambahkan, suite backend penuh lulus 226 tes / 1615 assertions. Footer login tidak lagi mengklaim TLS pada lingkungan HTTP lokal.
