# Penyelesaian teknis UI lintas modul — ENT-09a

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Scope ini dicatat sebelum implementasi pada branch REQ, tanpa PR.

## Scope dan kriteria

- Project: hasil pencarian/filter terbaru tidak boleh ditimpa respons lama; error dapat dicoba ulang; tautan detail dapat digunakan melalui keyboard. Ringkasan menjelaskan batas 50 hasil yang ditampilkan, tanpa mengklaim seluruh portofolio. Nilai kontrak memakai formatter desimal eksak yang ada. Tabel lebar bergulir di kontainernya.
- Cellular: tab/filter tidak berpindah selama penyimpanan; form tidak menerima submit ganda; pembatalan lama ditutup saat tab/periode berganti. Query mematuhi capability. Tabel lebar tetap dalam kontainer dan aksi memiliki nama yang menjelaskan sumber.
- HR: pergantian bulan menutup koreksi, pembatalan dan histori lama; filter dikunci selama penyimpanan. Histori dapat ditutup dan aksi mudah dibedakan bagi pembaca layar.

Pengujian regresi memakai fixture anonim dan respons terlambat. Pemeriksaan lint/typecheck, seluruh tes UI, build dan gate teknis diperlukan. Tidak mengubah kemampuan backend, aturan HPP/bonus/CMO, skema, seed, atau transaksi native.

## Item yang tetap membutuhkan bukti eksternal

ENT-01b billing CI, ENT-02b penerimaan matriks bisnis, ENT-03b COA/PNL/HPP/bonus, ENT-04 proses integrasi, ENT-05 UAT pengguna, ENT-06 target beban, ENT-07 host/TLS/PIC, ENT-08 offsite/RPO/RTO dan ENT-09 penerimaan UX tetap terbuka. Tes teknis tidak menggantikan keputusan atau penerimaan perusahaan.

## Temuan inspeksi dan tambahan scope sebelum perbaikan tema

Inspeksi native menemukan dark variant Tailwind mengikuti preferensi OS, sementara AppLayout memakai class dark. Project menampilkan heading putih pada latar terang. Sinkronkan variant dengan class aplikasi. Tambahkan warna gelap pada kartu/input/label HR dan Cellular, lalu periksa kedua tema. Tabel terisi dan penerimaan seluruh role tetap memerlukan UAT.

Inspeksi tema gelap berikutnya memperlihatkan shell/sidebar dan drawer masih putih saat token text-navy berubah menjadi terang. Tambahan scope: sinkronkan warna shell, drawer, badge dan tab aktif dengan tema aplikasi; verifikasi ulang terang/gelap.

## Hasil pelaksanaan

ENT-09a selesai teknis untuk scope ini. Project memiliki halaman 50 hasil, tombol sebelumnya/berikutnya, reset page saat filter berubah, penolakan respons request lama, retry error dan link detail berlabel. Nominal memakai formatter bersama berbasis desimal string/BigInt; formatter Accounting tetap kompatibel melalui re-export. Ringkasan menghitung halaman yang tampil, bukan total portofolio.

Cellular memeriksa capability sebelum query, mengunci form dan konteks selama mutasi, menolak submit berulang serta menutup pembatalan lama ketika tab/periode berganti. HR membersihkan koreksi/pembatalan/histori saat bulan berubah, mengunci periode selama simpan, menyediakan tutup histori dan memberi nama aksi per referensi. API/role backend tidak berubah. Tema dark Tailwind kini mengikuti class aplikasi; shell/drawer, HR dan Cellular mendapat warna sesuai tema serta kontrol native memakai color-scheme dark.

17 tes UI terarah lulus; gate final exit 0: 267 backend/2207 assertions, 128 web (31 file), dua contracts, empat guard gate, tiga policy, empat database dan tiga scanner. Lint/typecheck/build/Pint lulus. Warning chunk Cashflow dan anotasi Zod tetap tercatat; bukan kegagalan gate. JSON artifacts/release/latest.json mencatat HEAD sebelum commit dan workingTreeDirty=true, bukan hasil CI commit akhir.

Browser native: HR Admin ACC, daftar Project BOD dan Cellular BOD diperiksa dalam keadaan kosong yang benar. Pada 390 px, lebar halaman HR 380/Project 390/Cellular 390; tabel HR/Cellular bergulir dalam kontainer. Terang/gelap diperiksa; preferensi viewport/tema dan akun Admin ACC dikembalikan setelah pemeriksaan. Data terisi/pagination/mutasi/response race dibuktikan melalui fixture anonim terisolasi, bukan transaksi native atau UAT pengguna.

Bukti screenshot: C:/ERP/hr-mobile-20261007.png, C:/ERP/hr-dark-20261007.png, C:/ERP/project-list-mobile-20261007.png, C:/ERP/project-list-dark-20261007.png, C:/ERP/cellular-sales-mobile-20261007.png dan C:/ERP/cellular-dark-20261007.png. Tidak memigrasi/seed PostgreSQL atau melakukan deployment. REQ commit/push tanpa PR.
