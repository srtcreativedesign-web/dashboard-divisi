# Seed menu Accounting lainnya

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Scope sebelum write

ACC-SEED-003: pengguna meminta data database untuk menu Accounting lainnya. Dua periode September/Oktober tetap draft; tiga kategori B/C/D dan dua rekening UAT; jurnal kas masuk/keluar, draf, batal dan impor; outstanding belum/sebagian/lunas/batal; setoran berasal dari omzet UAT tervalidasi; penerimaan Finance berbeda dari Admin; pegawai anonim, cuti dan absensi. Cashflow dan pencocokan dihitung layanan dari sumber, bukan angka UI hardcode. Tidak memposting seluruh omzet atau pembayaran voucher secara otomatis, tidak menganggap jurnal kas sebagai general ledger double entry/PNL. Tidak membuat data masa depan atau data perusahaan nyata.

Master/periode/jurnal/impor/outstanding/setoran/HR melalui API role ACC. Tidak mengubah capability atau menutup periode. Bank belum memiliki API input: fixture CLI Laravel khusus local/database MVP/backup, rekening UAT dan periode bertanda batch, create-only, transaksi dengan AuditService.logRequired. Kolom legacy jul_balance/aug_balance digunakan sebagai saldo awal/akhir periode sesuai kalkulasi yang ada; bukan bulan Juli/Agustus. Seluruh saldo bank belum diverifikasi, satu selisih simulasi tetap terlihat. Fixture tidak membuktikan jalur input bank produksi aman.

Referensi MENU-UAT-20261007, kode UAT, semua keterangan UAT/SIMULASI. Existing dengan marker sama harus cocok, tidak reset/delete/update input pengguna. Mutasi tersimpan di PostgreSQL dashboard_divisi_mvp. Backup sebelum write: C:/ERP/backups/dashboard-divisi/2026-10-07T06-13-59-543Z-cac16825.erpbackup. Secret tetap ignored. Menu impor merupakan workflow; contoh JSON diunggah dan dipindai, preview lalu commit, hasil di jurnal. Tidak membuat history impor palsu.

## TODO

- [x] Seed dan validasi API/database.
- [x] Uji pengulangan tanpa duplikasi dan penolakan role/nominal/versi.
- [x] Periksa tampilan berisi data.
- [x] Hasil QA, tracker, commit/push REQ tanpa PR.

## Hasil database dan QA

Batch MENU-UAT-20261007: 2 periode draft, kategori B990/C990/D990, 2 rekening fiktif, 20 jurnal (16 input API dan 4 hasil dua batch impor JSON; termasuk 2 draf dan 2 batal), 8 outstanding kewajiban (masing-masing bulan belum dibayar/sebagian/lunas/batal), 12 setoran dari omzet UAT tervalidasi, 8 catatan penerimaan (6 aktif/2 batal), 4 pegawai anonim, 48 realisasi absensi dan 4 rekap cuti. 4 saldo bank (2 rekening per periode), semuanya belum diverifikasi. Keterangan/referensi menandai simulasi; tidak menggunakan pegawai/rekening nyata.

September: saldo awal Rp5.000.000, penerimaan Rp18.150.000, pengeluaran Rp6.000.000, saldo kas akhir Rp17.150.000; saldo bank sama secara nominal, belum berarti disetujui. Oktober: saldo awal mengikuti saldo akhir jurnal September Rp17.150.000, penerimaan Rp6.150.000, pengeluaran Rp1.700.000, saldo kas Rp21.600.000; saldo bank Rp21.650.000, selisih Rp50.000 sengaja menjadi skenario pemeriksaan. Outstanding aktif Rp1.800.000 per bulan; bukan auto-posting pembayaran ke jurnal.

52 event HR = 52 audit HR; 24 event setoran = 24 audit setoran; 4 fixture bank = 4 audit fixture. Jalur lama periode/master/jurnal/outstanding/impor menggunakan audit wajib middleware api.mutation, dengan history master/jurnal jika disediakan layanan; bukan event workflow baru yang dibuat manual. Impor memiliki audit batch, bukan history per baris buatan seeder.

C:/ERP/accounting-menu-seed-20261007.json passed=true (187 pemeriksaan pada pass lengkap sesudah resume); C:/ERP/accounting-menu-idempotent-20261007.json passed=true (189 pemeriksaan termasuk count/event/audit database). Pengulangan created={} dan seluruh fixture bank existing=true: tidak menambah jurnal, outstanding, rekap atau setoran. Hash snapshot seluruh omzet/voucher beserta jumlah event sebelumnya tidak berubah sebelum/sesudah pass. Setiap sesi probe ditutup; password/token tidak dicetak atau masuk Git.

Admin menerima setoran ditolak 403; penerimaan melampaui nominal ditolak 409; Admin membuat rekening ditolak 403; Admin Project membaca jurnal dan HR ditolak 403; jurnal dua sisi ditolak 422. Data sekarang dapat diperiksa langsung di DBeaver pada tabel PostgreSQL, bukan array UI. Tes ini dibatasi kasus yang dijalankan, bukan sertifikasi keamanan semua endpoint.

## Perbaikan yang ditemukan saat seed

Upload JSON diterima controller tetapi parser sebelumnya membuka semua file sebagai ZIP Excel. Parser sekarang membaca JSON dengan kedalaman 16, daftar maksimal 1000 baris dan field scalar/null; JSON rusak/top-level object/baris scalar/nilai bersarang/lebih dari 1000 ditolak 422 tanpa menulis jurnal atau membocorkan isi file. Tetap melewati scanner. Dua contoh input scripts/uat/import-uat-2026-09.json dan import-uat-2026-10.json tersimpan di repo sebagai fixture, bukan data UI hardcode.

Cashflow menghapus angka contoh 484 transaksi/Rp4,76 miliar/Rp290 juta dan 25 pos beban, serta label Wrapping/P&L. Rincian penerimaan/beban sekarang seluruhnya dari API, termasuk koreksi bernilai negatif. Kartu/tabel/bar total mengikuti tema, kontras gelap diperbaiki. Periode UAT menampilkan catatan simulasi; judul/nama ekspor PDF/Excel juga ditandai UAT.

Pint, lint file berubah, policy sinkron, typecheck/build lulus. Regresi backend 281 tes/2403 assertions lulus; web 161 tes lulus, 13 tes komponen terkait kembali lulus setelah perbaikan kontras. Build tetap memiliki warning chunk Project besar dan tes Project memiliki warning mock invoice/act yang sudah ada; lint global 105 error baseline belum ditutup.

Native browser Admin: cashflow Oktober/saldo Rp21.600.000, rekonsiliasi selisih Rp50.000/dua rekening belum diperiksa, HR cuti/28 absensi Oktober dan 6 setoran Oktober terisi. Bukti positif HR: C:/ERP/accounting-hr-seed-20261007.png. Cashflow positif diperiksa sebelum pengguna beralih akun. Pada akhir QA sesi browser berubah menjadi Head Operasional PROJECT; reload tab QA menampilkan penolakan view:acc_detail sesuai policy, bukti C:/ERP/accounting-head-ops-project-denied-20261007.png. Agent tidak mengganti akun/tema pengguna; tab QA sementara ditutup. Screenshot cashflow sebelumnya tertimpa respons akses ditolak dan tidak digunakan sebagai bukti positif.

## Menjalankan ulang

Buat backup terbaru terlebih dahulu untuk batch baru. Dari root repo:

```powershell
node scripts/uat/seed-accounting-menu-uat.mjs --write --backup=C:/ERP/backups/dashboard-divisi/2026-10-07T06-13-59-543Z-cac16825.erpbackup --report=C:/ERP/accounting-menu-report.json
```

Backup di atas adalah referensi sebelum batch ini. Skrip hanya menulis APP_ENV=local/database MVP native, berhenti pada konflik marker, tidak memiliki reset/delete. Rekonsiliasi CLI menolak periode selain draft/milik batch, rekening selain fixture dan jurnal di luar batch. Jika pengguna mengubah/menutup fixture, hentikan dan tinjau; tidak menimpanya.

## Batas dan tindak lanjut

Selesai teknis seed Accounting; tidak menambah seed operasional Project/Cellular di luar omzet yang sebelumnya diminta. Master kategori/rekening merupakan contoh kas, bukan penetapan COA final perusahaan. Outstanding saat ini kewajiban, belum menambahkan workflow piutang pelanggan. Endpoint input/verifikasi saldo bank produksi, konflik state machine rekonsiliasi vs periode, kode legacy outstanding Agustus, integritas/idempotensi umum commit impor dan parser CSV tetap perlu pekerjaan tersendiri. Jangan menutup periode atau menganggap UAT berhasil secara bisnis melalui fixture ini. PNL/HPP/bonus/CMO, general ledger double entry, jurnal otomatis, data nyata dan go-live tetap terbuka. REQ tanpa PR.

Commit implementasi 74412cb sudah di-push ke origin/REQ. Tidak membuat PR. Akun Head Operasional Project tidak diberi akses Accounting untuk melewati penolakan; untuk inspeksi seed gunakan akun ACC yang mempunyai capability halaman.
