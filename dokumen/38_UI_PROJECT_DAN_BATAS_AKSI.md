# Alur dasar Project dan batas aksi UI

Tanggal: 6 Oktober 2026. Peran: Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

Melengkapi PRJ-01 yang sudah mempunyai kontrak API: tambah proyek dengan nama, klien, nilai kontrak, status dan tanggal. Form hanya tersedia kepada Manager/Admin PROJECT sesuai manage:projects; simpan memanggil API, input dipertahankan saat error dan daftar/detail mengikuti hasil nyata. Tidak membuat workflow approval proyek baru.

RAB/milestone/dokumen/toggle administratif di detail hanya memberi aksi kepada role manage:projects. Pembaca termasuk BOD tidak melihat kontrol mutasi. Server tetap otoritatif. Milestone diberi label pekerjaan, bukan otomatis termin pembayaran. payment_status boolean hanya catatan administratif yang sudah ada; UI tidak menyatakannya sebagai bukti pelunasan. Definisi pembayaran/termin tetap memerlukan ledger/bukti Finance.

Dokumen Project diunduh melalui API berotorisasi, bukan tautan path storage. Path privat tidak dikirim pada metadata API. Pengujian memeriksa pembaca vs pengelola, simpan/error/retry dan tidak adanya tautan publik. Tidak mengubah bobot/progres, termin, metode perhitungan RAB atau hubungan vendor-proyek yang belum ditentukan.

Status awal: siap diimplementasikan; penerimaan bisnis belum dinyatakan selesai.

## Hasil implementasi

Selesai teknis untuk scope di atas. Form baru tersedia di /projects/list untuk Manager/Admin PROJECT. Dua tes form, dua tes matriks aksi dan satu tes detail pembaca lulus. Tes nominal backend memeriksa presisi dua desimal, batas database dan larangan create oleh reader; tes dokumen memeriksa tidak adanya file_path pada upload/list/detail. Payment/timeline/detail tidak lagi menyebut boolean sebagai lunas; halaman penandaan hanya memberi kontrol ubah kepada pengelola, dengan busy/error.

Suite 244 backend/93 web lulus, typecheck/lint/build/pint lulus. Setelah penyelarasan halaman penandaan, dua tes matriks aksi dan typecheck/lint/build diulang dan lulus. Workflow progres terukur, approval, tagihan/pembayaran Finance, relasi vendor dan penerimaan bisnis masih terbuka.
