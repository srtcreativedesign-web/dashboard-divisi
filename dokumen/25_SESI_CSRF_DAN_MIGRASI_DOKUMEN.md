# Penyelesaian sesi browser, CSRF dan migrasi dokumen

Tanggal: 6 Oktober 2026. Task FND-SEC-SESSION-002. Peran: Application Security Engineer, Senior Fullstack Programmer, Senior Product Designer dan Senior Product Manager.

## Hasil implementasi

Browser memakai access_token melalui cookie HttpOnly, SameSite=Lax, Secure di luar local/testing. Token lama pada localStorage dibersihkan, hasil token login tidak disimpan atau dikirim sebagai Bearer oleh frontend. Kompatibilitas token pada response login dan Bearer untuk klien API dipertahankan; token tidak dicetak ke log/dokumen.

Permintaan mutasi dengan autentikasi cookie membutuhkan X-CSRF-Token. Server membandingkannya dengan HMAC yang terikat pada jti sesi; token sesi lain ditolak. GET /auth/me menyediakan ulang cookie CSRF setelah reload. Login menolak Origin di luar origin aplikasi/request yang diizinkan dan Sec-Fetch-Site cross-site. Local/testing menerima origin frontend loopback port 5173. Production membutuhkan origin/APP_URL dan HTTPS sesuai deployment; tidak membuka origin wildcard.

Transport Bearer diperlakukan sebagai kredensial eksplisit, bukan otomatis dikirim browser. Header x-access-token tambahan tidak membebaskan cookie dari CSRF. Tidak ada perubahan capability atau akses antar-divisi.

Reset password mewajibkan password lama dan password baru 12–128 karakter dengan huruf besar/kecil, angka, simbol. Dalam transaksi row lock, password diganti dan users.session_version dinaikkan. Semua sesi lama ditolak; cookie sesi saat reset dihapus dan pengguna harus login kembali. JWT tanpa sessionVersion hanya kompatibel selama versi akun masih 0.

Pencatatan dan pemeriksaan revoked_tokens tidak lagi menelan kegagalan database. Request protected gagal dengan error generik jika penyimpanan revocation gagal. Logout tidak mengakui sukses sebelum revocation tersimpan. UI tetap menampilkan pengguna dan pesan kegagalan bila logout tidak berhasil.

## Penyimpanan dokumen Project

Generic serving disk local dinonaktifkan; unduh privat tetap melalui endpoint berotorisasi. Command erp:privatize-project-documents tanpa opsi hanya inventaris. Opsi --apply memverifikasi Project/path, menolak traversal/symlink/path di luar root, menjaga tujuan yang berbeda, membuat backup dan checksum SHA-256 serta manifest privat, menyalin/mengecek tujuan, memperbarui metadata dengan row lock, lalu menghapus sumber publik. Kegagalan menghentikan command, sumber tidak dihapus sebelum backup/salinan diverifikasi. Berkas tanpa metadata dipertahankan dan menghasilkan kegagalan agar direkonsiliasi. Rerun mendukung penyelesaian cleanup dan tidak membuat duplikasi pada dokumen yang telah dipindahkan.

Salinan pemulihan: storage/app/private/project_document_migration_backups/{run}/. Retensi backup perlu kebijakan; command tidak menghapus backup otomatis. Manifest/checksum adalah bukti operasional migrasi, bukan pengganti audit bisnis atau malware scanner.

## Penerapan dan pengujian

193/193 tes backend lulus (1336 assertions), 73/73 tes web dan 2/2 tes contracts lulus. Typecheck, lint, build dan formatter scoped selesai. Backend memakai SQLite in-memory; storage migrasi diuji dengan fake disk. Build memiliki peringatan ukuran chunk Cashflow dan anotasi dependensi Zod, tetapi berhasil. Bukti backend: C:/ERP/backend-session-final-2026-10-06.xml.

PostgreSQL native dashboard_divisi_mvp: migrasi session_version berhasil, kini 34 migrasi dan 54 tabel. Kolom default 0; akun/password/data transaksi tidak diganti. Export lampiran hanya metadata schema/policy, tanpa baris bisnis.

Inventaris aktual sebelum/sesudah: 0 project_documents, 0 record dokumen publik, 0 berkas publik project_documents. Command --apply berhasil dengan 0 dokumen; tidak ada file yang perlu dipindahkan atau dihapus pada database MVP saat ini. Ini tidak menyatakan database lama/folder lain sudah diinventaris.

Smoke test server aktif melalui proxy frontend port 5173 dengan akun Admin ACC UAT: login 200 dan HttpOnly, me 200, logout tanpa CSRF 403, logout dengan CSRF 200, sesi lama 401. Credential dibaca dari konfigurasi privat tanpa dicetak. Password reset multi-sesi diuji pada SQLite, bukan mengganti password akun UAT operasional.

## Batas dan pekerjaan berikutnya

TODO-04b dan migrasi/inventaris file pada TODO-04c selesai pada scope teknis ini. Audit kritis lintas workflow, kebijakan retensi/data pribadi, hak baca rinci dan malware scanner tetap terpisah. TODO-05 backup/restore PostgreSQL serta pemisahan migrator/runtime belum selesai. Formula PNL/bonus, CMO dan proses rinci Project/Cellular mengikuti keputusan terbuka; angka/proses belum diketahui tidak dibuat fiktif. Ini bukan sign-off UAT bisnis atau persetujuan produksi.
