# Penelusuran setoran per sumber omzet

7 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer. Scope ENT-03a-2 melengkapi dokumen 48, ditulis sebelum implementasi.

## Perilaku

Pada tiap sumber laporan pencocokan, tautan Buka setoran sumber ini membuka /accounting/setoran?omzet_id=UUID. Daftar memakai sumber tersebut dan semua tanggal setoran, termasuk bulan sesudah omzet; pembatalan tetap terlihat sebagai histori. Pengguna dapat membuka detail, penerimaan dan histori melalui alur lama yang sudah berotorisasi.

Konteks outlet/tanggal bisnis/shift/referensi tampil dari server. Mode per sumber tidak memakai filter bulan setoran. Tautan Semua setoran mengembalikan daftar bulanan biasa. Mode penelusuran tidak membuka form buat setoran baru atau meminta daftar seluruh sumber; pencatatan baru tetap tersedia pada daftar biasa. Pergantian sumber mereset state halaman/panel agar detail sumber sebelumnya tidak tertinggal.

## Kontrak dan batas akses

GET /accounting/deposits menerima omzet_id opsional berbentuk UUID. Tanpa omzet_id, month tetap wajib. Bila sumber dipilih, hasil tidak dibatasi bulan setoran. Pagination tetap maksimal 50, dengan urutan tanggal dan id yang stabil.

Service memeriksa scope ACC dan view:acc_deposits sebelum lookup. Sumber di luar ACC atau tidak ada mengembalikan RESOURCE_NOT_FOUND yang sama. Metadata sumber hanya id, outlet_name, business_date, shift dan source_reference, tanpa field keuangan/AP, actor, notes atau rekening. Daftar/detail setoran tetap mengikuti hak yang sudah ada; tidak menambah kemampuan mutasi atau akses domain lain.

UUID tidak valid ditolak API; UI memberi pesan tanpa mengirim request untuk UUID yang jelas malformed. Tidak mempercayai query URL sebagai otorisasi. Tidak ada migrasi, seed atau posting jurnal.

## Verifikasi yang diperlukan

Uji daftar per sumber lintas bulan, tidak menyertakan setoran sumber lain, metadata allowlist, filter biasa tetap kompatibel, malformed/tidak ada/sumber domain lain dan role tidak berwenang. UI menguji tautan report, konteks server dan pengembalian daftar biasa. Data terisi memakai fixture terisolasi; database native tidak diberi transaksi contoh. ENT-03b jurnal/PNL/HPP/bonus dan UAT tetap terbuka.

## Hasil pelaksanaan

ENT-03a-2 selesai teknis. Tes domain setoran: 17 tes/275 assertions; tes UI setoran dan pencocokan: 11 tes. Mencakup lintas bulan, sumber lain tidak ikut, histori void, pagination 50+1, batas role/domain, UUID tidak valid, konteks server dan reset detail ketika sumber berganti.

Gate `npm run release:check` exit 0: 267 backend/2207 assertions, 118 web, dua contracts, empat guard gate, tiga guard policy, empat guard database dan tiga guard scanner. Lint/typecheck/build/Pint lulus. Build tetap memberi warning chunk Cashflow dan anotasi dependensi Zod yang telah diketahui. Bukti artifacts/release/latest.json mencatat HEAD sebelum commit serta workingTreeDirty=true; bukan kelulusan CI commit akhir.

Probe HTTP native dengan sesi terpisah: UUID malformed 400, sumber tidak ditemukan 404, daftar bulanan 200. Logout probe pertama ditolak CSRF karena header token tidak dikirim; perlindungan tidak dilonggarkan dan sesi browser pengguna tidak diubah. Tidak membuat transaksi contoh atau mengubah skema/database native. Data terisi dibuktikan melalui fixture tes terisolasi, bukan UAT pengguna atau uji konkurensi PostgreSQL. CI remote masih terblokir billing pada ENT-01b. Commit/push REQ tanpa PR.
