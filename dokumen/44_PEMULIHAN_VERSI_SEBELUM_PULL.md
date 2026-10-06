# Pemulihan versi ERP sebelum pull

Tanggal: 6 Oktober 2026. Peran: Senior Fullstack Programmer, Senior Product Manager, Senior Product Designer, Application Security Engineer.

Pengguna meminta membatalkan penggunaan pembaruan GitHub dan melanjutkan versi ERP lokal yang sudah dibuat sebelumnya. Branch kerja tetap **REQ**, setiap paket di-commit/push dan PR menuju development.

## Sumber pemulihan

Snapshot stash `062d4e4ac48a318bc59e54bcc96b1d137c5da372` menyimpan perubahan tracked sebelum pull; parent ketiganya menyimpan 152 file baru. Keduanya dipulihkan. Ini mengembalikan fitur, UI, dokumen 00–43, pengujian, dan kontrol keamanan MVP Accounting pusat, Project serta Cellular. Whitespace pada beberapa file snapshot dirapikan tanpa perubahan perilaku.

Pemulihan disimpan sebagai commit baru pada REQ, bukan reset/force push. Commit versi setelah pull tetap ada dalam riwayat dan stash tetap disimpan. Dokumen analisis/implementasi UI versi remote 44–47 berada pada commit sebelumnya; bukan lagi acuan implementasi aktif. Acuan aktif kembali dokumen 00–43 beserta catatan pemulihan ini.

Database PostgreSQL, konfigurasi environment lokal, berkas unggahan privat, kredensial, backup dan venv tidak dihapus atau dimasukkan ke commit. Tidak menjalankan migrate:fresh, seed database perusahaan atau Docker. Konfigurasi cache Laravel/route dibersihkan dan dependensi JS diselaraskan kembali dengan lockfile snapshot.

## Hasil verifikasi

- Backend: 258 tes, 2.036 assertions lulus pada SQLite in-memory.
- Frontend: 105 tes dari 28 file lulus.
- Lint, typecheck, build dan diff whitespace lulus. Build masih mempunyai warning dependency/chunk besar; bukan kegagalan build.
- Browser /accounting menampilkan Dashboard Accounting lama, pekerjaan harian Omzet H+1, Voucher, Setoran, Cuti/Absensi, serta kondisi belum ada periode yang sesuai data.
- Frontend berjalan pada port 5173, API pada port 8000; health API melalui proxy berhasil.

Pengujian ini membuktikan pemulihan teknis, bukan seluruh UAT bisnis atau kesiapan produksi. Pekerjaan terbuka kembali mengikuti dokumen 21/40–43, bukan backlog UI remote yang dibatalkan. Perubahan berikutnya tetap memakai REQ dan harus menjaga versi MVP yang dipulihkan.
