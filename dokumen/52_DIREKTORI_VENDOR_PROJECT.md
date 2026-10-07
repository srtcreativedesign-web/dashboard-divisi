# Direktori vendor Project — PRJ-UI-003

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Scope ditulis sebelum kode. Branch REQ, tanpa PR.

API vendor sudah menerima search/page/per_page. UI perlu pencarian maksimal 255 karakter, 50 vendor per halaman dan navigasi sebelumnya/berikutnya, reset halaman saat pencarian berubah, penolakan respons lama serta retry. Halaman kosong setelah jumlah data berubah tetap memungkinkan kembali. Urutan server memakai nama lalu id agar nama sama tidak membuat urutan pagination ambigu.

Penyimpanan vendor dan pemuatan ulang daftar adalah dua hasil berbeda. Setelah API simpan berhasil, tampilkan sukses simpan; jika daftar gagal dimuat, tampilkan error daftar dengan retry. Jangan menawarkan simpan ulang sebagai respons terhadap error pemuatan daftar. Jika simpan gagal, draft tetap tersedia. Search/navigasi/form terkunci selama simpan. Tidak membuat rekening, approval vendor, penghapusan atau relasi proyek baru.

Query UI hanya berjalan bagi pemilik view:projects; kontak tetap mengikuti manage:projects atau BOD sesuai kontrol server yang ada. Enam reader Project tidak mendapat kontak. Tidak menambah capability, migrasi, seed atau transaksi native. Tema dan tabel mengikuti perbaikan sebelumnya.

Verifikasi: akses negatif, pagination dan reset filter, respons lama, simpan gagal/retry, simpan sukses tetapi reload gagal, duplicate submit dan nama vendor sama pada pagination backend. Tes memakai fixture anonim terisolasi; UAT bisnis serta pembayaran nyata tetap terbuka.

## Hasil pelaksanaan

PRJ-UI-003 selesai teknis. Pencarian/pagination/filter reset, respons lama, halaman kosong yang masih dapat kembali, input/error/retry dan sukses simpan terpisah dari error pemuatan daftar tersedia. Kontak tetap dibatasi, rekening tidak diedit dan tidak ada perubahan capability. API mengurutkan nama lalu id; tes dua vendor bernama sama membuktikan halaman berbeda dan proyeksi reader tanpa kontak.

Sembilan tes UI vendor lulus. Gate final exit 0: 268 backend/2219 assertions, 134 web, dua contracts dan seluruh guard gate/policy/database/scanner. Lint/typecheck/build/Pint lulus. Bukti JSON mencatat HEAD sebelum commit dan workingTreeDirty=true; bukan bukti CI commit akhir. Warning chunk Cashflow/anotasi Zod tetap ada. Tes memakai fixture anonim SQLite in-memory; tidak menjalankan migrasi/seed atau membuat vendor native. Pemeriksaan native browser baru tidak dilakukan pada tahap ini; penerimaan pengguna dan pembayaran nyata tetap terbuka. REQ commit/push tanpa PR.
