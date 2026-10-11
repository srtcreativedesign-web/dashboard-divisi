# Closing H+1 Cellular

Tanggal implementasi: 11 Oktober 2026

Branch: `REQ`

Pemilik: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, dan Application Security Engineer.

## Masalah yang diselesaikan

Implementasi sebelumnya hanya memblokir pengajuan setelah H+1 pukul 23.59 WIB. Sistem belum menyediakan permintaan izin terlambat, keputusan Manager, PIC saat ini, atau histori pemeriksaan yang dapat dibaca pengguna.

## Alur final

1. Admin membuat atau memperbaiki draf closing.
2. Sistem menghitung omzet dari transaksi posted dan selisih kanal.
3. Sebelum batas H+1 pukul 23.59 WIB, Admin dapat langsung mengajukan.
4. Setelah tenggat, Admin wajib menulis alasan dan meminta izin terlambat.
5. Manager yang berbeda dari pembuat/pemohon menyetujui izin.
6. Admin mengajukan dokumen setelah izin tersedia.
7. Accounting memvalidasi atau mengembalikan dokumen dengan alasan koreksi.
8. Manager menyetujui closing yang telah divalidasi.

Perubahan nilai pada draf atau koreksi membatalkan izin terlambat sebelumnya karena isi dokumen sudah berubah.

## Informasi pada layar

- status workflow;
- outlet, tanggal bisnis, shift, dan referensi;
- omzet sistem, rincian kanal, dan selisih;
- tenggat H+1 pukul 23.59 WIB dan indikator terlambat;
- PIC saat ini;
- maker, reviewer, dan approver;
- status serta alasan izin terlambat;
- timeline penyimpanan, pengajuan, izin, validasi, koreksi, dan persetujuan;
- tindakan yang tersedia sesuai role dan status.

## Keamanan dan integritas

- scope divisi dan outlet diperiksa oleh backend;
- semua tindakan membutuhkan capability yang sesuai;
- versi dokumen mencegah pembaruan berdasarkan data lama;
- pembuat atau pemohon tidak dapat menyetujui izin terlambat sendiri;
- pembuat tidak dapat menyetujui closing sendiri;
- alasan izin terlambat dan koreksi minimal 10 karakter;
- semua transisi menulis audit event dengan status asal, status tujuan, tenggat, dan alasan;
- data lama tetap berlaku; kolom izin terlambat ditambahkan secara nullable.

## Perubahan database

Tabel `cel_daily_closings` memperoleh kolom:

- `late_submission_requested_at`;
- `late_submission_requested_by`;
- `late_submission_reason`;
- `late_submission_approved_at`;
- `late_submission_approved_by`.

Backup terenkripsi sebelum migrasi:

`C:\ERP\backups\dashboard-divisi\2026-10-11T10-29-11-007Z-6e248f78.erpbackup`

Verifikasi database pascamigrasi lulus 44 pemeriksaan tanpa menulis baris uji.

## Validasi

- PHPUnit: 3 tes, 27 assertion;
- Vitest: 2 tes UI;
- TypeScript typecheck: lulus;
- ESLint terarah: lulus;
- build produksi Vite: lulus;
- policy frontend/backend: sinkron;
- pemeriksaan visual role Admin Cellular: lulus setelah koreksi indikator data lama.

## Batas cakupan

Delegasi Manager dan pengganti pejabat belum diterapkan karena kebijakan perusahaan belum ditetapkan. HPP dan PNL tetap menunggu metode penilaian persediaan serta pengakuan pendapatan.
