# Scanner unggahan dan karantina privat

Tanggal: 6 Oktober 2026. Peran: Application Security Engineer, Senior Fullstack Programmer dan Senior Product Manager.

Status: TODO-04d-4 selesai teknis untuk unggahan API MVP yang tersedia. Pengguna mengizinkan pemasangan ClamAV native setelah meminta penjelasan. Tidak memakai Docker.

## Fungsi dan cakupan

ClamAV memindai byte berkas untuk deteksi malware dengan database signature. Validasi ukuran, tipe, hak akses dan status tetap berlaku; hasil bersih bukan jaminan semua ancaman bisa dikenali. Dokumen tidak dikirim ke layanan pemindaian eksternal. FreshClam mengakses sumber resmi untuk memperbarui database deteksi.

Middleware file.scan dipasang setelah autentikasi/scope/capability pada tiga endpoint multipart:

- POST accounting/transactions/{id}/attachments.
- POST projects/{id}/documents.
- POST accounting/import/preview jika memakai file.

Preview JSON rows tanpa berkas mengikuti validasi impor, bukan scan file. Unduh lama dan unggahan dari CLI/service langsung di luar HTTP tidak otomatis dipindai. Inventaris PostgreSQL MVP saat verifikasi: 0 dokumen Project dan 0 lampiran transaksi.

## Alur dan penolakan

Unggahan sementara disalin dengan nama UUID ke storage/app/quarantine yang privat, tidak served dan tidak mempunyai endpoint unduh. Batas awal 10 MB, disusul batas lebih ketat pada controller masing-masing. Checksum salinan harus sesuai byte unggahan. ClamAV dijalankan sebagai proses dengan array argument, tanpa membangun perintah shell dari filename pengguna.

Berkas diteruskan ke controller hanya setelah exit code 0, verdict OK eksplisit untuk path yang dipindai dan stderr kosong. Checksum salinan serta byte unggahan diperiksa kembali sebelum pemrosesan. Exit 1 ditolak dengan UPLOAD_REJECTED / 422; binary hilang, timeout, error, verdict kosong atau database terlalu lama ditolak SCANNER_UNAVAILABLE / 503. Tidak tersedia opsi bypass runtime. Nilai deteksi/raw output/isi berkas tidak dikirim ke UI atau audit.

Konfigurasi proses: timeout 60 detik, file 10 MB, total scan container 100 MB, kedalaman 16. Alert berlaku jika batas scanner terlampaui atau kontainer terenkripsi tidak dapat diperiksa. Database deteksi lebih tua dari 7 hari ditolak dengan flag clamscan; ini batas teknis freshness, bukan aturan retensi data bisnis.

Salinan karantina dihapus pada akhir request, termasuk penolakan atau kegagalan controller. Jika cleanup gagal, sistem melaporkan perlunya rekonsiliasi storage. Crash/kill server dapat menyisakan salinan privat; belum ada sweeper atau aturan retensi otomatis. Pemindaian sinkron tidak menyediakan queue/circuit breaker; satu scan bersih terukur sekitar 13–14 detik pada komputer ini karena engine/database dimuat setiap proses.

Audit mutasi sukses menyimpan engine dan SHA-256 hasil scan bersama trace. Penolakan scanner dicatat sebagai upload.scan.denied sesudah rollback; pencatatan penolakan best-effort, tidak mengubah keputusan menolak. Audit sukses tetap wajib sesuai dokumen 27.

## Pemasangan lokal yang diterapkan

ClamAV 1.5.4 Windows x64 portable dari rilis resmi Cisco-Talos. Tidak memasang service, tidak membuka port scanner dan tidak mengubah antivirus sistem. Checksum ZIP sesuai metadata SHA-256 rilis: 0d9e0228b2674137ea1a2853566c98a0278ad52ab2582c3d6dbd75373848c395.

- Engine: C:/ERP/tools/clamav/engine-1.5.4/clamav-1.5.4.win.x64.
- Database deteksi: C:/ERP/tools/clamav/database.
- Konfigurasi updater: C:/ERP/tools/clamav/freshclam.conf.
- Metadata paket: C:/ERP/tools/clamav/release.json.
- Konfigurasi ERP: UPLOAD_SCANNER_BINARY dan UPLOAD_SCANNER_DATABASE pada apps/api/.env privat; contoh kosong tersedia pada .env.example. Jangan menaruh kredensial di dokumen.

FreshClam berhasil mengunduh/menguji signature resmi: daily versi 28144, main 63 dan bytecode 339. Konfigurasi ini lokal; server baru harus memasang engine dan signature sebelum menerima unggahan. Artefak engine/signature berada di luar Git dan bukan bagian backup database/private files yang sudah dibuat.

## Pemeriksaan dan pemeliharaan

Dari apps/api jalankan php artisan erp:scan-check. Command memakai berkas anonim serta string uji EICAR, menuntut clean diterima dan EICAR ditolak, lalu membersihkan salinannya. Command tidak mengubah data bisnis. Bila command gagal, jangan melewati scan untuk melanjutkan unggahan.

Perbarui database deteksi melalui PowerShell:

```powershell
& 'C:\ERP\tools\clamav\engine-1.5.4\clamav-1.5.4.win.x64\freshclam.exe' --config-file=C:\ERP\tools\clamav\freshclam.conf --quiet
```

Jalankan ulang erp:scan-check setelah update atau perubahan engine. Jadwal pembaruan otomatis, monitoring usia signature/kapasitas, concurrency produksi, pemulihan dependency pada server baru dan prosedur sisa karantina masih perlu diselesaikan pada operasi produksi. Tidak membuat scheduled task tanpa permintaan pengelolaan jadwal.

## Bukti

- 218/218 tes backend lulus, 1503 assertions; 10 tes UploadScanningTest menguji verdict bersih/ditolak/error/kosong, perubahan byte, ukuran, cleanup, aktor salah, endpoint yang dilindungi dan command kesiapan. Regresi menggunakan SQLite in-memory/fake storage/scanner fixture; process fake tidak diklaim sebagai deteksi engine nyata.
- Mesin native sebenarnya: berkas bersih diterima (12627 ms), EICAR ditolak 422, scanner hilang ditolak 503. Command erp:scan-check berhasil.
- Endpoint aktif import/preview: clean melewati scanner (14323 ms), lalu 404 PERIOD_NOT_FOUND karena belum ada periode; ini bukan klaim impor transaksi sukses. EICAR ditolak 422 UPLOAD_REJECTED (13238 ms). Tidak menciptakan periode/transaksi contoh.
- Audit penolakan scanner nyata ditemukan di PostgreSQL beserta trace; folder karantina kosong setelah pengujian. Tidak ada perubahan schema/role/kredensial database.
- Lint, formatter PHP scoped dan diff check lulus. Tidak ada perubahan frontend pada task ini; hasil frontend sebelumnya tetap 75 tes.
- Bukti backend: C:/ERP/backend-upload-scanning-final-2026-10-06.xml. Bukti HTTP: C:/ERP/upload-scanner-smoke-2026-10-06.json. Inventaris route tetap 91 dan middleware diperbarui.

## Acuan

[Scanning ClamAV](https://docs.clamav.net/manual/Usage/Scanning.html), [paket Windows portable](https://docs.clamav.net/faq/faq-win32.html), [rilis resmi](https://github.com/Cisco-Talos/clamav/releases/tag/clamav-1.5.4), [proses Laravel](https://laravel.com/framework/docs/13.x/processes).

TODO-04 induk tetap terbuka: hak baca field/delegasi, retensi dan kontrol operasional belum semua selesai. Scan unggahan ini tidak menyelesaikan keamanan impor formula, review seluruh field atau keamanan filesystem terhadap administrator host.
