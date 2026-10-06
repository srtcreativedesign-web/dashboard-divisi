# ACC-HR-003 — Rekap cuti dan realisasi absensi manual

Status: selesai teknis untuk sumber manual, belum penerimaan pengguna/HR penuh.
Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

Acuan ditulis sebelum kode: [dokumen 41](../../dokumen/41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Master minimal tanpa akun/NIK/biometrik; Admin mencatat/mengoreksi/void, Manager/Admin mengelola master, Staff Accounting membaca. Private HR capability, versi/history/audit, overlap cuti dan absensi unik.

## Agent Log

6 Oktober 2026: 250 backend/97 web lulus, lint/typecheck/build/pint lulus; migration native additive diterapkan dengan FK pegawai bertipe teks sesuai organisasi. 36 cek privilege, 25 akun/125 smoke pemeriksaan, enam probe constraint dan restore 61 tabel/empat berkas lulus. Tidak membuat data pegawai contoh native. Parent TODO-10 dan aturan kalender/gaji/bonus tetap terbuka.
