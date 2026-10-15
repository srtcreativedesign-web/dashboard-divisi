# 103 — Koreksi Scope Rekap Kehadiran

Tanggal: 15 Oktober 2026
Status: acuan aktif, menggantikan rancangan workflow HR internal

## Keputusan produk

ERP bukan sistem pengajuan atau pengelolaan proses HR. Cuti, sakit, izin, absensi, jadwal, keterlambatan, dan perubahan datanya diproses pada sistem absensi kantor. ERP hanya menerima hasil melalui API dan menyajikannya sebagai rekap read-only untuk kebutuhan Accounting.

Konsekuensinya:

- tidak ada form pengajuan, pencatatan manual, koreksi, pembatalan, approval, atau master pegawai pada UI ERP;
- tidak ada PIC Admin/Manager atau state machine HR di ERP;
- kesalahan data diperbaiki pada sistem absensi kantor, lalu diterima kembali melalui sinkronisasi berikutnya;
- data lama dipertahankan sebagai histori dan tidak dihapus secara destruktif;
- konektor aktual baru dibuat setelah penyedia API, autentikasi, endpoint, struktur respons, pagination, dan mekanisme delta sinkronisasi tersedia.

## Pengalaman pengguna

Menu **Rekap Kehadiran** menampilkan dua ruang baca:

1. Rekap absensi harian: hadir, sakit, cuti, tidak hadir, libur, serta menit keterlambatan.
2. Riwayat cuti: periode, jenis, jumlah hari, dan referensi dari sistem sumber.

Dashboard halaman menjelaskan asal data dan batas read-only, menyediakan KPI periode, filter bulan, register, pagination, serta detail sumber. Tidak ada tombol tindakan HR.

## Kontrak API ERP

Endpoint pengguna yang aktif hanya:

- `GET /api/v1/accounting/hr/recaps`
- `GET /api/v1/accounting/hr/recaps/{id}`

Endpoint manual untuk pegawai, pembuatan rekap, koreksi, dan pembatalan ditutup. Respons menandai sumber sebagai `attendance_api` dan mode `read_only`. Field internal `source_key`, `created_by`, event, snapshot, dan actor tidak dikirim ke UI.

## Keamanan integrasi yang diwajibkan

Konektor mendatang harus memakai kredensial server-to-server dengan scope baca minimum, secret di penyimpanan konfigurasi server, TLS, timeout, retry terbatas, idempotency key, validasi skema, pagination, watermark/delta cursor, audit hasil sinkronisasi, serta pembatasan data pribadi. ERP tidak menyimpan biometrik, diagnosis, atau kredensial perangkat absensi.

## Informasi yang masih dibutuhkan

- nama penyedia atau aplikasi absensi;
- dokumentasi endpoint dan contoh respons anonim;
- metode autentikasi;
- identitas unik pegawai dan catatan;
- timezone serta aturan perubahan/hapus pada sumber;
- batas request, pagination, dan dukungan incremental sync;
- kebutuhan near-real-time atau jadwal sinkronisasi.

Divisi Project tidak diubah.
