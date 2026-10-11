# Arsitektur fitur Accounting berbasis pekerjaan

Tanggal: 8 Oktober 2026  
Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Masalah

Menu Accounting sebelumnya benar secara teknis, tetapi belum mengikuti cara pengguna menyelesaikan pekerjaan. Register, jurnal, setoran, cashflow, dan sumber data terlihat sebagai halaman terpisah tanpa urutan hasil kerja yang jelas. Pengguna harus memahami struktur sistem sebelum mengetahui apa yang harus dikerjakan.

## Arsitektur informasi aktif

1. **Pekerjaan Saya** — pintu masuk role: semua dokumen, draf/koreksi Admin, antrean pemeriksaan Staff Accounting, keputusan Manager, atau realisasi Finance.
2. **Penerimaan Harian** — rekap omzet H+1, setoran outlet, serta pencocokan omzet dan setoran.
3. **Tagihan & Pembayaran** — voucher pengeluaran dan seluruh tahap Admin–Accounting–Manager–Finance pada dokumen yang sama.
4. **Pembukuan** — jurnal transaksi, hutang/piutang, periode/penutupan, dan rekonsiliasi bank.
5. **Laporan & Analisis** — kinerja omzet outlet dan cashflow berbasis data yang tersedia.
6. **Operasional Pendukung** — cuti dan absensi yang sudah memiliki alur aktif.
7. **Data & Integrasi** — sumber laporan Cellular, master akun/kategori, dan impor data transaksi.

Label menjelaskan hasil kerja. Route dan API lama dipertahankan agar deep-link, histori, dan data tidak terputus.

## Kontrak isi halaman

Setiap menu aktif harus memperlihatkan lima hal: konteks periode/cakupan, objek yang dikerjakan, status workflow, penanggung jawab tahap berikutnya, dan tindakan yang diizinkan. Daftar menggunakan filter dan status; detail memperlihatkan sumber, versi, catatan, bukti, serta histori; form membedakan simpan draf dari pengajuan.

### Pekerjaan Saya

Satu register untuk omzet dan voucher. Konteks antrean memperlihatkan jenis dokumen, periode, tahap aktif, dan penanggung jawab. Halaman role langsung membuka status yang relevan tanpa memberikan kemampuan tambahan di luar capability.

### Penerimaan Harian

Omzet bergerak dari draf Admin ke pemeriksaan, keputusan selisih bila diperlukan, validasi, setoran, penerimaan aktual, lalu pencocokan. Omzet, setoran, dan penerimaan tetap merupakan angka berbeda. Selisih Angkasa Pura tidak otomatis disebut laba.

### Tagihan & Pembayaran

Voucher menyimpan permintaan dan bukti pendukung. Pemeriksaan Accounting berbeda dari persetujuan Manager; persetujuan berbeda dari pembayaran Finance. Status realisasi sebagian/lunas tidak mengubah histori persetujuan.

### Pembukuan dan laporan

Jurnal/cashflow/rekonsiliasi memakai data aktif yang sudah tersedia. Sistem belum boleh menyatakan PNL final, laba, HPP, bonus, pajak, atau CMO sebelum formula dan sumber disepakati.

## Kewenangan

- Admin: membuat, melengkapi, mengajukan, dan memperbaiki dokumen yang dikembalikan.
- Staff Accounting: memeriksa sumber, kelengkapan, selisih, serta meneruskan atau mengembalikan dokumen.
- Manager: memberi keputusan dan alasan pada tahap persetujuan.
- Staff Finance: menangani realisasi voucher yang disetujui dan penerimaan aktual.
- Role ringkasan hanya melihat data sesuai capability; menu tersembunyi tidak menggantikan pemeriksaan izin di route/API.

## Fitur yang tetap backlog

PNL final, analisis beban lengkap, bonus, pajak PB1, kontrak outlet, pas bandara, surat kerja sama, Ecsys persisten, persediaan Accounting lintas divisi, dan CMO. Fitur tersebut tidak dipasang sebagai menu kosong. Implementasi dimulai setelah definisi, sumber, pemilik keputusan, dan acceptance criteria tersedia.

## Implementasi tahap ini

- Navigasi disusun ulang menjadi tujuh area kerja.
- Label submenu dibuat berdasarkan tindakan dan hasil pengguna.
- Halaman register/pengajuan menampilkan konteks antrean.
- Halaman omzet dan voucher memakai header lintas divisi yang sama dengan Project.
- Route, API, database, capability, dan data transaksi tidak diubah.

## Verifikasi

Empat puluh lima tes terpilih untuk navigasi, dashboard, multi-role, master, omzet, dan voucher lulus. Typecheck web dan build produksi Vite lulus. Proyek web belum menyediakan skrip lint. QA browser memastikan navigasi berbasis pekerjaan, konteks role Admin, antrean dokumen, data database, serta mode terang dan gelap dapat ditampilkan dengan benar.
