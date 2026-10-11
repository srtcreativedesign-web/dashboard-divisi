# Pencocokan omzet dan setoran

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Scope ENT-03a ditulis sebelum kode; acuan alur sumber pada dokumen 42. Bukan posting jurnal otomatis atau penetapan PNL/HPP.

## Tujuan dan perhitungan

Tim Accounting dapat melihat hubungan pembayaran outlet, alokasi setoran dan penerimaan Finance per omzet tervalidasi serta kanal cash/QRIS/EDC/transfer/lainnya.

- Pembayaran outlet: nominal kanal pada rekap omzet tervalidasi.
- Setoran tercatat: jumlah alokasi setoran berstatus recorded untuk sumber/kanal tersebut.
- Penerimaan tercatat: jumlah receipt recorded pada setoran recorded tersebut.
- Belum dialokasikan: pembayaran outlet dikurangi setoran tercatat.
- Setoran belum diterima: setoran tercatat dikurangi penerimaan tercatat.

Nominal dihitung dalam integer sen dan dikirim sebagai string desimal. Pembatalan setoran/penerimaan tidak dihitung. Tidak menyebut sisa sebagai laba/rugi, tidak menganggap pencatatan Finance sebagai rekonsiliasi bank, dan tidak menyatakan selisih AP sebagai keuntungan.

## Filter, sumber dan tampilan

Filter bulan mengikuti tanggal bisnis omzet, bukan tanggal setoran/penerimaan. Penerimaan setelah bulan omzet tetap dihitung hingga saat laporan dimuat. Laporan memakai sumber tervalidasi di ACC, termasuk outlet sumber lintas divisi sesuai alur Accounting pusat. Maksimal 50 sumber per halaman, urutan tanggal terbaru dan id; tidak menampilkan total seluruh bulan dari satu halaman.

Halaman /accounting/pencocokan-setoran memiliki filter bulan, pemuatan/error/retry/kosong dan pagination. Tiap sumber menampilkan outlet/tanggal/shift/referensi dan lima kanal. Tabel dibatasi dalam kontainer scroll pada layar kecil. Tautan ke rekap omzet/setoran tersedia untuk menindaklanjuti; tidak mengubah data dari laporan ini.

## Keamanan dan konsistensi

GET /api/v1/accounting/deposits/reconciliation memakai scope ACC dan capability view:acc_deposits yang sudah ada, diulang pada service. Role ringkasan, BOD serta domain PROJECT/CELL tidak memperoleh hak baru. Hasil memakai allowlist field tanpa rekening tujuan, referensi bukti, actor id, histori snapshot atau data HR.

Nilai keuangan dihitung dalam satu query sumber dengan subquery agregat agar alokasi dan penerimaan memakai snapshot statement yang sama; count pagination dilakukan terpisah. Tidak ada mutation, migrasi, seed atau jurnal otomatis. Uji volume/konkurensi PostgreSQL tetap ENT-06, tidak diklaim selesai oleh tes SQLite.

## Penerimaan teknis

Uji sumber draf tidak terhitung, kanal nol, alokasi/penerimaan parsial, pembatalan, penerimaan lintas bulan, desimal besar, scope/capability, filter invalid, pagination dan field sensitif. UI harus menjelaskan basis bulan dan menyediakan kondisi kosong/error tanpa data keuangan buatan. Bukti dicatat setelah implementasi.

ENT-03 lengkap masih bergantung pada COA/pengakuan pendapatan/HPP/bonus/penutupan dan pemetaan sumber ke jurnal. ENT-03a tidak menutup dependensi tersebut atau UAT bisnis.

## Hasil pemeriksaan

14 tes domain setoran (171 assertions) lulus, termasuk enam tes pencocokan baru. Empat tes UI baru menguji nominal eksak, penolakan role ringkasan tanpa request, retry/kosong serta reset pagination saat bulan berubah. Gate penuh exit 0: 264 backend (2103 assertions), 115 web (30 file), dua contracts, tiga guard policy, empat orkestrasi gate, empat guard database dan tiga scanner lulus; lint/typecheck/build/Pint lulus. Bukti artifacts/release/latest.json mencatat commit awal d9357f5 dan workingTreeDirty=true; bukan bukti CI commit akhir. Warning chunk Cashflow/anotasi Zod masih ada.

Browser Admin ACC pada native PostgreSQL memuat laporan kosong tanpa error SQL/API. Desktop aktual 1260 piksel dan ponsel 390 piksel tidak mempunyai overflow horizontal halaman pada keadaan kosong; tabel berisi belum diuji visual di browser. Bukti lokal: C:/ERP/pencocokan-setoran-desktop-20261007.jpg dan C:/ERP/pencocokan-setoran-mobile-20261007.jpg. Viewport di-reset sesudah inspeksi. Tidak menyimpan transaksi/periode native; data berisi, pagination dan perhitungan memakai fixture tes. CI remote tetap mempunyai blocker billing yang dicatat di ENT-01b.
