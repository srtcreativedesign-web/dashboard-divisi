# PRD ERP — tujuan dan batas MVP

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Masalah dan tujuan

Perusahaan membutuhkan satu ERP untuk koordinasi data operasional, pemeriksaan keuangan dan pengelolaan proyek. UI dashboard yang sudah ada menjadi dasar tampilan, sedangkan logika dan fitur dapat dirombak. Hasil yang dituju: data dapat ditelusuri ke sumbernya, pekerjaan lintas divisi terkoordinasi, dan persetujuan tidak bergantung pada pengiriman berkas tanpa status.

## Kebutuhan yang dikonfirmasi pengguna

- Project final berada di C:/Projects/dashboard-divisi.
- MVP terdiri dari Accounting, Project dan Cellular. Modul lain boleh dikeluarkan dari aplikasi; data historis tidak otomatis boleh dihapus.
- Accounting adalah tim pusat lintas divisi.
- Delapan role ada pada setiap divisi: Manager, Head Operasional, SPV, Leader, Admin, Admin Gudang, Staff Accounting dan Staff Finance.
- Rekap omzet H+1 mempunyai batas akhir 23.59 WIB.
- PostgreSQL berjalan tanpa Docker dan dipantau menggunakan DBeaver.
- Pengguna telah mengizinkan implementasi serta akun uji, kemudian meminta spesifikasi disusun dahulu sebelum pengembangan berikutnya.

Daftar pekerjaan Admin dan Staff Accounting seluruhnya dimasukkan pada [spesifikasi Accounting](04_SPESIFIKASI_ACCOUNTING.md). Daftar tersebut adalah kebutuhan bisnis; tidak seluruhnya telah dibangun.

## Pengguna dan nilai produk

Admin membutuhkan formulir dan daftar pekerjaan yang jelas. Staff Accounting membutuhkan sumber, selisih, koreksi dan laporan yang bisa dipertanggungjawabkan. Manager membutuhkan antrean keputusan dan alasan tindakan. Operasional/gudang membutuhkan akses sesuai tanggung jawabnya. Staff Finance membutuhkan sumber pembayaran dan setoran. BOD dalam kode sekarang merupakan pembaca lintas modul; aturan akhir BOD perlu review.

## Batas rilis yang diusulkan, belum disetujui

- Rilis dasar: identitas/scope, master, omzet manual H+1, voucher, jurnal/cashflow/hutang-piutang yang sudah ada, direktori/proyek/RAB/dokumen, dan direktori outlet Cellular.
- Rilis lanjutan Accounting: absensi/cuti, bonus, persediaan/setoran, PNL final, komparasi tenant, kontrak, surat, Ecsys dan pelaporan pajak.
- Rilis lanjutan Project: progres berbobot, pengendalian revisi RAB, termin yang terhubung Finance, dan monitoring jadwal.
- Cellular: kedalaman penjualan, produk, gudang, IMEI/serial, pulsa/voucher dan POS hanya dipilih setelah proses bisnis dijelaskan; tidak boleh diasumsikan semuanya relevan.

Ini usulan urutan, bukan keputusan untuk menolak kebutuhan pengguna. Cakupan rilis setiap modul harus disepakati melalui [register keputusan](17_KEPUTUSAN_RISIKO_PERTANYAAN.md).

## Ukuran keberhasilan yang diusulkan

- Rasio rekap outlet/shift yang diajukan tepat H+1, dengan denominator outlet dan jadwal shift yang memang wajib melapor.
- Waktu median pengajuan sampai pemeriksaan/persetujuan; target jam/hari belum ditetapkan.
- Persentase transaksi tervalidasi yang memiliki referensi sumber dan histori aktor.
- Tidak ada pembacaan atau perubahan lintas scope yang tidak diizinkan pada UAT keamanan.
- Project dan Cellular: kelengkapan master/status aktual, bukan jumlah data dummy.

Baseline dan target numerik menunggu data nyata. Angka placeholder tidak boleh tampil sebagai statistik perusahaan.

## Kriteria penerimaan produk

Pengguna berhasil login sesuai role; scope ditolak server bila dipalsukan; formulir memiliki validasi dan jalur koreksi; laporan hanya menghitung sumber yang memenuhi aturan; audit dapat menghubungkan sumber, versi dan keputusan. Kelulusan produk memerlukan UAT per modul dan penyelesaian blocker, bukan hanya build yang berhasil.

## Di luar komitmen saat ini

Tidak ada komitmen produksi, aplikasi mobile, koneksi bank otomatis, pengiriman pajak otomatis, integrasi POS/Ecsys/Sobat otomatis, migrasi database lama atau penghapusan data lama. Kebutuhan tersebut dicatat sebagai kandidat, bukan fitur yang sudah berjalan.
