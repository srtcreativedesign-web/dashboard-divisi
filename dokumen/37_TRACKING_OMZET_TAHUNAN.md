# Tracking omzet tahunan

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer dan Senior Fullstack Programmer.

Scope ACC-S10: laporan baca berdasarkan rekap omzet ACC yang berstatus validated, tahun kalender/tanggal bisnis WIB dan sumber outlet. Ini omzet outlet tercatat, bukan laba/PNL, setoran atau “penghasilan tenant” yang definisinya belum tersedia. Tidak mengubah sumber/jurnal.

Laporan memuat 12 bulan, nominal validated, jumlah rekap validated dan belum validated; bulan tanpa rekap validated bernilai null, bukan nol. Rekap validated dengan nominal 0 tetap ditampilkan 0.00. Total tahun hanya menjumlah sumber validated yang tersedia; jumlah rekap tertunda ditampilkan agar total tidak dianggap lengkap. Tidak mengklaim seluruh shift telah masuk karena jadwal shift resmi belum tersedia.

Komparasi antarsumber outlet memakai nominal validated dan bulan yang mempunyai data. Nama outlet berasal dari snapshot rekap; jangan mengganti outlet menjadi tenant atau menyimpulkan laba. Akses mengikuti view:acc_detail ACC/BOD baca. Nominal dihitung dengan integer sen, diberikan sebagai string dua desimal, dengan guard overflow. Filter tahun wajib angka empat digit; data domain lain/status lain tidak masuk nominal.

UI menyediakan pemilihan tahun, tabel per bulan dan per outlet, keadaan kosong/error/loading serta label sumber dan kelengkapan. Tidak menambah formula pajak/bonus/PNL. Bukti uji mencakup desimal, nol vs null, pergantian tahun, status, scope, akses negatif dan UI tanpa angka contoh produksi.

Status awal: siap diimplementasikan; penerimaan pengguna terpisah.

## Hasil implementasi

Selesai teknis. GET /api/v1/accounting/omzet/annual?year=2026; UI /accounting/omzet-tahunan. Tiga tes backend dan dua UI lulus, termasuk .10+.20=.30, tahun/domain/status, nol/null dan error. Native GET mengembalikan 12 bulan; tahun invalid 400. Tidak membuat transaksi contoh. Komparasi outlet tersedia; komparasi tenant/laba dan PNL belum selesai karena pemetaan tenant/basis pendapatan/HPP belum ditetapkan pengguna.

Tampilan nominal juga memakai integer BigInt dan pecahan string, sehingga 90000000000000.01 tetap ditampilkan ,01 tanpa pembulatan Number. Tiga tes UI (termasuk nominal besar) lulus; suite web terbaru 93/93.
