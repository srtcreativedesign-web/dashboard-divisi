<?php

namespace App\Services\Sobat\Contracts;

interface SobatClientInterface
{
    /**
     * Cek apakah kredensial dan endpoint Sobat API terkonfigurasi.
     */
    public function isConfigured(): bool;

    /**
     * Dapatkan status konfigurasi dan konektivitas integrasi Sobat tanpa mengekspos rahasia.
     *
     * @return array{provider: string, configured: bool, status: string, base_url: ?string, has_api_key: bool, has_company_id: bool, last_sync: ?string, scheduler: string}
     */
    public function getStatus(): array;

    /**
     * Tarik dan sinkronisasi data tenant dari upstream Sobat API.
     *
     * @return array{provider: string, source: string, division_code: ?string, total_tenants: int, synced_at: string, tenants: array<int, array<string, mixed>>}
     */
    public function fetchTenantSync(?string $divisionCode = null): array;
}
