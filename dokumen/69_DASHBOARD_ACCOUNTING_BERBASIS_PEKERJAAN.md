# Dashboard Accounting berbasis pekerjaan

8 Oktober 2026. Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

Masalah yang diperbaiki: dashboard berpusat pada kartu keuangan dan panduan generik; jumlah pekerjaan hanya voucher, tugas omzet tidak muncul sebagai dokumen yang dapat dikerjakan. Skor penerimaan pengguna tetap 3/10; tidak diubah menjadi nilai internal 100.

Rancangan: header periode yang konsisten, meja kerja berupa antrean per role dan tabel transaksi aktual, tindakan pada dokumen yang sama, lalu indikator ringkas, tren dan kontrol keuangan. Admin mendapat koreksi/draf omzet/voucher serta tombol pembuatan, Accounting pemeriksaan dua jenis, Manager keputusan selisih/persetujuan, Finance voucher approved dengan status pembayaran tersendiri. Reader ringkasan tidak meminta detail.

Kriteria penerimaan teknis: role/scope, nominal eksak, periode tetap pada tautan detail, pagination server, empty/error/loading jelas, keyboard, warna terang/gelap, mobile tanpa overflow halaman. Kriteria pengguna: menemukan tugas, memahami sumber/status dan mencapai detail dengan satu tindakan dari antrean. Walkthrough pengguna diperlukan sebelum skor UX dapat ditetapkan.

Tidak menampilkan laporan hilang atau SLA/umur pengajuan tanpa jadwal/timestamp yang memadai. Tanggal dokumen berbeda dari umur proses. Finance approved mencakup lunas; status lunas ditampilkan dan total tidak diberi label tunggakan. Setiap sumber keuangan tetap dijelaskan. Tidak ada auto-posting, pembayaran nyata atau perubahan policy.

Backup source terenkripsi 2026-10-08T03-31-08-227Z sebelum kode, commit 409c077; bundle/dekripsi/hash terverifikasi. Database tidak dimutasi. REQ tanpa PR.

Pekerjaan berikutnya yang belum tercakup: jadwal outlet/shift, sumber Excel persisten/duplikat, pemeriksaan berdampingan, Ecsys/settlement, ledger/PNL dan penetapan bonus/CMO. Dashboard ini tidak menyelesaikan backlog tersebut.

## Hasil verifikasi

- [x] Antrean omzet/voucher sesuai capability, tindakan detail UUID/periode, alasan/konteks sumber dan pagination server.
- [x] Antrean berisi otomatis dipilih setelah data dimuat; pilihan manual dipertahankan.
- [x] Refresh dashboard menyegarkan meja kerja; nominal tetap string desimal.
- [x] Mobile memakai susunan vertikal pada dokumen yang sama, tombol tindakan terlihat tanpa geser horizontal.
- [x] 200 tes frontend/44 berkas, typecheck, lint file berubah, build dan diff-check lulus.
- [x] QA native Staff Accounting desktop terang/gelap, mobile 390x844, antrean berisi dan jalur detail versi yang sama. Tidak melakukan mutasi transaksi. Tema/viewport dipulihkan.
- [ ] Walkthrough native seluruh role, pengujian pengguna pertama dan penilaian penerimaan pengguna.

Bukti lokal: C:/ERP/ui-proof/accounting-action-desk-light.jpg, accounting-action-desk-dark.jpg dan accounting-action-desk-mobile.jpg. Backend/database/policy tidak berubah. Build memiliki warning ukuran chunk Project existing. REQ tanpa PR.
