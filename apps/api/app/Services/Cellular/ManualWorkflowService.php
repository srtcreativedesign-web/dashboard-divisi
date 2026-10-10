<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManualWorkflowService
{
    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}

    private function outlets(array $user): array
    {
        $this->policy->assertDivisionScope($user, 'CELL');
        $this->policy->assertCapability($user, 'view:cellular');
        if (($user['divisionCode'] ?? $user['division_code'] ?? null) === 'CELLULAR') {
            $user['divisionCode'] = $user['division_code'] = 'CELL';
        }

        return $this->org->getOutletsForUser($user, 'CELL');
    }

    private function outlet(array $user, string $id): array
    {
        $outlet = collect($this->outlets($user))->firstWhere('id', $id);
        if (! $outlet) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Outlet Cellular tidak ditemukan.');
        }

        return $outlet;
    }

    private function product(string $id): object
    {
        $product = DB::table('cel_products')->where('id', $id)->where('is_active', true)->first();
        if (! $product) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Produk aktif tidak ditemukan.');
        }

        return $product;
    }

    private function recordAudit(array $user, string $action, string $id): void
    {
        $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'Cellular',
            'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.'.$action]);
    }

    public function products(array $user): array
    {
        $this->outlets($user);

        return DB::table('cel_products')->orderBy('sku')->limit(500)->get()->all();
    }

    public function createProduct(array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'manage:cellular_catalog');
        $this->outlets($user);

        return DB::transaction(function () use ($data, $user) {
            $id = (string) Str::uuid();
            $sku = strtoupper(trim($data['sku']));
            if (DB::table('cel_products')->where('sku', $sku)->exists()) {
                throw new ApiException('VERSION_CONFLICT', 'SKU sudah terdaftar.');
            }
            $data['sku'] = $sku;
            DB::table('cel_products')->insert($data + ['id' => $id, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
            $this->recordAudit($user, 'product.created', $id);

            return (array) DB::table('cel_products')->where('id', $id)->first();
        });
    }

    public function stock(array $user): array
    {
        return DB::table('cel_stock_balances as b')->join('cel_products as p', 'p.id', '=', 'b.product_id')
            ->whereIn('b.outlet_id', array_column($this->outlets($user), 'id'))
            ->select('b.*', 'p.sku', 'p.name')->orderBy('p.sku')->limit(500)->get()->all();
    }

    private function movement(string $product, string $outlet, int $delta, string $kind, string $reference, string $key, string $reason, array $user): void
    {
        if (DB::table('cel_stock_movements')->where('source_key', $key)->exists()) {
            throw new ApiException('VERSION_CONFLICT', 'Referensi mutasi sudah dicatat.');
        }
        DB::table('cel_stock_balances')->insertOrIgnore(['id' => (string) Str::uuid(), 'product_id' => $product, 'outlet_id' => $outlet, 'quantity' => 0, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $row = DB::table('cel_stock_balances')->where('product_id', $product)->where('outlet_id', $outlet)->lockForUpdate()->first();
        if ($delta < 0 && $row->quantity < -$delta) {
            throw new ApiException('INVALID_STATE_TRANSITION', 'Stok tidak mencukupi.');
        }
        if ($delta > 0 && $row->quantity > PHP_INT_MAX - $delta) {
            throw new ApiException('VALIDATION_ERROR', 'Jumlah stok melampaui kapasitas.');
        }
        DB::table('cel_stock_balances')->where('id', $row->id)->update(['quantity' => $row->quantity + $delta, 'version' => $row->version + 1, 'updated_at' => now()]);
        DB::table('cel_stock_movements')->insert(['id' => (string) Str::uuid(), 'product_id' => $product, 'outlet_id' => $outlet,
            'quantity_delta' => $delta, 'quantity_after' => $row->quantity + $delta, 'kind' => $kind,
            'reference' => $reference, 'source_key' => $key, 'reason' => $reason, 'actor_id' => $user['sub'], 'created_at' => now()]);
    }

    public function movements(array $filters, array $user): array
    {
        $query = DB::table('cel_stock_movements as m')->join('cel_products as p', 'p.id', '=', 'm.product_id')
            ->whereIn('m.outlet_id', array_column($this->outlets($user), 'id'));
        if (! empty($filters['month'])) {
            $start = CarbonImmutable::createFromFormat('!Y-m', $filters['month'], 'Asia/Jakarta');
            $query->whereBetween('m.created_at', [$start->startOfMonth()->utc(), $start->endOfMonth()->utc()]);
        }
        if (! empty($filters['outlet_id'])) {
            $this->outlet($user, $filters['outlet_id']);
            $query->where('m.outlet_id', $filters['outlet_id']);
        }
        if (! empty($filters['product_id'])) {
            $this->product($filters['product_id']);
            $query->where('m.product_id', $filters['product_id']);
        }
        if (! empty($filters['kind'])) {
            $query->where('m.kind', $filters['kind']);
        }
        if (($filters['direction'] ?? null) === 'IN') {
            $query->where('m.quantity_delta', '>', 0);
        }
        if (($filters['direction'] ?? null) === 'OUT') {
            $query->where('m.quantity_delta', '<', 0);
        }
        if (! empty($filters['q'])) {
            $needle = '%'.str_replace(['%', '_'], ['\\%', '\\_'], trim($filters['q'])).'%';
            $query->where(function ($nested) use ($needle) {
                $nested->where('p.sku', 'like', $needle)->orWhere('p.name', 'like', $needle)
                    ->orWhere('m.reference', 'like', $needle)->orWhere('m.reason', 'like', $needle);
            });
        }

        return $query->select('m.id', 'm.product_id', 'm.outlet_id', 'p.sku', 'p.name', 'p.provider', 'p.variant', 'm.quantity_delta', 'm.quantity_after', 'm.kind', 'm.reference', 'm.reason', 'm.source_key', 'm.actor_id', 'm.created_at')
            ->orderByDesc('m.created_at')->orderByDesc('m.id')->limit(250)->get()->map(function ($row) {
                $prefix = match ($row->kind) {
                    'SALE' => 'sale:',
                    'VOID' => 'void:',
                    default => null,
                };
                $row->source_document_type = match ($row->kind) {
                    'SALE' => 'Penjualan',
                    'VOID' => 'Pembatalan penjualan',
                    default => 'Bukti eksternal',
                };
                $row->source_document_id = $prefix && str_starts_with($row->source_key, $prefix) ? substr($row->source_key, strlen($prefix)) : null;

                return $row;
            })->all();
    }

    public function adjust(array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'write:cellular_stock');
        $this->outlet($user, $data['outlet_id']);
        $this->product($data['product_id']);
        DB::transaction(function () use ($data, $user) {
            $key = hash('sha256', $data['outlet_id'].'|'.$data['product_id'].'|'.strtoupper(trim($data['reference'])));
            $this->movement($data['product_id'], $data['outlet_id'], $data['quantity_delta'], 'ADJUSTMENT', $data['reference'], $key, $data['reason'], $user);
            $this->recordAudit($user, 'stock.adjusted', $key);
        });

        return $this->stock($user);
    }

    private function money(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    public function sales(string $month, array $user): array
    {
        $this->policy->assertCapability($user, 'view:cellular_sales');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);

        return DB::table('cel_manual_sales')->whereIn('outlet_id', array_column($this->outlets($user), 'id'))
            ->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->orderByDesc('business_date')->orderByDesc('created_at')->limit(100)->get()->map(function ($row) {
                $row->unit_price = $this->money($row->unit_price_cents);
                $row->total_amount = $this->money($row->total_cents);
                unset($row->unit_price_cents, $row->total_cents);

                return $row;
            })->all();
    }

    public function sell(array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'write:cellular_sale');
        $outlet = $this->outlet($user, $data['outlet_id']);
        $product = $this->product($data['product_id']);
        if ($data['business_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal penjualan tidak boleh di masa depan.');
        }
        [$whole, $fraction] = array_pad(explode('.', $data['unit_price']), 2, '');
        $cents = (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
        if ($cents > intdiv(99999999999999, $data['quantity'])) {
            throw new ApiException('VALIDATION_ERROR', 'Total penjualan melampaui batas nominal.');
        }
        DB::transaction(function () use ($data, $user, $outlet, $product, $cents) {
            $id = (string) Str::uuid();
            $key = hash('sha256', $data['outlet_id'].'|'.$data['product_id'].'|'.$data['business_date'].'|'.strtoupper(trim($data['reference'])));
            if (DB::table('cel_manual_sales')->where('source_key', $key)->exists()) {
                throw new ApiException('VERSION_CONFLICT', 'Referensi penjualan sudah dicatat.');
            }
            $this->movement($product->id, $outlet['id'], -$data['quantity'], 'SALE', $data['reference'], 'sale:'.$id, 'Penjualan manual', $user);
            DB::table('cel_manual_sales')->insert(['id' => $id, 'product_id' => $product->id, 'outlet_id' => $outlet['id'], 'product_name' => $product->name, 'outlet_name' => $outlet['name'], 'business_date' => $data['business_date'], 'quantity' => $data['quantity'], 'unit_price_cents' => $cents, 'total_cents' => $cents * $data['quantity'], 'source_reference' => $data['reference'], 'source_key' => $key, 'created_by' => $user['sub'], 'status' => 'posted', 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
            $this->recordAudit($user, 'sale.created', $id);
        });

        return $this->sales(substr($data['business_date'], 0, 7), $user);
    }

    public function void(string $id, array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'void:cellular_sale');
        $sale = DB::transaction(function () use ($id, $data, $user) {
            $sale = DB::table('cel_manual_sales')->where('id', $id)->whereIn('outlet_id', array_column($this->outlets($user), 'id'))->lockForUpdate()->first();
            if (! $sale) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Penjualan tidak ditemukan.');
            }
            if ($sale->status !== 'posted' || (int) $sale->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Penjualan sudah berubah atau dibatalkan.');
            }
            $this->movement($sale->product_id, $sale->outlet_id, $sale->quantity, 'VOID', $id, 'void:'.$id, $data['reason'], $user);
            DB::table('cel_manual_sales')->where('id', $id)->update(['status' => 'voided', 'version' => $sale->version + 1, 'voided_by' => $user['sub'], 'void_reason' => $data['reason'], 'updated_at' => now()]);
            $this->recordAudit($user, 'sale.voided', $id);

            return $sale;
        });

        return $this->sales(substr($sale->business_date, 0, 7), $user);
    }
}
