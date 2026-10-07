# Aturan bisnis, perhitungan, dan sumber laporan

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Senior Fullstack Programmer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Status aturan

RB-01 batas H+1 akhir 23.59 WIB adalah kebutuhan dikonfirmasi. RB-02 sampai RB-09 berikut merekam keputusan implementasi sekarang untuk review; RB-10 sampai RB-15 adalah rancangan yang perlu persetujuan.

- RB-02: jendela pengajuan normal mulai 00.00 H+1 sampai akhir H+1 WIB. Tanggal bisnis tidak bergantung timezone komputer.
- RB-03: izin terlambat Manager berlaku 24 jam, sekali pengajuan, mengikat outlet/tanggal/shift. Perubahan identitas rekap mencabut izin.
- RB-04: satu rekap per outlet/tanggal/shift yang dinormalisasi uppercase. Rekap tervalidasi terkunci.
- RB-05: total pembayaran omzet = tunai + QRIS + EDC + transfer + lainnya. Selisih pembayaran = omzet outlet - total pembayaran. Selisih AP = omzet outlet - omzet laporan AP. Selisih dapat positif/negatif.
- RB-06: selisih pembayaran/AP tidak nol memerlukan catatan dan persetujuan Manager; AP wajib diisi ketika requires_ap aktif. Pengakuan selisih sebagai laba belum disetujui.
- RB-07: nominal omzet nonnegatif; voucher positif; maksimal 12 digit utuh/dua desimal. Pengolahan rupiah tidak menggunakan floating-point untuk posting. Rounding sebelum posting harus eksplisit.
- RB-08: voucher memiliki source_key unik berdasarkan jenis/outlet/penerima/referensi dengan normalisasi kapital/spasi. Nomor voucher server berupa VCH-UUID.
- RB-09: pembuat/pemeriksa/penyetuju voucher berbeda; versi lama ditolak; approved bukan paid dan tidak mengubah stok/jurnal.
- RB-10: PNL, laba, penghasilan, pendapatan dan setoran mempunyai definisi berbeda. Pilih basis pengakuan dan COA sebelum formula laporan final.
- RB-11: rasio/komparasi hanya diperhitungkan jika denominator, cakupan tenant dan kelengkapan periode diketahui; data hilang tidak otomatis nol.
- RB-12: bonus membutuhkan formula berversi, eligibility, target, absensi dan persetujuan. Belum ada formula yang disepakati.
- RB-13: HPP/persediaan memerlukan metode penilaian dan satuan yang disepakati. Voucher pembelian bukan bukti barang diterima.
- RB-14: pelaporan yang pengguna sebut PB1 10% diperlakukan sebagai kebutuhan laporan yang harus diverifikasi per objek/wilayah/periode. Tarif dan basis tidak boleh hardcoded universal.
- RB-15: pembukaan periode, koreksi jurnal, perubahan rekening, penggantian pejabat dan pembatalan pembayaran harus memiliki kewenangan, alasan dan histori.

## Sumber laporan

Omzet bulanan/tahunan: sumber rekap tervalidasi. Selisih AP: rekap dengan kedua nominal dan alasan; belum jurnal laba. Cashflow: transaksi kas/rekening yang diklasifikasikan dengan metode yang disepakati. PNL: jurnal/periode/COA dan penyesuaian yang telah diperiksa. Outstanding: nilai sumber dikurangi pembayaran/alokasi tervalidasi, dengan aging menurut jatuh tempo yang disepakati. Project: kontrak/RAB/milestone/termin aktual; toggle pembayaran bukan ledger. Cellular: outlet nyata saat ini, penjualan/stok menunggu sumber.

## Laporan minimum yang harus didefinisikan

Untuk setiap laporan tetapkan ID, pemilik, tujuan, periode, tenant/divisi, kolom, grain/baris, status sumber, filter, rumus, rounding, hak akses, format ekspor dan contoh hasil anonim. Keputusan formula ditautkan ke sumber dan acceptance test, bukan hanya desain chart.

## Contoh perhitungan untuk pengujian, bukan data perusahaan

Omzet 1000.50; tunai 500.25; QRIS 500.25 menghasilkan selisih pembayaran 0.00. Bila AP 900.00, selisih AP 100.50 dan diperlukan review. Voucher 0 ditolak; 0.01 diterima; 1.001 ditolak. Rasio pencapaian tidak dihitung bila target 0/tidak tersedia. Label contoh harus tetap terlihat bila digunakan dalam pelatihan.
