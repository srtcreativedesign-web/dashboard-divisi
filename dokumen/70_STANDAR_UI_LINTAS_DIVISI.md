# Standar UI lintas divisi berbasis Project

Tanggal: 8 Oktober 2026  
Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Keputusan

UI Divisi Project menjadi dasar bahasa visual ERP untuk seluruh divisi. Dasar ini mencakup shell aplikasi, header divisi, hierarki tipografi, kartu KPI, panel, tabel, status, tombol, keadaan loading/kosong/error, mode terang/gelap, dan perilaku responsif. Fitur dan struktur data setiap divisi tetap mengikuti pekerjaan dan kewenangan penggunanya.

Proporsi acuan adalah sekitar 70% sistem visual bersama dan 30% konteks kerja khusus divisi/role. Keselarasan tidak berarti menyalin menu Project ke Accounting atau Cellular.

## Konteks yang berbeda

- Project memakai proyek aktif sebagai konteks: kode, klien, lokasi, nilai kontrak, status, progres, dan submenu proyek.
- Accounting memakai periode, peran, cakupan lintas divisi, status periode, status dokumen, penanggung jawab, dan tindakan workflow.
- Cellular akan memakai outlet, periode/shift, kategori barang, status stok, dan sumber laporan manual sebagai konteks.

## Kontrak pengalaman Accounting

Dashboard dan halaman kerja harus menjawab secara berurutan:

1. Siapa pengguna dan periode apa yang sedang aktif.
2. Dokumen atau transaksi apa yang perlu dikerjakan.
3. Status, sumber, nominal, penanggung jawab, dan tenggatnya.
4. Tindakan apa yang diizinkan oleh role.
5. Dampak operasional dan keuangan setelah tindakan selesai.

Judul dan penjelasan dashboard menyesuaikan role. Admin berfokus pada input, draf, koreksi, dan H+1; Staff Accounting pada pemeriksaan dan selisih; Manager pada keputusan dan risiko; Finance pada realisasi dan jatuh tempo. Data rinci tetap dilindungi capability yang sudah ada.

## Tahap implementasi pertama

- Komponen header divisi bersama dipakai Project dan Accounting.
- Dashboard Accounting mendapat konteks periode, role, cakupan data, dan akses register.
- Kartu KPI mengikuti komposisi Project dengan kartu utama bergradien dan kartu pendukung yang konsisten.
- Grafik tetap mempertahankan interaksi keyboard dan presisi nominal yang telah diuji.
- Query periode diteruskan ke register agar konteks pengguna tidak hilang.

## Batas

Tahap ini tidak mengubah API, capability, formula PNL/bonus/CMO, database, atau status bisnis. Penyelarasan halaman detail Accounting, Cellular, dan seluruh variasi role tetap dilakukan bertahap memakai standar ini. UAT pengguna tidak digantikan oleh tes teknis.

## Verifikasi

Typecheck dan build web lulus. Sebelas tes dashboard Accounting/Project serta lint file berubah lulus. QA Admin Accounting berhasil pada desktop terang dan mobile 390×844 mode gelap; lebar dokumen 380 px sama dengan lebar scroll sehingga tidak ada overflow halaman. Header role, konteks periode, cakupan lintas divisi, antrean dokumen nyata, dan deep-link register terverifikasi. Preview dikembalikan ke tema terang dan ukuran viewport normal. Peringatan ukuran chunk Project tetap merupakan batas build yang sudah ada.
