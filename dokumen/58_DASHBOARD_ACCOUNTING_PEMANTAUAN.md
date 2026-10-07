# Dashboard Accounting berbasis pemantauan

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

## Keputusan sebelum implementasi

Pengguna meminta dashboard menggabungkan kondisi keuangan, pekerjaan/antrean persetujuan dan tren. Dashboard sebelumnya dominan pintasan/panduan. Tahap ini mengubah /accounting menjadi ringkasan periode, KPI operasional nyata, antrean sesuai capability, status voucher, jatuh tempo dan tren omzet tervalidasi lintas divisi. Penerimaan/beban/saldo cashflow tetap terpisah dari omzet serta realisasi voucher; sisa voucher bukan hutang jurnal atau saldo bank.

Tambah endpoint read-only /accounting/dashboard/operations?month=YYYY-MM: agregasi seluruh voucher ACC dalam bulan (bukan hanya halaman pertama), total approved/realisasi aktif/sisa dengan integer sen, count status dan lima voucher sisa tertua menurut jatuh tempo. Tidak mengembalikan rekening, penerima, file, password atau raw metadata. Scope ACC dan view:acc_detail ditegakkan di middleware dan service. Role ringkasan tanpa detail tetap memakai cashflow/summary, tidak memanggil operasi/tren detail. Tidak menambah izin.

Tren memakai endpoint omzet tahunan existing: hanya validated, bulan kosong null dan tidak diberi angka fiktif. Month selector mengatur periode operasi/tren dan cashflow bila periode tersedia. Bulan tanpa periode jurnal tetap dapat menampilkan voucher; cashflow diberi keadaan belum tersedia. Pintasan status mengirim month/status ke halaman sumber, dan halaman sumber menerima filter valid tersebut. Perbandingan bulan hanya bila kedua bulan memiliki data. Dashboard tidak mengubah data/approval/transaksi atau menanam seed tambahan.

## TODO

- [x] Kontrak agregasi dan tes scope/presisi/status/void/filter.
- [x] Layout KPI, antrean role, tren dan voucher jatuh tempo dengan empty/loading/error/retry.
- [x] Drill-down bulan/status benar, tema/responsif/keyboard.
- [x] Tes relevan, browser native data terisi, dokumentasi dan commit/push REQ tanpa PR.

UAT bisnis, seluruh ERP siap produksi, pentest/load, mapping jurnal dan baseline lint global tetap terbuka. Tidak menyamakan grafik dengan PNL atau laba.

## Hasil teknis

Dashboard /accounting kini memiliki pemilih bulan, KPI omzet tervalidasi/pengeluaran disetujui/sisa voucher/antrean role, tren 12 bulan interaktif, prioritas pekerjaan, cashflow periode jurnal, distribusi status voucher dan hingga lima voucher belum lunas urut jatuh tempo. Draf dan koreksi Admin menjadi antrean terpisah agar angka sesuai filter tujuan; Accounting memeriksa submitted, Manager pending_approval, Finance sisa approved. Role ringkasan tidak meminta endpoint operasi atau tren detail. Modul harian tetap tersedia sebagai pintasan ringkas.

GET /api/v1/accounting/dashboard/operations adalah read-only; aggregate menghitung semua baris bulan, bukan page pertama. Realisasi aktif menggunakan amount_cents, void diabaikan, total diperiksa terhadap integer overflow. Query payment sum berada dalam query voucher, tanpa query tambahan per voucher kosong. Lima baris jatuh tempo hanya menyertakan id, source_reference, outlet_name, source_division_code, due_date, remaining_amount. Rekening, penerima, bukti dan event privat tidak disertakan. Tidak mengubah policy, migrasi atau seed native.

Drill-down mengirim month/status; halaman omzet/voucher menerima hanya bulan/status valid. Link jadwal realisasi juga membawa UUID voucher untuk membuka detail; backend tetap memeriksa capability dan parent scope. Filter URL bukan izin mutasi. Cashflow tanpa periode tidak menjadi saldo nol. Grafik bulanan kosong tetap null, nominal rupiah tetap string; perbandingan menggunakan BigInt sen dan hanya muncul jika dua bulan tahun yang sama memiliki data. Nilai omzet nol tidak diberi batang positif.

Bukti: full suite 159 frontend dan 279 backend/2378 assertions lulus; delapan tes dashboard final kembali lulus setelah perapihan. Typecheck, build, lint file berubah, Pint API berubah dan policy:check lulus. Build masih memberi peringatan ukuran bundle Project dan annotation dependensi; baseline lint global development 105 error tetap terbuka, bukan ditutup melalui lint scoped.

53 pemeriksaan API native lulus, laporan C:/ERP/accounting-dashboard-native-20261007.json. Delapan akun UAT diverifikasi role/domain, lima pembaca detail menerima summary dan tiga akun tanpa izin ditolak; anonim 401, bulan invalid 400, bulan kosong count 0, proyeksi allowlist, semua sesi probe ditutup. Tidak menampilkan credential/token dalam laporan.

UI Admin dark/light dan mobile 390x844 diperiksa melalui computer-use. Viewport efektif lebar 380 karena scrollbar; document scrollWidth=clientWidth=380, tidak ada overflow halaman. Drill-down Perbaiki voucher menampilkan satu voucher correction bulan Oktober; link jadwal realisasi membuka tepat voucher sebagian beserta sisa Rp260.000,00. Akun tidak diganti, tema gelap awal dan viewport default dipulihkan; browser ditinggalkan pada dashboard. Screenshot C:/ERP/accounting-dashboard-dark-20261007.png, accounting-dashboard-light-20261007.png, accounting-dashboard-mobile-20261007.png.

Data native dari seed sebelumnya: delapan voucher, empat approved Rp2.020.001,00, realisasi aktif Rp1.350.000,75, sisa Rp670.000,25, tiga belum lunas dan dua pekerjaan Admin. Belum ada omzet tervalidasi/periode jurnal native, sehingga grafik dan cashflow menunjukkan keadaan belum tersedia; tidak ditanam transaksi untuk membuat grafik terlihat terisi. Skenario tren terisi/nominal Rp0,01/filter bulan dan akses Finance diverifikasi pada tes UI. Pengguna tetap perlu melakukan UAT bisnis semua role/data perusahaan.

Selesai teknis ACC-DASH-002. Scope tahap ini dashboard Accounting; antrean HR/setoran, saldo bank/integrasi, PNL/HPP/bonus/CMO dan dashboard perusahaan lintas semua modul belum diklaim selesai. Tidak menganggap sisa voucher sebagai hutang jurnal atau cashflow sebagai laba. Commit/push REQ tanpa PR.
