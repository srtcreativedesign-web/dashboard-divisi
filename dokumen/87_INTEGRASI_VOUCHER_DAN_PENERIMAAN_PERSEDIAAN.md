# Integrasi Voucher Pembelian dan Penerimaan Persediaan

Tanggal implementasi: 10 Oktober 2026  
Branch: `REQ`  
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Tujuan

Mengubah penerimaan barang dari catatan terpisah menjadi rantai dokumen yang dapat ditelusuri:

`voucher pembelian approved → penerimaan barang → persetujuan Manager → mutasi dan saldo persediaan`

Integrasi ini menyelesaikan jejak sumber dokumen. Nilai voucher belum dibukukan sebagai HPP karena metode penilaian persediaan dan kebijakan pengakuan HPP belum ditetapkan perusahaan.

## Aturan bisnis

- Hanya voucher Divisi Accounting bertipe `PURCHASING` dan berstatus `approved` yang dapat dipilih.
- Hubungan voucher hanya diperbolehkan pada dokumen `RECEIPT`.
- Penerimaan tanpa voucher tetap tersedia untuk transaksi non-pembelian yang sah.
- Satu voucher dapat memiliki beberapa penerimaan parsial.
- Hubungan voucher divalidasi kembali saat dokumen diajukan, disetujui, atau diminta koreksi.
- Saldo persediaan hanya berubah setelah dokumen disetujui oleh role dengan capability `approve:inventory`.
- Pembuat dokumen tidak dapat menyetujui dokumennya sendiri.

## Pengalaman pengguna

Pada form Penerimaan Barang, Admin Gudang dapat memilih voucher pembelian yang telah disetujui. Sistem menampilkan nomor voucher, pihak penerima/pemasok, outlet, dan jumlah penerimaan yang sudah tercatat. Referensi sumber otomatis diisi dari voucher bila kolom masih kosong.

Register persediaan dan Berita Acara menampilkan nomor serta pihak pada voucher. Nominal voucher ditampilkan sebagai konteks dokumen, bukan sebagai nilai HPP. Penjelasan di form menyatakan batas ini agar pengguna tidak menganggap sistem telah melakukan valuasi persediaan.

## Keamanan dan integritas

- Endpoint daftar voucher menggunakan capability baca persediaan dan scope Divisi Accounting.
- Respons untuk Admin Gudang dibatasi pada metadata voucher yang diperlukan; rekening bank, metode pembayaran, bukti transfer, dan data settlement tidak dikirim.
- Foreign key menggunakan `restrictOnDelete` agar dokumen sumber tidak dapat dihapus ketika sudah terhubung.
- Perubahan menyimpan `voucherId` pada audit trail.
- Validasi backend tetap menjadi sumber kebenaran; manipulasi pilihan di browser tidak dapat menghubungkan voucher draft, voucher non-pembelian, atau dokumen selain penerimaan.
- Optimistic versioning dan aturan maker-checker yang sudah ada tetap berlaku.

## Perubahan data dan API

- `acc_inventory_documents.voucher_id` menjadi foreign key nullable ke `acc_vouchers.id`.
- `GET /api/v1/accounting/inventory/purchase-vouchers?month=YYYY-MM` menyediakan pilihan voucher approved.
- Create dan update dokumen persediaan menerima `voucher_id` opsional.
- Register dan detail dokumen mengembalikan metadata voucher yang aman.

## Verifikasi

- Backend: 4 pengujian, 49 assertion lulus.
- Frontend: 4 pengujian halaman Persediaan & Gudang lulus.
- Lint frontend dan pemeriksaan sintaks PHP lulus.
- Skenario negatif mencakup voucher draft dan upaya menghubungkan voucher ke dokumen selain penerimaan.

## Batas lanjutan

Implementasi HPP baru boleh dimulai setelah perusahaan menetapkan paling sedikit:

- metode penilaian persediaan, misalnya FIFO atau rata-rata bergerak;
- komponen biaya perolehan yang dikapitalisasi;
- perlakuan diskon, retur, barang rusak, selisih opname, dan pajak;
- waktu pengakuan HPP dan aturan tutup buku.
