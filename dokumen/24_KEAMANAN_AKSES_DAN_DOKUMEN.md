# Perbaikan keamanan akses dan dokumen

6 Oktober 2026. Peran: Application Security Engineer, Senior Fullstack Programmer, Senior Product Designer dan Senior Product Manager. Acuan BL-03, T-01/T-04/T-05 dan TODO-04. Status: selesai teknis untuk batas di bawah; belum audit keamanan penuh atau UAT bisnis.

## Sesi mengikuti identitas server

Sebelumnya JWT diverifikasi/signature-revocation, tetapi role/divisi/status akun pada endpoint operasional tetap memakai snapshot token sampai kedaluwarsa. Kini setiap protected request memerlukan sub/jti berupa string nonkosong, akun database masih aktif, dan email/role/divisi cocok snapshot. Jika berubah, AUTH_REQUIRED 401 meminta login kembali; hak lama tidak tetap berlaku. Login/logout dan cookie/Bearer tetap kompatibel. Tidak mencetak token atau mengganti password/akun operasional.

## Scope organisasi menolak akses tanpa divisi valid

Penugasan pegawai dibatasi ke division_id akun; divisi hilang/tidak ditemukan/nonaktif menghasilkan daftar kosong. BOD global tetap lintas divisi, BOD dengan scope tetap dibatasi. Exception query tidak lagi ditelan sebagai sukses kosong. Direktori outlet tidak memberikan semua outlet kepada akun non-BOD yang tidak memiliki divisi; BOD berscope tidak dapat meminta divisi lain.

## Path dokumen Project

Download/delete memverifikasi parent Project, pasangan project_id-document_id dan namespace berkas. Path harus project_documents_private/{project_id}/{nama} pada disk local, atau namespace historis project_documents/{project_id}/{nama} pada disk public. Path di luar namespace, traversal, backslash atau milik proyek lain ditolak 404; berkas dan metadata tetap utuh. Upload baru tetap private, allowlist/10MB tetap berlaku. Ini guard endpoint, bukan pemindahan file historis dari webroot.

## UI menurut role

Halaman /projects/documents: pembaca tetap mempunyai unduh; tombol unggah/hapus hanya untuk manage:projects. File picker mencantumkan tipe yang diterima server; tombol hapus berlabel aksesibilitas. Backend tetap sumber otorisasi; menyembunyikan tombol tidak menggantikan guard API. Tidak mengklaim seluruh halaman Project lain telah direview.

## Verifikasi

184/184 tes backend lulus (1290 assertions). Dua tes UI baru untuk pembaca/Admin; seluruh 69 tes web lulus. Typecheck, lint, build dan formatter scoped selesai; diff check diperiksa. Backend menggunakan SQLite in-memory/storage fake. Tidak melakukan mutasi PostgreSQL atau migrasi file/data produksi. Pengujian meliputi akun nonaktif, role/divisi/email berubah, sub/jti hilang, scope penugasan, parent document salah dan file luar namespace tidak terhapus.

## Pekerjaan keamanan yang masih terbuka

- F-01: access_token masih disimpan di localStorage; cookie autentikasi juga ada. Migrasi session/cookie harus disertai CSRF dan kontrak frontend/API; belum diterapkan pada pekerjaan ini.
- F-02: file public Project historis belum dipindahkan. Inventaris dan migrasi privat perlu hash, backup dan verifikasi tanpa menimpa sumber.
- Reset password belum membatalkan seluruh sesi lain; revocation persistence saat storage gagal dan kebijakan sesi perlu review lanjutan.
- Hak baca data pegawai/keuangan per role, delegasi, retensi dan kebijakan produksi belum diterima bisnis.
- Audit aksi dokumen, pemindaian malware dan penanganan gagal file/database perlu pengembangan terpisah.
- Role database, backup/restore, TLS serta deaktivasi akun UAT sebelum produksi tetap TODO operasional.

Tidak ada klaim risiko localStorage/CSRF/file publik telah selesai atau sistem siap produksi.

## Pembaruan setelah task ini

Status localStorage/CSRF, reset/revocation dan file publik di atas merupakan riwayat. FND-SEC-SESSION-002 menyelesaikan mitigasi teknis tersebut pada MVP; lihat [hasil terkini](25_SESI_CSRF_DAN_MIGRASI_DOKUMEN.md). Audit/retensi/hak baca rinci/malware/produksi tetap mempunyai backlog terpisah.
