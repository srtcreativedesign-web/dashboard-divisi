# Penggabungan development ke REQ — 8 Oktober 2026

Sumber: origin/development 7a5ff98. Titik awal REQ: b07581b.

Backup: branch backup/req-before-development-20261008 dan bundle C:/ERP/backup-REQ-before-development-20261008.bundle (sudah diverifikasi).

Pembaruan: petty cash Project, expense/invoice API, PDF invoice, klasifikasi new/maintenance, LPJ, laporan dan navigasi Project.

Empat konflik Project diselesaikan dengan mempertahankan capability role, form pembuatan lokal, pagination, pencegahan respons pencarian lama, state error/retry dan format nominal. Tampilan daftar Project menggunakan pembaruan development dengan token tema lokal. Statistik daftar menunjukkan cakupan halaman, bukan seluruh portofolio.

Kode fitur Accounting dan prototipe C:/ERP tidak diganti. Database operasional tidak dimigrasikan dalam pekerjaan pull ini. Migrasi baru Project tersedia dalam source dan perlu dijalankan sebelum memakai fitur baru pada database operasional.

Tes backend Project: 10 lulus, 50 assertions pada lingkungan testing terisolasi. Tidak membuat PR.

Validasi frontend akhir: 46 file tes, 207 tes lulus. Tes regresi pencarian dan pagination tetap lulus.
Typecheck dan build produksi lulus. Build masih memberi peringatan ukuran chunk ProjectProgressPage yang besar.
