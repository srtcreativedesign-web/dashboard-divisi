# Hak baca jurnal dan batas objek Accounting

Tanggal: 6 Oktober 2026. Peran: Application Security Engineer, Senior Fullstack Programmer, Senior Product Designer dan Senior Product Manager.

Status: TODO-04d-3a selesai teknis. TODO-04d-3 keseluruhan tetap terbuka; matriks bisnis untuk field sensitif dan delegasi belum disepakati.

## Masalah dan perubahan

Menu jurnal sudah memakai view:acc_journal tetapi API daftar/detail/ringkasan/unduh lampiran masih memakai view:acc_report. Empat role yang hanya memiliki izin laporan dapat memanggil API jurnal langsung. Seluruh endpoint baca jurnal kini memakai view:acc_journal; service transaksi juga memeriksa policy agar pemanggilan service tidak melewati batas tersebut. Manager, Admin, Staff Accounting dan Staff Finance ACC tetap dapat membaca jurnal. Head Operasional, SPV, Leader dan Admin Gudang ACC mendapat 403 untuk jurnal; akses laporan yang sebelumnya tersedia tetap mengikuti aturan lama sambil menunggu keputusan bisnis. BOD tetap ditolak pada jurnal sesuai policy yang sudah ada.

Preview impor kini memakai submit:acc_period, sama dengan commit. Menu dan route guard frontend diselaraskan. Manager yang tidak memiliki izin pengajuan tidak melihat menu impor. Admin, Accounting dan Finance tetap mengikuti hak submit yang sudah ada; pekerjaan ini tidak menetapkan matriks impor final baru.

Daftar, saldo berjalan, detail, update, pembatalan dan ringkasan transaksi dibatasi division_id Accounting. Pemilihan periode dan rekening saat membuat transaksi dibatasi ACC. Preview/commit impor menolak ID periode domain lain; periode eksplisit yang tidak ditemukan tidak lagi diam-diam diganti dengan periode fallback. Kategori Accounting adalah master global tanpa division_id; lookup global dipertahankan sesuai skema.

Objek asing pada detail/ringkasan/mutasi menghasilkan 404; role tanpa izin jurnal menghasilkan 403 sebelum lookup objek. Daftar tidak mengembalikan transaksi asing. Tidak ada migrasi, penghapusan data atau perubahan role/kredensial pada PostgreSQL.

## Bukti pengujian

- 208/208 tes backend lulus, 1451 assertions. Empat tes baru memeriksa empat role laporan tanpa izin jurnal, empat role jurnal yang diizinkan, objek/periode asing dan preview/commit impor. SQLite in-memory dan fake storage dipakai; PostgreSQL operasional tidak dihapus atau di-reset.
- 75/75 tes web lulus, termasuk dua tes baru menu; typecheck, lint dan formatter PHP scoped lulus.
- Smoke server aktif melalui localhost:5173 dan 127.0.0.1:5173: login Manager 200, jurnal 200, preview impor ditolak 403; sesi smoke logout sesudah pemeriksaan. Tidak mengubah sesi browser pengguna.
- Bukti suite: C:/ERP/backend-journal-access-2026-10-06.xml. Inventaris API aktual diperbarui; jumlah route tetap 91.

## Bagian yang belum selesai

Keputusan hak detail nominal/rekening/voucher/lampiran untuk Head Ops/SPV/Leader/Gudang masih diminta kepada pemilik proses. Review field sensitif pada voucher/omzet/master/Project, hak unduh/ekspor, penugasan outlet dan delegasi tetap perlu dikerjakan. Pembatasan jurnal ini bukan klaim semua API sudah lolos BOLA/BFLA atau seluruh TODO keamanan selesai. Retensi dan scanning malware juga tetap terpisah.
