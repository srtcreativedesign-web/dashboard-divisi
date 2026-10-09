# Implementasi Persediaan & Gudang Accounting

Tanggal: 10 Oktober 2026
Branch: `REQ`
Peran pelaksana: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer, Application Security Engineer.

## Tujuan

Mengubah capability `view:inventory` dan `write:inventory` yang sebelumnya belum memiliki produk menjadi workflow ERP nyata bagi Admin Gudang Accounting. Kerangka visual mengikuti bahasa Divisi Project tanpa mengubah kode Project.

## Alur dan kewenangan

- Admin Gudang: membuat master barang/lokasi, membuat dan memperbaiki dokumen, lalu mengajukan.
- Manager Accounting: membaca antrean, meminta koreksi dengan alasan, atau menyetujui dan memposting saldo.
- Admin Accounting: membaca persediaan untuk rekap persediaan barang.
- Staff Accounting: membaca persediaan sebagai sumber kontrol dan persiapan HPP.
- Finance, Head Operasional, SPV, Leader, role divisi lain: tidak memperoleh endpoint maupun menu ini.
- Pembuat dokumen dan penyetuju harus berbeda. Hanya pembuat yang dapat mengubah draf/koreksi.

Status dokumen: `draft → submitted → approved` atau `submitted → correction → submitted`. Saldo hanya berubah pada `approved`.

## Objek data

- master barang: SKU, nama, satuan, batas minimum, status aktif, versi;
- lokasi: kode, nama, jenis gudang/outlet, status aktif, versi;
- saldo per barang dan lokasi;
- dokumen `RECEIPT`, `ISSUE`, `TRANSFER`, `STOCK_COUNT`;
- baris barang dokumen;
- mutasi immutable setelah posting.

Seluruh kuantitas disimpan pada skala tiga desimal. Service menghitung dengan unit integer berskala untuk menghindari galat floating point. Posting memakai transaksi database dan row lock. Stok negatif menggagalkan seluruh transaksi.

## UI

Rute: `/accounting/operasional/persediaan`.

Halaman menyediakan:

- header dan hierarchy visual selaras dengan Project;
- KPI barang, lokasi, stok perlu perhatian, dan antrean persetujuan;
- register dokumen dengan status, referensi, lokasi, dan tindakan sesuai role;
- saldo per lokasi dan indikator restok;
- master barang dan lokasi;
- form penerimaan, pengeluaran, transfer, dan stock opname;
- edit draf/koreksi dengan optimistic version;
- state loading, error, empty, terang/gelap, dan layout responsif.

## Data UAT database

Perintah idempotent: `npm run db:seed:inventory`.

Data yang terisi pada database `dashboard_divisi_mvp`: 3 barang, 2 lokasi, 2 dokumen awal, dan 3 saldo. Uji end-to-end menambahkan satu penerimaan yang disetujui; saldo Kertas Thermal pada Gudang Pusat berubah dari `120.000` menjadi `125.000` melalui API, bukan hardcode UI.

## Kontrol keamanan

- capability backend tetap menjadi keputusan utama;
- scope divisi dipaksa ke `ACC`;
- maker-checker dan ownership diterapkan di service;
- version conflict mencegah stale update/approval;
- unique constraint mencegah posting mutasi ganda;
- audit wajib berada di transaksi yang sama dengan mutasi;
- validasi jenis/lokasi/barang/tanggal/jumlah dilakukan di controller dan service;
- query menggunakan Query Builder parameterized;
- stok negatif menyebabkan rollback.

## Bukti verifikasi

- PHP syntax: seluruh file baru dan route lulus;
- policy frontend/backend sinkron;
- migration apply berhasil;
- database verify `44/44`;
- PHPUnit `AccountingInventoryTest`: 3 test, 36 assertion lulus;
- Vitest Inventory + Navigation: 13 test lulus;
- TypeScript typecheck lulus;
- build produksi lulus;
- UAT API: login Admin Gudang, katalog 3/2/3, create → submit → approve, saldo `125.000`;
- UAT API edit: versi `1 → 2`, kuantitas `2.000`, catatan koreksi tersimpan;
- pemeriksaan visual browser: dashboard, register, KPI, dan form tampil benar pada rute final.

## Penilaian sementara

Admin Gudang Accounting naik dari 24/100 menjadi **86/100**. Modul inti sudah nyata dan aman. Nilai belum dinyatakan 90 karena tiga pekerjaan berikut masih harus ditutup:

1. input multi-item pada satu dokumen di UI (backend sudah mendukung sampai 100 baris);
2. bukti lampiran dan berita acara per dokumen;
3. keterlacakan pengeluaran persediaan ke voucher pembelian dan dasar HPP/PNL setelah metode HPP ditetapkan.
