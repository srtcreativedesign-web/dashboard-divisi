---
id: FND-SEC-SESSION-002
status: done
---
# Cookie browser, CSRF, reset sesi dan migrasi dokumen

Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Designer + Senior Product Manager. Scope TODO-04b/04c; BL-03.

- [x] Cookie HttpOnly dan CSRF terikat sesi, pembersihan localStorage.
- [x] Reset password membatalkan seluruh sesi lama dengan session_version.
- [x] Revocation fail-closed; UI tidak mengakui logout gagal sebagai sukses.
- [x] Migrasi dokumen privat dengan backup/checksum/manifest dan guard root; konflik/orphan dipertahankan.
- [x] PostgreSQL migrasi berhasil; 34 migrasi/54 tabel, 0 file/record dokumen publik.
- [x] 193/193 tes backend lulus (1336 assertions), 73/73 tes web dan 2/2 tes contracts lulus. Typecheck, lint, build dan formatter scoped selesai. Backend memakai SQLite in-memory; storage migrasi diuji dengan fake disk. Build memiliki peringatan ukuran chunk Cashflow dan anotasi dependensi Zod, tetapi berhasil. Bukti backend: C:/ERP/backend-session-final-2026-10-06.xml.
- [x] Smoke test cookie server aktif lulus, secrets tidak dicetak.
- [x] TODO/schema/API/security/UAT diperbarui.

Selesai pada scope task. Audit/retensi/scanner/hak baca rinci, backup/restore runtime serta keputusan bisnis tersisa mengikuti TODO-04d dan TODO-05–13. Bukti: dokumen/25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md.
