# Kontrol Periode dan Closing Accounting

Tanggal: 13 Oktober 2026
Branch: `REQ`

## Tujuan

Pekerjaan ini menjadikan halaman Periode sebagai workbench closing yang menunjukkan kesiapan nyata, penanggung jawab, keputusan, dan alasan. Implementasi juga menghapus dua state machine periode yang sebelumnya berbeda antara halaman Periode dan Rekonsiliasi Bank.

## Temuan yang diperbaiki

- Endpoint Periode memakai `pending_approval`, sedangkan endpoint Rekonsiliasi memakai `submitted`; satu periode dapat dipahami berbeda oleh dua halaman.
- Mutasi status dari Rekonsiliasi memakai service terpisah yang tidak membatasi record ke Divisi Accounting dan tidak menulis histori master yang sama.
- Halaman Periode menampilkan `transactionCount`, tetapi API tidak memasok nilai tersebut.
- Penutupan dapat dilakukan tanpa checklist jurnal, lampiran, verifikasi rekening, atau selisih kas-bank.
- Koreksi, penutupan, dan pembukaan kembali tidak selalu meminta alasan yang layak diaudit.

## Hasil implementasi

### State machine tunggal

- Status resmi: `draft → pending_approval → approved → closed`.
- Manager dapat mengembalikan `pending_approval` atau `approved` menjadi `needs_correction`.
- Admin/Manager dapat memulai koreksi `needs_correction → draft`.
- Manager membuka `closed → reopened`, lalu mengaktifkan kembali `reopened → draft`.
- Endpoint Rekonsiliasi sekarang menggunakan `AccPeriodService`, sehingga scope, row lock, audit, actor, timestamp, dan versi mengikuti jalur yang sama.

### Checklist readiness berbasis database

- Jumlah jurnal aktif dan jurnal draf.
- Jumlah jurnal tanpa lampiran.
- Jumlah rekening rekonsiliasi dan rekening yang belum diverifikasi.
- Saldo buku kas, saldo bank, serta nilai selisih.
- Lima indikator: jurnal siap, bukti lengkap, data rekening tersedia, rekening terverifikasi, dan saldo kas-bank cocok.
- Pengajuan ditolak server jika jurnal draf atau bukti belum selesai.
- Penutupan ditolak server jika salah satu indikator closing belum lulus.

### Pengalaman pengguna per role

- Daftar periode dan panel detail berada dalam satu layar agar pengguna tidak kehilangan konteks bulan.
- KPI menunjukkan periode menunggu Manager, perlu koreksi, dan sudah ditutup.
- Admin melihat tindakan pengajuan atau mulai koreksi sesuai status.
- Manager melihat tindakan koreksi, persetujuan, penutupan, pembukaan kembali, dan aktivasi periode koreksi.
- Tombol penutupan tidak aktif selama checklist belum lulus dan alasan ditampilkan di dekat tindakan.
- Koreksi, penutupan, dan pembukaan kembali mewajibkan catatan minimal sepuluh karakter.
- Role baca melihat status dan readiness tanpa memperoleh tombol mutasi.

## Perspektif peran

- **Senior Product Manager:** menyatukan definisi status, PIC, dan gate pengajuan/closing.
- **Senior Product Designer:** mengganti kartu histori generik dengan pola daftar–detail–checklist–tindakan yang dapat dipahami pengguna pertama.
- **Senior Fullstack Programmer:** menambahkan endpoint readiness, menyatukan controller/service, memperbarui kontrak frontend, dan menambahkan tes role.
- **Application Security Engineer:** menutup scope bypass pada endpoint Rekonsiliasi, menambahkan row lock, alasan wajib, gate server, dan audit trail terpadu.

## Verifikasi

- Regresi backend Accounting lintas fondasi, role, transaksi, impor, outstanding, cashflow, master, dan rekonsiliasi: 96 tes, 755 assertion lulus.
- Tes backend terarah Master/Periode dan Rekonsiliasi: 37 tes, 187 assertion lulus.
- Tes UI Periode untuk Manager dan Admin: 2 tes lulus.
- TypeScript typecheck, ESLint scoped, production build, sinkronisasi policy, sintaks PHP, dan `git diff --check` lulus.
- Divisi Project tidak diubah.

## Batas pekerjaan

- Laporan cashflow penuh, ekspor, perbandingan periode, dan drill-down sumber masih menjadi tahap berikutnya.
- Toleransi rekonsiliasi teknis saat ini adalah Rp1 sebagaimana aturan service yang sudah dipakai; perubahan toleransi perusahaan harus ditetapkan sebagai konfigurasi bisnis.
- Delegasi pejabat dan threshold materialitas masih menunggu kebijakan perusahaan.
- UAT terang/gelap/mobile seluruh role tetap berada pada `UI-XDIV-002`.
- Hasil teknis ini belum merupakan sign-off bisnis atau kesiapan produksi.
