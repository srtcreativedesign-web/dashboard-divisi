# Arsitektur aplikasi dan batas domain

Versi: 0.1 · Tanggal: 6 Oktober 2026
Penanggung jawab penyusunan: Senior Fullstack Programmer
Status: Draf untuk review; bukan persetujuan kebutuhan atau kelayakan produksi.

## Baseline hasil pemeriksaan kode

Monorepo: apps/web React + Vite + TypeScript; apps/api Laravel; packages/contracts untuk tipe envelope. Runtime database PostgreSQL 18 native Windows tanpa Docker. Framework exact version mengikuti lockfiles; dokumen ini tidak menyuruh upgrade dependency.

Browser → API client/TanStack Query → Laravel middleware/controller → service domain → persistence. Organisasi menjadi read service bersama. Accounting, Project dan Cellular mempunyai namespace/fitur terpisah. Modul aplikasi tidak harus mempunyai database fisik terpisah.

## Struktur yang dipertahankan

- Frontend: apps/web/src/features/accounting, projects sesuai struktur yang ada, dan cellular; API client di src/api; capability menu bukan otoritas.
- Backend: controller pada Api/V1/Accounting, Project, Cellular; service business logic; middleware JWT, capability, scope, trace dan envelope.
- Migrasi: folder accounting/projects/cellular/core; tabel baru acc_/prj_/cel_ menurut standar repo. Tabel historis tetap diperiksa sebelum rename/drop.
- API version: api/v1; response sukses/error konsisten. Client 204 tidak memaksa parsing JSON.

## Batas domain dan orkestrasi

Accounting mengambil metadata outlet lewat OrgReadModelService. Transaksi pusat membawa sumber divisi/outlet, bukan menerima grant scope dari body. Sinkronisasi Project/Cellular ke Accounting dilakukan via kontrak service/API dengan identifier sumber, state, versi dan idempotency. Jangan menjadikan query join tabel modul lain sebagai jalan pintas orkestrasi bisnis.

## Transaksi dan concurrency

Omzet/voucher: lockForUpdate + version pada record; event domain ditulis dalam transaksi. AuditService dipakai untuk audit umum; kegagalan audit umum saat ini dapat dilaporkan terpisah dan perlu kebijakan fail-open/fail-closed untuk aksi kritis. Posting lintas proses perlu rancangan idempotency/outbox bila integrasi asinkron dipilih; belum dianggap terimplementasi.

## Deviasi yang perlu review

SOP menghendaki FormRequest/Resource/global scope dan hook terpisah; kode saat ini masih mempunyai validasi inline, JSON melalui envelope middleware, beberapa filter scope service, dan TanStack Query di page. Root CLAUDE menetapkan kontrak runtime berbeda dari sebagian SOP. Tidak mengubahnya diam-diam dalam pekerjaan dokumentasi; buat keputusan kompatibilitas sebelum refactor.

## Kebutuhan nonfungsional yang diusulkan

Target latency, pengguna serentak, ukuran impor, availability, RPO/RTO dan retensi belum ditentukan. Baseline load test harus memakai dataset anonim menyerupai volume sebenarnya. Daftar besar memakai pagination; pekerjaan impor/ekspor berat dapat memakai queue setelah kebutuhan volume jelas. Jangan menjanjikan real-time/high availability dari server pengembangan.

## Lingkungan

Pengembangan sekarang: web 127.0.0.1:5173, API 127.0.0.1:8000, database 127.0.0.1:5432/dashboard_divisi_mvp. DBeaver adalah klien administrasi, bukan server atau lapisan API. Staging/produksi, jaringan, reverse proxy, TLS, worker, backup dan monitoring belum dipilih.

## Kriteria review arsitektur

Kontrak domain jelas, tidak ada akses lintas scope, operasi uang tidak memakai float untuk posting, perubahan schema aman pada PostgreSQL, source data dapat ditelusuri, file privat, dan keputusan kompatibilitas tercatat. Diagram fisik serta kontrak API lampiran membantu reviewer memeriksa baseline tanpa menganggapnya desain final.
