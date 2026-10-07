# Backup otomatis native lokal

Tanggal: 6 Oktober 2026. Peran: Senior Fullstack Programmer, Application Security Engineer dan Senior Product Manager.

## Jadwal dan hasil

Windows Task `DashboardDivisi-Encrypted-Backup` menjalankan skrip backup ERP yang sudah ada melalui wrapper PowerShell tersembunyi, menggunakan akun Windows saat ini dengan privilege terbatas. Jadwal lokal harian pukul 02.00 WIB dan saat login Windows; eksekusi bersamaan diabaikan. Tidak menggunakan Docker. Task memerlukan sesi pengguna dan PostgreSQL tersedia; laptop mati tidak menjamin jadwal berjalan.

Eksekusi pertama 6 Oktober 2026 pukul 12.20 WIB sukses, LastTaskResult 0. Backup `C:/ERP/backups/dashboard-divisi/2026-10-06T05-20-05-608Z-ff780bb4.erpbackup`: 288966 byte, 54 tabel dan empat berkas privat/config. AES-256-GCM; kunci tidak disertakan di backup. ACL folder membatasi akses. Manifest tidak memuat password/isi berkas.

Restore-check backup tersebut sukses pada database latihan terpisah: 54 tabel/schema/index/constraint/sequence cocok, empat berkas terverifikasi, constraint status Project diuji dan database latihan dibersihkan. Database operasional tidak ditimpa. Laporan berdampingan dengan backup pada `.restore-check.json`.

## Pemantauan

Periksa LastRunTime, LastTaskResult, NextRunTime task dan timestamp manifest terbaru. LastTaskResult 0 saja harus dikaitkan dengan file/manifest baru. Untuk backup manual gunakan `npm run db:backup`; uji pemulihan manual menggunakan `npm run db:restore-check -- <path-backup>`. Jangan menggunakan restore operasional atau migrasi fresh sebagai latihan.

Jika sumber berubah selama snapshot/fingerprint, backup ditolak dan tidak dinyatakan sukses; ulangi saat transaksi lebih tenang. Jika database/secret/binary tidak tersedia, task gagal. Tidak menurunkan hak database atau mengganti kredensial untuk melewati kegagalan.

## Batas produksi

Belum ada offsite, key recovery terpisah atau RPO/RTO bisnis. Jadwal 02.00 adalah keputusan teknis lokal, bukan janji pemulihan 24 jam. Semua backup dipertahankan sampai aturan retensi ditetapkan; tidak ada pembersihan otomatis. Pantau ruang disk dan hasil task. Key pada disk yang sama bukan solusi kehilangan mesin; jangan menyatakan backup ini cukup untuk disaster recovery produksi.

Instalasi task Windows harus diulang pada mesin baru dengan path Node dan akun yang tepat. Task tidak disimpan sebagai secret/kredensial ke repository. Pengujian guard database: tiga tes Node dan 30 pemeriksaan privilege PostgreSQL lulus, tanpa baris transaksi uji.
