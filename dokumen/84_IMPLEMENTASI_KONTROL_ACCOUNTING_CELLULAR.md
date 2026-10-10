# Implementasi Kontrol Accounting Cellular

Tanggal: 10 Oktober 2026
Branch: `REQ`
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Masalah yang diselesaikan

Pekerjaan Accounting Cellular sebelumnya tersebar di halaman transaksi dan panel kesiapan. Pengguna belum memperoleh satu tempat untuk menilai apakah data suatu periode sudah layak diteruskan ke Accounting pusat. Halaman baru menyatukan sumber operasional tanpa mengganti data dengan angka hardcode.

## Ruang lingkup

Rute `/cellular/pembukuan` menjadi **Kontrol Accounting** dan mengambil data aktif dari:

- transaksi penjualan berstatus `posted`;
- closing harian H+1 per tanggal dan shift;
- sumber settlement tunai, QRIS, EDC, dan transfer;
- kontrol shift serta status supervisinya;
- saldo stok per produk dan outlet.

KPI menunjukkan omzet posted, closing disetujui, sisa settlement, pengecualian, dan stok kritis. Readiness periodik memisahkan kesiapan paket H+1, rekonsiliasi kanal, serta kontrol operasional. Matriks closing menyediakan drill-down per tanggal dan shift untuk membandingkan omzet sistem, selisih closing, hak settlement, nilai yang telah direkonsiliasi, dan sisa yang harus ditindaklanjuti.

## UX dan bahasa visual

Halaman memakai kerangka visual yang sama dengan Divisi Project: header divisi, hirarki KPI, panel readiness, register berfilter, status yang dapat dipindai, tema terang/gelap, loading, error, empty state, dan tabel responsif. Isi serta tindakan tetap khusus untuk pekerjaan Accounting Cellular.

Orientasi pengguna menjawab lima pertanyaan saat halaman dibuka:

1. periode mana yang sedang diperiksa;
2. berapa omzet yang berasal dari transaksi posted;
3. closing mana yang belum disetujui atau berselisih;
4. settlement mana yang belum terekonsiliasi;
5. pengecualian operasional atau stok apa yang perlu ditindaklanjuti.

## Pembagian tanggung jawab

- Admin Cellular membuat transaksi dan closing H+1.
- Accounting Cellular memeriksa paket periode dan merekonsiliasi settlement.
- Finance Cellular mencatat realisasi penerimaan kanal.
- Leader, SPV, Head Operasional, dan Manager menyelesaikan kontrol shift sesuai jenjang.
- Accounting pusat mengelola staging laporan Excel/ECSYS dan laporan perusahaan lintas divisi.

## Keamanan dan integritas

- halaman dibatasi capability `view:cellular_accounting` untuk Accounting dan Manager Cellular;
- sumber data tetap melewati endpoint yang menerapkan scope divisi dan outlet;
- perubahan finansial dilakukan di workflow asal yang memiliki maker-checker, versioning, validasi status, dan audit trail;
- halaman kontrol bersifat baca sehingga tidak menciptakan jalur perubahan status yang melewati workflow;
- angka HPP, pengakuan pendapatan, bonus, dan PNL tidak dihitung sebelum kebijakan perusahaan ditetapkan.

## Verifikasi

- Vitest halaman Kontrol Accounting dan dashboard Cellular lulus;
- TypeScript typecheck lulus;
- sinkronisasi capability frontend dan backend lulus;
- visual UAT role Accounting Cellular pada tema gelap menampilkan data database periode aktif;
- nilai yang terlihat berasal dari API/database, bukan konstanta antarmuka;
- Divisi Project tidak diubah.

## Penilaian role

Accounting Cellular: **90/100**.

Quality gate dipenuhi melalui kontrol periode yang dapat ditelusuri, hubungan data lintas workflow, pengecualian yang terlihat, dan pembatasan akses. Nilai belum lebih tinggi karena kebijakan HPP/PNL belum ditetapkan dan pelaporan ECSYS/komparasi masih dilanjutkan pada tahap berikutnya.
