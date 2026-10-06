# Proses bisnis dan pembagian tanggung jawab

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Prinsip

R = pelaksana, A = pemegang keputusan akhir, C = dikonsultasikan, I = diberi informasi. Pembagian berikut adalah rancangan awal berdasarkan pekerjaan yang dijelaskan dan alur kode; kewenangan HR, gudang, Finance dan operasional masih perlu konfirmasi. Tidak menetapkan orang tertentu.

## Omzet H+1

Sumber outlet/shift → Admin pusat merekap → Staff Accounting memeriksa → Manager menangani selisih/izin terlambat → data tervalidasi menjadi sumber laporan yang diizinkan.

R input: Admin. R pemeriksaan: Staff Accounting. A pengecualian: Manager. C sumber/selisih: outlet terkait dan Finance sesuai bukti. I laporan: pembaca yang diizinkan. Outlet merupakan sumber data, bukan grant akses lintas modul kepada Admin.

Alur saat ini: draft → submitted → validated; bila selisih ada, submitted → pending_approval → validated/correction. Correction dapat diperbaiki dan diajukan ulang. Izin terlambat yang sekarang berlaku 24 jam/sekali pakai adalah pilihan implementasi yang perlu review pengguna; batas akhir H+1 adalah kebutuhan yang sudah dikonfirmasi.

## Voucher

Kebutuhan/tagihan outlet → Admin pembuat menyimpan draf → mengajukan → Staff Accounting memeriksa referensi/nominal → Manager menyetujui atau meminta koreksi → Finance memproses pembayaran dalam alur lanjutan yang belum terhubung.

R draf/pengajuan: Admin pembuat. R pemeriksaan: Staff Accounting. A persetujuan: Manager. R pembayaran yang diusulkan: Staff Finance. C pembelian stok: Admin Gudang dan operasional. Persetujuan tidak sama dengan pembayaran atau pengakuan hutang/jurnal.

## Tutup bulan Accounting — rancangan

Kumpulkan omzet/setoran, beban, persediaan dan hutang-piutang → rekonsiliasi → Staff Accounting menyusun laporan sementara → identifikasi kelengkapan/mismatch → koreksi → Manager menyetujui periode/laporan menurut kewenangan yang disepakati → kunci → distribusi laporan. Pembukaan kembali periode memerlukan alasan dan audit; aturan final belum diputuskan.

## Cuti dan absensi — rancangan

Sumber pegawai/jadwal dari sistem yang disepakati → Admin merekap cuti dan realisasi absensi → operasional mengonfirmasi kondisi lapangan → pemeriksaan data pendukung bonus/PNL. Sistem ini tidak otomatis menjadi pemutus cuti atau penggajian; penanggung jawab persetujuan belum ditentukan.

## Project — rancangan dari dokumen lama

Permintaan proyek → master/kontrak → rancangan RAB dan jadwal → persetujuan anggaran → pelaksanaan/milestone/dokumen → pengajuan termin → verifikasi Finance → penutupan proyek. R input administratif: Admin Project; R progres: PIC/operasional usulan; A anggaran/status: Manager Project usulan. Head Operasional/SPV/Leader belum diberi hak tulis baru dalam kode.

## Cellular — proses minimum dan discovery

Saat ini hanya daftar outlet. Alur target yang perlu dipilih: penjualan produk/jasa → penutupan shift → setoran → pusat Accounting; atau penerimaan/pengeluaran stok → opname → permintaan pembelian. Ini hipotesis, bukan proses yang dinyatakan pengguna. Admin Gudang tidak boleh dianggap otomatis berhak mengubah semua stok perusahaan.

## Serah terima lintas modul

Setiap serah terima mencantumkan identitas sumber, outlet/divisi asal, tanggal, nominal/kuantitas, referensi bukti, versi, pengirim dan status. Penerima dapat mengembalikan dengan alasan. Proses tidak boleh berhenti tanpa status yang dapat ditindaklanjuti.

## Pengecualian wajib diuji

Sumber terlambat, outlet nonaktif, data ganda, pengganti aktor, perubahan role, periode terkunci, dokumen salah, pembayaran sebagian, nilai nol/negatif, dan laporan yang belum lengkap. Delegasi/handover antar-Admin dan persetujuan eskalasi belum tersedia; perlu desain sebelum penerapan.
