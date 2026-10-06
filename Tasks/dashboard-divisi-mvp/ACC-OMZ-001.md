---
id: ACC-OMZ-001
status: in-progress
---
# Alur rekap omzet H+1

- [x] Input manual Admin per outlet/tanggal/shift, termasuk outlet lintas divisi melalui service direktori.
- [x] Pengajuan H+1 WIB, pemeriksaan Staff Accounting, pengembalian koreksi, persetujuan selisih oleh Manager.
- [x] Izin terlambat 24 jam sekali pakai, versi, penguncian transaksi dan riwayat perubahan.
- [x] Ringkasan tervalidasi, 83 tes backend MVP dan 62 frontend lulus; lint/typecheck/build lulus.
- [x] Aktivasi migrasi pada PostgreSQL native: dashboard_divisi_mvp di 127.0.0.1:5432, 32 migrasi berhasil dan role aplikasi terverifikasi.
- [ ] Uji operasional dengan Admin, Staff Accounting dan Manager pada database persisten.

Impor/POS, unggah bukti, dan jurnal otomatis merupakan pekerjaan terpisah. Suite backend legacy belum hijau dan dicatat dalam docs/OMZET_WORKFLOW.md.
