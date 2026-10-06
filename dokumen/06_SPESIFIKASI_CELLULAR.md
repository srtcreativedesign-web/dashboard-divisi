# Spesifikasi kebutuhan Divisi Cellular

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Fakta yang tersedia

Cellular berada dalam MVP dan mempunyai delapan role. Kode aktif menampilkan daftar outlet CELL melalui API. Tabel cel_inventories sudah ada, tetapi keberadaan tabel belum berarti penerimaan/penjualan/stock opname tersedia. Pada jawaban 6 Oktober 2026 pengguna menjelaskan kartu perdana berbagai provider/kuota/harga dan aksesori HP, stok jumlah serta laporan manual; implementasi awal mengacu dokumen 39.

## CEL-01 — Direktori outlet (baseline)

Data: ID, kode, nama, divisi, status aktif. AC: hanya outlet Cellular yang sesuai scope tampil; loading/error/empty jelas. Accounting pusat dapat menggunakan metadata outlet melalui service organisasi. Alias CELLULAR ditangani sebagai CELL untuk sesi lama.

## Discovery yang harus diselesaikan

- Produk dikonfirmasi: kartu perdana berbagai provider dan aksesori HP; katalog SKU/varian ada pada dokumen 39.
- Sumber saat ini manual; pencatatan manual di ERP diterapkan. Ritme shift dan integrasi sumber lain belum ditentukan.
- Lokasi: outlet/gudang pusat/transit; siapa penanggung jawab stok.
- Stok dikonfirmasi kuantitas, tanpa serial/IMEI. Mutasi jumlah dan penjualan manual diterapkan; retur parsial, transfer dan opname masih perlu definisi.
- Penjualan: diskon, retur, komisi, pajak, settlement QRIS/EDC dan transaksi gagal.
- Pembelian: reorder point, persetujuan, pemasok, penerimaan sebagian dan tagihan.

## Fitur kandidat, seluruhnya USULAN

CEL-02 katalog produk/satuan; CEL-03 penjualan/shift; CEL-04 penerimaan dan pergerakan stok; CEL-05 transfer/retur/opname; CEL-06 permintaan pembelian saat stok menipis; CEL-07 setoran/rekonsiliasi settlement; CEL-08 laporan margin dan stok. Tidak menetapkan tanggal rilis atau formula sebelum discovery.

## Rancangan tanggung jawab kandidat

Admin input administratif; Admin Gudang mencatat pergerakan/opname; Leader/SPV melakukan pemeriksaan lapangan; Head Operasional memantau operasional; Manager menyetujui pengecualian; Staff Accounting/Finance merekonsiliasi data sesuai kewenangan. Ini hipotesis untuk dibahas, bukan grant dalam aplikasi.

## Kriteria penerimaan lintas modul

Transaksi Cellular yang menjadi sumber Accounting memiliki ID stabil, outlet/shift/tanggal, total, versi dan bukti. Posting hanya satu kali; retur/koreksi tidak menghapus sumber awal. Persediaan tidak berubah karena voucher disetujui sebelum penerimaan barang dicatat. Kriteria CEL-02 sampai CEL-08 baru berlaku bila fitur dipilih untuk rilis.

## Bukti yang perlu dikumpulkan

Contoh anonim laporan satu shift, stok/opname, pembelian/penerimaan, retur, setoran dan struktur barang. Minimalkan data pribadi; jangan menyalin kredensial POS atau data pelanggan nyata ke dokumentasi ini.
