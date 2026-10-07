# Laporan Audit Keamanan: Alur Input Omzet

## 1. IDOR & RLS Bypass (Severity: HIGH)
**Ancaman**: Admin dari divisi CELLULAR memanipulasi _payload_ `division_code` saat *submit* omzet, sehingga data masuk ke divisi ACCOUNTING.
**Mitigasi Wajib**:
- Endpoint API dilarang menerima `division_code` dari *request body*. Wajib ambil dari JWT `Context Middleware` server.
- Terapkan *Row-Level Security* (RLS) atau klausa `where('division_code', $userDivision)` di setiap _query_ mutasi.

## 2. Bypass Auto-Lock SLA (Severity: MEDIUM)
**Ancaman**: Admin memundurkan jam/tanggal komputernya (_Client-side spoofing_) agar tombol "Submit" H+1 tidak terkunci.
**Mitigasi Wajib**:
- Validasi waktu (H+1) MUTLAK dilakukan di sisi Backend (Laravel `now()`) berdasarkan zona waktu server (WIB). Frontend hanya mengatur tampilan (kosmetik).

## 3. Excel XXE / Malicious Parsing (Severity: HIGH)
**Ancaman**: Admin mengunggah file `.xlsx` yang disisipi _script_ jahat (XML External Entity) atau _macro_ yang bisa membobol server saat _parsing_.
**Mitigasi Wajib**:
- Gunakan _library_ parsing (PhpSpreadsheet/Maatwebsite) dengan konfigurasi `disable_entity_loader = true`.
- Validasi ketat MIME type (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) dan batasi ukuran file maks 5MB.

## 4. Privilege Escalation / Workflow Bypass (Severity: HIGH)
**Ancaman**: Staff Accounting mem-_bypass_ persetujuan Manager dengan menembak API pembentukan jurnal secara langsung (_cURL/Postman_) meskipun ada selisih omzet.
**Mitigasi Wajib**:
- Backend harus memiliki _State Machine_ (Draft -> Pending Manager -> Approved -> Journaled). Endpoint _Generate Journal_ wajib mengecek: "Jika selisih != 0, periksa ID Approval Manager". Jika kosong, tolak (HTTP 403).
