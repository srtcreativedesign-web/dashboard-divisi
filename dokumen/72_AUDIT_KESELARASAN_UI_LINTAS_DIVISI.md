# Audit Keselarasan UI Lintas Divisi

Tanggal audit: 8 Oktober 2026.

## Kontrak visual bersama

Semua divisi memakai AppLayout, sidebar, top bar, token warna, tipografi Inter, mode terang/gelap, radius, shadow, fokus keyboard, dan lebar workspace yang sama. Identitas divisi hanya muncul pada nama, descriptor, isi, metrik, dan tindakan sesuai proses kerja.

Urutan layar yang menjadi acuan adalah: identitas dan tujuan halaman, tindakan utama, konteks/KPI, filter atau tab kerja, panel data utama, status dan penanggung jawab, lalu pagination atau tindakan lanjutan. Tabel memakai angka tabular, header konsisten, hover row, dan empty/error/loading state.

## Implementasi tahap kedua

`AppLayout` sekarang memberi kontrak `division-workspace` kepada Accounting dan Cellular dengan Divisi Project sebagai acuan visual yang tidak diubah. Kontrak ini berlaku pada isi halaman, bukan hanya dashboard: surface panel, tabel, hover baris, label, input, select, textarea, unggah berkas, fokus keyboard, field nonaktif, radius, shadow, dan animasi.

## Status Divisi Accounting

Seluruh 17 halaman route Accounting memakai `AccountingPageHeader`, yang membungkus `DivisionPageHeader` lintas divisi. Seluruh menu menerima surface dan form contract bersama melalui layout. Form voucher telah diperiksa langsung di browser: identitas, rencana pembayaran, referensi dokumen, nominal, dan tindakan draf tampil sebagai satu alur yang dapat dipindai. Isi tetap mengikuti pekerjaan Accounting: dokumen, periode, sumber, status, penanggung jawab, nominal, dan tindakan.

Perbedaan role dipertahankan melalui capability. Admin mengerjakan draf/koreksi; Staff Accounting memeriksa; Manager memutuskan; Finance merealisasikan. Kesamaan visual tidak menambah kewenangan.

## Status Divisi Project

Dashboard dan seluruh halaman Project tetap menjadi acuan visual utama. Tidak ada komponen, layout, tabel, formulir, atau aturan workspace baru yang diterapkan ke Divisi Project pada tahap penyelarasan ini.

## Status Divisi Cellular

Dashboard Cellular sekarang memakai `DivisionPageHeader`, KPI bersama, dan panel direktori outlet. Halaman operasional memakai header bersama, navigasi tab bergaris, surface panel, tabel, dan form contract yang sama. Isi khusus Cellular tetap berupa katalog kartu/aksesori, stok berbasis jumlah, mutasi, dan penjualan manual sesuai role.

## Kesimpulan audit

- Shell aplikasi lintas divisi: selaras.
- Accounting seluruh menu dan input: memakai kontrak visual baru.
- Role Accounting: selaras secara visual dan tetap berbeda secara kewenangan.
- Project: dipertahankan sebagai baseline visual dan tidak diubah oleh pekerjaan penyelarasan Accounting serta Cellular.
- Cellular: dashboard, halaman operasional, tab, tabel, dan input memakai kontrak visual bersama.
- Keselarasan berarti bahasa visual dan pola interaksi yang sama; menu, data, tindakan, serta hak akses tetap mengikuti pekerjaan tiap divisi dan role.

## Verifikasi

Typecheck web dan build produksi lulus. Seluruh 47 berkas pengujian frontend dengan 210 tes lulus. QA browser pada formulir voucher Admin memastikan side sheet, hierarki informasi, field, fokus, dan tindakan draf memakai kontrak visual baru.
