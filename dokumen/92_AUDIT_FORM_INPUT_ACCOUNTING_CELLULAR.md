# Audit Form Input Accounting dan Cellular

Tanggal audit: 11 Oktober 2026
Ruang lingkup: seluruh form aktif pada Divisi Accounting dan Cellular. Divisi Project hanya menjadi acuan kerangka visual dan tidak diubah.

## Standar penilaian

Setiap form dinilai dari enam unsur: orientasi tugas (25), pengelompokan dan hierarki (20), pencegahan kesalahan (20), kesesuaian role dan workflow (15), aksesibilitas serta responsif (10), dan jejak audit (10). Nilai 90 berarti form sudah layak menjadi standar operasional ERP; nilai di bawah 80 masuk antrean perbaikan.

Standar form yang dipakai mulai tahap ini:

- input dibuka dari konteks register atau detail, bukan ditumpuk permanen di atas tabel;
- judul menjelaskan dokumen dan dampak tindakan;
- kolom dikelompokkan menurut urutan kerja pengguna;
- ringkasan nilai, stok, periode, atau dampak tersedia sebelum posting;
- kesalahan ditampilkan dekat tindakan dan isian tetap tersimpan saat API gagal;
- tombol hanya muncul sesuai capability role;
- tindakan berisiko memakai dialog tersendiri, alasan wajib, dan bahasa dampak yang jelas;
- status, PIC, waktu, referensi sumber, dan riwayat pemeriksaan dapat ditelusuri.

## Hasil audit Cellular

| Area form | Nilai saat audit | Keputusan |
|---|---:|---|
| Closing harian H+1 | 93 | Pertahankan; sudah memiliki konteks periode, SLA, role, timeline, dan koreksi. |
| Dokumen persediaan | 91 | Pertahankan; tambah unggahan bukti fisik pada tahap lanjutan. |
| Mutasi stok manual | 84 | Rapikan istilah sumber dan pratinjau saldo setelah mutasi. |
| Penjualan dan pembatalan | 61 | Prioritas P0; ubah menjadi register, form bertahap, ringkasan stok/nilai, detail audit, dan dialog pembatalan. |
| Produk dan paket | 66 | Prioritas P1; pindahkan tambah produk ke dialog, tambahkan detail, status aktif, dan validasi duplikasi. |
| Tagihan dan settlement | 82 | Prioritas P1; perjelas sumber closing, sisa rekonsiliasi, dan hasil posting. |
| Kontrol shift | 78 | Prioritas P1; kelompokkan checklist, masalah, tenggat, dan eskalasi. |
| Staging impor spreadsheet | 74 | Prioritas P1; tampilkan pemetaan kolom, validasi per baris, dan ringkasan sebelum commit. |

## Hasil audit Accounting

| Area form | Nilai saat audit | Keputusan |
|---|---:|---|
| Voucher pengeluaran | 88 | Poles ringkasan nilai, lampiran, dan jejak maker-checker. |
| Realisasi pembayaran voucher | 84 | Perjelas saldo, tujuan pembayaran, bukti, dan pemisahan tugas Finance. |
| Dokumen persediaan | 82 | Selaraskan struktur dengan dokumen persediaan Cellular. |
| Omzet H+1 | 79 | Prioritas P1; pecah konteks shift, kanal pembayaran, selisih, dan pengajuan. |
| Rekap setoran | 92 | Selesai; register, form bertahap, batas alokasi kanal, bukti, penerimaan Finance, sisa rekonsiliasi, status, dan audit trail sudah tersedia. |
| Cuti dan absensi | 65 | Prioritas P0; pisahkan jenis dokumen, pegawai/periode, perhitungan, dan approval. |
| Master data | 70 | Prioritas P1; gunakan register-detail-form dan proteksi perubahan data referensi. |
| Preview laporan Cellular | 74 | Prioritas P1; ubah dari pratinjau teknis menjadi pekerjaan rekonsiliasi yang dapat ditindaklanjuti. |

## Urutan implementasi

1. Penjualan dan pembatalan Cellular sebagai pola form transaksi baru.
2. Cuti dan absensi Accounting agar pekerjaan Admin mempunyai dokumen dan approval yang jelas.
3. Produk dan paket Cellular.
4. Kontrol shift, settlement, omzet H+1, master data, dan staging impor.
5. Penyempurnaan voucher serta dokumen persediaan yang sudah mendekati standar.

## Batas kebijakan

Form PNL, bonus, dan CMO belum boleh mengunci rumus atau alur final karena kebijakan pengakuan pendapatan, metode HPP, rumus bonus, dan definisi CMO belum ditetapkan perusahaan. Sistem dapat menyiapkan sumber data dan placeholder terkontrol, tetapi tidak boleh menghasilkan angka keputusan seolah sudah resmi.
