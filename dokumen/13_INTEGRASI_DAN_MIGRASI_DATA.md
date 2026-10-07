# Integrasi, impor, dan migrasi data

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Fullstack Programmer + Senior Product Manager
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Sumber yang disebut dan statusnya

Outlet/shift: sumber laporan omzet perlu format anonim. Angkasa Pura: tagihan dan nilai laporan, saluran/otorisasi belum ditentukan. Ecsys: laporan disebut pengguna, format/API belum diberikan. Sobat: client legacy ada di repo; penggunaan sebagai sumber absensi/pegawai belum disepakati. POS/bank/HR lain belum dipilih. Jangan menganggap credential atau kontrak API telah tersedia.

## Kontrak setiap integrasi

Wajib menetapkan pemilik, arah data, transport, jadwal, identifier unik, timezone/tanggal bisnis, kolom/tipe, referensi tenant, status final, retry/rate limit, autentikasi, error dan rekonsiliasi. Simpan contoh anonim dan versi mapping; rahasia disimpan di konfigurasi aman, bukan dokumen ini.

## Jalur impor yang diusulkan

Upload/download sumber → verifikasi jenis/ukuran → staging → validasi header/row → mapping master/alias → pratinjau hasil/error → pengguna mengonfirmasi batch valid → import transaction/idempotency → rekonsiliasi count/total → audit. Partial import versus all-or-nothing harus dipilih, tidak berganti diam-diam. Baris gagal harus dapat dikoreksi tanpa menggandakan baris berhasil.

## Idempotency dan koreksi

Gunakan identifier sumber + versi/periode + domain. Ulang batch yang sama tidak memposting dua kali. Koreksi sumber menghasilkan versi/reversal yang dapat ditelusuri. Total sumber, row count, nilai valid/ditolak dan alasan selisih dicatat. Jangan menyamakan nilai laporan AP dengan pendapatan perusahaan tanpa kebijakan pengakuan.

## Database lama

Database lama belum diinventarisasi; tidak dihapus atau dijadikan acuan kebutuhan. Bila migrasi diperlukan: inventaris owner/schema/data → backup terverifikasi → mapping → dry run di database terpisah → cek identifier/count/total/histori → UAT → keputusan cutover → rollback plan. Tidak menggunakan migrate:fresh pada data kerja.

## File Project historis

Daftar metadata/pemilik/proyek/disk/path → verifikasi file → salin ke storage privat → checksum → uji unduh berotorisasi → update referensi transactional atau mekanisme aman → tutup akses public setelah recovery disepakati. Penghapusan sumber bukan langkah otomatis dokumen ini.

## Batas baseline

Omzet manual dan voucher belum memposting otomatis ke jurnal/stok/pembayaran. Integrasi lintas modul dipilih setelah mapping dan proses bisnis disepakati. Pengiriman pajak/surat/kontrak/pas ke pihak luar memerlukan otorisasi manusia dan kontrak proses, bukan otomatis akibat tombol internal.
