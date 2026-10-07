# Rencana pengujian, UAT, dan bukti penerimaan

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Fullstack Programmer + Senior Product Manager + Application Security Engineer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Strategi

Unit untuk rumus/state/permission yang bermakna; feature API untuk auth/scope/transaksi; PostgreSQL integration untuk constraint/decimal/lock; frontend untuk formulir dan role; browser UAT untuk alur kerja; exploratory untuk data ekstrem dan gangguan jaringan. SQLite tidak cukup membuktikan concurrency PostgreSQL atau restore produksi.

## Skenario UAT

### UAT-01 — Login dan scope

Prasyarat: 25 akun anonim tersedia; delapan role pada tiga divisi plus BOD.
Hasil yang diharapkan: Login sesuai identitas; scope tidak dapat dipalsukan; menu mengikuti capability.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-02 — Omzet H+1

Prasyarat: Admin ACC, outlet aktif, tanggal H.
Hasil yang diharapkan: Simpan/ajukan pada H+1; akhir 23.59 WIB diterima dan hari berikutnya ditolak tanpa izin.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-03 — Omzet selisih/koreksi

Prasyarat: Staff Accounting dan Manager terpisah.
Hasil yang diharapkan: Selisih membutuhkan alasan/persetujuan; correction dan resubmit menjaga histori.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-04 — Izin terlambat

Prasyarat: Rekap lewat tenggat dan Manager.
Hasil yang diharapkan: Izin sekali pakai/expiry bekerja; perubahan outlet/tanggal/shift mencabut izin.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-05 — Voucher tagihan

Prasyarat: Admin pembuat → Staff Accounting → Manager.
Hasil yang diharapkan: Sumber/nominal tercatat; approve terkunci; tidak mengklaim paid.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-06 — Voucher pembelian/koreksi

Prasyarat: Voucher PURCHASING dan alasan return.
Hasil yang diharapkan: Koreksi menjaga snapshot; resubmit membersihkan keputusan aktif; stok tidak berubah otomatis.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-07 — Duplikat/concurrency

Prasyarat: Dua request versi/sumber sama.
Hasil yang diharapkan: Duplikat source ditolak, versi lama tidak menimpa, event gagal tidak tersimpan.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-08 — Master/periode/jurnal

Prasyarat: COA dan aturan periode yang disepakati.
Hasil yang diharapkan: Data valid, status periode membatasi tindakan, transaksi dapat direkonsiliasi; aturan final menunggu review.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-09 — Cashflow/outstanding

Prasyarat: Sumber anonim dan pembayaran diketahui.
Hasil yang diharapkan: Saldo/total cocok sumber; payment sebagian/koreksi sesuai kontrak yang disetujui.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-10 — Project dan dokumen

Prasyarat: Proyek/RAB/milestone/file anonim.
Hasil yang diharapkan: CRUD dasar, total dan unduh sesuai scope; file salah ditolak; payment toggle tidak menggantikan bukti.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-11 — Cellular direktori

Prasyarat: Akun CELL dan dua outlet sumber berbeda.
Hasil yang diharapkan: Hanya outlet CELL sesuai izin tampil; fitur penjualan/gudang belum dianggap tersedia.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-12 — Laporan Accounting lanjutan

Prasyarat: Contoh formula/sumber telah disepakati.
Hasil yang diharapkan: PNL/bonus/pajak/kontrak/pas/surat/komparasi belum diuji operasional; skenario rinci diturunkan dari ACC-A/ACC-S sebelum kode.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-13 — Keamanan dan privasi

Prasyarat: Daftar endpoint/capability dan objek salah.
Hasil yang diharapkan: Tanpa auth, role/scope/IDOR/self-approval/file/leak dicegah; secret tidak masuk log/ekspor.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-14 — Responsif dan error

Prasyarat: Mobile/desktop, keyboard, jaringan/error.
Hasil yang diharapkan: Form dapat diselesaikan, error dapat ditindaklanjuti, dialog/fokus/scroll berfungsi.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

### UAT-15 — Backup dan recovery

Prasyarat: Backup di lingkungan terpisah.
Hasil yang diharapkan: Restore schema/data/file cocok sumber; RPO/RTO diukur, bukan diklaim sebelum pengujian.
Bukti: catat aktor, input anonim, response/trace, screenshot atau rekonsiliasi.
Status UAT: belum diterima oleh pemilik proses.

## Bukti teknis yang sudah tercatat, 6 Oktober 2026

Delapan tes backend voucher lulus (101 assertions); lima tes UI voucher lulus. Seluruh 67 tes web dan dua contracts lulus pada regresi terakhir. Enam tes LoginPage lulus setelah password contoh dihapus. Typecheck/lint/build/formatter yang relevan lulus. Seluruh 25 akun uji berhasil login melalui proxy frontend. Admin ACC membuka form voucher di browser. Constraint duplikat/presisi nominal PostgreSQL diuji lewat rollback.

Regresi backend terkait: 118 tes/115 lulus/tiga kegagalan lama AccountingFoundationTest. Suite penuh: 210 tes/144 lulus/64 gagal/dua error. Tidak ada klaim seluruh CI hijau, coverage 80% tercapai, pembayaran lengkap, atau UAT seluruh role/fitur selesai.

## Pencatatan hasil

Setiap hasil mempunyai requirement ID, test ID, tanggal, lingkungan/versi, penguji, input anonim, actual versus expected, bukti, severity dan tindak lanjut. Jangan menyimpan JWT/password/data pribadi di screenshot/output. Test teknis passing tidak menggantikan sign-off pengguna.

## Release gate yang diusulkan

Semua kebutuhan rilis memiliki AC dan bukti; blocker keamanan/data/angka salah selesai; regresi yang relevan lulus; suite lama diperbarui menurut keputusan MVP, bukan tes dihapus untuk menghijaukan hasil; PostgreSQL integration/restore diuji; UAT ditandatangani pemilik proses. Pengecualian terdokumentasi dan disetujui, bukan dibiarkan diam-diam.

## Bukti tambahan ACC-RPT-001 — 6 Oktober 2026

54 tes terkait lulus (593 assertions). Fixture laporan dibuat eksplisit pada SQLite in-memory; meliputi approved/closed untuk BOD, penolakan draft/mutasi, status alias, filter invalid/array, scope ACC dan saldo null/daftar kosong. Full backend terbaru: 149/212 lulus, 61 gagal, 2 error; [rincian](22_INVENTARIS_REGRESI_BACKEND.md). Ini bukti teknis, bukan sign-off UAT atau CI hijau.

## Bukti tambahan FND-BACKEND-MVP-CLEANUP

175/175 tes backend lulus (1261 assertions). Jumlah tes berubah karena enam suite endpoint non-MVP dihentikan dan 16 boundary case ditambahkan. BOD diuji tanpa data acak, pembatasan tiga divisi aktif, role/anonymous, tanggal tidak valid, data null/config, serta larangan approval periode Admin. Hasil lokal C:/ERP/backend-rebuilt-2026-10-06.txt dan .xml. Ini kelulusan suite backend saat ini pada SQLite, bukan bukti browser UAT/restore PostgreSQL atau seluruh gate produksi selesai.

## Bukti FND-SEC-ACCESS-001

184/184 tes backend lulus (1290 assertions); seluruh 69 tes web lulus termasuk dua tes ProjectDocumentsPage baru. Typecheck/lint/build/formatter selesai. Pengujian tambahan session invalidation, scope pegawai/outlet, Project IDOR/path/delete dan UI pembaca/Admin. [Rincian dan residual risk](24_KEAMANAN_AKSES_DAN_DOKUMEN.md). SQLite/storage fake tidak menggantikan UAT browser pengguna atau pengujian pemulihan produksi.

## Bukti FND-SEC-SESSION-002

193/193 tes backend lulus (1336 assertions), 73/73 tes web dan 2/2 tes contracts lulus. Typecheck, lint, build dan formatter scoped selesai. Backend memakai SQLite in-memory; storage migrasi diuji dengan fake disk. Build memiliki peringatan ukuran chunk Cashflow dan anotasi dependensi Zod, tetapi berhasil. Bukti backend: C:/ERP/backend-session-final-2026-10-06.xml.

Meliputi CSRF hilang/salah/lintas sesi, origin login, cookie production, reset multi-sesi, outage revocation, migrasi backup/idempotensi/tujuan konflik/orphan, token browser dan UI logout gagal. Smoke test cookie melalui server native/proxy lulus. [Bukti deployment dan batas](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md).

## Bukti FND-DB-OPS-001

28 cek privilege PostgreSQL dengan rollback/0 baris uji dan tiga tes parser/guard lulus. Restore 54 tabel, schema/constraint/index/sequence dan empat berkas terverifikasi. Status constraint Project diuji source/restore, ciphertext tampered ditolak sebelum database dibuat; smoke cookie server aktif lulus. [Bukti dan batas](26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md).

## Bukti FND-SEC-AUDIT-003

204/204 tes backend lulus (1378 assertions), termasuk 11 tes baru CriticalAuditTest. Lint dan formatter scoped lulus; diff check bersih. Pengujian rollback menggunakan SQLite in-memory/fake storage; tidak menghapus tabel PostgreSQL operasional. Bukti suite: C:/ERP/backend-critical-audit-2026-10-06.xml.

11 kasus tambahan audit outage/nested rollback, auth/session, omzet/voucher/events/approval, Project/file/trace. PostgreSQL runtime: 30 privilege checks dan dua audit auth dengan trace tersimpan; cookie/CSRF/logout smoke lulus. [Rincian/batas](27_AUDIT_WAJIB_AKSI_KRITIS.md).

## Bukti scanner — 6 Oktober 2026

218 backend tests lulus, 1503 assertions. Process fake untuk regresi dipisahkan dari probe ClamAV native dan API aktif: clean lewat scan, EICAR ditolak, scanner hilang ditolak. Command erp:scan-check tersedia. UAT impor bisnis belum selesai karena periode/transaksi bisnis belum disediakan. [Rincian](29_SCANNER_UNGGAHAN_DAN_KARANTINA.md).

## Bukti akses dan operasi lanjutan

226 backend, 77 web, 2 contracts, 3 tes operasi scanner dan 3 tes guard database lulus. Typecheck/lint/build lulus, dengan warning ukuran chunk Cashflow dan anotasi Zod. Server aktif: 25 akun/125 pemeriksaan akses Accounting lulus. Windows task scanner dan backup exit 0; backup terbaru dipulihkan ke database latihan, 54 tabel/empat berkas cocok. [Skenario UAT omzet/voucher](33_UAT_TEKNIS_OMZET_DAN_VOUCHER.md) siap untuk pengguna; penerimaan bisnis tetap terbuka.

## Bukti integritas Project/vendor

230 backend/80 web lulus; empat tes integritas terakhir 82 assertions; formatter/typecheck/lint/build lulus. Native API: 11 akun/44 GET pencarian/validasi/scope lulus, tanpa transaksi contoh. Skenario vendor UI mencakup pembaca, tambah/edit dan gagal/retry. Penerimaan pengguna dan aturan bisnis Project tetap terbuka. [Rincian](35_INTEGRITAS_PROJECT_DAN_VENDOR.md).

## Pembaruan teknis 6 Oktober 2026

Kontrak dan kontrol terbaru: [lampiran voucher](36_LAMPIRAN_VOUCHER_ACCOUNTING.md), [omzet tahunan](37_TRACKING_OMZET_TAHUNAN.md), [UI Project](38_UI_PROJECT_DAN_BATAS_AKSI.md), [Cellular manual](39_CELLULAR_MANUAL_DAN_STOK_JUMLAH.md). Snapshot lampiran aktual telah diperbarui: 59 tabel, 36 migrasi, 103 route API dan capability terkini. Hasil/pending pada [dokumen 40](40_HASIL_IMPLEMENTASI_DAN_PEKERJAAN_TERBUKA.md). UAT pengguna tidak diganti dengan hasil tes fixture.

## Rekap HR manual — 6 Oktober 2026

ACC-A01/ACC-A02 kini memiliki master pegawai minimal, rekap manual dan histori koreksi/void. Hak view:acc_hr terpisah dari view:acc_detail, terbatas Manager/Admin/Staff Accounting ACC; Admin menulis rekap, Manager/Admin mengelola master. Tidak menghitung hak cuti/gaji/bonus atau menganggap referensi persetujuan sebagai approval ERP. AC, sumber, batas, API dan bukti pada [dokumen 41](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Snapshot metadata/policy telah diperbarui.

## Pembaruan ACC-A10 tahap manual — 6 Oktober 2026

Rekap setoran tersedia pada /accounting/setoran dan tujuh route /api/v1/accounting/deposits. Admin alokasi ke satu kanal omzet tervalidasi; Finance penerimaan aktual bertahap. Nominal eksak, referensi unik, version/row lock, histori dan audit wajib. Tiga tabel acc_deposits/acc_deposit_receipts/acc_deposit_events, event append-only pada runtime. Bukti berupa referensi eksternal; unggahan, settlement/fee/jurnal otomatis dan UAT tetap terbuka. [Acuan dan bukti lengkap](42_REKAP_SETORAN_MANUAL.md). Peran: keempat peran.
