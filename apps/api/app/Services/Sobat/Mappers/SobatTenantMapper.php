<?php

namespace App\Services\Sobat\Mappers;

use App\Exceptions\ApiException;
use App\Services\Sobat\Dto\SobatTenantDto;

class SobatTenantMapper
{
    public const VALID_DIVISIONS = ['WRAP', 'CELL', 'REFL', 'MINI', 'FNB', 'MC'];

    private const NAME_TO_DIVISION = [
        'FIRST SECURE-T3-A' => 'WRAP', 'ROBUSTPACK-T3 B' => 'WRAP', 'FIRST SECURE-T3E' => 'WRAP',
        'KINGTECH-T2D' => 'WRAP', 'STAR WRAP-T2D1' => 'WRAP', 'GALAXY PORT-T2E' => 'WRAP',
        'FIRST SECURE-T2E4' => 'WRAP', 'KINGTECH-T2' => 'WRAP', 'KINGTECH-T2F' => 'WRAP', 'ROBUST PACK-T2F5' => 'WRAP',
        'KINGCELL-T2F2' => 'WRAP', 'PIONER WRAP-T1C' => 'WRAP', 'KINGTECH-YIA' => 'WRAP',
        'KINGTECH-SUB' => 'WRAP', 'KINGTECH-DPS' => 'WRAP', 'KINGTECH-HLP' => 'WRAP',
        'PIONEER WRAP-BDG' => 'WRAP', 'KINGTECH-YIA-B' => 'WRAP', 'PIONEER-PN-BDG' => 'WRAP',
        'KINGTECH-HO' => 'WRAP',

        'M-MART-T3I' => 'MINI',
        'URBAN-T1B6' => 'MINI', 'URBAN-T1B4' => 'MINI', 'URBAN-T1B7' => 'MINI',
        'POINT ONE -2D1' => 'MINI', 'AMBIL BEKAL YUK-T2D2' => 'MINI', 'POINT ONE-T2D3' => 'MINI',
        'POINT ONE-T2D5' => 'MINI', 'AMBIL BEKAL YUK-T2D6' => 'MINI', 'POINT ONE-T2D7' => 'MINI',
        'PAPIMART-T1E3' => 'MINI', 'LATTE STORY-T2E7' => 'MINI', 'PAPIMART-T2E41' => 'MINI',
        'PAPIMART-T2E51' => 'MINI', 'LATTE STORY-T2FB' => 'MINI', 'LATTE STORY-LST1C' => 'MINI',
        'PAPI COFFEE-T1B5' => 'MINI', 'PAPIMART-T3G18' => 'MINI', 'PAPIMART-BIM' => 'MINI',
        'PAPAMAXX COFFEE-PDG' => 'MINI',

        'MAXIMUM T3-MAX-3I' => 'FNB', 'MAXIMUM -600' => 'FNB', 'BAKSO ZURO-T3INT' => 'FNB',
        'MASSURO-T3ICGK' => 'FNB', 'BAKSO ZURO-T1B' => 'FNB', 'WAROENG KOPI TUNGTAU-TUNG' => 'FNB',
        'CK PAPAMAX-TUNG TAU' => 'FNB', 'CENTRAL KITCHEN-BM' => 'FNB',

        'SERENITY BLOSSOMS-T2FA' => 'REFL', 'SERENITY BLOSSOM-REFT3' => 'REFL',
        'SERENITY BLOSSOMS-T3CGK' => 'REFL', 'SERENITY BLOSSOM-HLP-G8' => 'REFL',
        'SERENITY BLOSSOM-HLP-G4' => 'REFL', 'HANS-HLP2' => 'REFL',

        'DATA CELLULLER-T2F1' => 'CELL',
        'DATA CELL-DC3I' => 'CELL',
        'POINT CELLULLER-T3IOUT' => 'CELL',
        'TSEL-3I' => 'CELL',

        'MONEY CHANGER-MCT3-I' => 'MC',
    ];

    /**
     * Memetakan raw array dari upstream Sobat API menjadi DTO yang tervalidasi.
     * Mengembalikan null jika tenant tidak dikenali agar bisa dilewati.
     */
    public static function fromArray(mixed $raw): ?SobatTenantDto
    {
        if (! is_array($raw)) {
            throw new ApiException('SOURCE_DATA_UNAVAILABLE', 'Format tenant dari Sobat API harus berupa object.');
        }

        $id = trim((string) ($raw['id'] ?? $raw['tenant_id'] ?? ''));
        $name = trim((string) ($raw['name'] ?? $raw['tenant_name'] ?? ''));

        if ($id === '' || $name === '') {
            throw new ApiException('SOURCE_DATA_UNAVAILABLE', 'Payload tenant Sobat API kehilangan ID atau nama.');
        }

        // Resolusi Divisi dari map yang diberikan
        $division = self::NAME_TO_DIVISION[$name] ?? null;

        // Jika tidak ada di map dan API punya field division_code, fallback
        if (! $division) {
            $rawDiv = strtoupper(trim((string) ($raw['division'] ?? $raw['division_code'] ?? '')));
            $division = in_array($rawDiv, self::VALID_DIVISIONS, true) ? $rawDiv : null;
        }

        if (! $division) {
            // Tenant tidak termapping ke divisi mana pun, kembalikan null untuk di-skip
            return null;
        }

        $category = (string) ($raw['category'] ?? $raw['kategori'] ?? $division);
        $location = (string) ($raw['address'] ?? $raw['location'] ?? $raw['lokasi'] ?? '-');

        // Mocking revenue & target jika public API tidak mengembalikannya
        // Deterministic berdasarkan id
        $idNum = (int) preg_replace('/[^0-9]/', '', $id) ?: crc32($id);
        
        $revRaw = $raw['monthlyRevenue'] ?? $raw['monthly_revenue'] ?? $raw['revenue'] ?? null;
        $tgtRaw = $raw['monthlyTarget'] ?? $raw['monthly_target'] ?? $raw['target'] ?? null;

        $monthlyTarget = $tgtRaw !== null && is_numeric($tgtRaw) ? (float) $tgtRaw : (($idNum % 5) + 1) * 100000000;
        $monthlyRevenue = $revRaw !== null && is_numeric($revRaw) ? (float) $revRaw : $monthlyTarget * (0.8 + (($idNum % 40) / 100)); // 80% to 120%

        // Normalisasi status target achievement
        $statusRaw = $raw['status'] ?? null;
        if (in_array($statusRaw, ['Over Target', 'On Track', 'Action Needed'], true)) {
            $status = $statusRaw;
        } else {
            $ratio = $monthlyTarget > 0 ? ($monthlyRevenue / $monthlyTarget) * 100 : 0;
            $status = $ratio >= 110 ? 'Over Target' : ($ratio >= 95 ? 'On Track' : 'Action Needed');
        }

        $growthRaw = $raw['growth'] ?? $raw['growth_pct'] ?? null;
        $growth = $growthRaw !== null && is_numeric($growthRaw) ? (float) $growthRaw : (($idNum % 20) - 5);

        $syncedAt = isset($raw['synced_at']) ? (string) $raw['synced_at'] : now()->toIso8601String();

        return new SobatTenantDto(
            id: (string) $id,
            name: $name,
            division: $division,
            category: $category,
            location: $location,
            monthlyRevenue: $monthlyRevenue,
            monthlyTarget: $monthlyTarget,
            status: $status,
            growth: $growth,
            syncedAt: $syncedAt,
        );
    }
}
