# Operasional database, backup dan rilis

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Fullstack Programmer + Application Security Engineer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Lingkungan aktual

Project C:/Projects/dashboard-divisi. PostgreSQL native tanpa Docker: host 127.0.0.1, port 5432, database dashboard_divisi_mvp, akun runtime dashboard_divisi_mvp_runtime. DBeaver adalah client pemantauan; server PostgreSQL menyimpan data. Password berada pada konfigurasi privat, bukan dokumen ini.

Backend pengembangan 127.0.0.1:8000; frontend 127.0.0.1:5173 dengan proxy /api/v1. Proses dapat berhenti setelah restart; ini bukan deployment produksi. Referensi: [database lokal](../docs/LOCAL_DATABASE.md), [UI UAT](../docs/UI_UAT.md).

Database lama belum diinventarisasi untuk migrasi; jangan menghapus atau menyimpulkan tidak berguna. Pada baseline awal akun aplikasi adalah owner; kini runtime, migrator dan monitor dipisahkan. Bukti terkini ada pada dokumen 26.

## Pemantauan dan akun uji

Hubungkan DBeaver dengan parameter di atas dan password konfigurasi lokal; gunakan akun read-only untuk pemantauan setelah tersedia. Catat setiap mutasi pengujian. Daftar 25 akun dan password uji berada di apps/api/.env.uat-accounts.md yang diabaikan Git. Dua outlet anonim digunakan untuk UI; tidak ada klaim data omzet produksi. Jangan salin credential ke paket dokumen, log, screenshot atau export.

## Backup dan recovery yang diusulkan

Gunakan pg_dump format custom dan uji pg_restore ke database terpisah. Cadangkan database, berkas privat serta konfigurasi rahasia secara terpisah/terenkripsi. Batasi akses; tetapkan jadwal, retensi, checksum dan catatan versi/waktu. Dump tidak masuk Git. Restore harus memverifikasi data, relasi, nominal dan berkas. Ini rencana, bukan bukti backup berjalan. [PostgreSQL 18 backup](https://www.postgresql.org/docs/18/backup-dump.html).

RPO (kehilangan data ditoleransi) dan RTO (waktu pemulihan) belum dipilih bisnis; tentukan dan ukur latihan restore. Jangan mengubah autentikasi/jaringan global PostgreSQL demi mempermudah koneksi.

## Runbook rilis usulan

1. Catat versi dan kebutuhan diterima; selesaikan blocker dan bukti tes/UAT. Backend terbaru 193/193 tes lulus; gate bisnis/produksi tetap terpisah.
2. Backup dan uji pemulihan, kompatibilitas migrasi serta kapasitas.
3. Pisahkan konfigurasi produksi, akun database, HTTPS, storage privat dan log tanpa secret.
4. Migrasi terkendali, deploy, smoke login/scope/transaksi/file dengan data diizinkan.
5. Pantau error/rekonsiliasi; hentikan penulisan bermasalah dan gunakan rollback yang sudah direview.

Rollback kode tidak otomatis membalik schema/data. Jangan migrate:fresh pada data bisnis. Restore/migrasi destruktif tidak menimpa database lama tanpa keputusan eksplisit dan backup teruji. Runbook produksi ini belum dijalankan.

## Implementasi lokal terkini

[Dokumen 26](26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md) menggantikan status usulan backup/runtime pada baseline ini: backup AES-GCM, restore terisolasi, runtime tanpa DDL dan DBeaver read-only sudah teruji. Jadwal/offsite/retensi/RPO/RTO masih keputusan terbuka; bukan deployment produksi.

## Dependency scanner lokal

ClamAV native beserta database deteksi dipasang pada C:/ERP/tools/clamav; tidak ada Docker/service/port. FreshClam update dan command erp:scan-check mengikuti dokumen 29. Dependency ini berada di luar backup database/private files, sehingga recovery server baru harus memasang/memperbaruinya terpisah. Jadwal update/monitoring dan sisa karantina setelah crash masih terbuka. [Runbook](29_SCANNER_UNGGAHAN_DAN_KARANTINA.md).

## Operasi native otomatis terbaru

Task Windows kini mengerjakan backup terenkripsi pukul 02.00 dan pemeliharaan scanner pukul 02.30 WIB, juga saat login Windows. Kedua task diuji dengan exit 0; restore backup terbaru memverifikasi 54 tabel dan empat berkas tanpa menimpa operasional. [Scanner](30_OPERASI_SCANNER_NATIVE.md) dan [backup](34_BACKUP_OTOMATIS_NATIVE.md). Akun pengguna/logon, mesin menyala, path binary dan database tersedia tetap prasyarat. Retensi/offsite/key recovery dan RPO/RTO produksi belum ditetapkan.
