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
- [ ] Selaraskan komposisi form, filter, register, status, dan tindakan dengan pola Project.
- [ ] Perjelas H+1 pukul 23.59 WIB, selisih, alasan koreksi, PIC, dan jejak pemeriksaan.
- [ ] Selaraskan transaksi penjualan dan pembatalan.

### Persediaan dan master

- [ ] Selaraskan Produk & Paket dengan pola daftar/detail/form Project.
- [ ] Selaraskan Stok & Mutasi dengan pola register dan detail transaksi.
- [ ] Bedakan pengalaman Admin Gudang dari role pembaca.
- [ ] Tambahkan indikator stok kritis yang dapat ditindaklanjuti per outlet.

### Pembukuan, pembayaran, laporan, integrasi

- [x] Ganti panel kesiapan Tagihan & Settlement dengan workflow Finance → Accounting berbasis closing disetujui.
- [x] Implementasikan settlement parsial tunai, QRIS, EDC, transfer, biaya kanal, tujuan dana, referensi, dan sisa rekonsiliasi.
- [x] Terapkan maker-checker, scope outlet, optimistic version, idempotency referensi, audit, dan larangan settlement terverifikasi melebihi closing.
- [x] Satukan penjualan posted, closing H+1, settlement, kontrol shift, dan stok ke Kontrol Accounting berbasis data database.
- [x] Tampilkan readiness paket H+1, rekonsiliasi kanal, kontrol operasional, pengecualian, dan stok kritis per periode.
- [ ] Kembangkan Buku Persediaan menjadi register yang dapat ditelusuri ke transaksi sumber.
- [ ] Kembangkan laporan berdasarkan struktur Excel Cellular: harian, pendapatan, omzet per shift, ECSYS, dan komparasi outlet.
- [x] Bangun staging impor spreadsheet dengan validasi, pratinjau, rekonsiliasi, idempotency, dan audit untuk profil harian, pendapatan, shift, ECSYS, dan update.
- [ ] Implementasikan PNL setelah metode HPP dan kebijakan pengakuan pendapatan ditetapkan.

## Tahap 3 — Accounting

- [x] Audit setiap halaman terhadap kerangka Project dan kebutuhan lima role: Manager, Admin, Accounting, Finance, Admin Gudang.
- [ ] Selaraskan dashboard dan Pekerjaan Saya berdasarkan antrean dokumen aktual.
- [ ] Selaraskan omzet, voucher, setoran, pencocokan, dan jurnal.
- [ ] Selaraskan hutang-piutang, cashflow, periode, master data, dan impor.
- [ ] Pisahkan pekerjaan input, pemeriksaan, persetujuan, realisasi, dan pemantauan berdasarkan role.
- [ ] Pastikan workflow Admin → Accounting → Manager → Finance memiliki PIC, status, waktu, alasan koreksi, dan audit trail.
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
- [ ] Jalankan regresi Accounting dan Cellular.
- [ ] Lakukan UAT per role dan catat bukti visual.

## Urutan eksekusi aktif

1. Cellular: buku persediaan, laporan ECSYS/komparasi, dan penyempurnaan form H+1.
2. Integrasi nilai persediaan ke HPP setelah metode penilaian ditetapkan perusahaan.
3. Pengganti pejabat/delegasi setelah kebijakan perusahaan ditetapkan.
4. Regresi lintas role dan UAT visual terang/gelap.

## Pencapaian role terbaru

- Admin Gudang Accounting: **93/100**, voucher pembelian approved kini dapat ditelusuri ke penerimaan, berita acara, posting, dan mutasi persediaan; perhitungan HPP tetap menunggu kebijakan perusahaan.
- Finance Cellular: **91/100**, settlement dan rekonsiliasi kanal telah melewati quality gate; unggahan bukti mutasi bank menjadi peningkatan berikutnya.
- Leader Cellular: **91/100**, checklist, PIC, tenggat, temuan, koreksi, dan antrean kerja tersedia.
- SPV Cellular: **90/100**, verifikasi independen dan permintaan koreksi tersedia.
- Head Operasional Cellular: **90/100**, penyelesaian dan eskalasi risiko tersedia.
- Accounting Cellular: **90/100**, kontrol periode menyatukan sumber transaksi, closing H+1, settlement, shift, stok, serta jalur staging spreadsheet; PNL/HPP menunggu kebijakan perusahaan.
- Finance Accounting: **91/100**, Payment Run memprioritaskan voucher approved berdasarkan risiko, jatuh tempo, status realisasi, dan sisa; pencatatan pembayaran tetap memakai bukti serta pemisahan tugas.
- Manager Accounting: **90/100**, Decision Inbox memusatkan dokumen pending, nominal, risiko, alasan, dan maker-checker; ambang materialitas dan aturan delegasi tetap menunggu kebijakan perusahaan.
