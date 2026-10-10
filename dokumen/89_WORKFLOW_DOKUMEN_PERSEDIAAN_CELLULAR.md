# Workflow Dokumen Persediaan Cellular

Tanggal implementasi: 10 Oktober 2026. Ruang lingkup: Divisi Cellular, terutama Admin Gudang dan Manager. Divisi Project tidak diubah.

## Masalah yang diselesaikan

Mutasi stok sebelumnya dapat diposting langsung oleh Admin Gudang. Pola tersebut cukup untuk pencatatan dasar, tetapi belum memberi pemisahan tugas, antrean pemeriksaan, dokumen multi-produk, atau bukti keputusan Manager. Implementasi baru menutup endpoint mutasi langsung dan menjadikan dokumen persediaan sebagai satu-satunya jalur operasional untuk penerimaan, pengeluaran, transfer antar-outlet, dan stock opname.

## Alur kerja dan kewenangan

1. Admin Gudang membuat draf berisi jenis dokumen, tanggal bisnis, outlet, referensi bukti, catatan, dan satu atau beberapa produk.
2. Admin Gudang dapat mengubah dokumen berstatus `draft` atau `correction`, lalu mengajukannya menjadi `submitted`.
3. Manager yang berbeda memilih `approved` atau `correction`. Catatan koreksi minimal sepuluh karakter dan kembali ke meja Admin Gudang.
4. Sistem memposting saldo dan ledger mutasi dalam satu transaksi database hanya setelah persetujuan. Penerimaan menambah stok, pengeluaran mengurangi stok, transfer membuat sisi keluar dan masuk, sedangkan stock opname memposting selisih hasil hitung terhadap saldo terkunci.
5. Versi dokumen mencegah keputusan berdasarkan data lama. Saldo negatif, produk ganda, outlet lintas scope, outlet transfer yang sama, tanggal masa depan, approval oleh pembuat, dan posting ulang ditolak.

Capability `write:cellular_stock` dimiliki Admin Gudang untuk membuat, mengubah, dan mengajukan dokumen. Capability `approve:cellular_stock` dimiliki Manager untuk koreksi dan persetujuan. Role Cellular lain hanya membaca register dan posisi stok sesuai akses divisinya. Endpoint lama `POST /cellular/stock` ditutup agar workflow tidak dapat dilewati.

## Pengalaman pengguna

Halaman `/cellular/persediaan` mengikuti kerangka visual Divisi Project: header divisi, hierarchy judul, KPI, panel proses, filter, register, detail, form dalam dialog, status yang jelas, empty/loading/error state, tema terang/gelap, dan tabel responsif. Isinya tetap khusus pekerjaan Cellular.

Admin Gudang melihat tombol **Buat dokumen**, draf, koreksi, dan tindakan kirim. Manager melihat KPI antrean, tombol **Setujui** dan **Koreksi**, tanpa form pembuat. Detail dokumen menampilkan nomor dokumen, rute, referensi, catatan, rincian barang, pembuat, pemeriksa, serta tombol cetak berita acara. Posisi stok memperlihatkan saldo dan kondisi kritis per outlet.

## Data dan keamanan

Migration additive membuat `cel_inventory_documents` dan `cel_inventory_document_lines`, lalu menghubungkan setiap ledger ke dokumen dan baris sumber. Posting memakai row lock pada saldo, transaksi database, nomor dokumen sistem, audit wajib, serta source key SHA-256 sepanjang 64 karakter. Tidak ada data seed atau transaksi bisnis yang ditanam saat migration.

Backup terenkripsi sebelum migration: `C:/ERP/backups/dashboard-divisi/2026-10-10T13-18-40-057Z-beb00b2f.erpbackup`, SHA-256 `8e9d98447269546d09e7dcd9fb5f23d4cc78d2d1de4bf8fd0bc5ebf60134b7fc`, 81 tabel dan delapan berkas; kunci tidak disertakan. Migration resmi berhasil pada `dashboard_divisi_mvp`; verifikasi 44 pemeriksaan schema/role lulus dan tidak menulis baris uji.

## Verifikasi

- Backend: 8 test, 115 assertion lulus untuk workflow, role, scope, koreksi, versi, rollback stok negatif, stock opname, idempotensi posting, dan penutupan endpoint lama.
- Frontend: 2 test role lulus untuk pemisahan pengalaman Admin Gudang dan Manager.
- TypeScript lulus; lint file Cellular yang berubah lulus; Pint lulus.
- Lint global masih memiliki temuan lama di berkas Divisi Project yang tidak menjadi scope dan tidak diubah dalam pekerjaan ini.

Penilaian Admin Gudang Cellular naik dari 78 menjadi **91/100**. Nilai belum 100 karena unggahan lampiran fisik, kebijakan minimum stok per SKU/outlet, dan UAT pengguna bisnis masih perlu ditetapkan atau dijalankan.
