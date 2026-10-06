---
id: FND-DB-OPS-001
status: done
---
# Backup restore lokal dan role database

Peran: Senior Fullstack Programmer + Application Security Engineer + Senior Product Manager. TODO-05 / BL-04.

- [x] Backup pg_dump + berkas privat/config dalam AES-GCM; key terpisah, ACL terbatas.
- [x] Restore-check hanya ke database baru; checksum/baris/schema/constraint/index/sequence/berkas dibandingkan dan target latihan dibersihkan.
- [x] Runtime tidak owner/DDL; migrator dipertahankan, monitor read-only tanpa hash password.
- [x] Audit/events append-only runtime; runner migrasi dan sinkronisasi privilege.
- [x] 28 cek privilege, 3 tes parser/guard, tamper rejection, migrator status dan smoke cookie berhasil.
- [x] Dokumentasi TODO/runbook/keamanan/UAT diperbarui.

Selesai teknis lokal. Jadwal/offsite/retensi/key recovery/RPO-RTO/recovery server baru belum ditetapkan. Tidak menimpa database kerja/lama atau mengganti akun login ERP. Bukti: dokumen/26_BACKUP_RESTORE_DAN_ROLE_DATABASE.md.
