# Seed UAT database dan pengujian keamanan voucher

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

## Scope sebelum pelaksanaan

Pengguna mengizinkan seed tersimpan pada database. Isi tahap ini adalah data anonim untuk alur voucher yang sedang dikembangkan: draf, koreksi, diajukan, menunggu Manager, disetujui belum dibayar, sebagian, lunas dan catatan realisasi dibatalkan. Setiap referensi/perusahaan/uraian/bukti bertanda UAT/SIMULASI. Data bukan transaksi perusahaan dan tidak menjadi pengakuan pembayaran bank. Tidak menanam nilai UI atau mem-bypass status/aktor melalui SQL; buat melalui API lokal dengan akun UAT existing terpisah. Tidak mengubah kredensial/capability, rumus, atau data lama. Dataset JSON merupakan input seeding terpisah dari logika aplikasi; UI tetap membaca database melalui API.

Target dibatasi ke PostgreSQL dashboard_divisi_mvp native dan API 127.0.0.1:8000, APP_ENV local. Backup terenkripsi sebelum write. Outlet existing bertanda Uji UI pada CELL/PROJECT dipilih; jika tidak ada, berhenti tanpa memakai outlet bisnis lain. Seeder tidak reset/drop/delete atau menimpa seed yang sudah ada; referensi batch tetap menjadi penanda agar pengulangan tidak menggandakan data. Jika skenario existing sudah diubah pengguna, tidak dikembalikan ke status awal.

Bukti PDF anonim berisi tulisan UAT/SIMULASI, bukan transfer/kwitansi nyata, dan wajib melalui scanner native. Password/token hanya dibaca lokal ke memori dan tidak masuk log/Git. Sesi probe terpisah dari browser; ditutup di akhir.

## Pemeriksaan keamanan native

Uji login origin asing dan akses tanpa sesi; cookie tanpa CSRF; role/domain yang tidak boleh membuat/review/approve/pay/download; payload actor/status palsu; versi lama; duplikasi referensi; nominal melebihi sisa; missing/invalid proof; bank tujuan pada proyeksi list/detail/history; parent download salah; scanner EICAR; audit tiap mutasi dan perubahan yang ditolak tidak mengubah versi/total/row pembayaran. Uji positif memakai jalur API Admin → Accounting → Manager → Finance. Bukan penetration test komprehensif atau bukti kesiapan produksi. Data UAT yang tersimpan memengaruhi daftar/ringkasan voucher, tetapi tidak otomatis membentuk jurnal/PNL/stok/outstanding.

## TODO

- [x] Dataset/seeder idempotent dan laporan tanpa secret.
- [x] Backup dan pemeriksaan scanner sebelum unggahan.
- [x] Seed API native dan penolakan negatif; verifikasi DB/audit.
- [x] Inspeksi browser data terisi/PDF; dokumentasi hasil dan commit/push REQ tanpa PR.

## Hasil pelaksanaan

Batch VOUCHER-UAT-20261007 tersimpan pada PostgreSQL dashboard_divisi_mvp: delapan voucher sesuai skenario dataset. Empat catatan realisasi tersimpan: dua aktif (sebagian dan lunas), dua dibatalkan; histori tidak dihapus. Sebanyak 31 event workflow berpasangan dengan 25 audit voucher dan enam audit pembayaran. Tidak ada rekening lengkap pada snapshot event. Pengulangan akhir membaca kedelapan referensi existing tanpa membuat atau mengembalikan data ke status awal.

Jalur positif berjalan melalui delapan sesi role UAT yang diverifikasi identitas/domain-nya, lalu ditutup tanpa mengeluarkan sesi browser pengguna. Admin membuat/mengajukan; Accounting memeriksa atau mengembalikan; Manager menyetujui; Finance mencatat bukti; Manager membatalkan catatan salah. Dua permintaan realisasi memakai versi/referensi sama menghasilkan hanya satu realisasi; server PHP lokal ini tidak membuktikan kapasitas atau concurrency multi-worker produksi.

Laporan akhir C:/ERP/voucher-uat-final-20261007.json: passed=true, 88 pemeriksaan lulus, tanpa password/token. Pemeriksaan mencakup origin, sesi, CSRF, capability/domain, spoof actor/status, duplikasi, versi lama, nominal/method/proof, scanner, masking rekening, parent download dan persistensi audit. Snapshot sebelum/sesudah penolakan membuktikan versi/total/event/payment voucher uji tidak berubah. Bukti privat PDF berhasil diunduh oleh role berizin; role/domain lain ditolak. Hasil ini khusus jalur voucher lokal yang diuji.

277 tes backend / 2.346 assertions lulus; ESLint dan node --check seeder, Pint file berubah serta 38 pemeriksaan privilege PostgreSQL lulus. Pemeriksaan scanner native berurutan juga lulus: file bersih diterima, EICAR ditolak. Pemeriksaan scanner yang sempat berjalan bersamaan dengan probe API berhenti karena lock aktif; pemeriksaan berurutan berikutnya lulus. UI tidak berubah pada tahap ini sehingga suite frontend tidak diulang; baseline sebelumnya 154 tes web lulus.

## Temuan yang diperbaiki dan koreksi probe

Unggahan PDF nyata melalui HTTP awalnya gagal 503 karena ClamAV mencoba membuat temporary file di root C:/ yang tidak dapat ditulis oleh proses server. ClamavScanner sekarang membuat direktori UUID per scan pada disk karantina privat, memberi --tempdir secara eksplisit, lalu membersihkan direktori pada success/error. Lock, pemeriksaan stderr, signature age, batas scan dan fail-closed tetap berlaku. Tes memastikan file temporary diekstrak lalu dibersihkan serta hasil invalid ditolak. Log diagnostik hanya berisi reason/booleans/exit code, tanpa konten unggahan, kredensial atau rekening.

Probe awal keliru menambahkan marker EICAR setelah isi PDF; itu bukan file uji EICAR standar. PDF diterima dan tercatat sebagai realisasi UAT Rp0,01 pada skenario 05. Catatan tersebut kemudian dibatalkan melalui API Manager dengan alasan eksplisit; bukti/event/audit tetap tersimpan, sisa kembali Rp360.000,25. Tidak ada transfer nyata. Probe diperbaiki menjadi file standar 68 byte dan API menolak unggahan dengan 422 tanpa mutasi voucher. Definisi sampel: [EICAR resmi](https://www.eicar.org/download-anti-malware-testfile/). Laporan gagal sebelumnya tetap disimpan di C:/ERP, bukan disamarkan sebagai hasil lulus.

Query audit awal juga gagal karena perbandingan entity_id varchar dengan UUID pembayaran; cast id::text memperbaiki query read-only tersebut, tanpa perubahan skema/permission/data.

## Menjalankan ulang

Dataset: scripts/uat/voucher-dataset.json. Seeder: scripts/uat/seed-voucher-uat.mjs. Dari root proyek gunakan:

```powershell
node scripts/uat/seed-voucher-uat.mjs --write --backup=C:/ERP/backups/dashboard-divisi/2026-10-07T05-10-45-726Z-0ea4ad60.erpbackup --report=C:/ERP/voucher-uat-report.json
```

Untuk batch baru, buat backup terbaru dahulu; contoh backup ini khusus pelaksanaan yang sudah tercatat. Seeder berhenti bila APP_ENV/database/tanggal target tidak sesuai, backup tidak tersedia, role/domain atau outlet Uji UI tidak cocok. Kredensial dibaca dari file lokal ignored apps/api/.env.uat-accounts.md dan tidak disimpan pada dataset. --resume hanya untuk skenario realisasi yang terhenti pada approved versi 4 tanpa pembayaran dan identitas/uraian/nominal persis dataset; bukan untuk mereset data yang telah diedit pengguna.

Backup sebelum seed: C:/ERP/backups/dashboard-divisi/2026-10-07T05-10-45-726Z-0ea4ad60.erpbackup. Screenshot UI Admin: C:/ERP/voucher-seed-detail-20261007.png; delapan voucher tampil, termasuk realisasi Rp100.000,25 dan sisa Rp260.000,00. Pengguna dapat memfilter bulan Oktober 2026 di /accounting/vouchers. Akun/tema browser tidak diganti.

## Batas penerimaan

Selesai teknis sebagai ACC-SEED-001. Seed tahap ini khusus voucher Accounting bersumber outlet Uji UI Cellular/Project; belum mengisi seluruh modul ERP. Data tetap berlabel SIMULASI dan memengaruhi ringkasan voucher. Tidak melakukan transfer, pembelian nyata, jurnal/PNL/stok otomatis atau perubahan database lama. UAT bisnis semua role, mapping jurnal/PNL, TLS/deployment, multi-worker/load test, pentest menyeluruh, CI billing dan baseline lint global 105 error tetap terbuka. Tidak menyatakan ERP enterprise siap produksi. Commit/push hanya REQ, tanpa PR.
