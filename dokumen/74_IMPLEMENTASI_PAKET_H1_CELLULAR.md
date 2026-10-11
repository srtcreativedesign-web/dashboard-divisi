# Implementasi Paket H+1 Cellular

Tanggal: 9 Oktober 2026  
Status: tahap pertama selesai

## Hasil tahap ini

Alur rekap omzet Accounting telah diperluas dari satu input omzet sederhana menjadi paket harian yang sesuai dengan sumber laporan Cellular:

- Admin mengisi omzet Shift 1, Shift 2, dan Shift 3.
- Total omzet harian dihitung oleh sistem dari rincian shift.
- Admin mengisi Tunai, EDC, QRIS, Transfer, dan pembayaran lain.
- Admin mengisi pengeluaran harian.
- Rencana setoran dihitung oleh server dari Tunai dikurangi pengeluaran harian.
- Sistem menghitung selisih total pembayaran terhadap omzet.
- Sistem menyimpan rincian shift dalam tabel terpisah dan tetap mengikatnya pada satu rekap harian.
- Pengajuan tetap mengikuti batas H+1 pukul 23.59 WIB.
- Accounting memeriksa paket; selisih pembayaran, shift, atau laporan AP diteruskan ke Manager.
- Versioning, larangan self-approval, transaksi database, dan audit trail tetap berlaku.

## Kewenangan pada alur ini

- **Admin**: membuat, memperbaiki, dan mengajukan paket H+1.
- **Accounting**: memeriksa, mengembalikan, atau memvalidasi paket.
- **Manager**: memutuskan paket yang mempunyai selisih dan izin pengajuan terlambat.
- **Finance**: menggunakan hasil tervalidasi sebagai sumber rekonsiliasi settlement dan setoran pada tahap berikutnya.
- **Admin Gudang**: menggunakan hasil penjualan tervalidasi sebagai salah satu sumber kontrol persediaan/HPP pada tahap berikutnya.

## Database

Migrasi menambahkan:

- `expense_amount` pada `acc_omzet_records`;
- `expected_deposit_amount` pada `acc_omzet_records`;
- tabel `acc_omzet_shift_lines` untuk rincian Shift 1–3;
- constraint PostgreSQL untuk nilai non-negatif dan nomor shift yang sah.

Migrasi dijalankan menggunakan akun migrator terbatas `dashboard_divisi_mvp_app`. Hak runtime dan readonly diterapkan kembali setelah migrasi.

## Verifikasi

- Backend AccountingOmzetTest: 11 pengujian lulus, 82 assertion.
- Frontend AccountingOmzetPage dan AccountingWorkPage: 15 pengujian lulus.
- TypeScript typecheck: lulus.
- Build produksi: lulus.
- Verifikasi database: 38 pemeriksaan lulus, tanpa menulis data uji.

## Batas tahap ini

Tahap ini belum mengimpor workbook secara permanen. Preview lama tetap read-only. Data historis baru boleh masuk setelah tersedia staging batch, validasi identitas outlet/periode, deteksi duplikat, pemetaan kolom, preview hasil, dan tindakan commit yang diaudit.

## Urutan berikutnya

1. Staging import laporan Harian, Pendapatan/Pengeluaran, dan Omzet per Shift ke paket H+1.
2. Rekonsiliasi ECSYS oleh Accounting dan pencatatan kasus selisih.
3. Rekonsiliasi settlement/setoran oleh Finance.
4. Pembelian, transfer, stock opname, serta roll-forward persediaan oleh Admin Gudang.
5. Checklist period close dan penguncian periode.
6. HPP serta PNL per tenant dengan drill-down ke dokumen sumber.
7. Konsolidasi dan komparasi tenant untuk Manager.

