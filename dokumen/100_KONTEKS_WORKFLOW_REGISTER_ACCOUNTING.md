# Konteks workflow register Accounting

Tanggal: 15 Oktober 2026
Branch: `REQ`

## Masalah

Register Pekerjaan Saya sudah memisahkan antrean berdasarkan status dan role, tetapi label penanggung jawab diturunkan oleh frontend. Waktu perpindahan terakhir dan alasan keputusan tidak tersedia pada daftar sehingga pengguna harus membuka setiap dokumen untuk memahami konteks dasar.

## Implementasi

Daftar rekap omzet dan voucher sekarang menerima proyeksi workflow dari server:

- `next_role` menunjukkan role yang bertanggung jawab pada tahap berikutnya;
- `last_action` menunjukkan tindakan workflow terakhir;
- `last_transition_at` menunjukkan waktu event terakhir dalam zona waktu yang ditampilkan sebagai WIB;
- `reason` membawa alasan keputusan atau koreksi jika tersedia.

Event untuk satu halaman dimuat secara batch. API tidak mengirim `actor_id`, snapshot dokumen, rekening, atau metadata audit lain pada endpoint daftar. Detail dokumen tetap menyediakan histori lengkap sesuai capability.

Untuk voucher berstatus approved, PIC berikutnya adalah Finance selama masih ada sisa pembayaran. Setelah pembayaran tercatat lunas, workflow ditandai selesai. Omzet tervalidasi juga ditandai selesai.

## UX

Register menampilkan kolom Aktivitas terakhir dan Penanggung jawab. Label tindakan diterjemahkan menjadi istilah kerja, waktu disajikan dalam WIB, dan alasan keputusan ditampilkan singkat. Jika catatan lama tidak mempunyai proyeksi waktu, UI menyatakan bahwa waktu belum tercatat dan tetap memakai fallback status secara jujur.

## Batas

- Tahap ini mencakup register omzet dan voucher.
- Penyatuan konteks yang sama untuk setoran, jurnal, HR, persediaan, dan staging tetap pekerjaan lanjutan.
- Delegasi sementara dan SLA per role belum ditetapkan perusahaan.
- UAT pengguna tetap diperlukan.
