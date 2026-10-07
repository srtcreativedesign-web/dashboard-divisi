# Spesifikasi kebutuhan Divisi Project

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Senior Product Designer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Sumber dan batas kepastian

Pengguna telah memastikan Project berada dalam MVP. Tujuh kelompok fitur berikut berasal dari Documents/Project/PRD_DIVISI_PROJECT.md dan struktur kode; belum merupakan rincian operasional yang dikonfirmasi pada percakapan. Penanggung jawab, jenis proyek, kontrak, alur persetujuan dan termin harus direview.

### PRJ-01 — Daftar dan detail proyek

Data: nama, klien, divisi PROJECT, nilai kontrak, penanggung jawab, status dan tanggal. Status aktual: planning, in_progress, on_hold, completed. AC usulan: pencarian/filter berfungsi, detail konsisten, tanggal akhir tidak lebih awal dan nilai kontrak tervalidasi. Kode sudah menyediakan daftar/detail; pemilik/PIC dan approval masih perlu kajian.

### PRJ-02 — Progres dan milestone

Data: tahap, bobot, status, tenggat, pelaksana dan bukti. AC usulan: total bobot aktif sesuai aturan, progres berasal dari pencapaian yang diverifikasi, revisi bobot mempunyai histori. Jangan mengklaim progress 0–100% benar bila bobot belum lengkap. Kode milestone ada; validasi bobot dan pemisahan PIC belum final.

### PRJ-03 — Termin dan progres pembayaran

Data target: arah masuk/keluar, pihak, nominal termin, jatuh tempo, bukti, transaksi Finance dan pembayaran sebagian. AC usulan: nominal dibayar berbeda dari nominal ditagih; pembatalan/koreksi terlacak. Kode payment_status boolean saat ini bukan bukti pembayaran bank dan belum memadai untuk rekonsiliasi.

### PRJ-04 — Mitra dan vendor

Data: identitas pemasok, kategori, kontak, rekening dan status. AC: akses kontak/rekening dibatasi, perubahan rekening diverifikasi, vendor yang sudah dipakai tidak dihapus tanpa dampak/histori. Kode CRUD vendor ada; scope rinci dan kontrol rekening perlu review.

### PRJ-05 — Dokumen

Data: proyek, jenis, judul, file, uploader, waktu dan versi. Unggahan baru pada disk privat dan unduh memakai endpoint berotorisasi. Batas aktual 10 MB dengan ekstensi tertentu; file lama public belum dimigrasikan. AC: pengguna tidak dapat menebak ID untuk mengunduh proyek lain; MIME, ukuran, nama dan retensi ditangani. Antivirus/versi/retensi adalah rancangan lanjutan.

Status teknis terbaru: migrasi privat/inventaris MVP dan scanner ClamAV sudah dikerjakan pada dokumen 25/29/30. Inventaris lokal tidak mempunyai berkas/record publik; retensi dan versi dokumen bisnis tetap terbuka. Catatan sebelumnya menggambarkan baseline awal.

Validasi induk RAB, tanggal efektif, filter/pagination dan form vendor tambah/edit serta pembatasan kontak selesai teknis pada [dokumen 35](35_INTEGRITAS_PROJECT_DAN_VENDOR.md). Aturan progres/termin/revisi budget dan penerimaan tetap terpisah.

### PRJ-06 — RAB

Data: item, kategori, volume, satuan, harga, subtotal, revisi dan persetujuan. AC usulan: decimal yang sesuai satuan, total dari baris yang valid, revisi budget terkunci setelah approval. Kode RAB dasar ada; amandemen dan perbandingan realisasi harus disambungkan ke sumber biaya yang disepakati.

### PRJ-07 — Time plan

Data: tahap, mulai/selesai, dependensi, tenggat, PIC dan status. AC usulan: timeline mengikuti jadwal sumber dan definisi terlambat yang disepakati; tidak menampilkan tanggal/progres fiktif. Penggunaan Gantt dan dependency scheduling belum dianggap kebutuhan yang sudah dikonfirmasi.

## Role dan keputusan

Kode sekarang memberi Manager/Admin akses kelola; role lain membaca. Usulan memisahkan input administrasi, progres lapangan, review anggaran dan validasi pembayaran harus mendapat keputusan. Hubungan Staff Accounting pusat dengan Project lewat service/API/data serah terima; bukan akses bebas tabel Project dari Accounting.

## Contoh UAT minimum

Buat proyek valid → simpan RAB → ubah milestone → unggah/unduh dokumen → buka detail sebagai pembaca → coba ID proyek/berkas yang tidak diizinkan. Pengujian pembayaran final harus menunggu definisi Finance dan bukti aktual.
