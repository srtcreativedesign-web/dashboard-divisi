# UAT Browser Rekap Kehadiran dan Persediaan Accounting

Tanggal: 15 Oktober 2026  
Lingkungan: frontend `127.0.0.1:5173`, API `127.0.0.1:8000`, data UAT lokal  
Branch acuan: `REQ` pada commit `92075e5`

## Tujuan

Validasi ini memastikan koreksi ruang lingkup Rekap Kehadiran dan pemisahan tindakan Persediaan tampil konsisten di browser. Pengujian dilakukan sebagai Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, dan Application Security Engineer.

API sistem absensi kantor belum tersedia. Karena itu, pengujian hanya memvalidasi kontrak UI read-only dan data simulasi yang sudah berada di database; konektor eksternal tetap ditunda.

## Rekap Kehadiran

### Admin Accounting

- Halaman `/accounting/administrasi/pegawai` dapat dibuka dari Dashboard Accounting.
- Judul dan orientasi menjelaskan bahwa halaman menampilkan hasil absensi, sakit, cuti, libur, dan keterlambatan dari sistem absensi kantor.
- Banner `ERP tidak memproses pengajuan kepegawaian` terlihat sebelum register.
- Alur sumber dijelaskan sebagai sistem absensi kantor → API → rekap baca-saja Accounting.
- Register menampilkan pegawai, tanggal/periode, hasil sumber, referensi sumber, status data, dan detail.
- Tidak tersedia tindakan membuat, mengoreksi, menyetujui, membatalkan, atau menghapus data HR.

### Manager Accounting

- Halaman tetap bersifat baca-saja.
- Kontrol yang tersedia hanya pemilihan jenis rekap, periode, membuka detail, dan navigasi halaman.
- Tidak terdapat tindakan persetujuan HR di ERP.

Hasil: **lulus untuk kontrak UI baca-saja**. Integrasi dan rekonsiliasi terhadap sistem sumber belum dapat diuji sampai kontrak API diberikan.

### Staff Accounting dan Staff Finance

- Staff Accounting dapat membaca register dan detail tanpa tindakan perubahan atau approval HR.
- Staff Finance menerima `Akses ditolak` karena tidak memiliki `view:acc_hr`; menu Rekap Kehadiran juga tidak tampil pada navigasi Finance.

Hasil tambahan: **lulus untuk akses baca Staff Accounting dan penolakan Staff Finance**.

## Persediaan & Gudang

### Admin Accounting

- Dapat membaca KPI, register, status alur, PIC, waktu aktivitas, dan berita acara.
- Tidak melihat `Dokumen baru`, `Edit`, `Ajukan`, `Setujui & posting`, atau `Minta koreksi`.

### Admin Gudang

- Melihat tindakan `Dokumen baru`.
- Pada dokumen draf, melihat `Edit` dan `Ajukan`.
- Tidak melihat tindakan keputusan Manager pada dokumen submitted.
- Form dokumen memuat jenis, tanggal, voucher pembelian disetujui, lokasi, referensi sumber, daftar barang multi-baris, jumlah, catatan, dan keterangan bahwa saldo berubah setelah persetujuan Manager.
- Pilihan voucher menjelaskan dukungan penerimaan parsial dan menyediakan jejak sumber.

### Manager Accounting

- Tidak melihat tindakan pembuatan atau pengeditan draf milik Admin Gudang.
- Pada dokumen submitted, melihat `Setujui & posting` serta `Minta koreksi`.
- Dokumen draf menunjuk PIC Admin Gudang; submitted menunjuk PIC Manager Accounting; approved menunjuk status selesai.
- Aktivitas terakhir dan waktu WIB tampil pada register.

Hasil: **lulus untuk pemisahan tindakan Admin, Admin Gudang, dan Manager**.

### Staff Accounting

- Dapat membaca register dan berita acara sebagai bagian dari pemeriksaan Accounting.
- Tidak melihat `Dokumen baru`, `Edit`, `Ajukan`, `Setujui & posting`, atau `Minta koreksi`.

### Staff Finance

- Direct route ke Persediaan menampilkan `Akses ditolak` karena role Finance tidak memiliki `view:inventory`.
- Menu Operasional Pendukung tidak ditampilkan pada navigasi Finance.

Hasil tambahan: **lulus untuk pembaca Staff Accounting dan penolakan Staff Finance**.

## Temuan UX

- Tombol akun demo cepat memang hanya mengisi email, sesuai petunjuk `Klik untuk mengisi email`; password tetap wajib dimasukkan. Ini tidak dianggap cacat fungsi, tetapi perlu dijelaskan pada panduan UAT agar penguji tidak mengira login otomatis.
- Pada perpindahan route setelah login, layar `Memuat sesi... Menunggu verifikasi token` tampil singkat lalu halaman dimuat normal.
- Tampilan desktop gelap Persediaan memiliki hierarchy yang konsisten dengan kerangka Divisi Project: sidebar, header konteks, KPI, tab kerja, filter periode, register, status, dan tindakan berbasis role.
- Rekap Kehadiran lulus pemeriksaan visual desktop pada tema gelap dan terang; transisi tema memerlukan waktu render singkat tetapi berakhir pada palet yang benar.
- Rekap Kehadiran dan Persediaan lulus pemeriksaan viewport mobile 390×844: header berubah menjadi menu hamburger, konten menjadi satu kolom, kartu tetap terbaca, dan tidak ada overflow horizontal pada area yang diperiksa.
- Sidebar mobile menempatkan fokus awal pada tombol tutup, lalu `Tab` berpindah ke Dashboard Accounting. Label `Buka menu` dan `Tutup panel` tersedia untuk pembaca layar.
- Persediaan lulus pemeriksaan tablet 768×1024. Tabel mempertahankan lebar 1080 piksel di dalam pembungkus `overflow-x-auto`, sehingga kolom tindakan tetap dapat dijangkau tanpa mendorong keseluruhan halaman.
- Audit kontrol keyboard menemukan tombol `Berita acara` memiliki nama aksesibel yang sama. Tombol kini diberi label unik `Berita acara {nomor dokumen}` dan hasilnya diverifikasi pada browser serta tes komponen.
- Rekap Kehadiran dan Persediaan mempunyai state kegagalan dengan `role=alert` serta tindakan `Coba Lagi`. Tes membuktikan retry memuat data kembali tanpa kehilangan struktur halaman.

## Batas dan pekerjaan tersisa

- Belum ada sign-off pemilik proses.
- UAT role utama Rekap Kehadiran dan Persediaan telah dijalankan; validasi perangkat, tema, keyboard, dan error state masih terbuka.
- Penelusuran keyboard dan focus state seluruh halaman di luar dua modul ini masih terbuka. Pemeriksaan desktop terang/gelap, tablet/mobile, akses role, dan error/retry dua halaman sudah tercatat.
- Integrasi API absensi, mapping identitas pegawai, cursor sinkronisasi, retry, idempotency, dan rekonsiliasi sumber ditunda sampai kontrak API tersedia.
- Metode nilai persediaan/HPP tetap menunggu kebijakan perusahaan.

Dokumen ini mencatat hasil aktual dan tidak mengubah status pekerjaan yang belum diuji menjadi selesai.

## Bukti teknis tambahan

- `AccountingInventoryPage.test.tsx`: 5 tes lulus.
- `AccountingHrPage.test.tsx`: 6 tes lulus.
- Seluruh suite frontend Accounting, typecheck, dan ESLint scoped lulus.
- Build produksi Vite lulus; peringatan komentar anotasi berasal dari dependensi Zod dan tidak menggagalkan build.
