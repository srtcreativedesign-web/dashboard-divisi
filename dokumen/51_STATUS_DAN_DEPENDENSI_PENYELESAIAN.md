# Status dan dependensi penyelesaian ERP

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Acuan aktif tetap dokumen 21 dan 46; REQ saja, tanpa PR. Permintaan menyelesaikan semua pekerjaan ditangani dengan implementasi yang sudah memiliki kontrak dan bukti; item terbuka tidak ditutup melalui asumsi.

## Yang tersedia secara teknis

Fondasi tiga divisi, akun/role, sesi dan CSRF, capability tersinkron, audit wajib, lampiran privat/scanner, backup lokal, workflow omzet H+1/voucher, setoran/penerimaan manual/pencocokan/penelusuran sumber, laporan omzet tahunan, HR manual, Project dasar dan Cellular manual sudah diimplementasikan dalam scope dokumen hasil masing-masing. ENT-09a menambahkan perbaikan konteks UI, pagination Project dan tema pada dokumen 50. Penerimaan perusahaan belum diberikan.

## Implementasi berikutnya dan dependensi

- ENT-02b / TODO-04d: matriks tindakan dan field, PIC/delegasi, retensi serta kebijakan koreksi/penghapusan perlu aturan pemilik proses. Perlindungan konservatif, audit dan histori tetap aktif. Dokumen klasifikasi awal sudah tersedia pada dokumen 32.
- ENT-03b / TODO-07/10: COA dan basis pendapatan, metode HPP, bonus serta definisi penutupan belum ditetapkan. Jangan mengaktifkan posting otomatis atau menganggap saldo setoran sebagai laba. COA/periode/jurnal manual dan cashflow yang sudah ada dapat dipakai sesuai sumbernya.
- ENT-04 / TODO-08/09: ledger penerimaan Project, termin/bukti Finance, transfer/opname/retur/pembelian Cellular dan integrasi Accounting masih memerlukan kontrak proses. Boolean payment_status Project tetap administratif; penjualan Cellular belum jurnal atau kas diterima.
- TODO-11: integrasi AP/Ecsys memerlukan file/kontrak data dan identitas sumber, skema tagihan dan akses resmi. Kontrak/pas/surat perlu jenis dokumen, masa berlaku dan alur persetujuan. Lampiran voucher privat sudah tersedia; bukan integrasi sistem eksternal.
- TODO-12: CMO masih belum didefinisikan oleh pengguna; pelaporan pajak membutuhkan entitas/lokasi, periode dan basis transaksi resmi. Tidak menetapkan kewajiban pajak dari label PB1 saja.
- ENT-05 / TODO-06/13: paket skenario UAT tersedia; pengujian dengan sumber perusahaan dan sign-off pengguna masih diperlukan. Tes otomatis dan inspeksi akun uji bukan sign-off.
- ENT-06: pengujian volume/konkurensi PostgreSQL terisolasi belum dilaksanakan. Target pengguna, transaksi, volume dan waktu respons perlu ditetapkan sebelum klaim kapasitas.
- ENT-07/08 / TODO-05-prod: host/TLS, PIC insiden, target ketersediaan, RPO/RTO, lokasi offsite, retensi dan pemulihan kunci belum ditetapkan. Backup native/restore latihan sudah ada; belum deployment atau recovery produksi.
- ENT-09 / TODO-UI-02: ENT-09a adalah perbaikan teknis terbatas. Data terisi/tabel panjang, kombinasi semua role dan penerimaan UX masih terbuka; pengujian native memakai keadaan kosong tanpa menanam transaksi bisnis.

## Catatan backlog terdahulu

ADM-002 masih mencantumkan DataGridInput/ConfirmModal dan endpoint admin tutup-shift/audit-logistik. Scope itu tidak otomatis selesai oleh alur omzet/voucher yang sekarang. Perlu diselaraskan dengan PRD/API aktif sebelum implementasi; task asli tetap terbuka agar tidak kehilangan histori.

## Hambatan eksternal CI

Run REQ 37561895204 untuk commit 5f2540e berstatus failure. Hasil lokal tidak menggantikan CI remote; penyebab diperiksa melalui anotasi GitHub. Tidak mengubah billing, akun atau paket berbayar. ENT-01b tetap terbuka sampai run remote benar-benar berjalan dan lulus.

Setiap penyelesaian berikutnya wajib menyebut scope, peran, bukti tes, dampak database dan batas penerimaan. Dokumen ini bukan pernyataan ERP enterprise siap produksi.

Anotasi check-run 112600805552: job tidak dimulai karena akun terkunci akibat billing. Gate final lokal lulus 267 backend/2207 assertions, 128 web, dua contracts serta semua pemeriksaan teknis. ENT-09a selesai; daftar dependensi di atas tetap berlaku.

Kemajuan berikutnya: PRJ-UI-003 direktori vendor selesai teknis, dengan search/pagination, respons lama, simpan/reload terpisah dan batas kontak tetap. [Scope/bukti](52_DIREKTORI_VENDOR_PROJECT.md). Gate final exit 0: 268 backend/2219 assertions, 134 web, dua contracts dan seluruh guard gate/policy/database/scanner. Lint/typecheck/build/Pint lulus. Tidak menutup penerimaan pengguna, pembayaran Project atau integrasi.

Setelah pull development b8620c5, UI-ACC-004 memperbaiki tema dan kelanjutan jurnal sesuai dokumen 54. 144 web/typecheck/build lulus; baseline lint development 105 error masih terbuka, sehingga gate keseluruhan belum lulus. API baru Project belum tersedia. Tidak menggantikan definisi PNL/HPP/bonus/CMO atau UAT.

- [x] ACC-VCH-001 — Voucher Pengajuan Pengeluaran Admin: jenis operasional, form identitas/pembayaran/referensi, rekening encrypted/masked, pratinjau dan PDF. Peran: keempat peran. 270 backend, 149 web, typecheck/build/lint file berubah serta 38 pemeriksaan database lulus. Migrasi additive setelah backup. Scope/batas: [dokumen 55](55_VOUCHER_PENGELUARAN_ADMIN.md). Admin ACC pusat; pembayaran nyata/BAST/penambahan izin Admin divisi lain tidak termasuk. Lint global development dan UAT bisnis tetap terbuka.

- [x] ACC-PAY-001 — Realisasi voucher oleh Finance dengan bukti wajib: sebagian/lunas, nominal presisi, versi/duplikasi, status/sisa di daftar/detail/PDF, dan pembatalan catatan oleh Manager. Peran: keempat peran. [Scope/bukti](56_REALISASI_PEMBAYARAN_VOUCHER.md). 154 web/typecheck/build/lint file berubah/policy dan 38 pemeriksaan database lulus. Migrasi additive sesudah backup, tanpa seed/transaksi native. Jurnal otomatis/mapping akun, UAT dan lint global tetap terbuka.

- [x] ACC-SEED-001 — Delapan skenario voucher UAT tersimpan melalui API pada PostgreSQL; seed idempotent, pengujian role/CSRF/versi/nominal/proof/audit dan perbaikan tempdir scanner. Peran: keempat peran. 88 pemeriksaan native, 277 backend/2346 assertions, 38 pemeriksaan database, scanner/Pint/lint seeder lulus. [Scope/bukti](57_SEED_UAT_DAN_KEAMANAN_VOUCHER.md). Hanya voucher; UAT bisnis/pentest/produksi tetap terbuka.

- [x] ACC-DASH-002 — Dashboard Accounting berbasis KPI/tren/antrean role/status/jadwal realisasi dan drill-down bulan/voucher. Keempat peran. 159 web, 279 backend/2378 assertions, 53 pemeriksaan native, typecheck/build/lint scoped/Pint/policy lulus. [Scope/bukti](58_DASHBOARD_ACCOUNTING_PEMANTAUAN.md). Data dari database, tanpa migrasi/seed tambahan; UAT bisnis dan produksi tetap terbuka.
