# UI/UX Design Brief: Alur Input Omzet

## 1. Prinsip Desain
- **Modern & Clean**: Utility-first CSS (Tailwind v4). Anti-legacy (tanpa shadow tebal/3D).
- **Aksesibilitas**: Keyboard navigation penuh untuk input form.
- **Fleksibilitas Data**: Tampilan preview Excel harus bisa menangani variasi kolom tiap divisi.

## 2. Struktur Tampilan (Views)

### A. Admin Area: Halaman Input Omzet
- **Header Status**: Banner indikator "Buka" (Hijau) atau "Terkunci - Lewat H+1" (Merah).
- **Tombol "Request Unlock"**: Muncul jika status terkunci. Membuka modal form alasan.
- **Tabs Metode Input**:
  1. *Manual*: Form grid input angka.
  2. *Excel Import*: Area Drag-and-drop.
  3. *Tarik POS*: Tombol sinkronisasi (Disabled jika API POS belum siap).
- **Preview Impor Excel**: Tabel *sticky header* menampilkan hasil *parsing* Excel sebelum di-submit. Error baris (misal: format angka salah) disorot merah muda.

### B. Staff Accounting Area: Halaman Validasi & AP
- **Tabel Antrean Omzet**: Daftar omzet dari Admin yang menunggu divalidasi.
- **Kolom Input Angkasa Pura (AP)**: Field input langsung di dalam tabel (inline-edit) untuk memasukkan nilai laporan AP.
- **Kalkulator Selisih Visual**: Kolom "Selisih" muncul otomatis saat nilai AP diisi.
  - Jika `> 0` (Lebih/Untung): Angka warna hijau.
  - Jika `< 0` (Kurang/Rugi): Angka warna merah + Wajib isi catatan.
- **Tombol Aksi**: "Validasi & Kirim ke Manager" (jika ada selisih) atau "Validasi & Buat Jurnal" (jika klop).

### C. Manager Area: Halaman Approval
- **Panel Pending Requests**: Dua kategori (Unlock H+1 & Selisih Omzet).
- **Detail Selisih (Modal/Sheet)**: Menampilkan komparasi Omzet Outlet vs Omzet AP.
- **Action Buttons**: `Approve` (Primary) dan `Reject` (Destructive/Merah).

## 3. Komponen Utama (Shadcn UI)
- `Tabs`: Pindah metode input.
- `Dropzone`: Upload Excel.
- `DataTable` (@tanstack/react-table): Preview data Excel & Antrean validasi dengan fitur sortir/filter.
- `Badge`: Status (Draft, Locked, Waiting Approval, Journaled).
- `Sheet`: Detail selisih omzet dari sisi kanan layar.
