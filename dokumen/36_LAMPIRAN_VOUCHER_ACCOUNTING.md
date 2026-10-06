# Spesifikasi lampiran voucher

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Application Security Engineer dan Senior Fullstack Programmer.

Scope: menuntaskan gap ACC-A06/ACC-S07 yang sudah didefinisikan pengguna: melampirkan tagihan/bukti pada voucher. Dokumen ini menjadi acuan sebelum implementasi. Tidak menambah aturan pembayaran, laba atau stok.

Admin pembuat mengunggah pada draft/correction. Staff Accounting dapat melampirkan bukti pada submitted sebelum pemeriksaan, dengan actor berbeda dari pembuat. Manager/Finance/BOD membaca sesuai hak detail; tidak menambahkan berkas pada voucher yang sudah diperiksa/disetujui. Lampiran tidak dihapus/ditimpa agar bukti pemeriksaan terjaga. Pengecualian membutuhkan alur koreksi voucher yang tersedia.

Upload maksimal 10 MB PDF, JPG/PNG, DOC/DOCX atau XLS/XLSX, dipindai ClamAV dan disimpan privat dengan nama acak. Batas teknis 20 berkas per voucher mencegah unggahan tanpa batas. Simpan metadata ID, nama tampilan, ukuran, MIME, checksum dan uploader; jangan mengirim path storage. Download memeriksa voucher/parent/capability, namespace path dan checksum. Berkas tidak dapat diakses lewat URL publik.

Upload membawa version voucher, memakai lock/transaksi, menaikkan version dan mencatat audit/histori. Versi basi, actor salah, status terkunci, scanner gagal atau audit gagal menolak operasi; salinan berkas dibersihkan saat rollback. UI memperlihatkan lampiran, upload bagi actor yang berwenang, download, error dan status proses. Tidak menghapus input/menyatakan sukses jika server menolak.

Kriteria penerimaan: upload/download actor sah; parent salah/domain asing/role terbatas ditolak; file tidak valid/deteksi malware ditolak; versi lama/status terkunci tidak mengubah berkas; audit gagal tidak meninggalkan file/record; path tidak bocor; migrasi additive PostgreSQL serta runtime terbatas diverifikasi. Pengujian mutasi memakai fixture anonim pada lingkungan terisolasi.

Status awal: siap diimplementasikan. Retensi bisnis dan bukti wajib sebelum pengajuan belum ditetapkan; tidak menjadikan lampiran wajib untuk semua voucher secara sepihak.

## Hasil implementasi

Selesai teknis pada 6 Oktober 2026. Migration additive native diterapkan; runtime tidak dapat UPDATE/DELETE metadata lampiran. VoucherAttachmentTest lima tes lulus, UI voucher tujuh tes termasuk dua lampiran lulus. Suite akhir 244 backend/93 web lulus. Metadata tidak memuat path; download memeriksa parent/checksum dan upload berkompensasi saat audit gagal. Route upload juga dipindai scanner.

Smoke PostgreSQL/API proxy: laporan annual 200/12 bulan, tahun invalid 400; PDF bersih melewati scanner lalu 404 karena voucher UUID tidak ada; EICAR ditolak 422 UPLOAD_REJECTED. Bukti C:/ERP/accounting-completion-smoke-2026-10-06.json. Upload/download voucher sah diuji fixture terisolasi, belum ada voucher bisnis native untuk UAT pengguna. Tidak mengklaim smoke 404 sebagai penerimaan upload bisnis.
