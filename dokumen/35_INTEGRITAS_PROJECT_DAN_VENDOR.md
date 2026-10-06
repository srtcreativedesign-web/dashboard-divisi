# Integritas Project dan direktori vendor

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Application Security Engineer, Senior Fullstack Programmer dan Senior Product Designer.

## Implementasi

Melanjutkan TODO-04d-3 dan sebagian TODO-08 berdasarkan PRJ-01/04/06. RAB kini harus mempunyai induk Project yang ditemukan melalui scope PROJECT. ID yang tidak ada atau proyek domain lain ditolak 404 sebelum baris RAB dibuat.

Tanggal proyek diperiksa saat create/update: apabila tanggal mulai dan selesai tersedia, selesai tidak boleh lebih awal. Update satu field diperiksa terhadap tanggal lain yang tersimpan; invalid tidak menimpa data. Tanggal tetap boleh kosong sesuai kontrak awal.

Pencarian Project/vendor memakai whereLike sesuai dialect database. Search harus string maksimal 255; per_page 1–100 dan page minimal 1. Filter kosong tidak menyembunyikan daftar; status Project hanya menerima empat status yang tersedia.

## Akses vendor dan UI

Manager/Admin PROJECT dengan manage:projects tetap mengelola vendor dan membaca kontak. BOD mempertahankan pembacaan tanpa mutasi. Enam role Project lain hanya menerima id, name, category, created_at dan updated_at pada list/detail vendor; contact_person, phone, email dan bank_details tidak dikirim.

Pembatasan ini default konservatif berdasarkan kewenangan kelola yang sudah ada, belum konfirmasi matriks bisnis final. Tombol Tambah Vendor/Edit yang sebelumnya tidak memiliki aksi kini membuka form nama, kategori, kontak, telepon dan email lalu memanggil API. Sukses memuat ulang daftar; kegagalan mempertahankan input dengan pesan dan kesempatan mencoba kembali. Input/tombol dinonaktifkan selama simpan.

Pembaca tidak melihat tombol mutasi; enam role terbatas tidak melihat kolom kontak. BOD membaca kontak tanpa tombol perubahan. Form tidak mengedit rekening atau menyediakan penghapusan. Tidak memasukkan vendor contoh pada database operasional.

## Bukti dan batas

Empat ProjectIntegrityTest menguji enam role pembaca, Manager/Admin/BOD/domain lain, field list/detail, induk RAB salah, pencarian/pagination dan tanggal efektif. Tiga tes UI menguji pembaca, tambah/edit dan gagal/retry. Suite penuh 230 backend dan 80 web lulus; typecheck/lint/build lulus. Setelah penanganan filter kosong ditambahkan, empat tes terkait lulus dengan 82 assertions; formatter lulus. Warning chunk Cashflow dan anotasi Zod tetap ada.

Mutasi diuji pada SQLite in-memory; bukan transaksi uji di PostgreSQL operasional. Hak nilai kontrak/RAB, delegasi/PIC, bobot milestone, pembayaran nyata, amandemen RAB, verifikasi rekening, retensi dan penerimaan tetap terbuka. TODO-04 dan TODO-08 tidak selesai keseluruhan.

Smoke API native melalui proxy frontend pada 11 akun (delapan Project, BOD dan dua akun domain lain): 44 pemeriksaan GET pencarian/validasi/scope lulus. Bukti `C:/ERP/project-integrity-smoke-2026-10-06.json`. Tidak membuat vendor/RAB/proyek uji dan tidak mengeluarkan akun browser pengguna. Redaksi field dengan fixture vendor diuji pada suite SQLite; smoke daftar lokal kosong tidak menggantikannya.
