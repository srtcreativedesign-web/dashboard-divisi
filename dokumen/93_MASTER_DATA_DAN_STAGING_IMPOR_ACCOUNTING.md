# Master Data dan Staging Impor Accounting

Tanggal: 12 Oktober 2026  
Branch: `REQ`

## Tujuan

Pekerjaan ini memperjelas dua fondasi pembukuan Accounting: pengelolaan kategori/akun dan pemeriksaan data impor sebelum transaksi dicatat. Kerangka visual mengikuti Divisi Project, sedangkan isi, status, kewenangan, dan tindakan tetap khusus Accounting.

## Hasil implementasi

### Master Data

- Ringkasan jumlah kategori, akun aktif, cakupan outlet, dan aktivitas perubahan.
- Tab kategori dan akun dengan pencarian serta status aktif/nonaktif.
- Form kategori memuat kode, nama, kelompok induk, alias integrasi, dan cakupan outlet.
- Form akun memuat kode, nama, kategori, deskripsi, dan cakupan outlet yang dipilih dari data organisasi server.
- Penonaktifan memakai dialog terstruktur dan alasan wajib, bukan konfirmasi browser.
- Riwayat perubahan master ditampilkan dari audit/history API.
- Seluruh tindakan mengikuti capability pengguna; akun tanpa izin hanya mendapat tampilan baca.

### Staging Impor

- Periode pembukuan dipilih secara eksplisit dan periode tutup tidak tersedia untuk commit.
- Periode dikunci setelah file masuk staging agar hasil pratinjau tidak berpindah konteks.
- Ringkasan membedakan valid, normalisasi, peringatan, kandidat duplikat, dan error.
- Kandidat duplikat wajib ditinjau dan diakui secara eksplisit sebelum commit.
- Tombol commit aktif hanya setelah pratinjau valid, periode layak, dan pemeriksaan duplikat selesai.
- Status selesai baru diberikan setelah API commit berhasil.
- Tabel staging menjelaskan nomor baris, status, data hasil normalisasi, dan alasan masalah.

## Perspektif peran

- **Senior Product Manager:** menjaga alur kerja Master → Pratinjau → Tinjau → Commit dan membatasi klaim selesai pada implementasi teknis.
- **Senior Product Designer:** menyelaraskan hierarki visual dengan Divisi Project, memperjelas keadaan kosong, status, tindakan, dan risiko sebelum commit.
- **Senior Fullstack Programmer:** menyelaraskan kontrak tipe API, metode pembaruan backend, query history, outlet server, serta tes halaman.
- **Application Security Engineer:** menegakkan capability, meniadakan ID outlet bebas, mengecualikan periode tutup, mewajibkan pengakuan duplikat, dan mempertahankan audit trail.

## Verifikasi

- Tes terarah Master Data dan Staging Impor: 8 tes lulus.
- Tes backend terarah Accounting: 38 tes, 202 assertion lulus.
- TypeScript typecheck, ESLint scoped, production build, policy sync, dan `git diff --check` lulus.
- QA visual pada data server lokal dilakukan untuk halaman Master dan Impor dalam tema gelap serta viewport sempit.
- Divisi Project tidak diubah.

## Batas pekerjaan

- Tidak ada file sumber yang diunggah atau transaksi yang di-commit saat QA visual.
- Formula bisnis PNL, HPP, bonus, CMO, dan mapping jurnal otomatis tidak ditentukan oleh pekerjaan ini.
- Penerimaan pengguna untuk seluruh role, tema terang, dan variasi ukuran layar tetap berada pada `UI-XDIV-002`.
- Workflow persetujuan perubahan master tingkat perusahaan dapat ditambahkan setelah matriks kewenangan final disepakati.
