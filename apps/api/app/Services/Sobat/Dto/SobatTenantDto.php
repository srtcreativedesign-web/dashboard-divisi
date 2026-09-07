<?php

namespace App\Services\Sobat\Dto;

class SobatTenantDto
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $division,
        public readonly string $category,
        public readonly string $location,
        public readonly float $monthlyRevenue,
        public readonly float $monthlyTarget,
        public readonly string $status,
        public readonly float $growth,
        public readonly ?string $syncedAt = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'division' => $this->division,
            'category' => $this->category,
            'location' => $this->location,
            'monthlyRevenue' => $this->monthlyRevenue,
            'monthlyTarget' => $this->monthlyTarget,
            'status' => $this->status,
            'growth' => $this->growth,
            'synced_at' => $this->syncedAt,
        ];
    }
}
