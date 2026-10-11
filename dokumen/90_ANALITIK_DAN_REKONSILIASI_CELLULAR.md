# Analitik dan Rekonsiliasi Cellular

Tanggal implementasi: 11 Oktober 2026

Branch: `REQ`

Pemilik: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, dan Application Security Engineer.

## Tujuan

Halaman `Laporan & Analitik` menjadi ruang kerja pemeriksaan lintas sumber untuk Manager, Admin, Accounting, Finance, dan BOD. Halaman ini membantu pengguna menemukan tanggal serta outlet yang datanya belum lengkap atau berbeda sebelum angka digunakan dalam laporan resmi.

Selisih tidak diklasifikasikan sebagai laba, pendapatan lain, pajak, atau koreksi. Klasifikasi tersebut menunggu kebijakan Accounting yang disetujui perusahaan.

## Sumber data

Semua angka dibaca dari database melalui API, tanpa data hardcode pada UI:

1. penjualan Cellular berstatus `posted`;
2. closing harian H+1;
3. settlement yang telah direkonsiliasi;
4. batch staging ECSYS terbaru per outlet pada periode terpilih.

Jika sumber belum tersedia, API mengirim nilai `null` dan UI menampilkan `Belum tersedia`. Nilai yang tidak ada tidak diganti dengan nol.

## Definisi indikator

- **Penjualan ERP**: total transaksi Cellular posted pada periode dan scope outlet pengguna.
- **Masuk ECSYS**: total kolom nilai masuk dari batch ECSYS terbaru yang valid per outlet.
- **Selisih sumber**: Penjualan ERP dikurangi Masuk ECSYS.
- **Perlu pemeriksaan**: jumlah kombinasi tanggal-outlet yang berbeda atau belum memiliki seluruh sumber utama.
- **Cakupan data**: outlet, hari penjualan, hari closing, baris ECSYS, dan batch ECSYS yang membentuk laporan.

Status rekonsiliasi harian:

- `Sesuai`: penjualan dan ECSYS tersedia serta selisih nol;
- `Ada selisih`: penjualan dan ECSYS tersedia tetapi nilainya berbeda;
- `Belum lengkap`: salah satu sumber utama belum tersedia.

## Pengalaman pengguna

- filter periode dan outlet berada pada header kerja;
- indikator ketersediaan sumber menjelaskan data yang membentuk laporan;
- KPI menunjukkan nilai utama dan jumlah pengecualian;
- tabel rekonsiliasi dapat difilter berdasarkan status;
- tombol `Periksa` membuka rincian semua sumber untuk tanggal dan outlet terkait;
- komparasi outlet dan provider menggunakan transaksi posted;
- bahasa visual mengikuti kerangka Divisi Project tanpa mengubah kode Project;
- tema terang/gelap, loading, error, empty state, dan tata letak responsif dipertahankan.

## Akses dan keamanan

Endpoint `GET /api/v1/cellular/analytics` memakai capability `view:cellular_sales`, scope divisi Cellular, dan pembatasan outlet pengguna. Outlet di luar scope ditolak. Role operasional tanpa capability laporan tidak dapat mengakses endpoint.

Endpoint hanya membaca data. Implementasi tidak menambah migrasi, tidak mengubah data produksi, dan tidak membuat keputusan akuntansi otomatis.

## Kontrak API

Parameter:

- `month`: wajib, format `YYYY-MM`;
- `outlet_id`: opsional dan harus berada dalam scope pengguna.

Respons mencakup `period`, `kpis`, `coverage`, `sources`, `daily`, `outlets`, dan `providers`.

## Validasi implementasi

- PHPUnit: 2 tes, 12 assertion; mencakup agregasi empat sumber, penolakan role tanpa capability, dan isolasi outlet.
- Vitest: 2 tes; mencakup penjelasan selisih, drill-down, dan sumber yang tidak tersedia.
- TypeScript typecheck: lulus.
- ESLint terarah untuk file perubahan: lulus.
- Build produksi Vite: lulus.

## Pekerjaan lanjutan

1. selaraskan form closing H+1, alasan koreksi, PIC, dan histori pemeriksaan;
2. lengkapi perbandingan langsung profil harian, pendapatan, dan omzet per shift setelah mapping kolom final disetujui;
3. terapkan PNL/HPP setelah metode penilaian persediaan dan pengakuan pendapatan ditetapkan perusahaan;
4. lakukan UAT tema terang/gelap per role dengan data operasional yang disetujui.
