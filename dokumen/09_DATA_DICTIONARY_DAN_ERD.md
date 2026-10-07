# Data Dictionary, model domain, dan ERD

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Fullstack Programmer + Senior Product Manager
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Sumber fisik

Snapshot PostgreSQL: 33 migrasi dan 54 tabel public. [Skema aktual](lampiran/01_skema_aktual.json) mencantumkan seluruh kolom, tipe, nullable, indeks, uniqueness dan foreign key. [ERD fisik](lampiran/04_ERD_FISIK_AKTUAL.md) dibuat dari FK, bukan tebakan relasi model. Metadata ini tidak berisi baris transaksi, password atau token.

Tabel legacy/admin/retail dan cache/jobs masih ada. Jumlah tabel tidak sama dengan jumlah fitur MVP. Migrasi Laravel adalah sumber skema kanonik; packages/db Prisma tidak dijadikan acuan baru. Tabel Project lama belum berprefix prj_; jangan mengganti nama tanpa rencana kompatibilitas.

## Kamus bisnis minimum

- Divisi: unit penugasan atau sumber organisasi. Domain MVP ACC/PROJECT/CELL. Accounting pusat bukan outlet penjualan.
- Outlet/tenant: identitas sumber operasional. Hubungan tenant terhadap outlet, penerbit tagihan dan kontrak belum dijelaskan; jangan menyamakan ketiganya diam-diam.
- User: identitas autentikasi, role, divisi dan status. UserScope: penugasan pada divisi/outlet. Pegawai tidak selalu mempunyai akun login.
- business_date: tanggal aktivitas outlet menurut WIB, berbeda dengan timestamp pengajuan.
- Shift: identitas giliran yang dinormalisasi. Jadwal, jumlah shift dan perubahan shift perlu master sumber.
- Omzet outlet: nilai laporan outlet; received_amount: jumlah kanal pembayaran; ap_amount: nilai yang dilaporkan ke AP. Selisih bukan akun laba.
- Voucher: dokumen permintaan/tagihan yang melalui pemeriksaan dan persetujuan; bukan transaksi pembayaran bank.
- Referensi sumber: nomor lengkap dokumen/sistem asal, dibedakan dari nomor internal voucher.
- Version: nomor perubahan untuk concurrency; bukan versi dokumen resmi bertanda tangan.
- Periode: interval akuntansi dengan status; bukan otomatis bulan kalender di semua proses.
- Akun/COA, kategori, rekening kas/bank: tiga konsep berbeda; mapping laporan perlu diputuskan.
- Outstanding: hutang/piutang tersisa dari sumber dan alokasi pembayaran, bukan nominal kontrak mentah.
- Kontrak Project: identitas/nilai/status proyek; milestone: tahap; RAB: item estimasi; realisasi: biaya aktual dari sumber yang disepakati.
- Persediaan: kuantitas dan nilai menurut lokasi/satuan; stok minimum adalah aturan produk/lokasi, bukan rumus universal.

## Entitas dan aturan penting

acc_omzet_records: ID UUID, domain ACC, outlet snapshot, tanggal/shift, enam nominal pembayaran/omzet, AP, referensi, status, aktor/timestamp, version. Unik outlet/tanggal/shift. acc_omzet_unlock_requests: alasan, keputusan, expiry/use. acc_omzet_events: riwayat tindakan dan metadata.

acc_vouchers: ID UUID, voucher_no unik, type BILLING/PURCHASING, outlet snapshot, tanggal/jatuh tempo, penerima, source_reference, source_key unik, amount, rincian, status, aktor/timestamp/version. acc_voucher_events: snapshot setiap perubahan. created_by/outlet_id pada domain baru disimpan sebagai identifier tanpa FK lintas modul; resolusi/validasi melalui service organisasi dan identitas server.

projects dan tabel anak menggunakan ID integer/bigint pada skema lama; jangan mensyaratkan semua ID API berupa UUID. project_milestones mempunyai bobot/status/payment_status boolean; project_rabs dan project_documents mengikuti metadata lampiran. cel_inventories hanya menyimpan item_code, nama, stock dan division_code, belum ledger persediaan.

## Desain target yang belum diterapkan

Entitas invoice/termin/pembayaran/alokasi, journal posting, stock movement, bonus formula, kontrak/pas/surat perlu desain terpisah. Gunakan identifier sumber dan snapshot historis; pisahkan mutable master dari bukti final. Jangan menambah FK lintas modul hanya untuk memudahkan query yang melanggar batas domain.

## Konvensi data

Rupiah untuk domain baru memakai decimal(16,2); API membawa decimal string. Kuantitas/harga/satuan selain rupiah perlu presisi sendiri. Timestamp menyimpan waktu absolut dan ditampilkan sesuai WIB; tanggal bisnis tetap date. Field optional dibedakan null/kosong/0. UAT memakai data anonim, ditandai terpisah dari master perusahaan.

## Tata kelola master

Kode master stabil; perubahan nama tidak merusak histori snapshot. Nonaktif mencegah pemakaian baru tanpa menghilangkan histori. Sebelum impor master tetapkan pemilik, kode unik, alias, validasi dan strategi duplicate. Retensi, anonimisasi dan pemulihan mengikuti [operasional](16_OPERASIONAL_DATABASE_DAN_RILIS.md).

## Pembaruan sesi — 6 Oktober 2026

34 migrasi/54 tabel; users.session_version unsigned integer default 0 adalah versi pembatalan seluruh sesi. Disimpan server dan tersembunyi dari serialization User; bukan field yang diisi pengguna. Migrasi tidak menghapus atau mengganti akun/password. Lampiran schema diperbarui dari PostgreSQL.

## Pembaruan teknis 6 Oktober 2026

Kontrak dan kontrol terbaru: [lampiran voucher](36_LAMPIRAN_VOUCHER_ACCOUNTING.md), [omzet tahunan](37_TRACKING_OMZET_TAHUNAN.md), [UI Project](38_UI_PROJECT_DAN_BATAS_AKSI.md), [Cellular manual](39_CELLULAR_MANUAL_DAN_STOK_JUMLAH.md). Snapshot lampiran aktual telah diperbarui: 59 tabel, 36 migrasi, 103 route API dan capability terkini. Hasil/pending pada [dokumen 40](40_HASIL_IMPLEMENTASI_DAN_PEKERJAAN_TERBUKA.md). UAT pengguna tidak diganti dengan hasil tes fixture.

## Rekap HR manual — 6 Oktober 2026

ACC-A01/ACC-A02 kini memiliki master pegawai minimal, rekap manual dan histori koreksi/void. Hak view:acc_hr terpisah dari view:acc_detail, terbatas Manager/Admin/Staff Accounting ACC; Admin menulis rekap, Manager/Admin mengelola master. Tidak menghitung hak cuti/gaji/bonus atau menganggap referensi persetujuan sebagai approval ERP. AC, sumber, batas, API dan bukti pada [dokumen 41](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Snapshot metadata/policy telah diperbarui.

## ACC-A10 manual — 6 Oktober 2026

Setoran dan penerimaan aktual terpisah; tiga tabel acc_deposits/acc_deposit_receipts/acc_deposit_events. Referensi bukti eksternal, nilai integer sen, alokasi sumber validated, version/history/audit. Tahap manual selesai teknis; unggahan, settlement/jurnal dan UAT terbuka. [Acuan dan bukti](42_REKAP_SETORAN_MANUAL.md). Peran: keempat peran.
