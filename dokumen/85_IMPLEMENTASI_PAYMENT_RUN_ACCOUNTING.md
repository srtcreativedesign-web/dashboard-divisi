# Implementasi Payment Run Accounting

Tanggal: 10 Oktober 2026
Branch: `REQ`
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Tujuan

Mengubah antrean Finance dari daftar voucher approved biasa menjadi meja kerja realisasi yang menunjukkan urutan risiko, jatuh tempo, progres pembayaran, dan sisa kewajiban. Payment Run membantu Finance menentukan dokumen berikutnya yang harus dikerjakan tanpa menciptakan fungsi transfer dana semu.

## Ruang lingkup

Rute `/accounting/dokumen/realisasi` sekarang memuat Payment Run dengan:

- KPI total voucher disetujui, nilai terealisasi, sisa, dan jumlah lewat jatuh tempo;
- filter periode, outlet, pencarian, status belum dibayar/sebagian/lunas, serta risiko lewat jatuh tempo;
- prioritas Mendesak/Normal/Terjadwal;
- urutan baris berdasarkan lewat jatuh tempo kemudian tanggal jatuh tempo;
- nominal voucher, sisa, metode yang direncanakan, dan status realisasi;
- tautan langsung ke dokumen sumber untuk mencatat realisasi dan mengunggah bukti;
- loading, error, empty state, pagination, tema terang/gelap, dan tabel responsif.

## Sumber dan batas fungsi

Ringkasan berasal dari endpoint dashboard Accounting. Register berasal dari voucher ACC berstatus `approved` dan menggunakan `payment_summary` yang dihitung dari catatan pembayaran aktif. Payment Run tidak mengirim uang, tidak memvalidasi saldo bank, dan tidak membuat jurnal otomatis.

Realisasi tetap dilakukan melalui workflow voucher yang sudah menerapkan:

- capability `execute:payment` dan scope divisi ACC;
- pemisahan Finance dari pembuat, pemeriksa, dan penyetuju;
- pembayaran parsial dengan batas maksimum sisa voucher;
- optimistic version dan row lock;
- referensi unik serta bukti privat yang dipindai;
- audit trail dan event append-only;
- pembatalan catatan oleh Manager berbeda dengan alasan wajib.

## Verifikasi

- dua pengujian frontend Payment Run lulus;
- lint file baru, routing, dan menu lulus;
- TypeScript typecheck lulus;
- implementasi memakai API/database dan tidak menambahkan angka hardcode;
- Divisi Project tidak diubah.

## Penilaian role

Finance Accounting: **91/100**.

Quality gate dipenuhi oleh workflow realisasi end-to-end, bukti, status parsial/lunas, pengendalian jumlah, prioritas pekerjaan, dan pemisahan tugas. Rekonsiliasi saldo bank serta jurnal otomatis tetap menjadi pekerjaan setelah mapping akun dan kebijakan posting perusahaan ditetapkan.
