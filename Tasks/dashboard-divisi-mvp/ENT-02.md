# ENT-02 — Matriks kewenangan

Status: ENT-02a selesai teknis; matriks final pemilik proses ENT-02b masih terbuka.
Peran: Senior Product Manager, Senior Product Designer, Senior Fullstack Programmer dan Application Security Engineer.

Acuan sebelum kode: [dokumen 47](../../dokumen/47_MATRIKS_KEWENANGAN_TEKNIS.md). Sumber capability backend diekspor ke JSON frontend; policy:check menolak perbedaan, policy:test menguji kontrak/kegagalan dan gate/CI menjalankan keduanya. UI menolak role/domain tidak dikenal tanpa exception dan menormalkan role seperti backend. Tidak menambahkan hak bisnis atau mengubah scope API.

ENT-02b: keputusan pemilik proses tentang field, tindakan, ekspor, delegasi/PIC dan masa berlaku; UAT seluruh role. Belum boleh dianggap final. CI remote masih mempunyai blocker billing akun GitHub yang telah diketahui.

Hasil: gate exit 0, 258 backend/2036 assertions, 111 web, dua contracts, tiga guard policy, empat orkestrasi, empat guard database dan tiga scanner. Sinkronisasi/lint/typecheck/build/Pint lulus, tanpa perubahan database native. Bukti JSON mencatat working tree masih berisi perubahan. Tidak mengklaim CI remote telah berjalan atau penerimaan bisnis telah diberikan.
