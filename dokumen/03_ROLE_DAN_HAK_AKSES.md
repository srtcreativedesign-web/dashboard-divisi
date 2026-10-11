# Role, scope, dan pemisahan tugas

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Application Security Engineer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Identitas role yang dikonfirmasi

Manager = MANAGER; Head Operasional = HEAD_OPS; SPV = SPV; Leader = LEADER; Admin = ADMIN; Admin Gudang = ADMIN_GUDANG; Staff Accounting = ACCOUNTING; Staff Finance = FINANCE. Setiap divisi memiliki delapan role. Keberadaan role tidak berarti seluruh fitur untuk role tersebut sudah tersedia.

## Scope

Penugasan akun berasal dari server; divisionCode pada payload bukan bukti kewenangan. Akun biasa berada pada satu domain ACC, PROJECT atau CELL. Accounting pusat membaca direktori outlet lintas divisi lewat service organisasi untuk rekap pusat; hal ini bukan izin untuk memodifikasi modul Project/Cellular. Akses Staff Accounting pusat terhadap data hutang-piutang lintas divisi perlu kontrak serah terima yang eksplisit.

BOD saat ini membaca lintas modul dengan division_code null. FIN legacy pada Staff Finance dinormalisasi ke ACC demi kompatibilitas; akun UAT baru Finance pusat berada di ACC. Akun legacy tidak boleh memperoleh izin tambahan secara otomatis.

## Matriks ringkas kode saat ini, bukan matriks bisnis final

### Accounting

- Manager: baca ringkasan/jurnal/master; kelola master/periode; persetujuan periode, voucher, selisih omzet dan izin terlambat. Capability approve:pnl tidak membuktikan alur PNL final sudah ada.
- Admin: input jurnal dan beberapa transaksi pendukung; buat/ajukan omzet serta voucher; baca laporan. Voucher hanya dapat diedit/diajukan oleh Admin pembuat. Handover belum dirancang.
- Staff Accounting: baca laporan/jurnal/master dan beberapa laporan khusus; pemeriksaan omzet/voucher; capability pajak, kontrak, PNL/Ecsys sebagian belum memiliki fitur aktif.
- Staff Finance: baca laporan/jurnal/master, input transaksi/hutang-piutang dan pengajuan periode. Capability execute:payment terhubung ke pencatatan realisasi voucher approved dengan bukti wajib; bukan transfer dana. Pembatalan catatan oleh Manager ACC melalui approve:voucher. Lihat dokumen 56.
- Head Operasional, SPV, Leader: baca ringkasan/laporan pada domain ACC.
- Admin Gudang: baca laporan; capability inventory terdapat dalam policy tetapi belum menjadi alur gudang end-to-end.

### Project

Manager dan Admin mempunyai view:projects serta manage:projects. Enam role lain membaca Project. Hak progres bagi Head Operasional/SPV/Leader masih usulan; kode sekarang belum memisahkan perubahan kontrak, RAB, progres, pembayaran dan dokumen menjadi capability rinci.

### Cellular

Semua delapan role saat ini membaca daftar outlet melalui view:cellular. Tidak ada hak penjualan/gudang hanya karena nama role-nya Admin atau Admin Gudang.

Daftar lengkap capability untuk 24 kombinasi domain/role berada pada [lampiran policy aktual](lampiran/03_policy_aktual.json). Capability dapat lebih luas daripada endpoint yang tersedia; periksa [inventaris API](lampiran/02_api_aktual.json).

## Rancangan akses yang perlu review

Pecah kewenangan Project menjadi kontrak/RAB/progres/dokumen/termin. Batasi detail finansial menurut kebutuhan kerja; view:acc_report yang luas saat ini perlu ditinjau untuk Head Ops/SPV/Leader/Gudang. Staff Finance mengeksekusi pembayaran berdasarkan otorisasi terpisah; perubahan rekening vendor memerlukan verifikasi. Delegasi dan pengganti pejabat harus mempunyai masa berlaku serta audit.

## Aturan pemisahan tugas

Admin tidak memeriksa atau menyetujui dokumen sendiri. Pemeriksa voucher bukan pemberi persetujuan voucher yang sama, termasuk setelah role akun berubah. BOD read-only tidak dapat menulis. Tindakan sensitif harus mengecek capability, scope, objek, status, versi dan aktor di server, bukan hanya menyembunyikan tombol.

## Kriteria penerimaan

Untuk setiap endpoint uji: tanpa login, role salah, divisi salah, objek salah, payload spoofing, aktor yang sama, versi lama, dan baca yang diizinkan. UAT harus mencakup seluruh 24 kombinasi role/divisi dan BOD. Matriks bisnis final memerlukan persetujuan pemilik proses sebelum perluasan capability.

## Penyelarasan jurnal dan impor — 6 Oktober 2026

API/service jurnal kini menegakkan view:acc_journal sesuai menu dan policy. Head Ops/SPV/Leader/Gudang ACC tidak dapat membaca detail jurnal/lampiran melalui API. Manager/Admin/Accounting/Finance ACC tetap membaca jurnal. Preview dan commit impor mengikuti submit:acc_period; UI selaras. Belum menetapkan matriks bisnis final untuk laporan/voucher/Project atau akses field. [Bukti dan batas](28_HAK_BACA_JURNAL_DAN_BATAS_OBJEK.md).

## Pembaruan teknis 6 Oktober 2026

Kontrak dan kontrol terbaru: [lampiran voucher](36_LAMPIRAN_VOUCHER_ACCOUNTING.md), [omzet tahunan](37_TRACKING_OMZET_TAHUNAN.md), [UI Project](38_UI_PROJECT_DAN_BATAS_AKSI.md), [Cellular manual](39_CELLULAR_MANUAL_DAN_STOK_JUMLAH.md). Snapshot lampiran aktual telah diperbarui: 59 tabel, 36 migrasi, 103 route API dan capability terkini. Hasil/pending pada [dokumen 40](40_HASIL_IMPLEMENTASI_DAN_PEKERJAAN_TERBUKA.md). UAT pengguna tidak diganti dengan hasil tes fixture.

## Rekap HR manual — 6 Oktober 2026

ACC-A01/ACC-A02 kini memiliki master pegawai minimal, rekap manual dan histori koreksi/void. Hak view:acc_hr terpisah dari view:acc_detail, terbatas Manager/Admin/Staff Accounting ACC; Admin menulis rekap, Manager/Admin mengelola master. Tidak menghitung hak cuti/gaji/bonus atau menganggap referensi persetujuan sebagai approval ERP. AC, sumber, batas, API dan bukti pada [dokumen 41](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Snapshot metadata/policy telah diperbarui.
