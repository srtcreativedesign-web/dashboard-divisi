# Product Requirements Document (PRD): Modul Divisi Project (Manajemen Proyek)

## 1. Pendahuluan
Modul **Divisi Project (Manajemen Proyek)** dirancang untuk memusatkan pengelolaan, pemantauan, dan pertanggungjawaban proyek (konstruksi, fit-out outlet, renovasi, pengadaan fasilitas, dan instalasi teknis) di lingkungan sistem `dashboard-divisi`. 

Sistem ini menghubungkan pencatatan progres fisik di lapangan, dokumentasi visual (*before-after*), rencana jadwal (*milestones*), kontrol anggaran biaya (*RAB vs actual cost*), serta penagihan termin ke klien.

---

## 2. Peran Pengguna & Hak Akses (RBAC)

| Peran | Ruang Lingkup Data | Hak Akses Utama |
|---|---|---|
| **BOD (Direksi)** | Lintas Divisi (Global Read-Only) | Melihat ringkasan portofolio seluruh proyek, kurva progres S-Curve, kepatuhan jadwal, dan kesehatan finansial proyek (`view:projects`, `view:report`). |
| **Manager Project** | Divisi `PROJECT` (Approval & Kontrol) | Membuat proyek, menyetujui milestone, memvalidasi RAB dan addendum, verifikasi termin pembayaran, serta evaluasi vendor (`view:projects`, `manage:projects`, `view:division`, `manage:division`). |
| **Admin Project** | Divisi `PROJECT` (Operasional Lapangan) | Input data proyek baru, update berkala progres milestone, upload dokumentasi foto lapangan (*before/after*), input pengeluaran riil, dan upload dokumen legalitas (`view:projects`, `manage:projects`). |

---

## 3. Spesifikasi Fungsional Per Modul

### Modul 1: Dashboard Portofolio Proyek (Executive Overview)
- **Ringkasan KPI**:
  - **Proyek Aktif**: Jumlah proyek yang sedang dalam tahap pengerjaan fisik (*in_progress*).
  - **Total Nilai Kontrak**: Akumulasi nilai kontrak seluruh proyek yang berjalan.
  - **Rata-rata Progres Fisik**: Rata-rata capaian progres tertimbang se-portofolio.
  - **Kesehatan Anggaran**: Perbandingan total pagu RAB terhadap realisasi pengeluaran berjalan.
  - **Termin Tertagih vs Piutang**: Ringkasan status kas masuk penagihan ke klien.
- **Daftar Proyek Kritis (Alert System)**:
  - Proyek dengan deviasi negatif > 10% (realisasi tertinggal dari rencana jadwal).
  - Milestone yang mendekati atau telah melampaui tanggal jatuh tempo (*overdue*).

---

### Modul 2: Master & Detail Proyek (Project Registry & Lifecycle)
- **Informasi Pokok**:
  - Kode Proyek (auto-generate / custom, misal: `PRJ-2026-001`).
  - Nama Proyek, Klien / Pemberi Tugas, Lokasi Proyek.
  - Nilai Kontrak (Bruto & Netto).
  - Periode Pelaksanaan (Tanggal Mulai & Target Selesai).
  - Status Proyek: `planning`, `in_progress`, `on_hold`, `completed`, `cancelled`.
  - Deskripsi dan Ruang Lingkup Pekerjaan.
- **Halaman Detail Tabular**:
  - Tab 1: **Ringkasan & Informasi Umum**
  - Tab 2: **Jadwal & Milestone (Time Plan)**
  - Tab 3: **Dokumentasi Visual (Before - In-Progress - After)**
  - Tab 4: **RAB & Kontrol Biaya (Budget vs Actual)**
  - Tab 5: **Termin & Penagihan (Billing)**
  - Tab 6: **Dokumen & Lampiran Kontrak**

---

### Modul 3: Milestones & Jadwal Pelaksanaan (Tracking & Schedule)
- **Manajemen Tahapan**:
  - Daftar tahapan pekerjaan dengan **Bobot Persentase (%)** (Total akumulasi seluruh milestone = 100%).
  - Tanggal Rencana (*Planned Due Date*) vs Tanggal Realisasi Selesai (*Actual Completion Date*).
  - Status Milestone: `pending`, `in_progress`, `review`, `completed`.
- **Form Update Milestone Lapangan**:
  - Input persentase realisasi terkini (0% - 100%).
  - Catatan progres & kendala lapangan (*site notes & blocker log*).
  - Hubungan langsung ke termin penagihan (opsional trigger invoice).

---

### Modul 4: Galeri Dokumentasi Visual (Foto Before - After)
- **Klasifikasi Tahapan Foto**:
  - **Before (Pra-Kerja / 0%)**: Foto kondisi eksisting awal lapangan sebelum intervensi proyek.
  - **In-Progress (Sedang Berjalan)**: Foto tahapan pengerjaan struktural, instalasi ME, finishing.
  - **After (Pasca-Kerja / 100%)**: Foto hasil akhir serah terima pekerjaan.
- **Fitur Galeri Interaktif**:
  - **Komparasi Side-by-Side & Slider**: Membandingkan foto *Sebelum* vs *Sesudah* pada sudut pandang area yang sama.
  - **Tagging Area / Zona**: Label area (misal: *Fasad Depan*, *Area Kasir*, *Ruang Server*, *Plafon Lantai 2*).
  - **Keterkaitan dengan Milestone**: Menautkan foto langsung sebagai bukti fisik capaian milestone tertentu.
  - **Informasi Metadata**: Tanggal foto diambil, nama pengunggah, dan catatan deskripsi singkat.
  - **Export Bukti Visual**: Unduh kompilasi foto untuk lampiran resmi BAST (Berita Acara Serah Terima).

---

### Modul 5: Termin Penagihan & Invoicing (Billing & Cash Flow)
- **Struktur Termin Pembayaran**:
  - Pembagian termin berdasarkan capaian milestone (misal: Uang Muka DP 30%, Progres 50% = 40%, BAST 100% = 25%, Retensi 5%).
- **Pelacakan Status Faktur**:
  - Nomor Faktur / Invoice, Tanggal Terbit, Jatuh Tempo.
  - Nominal Tagihan dan Bukti Pembayaran dari Klien.
  - Status: `draft`, `invoiced`, `paid`, `overdue`.
  - Toggle cepat konfirmasi penerimaan dana (sinkronisasi kas masuk).

---

### Modul 6: Anggaran & Kontrol Biaya (RAB vs Realisasi Biaya)
- **Rencana Anggaran Biaya (RAB)**:
  - Uraian pekerjaan dengan kategori: `material`, `labor` (upah), `subcontractor`, `equipment` (alat), `overhead`, `margin`.
  - Volume, satuan, harga satuan, dan total anggaran rencana.
- **Pencatatan Realisasi Pengeluaran Lapangan (Actual Expense)**:
  - Input transaksi pengeluaran nyata: tanggal, vendor/toko penerima, uraian, nominal, dan upload nota/struk kasbon.
  - Kaitan transaksi pengeluaran ke item RAB yang bersesuaian.
- **Kalkulasi Laba-Rugi Proyek (Project PnL / Profit Margin)**:
  $$\text{Laba Riil} = \text{Nilai Kontrak} - \text{Total Realisasi Biaya}$$
  $$\text{Margin Riil (\%)} = \left(\frac{\text{Laba Riil}}{\text{Nilai Kontrak}}\right) \times 100\%$$
- Indikator peringatan dini (*over-budget warning*) jika pengeluaran riil melampaui plafon anggaran RAB.

---

### Modul 7: Direktori Mitra & Subkontraktor (Vendor Directory)
- **Master Vendor**: Nama perusahaan/mandor, kategori keahlian (Sipil, Elektrikal, Cat/Finishing, Supplier Bahan), kontak person, nomor telepon, dan nomor rekening bank.
- **Penugasan Pekerjaan**: Menautkan vendor rekanan ke proyek atau item pengadaan tertentu beserta status kinerja.

---

### Modul 8: Repository Dokumen & Legalitas
- Arsip dokumen proyek terpusat:
  - Dokumen Kontrak & SPK (Surat Perintah Kerja).
  - Gambar Kerja (DED / Blueprint / Layout CAD).
  - Berita Acara Serah Terima (BAST 1 & BAST 2).
  - Berita Acara Pekerjaan Tambah/Kurang (*Addendum / Change Order*).
  - Garansi & Masa Retensi.

---

## 4. Rencana Skema Database (Delta / Penyesuaian)

### A. Tabel `projects` (Penambahan Kolom)
- `project_code`: `string` (unique, nullable, misal: `PRJ-2026-001`)
- `description`: `text` (nullable)
- `location`: `string` (nullable)

### B. Tabel `project_milestones` (Penyempurnaan Kolom)
- `actual_percentage`: `decimal(5,2)` default `0.00`
- `planned_percentage`: `decimal(5,2)` default `0.00`
- `completion_date`: `date` (nullable)
- `notes`: `text` (nullable)

### C. Tabel Baru: `project_progress_photos`
- `id`: Primary key
- `project_id`: Foreign key ke `projects` (cascade delete)
- `milestone_id`: Foreign key ke `project_milestones` (null on delete)
- `stage`: Enum (`before`, `in_progress`, `after`)
- `area_name`: `string` (nullable, misal: "Fasad Depan", "Lantai 1")
- `caption`: `string` (nullable)
- `photo_path`: `string`
- `taken_at`: `date` (nullable)
- `uploaded_by`: Foreign key ke `users` (null on delete)
- `timestamps`

### D. Tabel Baru: `project_expenses` (Pencatatan Biaya Riil)
- `id`: Primary key
- `project_id`: Foreign key ke `projects` (cascade delete)
- `rab_id`: Foreign key ke `project_rabs` (null on delete)
- `vendor_id`: Foreign key ke `project_vendors` (null on delete)
- `expense_date`: `date`
- `amount`: `decimal(15,2)`
- `category`: `string`
- `description`: `string`
- `receipt_path`: `string` (nullable)
- `created_by`: Foreign key ke `users`
- `timestamps`

---

## 5. Rencana Tahapan Implementasi (Roadmap)

1. **Fase 1 (Inti Progres & Visual Lapangan)**:
   - Migrasi skema penambahan kolom `projects`, `project_milestones`, dan tabel `project_progress_photos`.
   - Implementasi API endpoint untuk upload foto *before-after* dan update detail milestone.
   - Pembangunan komponen UI Galeri *Before-After* (dengan perbandingan slider) dan form edit milestone di halaman detail proyek.

2. **Fase 2 (Finansial Proyek & Termin)**:
   - Pembuatan tabel `project_expenses` dan integrasi monitoring realisasi biaya vs RAB.
   - Penyempurnaan modul penagihan termin (invoice & tanda terima bayar).
   - Widget kalkulasi Profit Margin riil per proyek di Dashboard.

3. **Fase 3 (Laporan & Serah Terima)**:
   - Fitur ekspor laporan berkala proyek (PDF/Print) lengkap dengan lampiran galeri foto komparasi sebelum-sesudah untuk kebutuhan BAST.
