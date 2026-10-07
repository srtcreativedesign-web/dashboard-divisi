# Tema dan kelanjutan jurnal Accounting

7 Oktober 2026. Peran: Senior Product Designer dan Senior Fullstack Programmer.

## Scope sebelum implementasi

1. Selaraskan panel, teks sekunder, border, input dan status Project/Accounting dengan mode terang/gelap yang dipilih melalui tombol aplikasi. Pertahankan teks putih pada tombol berwarna. Grafik Apex mengikuti tema aktif; jangan mengubah data grafik.
2. Jurnal Accounting: tampilkan nominal string secara presisi, tampilkan saldo yang tidak dikirim sebagai belum tersedia, hapus filter lanjutan yang tidak berfungsi, beri label pencarian dan tutup konteks form saat periode diganti. Saat menyimpan, cegah pergantian periode dan penutupan panel. Retry harus memperbarui periode maupun transaksi.
3. Tidak mengubah rumus pendapatan/HPP/bonus, hak akses backend, skema atau data native. Ini kelanjutan teknis TODO-07, bukan penyelesaian PNL atau closing perusahaan.

## Verifikasi yang direncanakan

Tes perilaku jurnal (nominal besar, saldo tidak tersedia, perubahan periode/pending), typecheck, build dan inspeksi browser terang/gelap Project serta Accounting. Lint development masih memiliki baseline 106 error dari pull; tidak menyembunyikan error atau menonaktifkan aturan.

## TODO

- [x] Token panel/teks/border, komponen bersama, status dan grafik mengikuti tema.
- [x] Perbaikan konteks periode/pending, filter dan penyajian jurnal.
- [x] Tes dan inspeksi browser; batas scope dan hasil tercatat.
Temuan inspeksi: dashboard Project hasil pull berisi progres 68,4%, pertumbuhan 12,5% dan aktivitas contoh hardcoded. Scope diperluas untuk menghapus informasi tersebut, menampilkan proyek terakhir diperbarui dari respons API serta memberi batas ringkasan 100 proyek. Error fetch ditampilkan dengan retry.

## Bukti dan batas implementasi

- Token panel/muted/subtle dan native control mengikuti tema. Import dark-mode CSS dipindahkan ke bagian import agar tidak berada setelah aturan CSS. Tombol berwarna mempertahankan teks putih; tombol secondary menggunakan panel. Tooltip Recharts dan grafik Apex mengikuti tema.
- Pilihan tema tersimpan, ikut perubahan storage dari tab lain, dan terbukti tetap gelap setelah reload native.
- Jurnal tabel menggunakan format desimal string/BigInt; saldo undefined tampil Belum tersedia. Ini perbaikan penyajian tabel, bukan migrasi input jurnal atau formula PNL.
- Pergantian periode menutup form lama, reset pagination; pending mutasi mengunci filter/penutupan panel; retry memuat ulang periode dan transaksi. Label pencarian tersedia, filter lanjutan tanpa fungsi dihapus. Belum ada periode menjelaskan prasyarat tanpa menawarkan simpan jurnal.
- Inspeksi browser: Project terang/gelap dengan Head Operasional PROJECT (Uji UI), Accounting jurnal terang/gelap dengan Admin ACC (Uji UI). Data native masih kosong; tidak membuat periode/jurnal/proyek bisnis. Sesi Head Operasional dan tema gelap awal dipulihkan.
- Screenshot: C:/ERP/project-light-theme-20261007.png, project-dark-theme-20261007.png, accounting-journal-light-20261007.png dan accounting-journal-dark-20261007.png. Percobaan viewport override belum menghasilkan lebar 390; tidak menjadi bukti mobile atau UAT semua role.
- Typecheck dan build final lulus. Build masih mencetak peringatan ukuran chunk/dependency.
- Lint masih gagal dengan 105 error baseline kode development (sebelum pekerjaan ini 106). Tidak menonaktifkan aturan. Release gate keseluruhan belum lulus.
- Backend/skema tidak berubah; tidak migrasi, seed atau tes backend ulang. Autentikasi uji menggunakan sesi/audit yang sudah tersedia.
- API Project baru dan keputusan pendapatan/HPP/bonus/CMO tetap terbuka. Tidak menutup TODO-07 keseluruhan atau penerimaan perusahaan.

Tes final: 34 file / 144 tes frontend lulus (exit 0). Typecheck/build lulus. Sepuluh tes tambahan mencakup angka/saldo/filter jurnal, konteks periode/pending/retry, sinkronisasi tema dan dashboard Project tanpa informasi contoh. Tidak mengklaim full release gate lulus karena lint masih gagal.
