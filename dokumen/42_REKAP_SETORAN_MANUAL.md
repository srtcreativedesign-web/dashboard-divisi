# Rekap setoran manual — ACC-A10 / TODO-10b

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Application Security Engineer, Senior Fullstack Programmer.

## Tujuan dan batas
Admin mencatat setoran terhadap satu omzet tervalidasi dan satu kanal pembayaran (cash/qris/edc/transfer/other). Outlet, tanggal bisnis, dan shift berasal dari omzet; tidak diketik ulang. Setoran bukan omzet, penerimaan bank, laba, atau jurnal. Tujuan rekening/lokasi ditulis sesuai sumber, tanpa meminta kredensial bank. Bukti tahap ini berupa referensi dokumen eksternal, bukan unggahan berkas. Integrasi bank, fee settlement, deposit gabungan beberapa omzet, alokasi lintas kanal, jurnal otomatis dan unggahan bukti tetap pekerjaan lanjutan.

## Aturan operasional tahap manual
- Admin ACC membuat setoran positif dengan tanggal setoran, kanal, tujuan, referensi sumber dan referensi bukti. Hanya omzet berstatus validated dapat dipilih. Setoran tidak mendahului tanggal bisnis atau berada di masa depan WIB.
- Jumlah setoran aktif untuk satu omzet/kanal tidak boleh melampaui nominal pembayaran kanal tersebut. Pemecahan setoran diperbolehkan dengan referensi sumber berbeda. Referensi sumber dinormalisasi trim/huruf besar dan unik seluruh modul, termasuk setelah batal.
- Finance ACC mencatat penerimaan aktual positif, tanggal dan referensi bukti. Referensi penerimaan unik seluruh modul, termasuk setelah pembatalan. Aktor berbeda dari pembuat setoran. Tanggal tidak mendahului setoran atau berada di masa depan WIB.
- Penerimaan bertahap diperbolehkan sampai nominal setoran. Sisa belum diterima ditampilkan; tidak otomatis dinyatakan rugi. Penerimaan di atas setoran ditolak dan harus ditelusuri di luar tahap ini.
- Admin hanya membatalkan setoran miliknya yang belum pernah menerima dana. Manager ACC dapat membatalkan setoran tanpa penerimaan. Alasan wajib minimal 10 karakter. Koreksi setoran dilakukan batal lalu buat ulang dengan referensi sumber baru.
- Finance dapat membatalkan catatan penerimaannya sendiri; Manager ACC dapat membatalkan catatan penerimaan dengan alasan. Pembatalan hanya koreksi pencatatan, bukan pengembalian dana. Dana yang masih diterima tetap mencegah pembatalan setoran; setoran yang pernah mempunyai penerimaan tetap tidak dapat dibatalkan.
- Manager/Admin/Accounting/Finance ACC dapat membaca detail. Role lain dan lintas divisi/BOD tidak mendapat akses modul baru. Pilihan hak akses ini konservatif untuk tahap manual, dapat disempurnakan sesuai UAT.
- Version wajib pada perubahan, row lock omzet sebelum setoran menserialisasi alokasi; lock setoran menserialisasi penerimaan/pembatalan. Semua perubahan, bukti referensi, aktor dan alasan tersimpan dalam histori append-only, audit wajib transaksional. Uang disimpan integer sen, API string dua desimal; maksimum per catatan Rp999.999.999.999,99.

## Antarmuka dan penerimaan
Halaman /accounting/setoran: filter bulan tanggal setoran, daftar 50/baris halaman, formulir Admin, pilihan omzet tervalidasi berhalaman, detail sisa/penerimaan/histori, formulir Finance serta pembatalan dengan alasan. Data kosong ditampilkan apa adanya. Input dipertahankan ketika gagal. Tidak ada transaksi contoh pada PostgreSQL operasional.

Kriteria: referensi dan alokasi ganda ditolak; nominal tepat; partial receipt dan pembatalan receipt memperbarui sisa; version usang ditolak; actor/scope/role ditegakkan backend; audit gagal me-rollback; rekening dan bukti tidak bocor ke role lain. Tes otomatis bukan UAT pengguna. Bukti verifikasi ditambahkan setelah implementasi.

## Hasil verifikasi teknis

- 258 backend lulus (2035 assertions); delapan tes setoran (103 assertions). 100 web dan dua contracts lulus; tiga tes UI setoran. Lint/typecheck/build/Pint dan diff whitespace lulus. Build tetap mempunyai peringatan ukuran chunk Cashflow yang sudah ada.
- Native PostgreSQL: 64 tabel, 38 migrasi, 117 route API. Migrasi additive, runtime tetap terbatas; 38 pemeriksaan privilege lulus, termasuk larangan UPDATE/DELETE acc_deposit_events.
- Smoke API melalui proxy localhost:5173, 25 akun/100 pemeriksaan, bukti C:/ERP/deposits-native-smoke-2026-10-06.json. Tiga tabel setoran kosong. Enam probe CHECK pada tabel TEMP lulus, C:/ERP/deposits-native-constraints-2026-10-06.json. Tidak mengklaim uji concurrency native atau UAT visual.
- Dua suite backend sempat dijalankan bersamaan dan satu tes scanner bentrok pada folder probe bersama. Pengulangan tunggal lulus 258/258; tidak melonggarkan scanner. Backup saat smoke menulis audit ditolak SOURCE_CHANGED_RETRY_WHEN_QUIET; setelah smoke selesai backup berhasil.
- Backup AES-256-GCM 64 tabel/empat berkas: C:/ERP/backups/dashboard-divisi/2026-10-06T08-02-20-583Z-c2f20976.erpbackup, SHA256 bad000c03ae3e424494b54d3ca0f4db71facde08dad8cd392c41f9a6188eb2b7. Kunci tidak ikut bundle. Hasil restore terisolasi dicatat setelah pemeriksaan selesai.

## Mencoba alur

1. Admin ACC buka Rekap Omzet, catat dan ajukan sumber; Staff Accounting memvalidasi sumber dengan kanal seimbang sesuai bukti. Setoran hanya menerima sumber validated.
2. Admin ACC buka Rekap Setoran, pilih bulan sumber/outlet/shift dan kanal, isi tanggal/nominal/tujuan/referensi/bukti lalu simpan.
3. Finance ACC buka detail dan catat penerimaan aktual sesuai bukti. Coba penerimaan sebagian lalu sisanya; cek saldo sisa dan histori.
4. Uji referensi ulang, kelebihan nominal, versi usang dan pembatalan; pastikan ditolak atau tercatat sesuai aturan. Jangan menandai penerimaan hanya berdasarkan deklarasi Admin.
5. Manager/Accounting ACC dapat membaca; pembatalan catatan oleh Manager memerlukan alasan. Role lain tidak melihat menu atau detail.

## Backlog eksplisit

Unggah/download bukti privat dengan scanner; setoran gabungan beberapa omzet dan alokasi bank; transaksi bank eksternal/fee settlement; tanggal/waktu dan aturan cut-off lebih rinci jika diperlukan; koreksi setoran setelah receipt melalui workflow khusus; ledger/jurnal integrasi; ekspor; retensi/PIC dan UAT pengguna. Seluruhnya belum dianggap selesai oleh tes teknis.

Restore terisolasi dashboard_divisi_mvp_restore_c4390ebd lulus: 64 tabel, empat berkas, baris/skema/index/sequence cocok. Database uji restore dibersihkan; operasional tidak ditimpa. Setelah suite penuh, saldo sisa setoran batal diperbaiki menjadi 0.00 agar tidak dianggap masih harus diterima; nominal asli dan histori dipertahankan. Delapan tes domain diulang dan lulus (104 assertions). Verifikasi UI menggunakan tes otomatis; pemeriksaan visual browser dan UAT pengguna belum dilakukan.
