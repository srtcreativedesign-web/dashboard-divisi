# TODO implementasi ERP

Tanggal mulai: 6 Oktober 2026. Acuan: paket dokumen 00–20 yang ditetapkan pengguna sebagai acuan kerja. Keputusan terbuka tetap memerlukan definisi bisnis; penetapan acuan tidak mengisi rumus/format yang belum diketahui.

## Urutan dan status

Ringkasan terbaru 6 Oktober 2026: 01–03 selesai teknis; 04 parsial (retensi/delegasi/matriks final terbuka); 05 selesai lokal (produksi terpisah); 06 paket UAT siap, penerimaan pengguna belum dilakukan; 07a laporan omzet tahunan selesai tetapi PNL/bonus belum ditetapkan; 08a/b integritas dan UI dasar Project selesai, workflow lengkap terbuka; 09a Cellular manual selesai teknis, transfer/retur/settlement/margin terbuka; 10a rekap cuti/absensi manual selesai teknis; parent 10–13 masih parsial/belum selesai. Bukti terbaru: 250 backend/97 web, typecheck/lint/build/pint lulus; 36 cek privilege; smoke HR 25 akun/125 pemeriksaan dan enam probe constraint native lulus. [Penutupan teknis dan sisa](40_HASIL_IMPLEMENTASI_DAN_PEKERJAAN_TERBUKA.md). Tidak menyamakan tes teknis dengan penerimaan bisnis.

- [x] TODO-01 / BL-01 — tetapkan paket dokumen sebagai acuan dan buat tracker. Peran: Senior Product Manager.
- [x] TODO-02 / BL-02/03/06 — perbaiki regresi fondasi laporan Accounting: fixture eksplisit, status, scope dan saldo belum tersedia. Peran: Senior Fullstack Programmer + Application Security Engineer. Status: selesai teknis; 54 tes terkait lulus (593 assertions), formatter selesai. Penerimaan bisnis tetap terpisah.
- [x] TODO-03a / BL-02 — inventaris suite backend penuh: 149/212 lulus, 61 gagal, 2 error. Rincian: [inventaris regresi](22_INVENTARIS_REGRESI_BACKEND.md). Peran: Senior Fullstack Programmer.
- [x] TODO-03b / BL-02 — backend legacy yatim dikeluarkan; ringkasan BOD dibangun ulang; kontrak role/fixture diselaraskan. 175/175 tes backend lulus (1261 assertions). Peran: Senior Fullstack Programmer + Application Security Engineer. [Rincian](23_RESTRUKTURISASI_BACKEND_MVP.md).
- [ ] TODO-04 / BL-03 — keamanan keseluruhan; bagian berikut memisahkan hasil dan sisa pekerjaan. Peran: Application Security Engineer.
- [x] TODO-04a — validitas akun/snapshot JWT, scope penugasan/outlet dan path dokumen Project; UI dokumen mengikuti role. 184/184 tes backend lulus (1290 assertions); dua tes UI baru. [Bukti](24_KEAMANAN_AKSES_DAN_DOKUMEN.md). Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Designer.
- [x] TODO-04b — cookie HttpOnly/CSRF, reset seluruh sesi, revocation fail-closed dan UI logout jujur. 193 backend, 73 web, 2 contracts lulus; migrasi PostgreSQL diterapkan. [Bukti](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md). Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Designer.
- [x] TODO-04c — inventaris/migrasi berkas Project publik pada database MVP: 0 record/berkas publik, command backup/checksum teruji dan diterapkan. [Bukti/batas](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md). Peran: Application Security Engineer + Senior Fullstack Programmer.
- [ ] TODO-04d — keamanan lanjutan; rincian di bawah tetap terbuka. Peran: Application Security Engineer + Senior Product Manager.
- [x] TODO-04d-1 — audit wajib auth/omzet/voucher dan mutasi API terlindungi, rollback database/kompensasi berkas, histori master append-only runtime. 204 backend tests (1378 assertions) dan 30 cek privilege lulus; smoke PostgreSQL membuktikan audit/trace tersimpan. [Bukti/batas](27_AUDIT_WAJIB_AKSI_KRITIS.md). Peran: Application Security Engineer + Senior Fullstack Programmer.
- [ ] TODO-04d-2 — klasifikasi data pribadi, retensi dan prosedur koreksi/penghapusan. Aturan retensi perlu keputusan pemilik data; jangan menghapus histori otomatis tanpa aturan. Peran: Senior Product Manager + Application Security Engineer.
- [x] TODO-04d-2a — klasifikasi awal dan prosedur koreksi/permintaan penghapusan didokumentasikan; retensi final dan implementasi penghapusan tetap terbuka. [Acuan](32_KLASIFIKASI_DAN_KOREKSI_DATA.md). Peran: Senior Product Manager + Application Security Engineer.
- [ ] TODO-04d-3 — review hak baca rinci per role/objek/field dan uji akses negatif. Scope/capability fondasi sudah ada; delegasi dan akses data sensitif belum disepakati rinci. Peran: Application Security Engineer + Senior Product Manager + Senior Product Designer.
- [x] TODO-04d-3a — izin API/service jurnal diselaraskan dengan view:acc_journal, batas objek/periode/rekening ACC, preview impor dan UI mengikuti izin commit. 208 backend/75 web lulus. [Bukti/batas](28_HAK_BACA_JURNAL_DAN_BATAS_OBJEK.md). Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Designer. Matriks field sensitif belum final; TODO-04d-3 tetap terbuka.
- [x] TODO-04d-4 — scanner ClamAV native untuk tiga endpoint unggahan, karantina privat, penolakan error/timeout/deteksi, audit dan command readiness. 218 backend tests (1503 assertions) lulus; engine dan API aktif menolak EICAR. [Bukti/batas](29_SCANNER_UNGGAHAN_DAN_KARANTINA.md). Peran: Application Security Engineer + Senior Fullstack Programmer.
- [x] TODO-04d-3b — proyeksi field ringkasan, capability detail Accounting, menu/route/API, batas periode dan pembersihan cache lintas login; aturan awal konservatif, matriks bisnis final tetap terbuka. [Bukti](31_PROYEKSI_AKSES_ACCOUNTING.md). Peran: keempat peran.
- [x] TODO-04d-3c — kontak/rekening vendor Project dibatasi pada list/detail; uji enam role pembaca, pengelola, BOD dan domain lain. [Bukti/batas](35_INTEGRITAS_PROJECT_DAN_VENDOR.md). Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Designer. Hak nilai kontrak/RAB, delegasi/PIC dan matriks final tetap terbuka.
- [x] TODO-04d-4-ops — jadwal update/probe scanner native, monitoring hasil, lock satu host dan rekonsiliasi sisa karantina; task Windows berhasil diuji. [Bukti/batas deployment](30_OPERASI_SCANNER_NATIVE.md). Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Manager. Kapasitas multi-host produksi tetap memerlukan rancangan deployment.
- [x] TODO-05 / BL-04 — backup terenkripsi/restore database terpisah, runtime/migrator/read-only; 28 cek privilege dan 3 tes guard lulus. [Bukti/batas lokal](26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md). Peran: Senior Fullstack Programmer + Application Security Engineer.
- [ ] TODO-05-prod — jadwal/retensi/offsite/key recovery, RPO/RTO dan latihan recovery server baru; keputusan produksi belum ditetapkan. Peran: Senior Product Manager + Application Security Engineer.
- [x] TODO-05a — backup terenkripsi otomatis Windows lokal harian/login; task dan restore 54 tabel/empat berkas ke database latihan berhasil. [Bukti/batas](34_BACKUP_OTOMATIS_NATIVE.md). Peran: Senior Fullstack Programmer + Application Security Engineer. Offsite/retensi/key recovery dan SLA produksi tetap terbuka.
- [ ] TODO-06 / BL-05 — UAT omzet H+1 dan voucher semua aktor, error/koreksi/selisih. Peran: Senior Product Designer + Senior Fullstack Programmer.
- [x] TODO-06a — paket skenario UAT omzet/voucher, mapping bukti tes dan format pencatatan hasil siap. [Acuan](33_UAT_TEKNIS_OMZET_DAN_VOUCHER.md). Peran: Senior Product Designer + Senior Fullstack Programmer + Senior Product Manager. Pelaksanaan/penerimaan pengguna tetap terbuka.
- [ ] TODO-07 / BL-06/10 — COA/periode/jurnal/outstanding/cashflow dan formula PNL. Peran: Senior Product Manager + Senior Fullstack Programmer. Dependensi: DEC-05.
- [ ] TODO-08 / BL-07 — detail/penerimaan Project, RAB/progres/termin/dokumen. Peran: Senior Product Manager + Senior Product Designer + Senior Fullstack Programmer. Dependensi: DEC-07.
- [x] TODO-08a — validasi induk RAB/tanggal efektif/search/pagination dan form vendor tambah/edit mengikuti role; 230 backend/80 web lulus. [Bukti](35_INTEGRITAS_PROJECT_DAN_VENDOR.md). Peran: keempat peran. Workflow bisnis lengkap dan penerimaan tetap terbuka.
- [ ] TODO-09 / BL-08 — alur Cellular lengkap; discovery produk, sumber manual dan stok jumlah sudah dijawab pengguna. Peran: Senior Product Manager + Senior Product Designer + Senior Fullstack Programmer. Dependensi: DEC-08.
- [ ] TODO-10 / BL-09 — cuti/absensi/bonus/persediaan/setoran Accounting. Peran: Senior Product Manager + Senior Fullstack Programmer. Dependensi: formula/sumber/master.
- [ ] TODO-11 / BL-11 — Ecsys/AP, kontrak, pas dan surat. Peran: Senior Product Manager + Senior Fullstack Programmer + Application Security Engineer. Dependensi: DEC-09 dan format data.
- [ ] TODO-12 / BL-12 — definisi CMO dan verifikasi pajak; implementasi setelah bukti tersedia. Peran: Senior Product Manager. Dependensi: DEC-02/06.
- [ ] TODO-13 — release gate, UAT pengguna, operasional dan dokumentasi hasil. Peran: keempat peran.

- [x] TODO-04d-3d — UI tambah Project/RAB/milestone/penandaan/dokumen mengikuti role; metadata dokumen tidak mengirim path privat. [Bukti](38_UI_PROJECT_DAN_BATAS_AKSI.md). Peran: Senior Product Designer + Senior Fullstack Programmer + Application Security Engineer.
- [x] TODO-07a / ACC-S10 — tracking omzet validated 12 bulan dan komparasi outlet, desimal eksak dan nol/null dibedakan. [Bukti](37_TRACKING_OMZET_TAHUNAN.md). Peran: Senior Product Manager + Senior Product Designer + Senior Fullstack Programmer.
- [x] TODO-08b / PRJ-01 — form tambah proyek berfungsi; nominal/tanggal tervalidasi; penandaan pembayaran dijelaskan sebagai administratif. [Bukti](38_UI_PROJECT_DAN_BATAS_AKSI.md). Peran: Senior Product Designer + Senior Fullstack Programmer + Application Security Engineer.
- [x] TODO-09a / CEL-02/03/04 — katalog SIM/aksesori, mutasi jumlah, penjualan manual dan pembatalan sekali. Migrasi native diterapkan; ledger append-only, stok negatif ditolak dan audit wajib. [Bukti/batas](39_CELLULAR_MANUAL_DAN_STOK_JUMLAH.md). Peran: keempat peran. Tidak menutup CEL-05–08, HPP/margin, atau integrasi Accounting.
- [x] TODO-11a / ACC-A06/ACC-S07 — lampiran privat voucher dengan scan, version/parent/checksum, audit dan UI upload/download. [Bukti](36_LAMPIRAN_VOUCHER_ACCOUNTING.md). Peran: keempat peran. Tidak menutup integrasi AP/Ecsys atau kontrak/pas/surat.

- [x] TODO-10a / ACC-A01/ACC-A02 — master pegawai minimal, rekap cuti dan absensi manual, histori koreksi/void, version/overlap/duplikasi dan capability HR terpisah. [Bukti/batas](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Peran: keempat peran. Kalender/hak cuti/approval internal/gaji/bonus dan UAT pengguna tetap terbuka.

- [x] TODO-10b / ACC-A10 tahap manual — setoran per omzet/kanal tervalidasi, penerimaan bertahap Finance, referensi bukti, pembatalan catatan, histori/version/duplikasi/alokasi dan audit wajib. [Bukti/batas](42_REKAP_SETORAN_MANUAL.md). Peran: keempat peran. Unggahan bukti setoran, deposit gabungan, settlement/fee/jurnal otomatis dan UAT pengguna tetap terbuka.

## Penerimaan pekerjaan

ENT-03a-2 penelusuran setoran per sumber selesai teknis pada 7 Oktober 2026: [scope/bukti](49_PENELUSURAN_SETORAN_PER_SUMBER.md). Gate lulus 267 backend/118 web/dua contracts; daftar sumber mencakup semua tanggal dan kembali ke daftar bulanan. Tidak menutup jurnal/PNL atau UAT.

ENT-03a pencocokan omzet/setoran selesai teknis pada 7 Oktober 2026: [scope/bukti](48_PENCOCOKAN_OMZET_DAN_SETORAN.md). Tidak menutup TODO-07 (PNL/jurnal) atau penerimaan bisnis; laporan hanya membandingkan catatan sumber/alokasi/penerimaan.

Jalur kesiapan enterprise sejak 7 Oktober 2026: [TODO dan urutan ENT-01–09](46_TODO_KESIAPAN_ENTERPRISE.md). ENT-01 dimulai dari gate teknis lokal serta konfigurasi CI REQ. Verifikasi remote masih terblokir billing GitHub; tidak menutup TODO-13 atau menyatakan kesiapan produksi.

Checklist selesai hanya jika hasil dan bukti dicatat. Tes teknis bukan sign-off bisnis. Tracker rinci dan log tetap disimpan pada Tasks/dashboard-divisi-mvp serta Dashboard.md. Tidak ada estimasi tanggal yang belum didukung scope/dependensi.

## Jalur UI atas arahan pengguna — 6 Oktober 2026

- [x] TODO-UI-01 — tahap pertama Accounting: dashboard, omzet, voucher, setoran dan navigasi. [Bukti/batas](43_AUDIT_DAN_PERBAIKAN_UI_ACCOUNTING.md). Peran: keempat peran. Selesai teknis dan inspeksi Admin; bukan UAT semua role.
- [ ] TODO-UI-02 — audit/perapihan HR, Project dan Cellular; data terisi/tabel panjang, tema gelap, responsivitas dan UAT per role. Peran: Senior Product Designer + Senior Product Manager + Senior Fullstack Programmer + Application Security Engineer.
- [x] TODO-UI-01b — penyempurnaan dashboard Accounting: header, pemilih periode, kartu pekerjaan, keadaan kosong/error dan panduan bernomor. [Bukti/batas](45_PENYEMPURNAAN_UI_ACCOUNTING.md). Peran: keempat peran. 20 tes Accounting, lint/typecheck/build dan inspeksi Admin desktop/mobile lulus; UAT semua role tetap terbuka.


- [x] TODO-UI-02a / ENT-09a — perbaikan teknis Project/Cellular/HR: pagination, request lama, konteks koreksi/pembatalan, akses keyboard, kontainer tabel dan tema. [Scope/bukti](50_PENYELESAIAN_TEKNIS_UI_LINTAS_MODUL.md). Peran: keempat peran. Gate final 267 backend/128 web/dua contracts lulus. Parent TODO-UI-02 dan UAT semua role/data nyata tetap terbuka.

Ringkasan per 7 Oktober 2026: [status dan dependensi seluruh pekerjaan](51_STATUS_DAN_DEPENDENSI_PENYELESAIAN.md). Tidak menutup item bisnis/produksi melalui tes teknis.

- [x] TODO-08c / PRJ-UI-003 — direktori vendor lengkap dengan pencarian/pagination, respons lama, pemisahan hasil simpan dan reload serta batas kontak tetap. [Scope/bukti](52_DIREKTORI_VENDOR_PROJECT.md). Peran: keempat peran. Gate final exit 0: 268 backend/2219 assertions, 134 web, dua contracts dan seluruh guard gate/policy/database/scanner. Lint/typecheck/build/Pint lulus. Workflow pembayaran, approval dan UAT tetap terbuka.

- [x] TODO-UI-02b / TODO-07b / UI-ACC-004 — tema terang/gelap Project/Accounting dan kelanjutan jurnal: nominal string/saldo belum tersedia, konteks periode/pending/filter/retry. Peran: Senior Product Designer + Senior Fullstack Programmer. 144 web/typecheck/build lulus; lint hasil pull masih 105 error. [Scope dan batas](54_TEMA_DAN_JURNAL_ACCOUNTING.md). Parent jurnal/PNL/UAT tetap terbuka.

- [x] ACC-VCH-001 — Voucher Pengajuan Pengeluaran Admin: jenis operasional, form identitas/pembayaran/referensi, rekening encrypted/masked, pratinjau dan PDF. Peran: keempat peran. 270 backend, 149 web, typecheck/build/lint file berubah serta 38 pemeriksaan database lulus. Migrasi additive setelah backup. Scope/batas: [dokumen 55](55_VOUCHER_PENGELUARAN_ADMIN.md). Admin ACC pusat; pembayaran nyata/BAST/penambahan izin Admin divisi lain tidak termasuk. Lint global development dan UAT bisnis tetap terbuka.

- [x] ACC-PAY-001 — Realisasi voucher oleh Finance dengan bukti wajib: sebagian/lunas, nominal presisi, versi/duplikasi, status/sisa di daftar/detail/PDF, dan pembatalan catatan oleh Manager. Peran: keempat peran. [Scope/bukti](56_REALISASI_PEMBAYARAN_VOUCHER.md). 154 web/typecheck/build/lint file berubah/policy dan 38 pemeriksaan database lulus. Migrasi additive sesudah backup, tanpa seed/transaksi native. Jurnal otomatis/mapping akun, UAT dan lint global tetap terbuka.

- [x] ACC-SEED-001 — Delapan skenario voucher UAT tersimpan melalui API pada PostgreSQL; seed idempotent, pengujian role/CSRF/versi/nominal/proof/audit dan perbaikan tempdir scanner. Peran: keempat peran. 88 pemeriksaan native, 277 backend/2346 assertions, 38 pemeriksaan database, scanner/Pint/lint seeder lulus. [Scope/bukti](57_SEED_UAT_DAN_KEAMANAN_VOUCHER.md). Hanya voucher; UAT bisnis/pentest/produksi tetap terbuka.

- [x] ACC-DASH-002 — Dashboard Accounting berbasis KPI/tren/antrean role/status/jadwal realisasi dan drill-down bulan/voucher. Keempat peran. 159 web, 279 backend/2378 assertions, 53 pemeriksaan native, typecheck/build/lint scoped/Pint/policy lulus. [Scope/bukti](58_DASHBOARD_ACCOUNTING_PEMANTAUAN.md). Data dari database, tanpa migrasi/seed tambahan; UAT bisnis dan produksi tetap terbuka.

- [x] ACC-SEED-002 — Omzet harian UAT Cellular dua shift: 1–30 September dan 1–7 Oktober, 74 rekap (72 validated/2 draft). API berizin H+1/Manager/Accounting, 358 event/audit, pengulangan idempotent; 536+179 pemeriksaan native, lint/sintaks seeder dan delapan tes dashboard lulus. Keempat peran. [Scope/bukti](59_SEED_OMZET_HARIAN_SEPTEMBER_OKTOBER.md). Tidak memposting jurnal atau membuat stok/setoran; UAT bisnis tetap terbuka.

- [x] ACC-SEED-003 — Seed menu Accounting September/Oktober: periode/master, 20 jurnal termasuk 4 impor, 8 outstanding, 12 setoran/8 penerimaan, 4 pegawai/48 absensi/4 cuti, 4 saldo bank UAT. Keempat peran. 189 pemeriksaan native/idempotence, 281 backend/2403 assertions, 161 web; parser JSON dan hardcode/kontras cashflow diperbaiki. [Scope/bukti](60_SEED_MENU_ACCOUNTING.md). Saldo bank belum diverifikasi; UAT bisnis/produksi dan backlog layanan legacy tetap terbuka.

- [x] UI-ACC-005 — Penajaman visual dashboard Accounting: kartu omzet utama, hierarki angka, antrean koreksi dan disclosure metrik. Keempat peran. 12 tes dashboard/role, lint scoped, typecheck/build dan QA Admin desktop terang/gelap/mobile lulus. [Scope/bukti](61_PENAJAMAN_VISUAL_DASHBOARD_ACCOUNTING.md). Kontras sidebar gelap/cache identitas antartab, UAT bisnis dan lint global tetap terbuka. REQ tanpa PR.

## Lanjutan 8 Oktober 2026 — laporan Cellular

- [x] ACC-CEL-PREVIEW-001a — adapter lima sumber DATA CELLULAR T3, preview API/UI, akses pusat, scanner dan test (dokumen 65).
- [ ] ACC-CEL-PREVIEW-001b — QA visual gabungan, terang/gelap/mobile dan penerimaan pemilik data.
- [ ] ACC-CEL-STAGING-002 — staging privat, versi/duplikat persisten, audit dan workflow penyelesaian sumber.
- [ ] ACC-CEL-SCOPE-003 — pemetaan semua outlet dan akses Admin Cellular sesuai scope.
- [ ] ACC-CEL-INTEGRATION-004 — sumber operasi/shift ke H+1, Accounting dan settlement. Formula fee/HPP/bonus/CMO menunggu keputusan bisnis.
- [ ] ENT-DEPENDENCY-PATCH — remediasi tiga advisory baseline Laravel/CommonMark dan regresi.

- [x] ACC-WORK-001a — ruang kerja Admin/Staff Accounting dari omzet/voucher persisten, antrean role, deep-link/URL context dan fasilitas sumber pendukung. Scope/verifikasi dokumen 66.
- [ ] ACC-WORK-001b — walkthrough pengguna serta integrasi staging sumber, jadwal laporan dan rekonsiliasi Ecsys. Tidak ditutup melalui perubahan UI.

- [x] ACC-RESET-001 — Reset navigasi Accounting enam kelompok submenu, antrean per role, dashboard acuan visual Project dan register/detail persisten. Dokumen 67 menggantikan keputusan navigasi 66. Regresi 195/196 + perbaikan selector/4 tes ulang lulus; typecheck/build/lint scoped/QA Staff terang-gelap-mobile lulus. REQ tanpa PR.
- [ ] ACC-RESET-002 — Walkthrough native semua role, penerimaan pengguna dan iterasi fungsi menu target (staging/Ecsys/ledger/PNL/bonus/CMO); tidak ditutup dengan reset UI.

- [x] ACC-FIRST-USE-001 — Arahan mulai kerja per role di dashboard dan petunjuk urutan register; 19 tes/typecheck/build/lint scoped/QA Staff native lulus. Dokumen 68. UAT pengguna pertama dan staging/alur sumber tetap terbuka.

- [x] ACC-DASH-003 — Meja kerja dashboard berisi transaksi omzet/voucher per role, prioritas antrean berisi, konteks sumber, deep-link dan pagination nyata; mobile vertikal. Dokumen 69; 200 tes/typecheck/lint scoped/build/QA Staff native lulus. REQ tanpa PR.
- [ ] ACC-DASH-003-UAT — Walkthrough pengguna pertama dan seluruh role native, penilaian pengguna. Jadwal/staging/pemeriksaan sumber berdampingan tetap terbuka.

- [x] UI-SYSTEM-001a — Tetapkan UI Project sebagai dasar bahasa visual lintas divisi; header bersama dan konteks kerja Accounting berbasis periode/role/cakupan diterapkan. Peran: keempat peran. [Keputusan dan batas](70_STANDAR_UI_LINTAS_DIVISI.md). Penyelarasan seluruh halaman detail dan UAT semua role tetap terbuka.
- [ ] UI-SYSTEM-001b — Terapkan standar bersama pada daftar/detail/form Accounting, lalu Cellular, dengan konteks dan tindakan khusus role; lakukan QA terang/gelap/mobile dan UAT pengguna.
- [x] ACC-IA-001a — Arsitektur menu Accounting diubah menjadi ruang kerja berbasis pekerjaan; register, omzet dan voucher mendapat konteks kerja serta header bersama. Peran: keempat peran. [Keputusan dan batas](71_ARSITEKTUR_FITUR_ACCOUNTING_BERBASIS_PEKERJAAN.md). Fitur yang belum memiliki definisi/backend tetap backlog.
- [x] ACC-IA-001b — Selaraskan isi setoran, pencocokan, jurnal, periode, hutang-piutang, rekonsiliasi, cashflow, HR, master dan impor dengan kontrak halaman. Seluruh 17 halaman Accounting memakai header dan surface contract bersama; 34 tes role/routing lulus. Audit lintas divisi pada dokumen 72.
- [x] UI-XDIV-001 — Accounting dan Cellular dimigrasikan ke bahasa visual Divisi Project untuk workspace, tabel, panel, dan input; Divisi Project dipertahankan tanpa perubahan. Isi dan kewenangan tetap khusus divisi/role. [Audit dan bukti](72_AUDIT_KESELARASAN_UI_LINTAS_DIVISI.md). Peran: Senior Product Designer + Senior Fullstack Programmer.
- [ ] UI-XDIV-002 — UAT visual per role pada resolusi desktop/mobile dan tema terang/gelap bersama pengguna bisnis; catat temuan sebagai backlog terpisah tanpa mengubah matriks kewenangan.
