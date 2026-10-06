# Kontrak API dan inventaris endpoint

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Fullstack Programmer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Sumber dan kompatibilitas

[Inventaris aktual](lampiran/02_api_aktual.json) berisi 91 route api/v1 yang ditangkap dari Laravel route:list, termasuk method, action dan middleware. Inventaris tidak berarti setiap endpoint telah lolos UAT; route yang tidak memiliki fitur bisnis final harus diberi status pada backlog.

Base /api/v1. JWT diperiksa server; user berasal dari request attributes dan identifier aktor adalah sub. Kode web memakai cookie HttpOnly dengan credentials include; mutasi mengirim X-CSRF-Token yang terikat sesi. Bearer tetap didukung untuk klien API eksplisit. Kredensial login tidak dimasukkan ke query string.

## Envelope yang digunakan runtime

Sukses: { data, meta: { trace_id }, links: { self } }. Paginated omzet/voucher membawa items, total, current_page, last_page di data. Error: { error: { code, message, fields?, trace_id } }. File download berupa binary, delete tertentu 204 tanpa JSON. Response tidak mengandung token/password kecuali accessToken yang memang merupakan hasil login; token tidak masuk log.

HTTP: 200 baca/aksi; 201 create; 204 delete yang tersedia; 400 input tidak sah; 401 login diperlukan; 403 capability/scope/aktor; 404 objek tidak tersedia; 409 versi/state/duplikat; 422 aturan tertentu seperti jendela pengajuan omzet; 500 pesan generik. Error exact mengikuti ApiException dan handler, bukan contoh error SOP lama yang berbeda.

## Omzet

GET accounting/omzet/outlets; GET accounting/omzet dengan month wajib Y-m dan status/outlet_id/page optional; GET detail; POST create; PUT update; POST submit, request-unlock, review, decide, decide-unlock.

Payload create: outlet_id UUID, business_date Y-m-d, shift, outlet_amount/cash_amount/qris_amount/edc_amount/transfer_amount/other_amount decimal string, requires_ap boolean, source_reference, notes. Update menambahkan version. Client tidak menetapkan division/status/created_by/ap_amount. Review memakai version, decision validate/return, reason, ap_amount bila relevan; izin memakai unlock_id dan approve/reject sesuai tindakan. Validasi exact ada pada OmzetController dan service.

## Voucher

GET accounting/vouchers/outlets; GET list dengan month wajib, status/type/outlet_id/page optional; GET detail; POST create; PUT update; POST submit/review/decide. ID UUID. Akses baca view:acc_report; tulis write:voucher; review validate:voucher; decide approve:voucher.

Create: type BILLING/PURCHASING, outlet_id, voucher_date, due_date, entity_name, source_reference, amount, description. Update menambahkan version. Nomor/status/aktor dihasilkan server. submit hanya version; review decision validate/return; decide decision approve/reject; dua tindakan terakhir wajib reason minimal 10 karakter.

Contoh request create (data anonim, bukan data perusahaan):

    { "type": "BILLING", "outlet_id": "UUID-outlet-aktif", "voucher_date": "2026-10-06", "due_date": "2026-10-20", "entity_name": "Penerbit anonim", "source_reference": "INV-UJI-2026-001", "amount": "1000.50", "description": "Tagihan anonim untuk pengujian" }

UUID-outlet-aktif adalah penanda contoh; harus diganti ID valid saat pengujian. Field response mencakup status/version/nomor, aktor, snapshot sumber dan events; event bukan endpoint untuk dimutasi klien.

## Project dan Cellular

Project: GET/POST projects, GET/PUT/DELETE detail, endpoint milestone/payment-toggle, RAB, dokumen dan vendors menurut inventaris. ID Project integer; parameter proyek/dokumen harus diverifikasi kepemilikan relasinya. Upload Project multipart: document_type/title/file, batas kode 10 MB. Endpoint download dilindungi view:projects.

Cellular: endpoint baca outlets mengikuti route aktual; tidak mendefinisikan endpoint penjualan/inventory fiktif. Kontrak write Cellular harus dibuat setelah discovery.

## Rancangan kontrak fitur belum ada

Untuk PNL final, bonus, kontrak/pas/surat, lampiran voucher, stok dan pembayaran, dokumentasikan request/response, field, state machine, pagination, capability, scope, error, idempotency dan contoh sebelum implementation. Breaking change memerlukan catatan migrasi client/API; route snapshot tidak menggantikan spesifikasi tersebut.

## Pembaruan ACC-RPT-001 — 6 Oktober 2026

GET /api/v1/accounting/reports: baca metadata periode Accounting (division ACC saja) dengan capability view:acc_report dan scope. BOD hanya menerima approved/closed; filter Draft ditolak 403 dan diaudit. Query status opsional menerima Draft/Disetujui/Ditutup atau alias draft/approved/closed secara case-insensitive. Nilai lain/array menghasilkan 400 VALIDATION_ERROR. Filter tidak menambah hak akses. Tanpa periode: data berupa array kosong.

Status keluaran memakai label Indonesia dari status database. Response mempertahankan id/period/title/status/approvedAt/approvedBy/closedAt/closedBy. balanceStart dan balanceEnd kini null sampai saldo dihitung dari sumber yang disepakati; angka 0.00 placeholder dihapus. Perubahan nullability dicatat untuk konsumen; tidak ditemukan pemakaian kedua field oleh frontend saat pemeriksaan ini. Endpoint bukan perhitungan PNL/cashflow lengkap.

Logika query/otorisasi pada App/Services/Accounting/ReportService; controller mendelegasikan. Tidak menambah route, capability atau schema sehingga lampiran route/policy/schema tetap berlaku.

## Pembaruan backend BOD — 6 Oktober 2026

GET bod/overview: capability view:report (BOD) dan direktori aktif ACC/PROJECT/CELL; from/to opsional tanggal kalender Y-m-d, rentang terbalik/nilai array menghasilkan 400 VALIDATION_ERROR. Default bulan berjalan sampai hari ini WIB. Struktur revenue/target/performance/workforce tetap, nilai/source/freshness yang belum mempunyai sumber menjadi null; dataStatus not_available. Drill-down /accounting, /projects, /cellular.

GET bod/executive-read-model: tiga divisi aktif, kode KPI dari konfigurasi aktif, nilai null, tidak mengasumsikan kompatibilitas atau angka. kompatibilitas legacy di luar tiga kode mengembalikan false. Manager/Admin menerima 403 untuk endpoint BOD; anonymous 401. Formula/aggregasi angka BOD bukan bagian pekerjaan ini.

Revenue/Target/Budgeting/Reports retail dan Sobat tetap tidak mempunyai route (404); Accounting omzet/cashflow/reconciliation/import/outstanding tetap aktif. Route/policy/schema tidak berubah. DTO/client Sobat serta service PNL comparison yang tidak dirutekan telah dikeluarkan; integrasi/laporan masa depan tetap membutuhkan kontrak baru menurut backlog.

## Pembaruan keamanan akses — 6 Oktober 2026

Protected request kini memeriksa sub/jti, akun aktif dan email/role/divisi terhadap database. Snapshot tidak cocok atau identitas hilang mengembalikan 401 AUTH_REQUIRED; client harus login kembali. Tidak ada perubahan envelope/route/capability atau schema.

GET org/assignments dibatasi divisi valid/aktif bagi akun berscope; scope tidak valid menghasilkan data []. BOD global tetap lintas divisi. Dokumen Project salah parent/path di luar namespace mengembalikan 404 RESOURCE_NOT_FOUND pada download/delete. Path legacy valid tetap public sampai migrasi terpisah; jangan menyimpulkan semua file sudah private.

## Perubahan kontrak sesi

Login menetapkan access_token HttpOnly dan csrf_token; GET auth/me memulihkan CSRF cookie. Mutasi melalui cookie dengan CSRF hilang/salah menghasilkan CSRF_MISMATCH 403. Reset password sukses menghapus cookie dan membatalkan semua sesi sebelumnya; hasil message meminta login kembali. Semua kegagalan storage revocation menjadi error generik, bukan akses/Logout berhasil. [Rincian dan kebijakan origin](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md).

## Audit wajib mutasi

91 route tetap sama; protected routes kini membawa critical.audit (hanya bekerja pada mutasi, auth mempunyai transaksi audit sendiri). Audit wajib gagal: INTERNAL_ERROR 500 generik, perubahan database terkait dibatalkan. Trace yang tidak valid diganti server. Payload sukses tidak berubah. [Cakupan/korelasi/berkas](27_AUDIT_WAJIB_AKSI_KRITIS.md).

## Penyelarasan otorisasi jurnal/impor — 6 Oktober 2026

GET transactions, summary, detail dan download lampiran menggunakan view:acc_journal; role tanpa izin mendapat 403. Objek/periode transaksi di luar ACC tidak ditemukan (404), daftar/saldo dibatasi domain ACC. POST import/preview memakai submit:acc_period, sama dengan commit. Periode eksplisit salah/asing ditolak 404 tanpa fallback. Envelope tidak berubah. [Bukti](28_HAK_BACA_JURNAL_DAN_BATAS_OBJEK.md).

## Scan file pada unggahan — 6 Oktober 2026

Multipart unggahan Project, lampiran transaksi dan preview impor melewati file.scan setelah otorisasi. UPLOAD_REJECTED / 422 menolak deteksi/keterbatasan scan; SCANNER_UNAVAILABLE / 503 menolak kegagalan/binary atau database tidak siap. Berkas tidak diteruskan ke controller sebelum verdict clean. Envelope tidak berubah; batas file controller tetap berlaku. JSON rows bukan unggahan file. [Bukti](29_SCANNER_UNGGAHAN_DAN_KARANTINA.md).

## Ringkasan dan detail Accounting

GET cashflow/summary ditambahkan dengan view:acc_report, period dan hanya tiga KPI agregat. Voucher/omzet/outstanding/rekonsiliasi/cashflow lengkap/detail periode memakai view:acc_detail. Daftar periode dan metadata reports direduksi untuk role ringkasan. Cashflow menerima period_month YYYY-MM atau YYYY-MM-DD. Lock scanner sibuk menghasilkan SCANNER_BUSY / 429; coba kembali setelah scan pertama selesai. [Acuan](31_PROYEKSI_AKSES_ACCOUNTING.md) dan [operasi scanner](30_OPERASI_SCANNER_NATIVE.md).

## Perubahan Project/vendor — 6 Oktober 2026

GET projects/vendors: search string maksimal 255, per_page 1–100, page minimal 1; input salah 400. POST projects/{id}/rab: induk tidak ada/salah domain 404. POST/PUT projects: tanggal efektif selesai sebelum mulai 400. GET vendors dan vendors/{id} untuk enam role Project pembaca tidak menyertakan contact_person/phone/email/bank_details; Manager/Admin dan BOD mempertahankan akses baca sebelumnya, mutasi tetap manage:projects. Endpoint/envelope tidak berubah. [Bukti/batas](35_INTEGRITAS_PROJECT_DAN_VENDOR.md).

## Pembaruan teknis 6 Oktober 2026

Kontrak dan kontrol terbaru: [lampiran voucher](36_LAMPIRAN_VOUCHER_ACCOUNTING.md), [omzet tahunan](37_TRACKING_OMZET_TAHUNAN.md), [UI Project](38_UI_PROJECT_DAN_BATAS_AKSI.md), [Cellular manual](39_CELLULAR_MANUAL_DAN_STOK_JUMLAH.md). Snapshot lampiran aktual telah diperbarui: 59 tabel, 36 migrasi, 103 route API dan capability terkini. Hasil/pending pada [dokumen 40](40_HASIL_IMPLEMENTASI_DAN_PEKERJAAN_TERBUKA.md). UAT pengguna tidak diganti dengan hasil tes fixture.

## Rekap HR manual — 6 Oktober 2026

ACC-A01/ACC-A02 kini memiliki master pegawai minimal, rekap manual dan histori koreksi/void. Hak view:acc_hr terpisah dari view:acc_detail, terbatas Manager/Admin/Staff Accounting ACC; Admin menulis rekap, Manager/Admin mengelola master. Tidak menghitung hak cuti/gaji/bonus atau menganggap referensi persetujuan sebagai approval ERP. AC, sumber, batas, API dan bukti pada [dokumen 41](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Snapshot metadata/policy telah diperbarui.

## Pembaruan ACC-A10 tahap manual — 6 Oktober 2026

Rekap setoran tersedia pada /accounting/setoran dan tujuh route /api/v1/accounting/deposits. Admin alokasi ke satu kanal omzet tervalidasi; Finance penerimaan aktual bertahap. Nominal eksak, referensi unik, version/row lock, histori dan audit wajib. Tiga tabel acc_deposits/acc_deposit_receipts/acc_deposit_events, event append-only pada runtime. Bukti berupa referensi eksternal; unggahan, settlement/fee/jurnal otomatis dan UAT tetap terbuka. [Acuan dan bukti lengkap](42_REKAP_SETORAN_MANUAL.md). Peran: keempat peran.
