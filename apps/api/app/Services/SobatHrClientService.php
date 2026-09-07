<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Services\Sobat\Contracts\SobatClientInterface;
use App\Services\Sobat\Mappers\SobatTenantMapper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SobatHrClientService implements SobatClientInterface
{
    protected ?string $baseUrl;

    protected ?string $endpoint;

    protected ?string $apiKey;

    protected ?string $companyId;

    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.sobathr.base_url') ?: null;
        $this->endpoint = config('services.sobathr.outlets_endpoint') ?: '/tenants';
        $this->apiKey = config('services.sobathr.api_key') ?: null;
        $this->companyId = config('services.sobathr.company_id') ?: null;
        $this->timeout = (int) config('services.sobathr.timeout', 10);
    }

    public function isConfigured(): bool
    {
        // Public API might not need API key or company ID, so we just check base URL
        return ! empty($this->baseUrl);
    }

    public function getStatus(): array
    {
        $isConfigured = $this->isConfigured();

        return [
            'provider' => 'Sobat API',
            'configured' => $isConfigured,
            'status' => $isConfigured ? 'CONFIGURED' : 'UNCONFIGURED',
            'base_url' => $this->baseUrl,
            'has_api_key' => ! empty($this->apiKey),
            'has_company_id' => ! empty($this->companyId),
            'last_sync' => null,
            'scheduler' => 'MANUAL_ONLY',
        ];
    }

    public function fetchTenantSync(?string $divisionCode = null): array
    {
        if (! $this->isConfigured()) {
            throw new ApiException(
                'SOURCE_DATA_UNAVAILABLE',
                'Integrasi Sobat API belum dikonfigurasi. Pastikan variabel environment SOBAT_API_BASE_URL telah diisi.'
            );
        }

        $fullUrl = "{$this->baseUrl}{$this->endpoint}";

        try {
            $query = [];
            if ($divisionCode !== null && $divisionCode !== '') {
                $query['division_code'] = $divisionCode;
            }

            $req = Http::timeout($this->timeout)->withoutVerifying()->withHeaders([
                'Accept' => 'application/json',
            ]);

            if ($this->apiKey) {
                $req = $req->withToken($this->apiKey);
            }
            if ($this->companyId) {
                $req = $req->withHeaders(['X-Company-ID' => $this->companyId]);
            }

            $response = $req->get($fullUrl, $query);
        } catch (\Throwable $e) {
            Log::warning('Gagal menghubungi upstream Sobat API', [
                'endpoint' => $fullUrl,
                'division_code' => $divisionCode,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
            ]);

            throw new ApiException(
                'SOURCE_DATA_UNAVAILABLE',
                'Gagal berkomunikasi dengan upstream API Sobat (timeout atau koneksi terputus).'
            );
        }

        if ($response->failed()) {
            Log::warning('Upstream Sobat API merespons dengan status error', [
                'status' => $response->status(),
                'division_code' => $divisionCode,
            ]);

            throw new ApiException(
                'SOURCE_DATA_UNAVAILABLE',
                "Upstream API Sobat mengembalikan status error: {$response->status()}"
            );
        }

        $json = $response->json();
        if (! is_array($json)) {
            throw new ApiException(
                'SOURCE_DATA_UNAVAILABLE',
                'Format response dari upstream API Sobat tidak valid (bukan JSON array/object).'
            );
        }

        // Upstream public API sometimes returns data directly as array or wrapped in 'data'
        $rawItems = $json['data'] ?? $json['tenants'] ?? $json;
        if (! is_array($rawItems)) {
            throw new ApiException(
                'SOURCE_DATA_UNAVAILABLE',
                'Format response dari upstream API Sobat tidak memuat daftar tenant yang valid.'
            );
        }

        $tenants = [];
        foreach ($rawItems as $rawItem) {
            if (! is_array($rawItem)) continue;

            $dto = SobatTenantMapper::fromArray($rawItem);
            
            // Skip unmapped tenants
            if (! $dto) {
                continue;
            }

            // Filter by division code if requested
            if ($divisionCode !== null && $divisionCode !== '' && $dto->division !== $divisionCode) {
                continue;
            }
            
            $tenants[] = $dto->toArray();
        }

        return [
            'provider' => 'Sobat API',
            'source' => 'LIVE_SOBAT_API',
            'division_code' => $divisionCode,
            'total_tenants' => count($tenants),
            'synced_at' => now()->toIso8601String(),
            'tenants' => $tenants,
        ];
    }
}
