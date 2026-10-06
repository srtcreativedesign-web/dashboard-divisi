# Dashboard Project berbasis data tercatat

Tanggal: 6 Oktober 2026. Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

Branch kerja: **REQ**, tracking origin/REQ. Instruksi terbaru pengguna menggantikan branch baru per paket: setiap paket perubahan di-commit dan langsung di-push ke REQ, lalu PR ke development. Jangan memasukkan stash ERP sebelumnya atau file environment/venv ke commit.

## Perubahan

- Menghapus risiko acak, progres tetap 68,4%, pertumbuhan tetap 12,5%, aktivitas pembayaran/vendor fiktif, dan tombol log tanpa fungsi.
- Endpoint baru `GET /api/v1/projects/dashboard`, sebelum route `/{id}`, mengikuti JWT, scope dan capability `view:projects`. Query hanya mengambil division_code PROJECT; role dari divisi lain yang tidak punya capability tetap ditolak.
- Agregat seluruh proyek dihitung server, tidak lagi berdasarkan 100 baris pertama. Response: as_of, total_projects, active_projects, active_contract_value (string), average_recorded_progress (nullable), progress_covered_projects, status_counts, overdue_projects, attention_projects (maksimal 5), monthly_trend (6 bulan).
- Proyek aktif berarti status in_progress. Nilai kontrak aktif adalah jumlah kontrak proyek berstatus tersebut, bukan pendapatan atau laba. Tidak menampilkan pertumbuhan kuartal karena baseline belum tersedia.
- Progres tercatat adalah rata-rata sederhana progres berbobot milestone setiap proyek aktif dengan total bobot 100% (toleransi numerik 0,0001). Proyek tanpa milestone/bobot lengkap tidak masuk rata-rata; jumlah proyek yang tercakup ditampilkan. Tidak ada data valid menghasilkan null/“Belum tersedia”, bukan 0%. Ini belum verifikasi pekerjaan atau approval baseline.
- Perhatian berasal dari proyek aktif yang memiliki milestone dengan due_date sebelum hari ini di WIB, actual_percentage < 100 dan status bukan completed. Milestone jatuh tempo hari ini belum dianggap terlambat. Proyek on_hold tidak otomatis dianggap terlambat. Lima tautan prioritas diurutkan jumlah milestone terlambat lalu ID untuk hasil stabil.
- Tren memakai created_at, batas awal/akhir bulan WIB dikonversi UTC untuk query. Akumulasi adalah record yang masih ada menurut tanggal pencatatan, bukan histori proyek yang pernah dihapus atau pendapatan bulanan.
- UI menampilkan timestamp WIB, nominal rupiah rinci, cakupan progres, angka status/tren yang dapat dibaca tanpa grafik, serta error/retry terpisah dari kondisi kosong. Respons lama diabaikan setelah retry/unmount.

## Verifikasi

- Backend ProjectDashboardTest + ProjectFeatureTest: **15 tes, 84 assertions lulus** pada SQLite in-memory. Dataset 121 proyek, pengecualian divisi asing, progress coverage, keterlambatan WIB, hasil stabil, batas bulan WIB, 401/403 dan BOD baca diuji.
- Frontend ProjectDashboardPage.test.tsx: **3 tes lulus**; agregat/cakupan/nominal/tautan, error-retry tanpa nol palsu, dan progres tidak tersedia.
- Typecheck dan build frontend lulus. Build tetap memberi warning anotasi dependency dan chunk besar yang sudah ada.
- ESLint halaman dashboard dan tes barunya lulus. Pemeriksaan empat file frontend terdampak menemukan **15 penggunaan any yang sudah ada** pada api/projects.ts dan types/project.ts; tidak ada any baru. Pemeriksaan tersebut belum hijau dan utang tipe tidak ditandai selesai.
- Pint diterapkan ke controller dan tes backend baru. Tidak menjalankan migrasi/seed pada database PostgreSQL perusahaan; endpoint memakai tabel yang sudah ada.

Belum dilakukan UAT visual desktop/mobile/keyboard atau uji runtime PostgreSQL. Tes frontend memakai fixture dan mock grafik; bukan bukti render grafik di browser produksi. Schema main/REQ harus sudah tersedia pada backend yang menjalankan endpoint ini.

## Todo dan batas scope

- [x] PRJ-A01: hapus angka/aktivitas simulasi dashboard dan tampilkan definisi data.
- [x] Bagian dashboard PRJ-A02: agregat penuh dan tren tanpa batas pagination, error/retry yang jelas.
- [ ] Sisa PRJ-A02: pagination/search/race condition daftar proyek dan pemilih proyek; belum berubah dalam paket ini.
- [ ] PRJ-A08: metode multipart update expense dan parsing respons 204; paket berikutnya.
- [ ] PRJ-A03/A04/A05/A06: relasi anak, private download/scanner, actor uploader dan capability UI; tetap prioritas keamanan terbuka.
- [ ] PRJ-A07/A09: pembayaran Finance, semantik laba, baseline bobot/tanggal, audit dan approval; tidak boleh dianggap selesai karena dashboard berubah.
- [ ] PRJ-A10: UAT aksesibilitas/visual, konsistensi komponen dan performa seluruh Project.

Referensi temuan: [dokumen analisis pada commit d0cbf43](https://github.com/srtcreativedesign-web/dashboard-divisi/blob/d0cbf43de01acb45452766230285470f049eafea/dokumen/44_ANALISIS_PROJECT_DAN_UI_MAIN.md). Dokumen 44 berada pada PR analisis terpisah, tidak di-copy bersama seluruh perubahan main ke REQ.
