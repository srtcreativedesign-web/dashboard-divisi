# ACC-RESET-001 — Reset navigasi dan UI Accounting

Status: selesai teknis; walkthrough seluruh role dan penerimaan pengguna terbuka.

Acuan: dokumen/67_RESET_ACCOUNTING_MENU_DAN_ALUR.md. Backup source terenkripsi/decrypt/hash/Git terverifikasi sebelum kode; tidak ada migrasi atau mutasi data native. Empat peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

Enam kelompok submenu, dashboard, antrean Admin/Accounting/Manager/Finance, register database, tahapan/penanggung jawab versi dokumen dan alias URL lama. Visual mengikuti Project, menu mengikuti proses Accounting. Data bisnis dan izin server existing dipertahankan.

Regresi 196 tes: 195 lulus dalam suite, satu selector lama diperbaiki dan berkasnya diuji ulang (4/4 lulus). Typecheck/build/lint scoped/diff-check lulus. QA Staff native desktop terang/gelap, detail dan mobile lulus, tanpa pembayaran nyata. Build masih memperingatkan chunk Project besar. Semua role native belum diuji ulang.

Dokumen 67 menggantikan keputusan navigasi/beranda 66; kebutuhan bisnis tetap berlaku. Staging/Ecsys, ledger/PNL, bonus/CMO dan penerimaan pengguna terbuka. REQ tanpa PR.