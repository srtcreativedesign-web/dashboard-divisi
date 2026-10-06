# Spesifikasi kebutuhan Divisi Accounting

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Kedudukan dan sumber

Accounting adalah tim pusat lintas divisi. Daftar berikut menyalin seluruh 10 pekerjaan Admin dan 16 pekerjaan Staff Accounting yang disampaikan pengguna, dengan ID stabil. Urutan ID dipakai untuk traceability, bukan tingkat prioritas. Data dan acceptance criteria adalah rancangan awal, bukan pengganti contoh dokumen perusahaan.

## Admin

### ACC-A01 — Rekap cuti

Sumber: kebutuhan pengguna.
Data minimum usulan: Identitas pegawai, jenis cuti, tanggal awal/akhir, hari dan referensi persetujuan.
Kriteria penerimaan: Jumlah hari cocok sumber; aturan kalender dan pihak penyetuju belum ditentukan.

### ACC-A02 — Realisasi absensi

Sumber: kebutuhan pengguna.
Data minimum usulan: Pegawai, periode, jadwal, hadir, absen, cuti, sakit dan keterlambatan.
Kriteria penerimaan: Tidak menghitung hari dua kali; sumber jadwal dan toleransi perlu disepakati.

### ACC-A03 — Rekap omzet harian H+1

Sumber: kebutuhan pengguna.
Data minimum usulan: Outlet, tanggal bisnis, shift, nominal outlet, pembayaran dan referensi.
Kriteria penerimaan: Pengajuan paling lambat akhir H+1 WIB; hasil validasi dapat ditelusuri.

### ACC-A04 — Data pendukung PNL

Sumber: kebutuhan pengguna.
Data minimum usulan: Omzet tervalidasi, beban, persediaan, absensi serta referensi periode.
Kriteria penerimaan: Sumber dan kelengkapan terlihat; tidak menyamakan setoran dengan pendapatan.

### ACC-A05 — Data pendukung bonus

Sumber: kebutuhan pengguna.
Data minimum usulan: Periode, pegawai/outlet, omzet, target dan absensi yang relevan.
Kriteria penerimaan: Formula dan eligibility belum ditetapkan; jangan menghitung bonus dengan asumsi.

### ACC-A06 — Voucher tagihan Angkasa Pura

Sumber: kebutuhan pengguna.
Data minimum usulan: Penerbit, outlet, nomor tagihan, tanggal, jatuh tempo, nominal dan dokumen.
Kriteria penerimaan: Diperiksa sebelum persetujuan; lampiran bukti privat sudah diimplementasikan dan diuji pada dokumen 36; penerimaan pengguna terpisah.

### ACC-A07 — Voucher pembelian stok menipis

Sumber: kebutuhan pengguna.
Data minimum usulan: Outlet, pemasok, referensi permintaan, barang/jumlah dan nominal.
Kriteria penerimaan: Dasar kebutuhan stok diketahui; rincian terstruktur dan penerimaan barang perlu desain.

### ACC-A08 — Rekap bonus

Sumber: kebutuhan pengguna.
Data minimum usulan: Hasil perhitungan, versi formula, penerima, periode dan persetujuan.
Kriteria penerimaan: Rekap cocok basis perhitungan; pencairan terpisah.

### ACC-A09 — Rekap persediaan barang

Sumber: kebutuhan pengguna.
Data minimum usulan: Barang, satuan, lokasi, saldo awal, masuk/keluar/opname dan selisih.
Kriteria penerimaan: Persediaan fisik dan nilai mengikuti metode yang disepakati.

### ACC-A10 — Rekap setoran

Sumber: kebutuhan pengguna.
Data minimum usulan: Outlet/shift, nominal, kanal/rekening tujuan, waktu dan bukti.
Kriteria penerimaan: Setoran dapat dicocokkan dengan pembayaran omzet tanpa duplikasi.

## Staff Accounting

### ACC-S01 — Menerima omzet dari Admin

Sumber: kebutuhan pengguna.
Data minimum usulan: Antrean rekap, sumber outlet/shift dan kelengkapan.
Kriteria penerimaan: Periksa/return/validate dengan alasan dan aktor.

### ACC-S02 — CMO

Sumber: kebutuhan pengguna.
Data minimum usulan: Definisi, contoh format, sumber dan penerima belum ditetapkan.
Kriteria penerimaan: Blokir formula/laporan CMO sampai definisi internal dikonfirmasi.

### ACC-S03 — Membuat PNL

Sumber: kebutuhan pengguna.
Data minimum usulan: Periode, pendapatan, HPP, beban, akun dan alokasi tenant.
Kriteria penerimaan: Laporan dapat direkonsiliasi ke jurnal/sumber; struktur akun perlu persetujuan.

### ACC-S04 — Laba

Sumber: kebutuhan pengguna.
Data minimum usulan: Jenis laba dan sumber laporan yang disepakati.
Kriteria penerimaan: Bedakan laba kotor, operasional dan bersih; selisih laporan AP bukan otomatis laba.

### ACC-S05 — Analisa beban

Sumber: kebutuhan pengguna.
Data minimum usulan: Beban per akun/kategori/tenant/periode dan basis alokasi.
Kriteria penerimaan: Analisa menunjukkan sumber serta perbandingan yang sebanding.

### ACC-S06 — Pelaporan pajak PB1 10%

Sumber: kebutuhan pengguna.
Data minimum usulan: Kebutuhan pengguna: laporan pajak yang disebut PB1 10%; objek/wilayah/periode belum jelas.
Kriteria penerimaan: Tarif, objek, dasar pengenaan dan format diverifikasi pihak pajak sebelum konfigurasi; tidak dianggap tarif universal.

### ACC-S07 — Melampirkan tagihan Angkasa Pura

Sumber: kebutuhan pengguna.
Data minimum usulan: File tagihan, metadata dan kaitan ke voucher/outlet/periode.
Kriteria penerimaan: Berkas privat; akses unduh terotorisasi; upload belum ada pada voucher saat ini.

### ACC-S08 — Rekap laporan Ecsys

Sumber: kebutuhan pengguna.
Data minimum usulan: File/API, kolom, tanggal bisnis, outlet dan identifier sumber.
Kriteria penerimaan: Mapping serta rekonsiliasi disepakati; impor idempotent dengan laporan error.

### ACC-S09 — Pelaporan selisih omzet AP dan outlet

Sumber: kebutuhan pengguna.
Data minimum usulan: Nilai outlet, nilai yang dilaporkan ke AP, periode, alasan dan bukti.
Kriteria penerimaan: Selisih tetap dilaporkan apa adanya; pengakuan keuntungan harus mempunyai dasar dan review.

### ACC-S10 — Tracking omzet tahunan

Sumber: kebutuhan pengguna.
Data minimum usulan: Omzet tervalidasi menurut bulan/tenant/tahun.
Kriteria penerimaan: Tahun dan basis omzet konsisten; bulan tanpa data bukan otomatis omzet nol.

### ACC-S11 — Perpanjangan kontrak outlet

Sumber: kebutuhan pengguna.
Data minimum usulan: Kontrak, outlet, masa berlaku, tenggat, dokumen dan status tindak lanjut.
Kriteria penerimaan: Riwayat versi/berkas terlacak; tidak otomatis menyatakan perpanjangan sah.

### ACC-S12 — Perpanjangan pas bandara Halim

Sumber: kebutuhan pengguna.
Data minimum usulan: Pegawai, jenis pas, masa berlaku, lampiran dan proses pengajuan.
Kriteria penerimaan: Akses data pribadi dibatasi; persetujuan penerbit pas tetap proses eksternal.

### ACC-S13 — Surat kerja sama

Sumber: kebutuhan pengguna.
Data minimum usulan: Template, pihak, perihal, nomor, tanggal, lampiran dan pihak penandatangan.
Kriteria penerimaan: Versi draf/final dibedakan; penandatanganan tidak otomatis dilakukan aplikasi.

### ACC-S14 — Komparasi penghasilan tenant bulanan/tahunan

Sumber: kebutuhan pengguna.
Data minimum usulan: Definisi penghasilan, tenant, periode dan sumber.
Kriteria penerimaan: Pendapatan/laba/setoran tidak dicampur; filter serta kelengkapan terlihat.

### ACC-S15 — Melihat hutang-piutang divisi

Sumber: kebutuhan pengguna.
Data minimum usulan: Pihak, sumber divisi/outlet, jatuh tempo, nominal asal, saldo dan pembayaran.
Kriteria penerimaan: Scope pusat eksplisit; outstanding cocok dengan histori pembayaran.

### ACC-S16 — Crosscheck voucher Admin

Sumber: kebutuhan pengguna.
Data minimum usulan: Penerima, sumber tagihan/permintaan, nominal, duplikat dan kelengkapan.
Kriteria penerimaan: Staff Accounting tidak menyetujui sebagai Manager pada voucher yang sama.

## Kedalaman kode saat ini

Omzet dan voucher mempunyai alur manual. Master/periode, jurnal, cashflow, outstanding, impor dan rekonsiliasi telah memiliki implementasi tetapi tidak membuktikan seluruh kebutuhan bisnis di atas selesai. PNL final, bonus, kontrak, pas bandara, surat, pajak dan integrasi Ecsys belum menjadi alur operasional lengkap. Beberapa tabel/capability lama tidak mempunyai halaman/API yang relevan.

## Hubungan laporan dan kontrol

Laporan harus menyertakan sumber, periode, tenant/outlet dan status data. Data tervalidasi omzet tidak otomatis menjadi jurnal. PNL memerlukan mapping akun, pengakuan pendapatan/HPP/beban dan alokasi yang ditetapkan Accounting. Pembayaran harus dibedakan dari biaya, setoran dari omzet, dan koreksi dari penghapusan bukti.

## Kebutuhan yang belum diperinci

Pekerjaan delapan role lain di Accounting belum dijelaskan sedetail Admin/Staff Accounting. Keputusan Finance, Manager, HR dan Gudang harus mengikuti [pertanyaan terbuka](17_KEPUTUSAN_RISIKO_PERTANYAAN.md), bukan hanya policy yang kebetulan sudah ada.

## Rekap HR manual — 6 Oktober 2026

ACC-A01/ACC-A02 kini memiliki master pegawai minimal, rekap manual dan histori koreksi/void. Hak view:acc_hr terpisah dari view:acc_detail, terbatas Manager/Admin/Staff Accounting ACC; Admin menulis rekap, Manager/Admin mengelola master. Tidak menghitung hak cuti/gaji/bonus atau menganggap referensi persetujuan sebagai approval ERP. AC, sumber, batas, API dan bukti pada [dokumen 41](41_REKAP_CUTI_DAN_REALISASI_ABSENSI.md). Snapshot metadata/policy telah diperbarui.

## Pembaruan ACC-A10 tahap manual — 6 Oktober 2026

Rekap setoran tersedia pada /accounting/setoran dan tujuh route /api/v1/accounting/deposits. Admin alokasi ke satu kanal omzet tervalidasi; Finance penerimaan aktual bertahap. Nominal eksak, referensi unik, version/row lock, histori dan audit wajib. Tiga tabel acc_deposits/acc_deposit_receipts/acc_deposit_events, event append-only pada runtime. Bukti berupa referensi eksternal; unggahan, settlement/fee/jurnal otomatis dan UAT tetap terbuka. [Acuan dan bukti lengkap](42_REKAP_SETORAN_MANUAL.md). Peran: keempat peran.
