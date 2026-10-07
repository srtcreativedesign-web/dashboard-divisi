# Realisasi pembayaran voucher — ACC-PAY-001

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

## Kontrak sebelum implementasi

Tahap ini mencatat pembayaran yang sudah dilakukan di luar ERP, bukan mengirim uang. Admin ACC mengajukan, Accounting memeriksa, Manager menyetujui, Staff Finance mencatat realisasi dengan bukti wajib. Voucher dan status pembayaran dipisahkan: approved tetap status persetujuan; belum dibayar/sebagian dibayar/lunas dihitung dari catatan aktif. Tidak menambah capability: pencatatan memakai execute:payment, pembatalan catatan salah oleh Manager memakai approve:voucher.

Realisasi bisa sebagian, total aktif maksimal nominal voucher dengan integer sen. Finance harus berbeda dari pembuat/pemeriksa/pemberi persetujuan. Server memeriksa approved, versi terbaru, tanggal >= tanggal persetujuan WIB dan <= hari ini, metode CASH/BANK sesuai rencana jika sudah ditentukan. BANK wajib memiliki tujuan rekening lengkap pada voucher yang disetujui. Referensi transaksi dinormalisasi dan unik per voucher (termasuk catatan batal); bukti PDF/JPG/PNG wajib dipindai dan disimpan privat. Maksimal 100 catatan per voucher. Record tidak diedit/dihapus. Manager dapat membatalkan catatan salah dengan alasan minimal 10 karakter; histori dan file tetap tersedia. Pembatalan catatan bukan refund atau pembatalan transfer bank. Pengganti memakai referensi koreksi baru yang menjelaskan referensi asli.

Row lock voucher, versi dan unique constraint mencegah penambahan bersamaan/duplikasi. Audit wajib, event/version voucher dan file harus rollback bersama jika gagal. Download memeriksa parent, path, hash dan scope existing. Tidak membuka izin Admin divisi lain. UI detail menjadi pusat pengajuan/persetujuan/realisasi: ringkasan total/sisa, histori bukti, form Finance dan pembatalan Manager. Data pembayaran ikut pratinjau/PDF tersimpan; status catatan tidak membuktikan verifikasi bank independen.

Tidak menulis jurnal/cashflow/utang otomatis, tidak mengubah stok atau menghitung PNL. Integrasi jurnal membutuhkan mapping akun dan periode yang belum ditentukan. Tes workflow lintas role dilakukan di database in-memory; inspeksi native tidak menanam transaksi contoh. Migrasi native additive hanya setelah backup terenkripsi.

## TODO

- [x] Tes dan verifikasi alur Admin → Accounting → Manager serta penguncian.
- [x] Model/migrasi, API pencatatan/void/download dan ringkasan pembayaran.
- [x] UI Finance/Manager, pratinjau/PDF dan tes akses/konteks/nominal.
- [x] Backup/migrasi/verifikasi native, inspeksi UI, dokumentasi dan commit/push REQ tanpa PR.

UAT perusahaan, scanner native siap untuk unggahan nyata, jurnal otomatis serta lint global development tetap menjadi dependensi terpisah.

## Hasil dan bukti

Tahap ACC-PAY-001 selesai teknis. Tabel acc_voucher_payments ditambahkan secara additive; approved tetap status voucher, payment_summary terpisah. Catatan aktif dihitung memakai integer sen dan dikirim sebagai string dua desimal. Daftar voucher memperlihatkan status pembayaran/sisa; detail menyediakan panel Finance dan pembatalan Manager. Pratinjau/PDF memasukkan ringkasan pembayaran serta PDF menambahkan halaman realisasi bila ada catatan. Bukti dan catatan batal tetap tersimpan. Timestamp persetujuan API disajikan ISO UTC dan batas form dihitung WIB.

Tes workflow dan pembayaran di SQLite in-memory: status/aktor/koreksi/locked, sebagian/lunas/kelebihan, referensi terduplikasi/versi lama, peran/divisi, nominal besar/sen, metode/bank/tanggal WIB, missing proof, scanner gagal, parent/hash download dan rollback audit/file. Tes UI: Finance mengirim desimal/versi/bukti, pending terkunci, input tetap ketika error, role pembaca tanpa form, draft/lunas tanpa form, bank belum lengkap, pembatalan Manager dan unduh bukti. PDF nyata diuji untuk summary/status/catatan batal.

Verifikasi frontend: seluruh 154 tes/36 file lulus; sesudah label draft/approved diperbaiki, 4 tes panel kembali lulus. Typecheck/build, lint semua file frontend berubah dan policy:check lulus. Backend final: seluruh 277 tes/2337 assertions lulus. Pint semua file PHP berubah lulus. Lint global 105 error hasil integrasi development dan UAT perusahaan tetap terbuka.

Backup terenkripsi sebelum migrasi: C:/ERP/backups/dashboard-divisi/2026-10-07T04-59-28-143Z-450bf8bc.erpbackup (64 tabel sebelum migrasi, 4 file termasuk konfigurasi privat, kunci tidak disertakan). Migrasi hanya dashboard_divisi_mvp dan 38 pemeriksaan database lulus, testRowsWritten=0. Inventori backup menelusuri seluruh storage/app/private sehingga bukti pembayaran termasuk cakupan backup selanjutnya. scan:status melaporkan status operasi tersimpan siap; scanner gagal tetap menolak unggahan. Tidak mengunggah bukti atau merealisasikan pembayaran nyata selama inspeksi native.

Inspeksi melalui skill computer-use: halaman voucher Admin ACC memuat daftar kosong tanpa error dan panduan empat tahap hingga Finance. Screenshot C:/ERP/voucher-payment-flow-20261007.png. Akun/tema tidak diganti. UI Finance/Manager dengan voucher terisi diverifikasi melalui tes; UAT native dengan dokumen operasional masih diperlukan. Proses preview duplikat 5174 dihentikan; aplikasi pengguna tetap pada 5173 dan API 8000.

Cara memakai: selesaikan persetujuan voucher dengan akun Admin/Accounting/Manager terpisah → masuk Staff Finance → Voucher Pengeluaran → Lihat voucher approved → isi tanggal, nominal, referensi, catatan dan bukti → Simpan realisasi. Pelunasan sebagian dapat dilanjutkan hingga sisa nol. Manager dapat membuka catatan aktif dan membatalkannya hanya jika pencatatan salah. Koreksi membutuhkan referensi baru; tidak ada penghapusan histori/refund/transfer oleh ERP.

## Dependensi berikutnya

Jurnal otomatis belum diimplementasikan: perlu mapping akun debit/kredit, aturan pengakuan/cutoff, akun sumber kas/bank, periode yang boleh diposting dan aturan pembalikan atas catatan salah. Belum menyatakan catatan pembayaran sebagai journal posted, cashflow ataupun outstanding settlement. Admin divisi lain, BAST dan tanda tangan elektronik tidak ditambahkan. Commit/push hanya REQ, tanpa PR.
