---
id: FND-SEC-ACCESS-001
status: done
---
# Validitas sesi, scope organisasi dan namespace dokumen

Peran: Application Security Engineer + Senior Fullstack Programmer + Senior Product Designer; backlog BL-03.

- [x] Protected request memverifikasi akun aktif dan snapshot email/role/divisi; sub/jti wajib.
- [x] Scope penugasan tidak melebar jika divisi hilang/tidak aktif; BOD berscope dibatasi.
- [x] Download/delete dokumen hanya namespace proyek yang tepat; wrong-parent/path gagal tanpa menghapus file lain.
- [x] Halaman Dokumen Project menyembunyikan mutasi bagi pembaca.
- [x] 184/184 tes backend lulus (1290 assertions); 69 web tests, typecheck/lint/build, formatter scoped selesai.
- [x] TODO/dokumen API/security/UAT diperbarui.

Selesai pada scope task, bukan seluruh TODO-04. CSRF/localStorage, revocation semua sesi, file publik lama, malware/audit, retensi dan produksi masih pekerjaan terpisah.
