# Product Requirement Document (PRD): Modul & Alur Kerja Admin

Dokumen spesifikasi resmi untuk implementasi modul dan peran Admin pada sistem Dashboard Divisi.

---

## 1. Ringkasan Eksekutif
Peran **Admin** bertanggung jawab atas pencatatan operasional lapangan harian, validasi pendapatan dan audit fisik, kontrol persediaan, serta persiapan data konsolidasi bulanan untuk penggajian dan pembentukan laporan Laba Rugi (*Profit & Loss* / PnL).

---

## 2. Matriks 14 Tugas Admin & Modul

| No | Tugas Admin | Kategori Modul | Siklus Eksekusi | Ketergantungan / Sumber Data |
|---|---|---|---|---|
| 1 | Rekap Cuti | Modul HRM / Absensi | Bulanan (Cut-off) | Form pengajuan cuti, presensi |
| 2 | Terima Info Omzet per Shift | Modul POS & Operasional | Harian (Per Shift) | Laporan kasir, log transaksi POS |
| 3 | Rekap Omzet Harian (H+1) | Modul POS & Operasional | Harian (Pagi H+1) | Data shift H, bukti kas masuk |
| 4 | Data Pendukung PnL | Modul Keuangan & PnL | Bulanan | Rekap omzet, HBP, beban operasional |
| 5 | Data Pendukung Gaji & Bonus | Modul Penggajian | Bulanan | Realisasi absensi & rekap bonus |
| 6 | Membuat Voucher Tagihan | Modul Keuangan | Sesuai Kebutuhan | Invoice vendor, sewa, tagihan luar |
| 7 | Laporan HBP & Cashless | Modul Keuangan | Mingguan / Bulanan | Pemakaian stok, mutasi EDC / QRIS |
| 8 | Laporan Realisasi Absensi | Modul HRM / Absensi | Harian & Bulanan | Mesin fingerprint / presensi digital |
| 9 | Pendapatan per Shift Terapis | Modul POS & Komisi | Harian / Mingguan | Log pengerjaan terapis per shift |
| 10 | Rekap Setoran | Modul Keuangan | Harian & Bulanan | Slip setoran bank, brankas kasir |
| 11 | Rekap Persediaan (Inventory) | Modul Keuangan / Stok | Mingguan & Bulanan | Stok opname fisik vs kartu stok |
| 12 | Rekap Data Kursi Pijat & CCTV | Modul Audit Operasional | Harian | Counter mesin kursi vs rekaman CCTV |
| 13 | Rekap Bonus Terapis | Modul Penggajian | Bulanan | Omzet individu, rating, jumlah tamu |
| 14 | Voucher Pembelian Stok Menipis | Modul Stok & Keuangan | On-Demand (Harian) | Laporan staf outlet & warehouse |

---

## 3. Spesifikasi Fungsional Tiap Modul

### 3.1. Modul HRM & Absensi
*   **Pencatatan Kehadiran**: Input absensi harian per shift (Shift 1, Shift 2).
*   **Kalkulasi Realisasi**: Menghitung rasio kehadiran, keterlambatan, izin sakit, dan alpa.
*   **Pengelolaan Cuti**: Saldo cuti tahunan, approval cuti, dan rekapitulasi saat cut-off penggajian.

### 3.2. Modul POS, Operasional & Audit Fisik
*   **Input Omzet Shift**: Kasir menyerahkan total omzet tunai dan non-tunai di akhir shift.
*   **Rekap Omzet H+1**: Admin memvalidasi selisih antara pencatatan kasir dengan saldo rekening koran/EDC.
*   **Audit Kursi Pijat vs CCTV**: Pencatatan meteran/counter kursi pijat untuk mencocokkan durasi layanan riil dengan jumlah transaksi yang terbit di POS.
*   **Performa Terapis**: Alokasi pendapatan berdasarkan terapis pelaksana untuk perhitungan komisi.

### 3.3. Modul Keuangan & Inventaris
*   **Rekapitulasi Setoran**: Tracking setoran harian tunai dan settlement non-tunai (EDC/QRIS).
*   **Manajemen Stok & HBP**: Menghitung Harga Pokok Penjualan/Barang (misal minyak reflexology, lotion, linen, welcome drink).
*   **Sistem Voucher**:
    *   *Voucher Tagihan (AR/AP)*: Mencatat tagihan ke pihak ketiga atau sewa outlet.
    *   *Voucher Pembelian (Restock)*: Pengajuan dana cepat saat stok bahan operasional di outlet/warehouse menipis.

### 3.4. Modul Penggajian & Bonus
*   **Kalkulasi Bonus Terapis**: Rumus bonus berdasarkan pencapaian target mingguan/bulanan dan jumlah perlakuan (*treatment*).
*   **Integrasi Penggajian**: Menggabungkan data absensi, potongan cuti di luar kuota, dan insentif menjadi lembar kerja gaji akhir.
