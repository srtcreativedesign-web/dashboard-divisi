# 102 — Konteks Workflow Register Jurnal

Tanggal: 15 Oktober 2026
Status: selesai teknis, menunggu UAT pengguna bisnis

## Masalah

Register Jurnal sebelumnya menampilkan nominal, saldo, dan bukti, tetapi tidak menjelaskan status dokumen, aktivitas terakhir, atau pihak yang harus bertindak. Pengguna harus memahami state periode secara manual sebelum menentukan langkah berikutnya.

## Alur yang diterapkan

- Periode `draft`, `reopened`, atau koreksi aktif diarahkan kepada **Admin Accounting** untuk melengkapi jurnal dan bukti.
- Periode `pending_approval` atau `approved` diarahkan kepada **Manager Accounting** untuk keputusan atau penutupan periode.
- Jurnal yang dibatalkan atau berada dalam periode `closed` ditandai **Selesai**.
- Status entri dibedakan sebagai **Draf**, **Siap diajukan**, atau **Dibatalkan**.
- Aktivitas terakhir membedakan pembuatan, perubahan, penambahan bukti, dan pembatalan.

## Kontrak keamanan

Proyeksi workflow hanya memuat `next_role`, `last_action`, `last_transition_at`, dan `reason`. ID aktor, alamat email, trace ID, serta payload perubahan histori tidak disalin ke proyeksi register. Alasan hanya berasal dari pembatalan jurnal.

## Kinerja dan audit

Histori terakhir seluruh jurnal pada satu halaman dibaca dalam satu query batch. Unggahan lampiran kini dicatat sebagai aktivitas milik transaksi sehingga aktivitas terakhir tetap akurat tanpa membuka informasi lampiran pada proyeksi workflow.

## Tampilan

Tabel desktop dan kartu mobile menggunakan bahasa visual yang sama dengan kerangka Divisi Project. Setiap entri memperlihatkan status, aktivitas terakhir, waktu WIB, PIC, dan alasan bila ada.

## Validasi

- Tes backend mencakup pembuatan, perubahan, pergantian PIC ketika periode diajukan, pembatalan, dan kontrak proyeksi aman.
- Tes presentasi mencakup status, aktivitas, waktu WIB, dan PIC pada desktop serta mobile.
- Pint, PHPUnit, Vitest, typecheck, lint, build produksi, dan policy check dijalankan sebelum commit.

## Batas scope

Perubahan ini hanya menyentuh workflow Jurnal Accounting. Divisi Project tidak diubah. Penyelarasan HR, persediaan, staging impor, serta UAT visual pengguna tetap terbuka.
