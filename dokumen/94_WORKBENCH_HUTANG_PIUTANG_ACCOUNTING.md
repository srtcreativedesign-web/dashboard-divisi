# Workbench Hutang–Piutang Accounting

Tanggal: 13 Oktober 2026
Branch: `REQ`

## Tujuan

Pekerjaan ini mengubah halaman Hutang–Piutang dari daftar kewajiban generik menjadi workbench dokumen keuangan yang membedakan kewajiban perusahaan dan tagihan kepada pihak lain. Kerangka visual mengikuti Divisi Project, sedangkan istilah, data, tindakan, dan kewenangan tetap khusus Accounting.

## Hasil implementasi

### Kontrak dokumen

- Dokumen memiliki jenis `Hutang` atau `Piutang`, pihak lawan transaksi, nomor referensi, kategori, periode, nilai, jatuh tempo, status, dan versi.
- Periode wajib dipilih dari periode Accounting yang masih dapat diedit; tidak ada lagi periode, tanggal jatuh tempo, atau nomor dokumen fallback yang ditanam di kode.
- Nomor dokumen AP/AR dibentuk server berdasarkan jenis dan periode, sehingga pengguna tidak perlu menyusun identitas internal sendiri.
- Register dapat difilter berdasarkan periode, jenis, status, umur jatuh tempo, dan kata kunci.
- Ringkasan memisahkan total hutang, total piutang, jatuh tempo, serta proyeksi kas `saldo kas - hutang + piutang`.

### Alur dan kewenangan

- **Admin/Accounting** mencatat dokumen baru melalui capability `write:acc_outstanding`.
- **Finance** merealisasikan pembayaran hutang atau penerimaan piutang melalui capability `execute:payment`.
- **Manager** membatalkan dokumen yang belum direalisasikan melalui capability `manage:acc_period` dengan alasan terstruktur.
- Dokumen yang sudah direalisasikan sebagian atau seluruhnya tidak dapat dibatalkan langsung; koreksi finansial memerlukan alur reversal terpisah.
- Seluruh mutasi dibatasi ke Divisi Accounting, memakai optimistic version, transaksi database, dan audit trail.

### Pengalaman pengguna

- Kartu KPI menjelaskan posisi hutang, piutang, jatuh tempo, dan dampaknya terhadap kas.
- Tabel responsif menampilkan pihak lawan, referensi, jenis, jatuh tempo, sisa, status, dan tindakan yang tersedia untuk role aktif.
- Form pembuatan dibagi menjadi identitas dokumen, klasifikasi Accounting, dan nilai/jadwal.
- Form realisasi memakai rekening dari master data server, tanggal transaksi, catatan, dan konteks hutang/piutang.
- Pembatalan memakai dialog dengan alasan minimal sepuluh karakter; konfirmasi browser generik tidak digunakan.
- Laporan cashflow menampilkan hutang dan piutang sebagai komponen terpisah dan menjelaskan rumus proyeksi.

## Perspektif peran

- **Senior Product Manager:** menetapkan makna hutang/piutang, urutan maker–executor–controller, dan batas antara pembatalan dengan reversal.
- **Senior Product Designer:** menyusun workbench berdasarkan keputusan pengguna, memperjelas status, pihak bertanggung jawab, jatuh tempo, dan tindakan berikutnya.
- **Senior Fullstack Programmer:** memperluas skema, kontrak API, service, UI, query cache, laporan cashflow, serta pengujian terarah.
- **Application Security Engineer:** memisahkan capability, menegakkan scope Accounting dan periode, memakai version check/row lock, serta mempertahankan audit trail.

## Perubahan database dan backup

- Backup terenkripsi dibuat sebelum migrasi di `C:\ERP\backups\dashboard-divisi\2026-10-12T10-00-21-916Z-2756fff7.erpbackup`.
- SHA-256 backup: `3cf93c95c156be522acedeb63eaca2b1d58eb8a79b8fe0ed3b033312d5c996ed`.
- Restore-check lulus untuk 83 tabel, skema, indeks, sequence, constraint Project/Cellular, serta delapan berkas; database produksi tidak ditimpa.
- Migrasi additive menambahkan jenis dokumen, pihak lawan, nomor referensi, dan versi ke outstanding Accounting.
- Status migrasi, 44 pemeriksaan hak database, dan empat pengujian database native lulus.
- Probe backup diperbarui agar mempertahankan default kolom ketika menyalin tabel temporer; diagnostik fingerprint hanya menyebut jenis/nama objek gagal dan tidak memuat SQL atau kredensial.

## Verifikasi

- `AccountingOutstandingTest`: 10 tes, 39 assertion lulus.
- `AccountingCashflowTest`: 4 tes, 37 assertion lulus.
- Tes visualisasi keuangan/cashflow web: 13 tes lulus.
- TypeScript typecheck, ESLint scoped, policy sync, production build, sintaks PHP, dan `git diff --check` lulus.
- Divisi Project tidak diubah.

## Batas pekerjaan

- Lampiran invoice, alur reversal, posting jurnal otomatis, reminder jatuh tempo, dan payment batch belum termasuk.
- Halaman laporan cashflow penuh dan kontrol periode masih menjadi tahap berikutnya.
- Pemeriksaan visual langsung melalui browser otomatis terhenti oleh kebijakan keamanan browser pada sesi ini; regresi komponen, typecheck, dan build tetap lulus. Walkthrough manual terang/gelap/mobile dan UAT seluruh role tetap dicatat di `UI-XDIV-002`.
- Implementasi teknis ini belum merupakan penerimaan bisnis atau kesiapan produksi.
