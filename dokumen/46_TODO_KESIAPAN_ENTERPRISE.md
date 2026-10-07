# TODO menuju kesiapan ERP enterprise

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Branch kerja REQ; commit langsung di-push tanpa PR. Dokumen ini melengkapi TODO 21, bukan menggantikan item terbuka atau menyatakan ERP siap produksi.

## Urutan dan kriteria selesai

1. [ ] ENT-01 — Pemeriksaan teknis sebelum rilis: CI aktif pada REQ, pemeriksaan lingkungan sesuai npm/PHP, satu command menjalankan lint, tipe, tes frontend/contracts/backend, build, formatter dan tes guard database/scanner. Bukti mencatat commit dan hasil masing-masing pemeriksaan. Tidak menjalankan migrasi/seed pada database kerja.
2. [ ] ENT-02 — Matriks kewenangan bisnis final: tindakan dan field sensitif per role/divisi, pemisahan pembuat/pemeriksa/penerima/penyetuju, delegasi dan masa berlakunya. Selesai setelah disepakati pemilik proses dan diterjemahkan menjadi tes akses; kontrol konservatif sekarang tetap digunakan. Dependensi TODO-04.
3. [ ] ENT-03 — Alur Accounting lengkap dari sumber sampai laporan: omzet, voucher, setoran, rekonsiliasi dan jurnal dengan penelusuran sumber. Tentukan COA, pengakuan pendapatan, HPP/persediaan, formula bonus serta penutupan periode sebelum posting otomatis/PNL diaktifkan. Dependensi TODO-07/10 dan keputusan bisnis pengguna.
4. [ ] ENT-04 — Integrasi sumber Project/Cellular dengan Accounting: identitas sumber unik, pencegahan posting ganda, koreksi/pembatalan, histori dan rekonsiliasi. Pembayaran Project memerlukan ledger penerimaan nyata; transfer/opname/retur/pembelian Cellular mengikuti proses yang disepakati. Dependensi TODO-08/09.
5. [ ] ENT-05 — UAT semua role pada alur sah, ditolak, koreksi, konkurensi dan tutup periode. Siapkan dataset anonim terisolasi, catat hasil aktual dan sign-off pemilik proses. Tes otomatis tidak menggantikan penerimaan pengguna. Dependensi TODO-06/13.
6. [ ] ENT-06 — Uji beban dan konkurensi PostgreSQL terisolasi: sepakati jumlah pengguna/transaksi/volume data serta target respons; buktikan tidak ada stok negatif, penerimaan berlebih atau persetujuan ganda. Jangan menguji beban pada database kerja. Target kapasitas belum ditetapkan.
7. [ ] ENT-07 — Operasi produksi: tentukan host, TLS, monitoring/alert, penanggung jawab insiden, pembaruan scanner, deployment/rollback dan prosedur pemulihan. Target ketersediaan belum ditetapkan. Tidak mengekspos localhost sebagai deployment produksi.
8. [ ] ENT-08 — Pemulihan dan tata kelola: RPO/RTO, backup offsite terenkripsi, retensi, pemulihan kunci dan latihan recovery host baru. Bukti backup lokal/restore terisolasi tersedia; bukan bukti pemulihan produksi. Dependensi TODO-05-prod/04.
9. [ ] ENT-09 — Audit UX lintas modul dan penerimaan: HR, Project, Cellular, data terisi/tabel panjang, keyboard/mobile, error dan istilah tindakan. Dependensi TODO-UI-02; kosmetik tidak menjadi ukuran kesiapan enterprise.

## Kemajuan ENT-02 — matriks teknis

- [x] ENT-02a — satu sumber capability backend, JSON frontend generated, pemeriksaan sinkronisasi di gate/CI serta tes penolakan identitas tidak dikenal. [Acuan sebelum kode dan hasil](47_MATRIKS_KEWENANGAN_TEKNIS.md). Gate lokal exit 0; 258 backend/111 web/dua contracts lulus. Konfigurasi CI tersedia, blocker billing remote tetap terpisah pada ENT-01b.
- [ ] ENT-02b — matriks bisnis final, ekspor, delegasi/PIC/masa berlaku dan penerimaan pengguna. Kontrol konservatif yang ada tetap berlaku.

## Kemajuan ENT-03 — pencocokan sumber

- [x] ENT-03a — pencocokan pembayaran omzet tervalidasi, alokasi setoran dan penerimaan Finance per kanal/sumber. [Scope dan hasil](48_PENCOCOKAN_OMZET_DAN_SETORAN.md). Gate exit 0: 264 backend/115 web/dua contracts lulus; browser native kosong desktop/mobile diperiksa. Bukan jurnal otomatis atau UAT bisnis.
- [ ] ENT-03b — pemetaan COA, pengakuan pendapatan/HPP/bonus, sumber voucher/jurnal dan penutupan periode lengkap. Tidak diputuskan melalui asumsi atau angka contoh.
- [x] ENT-03a-2 — tautan pencocokan ke daftar setoran satu sumber di semua tanggal, konteks server, histori pembatalan, kembali ke daftar bulanan dan reset detail saat berganti sumber. [Scope dan hasil](49_PENELUSURAN_SETORAN_PER_SUMBER.md). Gate exit 0: 267 backend/118 web/dua contracts. Tidak menutup ENT-03b atau UAT.

## Pekerjaan pertama yang diimplementasikan

ENT-01 dipilih karena dapat dikerjakan tanpa mengarang aturan bisnis. Pemeriksaan membaca kode serta memakai database tes SQLite in-memory untuk backend. Tidak mengubah database PostgreSQL native, membuat transaksi bisnis, atau menjalankan deployment. Gate lokal hanya menghasilkan hasil teknis; keputusan bisnis, UAT, kapasitas dan operasi produksi tetap terpisah.

## Bukti pelaksanaan

Implementasi lokal ENT-01 tersedia:

- Jalankan `npm run release:check` dari root proyek. Gate menjalankan pemeriksaan secara berurutan dan berhenti saat satu langkah gagal; langkah berikutnya berstatus not_run. Hasil JSON pada artifacts/release/latest.json memuat waktu, commit, kondisi working tree dan status tiap pemeriksaan, tanpa isi env/password.
- `npm run release:test` menguji kegagalan, proses yang tidak dapat dijalankan, gate kosong serta larangan migrasi/seed/restore/deploy. Empat tes lulus.
- Pemeriksaan lingkungan menggunakan Node >=22, npm >=11, PHP >=8.3 dan Composer 2, menggantikan pemeriksaan pnpm lama. Native Node 24.7.0/npm 11.17.0/PHP 8.4.12/Composer 2.8.11 lulus.
- Workflow memasukkan REQ secara eksplisit, memasang npm 11 dan tidak lagi mengabaikan kegagalan check:env. Quality gate memakai SQLite in-memory; APP_KEY fixture CI diperbaiki dari panjang 41 byte menjadi 32 byte. Secret native tidak berubah. Job migrasi PostgreSQL tetap terisolasi di GitHub, tanpa Docker lokal.
- Pemisahan command tes web/contracts/backend mencegah pengulangan backend pada gate berikutnya. Eksekusi awal sebelum pemisahan masih menjalankan backend lewat npm workspaces dan langkah PHP tersendiri; hasil bukan pengukuran performa atau beban.
- CI run 37556062088 gagal sebelum langkah apa pun dimulai. Anotasi GitHub menyatakan akun terkunci akibat billing. Perbaikan billing berada pada akun pemilik repositori; jangan menganggap CI hijau atau mengganti bukti remote dengan hasil lokal.

Gate lokal selesai dengan exit code 0: 258 backend (2036 assertions), 108 web (28 file), dua contracts, empat tes orkestrasi, empat guard database dan tiga guard scanner; lint/typecheck/build/Pint lulus. Fixture APP_KEY 32 byte juga diterima oleh Encrypter Laravel. Build tetap memberi warning chunk Cashflow dan anotasi dependensi Zod yang sudah diketahui. Lint dan empat tes orkestrasi diulang setelah command tes dipisahkan dan lulus.

- [x] ENT-01a — implementasi gate dan pemeriksaan lokal selesai; bukti aktual pada artifacts/release/latest.json. Run ini dilakukan saat working tree berisi perubahan, dan JSON mencatat workingTreeDirty=true; bukan sertifikasi CI commit akhir.
- [ ] ENT-01b — verifikasi CI remote setelah billing GitHub pulih. Jangan menutup ENT-01 sebelum hasil remote tersedia.

UAT, matriks bisnis, integrasi, kapasitas dan operasi produksi tetap terbuka. ENT-02a selesai teknis pada pekerjaan berikutnya (dokumen 47); ENT-02b serta ENT-03–09 belum selesai atau diterima.
