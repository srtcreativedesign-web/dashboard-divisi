# FND-LOGIN-LOCAL-004 — Login browser lokal

Status: selesai

Peran: Senior Fullstack Programmer, Application Security Engineer, Senior Product Manager.

Perbaikan: frontend menggunakan API relatif melalui proxy Vite, bukan endpoint absolut pada hostname berbeda. Contoh konfigurasi disediakan.

Validasi: login Manager ACC pada tab Chrome localhost berhasil membuka dashboard; sesi setelah reload tetap diperiksa. Guard Origin/CSRF dipertahankan. Tidak ada perubahan skema atau kredensial.
