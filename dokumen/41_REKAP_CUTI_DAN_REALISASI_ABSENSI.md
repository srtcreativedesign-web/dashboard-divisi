# Rekap cuti dan realisasi absensi Accounting

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Application Security Engineer dan Senior Fullstack Programmer.

## Scope dan sumber

Implementasi awal ACC-A01/ACC-A02 mencatat sumber manual perusahaan. Master pegawai memakai tabel organisasi employees: kode unik, nama, aktif dan referensi sumber. Manager/Admin Accounting dapat mendaftarkan pegawai; tidak membuat akun login, penugasan outlet atau menyimpan NIK, biometrik, diagnosis dan rekening pribadi. Pegawai lintas divisi dikelola oleh Accounting pusat melalui service organisasi. Tidak mengisi pegawai contoh di database operasional.

Cuti: pegawai, jenis cuti sesuai sumber (teks), tanggal awal/akhir, jumlah hari dari sumber (hingga dua desimal), referensi sumber dan referensi persetujuan eksternal. Jumlah hari dimasukkan manual; bukan selisih tanggal kalender dan tidak mengurangi saldo hak cuti. Rentang cuti aktif seorang pegawai tidak boleh bertumpang tindih. Pecahan hari dapat dicatat sesuai sumber. Approval reference bukan bukti bahwa aplikasi telah mengesahkan persetujuan.

Absensi: pegawai, tanggal, status HADIR/TIDAK HADIR/CUTI/SAKIT/LIBUR, referensi jadwal, referensi sumber dan menit terlambat menurut sumber. Satu catatan aktif per pegawai/tanggal. Tidak menurunkan keterlambatan dari jam masuk, tidak menghitung potongan, lembur atau bonus. Status SAKIT tidak menyimpan diagnosis. Tanggal realisasi masa depan ditolak dalam WIB; cuti yang telah disetujui dapat memiliki tanggal mendatang.

## Hak awal dan histori

Hak baca rinci khusus Manager/Admin/Staff Accounting ACC. Finance, operasional ACC, domain lain dan BOD tidak menerima identitas/rekap HR rinci melalui modul baru. Ini pilihan awal konservatif, bukan grant HR otomatis berdasarkan view:acc_detail. Admin ACC mencatat, mengoreksi dan membatalkan rekap. Manager/Admin ACC mendaftarkan master pegawai minimal; pencatatan cuti/absensi tetap tugas Admin.

Koreksi membawa versi dan alasan, mengunci pegawai/record, menyimpan snapshot sebelum/sesudah dan audit actor/trace. Referensi sumber dan pegawai pada catatan tidak diganti; data salah pegawai dibatalkan lalu dibuat baru. Pembatalan beralasan mengubah status menjadi voided, tidak menghapus histori. Catatan voided tidak dapat dikoreksi kembali. Histori event append-only bagi runtime database. Referensi sumber unik per jenis/pegawai; pembatalan tidak membebaskan referensi yang sama. Gunakan referensi koreksi baru bila sumber sebelumnya sudah dibatalkan.

UI /accounting/kepegawaian menyediakan master pegawai minimal, tab cuti/absensi, filter bulan, pagination, form menurut role dan histori detail. Koreksi mempertahankan input saat gagal; versi basi ditolak. Filter cuti mencakup rentang yang menyentuh bulan pilihan, tanpa menjumlahkan hari lintas bulan sebagai jumlah bulanan. Loading/error/empty memakai data aktual.

## Batas penerimaan

Aturan kalender/hak cuti, penyetuju internal, jam kerja/shift, toleransi keterlambatan, eligibility bonus dan penerimaan pengguna belum ditetapkan. Modul ini menyelesaikan pencatatan manual/histori, bukan workflow HR lengkap atau formula gaji/bonus. Uji wajib: role/domain/field, tanggal/rentang, overlap, referensi duplikat, koreksi/version, pembatalan, absensi unik, audit rollback serta kondisi UI.

Status awal: scope implementasi ditulis sebelum kode. Bukti hasil ditambahkan setelah verifikasi.

## Hasil implementasi

Selesai teknis untuk scope manual pada 6 Oktober 2026. Halaman /accounting/kepegawaian dan tujuh endpoint HR aktif. Source reference master pegawai disimpan tetapi disembunyikan dari serialisasi umum Employee. Direktori HR hanya memberikan ID/kode/nama/aktif. Histori versi menyimpan snapshot sebelum/sesudah, alasan dan aktor; urutan memakai versi unik per record, bukan UUID acak saat timestamp sama.

Suite penuh 250 backend dan 97 web lulus; enam tes backend HR dan empat UI. Typecheck/lint/build/pint lulus. Uji HR tambahan memeriksa perubahan pegawai/referensi sumber yang dilarang serta rollback record/event saat audit gagal. Catatan pegawai tidak aktif tetap dapat dikoreksi/dibatalkan; catatan baru memerlukan pegawai aktif.

Migration 2026_10_06_160000 diterapkan setelah backup 59 tabel. Native kini 61 tabel/37 migrasi dan 110 route API. Percobaan pertama gagal karena foreignUuid tidak sesuai ID employees bertipe varchar; migrasi diperbaiki menjadi foreign key teks sesuai tabel organisasi, lalu diterapkan tanpa menghapus data. CHECK native menggunakan IS TRUE agar field wajib NULL tidak lolos melalui logika tiga nilai SQL. Index unik parsial mencegah dua absensi aktif per tanggal; referensi sumber tidak boleh digunakan ulang setelah void.

Smoke proxy/PostgreSQL 25 akun, 125 pemeriksaan lulus: read berdasarkan capability HR baru, role lain/domain/BOD ditolak, detail UUID tidak ada 404 bagi pembaca sah, invalid input master 400 bagi pengelola dan 403 untuk role lain. Bukti C:/ERP/hr-native-smoke-2026-10-06.json. Master/rekap/event native tetap 0; tidak membuat data contoh pegawai di database kerja. Enam probe constraint native pada tabel TEMP lulus: cuti/absensi valid diterima; hari NULL, tanggal terbalik, menit NULL dan absensi duplikat ditolak. Bukti C:/ERP/hr-native-constraints-2026-10-06.json. Tidak mengklaim uji konkurensi multi-request dari probe ini.

Runtime dilarang UPDATE/DELETE acc_hr_events; 36 pemeriksaan privilege lulus. Backup terbaru terenkripsi C:/ERP/backups/dashboard-divisi/2026-10-06T07-38-11-960Z-4560b65f.erpbackup (SHA-256 7c95124b5e22fa62af02ca46834fecdb1775cd8f1926ef8dfd0a3dca0b211a40) berhasil direstore ke database latihan terpisah dashboard_divisi_mvp_restore_d096daed: 61 tabel/empat berkas cocok. Target latihan dibersihkan; database kerja tidak ditimpa.

## Cara mencoba

Manager/Admin ACC membuka Master pegawai, mendaftarkan kode/nama dan referensi sumber. Admin ACC kemudian mencatat cuti atau absensi sesuai sumber. Gunakan Koreksi dengan alasan bila nilai salah; gunakan Batalkan bila sumber tidak berlaku/pegawai salah. Staff Accounting hanya membaca dan meninjau histori. Manager dapat mengelola master tetapi tidak mencatat rekap tugas Admin.

Jumlah cuti dan keterlambatan tetap sumber manual. Kalender/saldo hak cuti, approval internal, shift, gaji/bonus dan penerimaan pengguna belum selesai. TODO-10a ditutup hanya untuk pencatatan sumber/histori; parent TODO-10 masih mencakup bonus, persediaan dan setoran.
