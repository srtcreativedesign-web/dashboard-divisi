# Inventaris regresi backend

Tanggal: 6 Oktober 2026. Peran: Senior Fullstack Programmer + Application Security Engineer.
Acuan: BL-02 dan TODO-03. Tes dijalankan pada SQLite in-memory; tidak menulis data bisnis PostgreSQL.

## Hasil

Regresi terkait: 54 tes lulus, 593 assertions (AccountingFoundationTest, MvpAccessTest, MvpBootstrapTest, AccountingMasterDataTest). Formatter empat berkas PHP selesai; git diff --check tidak menemukan error whitespace.

Suite penuh terbaru: 149/212 lulus, 61 gagal, 2 error. Rincian kelompok di bawah adalah inventaris kegagalan, bukan kesimpulan semua kasus boleh dihapus. Hasil lengkap lokal: C:/ERP/backend-regression-2026-10-06.txt dan .xml. Jangan memasukkan output mentah yang berisi identitas/secret bisnis ke Git.

## Kelompok yang perlu ditangani

### AdminAccPolicyTest — 1 kasus

- test_admin_acc_can_manage_master_and_approve_period

### BodOverviewTest — 1 kasus

- test_bod_overview_returns_all_7_divisions_with_correct_structure

### BodReadModelScopeTest — 2 kasus

- test_bod_overview_returns_all_divisions_for_bod_and_only_own_for_manager
- test_bod_executive_read_model_scoped_for_manager

### BodReadModelTest — 1 kasus

- test_executive_read_model_returns_metrics_and_compatible_divisions

### BudgetingTest — 5 kasus

- test_cashflow_menghitung_net_dan_closing_balance
- test_pnl_menghitung_gross_profit_ebitda_dan_net_profit
- test_net_revenue_pnl_selalu_mengikuti_fakta_omzet
- test_budgeting_terisolasi_per_divisi
- test_period_dengan_format_salah_ditolak

### DivisionConfigTest — 2 kasus

- test_get_all_configs_returns_all_division_configs
- test_upsert_division_config_with_manage_permission

### OrgTest — 2 kasus

- test_get_divisions_for_bod_and_manager
- test_get_context_returns_correct_user_scope_context

### PolicyTest — 1 kasus

- test_policy_service_capabilities_matrix

### ReportsTest — 5 kasus

- test_laporan_transaksi_dipecah_per_metode_bayar
- test_laporan_transaksi_tidak_membocorkan_divisi_lain
- test_rekonsiliasi_menghitung_selisih_kasir_vs_rekening
- test_rekonsiliasi_terisolasi_per_divisi
- test_rekonsiliasi_tanpa_data_rekening_menandai_seluruh_omzet_sebagai_selisih

### RevenueBatchUploadTest — 6 kasus

- test_batch_upload_valid_langsung_diposting
- test_batch_upload_dengan_baris_invalid_tidak_memposting_apa_pun
- test_batch_upload_menolak_header_tanpa_kolom_wajib
- test_batch_upload_file_yang_sama_dua_kali_ditolak
- test_batch_upload_koreksi_membuat_versi_baru
- test_batch_upload_menolak_divisi_di_luar_scope

### RevenueTest — 12 kasus

- test_omset_harian_mengembalikan_gross_net_dan_perbandingan_wow
- test_omset_harian_terisolasi_per_divisi
- test_manager_tidak_bisa_meminta_divisi_lain
- test_mtd_menjumlahkan_sejak_awal_bulan
- test_rincian_tenant_menampilkan_target_dan_status
- test_input_omset_harian_menyimpan_rincian_metode_bayar
- test_edit_omset_membuat_versi_baru_dan_menandai_versi_lama_superseded
- test_input_omset_menolak_net_lebih_besar_dari_gross
- test_input_omset_menolak_total_metode_bayar_yang_tidak_cocok
- test_input_omset_outlet_divisi_lain_ditolak
- test_endpoint_omset_butuh_autentikasi
- test_status_tenant_monitor_saat_di_bawah_85_persen

### SobatIntegrationTest — 13 kasus

- test_unauthenticated_request_to_status_returns_401
- test_unauthenticated_request_to_sync_returns_401
- test_status_endpoint_returns_unconfigured_when_no_credentials
- test_status_endpoint_does_not_leak_api_key_or_claim_fake_online_when_configured
- test_sync_endpoint_fails_closed_when_unconfigured_without_fake_data
- test_sync_endpoint_fails_with_validation_error_on_invalid_division_code
- test_sync_endpoint_forbidden_for_user_without_write_revenue_capability
- test_sync_endpoint_rejects_cross_division_access_for_manager_with_scope_violation
- test_sync_endpoint_succeeds_with_upstream_http_fake_and_normalizes_data
- test_manager_sync_scopes_to_own_division
- test_sync_endpoint_fails_closed_on_upstream_500_error_response
- test_sync_endpoint_fails_closed_on_upstream_timeout
- test_sync_endpoint_fails_closed_on_malformed_upstream_response

### TargetTest — 12 kasus

- test_target_bulan_ini_menghitung_persentase_realisasi
- test_run_rate_menghitung_target_harian_sisa
- test_manager_submit_target_lalu_bod_menyetujui
- test_manager_tidak_boleh_approve_target
- test_pengusul_tidak_boleh_menyetujui_targetnya_sendiri
- test_return_target_wajib_menyertakan_catatan
- test_target_yang_sudah_approved_tidak_bisa_diputuskan_lagi
- test_submit_baru_ditolak_saat_versi_terakhir_masih_menunggu
- test_approve_versi_baru_menonaktifkan_versi_approved_sebelumnya
- test_manager_tidak_bisa_membuat_target_outlet_divisi_lain
- test_target_divisi_lain_tidak_terlihat_oleh_manager
- test_bod_mengembalikan_target_yang_dibuat_manager_lalu_manager_submit_versi_baru

## Cara penanganan

1. Cocokkan route, role, sumber dan perilaku terhadap dokumen acuan; fixture legacy tidak mendefinisikan cakupan produk operasional.
2. Endpoint di luar MVP: verifikasi tidak tersedia; jangan menghidupkan modul lama demi tes.
3. Endpoint aktif: verifikasi kontrak, scope/IDOR, query dan transaksi; perbaiki bug sebelum menyesuaikan ekspektasi.
4. Tambahkan fixture eksplisit bila skenario membutuhkan data nyata, jangan membuat angka buatan pada aplikasi.
5. Jalankan regresi yang relevan setelah tiap kelompok. Selesai teknis tidak otomatis berarti UAT bisnis diterima.

Prioritas berikut: kelompok akses/identitas dan read model aktif terlebih dahulu. CMO/pajak/formula yang belum ditentukan tetap bergantung keputusan bisnis.

## Status setelah restrukturisasi

175/175 tes backend lulus (1261 assertions). Enam suite endpoint di luar MVP dikeluarkan dan diganti 16 kasus boundary; BOD/policy/config/organisasi diperbarui sesuai keputusan MVP dan fixture Project. Inventaris 61 kegagalan/dua error di atas adalah riwayat sebelum perubahan, bukan status terbaru. Rincian dampak/source recovery: [restrukturisasi](23_RESTRUKTURISASI_BACKEND_MVP.md). Tidak ada klaim seluruh fitur legacy diganti setara atau UAT bisnis diterima.
