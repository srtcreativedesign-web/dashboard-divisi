# Fondasi Domain Accounting (ACC) — ISSUE-5

Dokumentasi arsitektur, capability matrix, seed/data, API contract, dan panduan rollback untuk divisi kedelapan `ACC` (Accounting) pada project `dashboard-divisi`.

---

## 1. Organisasi & Metadata Divisi

Divisi Accounting dibentuk sebagai divisi canonical ke-8 dengan kode `ACC` berdampingan dengan 7 divisi operasional retail existing tanpa mengubah semantik maupun perilakunya:

| No | Code | Name | Sort Order | Kategori Domain | Modul Aktif |
|---|---|---|---|---|---|
| 1 | `WRAP` | Wrapping | 1 | Retail Operasional | `dashboard`, `revenue`, `target`, `performance` |
| 2 | `CELL` | Cellular | 2 | Retail Operasional | `dashboard`, `revenue`, `target`, `performance` |
| 3 | `REFL` | Refleksi | 3 | Jasa Operasional | `dashboard`, `revenue`, `performance` |
| 4 | `MINI` | Minimarket | 4 | Retail Operasional | `dashboard`, `revenue`, `target`, `performance`, `workforce` |
| 5 | `FNB` | FnB | 5 | Food & Beverage | `dashboard`, `revenue`, `target` |
| 6 | `FIN` | Finance | 6 | Keuangan Korporat | `dashboard`, `revenue`, `workforce` |
| 7 | `MC` | Money Changer | 7 | Keuangan / Valas | `dashboard`, `forex` |
| 8 | `ACC` | Accounting | 8 | Pembukuan & Arus Kas | `dashboard`, `accounting` |

> **Catatan Penting:** Kode `FIN` tetap eksklusif untuk divisi Finance dan tidak tercampur dengan Accounting (`ACC`).

---

## 2. Matriks Role & Capability

Kewenangan Accounting dibedakan melalui division scope (`ACC`) dan capability khusus berbasis segregation of duties (pemisahan fungsi input dan persetujuan).

| Capability | Deskripsi | Admin ACC | Manager ACC | BOD | Divisi Lain (`WRAP`, dll.) | PIC / No-Cap |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `view:division` | Melihat info divisi | ✅ | ✅ | ✅ | ✅ (Own) | ❌ |
| `manage:division` | Mengatur konfigurasi divisi | ❌ | ✅ | ✅ | ❌ | ❌ |
| `view:acc_report` | Melihat laporan Accounting | ✅ | ✅ | ✅ *(Hanya Disetujui/Ditutup)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `view:acc_journal` | Melihat daftar jurnal aktual | ✅ | ✅ | ❌ | ❌ (403 Scope) | ❌ (403 Cap) |
| `view:acc_master` | Melihat master rekening/kategori | ✅ | ✅ | ❌ | ❌ (403 Scope) | ❌ (403 Cap) |
| `write:acc_transaction` | Input transaksi jurnal aktual | ✅ | ❌ *(SoD)* | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `import:acc_transaction` | Unggah & impor transaksi | ✅ | ❌ *(SoD)* | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `write:acc_outstanding` | Input kewajiban outstanding | ✅ | ❌ *(SoD)* | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `write:acc_bank` | Input saldo akhir bank | ✅ | ❌ *(SoD)* | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `submit:acc_period` | Mengajukan periode untuk review | ✅ | ❌ *(SoD)* | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `manage:acc_master` | Kelola kategori & rekening | ❌ *(SoD)* | ✅ | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `manage:acc_period` | Kontrol periode (buka/tutup) | ❌ *(SoD)* | ✅ | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |
| `approve:acc_period` | Menyetujui periode Accounting | ❌ *(SoD)* | ✅ | ❌ *(No mutation)* | ❌ (403 Scope) | ❌ (403 Cap) |

### Prinsip Keamanan & Isolasi:
1. **Segregation of Duties (SoD):** Admin ACC bertindak sebagai pencatat/operator transaksi dan tidak dapat menyetujui periode; Manager ACC bertindak sebagai reviewer/approver dan tidak dapat melakukan entri transaksi langsung.
2. **BOD Read-Only Constraint:** BOD hanya dapat membaca laporan ACC yang telah berstatus `Disetujui` atau `Ditutup`. BOD dilarang keras melakukan mutasi, entri, impor, pengelolaan master, maupun persetujuan periode. Percobaan mutasi oleh BOD menghasilkan `403 FORBIDDEN_CAPABILITY`.
3. **Cross-Division Isolation:** Akses langsung pengguna divisi lain ke endpoint Accounting ditolak di level middleware dengan `403 SCOPE_VIOLATION` dan diaudit ke `audit_events`.
4. **Anonymous Rejection:** Seluruh rute protected menolak akses tanpa token dengan `401 AUTH_REQUIRED`.

---

## 3. Data & Akun Seed Anonim

### Identitas Pengguna Seed
- **Manager ACC:**
  - Email: `manager.acc@dashboard.test`
  - Nama: `Manager Accounting`
  - Role: `MANAGER`
  - Divisi: `ACC`
- **Admin ACC:**
  - Email: `admin.acc@dashboard.test`
  - Nama: `Admin Accounting`
  - Role: `ADMIN`
- **Outlet Anonim:**
  - Kode: `ACC-001`
  - Nama: `Accounting Pusat (Anonim)`
  - *Catatan:* Dibuat secara otomatis mengikuti generator seeder iterasi seluruh divisi untuk fixture default outlet, bukan master data cabang baru.

### Aturan Keamanan Zero Secrets
- Password seed menggunakan environment variable `SEED_DEFAULT_PASSWORD` (default testing: `Password123!`). Tidak ada password plaintext atau credential produksi yang tertanam di source code.
- Seluruh seeder menggunakan pola `firstOrCreate` / `updateOrCreate` sehingga eksekusi berulang bersifat **100% idempotent** tanpa menggandakan divisi, akun, ataupun outlet.

---

## 4. Kontrak Respons API

### Respons Sukses Query (HTTP 200)
Contoh respon query status/laporan (`GET /api/v1/accounting/status`):
```json
{
  "data": {
    "divisionCode": "ACC",
    "divisionName": "Accounting",
    "status": "ACTIVE",
    "phase": "PHASE_1_FOUNDATION",
    "enabledModules": ["dashboard", "accounting"],
    "enabledKpis": ["accounting.balance"]
  },
  "meta": {
    "trace_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  },
  "links": {
    "self": "/api/v1/accounting/status"
  }
}
```

### Respons Mutasi Terkunci Tahap 1 (HTTP 422 `STAGE_LOCKED`)
Pada Tahap 1 (Fondasi), endpoint mutasi (`POST /api/v1/accounting/transactions`, `POST /api/v1/accounting/periods/approve`) telah dilengkapi validasi input dan policy middleware, namun belum melakukan persistensi data dan mengembalikan respon fail-closed `STAGE_LOCKED`:
```json
{
  "error": {
    "code": "STAGE_LOCKED",
    "message": "Persistensi transaksi jurnal Accounting terkunci pada Tahap 1 Fondasi (tersedia pada tahap implementasi jurnal berikutnya).",
    "trace_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

### Respons Error Standar (HTTP 400 / 401 / 403 / 404 / 422 / 500)
Format envelope error standar:
```json
{
  "error": {
    "code": "SCOPE_VIOLATION",
    "message": "Akses ditolak untuk divisi ACC (user MANAGER/WRAP)",
    "trace_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```

---

## 5. Cara Menjalankan Migration & Seed

### Menjalankan Seeder
```bash
# Di direktori apps/api
php artisan db:seed --force
```

### Uji Idempotency Seeder
```bash
php artisan db:seed --force
php artisan db:seed --force
```

---

## 6. Prosedur Rollback

Jika perubahan Tahap 1 perlu dibatalkan:
1. **Rollback Git:**
   Kembalikan commit ke commit sebelum `feat/ISSUE-5-accounting-foundation`:
   ```bash
   git revert <commit-sha>
   ```
2. **Rollback Data Seed ACC:**
   Jalankan query / artisan tinker untuk menghapus divisi ACC dan relasinya tanpa menyentuh 7 divisi existing:
   ```php
   use App\Models\Division;
   use App\Models\User;
   use App\Models\Outlet;
   use App\Models\DivisionConfig;
   use App\Models\UserScope;

   $acc = Division::where('code', 'ACC')->first();
   if ($acc) {
       Outlet::where('division_id', $acc->id)->delete();
       DivisionConfig::where('division_id', $acc->id)->delete();
       UserScope::where('division_id', $acc->id)->delete();
       User::where('division_code', 'ACC')->delete();
       $acc->delete();
   }
   ```
3. **Verifikasi Pemulihan:**
   Jalankan regression tests untuk membuktikan 7 divisi existing (`WRAP`, `CELL`, `REFL`, `MINI`, `FNB`, `FIN`, `MC`) kembali ke baseline.

---

## 7. Known Risks & Scope yang Ditunda

Pekerjaan berikut sengaja tidak diimplementasikan pada Tahap 1 dan dijadwalkan pada tahap berikutnya:
- **Tahap 2 (ISSUE-6):** Data master (Periode, kategori B/C/D, alias 2a -> B2a, rekening, relasi outlet C25).
- **Tahap 3 (ISSUE-7):** Jurnal aktual, saldo berjalan, upload bukti, soft-cancel, dan audit trail mutasi.
- **Tahap 4 (ISSUE-8):** Impor transaksi all-or-nothing, staging/preview, duplicate detection, atomic commit.
- **Tahap 5 (ISSUE-9):** Outstanding liabilities & realisasi pembayaran.
- **Tahap 6 (ISSUE-10):** Laporan Penjelasan Cashflow & Cashflow lengkap serta drill-down ke transaksi sumber.
- **Tahap 7 (ISSUE-11):** Saldo akhir bank, rekonsiliasi selisih, dan mekanisme tutup buku periode.
- **Tahap 8 (ISSUE-12):** Integrasi UI lengkap dan QA visual menyeluruh.
