# Data Dictionary: Modul Admin

Dokumen spesifikasi skema basis data PostgreSQL/Laravel Migration untuk mendukung 14 alur kerja peran Admin.

---

## 1. Skema Tabel Baru / Terkait

```
+----------------------------------------------------------------------------------+
|                                    TABEL UTAMA                                   |
+--------------------------+---------------------------+---------------------------+
| 1. admin_shift_revenues  | 4. admin_chair_audits     | 7. admin_payroll_supports |
| 2. admin_therapist_sales | 5. admin_inventories      | 8. admin_leave_records    |
| 3. admin_settlements     | 6. admin_vouchers         | 9. admin_attendance_recap |
+--------------------------+---------------------------+---------------------------+
```

---

## 2. Rincian Struktur Tabel

### 2.1. Tabel `admin_shift_revenues` (Omzet per Shift & Rekap H+1)
Menyimpan data pendapatan per shift yang diinput kasir dan divalidasi admin pada H+1.

| Kolom | Tipe Data | Nullable | Deskripsi |
|---|---|---|---|
| `id` | `uuid` / `bigIncrements` | Tidak | Primary Key |
| `division_code` | `varchar(10)` | Tidak | Kode Divisi (misal: `REFL`, `FNB`) |
| `outlet_id` | `uuid` | Tidak | Foreign Key ke tabel `outlets` |
| `transaction_date`| `date` | Tidak | Tanggal transaksi |
| `shift_number` | `smallint` | Tidak | Shift 1, Shift 2, dst. |
| `cash_amount` | `decimal(15,2)` | Tidak | Penerimaan Tunai |
| `qris_amount` | `decimal(15,2)` | Tidak | Penerimaan QRIS |
| `edc_amount` | `decimal(15,2)` | Tidak | Penerimaan Kartu Debit/Kredit EDC |
| `total_amount` | `decimal(15,2)` | Tidak | Total Omzet Shift |
| `status` | `varchar(20)` | Tidak | `DRAFT`, `VERIFIED_H1`, `LOCKED` |
| `verified_by` | `uuid` | Ya | User ID Admin pemeriksa |
| `created_at` | `timestamp` | Tidak | Waktu pembuatan |
| `updated_at` | `timestamp` | Tidak | Waktu pembaruan |

---

### 2.2. Tabel `admin_therapist_sales` (Pendapatan per Shift Terapis)
Mencatat kontribusi dan transaksi per terapis untuk dasar komisi/bonus.

| Kolom | Tipe Data | Nullable | Deskripsi |
|---|---|---|---|
| `id` | `uuid` / `bigIncrements` | Tidak | Primary Key |
| `shift_revenue_id` | `uuid` | Tidak | FK ke `admin_shift_revenues` |
| `employee_id` | `uuid` | Tidak | ID Karyawan / Terapis |
| `service_count` | `integer` | Tidak | Jumlah customer / treatment |
| `service_amount` | `decimal(15,2)` | Tidak | Total nominal omzet yang dihasilkan |
| `tips_amount` | `decimal(15,2)` | Ya | Tip customer (jika dicatat) |
| `created_at` | `timestamp` | Tidak | Waktu pembuatan |

---

### 2.3. Tabel `admin_chair_audits` (Audit Kursi Pijat & CCTV)
Mencatat hasil audit fisik counter kursi pijat dibandingkan rekaman CCTV dan struk POS.

| Kolom | Tipe Data | Nullable | Deskripsi |
|---|---|---|---|
| `id` | `uuid` / `bigIncrements` | Tidak | Primary Key |
| `outlet_id` | `uuid` | Tidak | FK ke `outlets` |
| `audit_date` | `date` | Tidak | Tanggal audit |
| `chair_number` | `varchar(20)` | Tidak | Nomor/Kode Kursi (misal: `K-01`) |
| `counter_start` | `integer` | Tidak | Angka counter awal shift |
| `counter_end` | `integer` | Tidak | Angka counter akhir shift |
| `usage_count` | `integer` | Tidak | Total pemakaian fisik (`end - start`) |
| `pos_count` | `integer` | Tidak | Total transaksi di sistem POS |
| `cctv_count` | `integer` | Ya | Jumlah orang terdeteksi di CCTV |
| `discrepancy` | `integer` | Tidak | Selisih (`usage_count - pos_count`) |
| `notes` | `text` | Ya | Keterangan jika ada selisih |

---

### 2.4. Tabel `admin_inventories` (Persediaan & HBP)
Mencatat stok bahan operasional, minyak pijat, krim, linen, dan free drink.

| Kolom | Tipe Data | Nullable | Deskripsi |
|---|---|---|---|
| `id` | `uuid` / `bigIncrements` | Tidak | Primary Key |
| `outlet_id` | `uuid` | Tidak | FK ke `outlets` |
| `item_code` | `varchar(50)` | Tidak | Kode barang (misal: `OIL-01`, `MINERAL-CUP`) |
| `item_name` | `varchar(150)` | Tidak | Nama barang |
| `category` | `varchar(50)` | Tidak | `CONSUMABLE`, `DRINK`, `LINEN` |
| `opening_stock` | `decimal(10,2)` | Tidak | Stok awal periode |
| `in_stock` | `decimal(10,2)` | Tidak | Stok masuk / restock |
| `out_stock` | `decimal(10,2)` | Tidak | Pemakaian harian |
| `closing_stock` | `decimal(10,2)` | Tidak | Sisa stok akhir |
| `unit_price` | `decimal(15,2)` | Tidak | Harga per satuan (COGS / HBP) |
| `total_cogs` | `decimal(15,2)` | Tidak | Total HBP pemakaian (`out_stock * unit_price`) |
| `min_stock_alert`| `decimal(10,2)` | Tidak | Ambang batas peringatan stok menipis |

---

### 2.5. Tabel `admin_vouchers` (Voucher Tagihan & Pembelian Restock)
Mencatat pembuatan voucher operasional (Tagihan / Purchasing).

| Kolom | Tipe Data | Nullable | Deskripsi |
|---|---|---|---|
| `id` | `uuid` / `bigIncrements` | Tidak | Primary Key |
| `voucher_number` | `varchar(50)` | Tidak | Nomor unik voucher |
| `voucher_type` | `varchar(20)` | Tidak | `BILLING` (Tagihan) / `PURCHASE` (Beli Stok) |
| `outlet_id` | `uuid` | Tidak | FK ke `outlets` |
| `beneficiary_name`| `varchar(150)` | Tidak | Vendor / Penerima dana / Staf |
| `amount` | `decimal(15,2)` | Tidak | Nominal voucher |
| `purpose` | `text` | Tidak | Tujuan pengeluaran / uraian barang menipis |
| `status` | `varchar(20)` | Tidak | `DRAFT`, `PENDING_APPROVAL`, `PAID` |
| `created_by` | `uuid` | Tidak | User Admin pembuat |
| `approved_by` | `uuid` | Ya | User Manager/BOD penyetuju |

---

### 2.6. Tabel `admin_payroll_supports` (Rekap Bonus & Gaji)
Data agregasi bulanan untuk bagian HR/Finance.

| Kolom | Tipe Data | Nullable | Deskripsi |
|---|---|---|---|
| `id` | `uuid` / `bigIncrements` | Tidak | Primary Key |
| `period_month` | `varchar(7)` | Tidak | Format `YYYY-MM` |
| `employee_id` | `uuid` | Tidak | FK ke `employees` |
| `total_attendance`| `integer` | Tidak | Jumlah hari kerja aktual |
| `total_leaves` | `integer` | Tidak | Jumlah cuti diambil |
| `total_service` | `integer` | Tidak | Total treatment dikerjakan |
| `base_bonus` | `decimal(15,2)` | Tidak | Bonus reguler |
| `achievement_bonus`| `decimal(15,2)`| Tidak | Bonus target omzet / mingguan |
| `total_bonus` | `decimal(15,2)` | Tidak | Total bonus terapis |
| `status` | `varchar(20)` | Tidak | `DRAFT`, `SUBMITTED`, `FINALIZED` |
