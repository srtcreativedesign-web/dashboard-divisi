# Analisis Divisi Project dan UI dari main

Tanggal: 6 Oktober 2026. Penyusun: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

Baseline: `origin/main` pada `cc083212ffbfd960edd7200c18d7e2b3199f7015`. Branch analisis: `docs/project-main-analysis-2026-10-06`. Status: analisis selesai; perbaikan aplikasi di bawah belum diimplementasikan oleh PR ini.

## 1. Ruang lingkup dan acuan

Permintaan pengguna: pull main, analisis fitur dan UI Project, buat branch baru, push perubahan ke branch tersebut, buat PR ke development. Scope MVP tetap Accounting pusat lintas divisi, Project, Cellular. Delapan role tetap Manager, Head Operasional, SPV, Leader, Admin, Admin Gudang, Staff Accounting, Staff Finance. Kebutuhan operasional Project yang belum dikonfirmasi tidak dianggap keputusan perusahaan.

Sumber remote: [PRD Project](../docs/prd-divisi-project.md), halaman dan komponen `apps/web/src/pages/projects` / `apps/web/src/components/projects`, `apps/web/src/api/projects.ts`, controller `apps/api/app/Http/Controllers/Api/V1/Project*Controller.php`, PolicyService, model, routes, dan ProjectFeatureTest.

Dokumen acuan lokal 00–43 beserta implementasi sebelumnya belum ada di main. Sebelum pull, seluruh perubahan non-ignored disimpan dalam stash commit `062d4e4ac48a318bc59e54bcc96b1d137c5da372`, berjudul `checkpoint ERP lokal sebelum analisis Project dari main 2026-10-06`. Spesifikasi Project 05 dan batas UI 38 dibaca langsung dari snapshot tersebut. Perbaikan privat/scanner, pembatasan aksi UI, validasi nominal/relasi yang tercatat di snapshot **tidak otomatis tersedia pada main**. Rekonsiliasi kedua versi harus dilakukan terpisah, bukan menerapkan stash seluruhnya ke branch ini.

Metode: inspeksi kode dan PRD, pengujian backend Project, typecheck dan build frontend. Belum dilakukan UAT visual interaktif, pengujian keyboard/screen reader, reproduksi eksploit lintas proyek, atau verifikasi ledger/database PostgreSQL perusahaan. Temuan keamanan adalah bukti jalur kode, bukan klaim eksploit produksi.

## 2. Fitur yang sudah ada

- Portofolio dan daftar proyek: pencarian, filter status, kartu/tabel, tambah proyek, detail kontrak/klien/lokasi/tanggal.
- Milestone: bobot, progres aktual, status, tenggat, catatan, log progres per hari. Log harian diperbarui untuk hari yang sama; belum merupakan histori setiap perubahan.
- Dokumentasi lapangan: unggah foto, area, tahap before/in_progress/after, filter dan perbandingan visual.
- Kontrol biaya: RAB, biaya aktual, vendor, kuitansi dan ringkasan selisih anggaran.
- Tagihan: invoice/termin, jatuh tempo, status dan penandaan lunas; belum bukti rekonsiliasi kas Finance.
- Jadwal: durasi kalender, milestone terlambat, tanggal target/realisasi. Bukan penjadwalan dependensi atau baseline kurva-S yang lengkap.
- Dokumen, laporan progres dan BAST: metadata, berkas, tampilan laporan dan ekspor. BAST yang dihasilkan belum membuktikan persetujuan/tanda tangan serah terima.

Positif yang harus dipertahankan: route memisahkan capability baca dan kelola; operasi ubah/hapus RAB, expense, invoice dan foto umumnya sudah membatasi objek terhadap proyek induk; milestone mempunyai log nyata; UI menggunakan token desain, pilihan kartu/tabel, state daftar kosong/error, dan komponen konteks proyek bersama.

## 3. Temuan utama dan prioritas

P1 berarti harus diselesaikan sebelum hasil modul dipercaya untuk operasi keuangan/akses berkas. P2 berarti diperlukan untuk kualitas penggunaan dan kelengkapan workflow. Nomor temuan di bawah dipakai sebagai referensi backlog.

### PRJ-A01 — P1: dashboard menampilkan angka fiktif

`ProjectDashboardPage.tsx:68` memakai `Math.random()` untuk memasukkan proyek berjalan ke risiko terlambat. Baris 146 menampilkan pertumbuhan `+12.5% vs Q2` tetap; baris 155/162 menampilkan progres `68.4%` tetap. Nilai berubah/ditampilkan tanpa dasar bisnis. Ini bertentangan dengan AGENTS.md yang melarang statistik fiktif.

Perbaikan: hapus indikator simulasi; hitung hanya dari data yang lengkap dan definisi yang terdokumentasi. Bila sumber/baseline belum tersedia, tampilkan “Belum tersedia”. Keterlambatan dapat memakai milestone melewati tenggat dan belum selesai, namun definisi eskalasi/pengecualian on_hold masih perlu ditetapkan. Jangan menyamakan on_hold otomatis dengan terlambat.

### PRJ-A02 — P1: angka portofolio berasal dari halaman terbatas

Dashboard meminta maksimal 100 proyek. Daftar meminta 100 untuk ringkasan lalu 50 untuk hasil; ketika tidak ada filter, respons 50 juga mengisi `allProjects` (`ProjectListPage.tsx:37–64`). Urutan respons memengaruhi total. API frontend belum menerima parameter page; ringkasan dihitung dari array, bukan agregat seluruh hasil. Lebih dari 50/100 proyek akan menghasilkan ringkasan tidak lengkap. Tren bulanan berbasis created_at pada subset juga bukan riwayat pertumbuhan portofolio lengkap.

Perbaikan: endpoint agregat server dengan filter/scope/periode yang sama, pagination eksplisit untuk daftar dan pemilih proyek, pembatalan respons lama/debounce pencarian, label jumlah hasil dan periode/sumber data. AC: dataset di atas 100, halaman kedua, pencarian cepat dan filter tidak menghasilkan total/hasil lama yang salah.

### PRJ-A03 — P1: relasi anak dapat menunjuk proyek lain

Validasi `exists:project_rabs,id` pada expense dan `exists:project_milestones,id` pada photo/invoice tidak mengikat ID ke project_id URL. Invoice berstatus paid juga memperbarui milestone berdasarkan ID saja (`ProjectInvoiceController.php:41,76,94,113` dan markPaid). Ini memungkinkan pencatatan/sinkronisasi lintas proyek pada jalur kode tersebut. Route capability tidak menggantikan validasi kepemilikan relasi.

Perbaikan: validasi relasi menggunakan proyek induk, transaksi atomik untuk perubahan invoice/milestone, cek semua jalur create/update/pay. AC: relasi asing ditolak, kedua proyek tetap tidak berubah setelah penolakan; pengelola sah tetap dapat memakai anak proyek yang benar.

### PRJ-A04 — P1: dokumen dan bukti disimpan pada disk publik

Document/photo/expense controller menyimpan pada disk `public`; UI memakai `/storage/…`. DocumentController menerima file dengan batas 10 MB tanpa allowlist tipe. Jalur Project yang ditinjau tidak memanggil scanner. Perlindungan route API tidak berlaku pada akses static storage jika symlink/public serving tersedia.

Perbaikan: disk privat, unduhan berotorisasi, allowlist/MIME/ukuran, scanner dan karantina sesuai acuan lokal, metadata tanpa path internal; inventaris/migrasi berkas lama sebelum menutup akses publik. AC: unduhan anonim dan role tidak sah gagal, scanner gagal menolak file, berkas tidak dapat diakses dari URL static.

### PRJ-A05 — P1: identitas uploader tidak sesuai middleware JWT

`ProjectDocumentController.php:40` mengambil `$request->user()->id`, sedangkan JwtAuthMiddleware menaruh claims di request attributes `user` tanpa memasang user resolver. Photo/expense/invoice sudah membaca attributes. Jalur dokumen berpotensi gagal atau menyimpan file tanpa record ketika resolver tidak menyediakan user; belum dicakup suite Project yang ada.

Perbaikan: sumber identitas terautentikasi yang konsisten, validasi actor, cleanup file jika penyimpanan metadata gagal. AC: upload JWT/cookie sukses dengan uploader benar, kegagalan database tidak meninggalkan file yatim.

### PRJ-A06 — P1: role dan aksi UI belum sesuai kebutuhan

PolicyService sekitar baris 109 memberi Project kepada Manager/Admin PROJECT dan BOD baca. Enam role lain belum dipetakan. Tombol tambah pada daftar/modal dan aksi di detail/galeri tidak mempunyai pembatasan capability per aksi; BOD dapat melihat aksi yang kemudian ditolak server.

Perbaikan teknis awal: UI mengikuti capability server, pembaca tidak melihat mutasi, server tetap memvalidasi. Matriks delapan role dan keterlibatan Accounting pusat perlu dirinci sebagai keputusan bisnis. Jangan memberi seluruh role manage:projects untuk menghilangkan 403. AC: uji setiap role dan panggilan API langsung; data vendor/rekening/bukti dibatasi sesuai matriks yang disepakati.

### PRJ-A07 — P1: status lunas dan label laba terlalu kuat

API mengizinkan invoice langsung paid dengan payment_reference opsional dan tanpa transaksi Finance; milestone dapat ditandai payment_status secara terpisah. Penghapusan/perubahan invoice tidak membangun ulang status pelunasan agregat. Pembayaran sebagian tidak dimodelkan. `ProjectController.php:168,218` menamai nilai kontrak dikurangi biaya aktual sebagai `realized_gross_profit`, meski pengakuan pendapatan/HPP belum ditetapkan pengguna.

Perbaikan awal: label estimasi kontrak dikurangi biaya tercatat dan status pembayaran administratif; jangan nyatakan laba terealisasi, rekonsiliasi bank, atau kas masuk otomatis. Tahap lanjutan: pencatatan pembayaran sebagian, bukti, verifikasi Finance, referensi ledger, koreksi dan reversal. AC: tagihan bukan kas; status paid berasal dari transaksi yang tervalidasi; perubahan tidak meninggalkan milestone “lunas” yang tidak benar.

### PRJ-A08 — P1: kontrak API frontend tidak konsisten

`projectApi.updateExpense` memanggil `api.upload` yang selalu POST; route update expense adalah PUT. Selain itu `api/client.ts` membaca JSON untuk setiap respons sukses, sedangkan delete document/photo mengembalikan 204 tanpa body. Penghapusan bisa berhasil di server tetapi UI melaporkan gagal saat parsing. Ini temuan integrasi statis; belum direproduksi melalui browser.

Perbaikan: metode multipart update yang sesuai route (termasuk dukungan parsing multipart PHP) dan penanganan respons 204. AC: edit expense benar-benar mengubah record; hapus foto/dokumen memperbarui daftar tanpa error parsing; retry tidak menduplikasi operasi.

### PRJ-A09 — P2: integritas progres, jadwal dan budget belum lengkap

Bobot divalidasi per milestone 0–100, belum dibatasi totalnya. Tanggal mulai/akhir hanya divalidasi sebagai date, belum urutan. Log harian menyimpan nilai terakhir; mengubah bobot hari ini dapat mengubah interpretasi kontribusi progres masa lalu. Perhitungan nominal memakai float dan tidak seluruh input dibatasi presisi/rentang database. PRD menyebut cancelled tetapi status proyek API hanya empat nilai.

Perbaikan: aturan bobot untuk draft vs baseline disetujui, versi baseline, tanggal efektif, ketepatan decimal, transisi status dan audit revisi. AC: bobot invalid tidak menghasilkan klaim progres sah; histori tidak berubah tanpa revisi terlacak; nominal/tanggal batas dan perubahan bersamaan diuji. Definisi approval, PIC, dependency scheduling dan status cancelled belum dianggap disetujui.

### PRJ-A10 — P2: feedback, aksesibilitas dan performa UI

Dashboard/galeri menangkap error hanya dengan console sehingga kegagalan dapat tampak seperti tidak ada data. Banyak mutasi memakai alert/confirm native, belum feedback konsisten pada konteks baris. Modal CreateProject berupa div tanpa role dialog/aria-modal, penanganan focus/ESC, dan label terhubung; tombol tutup berupa ikon tanpa nama aksesibel. Detail memiliki nav berlabel Tabs, namun belum pola tab/panel dan navigasi keyboard yang lengkap. Penilaian kontras/mobile/keyboard belum diuji visual.

Build menunjukkan chunk ProjectProgress sekitar 1.006 KB sebelum gzip (~294 KB gzip); penggunaan Recharts dan ApexCharts sekaligus layak dievaluasi. Jangan menambah pustaka animasi/grafik sebelum manfaatnya jelas.

Perbaikan: error/retry terpisah dari empty, feedback simpan/hapus dengan konteks dan busy, field-error yang mempertahankan input, dialog aksesibel, teks status di samping warna, lazy-load grafik/ekspor. AC: keyboard penuh, layar 360 px, zoom 200%, data kosong/terlambat/error, nama proyek panjang, jaringan lambat dan reduced-motion diverifikasi.

## 4. Arah UI yang disarankan

Sebagai Senior Product Designer, struktur token warna primary/navy, kartu, tabel dan foto before-after sudah dapat dikembangkan. Keunggulan tampilan sebaiknya datang dari prioritas kerja dan bukti nyata.

1. Dashboard menjadi pusat perhatian: judul/periode/scope, empat KPI terpercaya, daftar pekerjaan perlu tindak lanjut yang membuka proyek/milestone, lalu status portofolio dan tren yang benar. Angka Rp rinci tersedia; ringkasan ditulis “miliar”/“juta” agar satuan tidak ambigu.
2. Daftar proyek memprioritaskan nama, klien, status, PIC bila datanya tersedia, progres tervalidasi, tenggat dan nominal. Filter/search serta pilihan kartu/tabel tetap ada. Ringkasan tidak mengulang grafik yang tidak membantu pemilihan proyek.
3. Detail mempertahankan konteks proyek di header. Ringkasan, pekerjaan/progres, biaya, tagihan, foto dan dokumen dibedakan menurut tugas; aksi utama sesuai role. Menu mandiri dan tab detail memakai komponen serta data yang sama agar tidak menjadi dua implementasi berbeda.
4. Foto memperlihatkan area, tahap, tanggal dan uploader; perbandingan memakai pasangan area yang relevan. RAB/realisasi dan tagihan/pembayaran ditampilkan terpisah dengan sumber, tanggal pembaruan, bukti dan status verifikasi.
5. Ritme ruang, ukuran angka, alignment nominal, tipografi dan status konsisten antar halaman. Motion hanya untuk feedback; dekorasi tidak mengaburkan data atau menambah KPI palsu.

## 5. Todo berikutnya dan kriteria selesai

- [x] Lindungi pekerjaan lokal, fetch dan pull main secara fast-forward.
- [x] Analisis fitur, UI, akses, data, dokumen dan kontrak integrasi dari baseline main.
- [x] Buat branch analisis dari main dan dokumentasikan alur Git.
- [ ] Paket 1 — PRJ-A01/A02/A08: kejujuran dashboard, agregat/pagination, metode update dan respons 204. Peran: Senior Fullstack Programmer + Senior Product Designer. Wajib tes dataset besar, error/retry dan integrasi mutasi.
- [ ] Paket 2 — PRJ-A03/A04/A05/A06: relasi induk, berkas privat/scanner, identitas uploader, capability UI/server. Peran: Application Security Engineer + Senior Fullstack Programmer. Port perubahan lokal yang relevan satu per satu dengan tes, bukan apply stash massal.
- [ ] Paket 3 — PRJ-A07/A09: semantik keuangan/progres, baseline dan audit. Peran: Senior Product Manager + Application Security Engineer + Senior Fullstack Programmer. Tampilkan batas data sambil definisi pengakuan/approval/Finance masih terbuka.
- [ ] Paket 4 — PRJ-A10 dan arah UI: komponen konsisten, aksesibilitas, visual QA, performa dan UAT delapan role. Peran: Senior Product Designer + Senior Fullstack Programmer.

Urutan mengikuti dependensi. Paket keamanan dapat berjalan sebelum/bersamaan dengan kejujuran dashboard jika lingkup file terpisah. Perubahan kosmetik dilakukan setelah sumber angka dan capability jelas. Status checkbox paket tetap terbuka sampai kode, pengujian, push dan PR paket tersebut tersedia. PR analisis tidak menandai pekerjaan implementasi selesai.

## 6. Validasi baseline dan batas hasil

- `php artisan test --filter=ProjectFeatureTest`: lulus 11 tes, 63 assertions; database SQLite in-memory dipaksa untuk proses ini. Tidak menjalankan migrasi/seed pada database PostgreSQL perusahaan.
- `npm ci --no-audit --no-fund`: dependensi diselaraskan dengan lockfile setelah proses Vite proyek dihentikan sementara karena file native terkunci. Lockfile tidak berubah.
- `npm run typecheck` dari apps/web: lulus setelah sinkronisasi dependensi.
- `npm run build` dari apps/web: lulus; warning anotasi dependency Zod dan ukuran chunk tetap ada. Build bukan bukti UAT atau keamanan.
- Dev server frontend dijalankan kembali di `http://127.0.0.1:5173`. Analisis ini tidak mengganti kredensial, menjalankan seed produksi atau menjamin backend/database lokal cocok dengan schema main.

Suite Project yang ada menguji akses dasar, milestone, foto, RAB/expense, invoice dan laporan. Belum membuktikan semua role, unggahan dokumen JWT, relasi lintas proyek, pagination besar, pembayaran sebagian, rollback, atau UAT browser. Lulusnya suite tidak menghapus temuan tersebut.

## 7. Catatan PR ke development

Branch berasal dari main sesuai instruksi pengguna. Saat analisis, `origin/development` berada pada `c205582`, sedangkan main juga membawa riwayat merge sebelumnya dan perubahan favicon. Diff terhadap development karena itu sudah memuat `apps/web/index.html`, `apps/web/public/favicon.ico`, `apps/web/public/favicon.svg`, dan `apps/web/src/layout/AppLayout.tsx` sebelum dokumen ini ditambahkan. Empat file tersebut diwarisi main, bukan perubahan baru dalam pekerjaan analisis. Tinjau hubungan main/development sebelum merge; PR tidak di-merge otomatis.

Alur kerja berikutnya ada pada [dokumen 45](45_ALUR_GIT_MAIN_DEVELOPMENT.md).
