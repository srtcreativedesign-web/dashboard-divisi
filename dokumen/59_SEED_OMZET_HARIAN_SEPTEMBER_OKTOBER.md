# Seed omzet harian September dan Oktober 2026

7 Oktober 2026. Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

## Scope sebelum write

Pengguna meminta data omzet harian untuk kedua bulan setelah seed voucher. Isi adalah UAT/SIMULASI anonim, bukan angka perusahaan. Dataset JSON terpisah dari UI/logika bisnis: outlet Cellular Uji UI, dua shift PAGI/SORE, 1–30 September dan 1–7 Oktober; 74 rekap. Kanal tunai/QRIS/EDC/transfer berjumlah tepat omzet outlet. requires_ap=false: tidak membuat selisih atau laba Angkasa Pura yang tidak berdasar. Tidak membuat transaksi stok, jurnal atau cashflow.

API Admin membuat draf; rekap melewati akhir H+1 meminta izin Manager, Manager berbeda menyetujui izin; Admin mengajukan; Accounting berbeda memvalidasi tanpa selisih. Tanggal 7 Oktober tetap draf sampai H+1 tanggal 8 Oktober, tidak mem-bypass waktu sistem. Seed tidak memasukkan tanggal 8–31 Oktober yang belum terjadi. Guard APP_ENV local/database MVP/backup/role/domain, preflight konflik outlet/tanggal/shift, referensi batch idempotent, tidak menimpa data lama. Sesi probe ditutup, secret tetap lokal/ignored. Backup terbaru sebelum write: C:/ERP/backups/dashboard-divisi/2026-10-07T05-58-58-253Z-bf2c87ee.erpbackup.

## TODO

- [x] Jalankan seed API, validasi alur izin H+1 dan actor.
- [x] Verifikasi jumlah/status/tanggal/nominal/audit database dan ringkasan tahunan.
- [x] Jalankan ulang tanpa menggandakan data; periksa dashboard/tren bulan.
- [x] Dokumentasi hasil, commit/push REQ tanpa PR.

Tes teknis tidak menggantikan UAT bisnis atau membuktikan kesiapan produksi.

## Hasil pelaksanaan

Batch OMZET-UAT-20261007 pada PostgreSQL dashboard_divisi_mvp berisi 74 rekap untuk Cellular Uji UI, dua shift per tanggal: 60 September tervalidasi; Oktober 14 rekap, 12 tervalidasi (1–6 Oktober) dan dua draf (7 Oktober). Tidak mengubah waktu sistem atau membuat tanggal masa depan. September total Rp51.200.015,00; Oktober total tercatat termasuk draf Rp11.549.003,50, omzet tervalidasi Rp10.220.003,00. Angka ini sepenuhnya SIMULASI, bukan hasil penjualan perusahaan.

358 event workflow berpasangan dengan 358 audit accounting.omzet. Izin historis dibuat Admin dan diputuskan Manager, Accounting berbeda memeriksa. Pengajuan terlambat tanpa izin ditolak 422, pengajuan tanggal hari ini ditolak 422, tanggal masa depan ditolak 400, perubahan rekap tervalidasi ditolak 409 dan pemeriksaan oleh Admin ditolak 403. Setiap kanal dan jumlah tervalidasi diverifikasi pada dataset, respons API, laporan tahunan dan database. Tidak menambah rekening/data penerima atau unggahan file.

Pelaksanaan pertama: C:/ERP/omzet-uat-seed-20261007.json, passed=true, 536 pemeriksaan. Pengulangan: C:/ERP/omzet-uat-idempotent-20261007.json, passed=true, 179 pemeriksaan; seluruh 74 baris existing, count/status/event/audit sama, tidak menggandakan atau menimpa baris. Tiga sesi probe ditutup setiap pelaksanaan; password/token tidak masuk laporan/Git.

ESLint seeder/dashboard, node --check seeder dan delapan tes dashboard lulus. Tidak mengulang seluruh backend/frontend karena tidak mengubah layanan bisnis; baseline terakhir 279 backend dan 159 web lulus. Perubahan UI hanya keterangan bahwa bulan berjalan belum lengkap: perbandingan Oktober parsial vs September penuh menggunakan total tervalidasi, bukan proyeksi atau growth sebanding hari.

Inspeksi native browser Admin pada dashboard: September Rp51.200.015,00/60 rekap dan Oktober Rp10.220.003,00/12 rekap; dua batang grafik tampil dari API/database. Pemilihan bulan September benar, bulan tanpa omzet tetap kosong. Screenshot C:/ERP/omzet-dashboard-october-20261007.png dan omzet-dashboard-september-20261007.png. Tab inspeksi terpisah ditutup, halaman/akun/tema pengguna tidak diubah. Cashflow tetap belum tersedia karena tidak ada jurnal/periode; seed omzet tidak memposting jurnal atau membuat penerimaan setoran/stok nyata.

## Menjalankan ulang batch ini

Dataset scripts/uat/omzet-dataset.json; seeder scripts/uat/seed-omzet-uat.mjs. Guard tanggal melalui 7 Oktober mengikat batch ini, bukan scheduler pengisian otomatis. Dari root:

```powershell
node scripts/uat/seed-omzet-uat.mjs --write --backup=C:/ERP/backups/dashboard-divisi/2026-10-07T05-58-58-253Z-bf2c87ee.erpbackup --report=C:/ERP/omzet-uat-report.json
```

Backup tersebut adalah backup sebelum pelaksanaan yang tercatat. Buat backup terbaru untuk batch baru. --resume hanya melanjutkan rekap batch yang inputnya persis dataset dan pembuatnya akun UAT yang sama; tanpa opsi ini, existing tidak ditulis ulang. Konflik outlet/tanggal/shift dengan data lain menghentikan preflight sebelum seed. Tidak menyediakan reset/delete.

Selesai teknis ACC-SEED-002. UAT bisnis, data perusahaan nyata, laporan AP/pajak/jurnal/PNL/stok/bonus dan deployment enterprise tidak ditutup melalui seed ini. Commit/push REQ tanpa PR.
