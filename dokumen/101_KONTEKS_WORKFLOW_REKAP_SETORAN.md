# 101 — Konteks Workflow Rekap Setoran

Tanggal: 15 Oktober 2026
Status: selesai teknis, menunggu UAT pengguna bisnis

## Tujuan

Register Rekap Setoran harus menjawab siapa yang perlu bertindak, apa aktivitas terakhir, kapan perubahan terjadi, dan apakah ada alasan koreksi tanpa memaksa pengguna membuka histori setiap dokumen.

## Perilaku

- Setoran aktif yang masih mempunyai sisa penerimaan diarahkan kepada `Staff Finance`.
- Setoran yang telah diterima penuh atau dibatalkan ditandai `Selesai`.
- Register dan detail menampilkan aktivitas terakhir, waktu WIB, dan alasan koreksi bila tersedia.
- Tampilan lama tetap mempunyai fallback berdasarkan status dan sisa penerimaan bila respons API lama belum membawa proyeksi workflow.

## Kontrak keamanan

API memproyeksikan hanya empat atribut untuk konteks daftar: `next_role`, `last_action`, `last_transition_at`, dan `reason`. ID aktor, snapshot audit, serta referensi bukti tidak disalin ke proyeksi ringkas. Detail berizin tetap menyediakan histori yang sudah ada.

## Kinerja data

Daftar memuat sumber omzet, total penerimaan aktif, dan event terakhir secara batch. Jumlah query tidak bertambah per baris. Detail tetap memuat histori lengkap sesuai capability pengguna.

## Validasi

- Tes backend memeriksa transisi Finance menjadi selesai setelah penerimaan penuh dan memastikan proyeksi tidak memuat `actor_id` atau `snapshot`.
- Tes frontend memeriksa aktivitas terakhir, waktu, dan PIC berikutnya pada baris register.
- Pemeriksaan typecheck, lint, build, format PHP, policy, serta suite Accounting dijalankan sebelum commit.

## Batas scope

Perubahan ini hanya menyentuh Rekap Setoran Accounting. Divisi Project tidak diubah. Penjadwalan otomatis, SLA perusahaan, dan UAT lintas role tetap menjadi pekerjaan lanjutan.
