# Ruang kerja Admin dan Staff Accounting

8 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Masalah dan keputusan

Preview spreadsheet menempatkan format file sebagai pusat kegiatan, padahal pengguna perlu menyelesaikan pengajuan dan pemeriksaan. Ruang kerja utama Admin/Staff Accounting harus menampilkan pekerjaan berdasarkan status, outlet, periode, alasan koreksi dan tindakan berikutnya. Parser menjadi fasilitas pemeriksaan sumber pendukung.

## Implementasi tahap ini

Gunakan transaksi omzet dan voucher yang sudah persisten beserta alur role existing. Halaman utama Accounting untuk Admin dan Staff Accounting membuka ruang kerja; dashboard pemantauan tetap tersedia. Manager tetap membuka dashboard dan dapat mengakses antrean persetujuan melalui ruang kerja. Tidak menambah kewenangan server.

Admin: koreksi dan draf → lengkapi → ajukan. Staff Accounting: pengajuan → periksa rincian/bukti → validasi atau kembalikan. Manager: keputusan selisih/persetujuan. Antrean dipilih menurut capability, bukan semua orang diberikan tombol yang sama. Arsip memungkinkan penelusuran status lainnya. Count memakai total server sesuai bulan/outlet, bukan panjang halaman. Daftar berpaginasi; kegagalan request tidak ditampilkan sebagai nol. Tanggal omzet dan jatuh tempo voucher tidak disamakan.

Tombol pekerjaan membuka detail transaksi yang sama, bukan meminta pengguna mencarinya ulang. Form baru tetap menyimpan draf lewat API existing. Setoran, pencocokan setoran, cuti/absensi dan laporan tetap menggunakan modul yang sudah tersedia. Impor sumber muncul sebagai fasilitas tambahan. Formula/hash tidak menjadi bagian utama pekerjaan.

## Acceptance dan todo

- [x] Ruang kerja Admin/Staff Accounting terhubung ke data PostgreSQL melalui API existing.
- [x] Antrean omzet/voucher, bulan/outlet/status dan pagination; loading/error/empty terpisah.
- [x] Tindakan detail sesuai role, alasan koreksi, deadline H+1 dan identitas versi jelas.
- [x] Navigasi utama dan fasilitas sumber tidak membingungkan.
- [x] Test role, filter, pagination, error dan deep-link; typecheck/build serta inspeksi browser.
- [x] Commit/push REQ tanpa PR setelah verifikasi.

Tidak mengklaim ERP lengkap: laporan yang belum masuk memerlukan jadwal outlet/shift aktif; staging file persisten, rekonsiliasi Ecsys, stok/wallet dan laporan tenant belum ditutup melalui perubahan layar ini. Tidak mengimpor data riil otomatis atau menetapkan kebijakan fee/HPP/bonus/CMO.

Backup source sebelum perubahan: C:/ERP/backups/pre-cellular-2026-10-08T01-40-48-785Z/source.snapshot.aes. Snapshot terenkripsi, Git bundle dan hash dekripsi terverifikasi. Tidak ada perubahan skema/transaksi database pada tahap UI ini; backup database terverifikasi sebelumnya tetap tersedia.

## Hasil dan batas verifikasi

Rute /accounting/pekerjaan serta beranda /accounting untuk Admin/ACCOUNTING ACC. Dashboard pemantauan tetap /accounting/dashboard. UI memakai query omzet/voucher/outlet existing; tidak membuat fixture keuangan hardcode, migrasi, seed atau transaksi bisnis native. API tetap menjadi penegak izin. Membuka create lewat new=1 tidak memberikan izin baru; UUID detail divalidasi sebelum request. Mutation existing menginvalidasi antrean baru. Count memakai total server, query gagal tidak disamarkan menjadi nol; filter disimpan dalam URL agar browser Back mempertahankan konteks.

Regresi frontend lengkap: 176 test/40 file lulus. Setelah perbaikan URL dan tahap voucher serta satu test tambahan, 26 test terkait lulus. Typecheck dan lint seluruh TS/TSX yang berubah lulus; build final lulus. Warning baseline Project di test dan ukuran chunk/annotation Zod di build tetap ada. Backend tidak diubah, regresi backend tidak diulang untuk perubahan UI ini.

Browser native dengan sesi Staff Accounting: count omzet/voucher nyata dari PostgreSQL, antrean voucher submitted dan deep-link UUID yang sama, aksi Teruskan ke Manager/Kembalikan untuk koreksi; tidak mengeksekusi aksi finansial/bisnis. Browser Back mempertahankan kind voucher dan status submitted. Screenshot desktop terang/gelap dan mobile 390x844 tersedia lokal C:/ERP/ui-proof/accounting-work-*.jpg; viewport dikembalikan. Role Admin/Manager diverifikasi otomatis, belum walkthrough browser semua role atau sign-off bisnis. Bukti screenshot memakai data UAT, tidak dimasukkan ke Git.

Panel realisasi voucher hanya ditampilkan setelah status approved agar pemeriksaan tidak dipenuhi informasi pembayaran yang belum relevan. Formulas sumber Excel berada dalam disclosure opsional, dengan navigasi kembali ke ruang kerja dan istilah jenis laporan.

## Masih terbuka

- [ ] Walkthrough pengguna Admin/Staff Accounting atas alur kerja ini.
- [ ] Staging sumber Excel persisten dan hubungan sumber ke rekap, beserta keputusan versi final.
- [ ] Jadwal outlet/shift untuk menentukan laporan belum masuk secara sah.
- [ ] Rekonsiliasi Ecsys harian dan laporan tenant berdasarkan definisi yang disepakati.
- [ ] Ledger stok/wallet, HPP/fee/bonus/CMO sesuai keputusan bisnis.

Perubahan ini menyatukan pekerjaan nyata yang sudah persisten; tidak menutup ERP enterprise, PNL, import staging atau UAT melalui perubahan tampilan.
