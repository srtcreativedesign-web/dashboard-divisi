# 104 — Konteks Workflow Persediaan Accounting

Tanggal: 15 Oktober 2026
Status: selesai teknis, menunggu UAT pengguna bisnis

## Tujuan

Register dan Berita Acara Persediaan harus langsung menjawab aktivitas terakhir, waktu perubahan, pihak yang perlu bertindak, serta alasan koreksi. Konteks ini melengkapi state machine yang sudah ada tanpa mengubah mekanisme posting saldo atau perhitungan HPP.

## Pemetaan penanggung jawab

- `draft` dan `correction` → **Admin Gudang**;
- `submitted` → **Manager Accounting**;
- `approved` → **Selesai** karena saldo telah diposting.

Aktivitas terakhir diturunkan dari status dokumen: draf disimpan, diajukan, koreksi diminta, atau disetujui dan diposting. Waktu memakai `updated_at` dokumen dan ditampilkan dalam WIB. Alasan hanya tersedia pada status koreksi.

## Kontrak keamanan

Proyeksi `workflow` hanya memuat `next_role`, `last_action`, `last_transition_at`, dan `reason`. Proyeksi tidak memuat `actor_id`, `created_by`, `reviewed_by`, snapshot audit, atau data voucher tambahan. Otorisasi tindakan tetap ditentukan capability backend, ownership pembuat, maker-checker, dan optimistic version.

## UI

Register menampilkan status bersama aktivitas terakhir, waktu, PIC, dan alasan koreksi. Berita Acara menampilkan konteks yang sama agar dokumen cetak dapat dipahami tanpa membuka data audit internal. Struktur visual Divisi Project tidak diubah.

## Batas

Perubahan ini tidak menetapkan FIFO, rata-rata bergerak, nilai persediaan, HPP, atau PNL. Kebijakan tersebut tetap menunggu keputusan perusahaan.

## Validasi

Tes backend memeriksa perubahan PIC pada draf, pengajuan, dan koreksi serta kontrak proyeksi aman. Tes frontend memeriksa konteks pada register dan Berita Acara. Pint, PHPUnit, Vitest, typecheck, lint, build, policy check, dan diff check dijalankan sebelum commit.
