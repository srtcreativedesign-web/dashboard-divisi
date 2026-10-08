# Seed dan pengujian Project — September–Oktober 2026

## Cakupan

Batch PRJ-UAT-202609-202610 adalah data sintetis yang tersimpan pada PostgreSQL dashboard_divisi_mvp, bukan hardcode frontend. Periode realisasi 1 September–8 Oktober 2026; jadwal kontrak dan jatuh tempo dapat berada setelah tanggal pengujian.

8 proyek (4 new, 4 maintenance), 24 milestone, 24 RAB, 20 invoice, 28 pengeluaran, 160 transaksi kas kecil, 1 vendor. Status: 2 planning, 3 in_progress, 1 on_hold, 2 completed. Nilai kontrak total Rp790.000.000. Pengeluaran material terpisah dari kas kecil sehingga tidak dihitung sebagai transaksi yang sama.

## Backup dan pelaksanaan

Backup terenkripsi sebelum perubahan: C:/ERP/backups/dashboard-divisi/2026-10-08T04-16-46-445Z-f370447f.erpbackup. Empat migrasi Project hasil pull dipasang melalui scripts/database/erp-db-migrate.mjs. Migrasi tambahan melengkapi project_code, location, description yang sebelumnya dipakai kode tetapi belum ada pada skema.

Seeder eksplisit ProjectTwoMonthUatSeeder; tidak dipanggil DatabaseSeeder operasional. Target local PostgreSQL dan backup diwajibkan di luar testing. Akun admin.project yang sudah ada dipakai; tidak membuat akun/password baru. Seed atomik, memakai lock PostgreSQL, menolak benturan kode milik data lain, dan melewati proyek batch yang sudah ada tanpa menimpanya. Seed ulang pada database nyata tidak menggandakan data. Jumlah record Accounting/Cellular sebelum dan sesudah sama.

Ulang seed: set ERP_PROJECT_SEED_BACKUP ke berkas backup sah lalu jalankan php artisan db:seed --class=ProjectTwoMonthUatSeeder dari apps/api. Seeder tidak mengembalikan fixture yang sengaja diedit pengguna ke nilai awal.

## Hasil pengujian

13 tes backend Project/seed lulus (104 assertions): konsistensi bobot dan saldo, idempotensi, rollback benturan, filter klasifikasi, reader tidak dapat mutasi, Accounting tidak dapat membaca data Project. Pengujian frontend Project/PDF serta regresi LPJ dijalankan. UI browser diperiksa pada dashboard, kas kecil, invoice, RAB dan LPJ dengan akun Head Operasional sebagai pembaca.

## Perbaikan dari hasil uji

- Risiko dashboard memakai status on_hold atau tanggal selesai lewat, tidak lagi Math.random.
- Nama vendor statis dihapus.
- Milestone completed tanpa persentase eksplisit diperlakukan sebagai 100% untuk perhitungan capaian; milestone pending tetap 0%.
- LPJ menggunakan nama field RAB/biaya yang benar dari API, status proyek tersimpan, dan tidak memakai due_date sebagai tanggal selesai aktual.
- LPJ bertanda draf belum diverifikasi; tidak mengklaim audit closed, proyek 100% selesai, atau laba final. Invoice draft/cancelled tidak masuk total tagihan LPJ.
- Kegagalan sumber keuangan LPJ menampilkan error/retry dan tidak menyediakan cetak laporan nol.

## Batas pengujian

Tidak ada lampiran atau BAST palsu yang dibuat. Unggah bukti, pemindaian malware, tanda tangan/approval LPJ, dan siklus pembayaran nyata tidak dinyatakan selesai hanya dari seed. Endpoint progres/BAST legacy masih perlu dikembangkan; LPJ memakai milestone dan data keuangan tersimpan. UI edit progres rinci memerlukan persistensi persentase/tanggal aktual yang belum tersedia. Selisih kontrak dan biaya tercatat bukan PNL/laba final.

Validasi akhir: tes Project/PDF frontend (29 tes), tambahan regresi dashboard (1 tes) dan LPJ (2 tes) lulus. Typecheck serta build produksi lulus; peringatan chunk besar masih ada. Bukti UI lokal: C:/ERP/ui-proof/project-seed-invoice.jpg dan project-seed-lpj-final.jpg.
