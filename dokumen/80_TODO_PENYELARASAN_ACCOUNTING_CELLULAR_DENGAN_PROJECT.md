# Todo Penyelarasan Accounting dan Cellular dengan Kerangka Project

Tanggal mulai: 9 Oktober 2026
Branch kerja: `REQ`
Pemilik implementasi: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

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

- [ ] Ganti panel kesiapan Tagihan & Settlement dengan fitur setelah kontrak backend tersedia.
- [ ] Kembangkan Buku Persediaan menjadi register yang dapat ditelusuri ke transaksi sumber.
- [ ] Kembangkan laporan berdasarkan struktur Excel Cellular: harian, pendapatan, omzet per shift, ECSYS, dan komparasi outlet.
- [ ] Bangun staging impor spreadsheet dengan validasi, pratinjau, rekonsiliasi, idempotency, dan audit.
- [ ] Implementasikan PNL setelah metode HPP dan kebijakan pengakuan pendapatan ditetapkan.

## Tahap 3 — Accounting

- [ ] Audit setiap halaman terhadap kerangka Project dan kebutuhan lima role: Manager, Admin, Accounting, Finance, Admin Gudang.
- [ ] Selaraskan dashboard dan Pekerjaan Saya berdasarkan antrean dokumen aktual.
- [ ] Selaraskan omzet, voucher, setoran, pencocokan, dan jurnal.
- [ ] Selaraskan hutang-piutang, cashflow, periode, master data, dan impor.
- [ ] Pisahkan pekerjaan input, pemeriksaan, persetujuan, realisasi, dan pemantauan berdasarkan role.
- [ ] Pastikan workflow Admin → Accounting → Manager → Finance memiliki PIC, status, waktu, alasan koreksi, dan audit trail.
- [ ] Implementasikan PNL, bonus, dan CMO hanya setelah kebijakan bisnis ditetapkan.

## Tahap 4 — Validasi lintas divisi

- [ ] Uji desktop, tablet, dan mobile pada tema terang serta gelap.
- [ ] Uji navigasi keyboard, focus state, label form, dan keterbacaan tabel.
- [ ] Uji isolasi divisi serta capability backend untuk setiap tindakan.
- [ ] Pastikan tidak ada angka, tombol, filter, ekspor, atau status semu.
- [ ] Jalankan regresi Accounting dan Cellular.
- [ ] Lakukan UAT per role dan catat bukti visual.

## Urutan eksekusi aktif

1. Pekerjaan Saya Cellular berbasis workflow nyata.
2. Dashboard Cellular berbasis antrean role.
3. Penerimaan Harian dan transaksi penjualan.
4. Persediaan, mutasi, produk, dan paket.
5. Laporan serta staging data Cellular.
6. Audit dan penyelarasan seluruh Accounting.
