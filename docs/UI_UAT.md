# Uji UI lokal

Frontend: http://127.0.0.1:5173/login. Backend Laravel: http://127.0.0.1:8000. Vite memakai proxy /api ke backend. Kedua proses dijalankan pada loopback, bukan akses publik. Log pengembangan berada di C:/ERP/uat-api.log dan C:/ERP/uat-web.log; proses diluncurkan dengan jendela tersembunyi.

Pada 6 Oktober 2026 pengguna meminta akun setiap role untuk mencoba UI. Dibuat 24 akun anonim (delapan role per ACC/PROJECT/CELL) dan satu BOD read-only. Daftar lengkap serta password acak bersama khusus UAT disimpan di apps/api/.env.uat-accounts.md, yang diabaikan Git. Password tidak tertanam di frontend; pemilihan akun cepat hanya mengisi email. Berkas kredensial tidak dilayani Vite.

Role/slugs: MANAGER/manager, HEAD_OPS/head-ops, SPV/spv, LEADER/leader, ADMIN/admin, ADMIN_GUDANG/admin-gudang, ACCOUNTING/accounting dan FINANCE/finance. Pola email: slug.acc@dashboard.test, slug.project@dashboard.test atau slug.cell@dashboard.test. Pengecualian ACC: accounting@dashboard.test dan finance@dashboard.test. BOD: bod1@dashboard.test. Setiap akun non-BOD memiliki scope satu divisi; kewenangan mengikuti capability modul yang sudah tersedia.

Dua outlet anonim berlabel Uji UI ditambahkan: CELL-UAT-001 dan PROJECT-UAT-001. Tidak ada omzet, voucher, saldo atau transaksi finansial contoh yang dibuat. Akun/outlet ini untuk pengujian lokal, bukan identitas operasional perusahaan.

Validasi: seluruh 25 akun berhasil login melalui proxy frontend ke API PostgreSQL; enam tes LoginPage lulus. Browser diuji login sebagai Admin Accounting, membuka menu voucher, dan membuka form dengan kedua outlet uji. Screenshot: C:/ERP/voucher-ui-preview.png. Halaman voucher masih kosong sampai pengguna membuat draf.

Untuk mencoba alur: login Admin ACC → Voucher Tagihan & Pembelian → Buat voucher → simpan/ajukan. Keluar, login accounting@dashboard.test untuk pemeriksaan; kemudian manager.acc@dashboard.test untuk persetujuan. Pembuat/pemeriksa/Manager harus berbeda. BOD hanya membaca. Project dan Cellular dapat dicoba dengan akun divisi masing-masing; fungsi yang tersedia mengikuti tahap MVP saat ini.

## Halaman baru — 6 Oktober 2026

Cellular: /cellular/operasional. Manager/Admin menambah katalog; Manager/Admin Gudang mencatat stok masuk; Admin mencatat penjualan; Manager membatalkan dengan alasan. Role operasional lain tidak menerima harga/penjualan rinci. Rekap Accounting tahunan: /accounting/omzet-tahunan. Lampiran tersedia di detail voucher menurut status/role. Manager/Admin Project mempunyai form tambah proyek di /projects/list. Data native tidak diisi transaksi contoh. Acuan scope/bukti/batas: ../dokumen/36 sampai 40 dan checklist 21.
