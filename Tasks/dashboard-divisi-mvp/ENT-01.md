# ENT-01 — Pemeriksaan teknis sebelum rilis

Status: implementasi lokal selesai; verifikasi CI remote terblokir billing GitHub.
Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

Acuan: [TODO enterprise](../../dokumen/46_TODO_KESIAPAN_ENTERPRISE.md). Perintah npm run release:check memakai pemeriksaan lingkungan, lint, typecheck, tes web/contracts/backend, build, Pint dan guard database/scanner. Hasil teknis disimpan pada artifacts/release/latest.json, diabaikan Git. Backend memakai SQLite in-memory; tidak menjalankan migrasi/seed/restore/deploy pada database kerja.

CI secara eksplisit mencakup push REQ, npm 11, pemeriksaan lingkungan wajib, SQLite pada quality gate dan fixture APP_KEY 32 byte. PostgreSQL pada job migrasi tetap database CI terisolasi yang sudah ada, bukan database native kerja. Tidak ada Docker lokal ditambahkan.

Run GitHub 37556062088 tidak memulai job karena akun terkunci akibat masalah billing. Konfigurasi bukan bukti CI berhasil. ENT-01 belum ditutup sebagai validasi remote; ENT-02–09 dan UAT/produksi tetap terbuka.

Hasil lokal: gate exit 0, 258 backend/2036 assertions, 108 web, dua contracts, empat tes orkestrasi, empat guard database dan tiga guard scanner; lint/typecheck/build/Pint lulus. Bukti mencatat working tree masih berisi perubahan. Kunci uji CI diterima Encrypter Laravel. Revisi pemisahan command tes diverifikasi lint serta empat tes orkestrasi.
