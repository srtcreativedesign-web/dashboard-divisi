# Todo Penyelarasan Accounting dan Cellular dengan Kerangka Project

Tanggal mulai: 9 Oktober 2026
Branch kerja: `REQ`
Pemilik implementasi: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Quality gate 90/100 per role

Target penerimaan ditetapkan pada 10 Oktober 2026: setiap role Accounting dan Cellular wajib mencapai minimal 90/100. Nilai rata-rata divisi tidak dapat menutup role yang belum layak digunakan.

Komposisi penilaian:

- 35 poin cakupan pekerjaan utama role;
- 25 poin workflow end-to-end, status, PIC, SLA, bukti, dan drill-down;
- 25 poin UX: orientasi pertama, kejelasan tindakan, konsistensi Project, responsif, tema, aksesibilitas, dan state;
- 15 poin keamanan: capability backend, scope objek/divisi, maker-checker, audit, versioning, validasi, dan pembatasan data.

Syarat minimum tambahan:

- tidak ada role dengan skor di bawah 90;
- tidak ada fungsi palsu, angka hardcode, atau tombol tanpa hasil;
- alur kritis harus lulus pengujian role, integrasi, regresi, dan UAT pengguna;
- fitur yang bergantung pada kebijakan bisnis belum dapat memperoleh nilai penuh sebelum kebijakan disahkan;
- Project tetap menjadi acuan visual dan tidak diubah oleh jalur Accounting/Cellular.

Baseline audit 10 Oktober 2026:

- Accounting: Manager 64, Admin 74, Accounting 61, Finance 56, Admin Gudang 24.
- Cellular: Manager 67, Head Operasional 42, SPV 40, Leader 38, Admin 72, Admin Gudang 57, Accounting 56, Finance 39.

Urutan penutupan gap menuju 90:

1. Admin Gudang Accounting: inventory lifecycle dan keterhubungan dengan voucher/HPP.
2. Finance Cellular: settlement tunai, bank, EDC, QRIS, transfer aktual, dan rekonsiliasi.
3. Leader, SPV, dan Head Operasional Cellular: checklist shift, supervisi, eskalasi, PIC, dan SLA.
4. Accounting Cellular: paket H+1, ECSYS, settlement, persediaan/HPP, period close, dan PNL.
5. Finance Accounting: payment run, settlement, aging, dan rekonsiliasi lengkap.
6. Manager Accounting/Cellular: decision inbox, materialitas, delegasi, dan pemisahan tugas.
7. Admin Accounting/Cellular: penyatuan pekerjaan harian, bukti, tenggat, dan histori status.

## Batas pekerjaan

- Divisi Project adalah acuan bahasa visual dan dikerjakan oleh Elian.
- Pekerjaan dalam jalur ini hanya mengubah Accounting, Cellular, serta komponen bersama yang tidak mengubah perilaku Project.
- Struktur visual mengikuti Project; isi, alur, istilah, data, dan tindakan mengikuti kebutuhan setiap divisi dan role.
- Angka dan status harus berasal dari API/database. Kontrol yang belum tersedia tidak boleh dibuat seolah-olah sudah berfungsi.

## Definisi selesai per halaman

Sebuah halaman selesai apabila:

- memakai header, grid, kartu, panel, tabel, form, status, dan state yang selaras dengan Project;
- menjawab pekerjaan apa, statusnya, penanggung jawab, tenggat/konteks periode, dan tindakan berikutnya;
- menampilkan tindakan hanya untuk role yang memiliki capability;
- memiliki loading, error, empty, tema terang/gelap, serta perilaku responsif;
- lulus typecheck, pengujian relevan, build, dan pemeriksaan visual;
- tidak mengubah berkas Divisi Project.

## Tahap 1 — Fondasi dan audit

- [x] Tetapkan Project sebagai acuan visual, bukan ruang lingkup implementasi.
- [x] Audit navigasi, dashboard, Pekerjaan Saya, Penerimaan Harian, dan capability Cellular.
- [x] Inventarisasi halaman Accounting dan Cellular yang masih memakai pola lama atau panel kesiapan.
- [ ] Bentuk katalog komponen bersama yang aman digunakan tanpa mengubah Project.
- [ ] Dokumentasikan matriks halaman × role × tindakan untuk Accounting dan Cellular.

## Tahap 2 — Cellular

### Pusat kendali dan pekerjaan

- [x] Dashboard memakai header, KPI, panel, grafik, dan hierarchy visual Project.
- [x] Hubungkan dashboard dengan status penerimaan harian dan antrean role.
- [x] Ubah Pekerjaan Saya menjadi antrean nyata dari workflow database.
- [x] Bedakan antrean Admin, Accounting, Manager, Finance, Admin Gudang, Head Operasional, SPV, dan Leader.
- [x] Tambahkan ringkasan alur `draft → submitted → validated → approved/correction`.
- [x] Tambahkan tes role untuk Pekerjaan Saya; tes state kosong/gagal tetap terbuka.
- [x] Implementasikan kontrol shift Leader → SPV → Head Operasional → Manager dengan checklist, PIC, tenggat, koreksi, eskalasi, dan keputusan.
- [x] Hubungkan pekerjaan supervisi ke Antrean Pekerjaan berdasarkan role dan status database.

### Penerimaan dan penjualan

- [x] Rekap penerimaan harian memakai data database dan workflow approval.
- [x] Selaraskan komposisi form, filter, register, status, dan tindakan dengan pola Project.
- [x] Perjelas H+1 pukul 23.59 WIB, selisih, alasan koreksi, PIC, dan jejak pemeriksaan.
- [x] Selaraskan transaksi penjualan dan pembatalan: register, KPI periode, form bertahap, pratinjau stok dan nilai, detail audit, serta dialog koreksi.

### Persediaan dan master

- [x] Selaraskan Produk & Paket dengan pola register, detail, form bertahap, filter, status aktif, optimistic version, alasan perubahan, dan audit wajib.
- [x] Selaraskan Stok & Mutasi dengan pola register, detail transaksi, dan alur dokumen.
- [x] Bedakan pengalaman Admin Gudang dari role pembaca dan Manager pemeriksa.
- [x] Tambahkan indikator stok kritis yang dapat ditindaklanjuti per outlet.

### Pembukuan, pembayaran, laporan, integrasi

- [x] Ganti panel kesiapan Tagihan & Settlement dengan workflow Finance → Accounting berbasis closing disetujui.
- [x] Implementasikan settlement parsial tunai, QRIS, EDC, transfer, biaya kanal, tujuan dana, referensi, dan sisa rekonsiliasi.
- [x] Terapkan maker-checker, scope outlet, optimistic version, idempotency referensi, audit, dan larangan settlement terverifikasi melebihi closing.
- [x] Wajibkan bukti penerimaan dana settlement: storage privat, scanner, hash integritas, role/scope/version, unduh berizin, dan audit. Dokumen 98.
- [x] Satukan penjualan posted, closing H+1, settlement, kontrol shift, dan stok ke Kontrol Accounting berbasis data database.
- [x] Tampilkan readiness paket H+1, rekonsiliasi kanal, kontrol operasional, pengecualian, dan stok kritis per periode.
- [x] Kembangkan Buku Persediaan menjadi register terfilter yang dapat ditelusuri ke transaksi, bukti sumber, alasan, dan pelaku.
- [x] Bangun analitik operasional lintas sumber untuk penjualan posted, closing H+1, settlement, ECSYS, komparasi outlet/provider, dan drill-down harian.
- [ ] Lengkapi perbandingan langsung profil spreadsheet harian, pendapatan, dan omzet per shift setelah mapping kolom final disetujui pengguna.
- [x] Bangun staging impor spreadsheet dengan validasi, pratinjau, rekonsiliasi, idempotency, dan audit untuk profil harian, pendapatan, shift, ECSYS, dan update.
- [ ] Implementasikan PNL setelah metode HPP dan kebijakan pengakuan pendapatan ditetapkan.

## Tahap 3 — Accounting

- [x] Audit setiap halaman terhadap kerangka Project dan kebutuhan lima role: Manager, Admin, Accounting, Finance, Admin Gudang.
- [x] Selaraskan dashboard dan Pekerjaan Saya berdasarkan antrean dokumen aktual, termasuk meja kerja persediaan khusus Admin Gudang dan antrean approval Manager. Dokumen 99.
- [x] Selaraskan Omzet H+1 sebagai workbench operasional: antrean status, PIC berikutnya, tenggat H+1, indikator selisih, register terfilter, detail keputusan, dan form bertahap dengan pemeriksaan kesiapan.
- [x] Selaraskan Voucher Pengeluaran sebagai workbench lintas role: ringkasan antrean, PIC, prioritas, jatuh tempo, sisa pembayaran, form bertahap, kesiapan dokumen, lampiran, keputusan, realisasi, dan audit trail.
- [x] Selaraskan pencocokan dan jurnal sebagai rangkaian hilir dari omzet serta voucher tervalidasi.
- [x] Rombak Pencocokan Omzet–Setoran menjadi workbench periode: progres sumber, nilai omzet/alokasi/penerimaan, pengecualian, PIC berikutnya, status per sumber, dan rincian kanal responsif.
- [x] Rombak Jurnal menjadi workbench pembukuan: ringkasan periode, kelengkapan bukti, rujukan sumber, form bertahap, kesiapan draf, periode terkunci, koreksi berversi, dan pembatalan beralasan.
- [x] Rombak Rekap Setoran menjadi register rekonsiliasi sumber omzet, batas kanal, bukti, penerimaan Finance, sisa, status, dan audit trail.
- [x] Koreksi Cuti dan Absensi menjadi rekap read-only dari API sistem absensi kantor; pertahankan pemisahan rekap harian dan riwayat cuti tanpa form, approval, koreksi, atau pembatalan HR di ERP.
- [x] Selaraskan master data dan staging impor: outlet server, histori, periode terbuka, klasifikasi preview, pengakuan duplikat, dan capability commit. Dokumen 93.
- [x] Selaraskan hutang-piutang dan proyeksi cashflow: AP/AR, pihak lawan, periode, jatuh tempo, maker–executor–controller, versioning, audit, dan scope Accounting. Dokumen 94.
- [x] Selaraskan kontrol periode: state machine tunggal, PIC, alasan keputusan, readiness jurnal/lampiran/rekening/selisih, gate server, row lock, scope, dan audit. Dokumen 95.
- [x] Lengkapi laporan cashflow penuh, termasuk drill-down sumber, perbandingan periode, kualitas data, dan ekspor. Dokumen 96.
- [ ] Pisahkan pekerjaan input, pemeriksaan, persetujuan, realisasi, dan pemantauan berdasarkan role.
- [ ] Pastikan workflow Admin → Accounting → Manager → Finance memiliki PIC, status, waktu, alasan koreksi, dan audit trail.
- [x] Proyeksikan PIC berikutnya, aktivitas terakhir, waktu transisi, dan alasan dari event server ke register omzet/voucher tanpa membuka actor ID atau snapshot audit. Dokumen 100.
- [x] Terapkan konteks workflow aman yang sama pada Rekap Setoran, termasuk pergantian PIC Finance menjadi selesai setelah penerimaan penuh dan query daftar tanpa N+1. Dokumen 101.
- [x] Terapkan status, PIC berbasis state periode, aktivitas/waktu terakhir, dan alasan koreksi pada register Jurnal; catat unggahan bukti sebagai aktivitas transaksi dan batch histori daftar. Dokumen 102.
- [x] Hapus konsep PIC dan workflow HR internal; tampilkan sumber data, status kehadiran, periode, referensi, KPI, dan detail read-only. Dokumen 103. Parent tetap terbuka untuk konektor API, persediaan, staging, dan UAT pengguna.
- [x] Terapkan aktivitas terakhir, waktu WIB, PIC berbasis state, dan alasan koreksi pada register serta Berita Acara Persediaan tanpa membuka actor ID atau snapshot audit. Dokumen 104. Parent tetap terbuka untuk konektor absensi, staging, dan UAT pengguna.
- [x] Implementasikan Payment Run Finance berbasis voucher approved: prioritas, jatuh tempo, status realisasi, sisa, bukti, dan drill-down dokumen.
- [x] Ubah antrean Manager menjadi Decision Inbox terfokus dengan nominal, indikator risiko, konteks sumber, maker-checker, dan keputusan beralasan.
- [x] Implementasikan workflow Persediaan & Gudang: master, dokumen, approval, saldo, mutasi, role, versioning, audit, dan seed database.
- [x] Lengkapi UI multi-item dan berita acara cetak/simpan PDF.
- [x] Hubungkan voucher pembelian approved ke penerimaan dan mutasi persediaan, termasuk penerimaan parsial dan berita acara.
- [ ] Hubungkan nilai persediaan ke HPP setelah metode penilaian persediaan ditetapkan perusahaan.
- [ ] Implementasikan PNL, bonus, dan CMO hanya setelah kebijakan bisnis ditetapkan.

## Tahap 4 — Validasi lintas divisi

- [ ] Uji desktop, tablet, dan mobile pada tema terang serta gelap.
- [ ] Uji navigasi keyboard, focus state, label form, dan keterbacaan tabel.
- [ ] Uji isolasi divisi serta capability backend untuk setiap tindakan.
- [ ] Pastikan tidak ada angka, tombol, filter, ekspor, atau status semu.
- [x] Jalankan regresi teknis Accounting dan Cellular. Dokumen 97. UAT pengguna tetap terbuka.
- [ ] Lakukan UAT per role dan catat bukti visual.
  - [x] Browser UAT Rekap Kehadiran untuk Admin, Manager, Staff Accounting, dan Finance: read-only untuk pembaca serta penolakan role di luar cakupan tanpa tindakan HR internal. Dokumen 105.
  - [x] Browser UAT Persediaan untuk Admin, Admin Gudang, Manager, Staff Accounting, dan Finance: tindakan maker-checker, pembaca, serta penolakan akses terpisah sesuai role/state. Dokumen 105.
  - [x] Browser UAT desktop terang/gelap dan mobile 390×844 untuk Rekap Kehadiran; mobile Persediaan dan urutan fokus awal sidebar. Dokumen 105.
  - [x] Browser UAT tablet 768×1024 Persediaan, nama aksesibel tindakan, serta error/retry Rekap Kehadiran dan Persediaan. Dokumen 105.
  - [x] Browser UAT form dan register Omzet H+1 serta Voucher: desktop/mobile, urutan fokus awal, nama tindakan per dokumen, serta error/retry API. Dokumen 106.
  - [ ] Audit keyboard/focus menyeluruh untuk halaman Accounting dan Cellular lainnya.
    - [x] Rekap Kehadiran mempunyai pencarian/filter berlabel, jumlah hasil live, dan detail read-only melalui dialog native bersama.
    - [x] Persediaan Cellular mempunyai filter dokumen serta posisi stok berlabel dan keadaan kosong yang membedakan sumber kosong dari hasil filter kosong.
    - [x] Detail rekonsiliasi Analitik Cellular memakai dialog native bersama, menangani Escape, scroll lock, dan pemulihan fokus ke tombol pemicu. Dokumen 107.
    - [x] Form Settlement Finance memakai panel kerja aksesibel dengan fokus awal eksplisit dan pemulihan fokus ke tindakan sumber. Dokumen 107.
    - [x] Detail Closing H+1 dan alasan izin/koreksi memakai panel native bersama; alasan menerima fokus awal dan detail mengembalikan fokus ke baris sumber. Dokumen 107.
    - [x] Form dan detail Kontrol Shift memakai panel native bersama; detail memperlihatkan checklist, PIC, tenggat, prioritas, temuan, catatan pemeriksa, serta versi. Dokumen 107.
    - [ ] Migrasikan overlay mentah lain pada penjualan dan persediaan ke dialog bersama atau dialog native setara.

## Urutan eksekusi aktif

1. UAT visual terang/gelap, desktop/mobile, dan walkthrough semua role bersama pengguna bisnis.
2. Integrasi nilai persediaan ke HPP setelah metode penilaian ditetapkan perusahaan.
3. Pengganti pejabat/delegasi setelah kebijakan perusahaan ditetapkan.

## Pencapaian role terbaru

- Admin Gudang Accounting: **93/100**, voucher pembelian approved kini dapat ditelusuri ke penerimaan, berita acara, posting, dan mutasi persediaan; perhitungan HPP tetap menunggu kebijakan perusahaan.
- Finance Cellular: **94/100**, settlement dan rekonsiliasi kanal memiliki bukti penerimaan privat, scanner, hash integritas, role/scope/version, serta audit; integrasi bank otomatis dan berita acara rekonsiliasi tetap terbuka.
- Leader Cellular: **91/100**, checklist, PIC, tenggat, temuan, koreksi, dan antrean kerja tersedia.
- SPV Cellular: **90/100**, verifikasi independen dan permintaan koreksi tersedia.
- Head Operasional Cellular: **90/100**, penyelesaian dan eskalasi risiko tersedia.
- Accounting Cellular: **93/100**, kontrol periode dan analitik rekonsiliasi menyatukan penjualan posted, closing H+1, settlement, shift, stok, ECSYS, komparasi outlet/provider, serta drill-down pengecualian; PNL/HPP menunggu kebijakan perusahaan.
- Admin Gudang Cellular: **91/100**, dokumen penerimaan, pengeluaran, transfer, dan stock opname memakai draf, pengajuan, koreksi, persetujuan Manager, multi-produk, optimistic version, audit, serta posting saldo atomik. Unggahan lampiran fisik menjadi peningkatan berikutnya; referensi bukti dan berita acara cetak sudah tersedia.
- Finance Accounting: **91/100**, Payment Run memprioritaskan voucher approved berdasarkan risiko, jatuh tempo, status realisasi, dan sisa; pencatatan pembayaran tetap memakai bukti serta pemisahan tugas.
- Manager Accounting: **90/100**, Decision Inbox memusatkan dokumen pending, nominal, risiko, alasan, dan maker-checker; ambang materialitas dan aturan delegasi tetap menunggu kebijakan perusahaan.
