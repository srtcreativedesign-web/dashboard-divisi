# Backup teruji dan pemisahan role PostgreSQL

Tanggal: 6 Oktober 2026. Task FND-DB-OPS-001 / TODO-05 / BL-04. Peran: Senior Fullstack Programmer + Application Security Engineer; pencatatan sebagai Senior Product Manager.

## Akun dan koneksi aktif

Database native dashboard_divisi_mvp, 127.0.0.1:5432, tanpa Docker. Runtime Laravel kini dashboard_divisi_mvp_runtime: tidak memiliki database/schema/tabel, bukan superuser, tanpa CREATEDB/CREATEROLE/REPLICATION/BYPASSRLS atau membership role lain. Hak DML tersedia untuk operasi aplikasi; migrations hanya baca, audit_events/acc_omzet_events/acc_voucher_events hanya baca/tambah. Tidak memperoleh TRUNCATE atau CREATE schema/tabel.

dashboard_divisi_mvp_app dipertahankan sebagai migrator/owner. Credential runtime aktif tetap di apps/api/.env. Credential migrator/runtime/monitor disimpan pada apps/api/.env.database-roles.json, diabaikan Git dan dibatasi ACL Windows. Tidak ada password dicetak di dokumen/log.

Untuk DBeaver pemantauan, gunakan dashboard_divisi_mvp_readonly pada host/port/database di atas. Password ada pada konfigurasi privat bagian monitor. Akun ini SELECT; users hanya id/name/email/role/division_code/is_active/created_at/updated_at, tanpa password_hash atau session_version. Tidak ada hak mutasi meskipun transaksi read-only diubah ke read-write. Akses data rinci sesuai role ERP tetap kebijakan aplikasi; akun DBeaver adalah akun operasional pemantauan, bukan akun pegawai ERP.

## Runbook lokal

Jalankan dari root proyek C:/Projects/dashboard-divisi dengan Node 22+ dan PostgreSQL 18 native. Path bin default C:/Program Files/PostgreSQL/18/bin; override ERP_PG_BIN jika instalasi berbeda. Target tool dibatasi database MVP, port 5432, loopback dan tanpa URL pengganti. Password tidak menjadi argumen shell.

1. npm run db:backup — membuat backup baru, tidak menimpa arsip lama.
2. npm run db:restore-check -- <path-arsip.erpbackup> — memulihkan ke database latihan baru, membandingkan hasil, lalu membersihkan hanya database latihan setelah nama/pemilik/marker diverifikasi. Tidak menerima database tujuan milik pengguna, tidak menimpa MVP/database lama.
3. npm run db:verify — memeriksa hak runtime/monitor/migrator lewat rollback atau statement nol baris.
4. npm run db:migrate -- status — memeriksa status dengan migrator tanpa mengganti .env runtime.
5. Setelah backup terverifikasi, npm run db:migrate -- apply — migrasi sebagai owner lalu sinkronisasi privilege. Hindari php artisan migrate langsung memakai runtime. Jangan memakai config:cache dengan credential migrator; tool menolak config cache aktif.
6. npm run db:test — tiga tes parser/guard tanpa akses PostgreSQL. npm run db:roles -- apply menyelaraskan role/ACL setelah migrasi; bukan untuk target database lain.

Role/apply dan restore-check membutuhkan autentikasi administrator lokal yang sebelumnya diizinkan; tidak mengubah pg_hba.conf, password postgres atau jaringan global. Tanpa autentikasi, operasi berhenti. Pemisahan role tidak menghapus credential owner lama; akses file privat tetap harus dibatasi.

## Isi dan perlindungan backup

pg_dump custom menyimpan schema/data database. Arsip AES-256-GCM menggabungkannya dengan berkas storage/app/private dan .env, .env.database-roles.json, .env.uat-accounts.md jika ada. Tidak menyertakan kunci enkripsi. Checksum ciphertext dan laporan waktu/jumlah disimpan pada manifest non-rahasia. Hash tiap berkas dan fingerprint data/schema disimpan di dalam arsip terenkripsi. Directory/key dibatasi ACL pengguna saat ini, SYSTEM dan Administrators.

Folder default C:/ERP/backups/dashboard-divisi; ERP_BACKUP_DIR dapat menunjuk direktori khusus kosong/bertanda. Drive root, direktori aplikasi, symlink dan direktori lain yang sudah berisi data ditolak. Kunci: apps/api/.env.backup-key; tidak masuk Git/arsip. Simpan salinan kunci melalui kanal aman di lokasi terpisah sebelum mengandalkan recovery lintas mesin. Restore-check tidak membuat kunci pengganti bila kunci hilang.

Dump sementara plaintext berada dalam folder terbatas dan dibersihkan pada keberhasilan/kegagalan normal. Jika proses/mesin terhenti paksa, periksa *.dump.tmp sebelum menyalin folder. Batas tool MVP: 128 MiB dump/berkas, bundle maksimum 256 MiB, diproses di memory; bukan rancangan backup streaming/PITR produksi. Tidak ada penghapusan arsip/retensi otomatis.

Fingerprint sumber sebelum/sesudah dan inventaris berkas harus stabil; perubahan terdeteksi menggagalkan backup dan perlu percobaan saat tenang. Ini bukan transaksi atomik lintas PostgreSQL/filesystem. Backup dengan upload/transaksi sibuk membutuhkan prosedur maintenance/snapshot khusus. pg_dump memberi snapshot konsisten satu database; cluster roles tidak di-dump, pemulihan role memakai konfigurasi/runbook terpisah. [pg_dump PostgreSQL 18](https://www.postgresql.org/docs/18/app-pgdump.html).

## Bukti aktual

Backup sebelum perubahan role berhasil direstore; backup setelah perubahan role: 2026-10-06T03-12-33-086Z-1031c663.erpbackup, 272292 byte, SHA-256 82cefef7c7e383c64160af9b1205ac18113b5f461b19bebda8cbae4b88a1c984. Backup 13783 ms; restore final 7517 ms. Gunakan arsip yang memiliki laporan restore-check berhasil; arsip percobaan awal tanpa laporan keberhasilan tidak menjadi acuan recovery. Ini durasi latihan, bukan janji RTO/RPO bisnis.

Isi seluruh 54 tabel dibandingkan dengan jumlah dan digest semua baris terurut; kolom/default/presisi, index, constraint dan last_value/is_called sequence juga diperiksa. Empat berkas privat/konfigurasi diverifikasi setelah dekripsi dan penulisan ke berkas uji terbatas, tanpa menimpa konfigurasi aktif. Database latihan dashboard_divisi_mvp_restore_44a783fd dibersihkan; source tidak ditimpa. Laporan: arsip.restore-check.json.

PostgreSQL menulis ulang cast varchar/text pada CHECK status Project. Fingerprint menormalisasi cast khusus constraint tersebut dan nama otomatis NOT NULL; nama/definisi constraint lain tetap diperiksa. Status planning/in_progress/on_hold/completed diterima dan invalid_status ditolak pada source serta restore melalui tabel TEMP tanpa default sequence; data dan sequence sumber tidak berubah. Daftar nilai bukan diabaikan.

28 pemeriksaan privilege lulus dengan 0 baris uji tersimpan. Tiga tes parser/guard lulus. Backup yang ciphertext-nya dimodifikasi ditolak sebelum database dibuat. Smoke server melalui frontend proxy: login/me 200, logout tanpa CSRF 403, dengan CSRF 200, sesi ter-revoke 401. Migrator status berhasil. Akun ERP UAT/password tidak diganti.

## Batas penyelesaian

TODO-05 selesai untuk alat dan konfigurasi lokal MVP serta latihan restore ini. Jadwal/retensi/offsite, salinan key lintas perangkat, target RPO/RTO dan recovery server baru tetap keputusan operasional produksi, belum diklaim aktif. Tidak ada scheduler baru dibuat. Dump tidak otomatis mencakup storage publik lama atau database lama. File Project publik MVP sudah kosong menurut task sebelumnya.

Hak objek PostgreSQL dipisahkan dari ownership sesuai [dokumentasi privilege](https://www.postgresql.org/docs/18/ddl-priv.html). Restore latihan memakai --no-owner/--no-acl agar validasi data terpisah dari provisioning role; [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html). Ini bukan UAT bisnis atau persetujuan produksi.

## Perluasan 6 Oktober 2026

Native kini 59 tabel/36 migrasi; 34 pemeriksaan privilege lulus. Ledger cel_stock_movements dan metadata acc_voucher_attachments append-only bagi runtime. Backup/restore fingerprint versi 2 membandingkan constraint dengan normalisasi cast literal array text yang setara, tanpa mengabaikan nilai/operator/tipe numerik. Empat tes guard/normalisasi lulus; backup baru 59 tabel/empat berkas dan backup lama versi 1 54 tabel/empat berkas berhasil diperiksa pada database terpisah. Bukti lengkap pada dokumen 40.
