# Implementasi Settlement Kanal Cellular

Tanggal: 10 Oktober 2026
Branch: `REQ`
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Tujuan dan alur

Mengganti panel kesiapan `Tagihan & Settlement` dengan workflow ERP nyata. Closing harian yang telah disetujui Manager menjadi sumber hak penerimaan per kanal. Finance mencatat dana aktual, biaya, tujuan bank/kas, serta referensi batch. Accounting memeriksa dokumen dan memilih rekonsiliasi atau koreksi.

Alur status: `draft → submitted → reconciled` atau `submitted → correction → submitted`.

## Pengalaman pengguna

Rute: `/cellular/tagihan`.

Halaman mengikuti kerangka visual Project dan menyediakan:

- KPI hak penerimaan, nilai terekonsiliasi, sisa, antrean verifikasi, dan biaya kanal;
- rekonsiliasi per outlet, tanggal bisnis, shift, dan kanal;
- register settlement dengan bruto, biaya, neto, tujuan dana, referensi, status, dan catatan pemeriksa;
- formulir Finance yang mengambil sumber dari closing disetujui dan mendukung settlement parsial;
- tindakan berbasis role: Finance membuat/memperbaiki/mengajukan, Accounting merekonsiliasi/mengoreksi, Manager memantau;
- state loading, error, kosong, pencarian, periode, responsif, serta tema terang/gelap melalui token visual bersama.

## Kontrol keamanan dan integritas

- capability `view`, `write`, dan `reconcile` dipisahkan pada backend;
- seluruh query dibatasi outlet Cellular yang dapat diakses pengguna;
- closing wajib berstatus `approved`;
- pembuat tidak dapat memeriksa dokumennya sendiri;
- hanya pembuat dapat mengubah atau mengajukan draf/koreksi;
- referensi kanal per closing menghasilkan source key unik untuk mencegah duplikasi;
- optimistic version menolak perubahan stale;
- Accounting tidak dapat merekonsiliasi total bruto di atas nilai kanal closing;
- fee tidak dapat negatif atau melebihi bruto; neto dihitung server;
- tanggal settlement dibatasi dari tanggal bisnis sampai hari ini;
- seluruh mutasi memiliki audit trail wajib.

## Data UAT database

Seeder idempotent `CellularSettlementUatSeeder` menghasilkan data dari closing yang sudah disetujui. Database aktif berisi 16 sumber kanal dan 16 settlement dengan variasi draf, diajukan, koreksi, serta terekonsiliasi. Angka ditulis ke PostgreSQL dan dibaca kembali oleh API; UI tidak memiliki angka hardcode.

## Verifikasi

- migration administratif berhasil dan hak runtime diverifikasi `44/44`;
- PHPUnit `CellularSettlementTest`: 2 test, 22 assertion lulus;
- Vitest Settlement + Workspace: 6 test lulus;
- policy frontend/backend sinkron;
- TypeScript typecheck lulus;
- smoke test database aktif: 16 settlement dan 16 sumber rekonsiliasi terbaca;
- Project tidak diubah oleh implementasi ini.

## Penilaian role

Finance Cellular naik dari 39/100 menjadi **91/100**. Pekerjaan utamanya kini memiliki sumber data, status, pemilik, tindakan berikutnya, pemisahan tugas, serta kontrol integritas. Peningkatan lanjutan adalah unggahan bukti mutasi bank yang melalui pemindaian malware dan ekspor berita acara rekonsiliasi.
