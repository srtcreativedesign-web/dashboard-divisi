# 103 — Konteks Workflow Cuti dan Absensi

Tanggal: 15 Oktober 2026
Status: selesai teknis, menunggu UAT pengguna bisnis

## Keputusan produk

Cuti dan absensi merupakan pekerjaan operasional Admin Accounting. Sistem saat ini menerima referensi persetujuan cuti dari proses eksternal dan belum memiliki kebijakan approver internal. Implementasi tidak menambahkan tahap persetujuan semu.

- Dokumen aktif dimiliki **Admin Accounting** untuk pencatatan atau koreksi.
- Staff Accounting dan Manager memiliki akses baca sesuai capability untuk pemantauan.
- Dokumen yang dibatalkan menjadi **Selesai**, sementara histori dan alasan tetap tersedia.

## Konteks pada register dan detail

Setiap dokumen menampilkan status, aktivitas terakhir, waktu dalam WIB, penanggung jawab, serta alasan koreksi atau pembatalan bila tersedia. Cuti dan absensi tetap menjadi tipe dokumen terpisah dengan rincian sumber masing-masing.

## Kontrak keamanan

Proyeksi workflow hanya memuat `next_role`, `last_action`, `last_transition_at`, dan `reason`. ID aktor, role aktor, snapshot sebelum, dan snapshot sesudah tidak dikirim dalam proyeksi register. Histori lengkap tetap hanya tersedia pada endpoint detail yang telah melewati scope dan capability HR Accounting.

## Kinerja

Event terakhir untuk seluruh dokumen pada satu halaman dimuat melalui satu query batch. Register tidak melakukan query event per baris.

## Validasi

- Tes backend mencakup pembuatan, koreksi beralasan, pembatalan, pergantian PIC, dan kontrak proyeksi aman.
- Tes frontend memeriksa aktivitas, waktu WIB, alasan, dan penanggung jawab pada register.
- Pint, PHPUnit, Vitest, typecheck, lint, build produksi, dan policy check dijalankan sebelum commit.

## Batas scope

Implementasi tidak menghitung payroll, bonus, saldo hak cuti, atau approval internal. Kebijakan tersebut harus ditetapkan perusahaan sebelum menjadi workflow sistem. Divisi Project tidak diubah.
