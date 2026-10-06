# Tata kelola dokumen dan perubahan

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Senior Product Designer + Application Security Engineer + Senior Fullstack Programmer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Status dan penanggung jawab

Paket v0.1 adalah draf. Product Manager menjaga kebutuhan/prioritas; Product Designer alur/UI; Security Engineer ancaman/kontrol; Fullstack Programmer data/API/arsitektur/operasional. Pemilik proses bisnis memberikan keputusan/penerimaan; penyusun tidak menandatangani atas nama pengguna.

Status usulan Draft → Reviewed → Approved. Reviewed: komentar ditangani. Approved: keputusan eksplisit bernama/tanggal/versi/cakupan. Persetujuan satu alur tidak menyetujui seluruh paket. Izin coding sebelumnya bukan pengesahan semua formula.

## Sebelum kode berikutnya

Review PRD/role/spesifikasi dan keputusan prioritas. Sepakati backlog, contoh input/output dan AC; lengkapi UI/API/data/security/test untuk item tersebut. Bagian jelas dapat diterima terpisah; asumsi finansial belum diputuskan tidak diimplementasikan diam-diam.

## Kontrol perubahan

Catat ID/tanggal/pengusul/alasan, requirement/DEC terkait, sebelum/sesudah, dampak UI/API/data/permission, migrasi, pengujian, reviewer dan keputusan. Simpan versi Git tanpa secret. Breaking schema/API memerlukan kompatibilitas/migrasi client.

Format catatan review: versi; requirement/DEC-ID; reviewer/pemilik keputusan; tanggal; komentar; terima/revisi/tunda; cakupan/alasan; bukti dan tindak lanjut. Format ini bukan approval yang sudah terisi.

## Riwayat

6 Oktober 2026 v0.1: paket disusun dari kebutuhan dan baseline; kode aplikasi/data bisnis tidak diubah. Bukti historis dicatat dengan keterbatasan; UAT bisnis belum ditandatangani.

Jika dokumen bertentangan dengan pengguna, perbaiki dokumen. Jika kebutuhan berbeda dari kode, catat gap/backlog. Dokumen lama tetap riwayat; snapshot diperbarui saat implementasi berubah dan tidak dicampur target desain.

## Keputusan pengguna dan perubahan berikutnya

6 Oktober 2026: pengguna menetapkan paket sebagai acuan kerja dan menginstruksikan TODO serta kelanjutan implementasi. Berlaku pada kebutuhan yang sudah jelas; tidak mengisi definisi CMO/formula/format yang masih terbuka.

ACC-RPT-001: query laporan memetakan status database, membatasi ACC dan BOD, menghapus saldo placeholder serta memakai data uji eksplisit. Perubahan kontrak: balanceStart/balanceEnd nullable. Tidak ada migrasi bisnis. Bukti dan pekerjaan tersisa pada dokumen 21/22.
