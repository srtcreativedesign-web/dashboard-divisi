# Inisialisasi master dan akun MVP

Seeder operasional default kini hanya menyiapkan Accounting (ACC), Project (PROJECT) dan Cellular (CELL), beserta konfigurasi modulnya. Tidak ada pengguna, outlet, saldo, omzet, proyek atau transaksi contoh yang dibuat. Fixture lama dipertahankan khusus lingkungan testing untuk regresi.

Pada 6 Oktober 2026 pengguna mengizinkan implementasi database. MvpMasterSeeder telah dijalankan pada PostgreSQL dashboard_divisi_mvp: tiga divisi dan tiga konfigurasi modul tersedia. Akun dan outlet belum dibuat; command erp:create-user tersedia untuk pengguna yang identitasnya sudah ditentukan. Uji otomatis memakai SQLite in-memory.

Saat aktivasi operasional, dari apps/api jalankan php artisan db:seed. Seeder aman diulang: data/config yang sudah ada tidak ditimpa, dan divisi nonaktif tidak otomatis diaktifkan kembali. Seeder juga tidak menghapus divisi lama jika database sudah terisi.

Untuk membuat pengguna, jalankan melalui terminal lokal interaktif:

php artisan erp:create-user admin@perusahaan.example --name="Admin Accounting" --division=ACC --role=ADMIN

Ganti alamat/nama contoh dengan pengguna yang benar. Password diminta dua kali secara tersembunyi, minimal 12 karakter dengan huruf besar/kecil, angka dan simbol. Password tidak diterima melalui argumen command, tidak dicetak dan hanya hash disimpan. Jangan membagikan password di chat atau commit konfigurasi lokal.

Divisi: ACC, PROJECT, CELL. Role: MANAGER, HEAD_OPS, SPV, LEADER, ADMIN, ADMIN_GUDANG, ACCOUNTING, FINANCE. Nama operasional ACCOUNTING = Staff Accounting; FINANCE = Staff Finance. Role Accounting pusat menggunakan ACC; tidak dibuat divisi Finance terpisah. Hak tiap akun tetap mengikuti policy modul, bukan otomatis lintas divisi.

Perintah menolak email yang sudah ada dan tidak mengubah role/password/scope pengguna lama. Divisi harus aktif; scope satu divisi dibuat bersama akun dalam transaksi. Akses command mengikuti akses administrator terminal/server; perintah ini bukan endpoint publik. Perubahan akun, pengaturan BOD, data outlet perusahaan dan antarmuka manajemen pengguna merupakan pekerjaan terpisah.

Validasi: 31 tes bootstrap/autentikasi/akses MVP/Omzet H+1/dokumen Project lulus (373 assertions). Pengujian mencakup seluruh 24 kombinasi delapan role pada tiga divisi, password hash, scope tunggal, audit tanpa password, pencegahan overwrite serta bootstrap berulang. Formatter scoped selesai. Suite backend legacy memiliki kegagalan yang sudah tercatat sebelumnya; hasil ini tidak menyatakan seluruh suite hijau.
