# Dokumentasi ERP Dashboard Divisi

Versi 0.1 · 6 Oktober 2026 · Draf untuk review.
Disusun sebagai Senior Product Manager, Senior Product Designer, Application Security Engineer dan Senior Fullstack Programmer.

Accounting pusat, Project dan Cellular: kebutuhan, proses, UI, data/API, keamanan, UAT dan operasional. Kebutuhan pengguna, kondisi aktual dan usulan dibedakan. Belum persetujuan produksi. Kode aplikasi/data bisnis tidak diubah dalam pekerjaan dokumentasi ini.

## Urutan review

PRD → proses → role → spesifikasi tiga divisi → keputusan terbuka → backlog. Pilih batas rilis; definisikan CMO/formula; jelaskan alur Project/Cellular sebelum pengembangan berikutnya.

## 20 dokumen

1. [PRD ERP — tujuan dan batas MVP](01_PRD_ERP_MVP.md)
2. [Proses bisnis dan pembagian tanggung jawab](02_PROSES_BISNIS_DAN_RACI.md)
3. [Role, scope, dan pemisahan tugas](03_ROLE_DAN_HAK_AKSES.md)
4. [Spesifikasi kebutuhan Divisi Accounting](04_SPESIFIKASI_ACCOUNTING.md)
5. [Spesifikasi kebutuhan Divisi Project](05_SPESIFIKASI_PROJECT.md)
6. [Spesifikasi kebutuhan Divisi Cellular](06_SPESIFIKASI_CELLULAR.md)
7. [Aturan bisnis, perhitungan, dan sumber laporan](07_ATURAN_BISNIS_DAN_LAPORAN.md)
8. [Desain UI/UX dan alur per role](08_DESAIN_UI_UX.md)
9. [Data Dictionary, model domain, dan ERD](09_DATA_DICTIONARY_DAN_ERD.md)
10. [Arsitektur aplikasi dan batas domain](10_ARSITEKTUR_APLIKASI.md)
11. [Kontrak API dan inventaris endpoint](11_KONTRAK_API.md)
12. [Rancangan keamanan, privasi, dan threat model](12_KEAMANAN_DAN_PRIVASI.md)
13. [Integrasi, impor, dan migrasi data](13_INTEGRASI_DAN_MIGRASI_DATA.md)
14. [Rencana pengujian, UAT, dan bukti penerimaan](14_RENCANA_PENGUJIAN_DAN_UAT.md)
15. [Backlog dan rencana implementasi](15_BACKLOG_DAN_RENCANA_IMPLEMENTASI.md)
16. [Operasional database, backup dan rilis](16_OPERASIONAL_DATABASE_DAN_RILIS.md)
17. [Register keputusan, risiko dan pertanyaan](17_KEPUTUSAN_RISIKO_PERTANYAAN.md)
18. [Traceability kebutuhan dan gap implementasi](18_TRACEABILITY_DAN_GAP_IMPLEMENTASI.md)
19. [Sumber, glosarium dan riset CMO](19_SUMBER_GLOSARIUM_DAN_RISET_CMO.md)
20. [Tata kelola dokumen dan perubahan](20_TATA_KELOLA_DOKUMEN_DAN_PERUBAHAN.md)

## Empat lampiran aktual

- [Schema PostgreSQL](lampiran/01_skema_aktual.json): 61 tabel, 37 migrasi (termasuk sesi, lampiran voucher, Cellular manual dan rekap HR).
- [API](lampiran/02_api_aktual.json): 110 route api/v1.
- [Policy](lampiran/03_policy_aktual.json): capability bukan bukti fitur selesai.
- [ERD fisik](lampiran/04_ERD_FISIK_AKTUAL.md): foreign key tercatat.

Tidak memuat baris transaksi/password/token. Credential uji tetap pada konfigurasi privat. Gambar aturan pengguna belum tersedia untuk pemeriksaan kepatuhan.

## Acuan kerja dan progres — 6 Oktober 2026

Pengguna menetapkan paket ini sebagai acuan kerja dan mengizinkan melanjutkan implementasi. Status draf pada versi awal dipertahankan sebagai riwayat; pertanyaan yang belum terdefinisi tetap terbuka dan bukan approval produksi.

- [TODO implementasi](21_TODO_IMPLEMENTASI.md): urutan, peran, dependensi dan bukti.
- [Inventaris regresi backend](22_INVENTARIS_REGRESI_BACKEND.md): hasil suite penuh terbaru.

Perbaikan fondasi laporan dicatat pada kontrak API dan task ACC-RPT-001. Tidak ada migrasi schema/data bisnis pada pekerjaan ini.

- [Restrukturisasi backend MVP](23_RESTRUKTURISASI_BACKEND_MVP.md): backend legacy yang dikeluarkan, BOD baru, recovery source dan 175/175 tes backend lulus (1261 assertions).

- [Keamanan akses dan dokumen](24_KEAMANAN_AKSES_DAN_DOKUMEN.md): hasil perbaikan, 184/184 tes backend lulus (1290 assertions), dan residual risk sesi/file historis.

- [Sesi, CSRF dan migrasi dokumen](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md): hasil terkini, migrasi PostgreSQL diterapkan, 193 backend/73 web/2 contracts lulus. Catatan kondisi pada dokumen 24 merupakan riwayat sebelum task ini.

- [Backup/restore dan role database](26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md): runtime terbatas, DBeaver read-only, migrator terpisah dan bukti restore lokal.

- [Audit wajib aksi kritis](27_AUDIT_WAJIB_AKSI_KRITIS.md): transaksi/audit, kompensasi berkas, 204 tes backend dan batas cakupan.

- [Hak baca jurnal dan batas objek Accounting](28_HAK_BACA_JURNAL_DAN_BATAS_OBJEK.md): hasil teknis serta keputusan matriks field yang masih terbuka.

- [Scanner unggahan dan karantina](29_SCANNER_UNGGAHAN_DAN_KARANTINA.md): ClamAV native, hasil tes engine/API dan petunjuk pemeliharaan lokal.
- [Operasi scanner native](30_OPERASI_SCANNER_NATIVE.md): task Windows, readiness, lock scanner dan recovery berkas sementara.
- [Proyeksi akses Accounting](31_PROYEKSI_AKSES_ACCOUNTING.md): ringkasan/detail, field periode dan cache sesi.
- [Klasifikasi dan koreksi data](32_KLASIFIKASI_DAN_KOREKSI_DATA.md): acuan awal privasi; durasi retensi bisnis belum ditetapkan.
- [Paket UAT omzet dan voucher](33_UAT_TEKNIS_OMZET_DAN_VOUCHER.md): skenario normal/koreksi/error/selisih dan batas H+1.
- [Backup otomatis native](34_BACKUP_OTOMATIS_NATIVE.md): task Windows dan bukti restore terbaru, dengan batas recovery produksi.
- [Integritas Project dan vendor](35_INTEGRITAS_PROJECT_DAN_VENDOR.md): induk RAB, tanggal/filter, kontak terbatas dan form tambah/edit.

- [Lampiran voucher Accounting](36_LAMPIRAN_VOUCHER_ACCOUNTING.md): unggah/download privat, scanner dan audit.
- [Tracking omzet tahunan](37_TRACKING_OMZET_TAHUNAN.md): validated, 12 bulan dan komparasi outlet.
- [UI Project dan batas aksi](38_UI_PROJECT_DAN_BATAS_AKSI.md): form tambah proyek, role dan penandaan administratif.
- [Cellular manual dan stok jumlah](39_CELLULAR_MANUAL_DAN_STOK_JUMLAH.md): fakta pengguna, katalog/stok/penjualan manual.
- [Hasil implementasi dan pekerjaan terbuka](40_HASIL_IMPLEMENTASI_DAN_PEKERJAAN_TERBUKA.md): bukti teknis terkini, sisa implementasi dan keputusan yang belum ditetapkan.

- [Rekap cuti dan realisasi absensi](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md): sumber manual, master pegawai minimal, privasi dan histori koreksi.

- [Rekap setoran manual](42_REKAP_SETORAN_MANUAL.md): alokasi ke omzet tervalidasi, penerimaan bertahap Finance, histori dan batas integrasi.

- [Audit dan perbaikan UI Accounting](43_AUDIT_DAN_PERBAIKAN_UI_ACCOUNTING.md): menu, pintasan, format, panel setoran dan bukti visual tahap pertama.
