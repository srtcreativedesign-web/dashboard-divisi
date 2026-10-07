# Audit wajib aksi kritis

Tanggal: 6 Oktober 2026. Task FND-SEC-AUDIT-003 / TODO-04d-1. Peran: Application Security Engineer + Senior Fullstack Programmer; pencatatan sebagai Senior Product Manager.

## Keputusan dan cakupan

Mutasi API yang sudah tersedia pada MVP harus memiliki audit tersimpan sebelum sukses dikembalikan. Identitas aktor berasal dari autentikasi server. Audit wajib tidak digantikan buffer memory dan tidak menelan kegagalan INSERT. Jika audit gagal, response menjadi INTERNAL_ERROR 500 generik; perubahan database dalam transaksi terkait dibatalkan.

Login wajib menulis auth.login sebelum token/cookie dikembalikan. Logout menyimpan revocation dan auth.logout dalam satu transaksi; cache revocation positif baru diisi setelah commit. Reset password, kenaikan session_version dan auth.reset berada dalam satu transaksi; password/version/sesi tidak berubah jika audit gagal.

Omzet dan voucher memakai audit domain wajib bersama record serta domain events yang sudah transactional. Approval gagal audit tidak mengubah status, versi atau histori. Semua mutasi terlindungi lainnya dibungkus CriticalMutationAudit. Bila service belum menulis audit wajib yang masih ada dalam transaksi, middleware menulis api.mutation dengan route, entity ID, method, parameter route dan status. Ini mencakup CRUD master/periode/transaksi/import Accounting dan Project/vendor/RAB/milestone/flag pembayaran/dokumen. Cellular saat ini hanya mempunyai endpoint baca; tidak mengklaim audit fitur transaksi Cellular yang belum dibuat.

Middleware memeriksa keberadaan record audit, bukan hanya flag: audit yang telah di-rollback pada transaksi nested tidak dapat menyebabkan audit route dilewati. Response error membatalkan transaksi. Percobaan terlarang tetap ditolak; pencatatan penolakan/diagnostik boleh best-effort agar outage audit tidak mengubah penolakan menjadi izin. Tidak ada aksi sukses tanpa audit pada cakupan tersebut.

## Trace dan isi audit

Trace HTTP dan record audit dikorelasikan; header trace hanya diterima bila 1–100 karakter alfanumerik, underscore atau tanda minus. Nilai lain diganti UUID server. Record lama dengan trace kosong tidak dibackfill dengan histori fiktif.

Audit route tidak menyalin body request, cookie, JWT, password atau isi berkas. Hanya actor server, entity/ID dan metadata route yang dicatat. Metadata audit domain tetap melalui sanitizer key sensitif; actor email merupakan identitas audit yang perlu kebijakan retensi/hak baca. Jangan memasukkan secret ke kolom alasan bisnis. AuditService.findAll membaca database dan tidak menyajikan buffer memory sebagai histori ketika query gagal.

## Berkas dan rollback

Unggahan Project dan bukti Accounting mendaftarkan penghapusan berkas jika transaksi request gagal. Penghapusan dokumen Project menyimpan isi sementara untuk dikembalikan bila metadata/audit gagal. Storage failure tidak dianggap sukses. Uji outage audit membuktikan upload tanpa metadata/file tertinggal dan delete memulihkan metadata/isi file.

Kompensasi ini menangani exception normal selama request. PostgreSQL dan filesystem bukan satu transaksi atomik: crash proses/mesin, storage tidak dapat ditulis atau hasil commit jaringan yang tidak pasti memerlukan rekonsiliasi/pemulihan. Kegagalan kompensasi dilaporkan tanpa isi berkas/secret. Backup/restore tetap diperlukan; tidak ada klaim crash recovery lintas filesystem selesai pada task ini.

## Hak database

Runtime kini tidak dapat UPDATE/DELETE audit_events, acc_omzet_events, acc_voucher_events maupun accounting_master_history. SELECT/INSERT tetap tersedia. Runner role menyelaraskan ACL setelah migrasi; owner/migrator tetap privileged sesuai runbook. Ini pembatasan runtime, bukan bukti histori tidak dapat diubah oleh administrator database.

## Verifikasi

204/204 tes backend lulus (1378 assertions), termasuk 11 tes baru CriticalAuditTest. Lint dan formatter scoped lulus; diff check bersih. Pengujian rollback menggunakan SQLite in-memory/fake storage; tidak menghapus tabel PostgreSQL operasional. Bukti suite: C:/ERP/backend-critical-audit-2026-10-06.xml.

Kasus tambahan: login tanpa cookie saat audit gagal; reset password/version rollback; logout tanpa revocation DB/cache palsu; create omzet/voucher rollback bersama events; approval voucher mempertahankan status/version; Project update rollback; file upload/delete kompensasi; actor/entity/trace server dan body secret tidak disalin; trace terlalu panjang diganti; nested audit rollback memicu audit route baru.

PostgreSQL aktif: 30 pemeriksaan privilege lulus dengan 0 baris uji disimpan, termasuk dua larangan tambahan histori master. Smoke login/me/cookie/CSRF/logout tetap lulus dan dua audit auth beserta trace benar-benar tersimpan. Tidak mengubah akun/password, schema atau jumlah migrasi (34 migrasi/54 tabel). Inventaris 91 route diperbarui untuk middleware audit.

## Batas dan berikutnya

TODO-04d-1 selesai pada mutasi API MVP yang tersedia dan auth di atas. Maintenance CLI/provisioning administrator di luar request API mengikuti runbook operasional; tidak diklaim mendapat audit transaksi melalui middleware ini. Histori master domain yang sudah ada dipertahankan; audit route tidak menggantikan detail histori bisnis.

TODO-04 keseluruhan tetap terbuka: review hak baca rinci, retensi/data pribadi, dan scanning malware/karantina belum selesai. Hak baca rinci didahulukan berikutnya; kebutuhan retensi tetap memerlukan pemilik data. UAT penerimaan akhir belum dilewati.
