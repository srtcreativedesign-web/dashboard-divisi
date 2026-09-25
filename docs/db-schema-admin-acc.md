# Database Schema Design: Modul Admin Accounting

## 1. Tabel `acc_storan_harian` (Pemasukan Kasir Harian)
- `id` (bigint, PK)
- `tanggal` (date)
- `shift` (tinyint) - 1 atau 2
- `pendapatan_tunai` (decimal 12,2)
- `no_kysoft_sales` (varchar) - referensi transaksi POS
- `division_code` (varchar) - default "ACC"
- `timestamps`

## 2. Tabel `acc_detail_cashless` (Pemasukan QRIS & EDC)
- `id` (bigint, PK)
- `tanggal` (date)
- `shift` (tinyint)
- `nominal_qris` (decimal 12,2)
- `nominal_edc` (decimal 12,2)
- `no_storan_finance` (varchar)
- `timestamps`

## 3. Tabel `acc_laundry_logs` (Pencatatan Laundry)
- `id` (bigint, PK)
- `tanggal` (date)
- `berat_kg` (decimal 6,2)
- `harga_per_kg` (decimal 10,2)
- `total_tagihan` (decimal 12,2)
- `status_pembayaran` (enum) - Draft, Verified, Paid
- `timestamps`

## 4. Tabel `acc_stok_opname` (Persediaan Stok)
- `id` (bigint, PK)
- `tanggal` (date)
- `barang_id` (bigint, FK)
- `stok_awal` (integer)
- `barang_datang` (integer)
- `pemakaian` (integer)
- `stok_akhir` (integer)
- `timestamps`

## 5. Tabel `acc_utilisasi_kursi` (Audit Kursi Pijat & CCTV)
- `id` (bigint, PK)
- `tanggal` (date)
- `no_kursi` (tinyint) - 1 s/d 10
- `jam_mulai` (time)
- `jam_selesai` (time)
- `durasi_menit` (integer)
- `terapis_id` (bigint, FK)
- `utilisasi_cctv` (boolean) - verifikasi sensor CCTV harian
- `timestamps`

## 6. Tabel `acc_rekap_komisi` (Gaji & Insentif Karyawan)
- `id` (bigint, PK)
- `periode_awal` (date) - tanggal 26
- `periode_akhir` (date) - tanggal 25
- `karyawan_id` (bigint, FK)
- `sesi_30m` (integer)
- `sesi_60m` (integer)
- `sesi_90m` (integer)
- `total_bonus` (decimal 12,2)
- `timestamps`

