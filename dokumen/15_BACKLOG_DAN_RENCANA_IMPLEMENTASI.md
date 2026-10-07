# Backlog dan rencana implementasi

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Senior Fullstack Programmer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Prioritas usulan, belum persetujuan jadwal

P0 menjaga integritas/keamanan rilis; P1 alur inti yang dipilih bisnis; P2 pengembangan berikutnya. Semua kebutuhan tetap dicatat meski belum dipilih untuk rilis pertama.

- BL-01 / P0: review batas rilis, RACI, role/scope dan AC; dependensi semua fitur baru.
- BL-02 / P0: rekonsiliasi SOP dengan implementasi dan regresi backend lama. Pisahkan bug dari ekspektasi legacy; jangan menghapus tes sekadar menghijaukan hasil.
- BL-03 / P0: sesi/token, IDOR, pemisahan pembuat/pemeriksa/approver dan migrasi berkas publik lama. Bukti UAT-01/07/13.
- BL-04 / P0: backup/restore terukur; pemisahan akun runtime/migrator/read-only. Bukti UAT-15.
- BL-05 / P1: penerimaan omzet H+1 dan voucher yang sudah dikodekan; review izin terlambat, koreksi, duplikat dan laporan. UAT-02–07.
- BL-06 / P1: finalisasi COA, periode, jurnal, outstanding dan cashflow. Fondasi ada; aturan/saldo perlu rekonsiliasi. UAT-08/09.
- BL-07 / P1: discovery/penerimaan Project PRJ-01–07; putuskan revisi RAB, progres dan hubungan termin dengan Finance. UAT-10.
- BL-08 / P1: discovery Cellular CEL-01–08. Direktori tersedia; pilih tipe produk, sumber penjualan dan kontrol stok sebelum coding transaksi.
- BL-09 / P1/P2: kebutuhan Admin cuti, absensi, pendukung PNL/bonus, bonus, persediaan, setoran. Dependensi sumber/master dan formula.
- BL-10 / P1/P2: PNL/laba/beban/tracking/komparasi tenant; dependensi COA, periode, biaya dan pengakuan pendapatan.
- BL-11 / P2: Ecsys/AP, lampiran, pelaporan selisih, kontrak, pas bandara dan surat; perlu contoh anonim serta kewenangan eksternal.
- BL-12 / prioritas menunggu keputusan: CMO dan pajak. Definisi/aturan harus diverifikasi sebelum membuat formula atau tarif tetap.

## Definition of Ready

Item mempunyai requirement ID, pengguna/problem, input/output, state/aksi, role/scope, validasi, AC, sumber, dependensi dan keputusan terbuka. Perubahan keuangan mempunyai contoh rekonsiliasi anonim. Integrasi mempunyai format/versioning; UI mempunyai empty/loading/error/success.

## Definition of Done

Kode cocok kebutuhan yang direview, akses/data aman, tes relevan lulus, bukti UAT tersedia, migrasi/pemulihan direncanakan dan dokumen diperbarui. Sudah dikodekan tidak otomatis selesai bisnis. Estimasi/tanggal ditentukan setelah scope dan dependensi jelas.
