# Sumber, glosarium dan riset CMO

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Senior Fullstack Programmer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Hirarki bukti

Percakapan pengguna: kebutuhan/keputusan. Kode/schema/API: implementasi aktual, bukan approval bisnis. Dokumen repository: konteks perlu rekonsiliasi. Sumber resmi eksternal: pedoman/istilah, bukan definisi internal perusahaan.

Ditinjau: AGENTS.md, CLAUDE.md, SOP, docs/MVP_SCOPE.md, OMZET_WORKFLOW.md, VOUCHER_WORKFLOW.md, LOCAL_DATABASE.md, UI_UAT.md; Documents/Project/PRD_DIVISI_PROJECT.md; dokumen Admin lama; source web/API, policy, migration dan route. Admin lama mengandung Refleksi/terapis di luar MVP. Referensi DD/API versi lama yang tidak ditemukan tidak diklaim telah dibaca. Gambar aturan pengguna tidak tersedia dalam konteks penyusunan; belum bisa menyatakan kepatuhan penuh.

Lampiran read-only 6 Oktober 2026 memuat metadata tanpa baris bisnis/secret. Metadata tetap internal karena menggambarkan struktur sistem.

## Riset CMO

Pengguna belum menentukan kepanjangan/output. Pencarian CMO dengan accounting/financial report/contribution margin dan sumber ERP resmi tidak mengidentifikasi laporan internal perusahaan. Tidak cukup bukti menamai CMO sebagai Contribution Margin Outlet atau laporan lainnya.

SAP memakai CMO sebagai Chief Marketing Officer pada konteks korporat; singkatan saja tidak menentukan pekerjaan Accounting ini. [SAP News 8 April 2024](https://news.sap.com/japan/2024/04/0408-rise-with-sap-migration-and-modernaization-program/). Ini bukan keputusan mengaitkan kebutuhan pengguna dengan marketing. Riset lanjutan membutuhkan contoh hasil anonim, tujuan, penanggung jawab, periode, sumber dan rumus; baru domain/istilah yang tepat dapat ditelusuri.

## Glosarium

- Role: tanggung jawab; capability: tindakan diizinkan; scope: batas objek/divisi.
- Divisi: ACC, PROJECT, CELL; Accounting pusat: layanan lintas divisi sesuai batas akses.
- Outlet: unit operasional; tenant: dimensi laporan, relasi persis dengan outlet belum diputuskan.
- Omzet: penjualan menurut sumber; laba: pendapatan dikurangi beban menurut kebijakan; selisih laporan bukan otomatis laba.
- H+1: hari berikutnya menurut WIB. Voucher: dokumen permintaan/tagihan/pembelian; approval bukan bukti paid/stok diterima.
- PNL: laba rugi; COA: daftar akun; jurnal: pencatatan berpasangan; periode: rentang pencatatan/tutup buku.
- Hutang/piutang: kewajiban/tagihan belum diselesaikan; cashflow: arus kas terverifikasi.
- PB1 10%: label kebutuhan, bukan tarif/hukum yang sudah diverifikasi. Ecsys: sistem sumber, format/produk belum diketahui.
- RAB: rencana anggaran biaya; milestone: titik hasil; termin: tahap tagihan/pembayaran kontrak.
- UAT: penerimaan pengguna; RPO: kehilangan data ditoleransi; RTO: waktu pemulihan; DBeaver: client database.

## Referensi resmi teknis

[OWASP HTML5 Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html), [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [PostgreSQL 18 Backup](https://www.postgresql.org/docs/18/backup-dump.html). Penggunaan dibahas pada dokumen keamanan/operasional; bukan klaim sertifikasi atau backup produksi selesai.
