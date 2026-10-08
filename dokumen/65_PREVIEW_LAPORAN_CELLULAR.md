# Preview laporan Cellular — kontrak tahap pertama

8 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

Backup sebelum kode: snapshot REQ ab59360 dan backup database 65 tabel telah diverifikasi pada dokumen lokal 64. File bisnis tetap lokal; fixture test anonim. Rancangan mengikuti analisis 62/63. Tahap ini belum merupakan impor transaksi atau persetujuan angka final.

## Scope

Ruang kerja pusat Accounting: Admin ACC, Staff Accounting ACC dan Manager ACC dapat mempreview laporan DATA CELLULAR T3. Izin khusus `preview:cellular_report` diperiksa di server dan UI. Akses Admin Cellular lokal serta format outlet lainnya belum dibuka karena pemetaan scope/outlet belum lengkap. Tidak menambah capability Finance atau BOD otomatis.

Endpoint POST `/api/v1/accounting/cellular-preview` menerima satu `file`, `profile` (daily/income/shift/ecsys/update), dan `month` YYYY-MM. Lima sumber diunggah satu per satu; UI membandingkan hasil server pada periode/outlet yang sama. Identitas outlet dari header, tidak dari nama file. Tidak ada endpoint commit, batch persisten, download arsip, atau mutasi tabel bisnis. Hasil hanya dalam sesi layar dan hilang ketika refresh; preview bukan arsip audit permanen.

## Kamus data / lineage v1

- Harian: sheet bernama hari numerik, D4 tanggal, D257 bruto, D258 EDC, D259 QRIS, D260 kas, D265 pengeluaran, D267 rencana setoran. A1 DATA PENJUALAN DAN STOCK; D2 identitas DATA CELLULAR T3. REKAP tidak dijumlah ulang.
- Pendapatan & Pengeluaran: sheet `PENDAPATAN & PENGELUARAN`, A1 REKAP OMSET DAN TRANSFER OMSET, D3 identitas DATA CELLULAR T3, D4 periode. Baris 9–39, D tanggal; J bruto, L EDC, M QRIS, N pengeluaran, P rencana setoran, T/V transfer. Selisih transfer dihitung dari T+V-P, bukan cache W. Tanggal transfer S/U tetap provenance untuk tindak lanjut, bukan tanggal penjualan.
- Omzet per Shift: sheet `SALES PER SHIFT`, A1 OMSET PER SHIFT, D3 identitas, D4 periode. Baris 9–39; D tanggal, J/P/V bruto shift 1/2/3, W bruto harian. Jumlah shift diperiksa terhadap W.
- Ecsys: sheet `ECSYS`, D3 identitas, D6 periode; E9 OMSET REAL. Baris 11–41; tanggal di D, E bruto real, F neto sumber, H realisasi Ecsys, I net sales Ecsys, J Masuk. Tidak menetapkan E/1,11 sebagai pajak resmi, dan Masuk tidak menjadi laba.
- Update: sheet `ALL CELLULAR`, A1 DAILY REPORT CELLULAR, A2 periode Indonesian month/year, F4 DATA CELLULAR T3. Baris 6–36, A nomor hari; F/G/H shift 1/2/3, I bruto DATA T3. GRAND TOTAL lima tenant tidak menjadi penjualan tambahan.

Layout ini adapter versi 1 untuk contoh yang diberikan. Header, sheet, tanggal dan bulan harus cocok sebelum ekstraksi. Sheet/baris tambahan dilaporkan diabaikan; tidak berarti workbook lengkap telah tervalidasi. Perubahan template membutuhkan adapter baru, bukan tebakan koordinat.

Nilai angka dibaca sebagai literal atau hasil formula terakhir yang tersimpan; tidak menjalankan formula/macro/external link. Cache formula tidak membuktikan freshness. Nilai kosong/error/nonnumeric tetap null dan menjadi isu; tidak disulap menjadi nol. Preview membulatkan tampilan rupiah sampai dua desimal untuk perbandingan, belum kebijakan rounding accounting.

## Pilihan parser dan keamanan

PhpSpreadsheet 5.10 dipilih karena reader BIFF XLS dan OOXML XLSX serta akses cached value. Pembaca eksplisit berdasarkan ekstensi + signature/canRead; tidak menggunakan fallback HTML/CSV. Bukan memakai library XLSX lama di browser untuk mengambil keputusan server.

File maksimal 10 MB lewat middleware scan ERP; scanner tidak siap/gagal menolak. Parsing berjalan pada proses PHP terpisah, memory limit 192 MB dan timeout 25 detik. XLSX preflight membatasi jumlah anggota ZIP, hasil dekompresi dan isi aktif/DTD. Workbook dibatasi 40 sheet, dimensi maksimum dan filter sel. Reader hanya memuat sheet yang relevan, tidak chart/style. Sel penting ditelusuri melalui sheet/cell/formula/cache. Error subprocess tidak mengungkap path/stack ke pengguna.

Audit dependensi saat pemasangan menemukan advisory baseline Laravel/CommonMark; paket parser baru tidak terdaftar dalam hasil audit. Temuan baseline harus tetap dicatat, bukan mengklaim seluruh ERP bebas advisory.

## UI / acceptance

Menu Preview Cellular pada Accounting. Form periode, profil sumber dan upload; ringkasan hasil sumber nyata, daftar isu dan tabel perbandingan tanggal. Detail menampilkan sel asal dan nilai/formula. Mengubah bulan menghapus hasil lama agar tidak membandingkan periode yang berbeda. File identik dalam sesi ditandai duplikat; perubahan versi profil memerlukan pengguna menghapus hasil lama dahulu, bukan overwrite diam-diam.

Uji anonim: tanggal/periode/header/layout salah, fake XLS, file lock, batas resource, role/scope, scanner gagal, formula cache/error/null, duplicate dates, jumlah shift, dan selisih transfer. Uji lokal lima file nyata tanpa menyimpan ke DB: perbedaan bruto akhir bulan, distribusi shift yang berbeda dan kelebihan setoran yang dicatat pada analisis lokal harus muncul. Angka keuangan riil dan sumber asli tidak disertakan dalam repo. Uji backend memakai SQLite sementara, UI memakai mock anonim.

## Todo

- [x] Backup terenkripsi dan uji restore DB/integritas source sebelum kode.
- [x] Scope, kamus data versi 1, izin dan pemilihan parser terdokumentasi.
- [x] Reader terisolasi, controller, header/kolom adapter dan izin server.
- [x] UI preview, perbandingan bruto/shift, lineage dan tanggal transfer.
- [x] Test otomatis, lima file asli read-only dan smoke test API native/scanner.
- [x] Login Admin ACC, menu dan preview Harian terisi terbukti di DOM browser; scanner runtime menerima file bersih dan menolak EICAR.
- [ ] QA visual gabungan, mode terang/gelap dan mobile: browser in-app mengalami gangguan jaringan saat pemilihan XLS kedua; tidak diklaim selesai.
- [ ] Persistensi staging/audit bisnis, pemetaan semua outlet dan akses Admin Cellular.
- [ ] Formula/cutoff laporan Oktober, penetapan sumber final dan approval selisih.
- [ ] Integrasi operasi/shift → H+1 → Accounting; settlement/Ecsys; HPP/fee/bonus/CMO setelah keputusan bisnis.

Referensi parser: https://phpspreadsheet.readthedocs.io/en/latest/topics/reading-files/ ; upload: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html .

## Bukti verifikasi 8 Oktober 2026

Regresi lengkap: 291 backend / 2446 assertions dan 165 web / 38 file lulus. Setelah menambah tiga kasus keamanan terakhir, 13 test preview backend / 52 assertions lulus; empat test UI final, typecheck, build, lint scoped, Pint dirty, policy check dan Composer validate lulus. Test regresi frontend masih memberi warning baseline Project (chart tanpa ukuran jsdom, fetch fixture invoices, act); build memberi warning ukuran chunk/annotation Zod. Itu bukan bukti semua lint global atau CI remote hijau.

Worker nyata membaca lima workbook asli masing-masing 30 tanggal dan delapan pemeriksaan rekonsiliasi lulus, hash sumber tidak berubah. Smoke test HTTP native: sembilan pemeriksaan lulus dengan fixture anonim; Admin ACC diterima, Finance dan Admin CELL ditolak, fingerprint tabel bisnis/skema/indeks/sequence tidak berubah. Autentikasi, revocation dan audit adalah perubahan teknis yang diizinkan dalam probe; transaksi bisnis tidak ditulis.

UI native sempat berhasil menampilkan preview Harian lengkap dengan sumber formula dan sel; validasi periode salah juga terlihat. Browser terhenti ketika memilih XLS kedua dengan ERR_NETWORK_IO_SUSPENDED. Web localhost:5173 dan health API native tetap merespons HTTP 200. QA visual dan screenshot lengkap tetap terbuka; tidak mengubah firewall atau mengurangi pengamanan browser untuk memaksakannya.

Audit Composer mencatat tiga advisory yang sudah ada pada Laravel/CommonMark. Parser baru tidak terdaftar sebagai paket terdampak pada hasil audit ini. Remediasi patch baseline berikut regresinya menjadi pekerjaan berikutnya, terpisah dari klaim keberhasilan preview.

Persistensi staging, workflow review sumber, seluruh outlet/role, Google Sheets Oktober dan posting bisnis belum diimplementasikan. Tidak ada migrasi, seed tambahan, data source riil, private config, backup atau key yang dipush. Branch kerja REQ; tanpa PR.
