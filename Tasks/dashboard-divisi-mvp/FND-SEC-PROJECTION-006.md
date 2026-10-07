# FND-SEC-PROJECTION-006 — Detail dan ringkasan Accounting

Status: selesai teknis; matriks bisnis final tetap terbuka.

Peran: Senior Product Manager, Application Security Engineer, Senior Product Designer dan Senior Fullstack Programmer.

Capability detail terpisah dari laporan agregat. Empat role operasional menerima tiga KPI dan proyeksi periode minimal. Menu/route/API mengikuti pembatasan. Cache query dibersihkan setelah pergantian login dan logout berhasil. Periode lintas divisi ditolak; filter bulan UI valid di PostgreSQL.

Bukti: 226 backend / 1615 assertions setelah proyeksi metadata laporan, 77 web, 2 contracts dan 3 tes operasi scanner lulus; typecheck/lint/build lulus. Build masih memiliki peringatan ukuran chunk Cashflow dan anotasi dependensi Zod. Smoke 25 akun/125 GET lulus. Klaim TLS pada footer login lokal HTTP dihapus; teks berfokus pada kewenangan akun. Acuan: dokumen/31_PROYEKSI_AKSES_ACCOUNTING.md. Tidak ada schema atau transaksi bisnis contoh yang ditambahkan.
