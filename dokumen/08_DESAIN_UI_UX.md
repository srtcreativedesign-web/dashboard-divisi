# Desain UI/UX dan alur per role

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Designer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Prinsip

Pertahankan bahasa visual dashboard yang dipilih pengguna, tetapi navigasi dan konten mengikuti pekerjaan nyata. Tidak menggunakan statistik random, aktivitas fiktif, tombol tanpa fungsi atau klaim keamanan yang tidak sesuai implementasi. Desktop dan mobile mempunyai alur yang sama, bukan semua kolom dipaksa pada layar kecil.

## Arsitektur informasi

Login → workspace menurut scope → Accounting/Project/Cellular. Menu Accounting: dashboard, omzet H+1, voucher, jurnal, cashflow, hutang-piutang, rekonsiliasi, impor, periode, master. Project: daftar/detail, milestone, RAB, vendor, dokumen dan jadwal sesuai fitur aktif. Cellular: direktori outlet saat ini. Menu baru hanya ditampilkan setelah fitur tersedia dan capability sesuai.

## Wireframe tekstual Accounting

Halaman daftar: judul/tugas utama → tindakan Buat (Admin) → filter bulan/outlet/status/jenis → indikator cakupan data → daftar → pagination. Detail sheet: nomor/sumber/status/versi → nominal dan rincian → catatan pemeriksa/Manager → tindakan yang diizinkan → riwayat. Form: sumber outlet → tanggal/shift atau jatuh tempo → referensi → nominal/rincian → simpan draf. Simpan draf tidak langsung mengajukan.

## Per role

Admin melihat input, draf dan koreksi miliknya. Staff Accounting melihat antrean pemeriksaan serta sumber pendukung. Manager melihat keputusan tertunda dan alasan. Staff Finance memerlukan antrean pembayaran pada tahap berikutnya; jangan menampilkan tombol bayar yang belum terhubung. Head Ops/SPV/Leader/Gudang hanya melihat informasi yang disetujui matriks. BOD membaca lintas modul dan tidak melihat aksi tulis.

## Keadaan interaksi wajib

Loading bermakna; empty menjelaskan data master/periode yang dibutuhkan; error menyediakan retry tanpa menghilangkan input; validasi dekat field dan ringkasan jika perlu; submitting mencegah double-click; conflict meminta muat ulang dan tidak menimpa draf diam-diam. Aksi koreksi membutuhkan alasan. Hapus/keputusan berdampak memerlukan ringkasan objek sesuai kebijakan yang disepakati; tidak menambahkan konfirmasi pada setiap input kecil tanpa kebutuhan.

## Form dan aksesibilitas

Label terhubung ke field; navigasi keyboard; fokus masuk/keluar dialog; tombol disabled punya konteks; error memakai role alert; feedback memakai status. Status tidak dibedakan dengan warna saja. Nominal menggunakan format rupiah untuk display, decimal string untuk request. Tanggal bisnis WIB ditunjukkan, alasan selisih tidak disembunyikan dalam tooltip.

## Responsif dan QA visual

Usulan viewport: mobile 360/390 px, tablet 768 px, desktop 1280/1440 px. Tabel boleh horizontal-scroll dengan kolom identitas/status/aksi tetap dapat dicapai. Form tidak menutup tombol simpan di luar area scroll. Kontras, zoom 200%, teks panjang, error dan jumlah data besar harus diperiksa. Ukuran ini target QA, bukan breakpoint framework yang sudah dikonfirmasi.

## Artefak yang tersedia dan yang belum

UI React aktual dapat ditinjau di http://127.0.0.1:5173 saat server aktif. Login Admin dan form voucher telah diperiksa; screenshot voucher tersedia pada C:/ERP/voucher-ui-preview.png. Ini bukti UI yang ada, bukan mockup kebutuhan final. Gambar aturan yang disebut pengguna pada awal percakapan belum tersedia dalam konteks yang dapat ditinjau saat penyusunan; kesesuaiannya belum dapat diklaim.

Belum ada persetujuan wireframe final seluruh fitur/role. Sesi review berikutnya memilih alur utama dan mencatat perubahan pada [governance](20_TATA_KELOLA_DOKUMEN_DAN_PERUBAHAN.md).
