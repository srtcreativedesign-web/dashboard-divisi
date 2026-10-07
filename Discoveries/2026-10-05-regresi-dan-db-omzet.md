# Temuan implementasi omzet

ScopeMiddleware lama mengambil divisi dari outlet sebelum domain Accounting. Alur omzet pusat kini menentukan ACC lebih dahulu untuk endpoint omzet saja; outlet sumber dapat lintas divisi. Payload divisi tetap tidak memberi izin di luar penugasan akun.

Regresi backend lengkap masih memiliki 64 kegagalan dan 2 error dari ekspektasi lama (modul retail, role, jumlah divisi, dan data laporan contoh). Tes tersebut tidak dihapus agar pekerjaan penyelarasan tetap terlihat. Seluruh tes modul MVP yang dipilih, termasuk omzet, lulus.

PostgreSQL proyek 127.0.0.1:5433 menolak koneksi. Service PostgreSQL Windows tersedia, namun koneksi proyek tidak diganti ke service/database lain. Migrasi baru hanya dijalankan dalam SQLite pengujian, belum pada database persisten.
