# Register keputusan, risiko dan pertanyaan

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Product Manager + Application Security Engineer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Konfirmasi pengguna

Lokasi final; Accounting/Project/Cellular; delapan role; Accounting pusat; H+1 23.59; tanpa Docker; izin database baru dan akun uji; dokumentasi sebelum pengembangan berikutnya. Konfirmasi ini tidak otomatis menyetujui seluruh aturan implementasi.

## DEC-01 — Batas rilis

Status: Tiga divisi pasti; kedalaman fitur/rilis belum final.
Pemilik keputusan usulan: Pemilik bisnis.
Penyelesaian: Pilih backlog dan AC.
Persetujuan detail: belum dicatat.

## DEC-02 — CMO

Status: Makna/output belum ditentukan; riset tidak mengidentifikasi laporan internal.
Pemilik keputusan usulan: Accounting.
Penyelesaian: Contoh anonim, tujuan, sumber, periode dan formula.
Persetujuan detail: belum dicatat.

## DEC-03 — Scope pusat

Status: Accounting lintas divisi pasti; tenant/outlet, delegasi dan pemisahan tugas belum final.
Pemilik keputusan usulan: Manager.
Penyelesaian: Review hak objek dan aktor.
Persetujuan detail: belum dicatat.

## DEC-04 — H+1

Status: 23.59 WIB pasti; izin Manager 24 jam sekali pakai adalah pilihan implementasi.
Pemilik keputusan usulan: Manager/Accounting.
Penyelesaian: Review pengecualian dan shift lintas hari.
Persetujuan detail: belum dicatat.

## DEC-05 — Keuangan

Status: COA, periode, pengakuan, koreksi, bonus dan formula belum disahkan.
Pemilik keputusan usulan: Accounting/Finance.
Penyelesaian: Rekonsiliasi contoh anonim.
Persetujuan detail: belum dicatat.

## DEC-06 — Pajak/selisih AP

Status: PB1 10% label pengguna; hukum/objek/tarif dan perlakuan selisih belum diverifikasi.
Pemilik keputusan usulan: Pemilik bisnis/Accounting.
Penyelesaian: Verifikasi sumber aturan/kontrak; selisih bukan otomatis laba.
Persetujuan detail: belum dicatat.

## DEC-07 — Project

Status: Tujuh fitur dari dokumen lama; detail progres/termin/vendor/RAB belum dikonfirmasi.
Pemilik keputusan usulan: Manager Project.
Penyelesaian: Discovery dan hubungan Finance.
Persetujuan detail: belum dicatat.

## DEC-08 — Cellular

Status: Produk kartu perdana/aksesori, stok jumlah dan laporan manual dikonfirmasi pengguna. Katalog/stok/penjualan manual awal diterapkan; pemasok, transfer/retur/settlement dan margin belum final.
Pemilik keputusan usulan: Manager Cellular.
Penyelesaian: Pilih alur inti dan sumber data.
Persetujuan detail: belum dicatat.

## DEC-09 — Integrasi

Status: Format Ecsys/AP/outlet dan kewenangan pengiriman belum tersedia.
Pemilik keputusan usulan: Pemilik integrasi.
Penyelesaian: Spesifikasi/contoh anonim, ID dan rekonsiliasi.
Persetujuan detail: belum dicatat.

## DEC-10 — Keamanan/operasional

Status: Token localStorage/file publik lama perlu review; retensi/RPO/RTO belum dipilih.
Pemilik keputusan usulan: Pemilik data/security.
Penyelesaian: Review sesi, file, backup dan least privilege.
Persetujuan detail: belum dicatat.

## DEC-11 — Pedoman

Status: SOP/code berbeda; gambar aturan pengguna tidak tersedia pada konteks ini.
Pemilik keputusan usulan: Pemilik bisnis/tim teknis.
Penyelesaian: Bandingkan sumber sebelum klaim kepatuhan penuh.
Persetujuan detail: belum dicatat.

## DEC-12 — BOD/Finance

Status: BOD pembaca lintas domain ada di kode; FINANCE adalah Staff Finance.
Pemilik keputusan usulan: Pemilik bisnis.
Penyelesaian: Review role tambahan BOD dan hak Finance.
Persetujuan detail: belum dicatat.

## Risiko dan mitigasi

- R-01 angka laporan salah: tetapkan formula/sumber dan rekonsiliasi sebelum release.
- R-02 akses lintas scope/self approval: cek objek/aktor, audit dan tes negatif.
- R-03 duplikasi/nominal tertimpa: source key, decimal, transaksi, version lock dan riwayat.
- R-04 token/file bocor: sesi direview, file privat, redaksi log dan migrasi legacy.
- R-05 scope tumbuh: batas rilis/backlog serta review requirement sebelum kode.
- R-06 kehilangan data: backup terenkripsi dan restore terukur.

Risiko tetap terbuka sampai bukti mitigasi/penerimaan dicatat. Jangan mencatat persetujuan atas nama pengguna.

## Jawaban pengguna terbaru — 6 Oktober 2026

DEC-05: basis pengakuan pendapatan, HPP/persediaan dan rumus bonus belum ditetapkan, sesuai jawaban pengguna. Tidak memilih metode FIFO/rata-rata atau membuat formula bonus sepihak.

DEC-08: kartu perdana beberapa provider (contoh Telkomsel/XL/Indosat), varian harga/kuota dan aksesori HP; stok jumlah barang; laporan manual. Bagian discovery ini selesai. Scope teknis awal katalog/stok/penjualan ada pada dokumen 39; settlement/retur/pembelian/margin belum final.

DEC-02: tujuan/kolom/sumber/penerima CMO belum ditentukan pengguna. Tidak mengubah istilah tersebut menjadi laporan lain berdasarkan dugaan.

Izin melanjutkan implementasi tanpa approval tidak menetapkan rumus bisnis, durasi retensi atau alamat deployment/offsite.
