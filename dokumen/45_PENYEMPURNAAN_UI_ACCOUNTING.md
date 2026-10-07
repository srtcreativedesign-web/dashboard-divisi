# Penyempurnaan dashboard dan panduan Accounting

7 Oktober 2026. Acuan: dokumen 43 dan versi ERP yang dipulihkan pada dokumen 44. Pengembangan dilakukan pada branch REQ; commit langsung di-push tanpa PR atau penggabungan dengan development.

## Tujuan dan batas pekerjaan

Sebagai Senior Product Manager, menetapkan tahap ini untuk membuat dashboard Accounting lebih jelas sebagai ruang kerja tim pusat lintas divisi. Scope mencakup dashboard dan komponen panduan bersama pada omzet, voucher serta setoran. Desain ulang seluruh formulir/tabel, HR, Project dan Cellular masih pekerjaan berikutnya.

## Implementasi

Sebagai Senior Product Designer dan Senior Fullstack Programmer:

- Header navy dengan konteks pekerjaan serta periode ringkasan.
- Pemilih bulan dari periode yang benar-benar tersedia, otomatis memilih periode terbaru. Ringkasan penerimaan, beban dan saldo akhir mengikuti pilihan bulan.
- Kartu pekerjaan harian berisi ikon, deskripsi, tautan dan keterangan alur sesuai capability akun.
- Pengingat batas pengajuan omzet akhir H+1 pukul 23.59 WIB serta tautan laporan sesuai kewenangan.
- Keadaan kosong menjelaskan belum adanya periode, bukan menampilkan saldo nol buatan. Kegagalan memuat ringkasan menyediakan retry sementara pintasan pekerjaan tetap tersedia.
- Panduan langkah omzet/voucher/setoran menggunakan urutan bernomor, tiga kolom pada desktop dan vertikal pada layar kecil. Tahapan bisnis tetap sama.

Sebagai Application Security Engineer, menjaga filter capability dan akses ringkasan yang ada. Dashboard hanya memakai API periode dan cashflowSummary, tidak meminta cashflowReport. Role ringkasan tidak memperoleh tautan detail; Finance tidak memperoleh pintasan HR. Backend, database, migrasi dan kewenangan tidak berubah.

## Verifikasi

- 20 tes pada empat file Accounting lulus: dashboard 5, omzet 4, voucher 7, setoran 4. Regresi baru mencakup penggantian periode, keadaan kosong, kegagalan/retry dan ketersediaan pintasan.
- Lint, typecheck dan build lulus. Build masih memberi peringatan chunk Cashflow lebih dari 500 kB dan anotasi dependensi Zod; bukan kegagalan build.
- Browser native: login akun Admin uji UI berhasil, dashboard tampil dan pintasan omzet membuka halaman yang benar. Desktop 1440 dan ponsel 390 piksel tidak memiliki overflow horizontal halaman; omzet 390 piksel juga tidak memiliki overflow halaman dan panduan bernomor terbaca.
- Inspeksi menggunakan keadaan kosong asli, tanpa membuat transaksi atau periode native. Periode terisi dan pembatasan role diverifikasi melalui fixture tes otomatis. UAT seluruh role/data bisnis terisi tetap terbuka.
- Bukti lokal: C:/ERP/accounting-dashboard-ui-20261007.jpg dan C:/ERP/accounting-workflow-mobile-20261007.jpg. Override viewport sementara dikembalikan setelah inspeksi; frontend 5173 dan API 8000 tetap berjalan.

## Lanjutan

TODO-UI-02 tetap terbuka: HR, Project, Cellular, tabel panjang/data terisi dan UAT per role. Penyempurnaan dashboard tahap ini selesai teknis; bukan penerimaan seluruh MVP.
