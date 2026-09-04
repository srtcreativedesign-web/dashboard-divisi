<?php

namespace Database\Seeders;

use App\Models\AccountingAccount;
use App\Models\AccountingAccountOutlet;
use App\Models\AccountingCategory;
use App\Models\AccountingCategoryAlias;
use App\Models\Division;
use App\Models\Outlet;
use App\Services\AccCategoryService;
use Illuminate\Database\Seeder;

class AccMasterSeeder extends Seeder
{
    public const CATEGORIES = [
        ['code' => 'B1', 'name' => 'PENDAPATAN ATAS SALES', 'parent' => 'B', 'display_order' => 1, 'requires_outlet' => false],
        ['code' => 'B2', 'name' => 'PENDAPATAN JASA MANAGEMENT', 'parent' => 'B', 'display_order' => 2, 'requires_outlet' => false],
        ['code' => 'B2a', 'name' => 'Processing & Gudang', 'parent' => 'B', 'display_order' => 3, 'requires_outlet' => false],
        ['code' => 'B2b', 'name' => 'Konsesi', 'parent' => 'B', 'display_order' => 4, 'requires_outlet' => false],
        ['code' => 'B2c', 'name' => 'Jasa Manajemen', 'parent' => 'B', 'display_order' => 5, 'requires_outlet' => false],
        ['code' => 'B2d', 'name' => 'Sewa Ruang', 'parent' => 'B', 'display_order' => 6, 'requires_outlet' => false],
        ['code' => 'B2e', 'name' => 'Surcharge', 'parent' => 'B', 'display_order' => 7, 'requires_outlet' => false],
        ['code' => 'B2f', 'name' => 'Jampel', 'parent' => 'B', 'display_order' => 8, 'requires_outlet' => false],
        ['code' => 'B2g', 'name' => 'Utilitas & Kargo', 'parent' => 'B', 'display_order' => 9, 'requires_outlet' => false],
        ['code' => 'B2h', 'name' => 'Reimbursement', 'parent' => 'B', 'display_order' => 10, 'requires_outlet' => false],
        ['code' => 'B3', 'name' => 'PENDAPATAN LAIN-LAIN', 'parent' => 'B', 'display_order' => 11, 'requires_outlet' => false],
        ['code' => 'B3a', 'name' => 'Piutang Antar Departement', 'parent' => 'B', 'display_order' => 12, 'requires_outlet' => false],
        ['code' => 'B3b', 'name' => 'Pendapatan Bunga Bank', 'parent' => 'B', 'display_order' => 13, 'requires_outlet' => false],
        ['code' => 'B3c', 'name' => 'Pinjaman dari Departement', 'parent' => 'B', 'display_order' => 14, 'requires_outlet' => false],
        ['code' => 'B3d', 'name' => 'Pinjaman dari Bank', 'parent' => 'B', 'display_order' => 15, 'requires_outlet' => false],
        ['code' => 'B3e', 'name' => 'Lain-Lain', 'parent' => 'B', 'display_order' => 16, 'requires_outlet' => false],
        ['code' => 'C1', 'name' => 'Tagihan PT Angkasa Pura Indonesia', 'parent' => 'C', 'display_order' => 1, 'requires_outlet' => false],
        ['code' => 'C2', 'name' => 'Tagihan KSO HLP', 'parent' => 'C', 'display_order' => 2, 'requires_outlet' => false],
        ['code' => 'C3', 'name' => 'Tagihan PT Angkasa Pura Aviasi', 'parent' => 'C', 'display_order' => 3, 'requires_outlet' => false],
        ['code' => 'C4', 'name' => 'Tagihan Koperasi Jasa Karyawan Angkasa (Kokapura)', 'parent' => 'C', 'display_order' => 4, 'requires_outlet' => false],
        ['code' => 'C5', 'name' => 'Tagihan Koperasi Satya Ardhia (KSA)', 'parent' => 'C', 'display_order' => 5, 'requires_outlet' => false],
        ['code' => 'C6', 'name' => 'Tagihan PT Integrasi Aviasi Solusi (Kargo)', 'parent' => 'C', 'display_order' => 6, 'requires_outlet' => false],
        ['code' => 'C7', 'name' => 'PT Tagihan Trans Aviasi Sinergi (MDC)', 'parent' => 'C', 'display_order' => 7, 'requires_outlet' => false],
        ['code' => 'C8', 'name' => 'Tagihan Lain-lain', 'parent' => 'C', 'display_order' => 8, 'requires_outlet' => false],
        ['code' => 'C9', 'name' => 'Franchise Fee', 'parent' => 'C', 'display_order' => 9, 'requires_outlet' => false],
        ['code' => 'C10', 'name' => 'Royalty Fee', 'parent' => 'C', 'display_order' => 10, 'requires_outlet' => false],
        ['code' => 'C11', 'name' => 'Komisi', 'parent' => 'C', 'display_order' => 11, 'requires_outlet' => false],
        ['code' => 'C12', 'name' => 'Pengembalian Dana (Mitra/ Bank)', 'parent' => 'C', 'display_order' => 12, 'requires_outlet' => false],
        ['code' => 'C13', 'name' => 'Gaji , THR & Insentif Karyawan Lapangan', 'parent' => 'C', 'display_order' => 13, 'requires_outlet' => false],
        ['code' => 'C13a', 'name' => 'Gaji Karyawan Lapangan', 'parent' => 'C', 'display_order' => 14, 'requires_outlet' => false],
        ['code' => 'C13b', 'name' => 'Insentif Karyawan Lapangan', 'parent' => 'C', 'display_order' => 15, 'requires_outlet' => false],
        ['code' => 'C13c', 'name' => 'THR Karyawan Lapangan', 'parent' => 'C', 'display_order' => 16, 'requires_outlet' => false],
        ['code' => 'C14', 'name' => 'Service Charge Karyawan Lapangan', 'parent' => 'C', 'display_order' => 17, 'requires_outlet' => false],
        ['code' => 'C15', 'name' => 'Pinjaman', 'parent' => 'C', 'display_order' => 18, 'requires_outlet' => false],
        ['code' => 'C15a', 'name' => 'Pinjaman Departement', 'parent' => 'C', 'display_order' => 19, 'requires_outlet' => false],
        ['code' => 'C15b', 'name' => 'Pinjaman Karyawan/ Kasbon', 'parent' => 'C', 'display_order' => 20, 'requires_outlet' => false],
        ['code' => 'C16', 'name' => 'Pembayaran Angsuran Hutang Leasing', 'parent' => 'C', 'display_order' => 21, 'requires_outlet' => false],
        ['code' => 'C16a', 'name' => 'Adira Finance', 'parent' => 'C', 'display_order' => 22, 'requires_outlet' => false],
        ['code' => 'C16b', 'name' => 'Mitsui Leasing', 'parent' => 'C', 'display_order' => 23, 'requires_outlet' => false],
        ['code' => 'C17', 'name' => 'Pembayaran Angsuran Hutang Bank', 'parent' => 'C', 'display_order' => 24, 'requires_outlet' => false],
        ['code' => 'C17a', 'name' => 'BRI', 'parent' => 'C', 'display_order' => 25, 'requires_outlet' => false],
        ['code' => 'C17b', 'name' => 'Mandiri', 'parent' => 'C', 'display_order' => 26, 'requires_outlet' => false],
        ['code' => 'C17c', 'name' => 'PNM', 'parent' => 'C', 'display_order' => 27, 'requires_outlet' => false],
        ['code' => 'C17d', 'name' => 'BFI', 'parent' => 'C', 'display_order' => 28, 'requires_outlet' => false],
        ['code' => 'C18', 'name' => 'Pembayaran Hutang Ke Departement', 'parent' => 'C', 'display_order' => 29, 'requires_outlet' => false],
        ['code' => 'C19', 'name' => 'Pembayaran Hutang Lain-lain', 'parent' => 'C', 'display_order' => 30, 'requires_outlet' => false],
        ['code' => 'C20', 'name' => 'Belanja Ke Supplier/Distributor', 'parent' => 'C', 'display_order' => 31, 'requires_outlet' => false],
        ['code' => 'C21', 'name' => 'Petty Cash', 'parent' => 'C', 'display_order' => 32, 'requires_outlet' => false],
        ['code' => 'C22', 'name' => 'Biaya Marketing', 'parent' => 'C', 'display_order' => 33, 'requires_outlet' => false],
        ['code' => 'C22a', 'name' => 'Marketing - Investasi Operasional Tenant', 'parent' => 'C', 'display_order' => 34, 'requires_outlet' => false],
        ['code' => 'C22b', 'name' => 'Marketing - Investasi Operasional Umum', 'parent' => 'C', 'display_order' => 35, 'requires_outlet' => false],
        ['code' => 'C22c', 'name' => 'Marketing - Investasi Pra Operasional', 'parent' => 'C', 'display_order' => 36, 'requires_outlet' => false],
        ['code' => 'C23', 'name' => 'Zakat Maal', 'parent' => 'C', 'display_order' => 37, 'requires_outlet' => false],
        ['code' => 'C24', 'name' => 'BPJS Ketenagakerjaan & Kesehatan', 'parent' => 'C', 'display_order' => 38, 'requires_outlet' => false],
        ['code' => 'C25', 'name' => 'PB 1', 'parent' => 'C', 'display_order' => 39, 'requires_outlet' => true],
        ['code' => 'C26', 'name' => 'Biaya Pajak', 'parent' => 'C', 'display_order' => 40, 'requires_outlet' => false],
        ['code' => 'C26a', 'name' => 'PPh 21', 'parent' => 'C', 'display_order' => 41, 'requires_outlet' => false],
        ['code' => 'C26b', 'name' => 'PPh Unifikasi 23 & 4(2)', 'parent' => 'C', 'display_order' => 42, 'requires_outlet' => false],
        ['code' => 'C26c', 'name' => 'PPN', 'parent' => 'C', 'display_order' => 43, 'requires_outlet' => false],
        ['code' => 'C26d', 'name' => 'PPh Ps. 25', 'parent' => 'C', 'display_order' => 44, 'requires_outlet' => false],
        ['code' => 'C26e', 'name' => 'PPh Ps. 29', 'parent' => 'C', 'display_order' => 45, 'requires_outlet' => false],
        ['code' => 'C26f', 'name' => 'Surat Tagihan Pajak', 'parent' => 'C', 'display_order' => 46, 'requires_outlet' => false],
        ['code' => 'C27', 'name' => 'Biaya Mess Karyawan', 'parent' => 'C', 'display_order' => 47, 'requires_outlet' => false],
        ['code' => 'C28', 'name' => 'Biaya Operasional', 'parent' => 'C', 'display_order' => 48, 'requires_outlet' => false],
        ['code' => 'C29', 'name' => 'Biaya Project & Maintenance', 'parent' => 'C', 'display_order' => 49, 'requires_outlet' => false],
        ['code' => 'C29a', 'name' => 'Biaya Renovasi', 'parent' => 'C', 'display_order' => 50, 'requires_outlet' => false],
        ['code' => 'C29b', 'name' => 'Biaya Perbaikan', 'parent' => 'C', 'display_order' => 51, 'requires_outlet' => false],
        ['code' => 'C29c', 'name' => 'Biaya Gaji Tukang', 'parent' => 'C', 'display_order' => 52, 'requires_outlet' => false],
        ['code' => 'C30', 'name' => 'Biaya Bank', 'parent' => 'C', 'display_order' => 53, 'requires_outlet' => false],
        ['code' => 'C31', 'name' => 'Biaya Lain-lain', 'parent' => 'C', 'display_order' => 54, 'requires_outlet' => false],
        ['code' => 'C32', 'name' => 'Saving', 'parent' => 'C', 'display_order' => 55, 'requires_outlet' => false],
        ['code' => 'C32a', 'name' => 'THR', 'parent' => 'C', 'display_order' => 56, 'requires_outlet' => false],
        ['code' => 'C32b', 'name' => 'Gaji Karyawan', 'parent' => 'C', 'display_order' => 57, 'requires_outlet' => false],
        ['code' => 'C32c', 'name' => 'Bonus', 'parent' => 'C', 'display_order' => 58, 'requires_outlet' => false],
        ['code' => 'D1', 'name' => 'Tagihan Virtual Office', 'parent' => 'D', 'display_order' => 1, 'requires_outlet' => false],
        ['code' => 'D2', 'name' => 'Gaji , THR & Insentif Karyawan', 'parent' => 'D', 'display_order' => 2, 'requires_outlet' => false],
        ['code' => 'D2a', 'name' => 'Gaji Karyawan Departement', 'parent' => 'D', 'display_order' => 3, 'requires_outlet' => false],
        ['code' => 'D2b', 'name' => 'Gaji Karyawan Support', 'parent' => 'D', 'display_order' => 4, 'requires_outlet' => false],
        ['code' => 'D2c', 'name' => 'THR Karyawan Departement', 'parent' => 'D', 'display_order' => 5, 'requires_outlet' => false],
        ['code' => 'D2d', 'name' => 'THR Karyawan Support', 'parent' => 'D', 'display_order' => 6, 'requires_outlet' => false],
        ['code' => 'D2e', 'name' => 'Bonus Karyawan Departement', 'parent' => 'D', 'display_order' => 7, 'requires_outlet' => false],
        ['code' => 'D2f', 'name' => 'Bonus Karyawan Support', 'parent' => 'D', 'display_order' => 8, 'requires_outlet' => false],
        ['code' => 'D2g', 'name' => 'Insentif Karyawan Departement', 'parent' => 'D', 'display_order' => 9, 'requires_outlet' => false],
        ['code' => 'D2h', 'name' => 'Insentif Karyawan Support', 'parent' => 'D', 'display_order' => 10, 'requires_outlet' => false],
        ['code' => 'D3', 'name' => 'Service Charge Karyawan', 'parent' => 'D', 'display_order' => 11, 'requires_outlet' => false],
        ['code' => 'D4', 'name' => 'Pinjaman', 'parent' => 'D', 'display_order' => 12, 'requires_outlet' => false],
        ['code' => 'D4a', 'name' => 'Pinjaman Departement/Divisi', 'parent' => 'D', 'display_order' => 13, 'requires_outlet' => false],
        ['code' => 'D4b', 'name' => 'Pinjaman Karyawan/ Kasbon', 'parent' => 'D', 'display_order' => 14, 'requires_outlet' => false],
        ['code' => 'D5', 'name' => 'Office Charge', 'parent' => 'D', 'display_order' => 15, 'requires_outlet' => false],
        ['code' => 'D6', 'name' => 'Prive', 'parent' => 'D', 'display_order' => 16, 'requires_outlet' => false],
        ['code' => 'D7', 'name' => 'Biaya Mess Karyawan', 'parent' => 'D', 'display_order' => 17, 'requires_outlet' => false],
        ['code' => 'D8', 'name' => 'Biaya Bank', 'parent' => 'D', 'display_order' => 18, 'requires_outlet' => false],
        ['code' => 'D9', 'name' => 'Biaya Lain-lain', 'parent' => 'D', 'display_order' => 19, 'requires_outlet' => false],
        ['code' => 'D10', 'name' => 'Saving', 'parent' => 'D', 'display_order' => 20, 'requires_outlet' => false],
        ['code' => 'D10a', 'name' => 'THR', 'parent' => 'D', 'display_order' => 21, 'requires_outlet' => false],
        ['code' => 'D10b', 'name' => 'Gaji Karyawan', 'parent' => 'D', 'display_order' => 22, 'requires_outlet' => false],
        ['code' => 'D10c', 'name' => 'Bonus', 'parent' => 'D', 'display_order' => 23, 'requires_outlet' => false],
    ];

    public const CATEGORY_ALIASES = [
        'B2a' => ['2a'],
        'C14' => ['14c'],
        'C25' => ['25c'],
        'C30' => ['30c'],
    ];

    public const ACCOUNT_TYPES = [
        'ASSET' => [
            ['code' => 'ACC-1001', 'display_name' => 'Kas Kecil', 'category' => 'B2a', 'description' => 'Kas operasional ACC', 'display_order' => 1],
            ['code' => 'ACC-1002', 'display_name' => 'Piutang Usaha', 'category' => 'B3a', 'description' => 'Piutang antar departement', 'display_order' => 2],
            ['code' => 'ACC-1003', 'display_name' => 'Persediaan', 'category' => 'B2a', 'description' => 'Persediaan barang ACC', 'display_order' => 3],
            ['code' => 'ACC-1004', 'display_name' => 'Aset Tetap', 'category' => 'D1', 'description' => 'Peralatan dan aset tetap ACC', 'display_order' => 4],
        ],
        'LIABILITY' => [
            ['code' => 'ACC-2001', 'display_name' => 'Utang Usaha', 'category' => null, 'description' => 'Utang kepada supplier', 'display_order' => 5],
            ['code' => 'ACC-2002', 'display_name' => 'Utang Jangka Panjang', 'category' => 'C16a', 'description' => 'Pinjaman jangka panjang Adira', 'display_order' => 6],
        ],
        'EQUITY' => [
            ['code' => 'ACC-3001', 'display_name' => 'Modal Disetor', 'category' => null, 'description' => 'Modal disetor pemilik', 'display_order' => 7],
            ['code' => 'ACC-3002', 'display_name' => 'Laba Ditahan', 'category' => null, 'description' => 'Laba ditahan dari operasional', 'display_order' => 8],
        ],
        'REVENUE' => [
            ['code' => 'ACC-4001', 'display_name' => 'Pendapatan Jasa Management', 'category' => 'B2', 'description' => 'Pendapatan jasa manajemen ACC', 'display_order' => 9],
            ['code' => 'ACC-4002', 'display_name' => 'Pendapatan Bunga Bank', 'category' => 'B3b', 'description' => 'Pendapatan bunga bank', 'display_order' => 10],
        ],
        'EXPENSE' => [
            ['code' => 'ACC-5001', 'display_name' => 'PB 1 Outlet', 'category' => 'C25', 'description' => 'Beban PB 1 per outlet', 'requires_outlet' => true, 'display_order' => 11],
            ['code' => 'ACC-5002', 'display_name' => 'Biaya Bank', 'category' => 'C30', 'description' => 'Biaya administrasi bank', 'display_order' => 12],
        ],
    ];

    public function run(): void
    {
        $acc = Division::where('code', 'ACC')->first();
        if (! $acc) {
            $this->command?->warn('Divisi ACC tidak ditemukan. Jalankan DatabaseSeeder terlebih dahulu.');

            return;
        }

        $outlet = Outlet::where('code', 'ACC-001')->first();
        $categoryIdMap = [];

        foreach (self::CATEGORIES as $catData) {
            $category = AccountingCategory::updateOrCreate(
                ['code' => $catData['code']],
                [
                    'name' => $catData['name'],
                    'parent' => $catData['parent'],
                    'display_order' => $catData['display_order'],
                    'is_active' => true,
                    'requires_outlet' => $catData['requires_outlet'],
                    'version' => '1.0',
                ]
            );
            $categoryIdMap[$catData['code']] = $category->id;
        }

        foreach (self::CATEGORY_ALIASES as $canonicalCode => $aliases) {
            $categoryId = $categoryIdMap[$canonicalCode] ?? null;
            if (! $categoryId) {
                continue;
            }

            foreach ($aliases as $aliasCode) {
                $normalizedAlias = AccCategoryService::normalizeAliasCode($aliasCode);
                AccountingCategoryAlias::updateOrCreate(
                    ['normalized_alias' => $normalizedAlias],
                    [
                        'alias_code' => trim($aliasCode),
                        'canonical_id' => $categoryId,
                    ]
                );
            }
        }

        foreach (self::ACCOUNT_TYPES as $accountType => $accounts) {
            foreach ($accounts as $accountData) {
                $categoryId = null;
                if (! empty($accountData['category'])) {
                    $categoryId = $categoryIdMap[$accountData['category']] ?? null;
                }

                $account = AccountingAccount::updateOrCreate(
                    [
                        'division_id' => $acc->id,
                        'code' => $accountData['code'],
                    ],
                    [
                        'display_name' => $accountData['display_name'],
                        'type' => $accountType,
                        'is_active' => true,
                        'category_id' => $categoryId,
                        'description' => $accountData['description'] ?? null,
                        'display_order' => $accountData['display_order'] ?? 0,
                        'version' => '1.0',
                    ]
                );

                if (! empty($accountData['requires_outlet']) && $outlet) {
                    AccountingAccountOutlet::updateOrCreate(
                        [
                            'account_id' => $account->id,
                            'outlet_id' => $outlet->id,
                        ],
                        [
                            'division_id' => $acc->id,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }
    }
}
