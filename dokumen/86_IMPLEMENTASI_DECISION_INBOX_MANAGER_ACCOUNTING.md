# Implementasi Decision Inbox Manager Accounting

Tanggal: 10 Oktober 2026
Branch: `REQ`
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Tujuan

Membuat halaman Manager menjadi antrean keputusan yang terfokus. Manager tidak lagi masuk ke register umum yang membuka seluruh tahapan; rute `/accounting/dokumen/persetujuan` hanya menampilkan rekap omzet atau voucher yang berstatus `pending_approval`.

## Informasi keputusan

Decision Inbox menampilkan:

- jumlah dokumen yang benar-benar menunggu keputusan;
- nominal pada halaman aktif sebagai konteks pemeriksaan;
- jumlah indikator risiko pada halaman aktif;
- outlet, tanggal, sumber, versi, penanggung jawab, dan catatan pemeriksaan;
- risiko omzet berupa selisih kanal atau selisih laporan Angkasa Pura;
- risiko voucher berupa prioritas mendesak, lewat jatuh tempo, atau metode pembayaran belum ditetapkan;
- tautan langsung ke dokumen sumber untuk menyetujui atau mengembalikan.

Tab jenis dokumen tetap memisahkan Rekap Omzet dan Voucher Pengeluaran agar Manager memahami bentuk bukti dan keputusan yang berbeda. Register umum tetap tersedia untuk histori lintas status.

## Batas kebijakan

Perusahaan belum menetapkan ambang materialitas. Sistem karena itu tidak memberi label material/tidak material berdasarkan angka buatan. Nominal dan indikator risiko ditampilkan apa adanya, sedangkan Manager tetap menilai sumber, bukti, catatan Accounting, serta kewajaran dokumen.

Aturan pengganti pejabat/delegasi juga belum ditetapkan. Sistem belum membuka kemampuan berpindah identitas atau menitipkan approval. Implementasi delegasi berikutnya memerlukan penunjuk, penerima, rentang waktu, lingkup dokumen, alasan, pencabutan, dan audit yang disahkan perusahaan.

## Keamanan dan integritas

- akses tetap dibatasi capability persetujuan dan scope ACC;
- status server tetap menjadi sumber kebenaran;
- pembuat dan pemeriksa tidak dapat menjadi penyetuju dokumen yang sama;
- versi usang ditolak;
- persetujuan dan pengembalian membutuhkan alasan sesuai aturan workflow;
- seluruh transisi tersimpan dalam event dan audit trail;
- angka risiko hanya berasal dari field transaksi yang diterima API.

## Verifikasi

- sembilan pengujian Accounting Work/Decision Inbox lulus;
- lint halaman, hook, test, dan menu lulus;
- TypeScript typecheck lulus;
- tidak ada perubahan pada Divisi Project.

## Penilaian role

Manager Accounting: **90/100**.

Quality gate dipenuhi untuk keputusan omzet dan voucher, konteks risiko, drill-down, alasan, maker-checker, versioning, serta audit. Ambang materialitas dan delegasi tidak dinyatakan selesai sebelum kebijakan perusahaan tersedia.
