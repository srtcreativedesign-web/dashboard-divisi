# Rancangan keamanan, privasi, dan threat model

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Application Security Engineer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Aset dan batas kepercayaan

Aset: identitas/session, laporan pendapatan, rekening pemasok, kontrak, dokumen pegawai/pas bandara, transaksi dan audit. Batas: browser yang tidak dipercaya → API → service → DB/file; sistem eksternal → staging impor → data tervalidasi. Dokumen ini review awal berdasarkan kode yang dibaca, bukan audit penetrasi lengkap atau sertifikasi.

## Ancaman dan kontrol

- T-01 pemalsuan role/divisi/objek: identitas server, capability + scope + object lookup; uji IDOR/BOLA pada semua endpoint.
- T-02 pencurian token lewat XSS: pada baseline awal frontend menyimpan access_token di localStorage; mitigasi terkini tercatat pada dokumen 25. Klaim httpOnly pada UI/komentar tidak boleh dianggap bukti. Usulan: rancangan session/cookie HttpOnly Secure SameSite dan CSRF jika berpindah ke cookie, dengan rencana kompatibilitas. LocalStorage dapat diakses skrip dan XSS adalah risiko yang harus ditangani. [OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html).
- T-03 manipulasi nominal/persetujuan: decimal, validasi status/version, row lock, actor separation dan idempotency. Approval bukan izin pembayaran otomatis.
- T-04 kebocoran file: storage privat, object-scope download, allowlist tipe/ukuran, MIME/content validation, random file path, pembatasan download dan pemindaian malware sebagai target. Ekstensi saja tidak cukup; simpan di luar webroot. [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- T-05 brute-force/akun uji: rate limit login ada; 25 akun anonim dengan password UAT bersama hanya untuk local. Sebelum produksi hapus/nonaktifkan akun uji melalui prosedur yang disepakati, gunakan identitas/peran operasional dan secret berbeda.
- T-06 kehilangan/mutasi histori: domain events transactional, audit append-only secara aplikasi, backup dan restore teruji. Hak DB yang dapat memodifikasi audit perlu dipisahkan untuk produksi; saat ini role aplikasi adalah owner schema.
- T-07 impor/formula berbahaya: staging, ukuran/jenis tervalidasi, identifier sumber, row errors dan penanganan formula injection saat ekspor; belum mengklaim semua kontrol tersedia.

## Temuan/gap yang diketahui

F-01 token localStorage; F-02 file Project historis public belum dipindahkan; F-03 akun aplikasi owner untuk migrasi, belum dipisah migrator/runtime; F-04 beberapa capability/CRUD legacy lebih luas daripada proses rinci; F-05 server dev HTTP loopback tidak membuktikan TLS produksi; F-06 audit umum best-effort memerlukan keputusan untuk aksi kritis. Prioritas mitigasi sebelum produksi harus direview; tidak ada klaim data saat ini telah disalahgunakan.

## Data pribadi dan retensi

Absensi, cuti, kontak, rekening dan pas bandara perlu klasifikasi, tujuan pemrosesan, siapa boleh melihat, waktu retensi, akses export dan prosedur koreksi. Jangan memasukkan data pegawai nyata ke fixture atau bukti QA. Masa retensi hukum/kontrak dan hak pemrosesan belum disepakati, sehingga tidak dibuat angka retensi fiktif.

## Secrets dan operasi

.env/password/token tidak masuk dokumen atau Git. Berkas akun UAT tetap diabaikan Git. Gunakan kredensial role aplikasi untuk ERP, bukan postgres superuser. DBeaver memakai akun yang sesuai tujuan; akun readonly produksi adalah rancangan terpisah. Jangan mengubah pg_hba/password admin atau membukakan jaringan hanya demi memudahkan demo.

## Penerimaan keamanan

Uji seluruh actor/scope/status/version; objek/file salah tidak bocor; log bebas secret; error 500 generik; backup dipulihkan di lingkungan terpisah; akun uji tidak aktif saat produksi; keputusan session dan retensi selesai. Review mencatat bukti, residual risk dan pemilik mitigasi tanpa menganggap checklist sebagai sertifikasi.

## Mitigasi tambahan — 6 Oktober 2026

FND-SEC-ACCESS-001 memperbaiki JWT terhadap akun aktif/snapshot terkini, scope penugasan yang sebelumnya fail-open, dan namespace berkas Project pada unduh/hapus. 184/184 tes backend lulus (1290 assertions). [Bukti/batas](24_KEAMANAN_AKSES_DAN_DOKUMEN.md). F-01 localStorage dan F-02 file publik historis masih terbuka; bukan audit penuh atau sign-off produksi.

## Status terkini FND-SEC-SESSION-002

F-01 ditutup pada frontend saat ini dengan HttpOnly/CSRF dan pembersihan token lama. F-02 ditutup untuk database MVP saat ini: inventaris 0 file/record publik, tool migrasi privat teruji dan diterapkan. Catatan terbuka di bagian sebelumnya menggambarkan baseline sebelum perubahan. Pembatalan seluruh sesi setelah reset serta revocation fail-closed selesai. F-03/F-04/F-05/F-06 dan retensi/scanning tetap terpisah. [Bukti dan batas](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md).

## Mitigasi F-03 / FND-DB-OPS-001

Runtime kini tanpa ownership/DDL; migrator terpisah, monitor read-only tanpa hash password. Audit/riwayat omzet-voucher tidak dapat UPDATE/DELETE oleh runtime. Backup AES-GCM dan restore latihan terisolasi tervalidasi. F-03 ditutup untuk konfigurasi MVP lokal ini; privilege deployment baru dan offsite/retensi mengikuti runbook produksi. [Bukti](26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md).

## Mitigasi audit kritis FND-SEC-AUDIT-003

F-06 dimitigasi untuk aksi sukses auth dan mutasi API MVP yang tersedia: audit wajib dan perubahan database berada dalam transaksi; kegagalan audit membatalkan operasi. Percobaan terlarang/diagnostik masih best-effort dan tidak memberi izin. Runtime tidak dapat mengubah/menghapus histori master selain audit/domain event. Hak baca/retensi/malware dan crash recovery filesystem tetap terpisah. [Bukti dan batas](27_AUDIT_WAJIB_AKSI_KRITIS.md).

## Mitigasi sebagian F-04 — jurnal dan objek ACC

Izin laporan umum tidak lagi memberi hak API jurnal; batas objek/periode/rekening serta preview impor diperbaiki. 208 tes backend dan 75 tes web lulus. F-04 tetap terbuka untuk matriks field sensitif, domain lain dan delegasi. [Rincian](28_HAK_BACA_JURNAL_DAN_BATAS_OBJEK.md).

## Pemindaian unggahan baru — 6 Oktober 2026

T-04 kini memiliki karantina privat dan scan ClamAV native sebelum unggahan Project/lampiran Accounting/impor file diproses. Verdict tidak jelas/error/database lama menolak unggahan. Engine nyata dan API menolak EICAR; 218 backend tests lulus. Jadwal update, sisa karantina setelah crash, kontrol produksi serta akses field/delegasi/retensi tetap terpisah. [Bukti/batas](29_SCANNER_UNGGAHAN_DAN_KARANTINA.md).

## Status operasi dan privasi terbaru

Updater/probe harian dan login Windows, lock satu host serta recovery karantina lokal kini tersedia; [runbook](30_OPERASI_SCANNER_NATIVE.md). Pembatasan detail Accounting, proyeksi field ringkasan serta cache lintas login tersedia; [aturan awal/bukti](31_PROYEKSI_AKSES_ACCOUNTING.md). Klasifikasi awal/prosedur koreksi dan permintaan penghapusan tersedia; [acuan](32_KLASIFIKASI_DAN_KOREKSI_DATA.md). Retensi final, delegasi dan hak field domain lain tetap terbuka. Backup lokal terjadwal bukan pengganti offsite/key recovery produksi; [bukti restore](34_BACKUP_OTOMATIS_NATIVE.md).
