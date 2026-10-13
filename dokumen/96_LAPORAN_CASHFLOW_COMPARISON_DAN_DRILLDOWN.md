# Laporan Cashflow, Perbandingan, dan Drill-down Accounting

Tanggal: 13 Oktober 2026
Branch: `REQ`

## Tujuan

Pekerjaan ini mengubah halaman Cashflow menjadi laporan kerja yang dapat menjawab nilai arus kas periode berjalan, perubahan terhadap bulan sebelumnya, kualitas data pembentuk laporan, serta transaksi sumber di balik setiap kategori.

## Hasil implementasi

### Ringkasan dan perbandingan periode

- Arus masuk, arus keluar, arus kas bersih, saldo akhir, dan proyeksi ditampilkan dari transaksi Accounting yang sudah diposting.
- Setiap metrik utama dibandingkan dengan bulan sebelumnya menggunakan nilai periode kini, nilai pembanding, selisih nominal, dan persentase perubahan.
- Lima perubahan kategori terbesar membantu pengguna menemukan penggerak kenaikan atau penurunan tanpa membaca seluruh transaksi.
- Break-down operasi, investasi, dan pendanaan menyertakan jumlah transaksi agar nilai agregat dapat dinilai bersama volume sumbernya.

### Kualitas laporan

- Panel kualitas menunjukkan transaksi posted, transaksi draft, transaksi tanpa lampiran, jumlah rekening bank, dan rekening yang belum diverifikasi.
- Status kelengkapan dan jumlah pengecualian dihitung di server sehingga tampilan tidak dapat menyatakan laporan siap berdasarkan perkiraan frontend.
- Indikator kualitas yang sama dapat dipakai oleh kontrol periode untuk menilai kesiapan closing.

### Drill-down sumber

- Tab Sumber Transaksi menyediakan ledger terpaginasikan dengan filter kelompok, kategori, dan pencarian referensi/deskripsi.
- Setiap baris menampilkan tanggal, referensi, deskripsi, akun, outlet, debit, kredit, nilai cashflow, dan status lampiran.
- Pengguna dapat membuka sumber langsung dari kategori pada tab Breakdown; filter kategori diterapkan tanpa memasukkan ulang pencarian.
- Query dibatasi ke Divisi Accounting, periode yang dipilih, transaksi aktif, dan status posted.

### Ekspor

- PDF dan spreadsheet tetap tersedia dari data laporan yang telah diperoleh melalui endpoint berizin.
- Ekspor breakdown sekarang menyertakan kelompok cashflow dan jumlah transaksi per kategori.
- Ekspor mengikuti periode serta scope data yang sedang dibaca pengguna.

## Perspektif peran

- **Senior Product Manager:** menetapkan laporan sebagai alat evaluasi periode, bukan sekadar grafik, dengan metrik pembanding, pengecualian, dan sumber yang dapat ditelusuri.
- **Senior Product Designer:** menyusun alur ringkasan → kualitas → perbandingan → laporan/breakdown/sumber agar pengguna pertama memahami posisi kas dan tindakan pemeriksaan berikutnya.
- **Senior Fullstack Programmer:** memperluas service laporan, menambah endpoint detail terpaginasikan, kontrak API, hooks, komponen UI, dan pengujian.
- **Application Security Engineer:** membatasi query berdasarkan divisi dan capability, memvalidasi filter/pagination, hanya membuka transaksi posted yang aktif, dan menjaga ekspor berasal dari data berizin.

## Verifikasi

- Tes backend terarah cashflow: 7 tes, 89 assertion lulus.
- Tes UI visualisasi cashflow dan tabel laporan: 14 tes lulus.
- TypeScript typecheck, ESLint scoped, production build, policy check, sintaks PHP, dan Pint scoped lulus.
- Regresi backend Accounting lintas fondasi, role, transaksi, impor, outstanding, cashflow, master, dan rekonsiliasi: 99 tes, 807 assertion lulus.
- Divisi Project tidak diubah.

## Batas pekerjaan

- PDF dan spreadsheet dibuat di sisi klien dari data API yang sudah diotorisasi; penjadwalan laporan, pengiriman otomatis, dan arsip ekspor server belum termasuk.
- Proyeksi menggunakan outstanding AP/AR yang tersedia dan belum menjadi forecasting treasury berbasis skenario.
- Integrasi nilai persediaan ke HPP menunggu metode penilaian persediaan perusahaan.
- PNL, bonus, CMO, delegasi pejabat, dan threshold materialitas menunggu kebijakan bisnis.
- UAT terang/gelap/mobile seluruh role tetap berada pada `UI-XDIV-002`; hasil teknis belum merupakan sign-off bisnis atau kesiapan produksi.
