# Regresi Teknis Lintas Role Accounting dan Cellular

Tanggal: 14 Oktober 2026
Branch: `REQ`

## Tujuan

Tahap ini memverifikasi bahwa penyelarasan UI, workflow, dan kewenangan Accounting–Cellular tetap bekerja bersama setelah rangkaian perubahan cashflow, periode, hutang-piutang, persediaan, serta operasional Cellular. Hasil ini adalah quality gate teknis dan tidak menggantikan UAT pengguna bisnis.

## Cakupan

### Accounting

- Navigasi dan akses menu untuk Admin, Accounting, Manager, Finance, Admin Gudang, serta role yang hanya memiliki dashboard.
- Dashboard, register pekerjaan, omzet, voucher, setoran, pencocokan, jurnal, periode, master data, staging impor, persediaan, HR, payment run, hutang-piutang, dan cashflow.
- Akses lintas divisi Finance ke Accounting tanpa membuka HR atau sumber Cellular yang tidak berhak.
- Status loading, empty state, tindakan role, version conflict, bukti, koreksi, dan pembatalan.

### Cellular

- Dashboard, pekerjaan operasional, penjualan manual, stok, dokumen gudang, closing H+1, kontrol shift, settlement, analitik, preview laporan, dan kontrol Accounting.
- Role operasional dan keuangan pada jalur submit, verifikasi, koreksi, approval, posting, serta rekonsiliasi.
- Validasi scope divisi dan data sumber pada endpoint backend.

## Temuan dan perbaikan

- Tiga tes navigasi masih mencari label lama `Keputusan Menunggu` dan `Realisasi Menunggu`, sedangkan kontrak produk telah menetapkan `Decision Inbox` serta `Payment Run`. Ekspektasi tes diselaraskan dengan istilah resmi tanpa mengubah menu produksi.
- Dua tes master data memperlakukan tab sebagai tombol biasa dan memeriksa jumlah sebelum request selesai. Tes sekarang memakai semantics `role="tab"` dan menunggu nilai final `Rekening (0)`.
- Seluruh lima kegagalan tersebut adalah test drift; tidak ditemukan kebutuhan untuk mengembalikan UI atau mengubah capability.

## Perspektif peran

- **Senior Product Manager:** memisahkan kelulusan teknis dari penerimaan bisnis dan menjaga istilah workbench tetap konsisten.
- **Senior Product Designer:** memeriksa kontrak navigasi, state loading, empty state, semantics tab, dan jalur kerja setiap role.
- **Senior Fullstack Programmer:** menjalankan regresi lintas modul, memperbaiki test drift, lalu mengulang typecheck, lint, dan build.
- **Application Security Engineer:** memverifikasi isolasi divisi, capability tindakan, akses negatif, serta pemisahan role Admin–Accounting–Manager–Finance–Gudang.

## Verifikasi

- Backend Cellular dan Accounting multi-role: 30 tes, 273 assertion lulus.
- Frontend Accounting–Cellular: 37 file, 173 tes lulus.
- Tes perbaikan terarah navigasi dan routing master: 14 tes lulus.
- TypeScript typecheck, ESLint scoped, production build, dan `git diff --check` lulus.
- Divisi Project tidak diubah.

## Batas dan tindak lanjut

- Browser automation menolak inspeksi alamat lokal `127.0.0.1` berdasarkan kebijakan URL; tidak dilakukan bypass atau otomasi alternatif.
- QA visual manual untuk desktop/mobile serta tema terang/gelap masih terbuka.
- Walkthrough dan penilaian pengguna bisnis per role tetap diperlukan untuk menutup `UI-XDIV-002`.
- Peringatan ukuran chunk production build dan peringatan ukuran chart pada JSDOM tidak menggagalkan build/test; optimasi bundle dicatat sebagai pekerjaan teknis terpisah.
- HPP, PNL, bonus, CMO, delegasi pejabat, dan threshold materialitas tetap menunggu keputusan bisnis.
