# Perbaikan urutan hook layout saat sesi dimuat

Tanggal: 6 Oktober 2026. Peran: Senior Fullstack Programmer. Branch: REQ.

Laporan pengguna: membuka /projects menghasilkan “Rendered more hooks than during the previous render”. Penyebab berada pada AppLayout: useLayoutEffect indikator sidebar dipanggil setelah early return untuk authLoading atau user kosong. Ketika verifikasi sesi selesai, jumlah hook berbeda.

Perbaikan: hitung menu dengan aman untuk user kosong, panggil seluruh hook sebelum early return, kemudian tampilkan loading/redirect atau layout sesuai sesi. Tidak mengubah capability, akun, token atau database.

Regresi baru mencakup loading → user Project valid → loading kembali serta loading → sesi kosong → redirect login. Dua tes layout dan tiga tes dashboard lulus; typecheck dan build lulus. Build masih mengandung warning dependency dan chunk besar yang sudah ada. Pengujian ini tidak menutup utang lint pada layout lama atau backlog keamanan Project.

Verifikasi browser: reload /projects tidak lagi menampilkan error hook. Sesi yang aktif adalah Admin ACC; route sekarang menampilkan penolakan capability view:projects sebagaimana mestinya. Untuk UAT dashboard diperlukan sesi Manager/Admin PROJECT atau BOD. Tidak mengganti role sesi atau melewati pemeriksaan akses.
