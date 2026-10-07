# Paket UAT omzet dan voucher

Tanggal: 6 Oktober 2026. Peran: Senior Product Designer, Senior Fullstack Programmer dan Senior Product Manager.

## Lingkup dan lingkungan

Paket ini menyiapkan penerimaan pengguna berdasarkan alur yang sudah tersedia. Tes otomatis berjalan pada SQLite in-memory dan storage fake, terpisah dari PostgreSQL operasional. Smoke 25 akun/125 GET pada server nyata memeriksa akses; tidak memasukkan transaksi contoh. Penerimaan pengguna belum dilakukan dan tidak diwakili oleh hasil tes teknis.

Gunakan akun Admin ACC, Staff Accounting ACC dan Manager ACC yang berbeda. Akun operasional lainnya untuk pengujian negatif. Kredensial tersedia di berkas UAT lokal yang diabaikan Git; jangan salin password ke catatan hasil. Halaman: `/accounting/omzet` dan `/accounting/vouchers`. Pastikan outlet uji dipilih, bukan outlet bisnis nyata.

## Skenario omzet

- O-01, normal H+1: Admin membuat rekap tanggal H dengan outlet_amount 1000.50, cash 500.25 dan QRIS 500.25, pembayaran lain 0. Simpan draf, ajukan pada H+1, lalu Staff Accounting validasi. Hasil: validated, selisih pembayaran 0.00, histori tiga langkah; perubahan setelah validasi ditolak.
- O-02, batas waktu WIB: sebelum H+1 pengajuan ditolak, H+1 pukul 23.59.59 diterima, H+2 pukul 00.00 ditolak. Tes otomatis memakai clock terkontrol; jangan mengubah jam Windows untuk menguji browser. Terlambat memerlukan permintaan izin dan keputusan Manager.
- O-03, izin terlambat: Admin meminta izin dengan alasan; Manager menyetujui; pengajuan menggunakan izin satu kali. Setelah koreksi, izin lama tidak dapat dipakai ulang; izin kedaluwarsa ditolak.
- O-04, selisih AP: requires_ap true memerlukan ap_amount dan alasan. Dengan AP 900.00, selisih 100.50 masuk pending_approval; belum dihitung sebagai validated sebelum Manager memutuskan. Ini pencatatan selisih, bukan formula keuntungan atau izin mengubah laporan eksternal.
- O-05, selisih pembayaran: cash 600.25 dengan QRIS 500.25 menghasilkan selisih -100.00; Staff Accounting meneruskan dengan alasan, Manager dapat meminta koreksi. Koreksi dan pengajuan ulang harus mempertahankan histori.
- O-06, input/error: sumber outlet/tanggal/shift duplikat, nominal negatif, tiga digit desimal dan versi lama ditolak; nilai sebelumnya tidak tertimpa. Akun Cellular/Project dan role yang tidak berwenang tidak dapat memalsukan actor/divisi atau melakukan review/approval.

Bukti otomatis: sembilan AccountingOmzetTest meliputi semua skenario tersebut. UI memiliki empat AccountingOmzetPage tests untuk alur peran. Waktu/bukti browser dan penerimaan pemilik proses tetap perlu dicatat saat UAT dilaksanakan.

## Skenario voucher

- V-01, tagihan normal: Admin membuat BILLING senilai 1234.56 dengan referensi anonim unik dan tanggal jatuh tempo valid. Admin ajukan, Staff Accounting periksa, Manager setujui. Hasil approved dan empat histori; ketiga actor berbeda. Persetujuan tidak otomatis membuat pembayaran/jurnal/outstanding.
- V-02, pembelian dan koreksi: gunakan PURCHASING, reviewer kembalikan dengan alasan, Admin perbaiki menjadi 2000.01, ajukan ulang. Manager menolak dengan alasan, kemudian ajukan kembali. Histori mempertahankan nilai sebelumnya dan keputusan lama dibersihkan pada pengajuan baru. Tidak otomatis menambah stok Cellular.
- V-03, kepemilikan/pemisahan tugas: hanya pembuat dapat mengubah/mengajukan. Perubahan role tidak memberi izin self-review atau self-approval. BOD hanya membaca, actor/divisi/status dari payload tidak dipercaya.
- V-04, versi dan urutan: approval sebelum review dan perubahan dengan versi lama ditolak; voucher approved tidak dapat diubah/dihapus atau diajukan lagi.
- V-05, validasi/duplikasi: nominal negatif/format salah, due_date sebelum voucher_date dan outlet nonaktif ditolak. Referensi sumber dinormalisasi dan duplikasi ditolak tanpa kehilangan data saat update.
- V-06, baca/filter: bulan/status/jenis/outlet menghasilkan daftar sesuai filter; role ringkasan tidak menerima rincian melalui API maupun menu.

Bukti otomatis: delapan AccountingVoucherTest dan lima AccountingVoucherPage tests; skenario penolakan rincian juga ada pada AccountingReadProjectionTest. Seluruh suite backend terbaru 226 tes / 1607 assertions dan web 77 tes lulus.

## Catatan hasil UAT pengguna

Untuk setiap skenario simpan ID skenario, tanggal/WIB, role/domain, ID objek anonim, expected, actual, status lulus/gagal, trace, bukti tanpa secret, dan tindak lanjut. Sampai pengguna benar-benar menjalankan dan menerima alur, statusnya “siap diuji pengguna”, bukan “UAT diterima”. Rumus PNL/bonus/CMO, pembayaran nyata dan integrasi AP/Ecsys tidak termasuk penerimaan paket ini.
