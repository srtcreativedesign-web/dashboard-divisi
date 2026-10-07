# PRD: Alur Input Omzet & Setoran (Modul Accounting)

## 1. Problem Statement
Proses pencatatan omzet harian outlet dan pencocokan dengan laporan Angkasa Pura (AP) rentan telat dan salah. Selisih omzet sering terlewat. Pembuatan jurnal manual lambat.

## 2. Persona
- **Admin**: Eksekutor input omzet (H+1).
- **Staff Accounting**: Validator data omzet dan selisih AP.
- **Manager**: Approver buka *lock* input telat & selisih omzet.

## 3. Goals
- Mengamankan SLA input data H+1 (Otomatis Lock).
- Transparansi selisih omzet (AP vs Outlet) dengan approval Manager.
- Otomatisasi Jurnal Akuntansi saat Staff Accounting memvalidasi.

## 4. User Stories
- Sebagai Admin, saya bisa menginput omzet manual, import Excel, atau tarik dari POS.
- Sebagai Admin, jika lewat H+1, saya bisa meminta Manager membuka *lock* input.
- Sebagai Staff Accounting, saya bisa memvalidasi omzet dan melaporkan selisih AP.
- Sebagai Manager, saya bisa approve selisih omzet agar menjadi "Keuntungan Selisih".

## 5. Fitur
1. **Multi-Source Input**: Form Manual, Import Excel, Sinkronisasi POS.
2. **Auto-Lock H+1 & Override**: Kunci input otomatis, flow *Request Unlock* ke Manager.
3. **Discrepancy Flow**: Deteksi selisih (Outlet vs AP) -> Draft Jurnal -> Approve Manager.
4. **Auto-Journal Engine**: Trigger jurnal Debit/Kredit otomatis saat validasi selesai.

## 6. Requirement
- Sistem wajib mendeteksi jam 00:00 (H+1) berdasarkan zona waktu server.
- File Excel impor wajib divalidasi kolomnya (Template baku).
- Setiap *unlock* dan *approval* wajib masuk log Audit Trail.

## 7. Data Model (Rencana)
- `acc_omzet_records`: Data utama omzet harian.
- `acc_unlock_requests`: Catatan permintaan buka akses input H+1.
- `acc_discrepancies`: Tabel selisih omzet dan status approval.

## 8. Edge Case
- POS API mati saat H+1. (Solusi: Admin pakai import Excel/Manual).
- Manager cuti saat ada selisih. (Solusi: Butuh delegasi approval ke BOD).
- Tanggal input mundur (Backdate). (Solusi: Dilarang keras tanpa approval BOD).

## 9. Metrics
- SLA Input: 95% omzet masuk tepat waktu (H+1).
- Akurasi: 0% selisih AP yang tidak melalui persetujuan Manager.

## 10. Open Questions
- Sistem POS apa yang dipakai saat ini untuk koneksi API?
- Apakah template Excel untuk impor sudah standar/baku?
