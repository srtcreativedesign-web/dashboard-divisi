# Voucher pengeluaran Admin — spesifikasi implementasi

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

Acuan: contoh voucher Reflexy yang dikirim pengguna. Contoh dipakai sebagai struktur dokumen, bukan data operasional dan bukan izin menambah divisi di luar MVP.

## Keputusan produk

Dokumen baru adalah Voucher Pengajuan Pengeluaran: identitas perusahaan/outlet, nomor sistem, penerima, tanggal/jatuh tempo, prioritas, rencana metode pembayaran, referensi invoice/faktur/periode/surat jalan, uraian/nominal/terbilang dan jejak pemeriksaan. Dokumen ini bukan berita acara serah terima atau bukti dana telah dibayar. Berita acara membutuhkan peristiwa dan pihak penerima yang belum ditentukan.

Admin ACC tetap menjadi penulis untuk sumber outlet aktif lintas MVP. Alur existing dipertahankan: draf → pengajuan → Staff Accounting memeriksa → Manager menyetujui/koreksi. Tidak menyamakan DM/Direktur Keuangan pada gambar dengan role baru atau tanda tangan hukum.

Tambahkan jenis OPERATIONAL untuk kebutuhan operasional seperti contoh, selain BILLING/PURCHASING. Nominal tetap satu jumlah desimal sesuai kontrak existing; uraian menjelaskan kebutuhan. Prioritas URGENT/NORMAL/SCHEDULED terpisah dari workflow dan pembayaran. CASH/BANK/UNDECIDED merupakan rencana pembayaran. Bank wajib lengkap ketika BANK dipilih.

## Keamanan dan kompatibilitas

Kolom tambahan nullable/default agar voucher lama tetap terbaca. Nomor sistem, pembuat/status/pemeriksa tetap dikendalikan server; versi dan pemisahan aktor tetap berlaku. Rekening disimpan encrypted, tidak muncul penuh pada list atau snapshot riwayat. Detail rekening lengkap hanya pembuat Admin dan pelaksana Finance yang sudah berwenang; pembaca lain memperoleh mask. Tidak menambah capability, tidak menanam isi gambar/nama/rekening nyata.

UI Admin memakai form berkelompok, ringkasan dan pratinjau dokumen dalam tema aktif, serta PDF dari data voucher yang berhasil disimpan. Draf/koreksi diberi status jelas; PDF bukan bukti pembayaran atau tanda tangan elektronik. Nominal/terbilang menggunakan string/integer sen, tanpa float untuk perhitungan teks.

## TODO dan verifikasi

- [x] Migrasi additive, validasi, encrypted rekening/proyeksi dan kompatibilitas existing.
- [x] Form pengeluaran baru, pratinjau dan unduh PDF dengan status/riwayat.
- [x] Tes backend alur/peran/validasi dan front-end data/dokumen/desimal.
- [x] Backup sebelum migrasi native; apply hanya database MVP, tanpa seed.
- [x] Inspeksi UI, dokumentasi hasil, commit dan push REQ tanpa PR.

PNL, pembayaran nyata, stok dan jurnal otomatis tetap mengikuti kontrak proses terpisah.
## Hasil implementasi — 7 Oktober 2026

Form dua kolom pada desktop dan satu kolom pada layar kecil, dengan bagian identitas, rencana pembayaran dan referensi. Nama menu menjadi Voucher Pengeluaran. Jenis pengeluaran operasional ditambahkan. Detail menyajikan pratinjau dan unduh PDF dua halaman atau lebih sesuai panjang isi, dari data tersimpan. Nomor/versi/status, nominal/terbilang dan riwayat dicantumkan; tidak ada tanda tangan buatan. Tema terang/gelap diperiksa sebagai Admin ACC melalui skill computer-use. Screenshot: C:/ERP/voucher-admin-light-20261007.png dan C:/ERP/voucher-admin-dark-20261007.png. Akun tidak diubah dan tema gelap awal dipulihkan; transaksi tidak disimpan dalam inspeksi browser.

Migrasi additive diterapkan pada dashboard_divisi_mvp setelah backup terenkripsi 2026-10-07T04-39-04-430Z-bf20a1d9.erpbackup di C:/ERP/backups/dashboard-divisi. Database lain tidak diubah. Verifikasi 38 pemeriksaan hak akses/schema lulus, tanpa baris uji native.

Verifikasi: 270 tes backend/2241 assertions lulus; setelah penambahan aturan string rekening, 2 tes dokumen/22 assertions lulus kembali. Tes frontend mencakup form, kompatibilitas voucher lama, terbilang presisi dan pembuatan PDF nyata dengan rekening tersamarkan. Seluruh 149 tes frontend lulus. Typecheck/build dan lint seluruh file frontend yang diubah lulus. Lint global 105 error dari integrasi development belum ditutup. Tidak menjalankan ulang gate produksi atau menyatakan UAT bisnis selesai.

Cara mencoba: masuk sebagai Admin ACC → Accounting → Voucher Pengeluaran → Buat voucher → isi outlet aktif dan rincian → Simpan draf → lihat pratinjau/unduh PDF → Ajukan pemeriksaan. Accounting dan Manager memeriksa dengan akun berbeda. Hanya pembuat yang bisa mengubah draf/koreksi; approved terkunci. File invoice/bukti tetap melalui alur lampiran dengan scanner existing.

Batas: nama perusahaan opsional demi kompatibilitas, perlu diisi Admin agar dokumen lengkap. Satu nominal pengajuan, belum tabel multi-barang. Akses menulis masih Admin ACC pusat lintas outlet MVP; belum membuka izin Admin Project/Cellular atau menambahkan Reflexy. Pembayaran nyata, BAST, tanda tangan elektronik, lima jenjang seperti gambar dan posting jurnal otomatis membutuhkan kontrak proses tersendiri. Referensi gambar tidak disalin sebagai transaksi.
