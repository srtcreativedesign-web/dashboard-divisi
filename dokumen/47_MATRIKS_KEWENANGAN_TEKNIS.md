# Matriks kewenangan teknis dan pencegahan perbedaan policy

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Acuan: dokumen 31, 35, 38, 39, 41, 42 serta ENT-02 pada dokumen 46. Scope ditulis sebelum implementasi.

## Tujuan

Matriks capability frontend dan backend saat ini sama, tetapi dipelihara secara terpisah. Tahap ENT-02a menghilangkan duplikasi manual dan menyediakan pemeriksaan yang gagal jika matriks frontend tertinggal dari backend. Tidak menambahkan hak bisnis, delegasi, atau akses field sensitif.

PolicyService backend tetap otoritatif. Matriks generated di frontend hanya membantu menu/route/tombol; API tetap memeriksa capability, scope, status, versi dan kepemilikan. Kehadiran capability tidak berarti fitur bisnis terkait sudah tersedia: misalnya capability PNL/bonus/kontrak tidak menutup pekerjaan terbuka pada TODO 21.

## Akses yang diterapkan saat ini

- Accounting pusat: Manager, Admin, Staff Accounting dan Staff Finance mendapat rincian keuangan; Head Operasional, SPV, Leader dan Admin Gudang mendapat ringkasan. Data HR dibatasi tersendiri; Finance tidak mendapat akses HR.
- Admin ACC membuat omzet/voucher/setoran; Accounting memeriksa omzet/voucher dan membaca setoran; Manager memutuskan sesuai workflow; Finance mencatat penerimaan setoran. Status, aktor, versi dan aturan transaksi tetap diperiksa oleh service backend.
- Project: Manager/Admin mengelola, enam role lain membaca. Kontak/rekening vendor mengikuti pembatasan field yang sudah ada. Penandaan pembayaran tetap administratif, bukan ledger penerimaan Finance.
- Cellular: Manager/Admin mengelola katalog; Manager/Admin Gudang mencatat stok; Admin mencatat penjualan; Manager membatalkan penjualan. Rincian penjualan dibaca Manager/Admin/Accounting/Finance pada CELL. Head Operasional/SPV/Leader/Admin Gudang tidak mendapat capability rincian penjualan.
- BOD memiliki daftar capability baca yang terbatas dan scope lintas divisi jika identitas divisinya null; tidak memperoleh hak mutasi. Tidak semua rincian otomatis tersedia bagi BOD.
- Kompatibilitas CELLULAR → CELL dan Finance FIN → ACC dipertahankan. Role/domain tidak dikenal ditolak; nama role yang menyerupai properti bawaan JavaScript juga harus ditolak tanpa exception.

## Implementasi

Ekspor konstanta PolicyService tanpa bootstrap Laravel, koneksi database atau kredensial. Generator memvalidasi tiga domain, delapan role per domain, capability berbentuk string dan BOD hanya view, lalu menulis JSON deterministik. Frontend mengimpor JSON tersebut. Command check membandingkan hasil ekspor backend dengan berkas generated dan menghasilkan exit nonzero ketika berbeda.

Command sinkronisasi masuk gate lokal dan CI. Tes mencakup ketidaksinkronan, kontrak salah dan akses tidak dikenal; tes backend/UI lama menjaga perilaku yang sudah tersedia.

Cara memperbarui policy: ubah konstanta pada PolicyService, jalankan npm run policy:sync, tinjau diff JSON generated, lalu jalankan npm run policy:check dan tes akses. Jangan mengedit capabilities.generated.json manual. Tidak ada env/database yang dibaca oleh ekspor policy.

Frontend mengikuti normalisasi role uppercase backend. Pemeriksaan Object.hasOwn mencegah pencarian role/domain melalui properti bawaan JavaScript; identitas tidak dikenal mengembalikan false. Scope BOD lintas divisi memerlukan divisi null, mengikuti backend, bukan string kosong. Tidak ada perluasan hak API.

## Verifikasi

Gate lokal selesai dengan exit 0: 258 backend (2036 assertions), 111 web (29 file), dua contracts, tiga guard policy, empat orkestrasi gate, empat guard database serta tiga scanner lulus. Sinkronisasi backend/frontend, lint/typecheck/build/Pint lulus; exporter PHP juga diformat dan diperiksa scoped. Bukti: artifacts/release/latest.json mencatat commit awal 4894728 dan workingTreeDirty=true; bukan bukti CI commit akhir. Build masih memiliki warning chunk Cashflow/anotasi Zod yang sudah diketahui. Database native tidak diubah atau diisi transaksi. ENT-02a selesai teknis; matriks bisnis final belum selesai. Blocker billing CI remote tercatat pada ENT-01b.

## Masih terbuka pada ENT-02

Pemilik proses perlu menetapkan matriks final field/tindakan, akses ekspor, delegasi/PIC dan masa berlaku. Tidak memberikan hak lintas divisi kepada akun Accounting PROJECT/CELL hanya berdasarkan nama role. Accounting pusat tetap ACC. UAT seluruh aktor serta penerimaan bisnis tidak ditutup oleh ekspor matriks teknis.
