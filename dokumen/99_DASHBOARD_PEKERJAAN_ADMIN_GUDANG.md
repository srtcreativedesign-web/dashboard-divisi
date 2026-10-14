# Dashboard dan Pekerjaan Admin Gudang

Tanggal: 14 Oktober 2026
Branch: `REQ`

## Masalah yang diselesaikan

Dashboard Accounting sebelumnya sudah memuat antrean omzet dan voucher aktual untuk Admin, Accounting, Manager, dan Finance. Admin Gudang masih menerima judul generik dan tidak memiliki antrean pekerjaan sesuai tanggung jawab persediaannya.

## Keputusan produk dan UX

Dashboard Admin Gudang menggunakan kerangka visual yang sama dengan Divisi Project dan halaman Accounting lain, tetapi isinya khusus proses gudang:

- tugas milik Admin Gudang berupa draf dan dokumen yang dikembalikan untuk koreksi;
- dokumen `submitted` yang menunggu keputusan Manager;
- saldo barang yang sama dengan atau di bawah batas minimum;
- voucher pembelian approved pada periode yang belum memiliki dokumen penerimaan;
- lima tindakan prioritas dengan koreksi ditempatkan lebih dahulu;
- tautan langsung menuju Kendali Persediaan.

Angka kosong berarti tidak ada catatan pada sumber yang dihitung. Sistem tidak menyimpulkan seluruh outlet sudah lengkap dan tidak menampilkan nilai HPP karena metode penilaian persediaan belum ditetapkan.

## Implementasi dan keamanan

Endpoint `GET /api/v1/accounting/inventory/dashboard?month=YYYY-MM` menghasilkan read model agregat dari database. Endpoint memerlukan `view:inventory` dan scope divisi `ACC`. Admin Gudang hanya menerima daftar tindakan untuk dokumen yang dibuatnya sendiri dengan status `draft` atau `correction`; Manager menerima dokumen `submitted`. Role tanpa izin persediaan ditolak.

Read model tidak mengirim nilai voucher, rekening, path berkas, atau data keuangan lain. Mutasi, persetujuan, optimistic locking, dan audit tetap ditangani endpoint dokumen persediaan yang sudah ada.

## Batas

- Voucher tanpa penerimaan berarti belum ada dokumen penerimaan yang ditautkan; sistem belum menilai kelengkapan jumlah karena kuantitas pesanan belum dimodelkan.
- Stok minimum dihitung dari saldo lokasi yang sudah terbentuk. Barang yang belum pernah memiliki saldo tidak dinyatakan nol secara otomatis.
- Nilai persediaan, HPP, metode costing, dan PNL menunggu kebijakan perusahaan.
- Penerimaan pengguna pada tema terang/gelap dan perangkat mobile tetap bagian UAT.
