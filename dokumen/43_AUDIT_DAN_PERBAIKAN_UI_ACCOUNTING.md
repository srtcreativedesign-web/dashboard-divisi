# Audit dan perbaikan UI Accounting — tahap pertama

6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Application Security Engineer, Senior Fullstack Programmer.

## Acuan sebelum perubahan
Mempertahankan bahasa visual dashboard yang ada. Prioritas: dashboard, omzet, voucher dan setoran. Audit kode dan browser localhost:5173/accounting/omzet serta /accounting/setoran dilakukan pada sesi Admin yang sudah terbuka, tanpa membuat transaksi. Project/Cellular/HR belum diaudit visual pada tahap ini; perbaikan layout bersama turut berlaku pada navigasi mereka.

## Temuan dan pekerjaan
- Menu Accounting panjang, urutan bercampur dan ikon beberapa fitur memakai ikon dashboard fallback. Kelompokkan Ringkasan, Pekerjaan harian, Laporan & pencocokan, Pengaturan; sembunyikan kelompok tanpa menu yang diizinkan, tetap gunakan capability/scope lama. Sidebar ringkas tetap mempunyai nama aksesibel.
- Dashboard hanya ringkasan cashflow. Tambah pintasan tugas sesuai capability dan keterangan singkat kapan dipakai; tanpa angka antrean fiktif atau meminta API detail untuk role ringkasan.
- Omzet/voucher memakai tanggal ISO mentah, status berupa teks polos, dan formatter Number dapat menghilangkan presisi nominal string besar. Gunakan formatter Rupiah eksak, tanggal Indonesia dan badge status konsisten, tetap mempertahankan tanggal/input/API ISO. Tampilkan langkah alur dan keterangan pemeriksaan/persetujuan; persetujuan voucher tidak dianggap pembayaran.
- Setoran menampilkan formulir panjang sebelum daftar bahkan saat sumber kosong, kanal CASH/OTHER kurang ramah, nominal tidak mempunyai pemisah, padding berlapis dan pagination tidak terlabel per bagian. Jadikan daftar sebagai tampilan utama; formulir buka melalui Buat setoran dalam panel berlabel dengan fokus/keyboard mengikuti DetailSheet. Detail setoran juga panel; saat gagal input dipertahankan. Sumber kosong mendapat arahan ke Rekap Omzet. Penerimaan aktual tetap hanya Finance; pembatalan sesuai pembuat/Manager.
- Tabel horizontal dibatasi pada kontainer; nominal tabular dan rata kanan, kolom tanggal/aksi tidak memecah kata. Uji viewport 390 dan 1280, panel formulir, menu mobile dan navigasi keyboard.

## Batas dan penerimaan
Tahap ini mengubah presentasi frontend; backend, migrasi, role/capability dan aturan nominal tidak berubah. Tidak ada data bisnis contoh dibuat di native. Pemeriksaan visual pada akun aktif bukan UAT semua role; pengujian otomatis menjaga pintasan/route/panel dan batas informasi. Tema gelap/polish HR/Project/Cellular, ekspor dan UAT pengguna tetap pekerjaan lanjutan. Bukti verifikasi dicatat setelah implementasi.

## Hasil tahap pertama

- Menu Accounting dikelompokkan dan ikon omzet/voucher/setoran/HR sesuai fitur; dashboard memakai URL utama /accounting agar item menu aktif konsisten. Alias /accounting/dashboard tetap tersedia. Filter capability/scope tidak diubah.
- Dashboard menyediakan pintasan sesuai kewenangan tanpa query data HR/setoran tambahan. Tes Finance memastikan pintasan HR tidak ditampilkan; tes Head Operasional memastikan API detail keuangan tidak diminta.
- Omzet/voucher memakai alur pekerjaan, badge status, tanggal Indonesia, uang string eksak dengan BigInt. Angka besar dan nilai negatif, nol/invalid serta tanggal tanpa pergeseran timezone diuji.
- Setoran: daftar utama, tombol Buat setoran, panel form/detail, kanal Indonesia dan formatter nominal. Saat sumber kosong tampil arahan ke omzet, tanpa formulir mati. Error tampil di panel; input dipertahankan. Cache detail langsung memakai versi hasil mutation. Validasi HTML nominal desimal diperbaiki dan checkValidity diuji.
- Suite web 103/103 lulus (28 file) setelah implementasi. Dua regresi ditambahkan sesudah suite: pintasan Finance tanpa HR, dan sumber setoran kosong; enam tes dashboard/setoran terkini lulus. Lint/typecheck/build lulus. Peringatan ukuran chunk Cashflow lama masih ada. Backend tidak diubah pada tahap UI ini; baseline backend sebelumnya 258 tes lulus.
- Inspeksi browser native sesi Admin: dashboard desktop 1280 piksel, setoran 390 piksel, omzet ukuran panel aktual 614 piksel dan voucher desktop 1280. Tidak mengklaim omzet 390: override viewport tidak diterapkan pada tab omzet saat pengukuran. Setoran dan omzet tidak mempunyai overflow horizontal halaman pada ukuran aktual tersebut. Menu mobile, panel sumber kosong, fokus kembali setelah Escape dan formulir voucher dengan dua outlet asli UAT diperiksa. Tidak menyimpan transaksi native.
- Pemeriksaan visual menggunakan keadaan kosong nyata. Nominal/data terisi/role lain memakai fixture tes web; UAT seluruh role dan visual tabel besar masih terbuka. Override sementara di-reset dan tab audit voucher tambahan ditutup.

Bukti: [dashboard desktop](lampiran/ui-accounting/dashboard-desktop.jpg), [setoran mobile](lampiran/ui-accounting/setoran-mobile.jpg), [omzet panel kecil](lampiran/ui-accounting/omzet-layout-kecil.jpg).

## Berikutnya pada jalur UI

HR, Project dan Cellular belum mendapat audit/perapihan halaman khusus. Perlu melanjutkan tampilan data terisi dan tabel panjang, pemeriksaan visual tiap role, tema gelap, serta UAT pengguna. Tidak menandai semua pekerjaan UI selesai.
