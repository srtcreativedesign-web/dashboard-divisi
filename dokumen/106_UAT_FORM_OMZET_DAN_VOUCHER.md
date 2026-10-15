# 106 — UAT Form Omzet H+1 dan Voucher

Tanggal validasi: 15 Oktober 2026  
Branch: `REQ`

## Tujuan

Memastikan dua dokumen sumber utama Accounting dapat dipahami dan dikerjakan Admin tanpa kehilangan konteks dokumen, sekaligus tetap aman untuk pemeriksaan Staff Accounting, keputusan Manager, dan realisasi Finance.

## Cakupan yang diperiksa

- Register dan form Rekap Omzet H+1.
- Register dan form Voucher Pengeluaran.
- Tata letak responsif pada desktop dan mobile 390×844.
- Urutan fokus awal dengan keyboard pada form Omzet.
- Nama aksesibel untuk tindakan membuka setiap dokumen.
- Keadaan gagal memuat register dan tindakan mencoba kembali.
- Regresi capability per role, versioning, pemeriksaan, persetujuan, lampiran, dan realisasi melalui pengujian otomatis Accounting.

## Hasil UAT browser

### Rekap Omzet H+1

- Form dibagi menjadi empat bagian kerja yang berurutan dan menampilkan lima pemeriksaan kesiapan sebelum penyimpanan.
- Footer tindakan tetap terlihat pada layar sempit tanpa menutupi isi utama.
- Urutan fokus awal bergerak dari tombol tutup ke pilihan outlet lalu tanggal; navigasi balik mengembalikan fokus ke outlet.
- Setiap tindakan register memiliki nama yang menyertakan referensi omzet, misalnya `Buka rekap OMZET-UAT-20261007-2026-10-07-PAGI`.
- Kegagalan permintaan register menampilkan pesan dan tombol `Coba Lagi`; pengujian membuktikan permintaan kedua memuat dokumen.

### Voucher Pengeluaran

- Form dikelompokkan menurut identitas dokumen, penerima, rincian pembayaran, dan bukti pendukung.
- Tata letak mobile 390×844 tetap terbaca dan tombol simpan berada pada footer tindakan yang konsisten.
- Setiap tindakan register memiliki nama yang menyertakan nomor voucher, misalnya `Buka voucher VCH-TEST`.
- Kegagalan permintaan register menampilkan pesan dan tombol `Coba Lagi`; pengujian membuktikan permintaan kedua memuat dokumen.

## Pemeriksaan keamanan dan integritas

- Aksi tetap dibatasi capability role yang telah diuji: Admin membuat dan melengkapi dokumen, Staff Accounting memeriksa, Manager memutuskan, dan Finance merealisasikan voucher.
- Perubahan tidak menambahkan data hardcode atau melewati API.
- Konflik versi voucher tetap ditolak dan ditampilkan kepada pengguna.
- Pengujian lampiran memakai versi dokumen aktif; keputusan dan realisasi tetap mengikuti state workflow.
- Tidak ada file Divisi Project yang diubah.

## Validasi teknis

- `npm run test --workspace @dashboard-divisi/web -- src/features/accounting`: **24 file, 118 tes lulus**.
- `npm run typecheck --workspace @dashboard-divisi/web`: lulus.
- ESLint terarah untuk halaman dan tes Omzet/Voucher: lulus tanpa temuan.
- `npm run build --workspace @dashboard-divisi/web`: berhasil.

Build masih melaporkan peringatan ukuran chunk dan komentar anotasi dari paket pihak ketiga. Peringatan tersebut tidak berasal dari perubahan Omzet/Voucher dan tidak menggagalkan build.

## Batas validasi

- UAT persetujuan bisnis bersama pengguna akhir tetap diperlukan sebelum nilai akhir 90/100 dapat dinyatakan.
- Unggah berkas dan pemindaian malware tidak diulang melalui browser pada sesi ini; jalur tersebut tetap tercakup oleh regresi Voucher.
- Audit keyboard/focus seluruh halaman Accounting dan Cellular masih menjadi pekerjaan Tahap 4.
