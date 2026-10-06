# Voucher Accounting: tagihan dan pembelian

Halaman: /accounting/vouchers. Endpoint: /api/v1/accounting/vouchers. Modul pusat ACC mencatat sumber outlet lintas divisi melalui OrgReadModelService. Tidak ada query langsung ke tabel modul lain dari service voucher.

## Alur operasional

1. Admin membuat draf BILLING (tagihan Angkasa Pura) atau PURCHASING (pembelian stok outlet), dengan outlet aktif, penerima, referensi sumber, tanggal voucher, jatuh tempo, nominal dan rincian tagihan/barang. Nomor voucher dibuat server.
2. Hanya Admin pembuat dapat mengedit draf/koreksi serta mengajukan voucher.
3. Staff Accounting memeriksa voucher yang diajukan: kembalikan untuk koreksi atau teruskan ke Manager. Catatan minimal 10 karakter wajib.
4. Manager menyetujui atau mengembalikan voucher untuk koreksi, disertai catatan minimal 10 karakter. Pembuat, pemeriksa dan pemberi persetujuan harus berbeda, termasuk setelah perubahan role.
5. Voucher disetujui terkunci. Persetujuan belum menyatakan pembayaran selesai.

Setiap perubahan memakai transaksi, penguncian baris dan version. Versi lama ditolak agar tidak menimpa perubahan orang lain. Riwayat acc_voucher_events menyimpan snapshot data dan alasan tindakan; audit umum ditulis melalui AuditService. Pengajuan ulang membersihkan keputusan aktif terdahulu; histori tetap tersedia. Tidak ada endpoint penghapusan voucher.

Duplikat dibatasi oleh kombinasi jenis, outlet, penerima dan referensi sumber. Penerima/referensi dinormalisasi huruf kecil serta spasi sebelum hash source_key unik dibuat. Ini mencegah pengajuan sumber yang sama dengan variasi kapital/spasi, tetapi tetap memerlukan pemeriksaan dokumen: referensi berbeda atau outlet berbeda belum menjamin tagihan berbeda. Referensi yang berulang pada penerima/outlet yang sama perlu dibedakan dengan nomor sumber yang lengkap, misalnya nomor dan periode pada dokumen asli.

Nominal harus positif, maksimal 12 digit utuh dan dua desimal. Tanggal voucher tidak boleh di masa depan menurut WIB; jatuh tempo tidak boleh sebelum tanggal voucher. Outlet diperiksa ulang saat pengajuan. Klien tidak dapat menetapkan status, nomor voucher atau identitas aktor. Akses baca mengikuti view:acc_report; hak perubahan ditentukan write:voucher, validate:voucher dan approve:voucher. BOD membaca saja.

## Batas pekerjaan ini

Migrasi baru: database/migrations/accounting/2026_10_05_110000_create_acc_voucher_workflow.php, tabel acc_vouchers dan acc_voucher_events. Tabel admin_vouchers lama tidak diubah dan tidak dimigrasikan otomatis ke alur baru, karena data lama belum diperiksa.

Pada 6 Oktober 2026 pengguna mengizinkan implementasi database langsung. Migrasi voucher telah diterapkan ke PostgreSQL dashboard_divisi_mvp di 127.0.0.1:5432; total 33 migrasi terpasang. Master ACC, CELL dan PROJECT beserta tiga konfigurasi modul sudah aktif. Presisi nominal 0.01 dan constraint source_key unik diverifikasi langsung di PostgreSQL dengan transaksi yang di-rollback. Tidak ada voucher/data uji yang tertinggal. Pengguna dan outlet belum diisi, sehingga UAT masih membutuhkan identitas operasional dan master outlet. Pengujian workflow otomatis sebelumnya tetap memakai SQLite in-memory.

Rincian barang saat ini berupa deskripsi, belum baris barang/kuantitas terstruktur. Unggah bukti/tagihan, pencatatan pembayaran Finance, pembentukan hutang, perubahan stok, jurnal otomatis dan pencetakan voucher belum termasuk pekerjaan ini. Voucher tidak mengubah saldo atau stok secara otomatis.

## Validasi 6 Oktober 2026

- Delapan tes backend voucher lulus (101 assertions): persetujuan, koreksi, identitas/role/scope, kepemilikan, konflik versi, angka/tanggal/outlet, duplikat dan akses baca.
- Lima tes UI voucher lulus; seluruh 67 tes web dan dua tes contracts lulus. Typecheck, lint, build dan formatter scoped lulus. Build memiliki peringatan chunk Cashflow yang sudah ada sebelumnya.
- Regresi backend terkait diperluas: 118 tes, 115 lulus, tiga gagal pada AccountingFoundationTest. Kegagalan lama mengharapkan delapan divisi, kemampuan lama BOD, dan laporan contoh yang sudah dihapus dari MVP.
- Suite backend penuh: 210 tes, 144 lulus, 64 gagal dan dua error. Jumlah kegagalan/error legacy tetap seperti catatan sebelumnya; suite penuh belum hijau. Jangan menganggap kelulusan voucher sebagai kelulusan seluruh repository.
