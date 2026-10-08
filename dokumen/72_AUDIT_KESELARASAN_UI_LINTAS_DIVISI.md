# Audit Keselarasan UI Lintas Divisi

Tanggal audit: 8 Oktober 2026.

## Kontrak visual bersama

Semua divisi memakai AppLayout, sidebar, top bar, token warna, tipografi Inter, mode terang/gelap, radius, shadow, fokus keyboard, dan lebar workspace yang sama. Identitas divisi hanya muncul pada nama, descriptor, isi, metrik, dan tindakan sesuai proses kerja.

Urutan layar yang menjadi acuan adalah: identitas dan tujuan halaman, tindakan utama, konteks/KPI, filter atau tab kerja, panel data utama, status dan penanggung jawab, lalu pagination atau tindakan lanjutan. Tabel memakai angka tabular, header konsisten, hover row, dan empty/error/loading state.

## Status Divisi Accounting

Seluruh 17 halaman route Accounting sudah memakai `AccountingPageHeader`, yang membungkus `DivisionPageHeader` lintas divisi. Workspace Accounting juga menerapkan surface contract bersama untuk panel, tabel, field, fokus, radius, shadow, dan animasi. Isi tetap mengikuti pekerjaan Accounting: dokumen, periode, sumber, status, penanggung jawab, nominal, dan tindakan.

Perbedaan role dipertahankan melalui capability. Admin mengerjakan draf/koreksi; Staff Accounting memeriksa; Manager memutuskan; Finance merealisasikan. Kesamaan visual tidak menambah kewenangan.

## Status Divisi Project

Dashboard Project sudah memakai komponen header dan KPI bersama serta menjadi acuan visual utama. Beberapa halaman Project lama masih memiliki implementasi header/panel lokal. Secara visual cukup dekat, tetapi perlu migrasi bertahap ke komponen bersama agar perubahan desain berikutnya tidak menghasilkan variasi baru.

## Status Divisi Cellular

Cellular masih memiliki dashboard dan halaman operasional yang lebih sederhana. Struktur aplikasi dan token sudah sama, tetapi hierarki halaman, KPI, toolbar, tabel, dan konteks role belum sepenuhnya memakai kontrak visual bersama.

## Kesimpulan audit

- Shell aplikasi lintas divisi: selaras.
- Accounting seluruh menu: selaras pada kontrak visual baru.
- Role Accounting: selaras secara visual dan tetap berbeda secara kewenangan.
- Project: menjadi baseline; migrasi komponen lokal masih diperlukan.
- Cellular: perlu tahap penyelarasan tersendiri setelah alur dan metrik operasional dikunci.

## Verifikasi

Typecheck web lulus. Tiga puluh empat tes terpilih untuk navigasi, routing, dashboard, register, dan pembatasan multi-role lulus. QA browser pada register Admin memastikan header, konteks, filter, status, tabel, data database, dan tindakan tampil sesuai kontrak visual.
