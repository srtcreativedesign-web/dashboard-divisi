# MVP ERP — 5 Oktober 2026

Modul aplikasi aktif: Accounting (ACC), Project (PROJECT), Cellular (CELL).
Kode CELLULAR pada sesi lama diperlakukan sebagai CELL. Data master divisi lain
tetap dipertahankan sebagai sumber pekerjaan Accounting pusat; data tersebut
tidak otomatis menjadi modul aplikasi MVP.

Delapan role operasional: Manager, Head Operasional, SPV, Leader, Admin,
Admin Gudang, Staff Accounting, Staff Finance. BOD dipertahankan sebagai
pembaca lintas modul. Role lama tidak mendapat izin otomatis.

Izin domain ditentukan dari penugasan akun server, bukan divisionCode payload.
Admin melakukan input dan pengajuan; Manager mengelola master dan persetujuan.
Staff Accounting menangani laporan dan pemeriksaan. Perubahan matriks lebih
lanjut mengikuti kesepakatan alur kerja perusahaan.

Cellular pada tahap ini memiliki daftar outlet aktif dari API, belum mencakup
penjualan, stok, atau pengadaan. CMO belum terdefinisi dan belum diimplementasikan.

Perubahan dilakukan sebagai Senior Product Manager (batas MVP), Senior Product
Designer (navigasi), Application Security Engineer (otorisasi), dan Senior
Fullstack Programmer (perbaikan refaktor serta endpoint Cellular).

Halaman lama tarif pijat, terapis, kursi, komisi sesi, tutup shift refleksi dan laporan gaji sesi dikeluarkan dari aplikasi dan API MVP. Dashboard Accounting memakai laporan cashflow sebenarnya. Migrasi dan data historis tidak dihapus.

Dokumen Project baru disimpan privat dan diunduh melalui endpoint berotorisasi. File historis pada disk public tetap memerlukan inventarisasi dan migrasi tersendiri; berkas lama tidak dipindahkan otomatis.

Alur manual rekap omzet H+1 Accounting tersedia di /accounting/omzet: Admin input/pengajuan, Staff Accounting pemeriksaan, Manager persetujuan selisih dan izin terlambat. Batas akhir H+1 WIB dikonfirmasi pengguna. Aktivasi migrasi lokal dan uji operasional masih menunggu PostgreSQL proyek. Lihat OMZET_WORKFLOW.md untuk hasil verifikasi dan batas cakupan.
