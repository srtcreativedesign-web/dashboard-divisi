# Product Requirements Document (PRD): Modul Admin Accounting

## 1. Pendahuluan
Modul Admin Accounting dirancang khusus untuk memenuhi kebutuhan divisi operasional refleksiologi (HLP G4) yang sebelumnya dikelola manual menggunakan Excel. Sistem ini mengintegrasikan seluruh proses rekonsiliasi keuangan, manajemen stok, pengawasan CCTV (anti-fraud), dan komisi karyawan.

## 2. Cakupan & Batasan (Scope & Boundaries)
- **Aktor Utama**: Admin Accounting (Division Code: `ACC`).
- **Pembatasan Data**: Hanya dapat mengakses, menginput, dan melihat data untuk divisi `ACC` (HLP G4).

## 3. Spesifikasi Fungsional Per Modul

### Modul 1: Dashboard (Ringkasan Eksekutif)
- **KPI Cards**:
  - Total Omset (Tunai + QRIS + EDC).
  - Okupansi Kursi (Persentase kursi terisi vs kapasitas).
  - Total Pengeluaran (Laundry + operasional kasir).
  - Estimasi Profit (Omset dikurangi pengeluaran harian).
- **Grafik Tren**: Visualisasi omset harian vs utilitas kursi (data per kursi).
- **Alerts**: Notifikasi stok bahan habis pakai di bawah batas aman dan alarm jika terdapat selisih (discrepancy) antara transaksi POS (Kysoft) dengan log CCTV.

### Modul 2: Pemasukan & Operasional (Revenue & Ops)
- **Storan Harian**: Form input dan tabel setoran tunai Shift 1 dan Shift 2 harian.
- **Detail Cashless**: Pencatatan rekonsiliasi nominal QRIS & EDC harian.
- **Pengeluaran Laundry**: Log timbangan cucian handuk (berat kg, tarif per kg, total tagihan).

### Modul 3: Persediaan & Stok (Inventory Control)
- **Stok Habis Pakai**: Log pemakaian harian barang penunjang pijat (Massage Oil, Massage Cream, tisu).
- **Stok Free Drink**: Monitoring ketersediaan gelas, stirrer, jahe, teh celup, gula, dan penambahan pasokan baru.
- **Pasokan Masuk**: Validasi data penerimaan logistik dari Gudang Pusat berdasarkan nomor faktur.

### Modul 4: Audit CCTV & Okupansi Kursi (CCTV & Chair Audit)
- **Okupansi Kursi**: Matriks pemakaian harian kursi nomor 1 sampai 10.
- **Pencocokan CCTV**: Tools perbandingan data penjualan POS (Kysoft) dengan jumlah pelanggan aktual yang terlihat di rekaman CCTV.

### Modul 5: Komisi & Bonus (Therapist Payroll & Performance)
- **Rekap Pelayanan**: Catat pelayanan harian yang diberikan tiap terapis berdasarkan durasi (30/60/90 menit) per shift.
- **Kalkulator Komisi**: Rekapitulasi bulanan otomatis untuk insentif terapis berdasarkan tarif per peran (SPV, Crew Leader, Kasir).

### Modul 6: Laporan & Analitik (Reports & Analytics)
- **Laporan Bulanan (Monthly Pack)**: Generate rekap keseluruhan bulanan ke dalam format Excel (.xlsx) atau PDF yang terstruktur.
- **Komparasi Periode**: Analisis pertumbuhan omset dan efisiensi pengeluaran antar bulan.

### Modul 7: Pengaturan & Data Master (Settings)
- **Master Karyawan**: Pengaturan daftar terapis, peran aktif, serta besaran tarif komisi per durasi.
- **Master Barang**: Set up nama barang konsumtif outlet beserta ambang batas minimal stok untuk alert.

