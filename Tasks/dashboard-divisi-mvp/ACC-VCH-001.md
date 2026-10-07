---
id: ACC-VCH-001
status: in-progress
---
# Alur voucher tagihan dan pembelian

- [x] Draf BILLING/PURCHASING dengan outlet, referensi dan nominal tervalidasi.
- [x] Pengajuan Admin pembuat, pemeriksaan Staff Accounting dan persetujuan Manager.
- [x] Koreksi, pemisahan aktor, batas scope, versi, lock, histori snapshot dan audit.
- [x] Voucher disetujui terkunci dan sumber duplikat ditolak.
- [x] Halaman /accounting/vouchers, filter/paginasi, form/detail serta aksi per role.
- [x] Delapan tes backend voucher, lima tes UI, typecheck/lint/build/formatter selesai.
- [x] Aktivasi migrasi PostgreSQL dan master tiga divisi pada 6 Oktober 2026; presisi nominal/constraint duplikat terverifikasi, data probe di-rollback.
- [ ] UAT Admin → Staff Accounting → Manager dengan master/pengguna operasional.

Detail dan hasil regresi legacy: docs/VOUCHER_WORKFLOW.md. Lampiran, pembayaran, hutang dan jurnal otomatis adalah pekerjaan terpisah.
