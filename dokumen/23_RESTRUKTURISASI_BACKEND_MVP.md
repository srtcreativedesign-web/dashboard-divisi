# Restrukturisasi backend MVP

6 Oktober 2026. Peran: Senior Product Manager, Senior Fullstack Programmer dan Application Security Engineer.

Pengguna mengizinkan penghapusan/backend baru bila backend lama tidak sesuai. Keputusan: pertahankan auth/policy/audit dan domain aktif Accounting/Project/Cellular; hapus service yatim dan bangun ulang ringkasan BOD yang masih memakai angka acak. Tidak menghapus database, migration historis atau model data lama pada tahap ini.

## Kode yang dikeluarkan

- apps/api/app/Services/RevenueService.php
- apps/api/app/Services/TargetService.php
- apps/api/app/Services/BudgetingService.php
- apps/api/app/Services/ReportService.php
- apps/api/app/Services/PnlComparisonService.php
- apps/api/app/Services/SobatHrClientService.php
- apps/api/app/Services/Sobat/Contracts/SobatClientInterface.php
- apps/api/app/Services/Sobat/Dto/SobatTenantDto.php
- apps/api/app/Services/Sobat/Mappers/SobatTenantMapper.php
- apps/api/app/Http/Requests/SyncTenantsRequest.php
- apps/api/tests/Feature/RevenueTest.php
- apps/api/tests/Feature/RevenueBatchUploadTest.php
- apps/api/tests/Feature/TargetTest.php
- apps/api/tests/Feature/BudgetingTest.php
- apps/api/tests/Feature/ReportsTest.php
- apps/api/tests/Feature/SobatIntegrationTest.php

Enam suite lama menuntut endpoint retail/target/budgeting/Sobat yang sudah tidak dirutekan. Diganti LegacyEndpointBoundaryTest untuk membuktikan 16 pola endpoint tetap 404 bahkan bagi BOD. Pengujian Accounting cashflow/reconciliation/omzet/import/master/utang-piutang tetap berjalan. Fitur PNL/komparasi dan integrasi masa depan tetap backlog; penghapusan service lama bukan penyelesaian kebutuhan tersebut.

## Backend yang dibangun ulang

BOD overview hanya mengambil master aktif ACC/PROJECT/CELL melalui service organisasi. Nilai/source/freshness belum tersedia dikirim null dan dataStatus not_available; tidak menggunakan rand atau angka fallback. Executive read model mengambil kode KPI dari konfigurasi, tanpa mengarang nilai. Service pusat menegakkan capability view:report. Manager/Admin tetap menggunakan workspace masing-masing dan tidak mendapat akses BOD.

Metadata schema/route/policy tidak berubah; bentuk overview menambah dataStatus dan menghapus angka dummy. Status UI perlu menampilkan belum tersedia untuk null. Pengujian status akses, divisi nonaktif, tanggal salah dan endpoint legacy dimasukkan. Hasil tes akan ditambahkan setelah verifikasi.

## Verifikasi dan pemulihan

175/175 tes backend lulus (1261 assertions). Formatter scoped dan git diff --check selesai. Pemeriksaan referensi tidak menemukan pemanggil service yang dihapus pada app/routes/tests. Pengujian domain Accounting/Project/Cellular tetap dijalankan pada SQLite in-memory; PostgreSQL/schema/data bisnis tidak diubah.

Enam suite perilaku endpoint yang sudah dikeluarkan dari MVP dihentikan, bukan diperbaiki dengan menghidupkan kembali fitur. Enam belas kasus boundary membuktikan endpoint lama tetap tidak tersedia. Jumlah kasus berubah; passing suite ini bukan bukti setiap fitur legacy telah dibangun ulang atau UAT bisnis selesai.

Sebelum penghapusan, 16 berkas disalin utuh ke C:/ERP/legacy-backend-backup-2026-10-06 dengan manifest.json dan SHA256 terverifikasi. Tidak ada modifikasi lokal pada target yang dihapus. Pemeriksaan persetujuan otomatis pertama menolak cakupan penghapusan; setelah bukti dependensi dan salinan pemulihan, review ulang mengizinkan tindakan. Salinan dapat dipakai mengembalikan source bila diperlukan; ini backup source, bukan backup database.

Organisasi/config masih mempunyai fixture legacy khusus testing untuk kasus kompatibilitas; bootstrap operasional tetap tiga divisi. Migrasi/model historis tetap ada dan belum dibersihkan. Review sesi/token, akses dokumen lama, restore database dan least privilege masih TODO terpisah.
