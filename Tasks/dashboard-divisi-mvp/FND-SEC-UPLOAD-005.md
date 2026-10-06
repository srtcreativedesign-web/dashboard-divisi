# FND-SEC-UPLOAD-005 — Scanner unggahan

Status: selesai teknis pada tiga endpoint HTTP MVP.

Peran: Application Security Engineer, Senior Fullstack Programmer, Senior Product Manager.

ClamAV native resmi terpasang, karantina privat/cleanup, checksum, error/timeout fail-closed, audit dan command readiness tersedia. Engine sebenarnya dan API menolak EICAR; audit PostgreSQL tercatat. Operasi lokal dilanjutkan: task Windows harian/login, lock scanner satu host, status updater/readiness dan cleanup UUID stale telah diuji. Suite backend terbaru 226 tes / 1607 assertions lulus. Bukti/runbook: dokumen/29_SCANNER_UNGGAHAN_DAN_KARANTINA.md dan dokumen/30_OPERASI_SCANNER_NATIVE.md. Kapasitas deployment multi-host tetap terbuka.
