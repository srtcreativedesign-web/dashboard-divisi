# Database lokal tanpa Docker

ERP menggunakan PostgreSQL 18 yang terpasang di Windows. DBeaver adalah klien pengelola database; ERP mengakses PostgreSQL secara langsung.

## Koneksi aktif (terverifikasi 5 Oktober 2026)

- Host: 127.0.0.1
- Port: 5432
- Database: dashboard_divisi_mvp
- Username untuk DBeaver: dashboard_divisi_mvp_readonly
- Password DBeaver: konfigurasi privat apps/api/.env.database-roles.json, bagian monitor; jangan masukkan ke chat atau Git.
- ERP memakai dashboard_divisi_mvp_runtime dengan credential pada apps/api/.env.

Di DBeaver, pilih New Database Connection → PostgreSQL, isi koneksi di atas dan password dari konfigurasi lokal, lalu Test Connection. Akun runtime bukan pemilik database/schema dan tidak menjalankan migrasi; tidak memiliki SUPERUSER, CREATEDB, CREATEROLE atau REPLICATION. Hak PUBLIC pada database baru dicabut. Gunakan dashboard_divisi_mvp_readonly untuk pemantauan DBeaver; password pada .env.database-roles.json bagian monitor. Owner/migrator tetap dashboard_divisi_mvp_app.

Database baru dibuat setelah pengguna mengizinkan penggunaan administrator postgres lokal serta pembuatan database baru. Database dan role lama tidak ditimpa atau dihapus. Konfigurasi .env sebelumnya dicadangkan ke .env.database-backup-*; kredensial provisioning berada di .env.database-provisioning-*. Semua berkas tersebut diabaikan Git.

Seluruh 34 migrasi berhasil dijalankan melalui akun aplikasi, termasuk tabel Accounting Omzet H+1, voucher, Project dan Cellular. Pada 6 Oktober 2026 master ACC, CELL dan PROJECT beserta tiga konfigurasi modul telah diinisialisasi. Koneksi Laravel, hak role, presisi nominal voucher dan constraint duplikat PostgreSQL diverifikasi; data pemeriksaan di-rollback. Database berisi 25 akun anonim UAT dan dua outlet uji; akun perusahaan/transaksi produksi belum disiapkan. Uji UI memakai akun/outlet anonim; aktivasi perusahaan memerlukan data operasional. Seeder legacy tidak dijalankan karena mencakup data dan modul di luar MVP.

## Perawatan

Dari apps/api, jalankan php artisan config:clear jika konfigurasi berubah, php artisan migrate:status untuk memeriksa skema, dan npm run db:migrate -- apply dari root untuk migrasi berikutnya menggunakan credential migrator. Jangan menjalankan migrate:fresh atau seeder contoh pada database berisi data kerja.

DATABASE_URL atau DB_URL mengesampingkan DB_* menurut config/database.php. Variabel URL aktif telah dihapus dari .env agar menggunakan konfigurasi DB_* native. Contoh non-rahasia ada di .env.example; salinan contoh tidak membawa password atau menggantikan konfigurasi aktif.

Pada 6 Oktober 2026, atas permintaan pengguna untuk mencoba login/UI, ditambahkan 25 akun anonim UAT dan dua outlet Uji UI. Kredensial berada pada apps/api/.env.uat-accounts.md. Akun operasional perusahaan tetap belum ditetapkan. Panduan pengujian: docs/UI_UAT.md.

## Backup dan akun database — 6 Oktober 2026

Backup terenkripsi dan restore-check terisolasi teruji. Tiga role memiliki credential privat terpisah dan hak runtime/read-only diverifikasi. Runbook/perintah/batas: [dokumen 26](../dokumen/26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md). Jangan memakai akun migrator untuk pemantauan rutin.
