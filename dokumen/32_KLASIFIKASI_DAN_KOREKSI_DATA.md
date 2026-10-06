# Klasifikasi dan prosedur koreksi data MVP

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager dan Application Security Engineer.

## Klasifikasi awal

Kredensial, cookie/token, hash password, konfigurasi koneksi dan kunci backup adalah rahasia teknis. Tidak boleh dimasukkan ke dokumen, log bisnis, ekspor laporan, screenshot atau repository. Password UAT lokal bukan kredensial produksi.

Kontak/identitas pegawai, absensi, cuti, bonus individual, rekening pribadi dan pas bandara adalah data pribadi terbatas. Gunakan fixture anonim; modul yang belum tersedia tidak boleh diklaim sudah melindungi field yang belum diimplementasikan.

Rekening perusahaan/pemasok, omzet, biaya, voucher, hutang piutang, kontrak dan dokumen Project adalah data operasional terbatas. Akses mengikuti role, divisi, objek dan kebutuhan proses; akun DBeaver memakai hak sesuai tujuan. Dashboard agregat tetap internal perusahaan dan tidak menjadi data publik.

Audit dan histori persetujuan adalah bukti proses terbatas. Pembuat perubahan tidak memperoleh hak menghapus bukti. Runtime database tidak dapat UPDATE/DELETE audit, domain event dan histori master. Backup mewarisi klasifikasi isi database; enkripsi tidak menjadikannya dokumen publik.

## Prosedur koreksi

1. Catat jenis objek dan ID, field yang perlu dikoreksi, alasan, sumber bukti dan pemohon. Hindari menyalin seluruh data sensitif ke tiket.
2. Pemilik proses memeriksa identitas pemohon dan bukti; reviewer harus memiliki kewenangan untuk objek/divisinya.
3. Gunakan alur koreksi/version/status yang tersedia pada aplikasi. Voucher atau omzet yang telah disetujui tidak boleh diperbaiki melalui SQL langsung demi melewati workflow. Untuk modul tanpa alur koreksi, tahan perubahan hingga prosedurnya tersedia.
4. Simpan histori actor, waktu, alasan dan trace perubahan. Uji konsistensi laporan turunan. Jangan mengedit audit lama; koreksi menghasilkan catatan baru.
5. Sampaikan hasil melalui sarana internal yang ditetapkan pemilik proses, dengan data minimum. Dokumen ini tidak mengotorisasi pengiriman pesan keluar secara otomatis.

## Permintaan penghapusan dan retensi

Inventaris objek utama beserta lampiran, referensi antar modul, audit dan backup sebelum memutuskan penghapusan. Pemilik data menetapkan kebutuhan penyimpanan bisnis/kontrak, pengecualian dan batas ekspor. Bila ada kewajiban mempertahankan bukti, pisahkan keputusan koreksi, pembatasan akses dan penghapusan.

Durasi retensi data bisnis belum ditetapkan. Tidak ada job otomatis yang menghapus transaksi, audit, identitas operasional atau backup berdasarkan angka yang dibuat sendiri. Penetapan durasi membutuhkan sumber aturan dan keputusan pemilik data; dokumen ini tidak memberikan kesimpulan hukum.

Setelah aturan tersedia, spesifikasi implementasi harus mencakup dry-run, lingkup objek tepat, persetujuan proses, pemulihan, histori tindakan, dan pengujian bahwa referensi di luar lingkup tidak rusak. TTL karantina scanner 15 menit hanya mengatur salinan sementara teknis, bukan dokumen bisnis.

## Status

Klasifikasi awal dan prosedur kerja tersedia. Retensi final, pemilik bernama, hak ekspor dan mekanisme penghapusan tiap modul tetap terbuka. Tidak ada data nyata yang dihapus atau dianonimkan oleh penyusunan dokumen ini.
