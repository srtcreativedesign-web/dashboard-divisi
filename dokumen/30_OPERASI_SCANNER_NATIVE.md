# Operasi scanner native

Tanggal: 6 Oktober 2026. Peran: Application Security Engineer dan Senior Fullstack Programmer.

## Implementasi dan bukti

Task Windows `DashboardDivisi-ClamAV-Maintenance` menjalankan updater signature resmi, probe berkas bersih/EICAR, lalu rekonsiliasi karantina. Jadwal lokal: setiap hari pukul 02.30 WIB dan saat pengguna Windows masuk. Task memakai akun pengguna saat ini, privilege terbatas, proses tersembunyi, tanpa Docker. Jadwal ini keputusan operasi lingkungan pengembangan, bukan SLA produksi.

Eksekusi task pada 6 Oktober pukul 12.07 WIB selesai dengan LastTaskResult 0. Laporan `C:/ERP/tools/clamav/maintenance-status.json` menunjukkan updateSucceeded, scannerReady dan quarantineReconciled true; seluruh hitungan karantina 0. Task hanya berjalan ketika konteks pengguna tersedia; laptop mati atau belum login tidak menjamin eksekusi tepat waktu.

`npm run scan:status` membaca hasil terakhir. `npm run scan:maintain` menjalankan pemeliharaan manual. `npm run scan:test` menguji parser konfigurasi dan kegagalan operasi. Status lama tidak membuktikan scanner siap saat ini; `php artisan erp:scan-check` memeriksa kesiapan langsung. Periksa timestamp dan LastTaskResult apabila unggahan ditolak. Log updater: `C:/ERP/tools/clamav/freshclam.log`. Secret konfigurasi database dan keluaran mentah subprocess tidak dimasukkan laporan.

## Concurrency dan recovery

Scanner memakai satu lock cache file lokal, di luar transaksi database, dengan TTL timeout scanner + 10 detik. Permintaan kedua ditolak 429 `SCANNER_BUSY`, bukan dijalankan bersamaan. UI dapat mencoba kembali setelah proses pertama selesai. Ini batas satu host; deployment beberapa host memerlukan keputusan penyimpanan lock dan kapasitas bersama.

`php artisan erp:quarantine-reconcile` adalah dry-run. `--apply` menghapus hanya berkas UUID v4 langsung di root karantina yang sudah berumur lebih dari 15 menit. Durasi ini batas berkas sementara teknis, bukan retensi dokumen bisnis. Root berbeda, symlink, direktori turunan dan nama tidak dikenali tidak dihapus; keadaan tidak dikenali membuat pemeriksaan gagal. Berkas baru dipertahankan agar proses aktif tidak terganggu.

## Pengujian

Lima UploadOperationsTest menguji lock sibuk, release setelah kegagalan, dry-run, berkas baru, nama/direktori tak dikenal, dan root storage lain. Tiga tes Node menguji parser/path serta pelaporan kegagalan updater/probe/cleanup. Suite backend setelah perubahan akses Accounting: 226 tes, 1607 assertions lulus. Instalasi ulang task pada mesin baru harus menyesuaikan path Node/PHP dan akun Windows; task bukan artefak deployment lintas mesin.
