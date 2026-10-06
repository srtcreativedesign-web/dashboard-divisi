# Cellular: katalog, stok jumlah dan penjualan manual

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

## Informasi pengguna

Cellular menjual kartu perdana provider seperti Telkomsel, XL dan Indosat, dengan varian harga/kuota, serta aksesori HP. Stok memakai jumlah barang; laporan saat ini manual. PNL, HPP/persediaan dan bonus belum ditetapkan; CMO belum ditentukan. Fakta tersebut menggantikan status discovery produk/sumber pada dokumen 06, tetapi tidak menetapkan metode penilaian stok.

## Alur awal

Katalog menyimpan SKU unik, nama, jenis SIM_CARD/ACCESSORY, provider dan deskripsi varian kuota. Setiap varian menjadi SKU tersendiri. Provider tidak di-hardcode menjadi tiga saja. Katalog dibuat Manager/Admin CELL. Tidak menyimpan IMEI/serial atau membuat formula kuota.

Stok jumlah per SKU/outlet berasal dari histori mutasi, dengan saldo awal 0. Manager/Admin Gudang mencatat masuk/koreksi sebagai delta jumlah dengan alasan dan referensi unik. Pengurangan tidak boleh membuat stok negatif. Ini pencatatan kuantitas, bukan HPP/nilai persediaan. Hak awal dipilih konservatif sesuai pekerjaan, masih dapat diperinci pemilik proses.

Admin CELL mencatat penjualan manual: tanggal bisnis, outlet, SKU, jumlah, harga satuan aktual dan referensi laporan unik. Harga dan nilai total dua desimal; jumlah positif. Simpan penjualan dan pengurangan stok dalam satu transaksi; stok kurang/duplikat/audit gagal membatalkan semuanya. Catatan immutable; Manager dapat membatalkan dengan alasan melalui mutasi kompensasi jumlah, bukan menghapus sumber. Pembatalan administratif tidak menyatakan refund bank.

Semua pembaca CELL melihat katalog/stok sesuai outlet. Harga/penjualan rinci dibaca Manager/Admin/Staff Accounting/Staff Finance CELL dan BOD; role operasional lain hanya melihat kuantitas. Accounting pusat tetap menerima rekap omzet melalui alur ACC; penjualan Cellular tidak otomatis diposting ke jurnal atau dianggap laporan AP/Ecsys.

## Kontrol dan batas

Scope outlet mengikuti service organisasi; outlet domain lain tidak dapat dipakai. Balances dikunci/diubah atomik, ledger append-only, sumber penjualan/stock adjustment unik, actor ditentukan server dan audit mutasi wajib. Jumlah maksimal satu juta per input adalah batas teknis; total penjualan mengikuti batas nominal rekap dua desimal. Tanggal masa depan ditolak dalam WIB. Fixture anonim, tanpa stok/penjualan contoh operasional.

UI: tab katalog, stok dan penjualan manual; form mengikuti role, loading/error/empty serta jumlah stok aktual. Metode HPP, approval pembelian, diskon/retur parsial, setoran/settlement, pajak, bonus dan sumber integrasi tidak dianggap selesai. UAT teknis menguji role/scope, duplikasi, stok tidak negatif, pembatalan sekali dan audit rollback.

Status awal: siap diimplementasikan. Hanya pencatatan operasional manual dan jumlah stok, tanpa formula keuangan yang belum ditetapkan.

## Hasil implementasi

Selesai teknis untuk pencatatan manual. UI /cellular/operasional; API products, stock, movements, sales dan sales/{id}/void. Migration native 2026_10_06_150000 diterapkan setelah backup terenkripsi 55 tabel; database kini 59 tabel/36 migrasi. PostgreSQL memiliki CHECK stok >=0, quantity positif, nominal nonnegatif/total sesuai perkalian dan status valid. Role runtime tidak dapat UPDATE/DELETE ledger mutasi. Batas tampilan dinyatakan di UI: 500 katalog/saldo, 100 mutasi/penjualan terbaru.

Lima tes backend (71 assertions) dan tiga UI lulus: 10 masuk → 3 terjual → saldo 7 → pembatalan Manager → 10, desimal .30, duplikasi, stok kurang, tanggal masa depan, scope/role, audit rollback dan alias CELLULAR. Fixture SQLite terisolasi; tidak menyatakan sebagai uji konkurensi PostgreSQL. Smoke native 11 akun/44 GET lulus termasuk penolakan empat role operasional pada penjualan rinci dan domain ACC/PROJECT. Bukti C:/ERP/cellular-native-smoke-2026-10-06.json. Semua empat tabel Cellular baru kosong setelah verifikasi; tidak menanam transaksi contoh di operasional.

Pilihan hak awal tetap tercatat sebagai desain konservatif; bukan konfirmasi baru dari pengguna. Integrasi Accounting, transfer/opname/retur parsial, setoran, approval pembelian dan margin/HPP belum diterapkan. Penjualan manual tidak otomatis mengakui pendapatan/jurnal/refund.
