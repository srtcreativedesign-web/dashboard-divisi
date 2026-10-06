# Alur perubahan: main → branch pekerjaan → PR development

Tanggal: 6 Oktober 2026. Peran: Senior Fullstack Programmer, dengan review Senior Product Manager, Senior Product Designer, Application Security Engineer sesuai perubahan.

Ketentuan pengguna berlaku untuk pekerjaan selanjutnya pada repository `srtcreativedesign-web/dashboard-divisi`.

## Sebelum pekerjaan

1. Periksa branch, remote, status working tree, PR aktif dan perubahan lokal. Jangan menimpa atau menghapus pekerjaan pengguna.
2. Jika working tree belum bersih, simpan checkpoint yang dapat dipulihkan atau gunakan checkout terisolasi. Jangan memasukkan perubahan lama yang tidak terkait ke PR baru. Catat identitas checkpoint; jangan drop stash sebelum hasilnya dipulihkan/tersimpan dengan benar.
3. Fetch origin, pindah ke main dan pull `--ff-only origin main`. Bila main lokal divergen, selidiki; jangan reset hard otomatis. Catat commit main sebagai baseline.
4. Analisis kebutuhan, dokumen acuan, kode, risiko dan UI. Bedakan fakta, usulan, hasil uji dan kebutuhan yang belum ditetapkan.
5. Buat branch baru dari main untuk paket kerja yang jelas, misalnya `fix/project-upload-access` atau `feat/project-dashboard-data`.

## Setiap paket perubahan

1. Sebutkan peran yang sedang dikerjakan pada update pengguna. Implementasikan hanya lingkup paket, update dokumentasi dan lakukan verifikasi yang relevan.
2. Stage file eksplisit; periksa diff dan whitespace. Jangan stage environment, password, dump database, venv, node_modules, vendor, berkas perusahaan atau hasil build.
3. Commit setiap paket perubahan yang koheren, lalu langsung push ke branch pekerjaan. Push pertama memakai upstream. “Langsung push” berarti setelah perubahan tersimpan dalam commit; Git tidak mengirim edit yang belum di-commit.
4. Buat PR ke **development**, dengan head branch pekerjaan. Cantumkan masalah, perubahan, baseline main, hasil uji dan batas yang masih terbuka. Lampirkan PR pada chat. Jika PR sudah ada untuk paket yang sama, push tambahan memperbarui PR tersebut.
5. Jika PR ke development membawa perubahan yang diwarisi main, sebutkan file/commit tersebut. Jangan diam-diam mengubah baseline menjadi development atau menghapus perubahan main untuk menyamarkan diff.
6. Jangan melakukan merge, force push, penghapusan branch atau deployment sebagai bagian otomatis dari instruksi push dan buat PR ini. Tugas saat ini berakhir pada PR yang dapat direview; merge/rilis mengikuti instruksi tersendiri.

## Verifikasi sesuai lingkup

- Dokumen: bukti dan tautan valid, keputusan belum final ditandai, checklist tidak mengklaim implementasi selesai, diff bersih.
- Frontend: typecheck, build dan tes perilaku untuk perubahan yang bermakna; UI desktop/mobile, keyboard, empty/loading/error serta batas role bila terkait.
- Backend: tes endpoint, relasi induk, capability, validasi, transaksi/audit dan konsistensi API sesuai perubahan. Tes memakai database terisolasi; jangan migrate:fresh atau seed database perusahaan untuk pemeriksaan rutin.
- Keamanan: private download, scanner, akses antar objek dan bukti kegagalan tidak meninggalkan state/file yatim bila scope menyentuh unggahan.

Untuk pekerjaan analisis ini, branch adalah `docs/project-main-analysis-2026-10-06`; dokumen utama [44](44_ANALISIS_PROJECT_DAN_UI_MAIN.md). Pekerjaan ERP lokal sebelumnya disimpan dalam stash `062d4e4ac48a318bc59e54bcc96b1d137c5da372` dan tidak menjadi bagian PR ini. Jangan menerapkannya massal ke main: port bagian yang relevan secara terpisah dan verifikasi terhadap perubahan remote.
