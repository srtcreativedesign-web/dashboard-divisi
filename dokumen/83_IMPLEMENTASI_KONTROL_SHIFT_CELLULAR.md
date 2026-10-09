# Implementasi Kontrol Shift Cellular

Tanggal: 10 Oktober 2026
Branch: `REQ`
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Tujuan

Memberikan pekerjaan nyata kepada Leader, SPV, dan Head Operasional. Sebelumnya role supervisi hanya membaca dashboard serta stok. Kini mereka memiliki satu alur operasional dengan dokumen, status, PIC, tenggat, temuan, dan tindakan yang jelas.

## Workflow

- Leader membuat checklist outlet/shift, menentukan PIC, tenggat H0–H+2, prioritas, serta temuan.
- Leader mengajukan draf; checklist yang belum lengkap wajib memiliki ringkasan temuan.
- SPV memverifikasi atau meminta koreksi dengan alasan.
- Head Operasional menyelesaikan kontrol yang telah diverifikasi atau mengeskalasi risiko material.
- Manager memberi keputusan beralasan pada dokumen yang diekskalasi.

Status: `draft → submitted → reviewed → resolved`, dengan cabang `submitted → correction` dan `reviewed → escalated → resolved`.

## UI dan antrean kerja

Rute: `/cellular/kontrol-shift`.

Halaman mengikuti kerangka visual Project: header divisi, KPI, panel register, form terstruktur, status, pencarian, periode, state kosong/gagal, tema terang/gelap, serta tabel responsif. KPI menunjukkan pekerjaan terbuka, lewat tenggat, eskalasi Manager, dan dokumen selesai.

`/cellular/pekerjaan` sekarang mengambil kontrol shift dari API dan menampilkan antrean sesuai role:

- Leader melihat draf dan koreksi;
- SPV melihat pengajuan;
- Head Operasional melihat hasil verifikasi;
- Manager melihat eskalasi.

## Keamanan dan integritas

- capability view/write/review/manage/approve dipisahkan per role;
- seluruh akses dibatasi divisi dan outlet Cellular;
- hanya pembuat dapat mengajukan dokumen;
- maker-checker melarang pembuat memeriksa dokumen yang sama;
- kombinasi outlet, tanggal bisnis, dan shift unik;
- optimistic version mencegah stale transition;
- alasan minimal sepuluh karakter diwajibkan untuk koreksi, eskalasi, dan keputusan Manager;
- seluruh perubahan status memiliki audit trail wajib.

## Data dan verifikasi

- database aktif berisi enam kontrol shift UAT dengan seluruh variasi status;
- smoke test SPV membaca 6 baris, termasuk 1 antrean pengajuan;
- PHPUnit `CellularShiftControlTest`: 2 test, 15 assertion lulus;
- Vitest halaman + Pekerjaan Saya: 8 test lulus;
- TypeScript typecheck lulus;
- inspeksi browser role SPV memastikan KPI, data database, status, dan tindakan Verifikasi/Koreksi tampil pada tema gelap;
- berkas Divisi Project tidak diubah.

## Penilaian role

- Leader Cellular: **91/100**;
- SPV Cellular: **90/100**;
- Head Operasional Cellular: **90/100**.

Manager memperoleh decision path untuk risiko shift, tetapi skor Manager tetap dievaluasi bersama decision inbox lintas workflow pada tahap berikutnya.
