# Bukti Mutasi Bank Settlement Cellular

Tanggal: 14 Oktober 2026
Branch: `REQ`

## Tujuan

Tahap ini mengubah settlement Cellular dari pencatatan referensi teks menjadi dokumen penerimaan dana yang memiliki bukti privat dan dapat diperiksa Accounting. Finance tidak dapat lagi mengajukan settlement baru tanpa minimal satu bukti penerimaan dana.

## Alur kerja

1. Finance memilih sumber closing yang telah disetujui dan menyimpan settlement sebagai draf.
2. Finance mengunggah bukti PDF/JPG/PNG melalui register settlement.
3. File melewati karantina dan pemindaian malware sebelum disimpan pada storage privat.
4. Sistem menyimpan metadata, ukuran, pengunggah, hash SHA-256, dan versi dokumen tanpa membuka path storage ke frontend.
5. Finance dapat mengajukan settlement setelah minimal satu bukti tersedia.
6. Accounting mengunduh bukti melalui endpoint berizin sebelum memilih rekonsiliasi atau meminta koreksi.

## Kontrol enterprise

- Maksimal lima bukti per settlement dan ukuran maksimal 10 MB per file.
- Format dibatasi ke PDF, JPG/JPEG, dan PNG.
- Nama file pengguna dibersihkan; nama file storage menggunakan UUID.
- File yang sama pada settlement yang sama ditolak berdasarkan hash.
- Hash diverifikasi ulang saat unduh; file yang berubah atau path/symlink tidak sah menghasilkan 404.
- File tidak tersedia melalui URL publik dan respons API tidak mengirim `file_path`.
- Hanya Finance pembuat yang dapat mengunggah ketika status `draft` atau `correction`.
- Optimistic version diperiksa dan bertambah setelah unggahan.
- Scope outlet/divisi diperiksa untuk unggah, daftar, dan unduh.
- Upload dicatat pada audit trail wajib; kegagalan audit memicu kompensasi penghapusan file.
- Daftar settlement mengambil metadata lampiran melalui satu query batch untuk menghindari N+1.

## Perspektif peran

- **Senior Product Manager:** menetapkan bukti sebagai readiness wajib sebelum handoff Finance ke Accounting.
- **Senior Product Designer:** menambahkan status “Belum ada bukti”, tindakan unggah, daftar file, unduh, dan disabled-state pengajuan langsung pada register.
- **Senior Fullstack Programmer:** menambahkan tabel attachment, endpoint multipart/download, penyimpanan privat, kontrak frontend, query batch, dan pengujian.
- **Application Security Engineer:** menerapkan scanner, MIME/ukuran, UUID path, hash integritas, scope, capability, optimistic lock, audit wajib, dan perlindungan unduh.

## Database

- Migrasi additive `2026_10_14_090000_create_cel_settlement_attachments.php` diterapkan ke `dashboard_divisi_mvp` melalui migrator owner resmi.
- Runtime tetap tidak memiliki hak membuat tabel; migrator menyelaraskan kembali privilege setelah migrasi.
- Verifikasi 44 pemeriksaan role database lulus tanpa baris uji tersimpan dan tanpa menampilkan secret.
- Settlement historis tidak diubah. Dokumen lama tanpa bukti tetap tampil sebagai pengecualian; gate bukti berlaku saat pengajuan baru.

## Verifikasi

- Tes backend settlement terarah: 3 tes, 42 assertion lulus.
- Regresi backend Cellular dan scanner: 36 tes, 328 assertion lulus sebelum assertion tambahan; tes settlement diulang setelahnya dan lulus.
- Regresi UI Cellular: 9 file, 31 tes lulus.
- Tes UI settlement: 3 tes lulus.
- TypeScript typecheck, ESLint scoped, Pint, migrasi owner, verifikasi privilege, production build, policy check, dan `git diff --check` lulus.
- Divisi Project tidak diubah.

## Batas pekerjaan

- Sistem menyimpan bukti yang diunggah pengguna; integrasi otomatis dengan API bank/acquirer belum termasuk.
- Tanda tangan digital dan ekspor berita acara rekonsiliasi belum termasuk.
- Retensi/pemusnahan file produksi menunggu kebijakan perusahaan.
- Settlement historis tidak diberi file seed buatan karena bukti harus mewakili dokumen nyata.
- UAT Finance dan Accounting serta QA visual terang/gelap/mobile tetap terbuka.
