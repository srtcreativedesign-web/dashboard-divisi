# Staging Import Laporan Cellular

Tanggal: 9 Oktober 2026  
Status: implementasi dan pengujian selesai

## Tujuan produk

Tahap ini mengubah laporan Excel Admin Cellular menjadi data antara yang dapat diperiksa sebelum masuk ke rekap omzet H+1. Staging mencegah file sumber langsung menulis transaksi operasional dan mempertahankan jejak asal setiap angka.

## Alur pengguna

1. Admin Accounting memilih outlet Cellular, periode, dan jenis laporan.
2. Server memindai file, membaca profil laporan, dan menyimpan hasil normalisasi ke staging.
3. Sistem menampilkan tanggal, nilai, formula atau nilai cache, sheet, sel, serta catatan validasi.
4. Admin memilih tepat satu batch **Harian & stok** dan satu batch **Omzet per shift** untuk outlet serta periode yang sama.
5. Admin mengakui warning yang sudah diperiksa.
6. Commit atomik membuat paket omzet H+1 berstatus draf. Jika satu tanggal gagal, seluruh commit dibatalkan.

## Pengendalian enterprise

- Akses upload tetap memakai kapabilitas `file.scan`; commit memakai `write:omzet`.
- Outlet harus berasal dari direktori resmi dan berada pada Divisi Cellular.
- Hash SHA-256 mencegah file yang sama distaging berulang untuk outlet, periode, dan profil yang sama.
- Batch yang sudah committed tidak dapat dipakai ulang; batch alternatif dengan profil sama ditandai superseded.
- Harian dan Shift wajib mempunyai cakupan tanggal yang sama.
- Bruto Harian, bruto Shift, jumlah Shift 1–3, dan Tunai+EDC+QRIS harus sama per tanggal.
- Rencana setoran dihitung sebagai Tunai dikurangi pengeluaran dan tidak boleh negatif.
- Duplikat paket omzet H+1 yang sudah ada ditolak.
- Semua perubahan status dicatat pada event staging append-only. Akun runtime tidak mempunyai hak UPDATE atau DELETE pada tabel event tersebut.
- Nama file ditampilkan untuk penelusuran; file biner sumber tidak disalin ke tabel transaksi.

## Struktur database

- `acc_cellular_import_batches`: identitas file, outlet, periode, profil, hash, status, ringkasan, dan actor.
- `acc_cellular_import_rows`: nilai normalisasi per tanggal beserta lineage sel, formula, referensi, dan isu.
- `acc_cellular_import_events`: audit perubahan status batch.

## Kewenangan

- **Admin**: upload, periksa, pilih batch, dan commit menjadi draf H+1.
- **Accounting**: melanjutkan pemeriksaan paket H+1 melalui workflow omzet yang sudah ada.
- **Manager**: menangani pengecualian dan keputusan selisih melalui workflow omzet.
- **Finance**: memakai data yang sudah divalidasi untuk tahap rekonsiliasi setoran berikutnya.
- **Admin Gudang**: memakai data tervalidasi sebagai sumber kontrol persediaan/HPP pada tahap berikutnya.

## Batas tahap

Commit pertama memakai pasangan laporan Harian dan Omzet per Shift karena keduanya sudah mempunyai pemetaan yang cukup untuk membentuk paket H+1. Profil Pendapatan/Pengeluaran, ECSYS, dan Update Cellular tetap dapat dipreview, tetapi belum menjadi sumber commit sampai aturan rekonsiliasi bisnisnya disepakati dan diuji.

## Verifikasi

- Pengujian backend: 7 pengujian, 47 assertion; mencakup staging, idempotensi, scope lintas divisi yang terbatas, validasi pasangan batch, sumber kosong, dan commit atomik.
- Regresi backend paket omzet H+1: 11 pengujian, 82 assertion.
- Pengujian frontend omzet dan staging: 11 pengujian lulus; mencakup upload multipart, pemilihan outlet, provenance, pencegahan penggantian diam-diam, reset konteks, dan error scanner dengan trace ID.
- TypeScript dan build produksi lulus.
- Migrasi PostgreSQL berhasil; verifikasi role database lulus 44 pemeriksaan tanpa menulis data uji.
