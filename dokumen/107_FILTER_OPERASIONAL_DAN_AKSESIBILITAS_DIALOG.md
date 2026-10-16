# Filter Operasional dan Aksesibilitas Dialog

Tanggal: 16 Oktober 2026  
Branch: `REQ`

## Tujuan

Tahap ini menutup hambatan pencarian pada register yang sudah berisi data nyata dan memulai audit keyboard/focus lintas halaman. Divisi Project tetap menjadi acuan visual dan tidak diubah.

## Perubahan Accounting

Rekap Kehadiran tetap menjadi tampilan read-only dari sistem absensi kantor. Halaman sekarang menyediakan:

- pencarian nama pegawai, kode pegawai, dan referensi sumber;
- filter status absensi atau status data cuti;
- jumlah hasil pada halaman aktif;
- keadaan kosong terpisah untuk sumber tanpa data dan filter tanpa hasil;
- reset filter saat pengguna berpindah antara rekap absensi dan riwayat cuti.

Perubahan tidak menambahkan pengajuan, persetujuan, koreksi, atau pembatalan HR di ERP.

## Perubahan Cellular

Kontrol Persediaan sekarang menyediakan dua konteks filter terpisah:

1. Register dokumen dapat dicari berdasarkan nomor dokumen, referensi bukti, jenis transaksi, outlet, periode, dan status.
2. Posisi stok dapat dicari berdasarkan SKU, nama produk, dan outlet serta disaring menjadi stok tersedia atau perlu tindak lanjut.

Jumlah hasil selalu dibandingkan dengan jumlah data sumber. Keadaan sumber kosong dibedakan dari data yang tidak cocok dengan filter.

Detail rekonsiliasi pada Analitik Cellular dipindahkan dari overlay manual ke `DetailSheet`. Komponen ini memakai elemen dialog native dan menangani:

- nama dialog dari heading;
- tombol tutup yang dapat diakses;
- Escape melalui event `cancel`;
- penguncian scroll halaman;
- pemulihan fokus ke tombol `Periksa` setelah dialog ditutup.

Form pencatatan Settlement Finance sebelumnya disisipkan sebagai kartu di antara KPI dan register. Form sekarang dibuka sebagai panel kerja `DetailSheet` sehingga konteks halaman tidak bergeser. Fokus awal diarahkan ke sumber closing dan kanal; tombol simpan tetap mengirim form melalui atribut `form`; ketika panel ditutup, fokus kembali ke tombol `Catat dana` yang membukanya.

`DetailSheet` menerima `initialFocusRef` opsional. Komponen merekam elemen pemicu sebelum memindahkan fokus ke isian pertama, sehingga pemulihan fokus tidak salah merekam elemen di dalam dialog.

Detail Closing H+1 dan form alasan izin terlambat/koreksi juga memakai `DetailSheet`. Detail memakai ukuran panel `2xl` agar rekonsiliasi kanal, PIC, tenggat, dan timeline tetap terbaca dalam satu konteks. Form alasan mengarahkan fokus ke textarea dan mempertahankan validasi minimal 10 karakter sebelum tindakan dapat dikirim.

## Perspektif peran

- **Senior Product Manager:** memprioritaskan penelusuran data operasional dan mempertahankan batas produk HR read-only.
- **Senior Product Designer:** membedakan filter dokumen, filter saldo, keadaan kosong, dan detail agar pengguna memahami konteks kerja.
- **Senior Fullstack Programmer:** menerapkan filter dari data API tanpa hardcode dan menambahkan regresi komponen.
- **Application Security Engineer:** mempertahankan capability role dan memastikan perubahan UI tidak membuka tindakan baru atau melewati validasi backend.

## Verifikasi

- Rekap Kehadiran: 7 tes lulus, lint dan typecheck lulus, pencarian diuji di browser terhadap 28 catatan database.
- Persediaan Cellular: 4 tes lulus, lint dan typecheck lulus.
- Analitik Cellular: 2 tes lulus, termasuk penutupan dialog dan pemulihan fokus; lint dan typecheck lulus.
- Settlement Cellular dan regresi Analitik: 5 tes lulus, termasuk fokus awal form Finance serta pemulihan fokus; lint dan typecheck lulus.
- Closing H+1, Settlement, dan Analitik: 7 tes regresi lulus, termasuk pemulihan fokus detail serta fokus awal alasan izin; lint dan typecheck lulus.
- `git diff --check` lulus pada setiap commit.
- Divisi Project tidak diubah.

## Batas berikutnya

Audit keyboard/focus belum selesai untuk seluruh aplikasi. Overlay manual masih tersedia pada beberapa alur Cellular seperti Kontrol Shift, penjualan, dan persediaan. Masing-masing harus dimigrasikan dan diuji secara bertahap agar perubahan fokus tidak merusak alur transaksi.
