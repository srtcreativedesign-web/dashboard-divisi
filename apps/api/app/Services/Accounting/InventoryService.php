<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryService
{
    public function __construct(private PolicyService $policy, private AuditService $audit) {}

    private function access(array $user, string $capability = 'view:inventory'): void
    {
        $this->policy->assertDivisionScope($user, 'ACC', $capability !== 'view:inventory');
        $this->policy->assertCapability($user, $capability);
    }

    public function catalog(array $user): array
    {
        $this->access($user);
        $items = DB::table('acc_inventory_items')->orderBy('name')->get()->map(fn ($r) => (array) $r)->all();
        $locations = DB::table('acc_inventory_locations')->orderBy('name')->get()->map(fn ($r) => (array) $r)->all();
        $balances = DB::table('acc_inventory_balances as b')->join('acc_inventory_items as i', 'i.id', '=', 'b.item_id')->join('acc_inventory_locations as l', 'l.id', '=', 'b.location_id')
            ->select('b.*', 'i.sku', 'i.name as item_name', 'i.unit', 'i.minimum_stock', 'l.code as location_code', 'l.name as location_name')->orderBy('i.name')->orderBy('l.name')->get()->map(fn ($r) => (array) $r)->all();

        return ['items' => $items, 'locations' => $locations, 'balances' => $balances];
    }

    public function createItem(array $data, array $user): array
    {
        $this->access($user, 'write:inventory');

        return DB::transaction(function () use ($data, $user) {
            $id = (string) Str::uuid();
            $now = now();
            DB::table('acc_inventory_items')->insert(['id' => $id, 'sku' => strtoupper(trim($data['sku'])), 'name' => trim($data['name']), 'unit' => trim($data['unit']), 'minimum_stock' => $data['minimum_stock'], 'active' => $data['active'] ?? true, 'version' => 1, 'created_at' => $now, 'updated_at' => $now]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'AccountingInventoryItem', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.inventory.item_created']);

            return (array) DB::table('acc_inventory_items')->where('id', $id)->first();
        });
    }

    public function createLocation(array $data, array $user): array
    {
        $this->access($user, 'write:inventory');

        return DB::transaction(function () use ($data, $user) {
            $id = (string) Str::uuid();
            $now = now();
            DB::table('acc_inventory_locations')->insert(['id' => $id, 'code' => strtoupper(trim($data['code'])), 'name' => trim($data['name']), 'kind' => $data['kind'], 'active' => $data['active'] ?? true, 'version' => 1, 'created_at' => $now, 'updated_at' => $now]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'AccountingInventoryLocation', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.inventory.location_created']);

            return (array) DB::table('acc_inventory_locations')->where('id', $id)->first();
        });
    }

    public function documents(string $month, array $user): array
    {
        $this->access($user);
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);
        $rows = DB::table('acc_inventory_documents as d')->leftJoin('acc_inventory_locations as s', 's.id', '=', 'd.source_location_id')->leftJoin('acc_inventory_locations as t', 't.id', '=', 'd.destination_location_id')->leftJoin('acc_vouchers as v', 'v.id', '=', 'd.voucher_id')
            ->whereBetween('d.business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])->select('d.*', 's.name as source_location_name', 't.name as destination_location_name', 'v.voucher_no', 'v.entity_name as voucher_entity_name', 'v.source_reference as voucher_source_reference', 'v.amount as voucher_amount')->orderByDesc('d.business_date')->orderByDesc('d.created_at')->get();
        $ids = $rows->pluck('id');
        $lines = empty($ids->all()) ? collect() : DB::table('acc_inventory_document_lines as x')->join('acc_inventory_items as i', 'i.id', '=', 'x.item_id')->whereIn('x.document_id', $ids)->select('x.*', 'i.sku', 'i.name as item_name', 'i.unit')->orderBy('i.name')->get()->groupBy('document_id');

        return ['items' => $rows->map(function ($r) use ($lines) {
            $a = (array) $r;
            $a['lines'] = ($lines[$r->id] ?? collect())->map(fn ($x) => (array) $x)->values()->all();

            return $a;
        })->all(), 'month' => $month];
    }

    public function purchaseVouchers(string $month, array $user): array
    {
        $this->access($user);
        $start = CarbonImmutable::createFromFormat('!Y-m', $month);

        return DB::table('acc_vouchers as v')->leftJoin('acc_inventory_documents as d', 'd.voucher_id', '=', 'v.id')
            ->where('v.division_code', 'ACC')->where('v.type', 'PURCHASING')->where('v.status', 'approved')
            ->whereBetween('v.voucher_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->select('v.id', 'v.voucher_no', 'v.voucher_date', 'v.due_date', 'v.entity_name', 'v.source_reference', 'v.amount', 'v.outlet_name', 'v.source_division_code')
            ->selectRaw('count(d.id) as receipt_count')->selectRaw("sum(case when d.status = 'approved' then 1 else 0 end) as posted_receipt_count")
            ->groupBy('v.id', 'v.voucher_no', 'v.voucher_date', 'v.due_date', 'v.entity_name', 'v.source_reference', 'v.amount', 'v.outlet_name', 'v.source_division_code')
            ->orderByDesc('v.voucher_date')->orderBy('v.voucher_no')->get()->map(fn ($r) => (array) $r)->all();
    }

    private function location(?string $id): ?object
    {
        if (! $id) {
            return null;
        } $row = DB::table('acc_inventory_locations')->where('id', $id)->where('active', true)->first();
        if (! $row) {
            throw new ApiException('VALIDATION_ERROR', 'Lokasi persediaan tidak aktif atau tidak ditemukan.');
        }

return $row;
    }

    private function validateLocations(string $kind, ?object $source, ?object $destination): void
    {
        $valid = match ($kind) {
            'RECEIPT' => ! $source && (bool) $destination,
            'ISSUE','STOCK_COUNT' => (bool) $source && ! $destination,
            'TRANSFER' => (bool) $source && (bool) $destination && $source->id !== $destination->id,
            default => false,
        };
        if (! $valid) {
            throw new ApiException('VALIDATION_ERROR', 'Lokasi asal/tujuan tidak sesuai jenis dokumen.');
        }
    }

    private function voucher(string $kind, ?string $id): ?object
    {
        if (! $id) {
            return null;
        }
        if ($kind !== 'RECEIPT') {
            throw new ApiException('VALIDATION_ERROR', 'Voucher pembelian hanya dapat dihubungkan ke dokumen penerimaan.');
        }
        $voucher = DB::table('acc_vouchers')->where('id', $id)->where('division_code', 'ACC')->where('type', 'PURCHASING')->where('status', 'approved')->first();
        if (! $voucher) {
            throw new ApiException('VALIDATION_ERROR', 'Voucher pembelian tidak ditemukan atau belum disetujui.');
        }

        return $voucher;
    }

    public function createDocument(array $data, array $user): array
    {
        $this->access($user, 'write:inventory');
        if ($data['business_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal dokumen tidak boleh di masa depan WIB.');
        }

        return DB::transaction(function () use ($data, $user) {
            $source = $this->location($data['source_location_id'] ?? null);
            $destination = $this->location($data['destination_location_id'] ?? null);
            $this->validateLocations($data['kind'], $source, $destination);
            $voucher = $this->voucher($data['kind'], $data['voucher_id'] ?? null);
            $itemIds = array_column($data['lines'], 'item_id');
            if (count($itemIds) !== count(array_unique($itemIds))) {
                throw new ApiException('VALIDATION_ERROR', 'Satu barang hanya boleh muncul sekali dalam dokumen.');
            }
            $known = DB::table('acc_inventory_items')->whereIn('id', $itemIds)->where('active', true)->pluck('id')->all();
            if (count($known) !== count($itemIds)) {
                throw new ApiException('VALIDATION_ERROR', 'Salah satu barang tidak aktif atau tidak ditemukan.');
            }
            foreach ($data['lines'] as $line) {
                if ($data['kind'] === 'STOCK_COUNT' && ! array_key_exists('counted_quantity', $line)) {
                    throw new ApiException('VALIDATION_ERROR', 'Stock opname membutuhkan jumlah hasil hitung.');
                } if ($data['kind'] !== 'STOCK_COUNT' && empty($line['quantity'])) {
                    throw new ApiException('VALIDATION_ERROR', 'Jumlah mutasi harus lebih dari nol.');
                }
            }
            $id = (string) Str::uuid();
            $now = now();
            $number = 'INV-'.$data['business_date'].'-'.strtoupper(Str::random(6));
            DB::table('acc_inventory_documents')->insert(['id' => $id, 'document_number' => $number, 'kind' => $data['kind'], 'source_location_id' => $source?->id, 'destination_location_id' => $destination?->id, 'voucher_id' => $voucher?->id, 'business_date' => $data['business_date'], 'reference' => trim($data['reference']), 'notes' => $data['notes'] ?? null, 'status' => 'draft', 'created_by' => $user['sub'], 'version' => 1, 'created_at' => $now, 'updated_at' => $now]);
            foreach ($data['lines'] as $line) {
                DB::table('acc_inventory_document_lines')->insert(['id' => (string) Str::uuid(), 'document_id' => $id, 'item_id' => $line['item_id'], 'quantity' => $data['kind'] === 'STOCK_COUNT' ? null : $line['quantity'], 'counted_quantity' => $data['kind'] === 'STOCK_COUNT' ? $line['counted_quantity'] : null]);
            }
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'AccountingInventoryDocument', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.inventory.document_created', 'metadata' => ['kind' => $data['kind'], 'documentNumber' => $number, 'voucherId' => $voucher?->id]]);

            return $this->one($id);
        });
    }

    private function one(string $id): array
    {
        $r = DB::table('acc_inventory_documents as d')->leftJoin('acc_inventory_locations as s', 's.id', '=', 'd.source_location_id')->leftJoin('acc_inventory_locations as t', 't.id', '=', 'd.destination_location_id')->leftJoin('acc_vouchers as v', 'v.id', '=', 'd.voucher_id')->where('d.id', $id)->select('d.*', 's.name as source_location_name', 't.name as destination_location_name', 'v.voucher_no', 'v.entity_name as voucher_entity_name', 'v.source_reference as voucher_source_reference', 'v.amount as voucher_amount')->first();
        if (! $r) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen persediaan tidak ditemukan.');
        } $a = (array) $r;
        $a['lines'] = DB::table('acc_inventory_document_lines as x')->join('acc_inventory_items as i', 'i.id', '=', 'x.item_id')->where('x.document_id', $id)->select('x.*', 'i.sku', 'i.name as item_name', 'i.unit')->get()->map(fn ($x) => (array) $x)->all();

        return $a;
    }

    public function updateDocument(string $id, array $data, array $user): array
    {
        $this->access($user, 'write:inventory');
        if ($data['business_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal dokumen tidak boleh di masa depan WIB.');
        }

        return DB::transaction(function () use ($id, $data, $user) {
            $doc = DB::table('acc_inventory_documents')->where('id', $id)->lockForUpdate()->first();
            if (! $doc) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen persediaan tidak ditemukan.');
            }
            if (! in_array($doc->status, ['draft', 'correction'], true) || $doc->created_by !== $user['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pembuat yang dapat memperbaiki draf atau dokumen koreksi.');
            }
            if ((int) $doc->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Dokumen telah berubah. Muat ulang sebelum mengedit.');
            }
            $source = $this->location($data['source_location_id'] ?? null);
            $destination = $this->location($data['destination_location_id'] ?? null);
            $this->validateLocations($data['kind'], $source, $destination);
            $voucher = $this->voucher($data['kind'], $data['voucher_id'] ?? null);
            $itemIds = array_column($data['lines'], 'item_id');
            if (count($itemIds) !== count(array_unique($itemIds))) {
                throw new ApiException('VALIDATION_ERROR', 'Satu barang hanya boleh muncul sekali dalam dokumen.');
            }
            $known = DB::table('acc_inventory_items')->whereIn('id', $itemIds)->where('active', true)->pluck('id')->all();
            if (count($known) !== count($itemIds)) {
                throw new ApiException('VALIDATION_ERROR', 'Salah satu barang tidak aktif atau tidak ditemukan.');
            }
            foreach ($data['lines'] as $line) {
                if ($data['kind'] === 'STOCK_COUNT' && ! array_key_exists('counted_quantity', $line)) {
                    throw new ApiException('VALIDATION_ERROR', 'Stock opname membutuhkan jumlah hasil hitung.');
                } if ($data['kind'] !== 'STOCK_COUNT' && empty($line['quantity'])) {
                    throw new ApiException('VALIDATION_ERROR', 'Jumlah mutasi harus lebih dari nol.');
                }
            }
            DB::table('acc_inventory_documents')->where('id', $id)->update(['kind' => $data['kind'], 'source_location_id' => $source?->id, 'destination_location_id' => $destination?->id, 'voucher_id' => $voucher?->id, 'business_date' => $data['business_date'], 'reference' => trim($data['reference']), 'notes' => $data['notes'] ?? null, 'reviewed_by' => null, 'review_note' => null, 'version' => $doc->version + 1, 'updated_at' => now()]);
            DB::table('acc_inventory_document_lines')->where('document_id', $id)->delete();
            foreach ($data['lines'] as $line) {
                DB::table('acc_inventory_document_lines')->insert(['id' => (string) Str::uuid(), 'document_id' => $id, 'item_id' => $line['item_id'], 'quantity' => $data['kind'] === 'STOCK_COUNT' ? null : $line['quantity'], 'counted_quantity' => $data['kind'] === 'STOCK_COUNT' ? $line['counted_quantity'] : null]);
            }
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'AccountingInventoryDocument', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.inventory.document_updated', 'metadata' => ['version' => $doc->version + 1, 'voucherId' => $voucher?->id]]);

            return $this->one($id);
        });
    }

    private function units(string|int|float $value): int
    {
        $normalized = number_format((float) $value, 3, '.', '');
        [$whole, $fraction] = explode('.', $normalized);

        return ((int) $whole * 1000) + ((int) $fraction * ((int) $whole < 0 ? -1 : 1));
    }

    private function decimal(int $units): string
    {
        $sign = $units < 0 ? '-' : '';
        $absolute = abs($units);

        return $sign.intdiv($absolute, 1000).'.'.str_pad((string) ($absolute % 1000), 3, '0', STR_PAD_LEFT);
    }

    private function adjust(string $documentId, object $line, string $locationId, string $kind, int $deltaUnits, array $user): void
    {
        $balance = DB::table('acc_inventory_balances')->where('item_id', $line->item_id)->where('location_id', $locationId)->lockForUpdate()->first();
        $afterUnits = $this->units($balance->quantity ?? 0) + $deltaUnits;
        if ($afterUnits < 0) {
            throw new ApiException('VERSION_CONFLICT', 'Stok tidak mencukupi. Muat ulang saldo dan koreksi dokumen.');
        }
        $after = $this->decimal($afterUnits);
        $delta = $this->decimal($deltaUnits);
        if ($balance) {
            DB::table('acc_inventory_balances')->where('id', $balance->id)->update(['quantity' => $after, 'version' => $balance->version + 1, 'updated_at' => now()]);
        } else {
            DB::table('acc_inventory_balances')->insert(['id' => (string) Str::uuid(), 'item_id' => $line->item_id, 'location_id' => $locationId, 'quantity' => $after, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('acc_inventory_movements')->insert(['id' => (string) Str::uuid(), 'document_id' => $documentId, 'line_id' => $line->id, 'item_id' => $line->item_id, 'location_id' => $locationId, 'kind' => $kind, 'quantity_delta' => $delta, 'quantity_after' => $after, 'actor_id' => $user['sub'], 'created_at' => now()]);
    }

    private function post(object $doc, array $user): void
    {
        $lines = DB::table('acc_inventory_document_lines')->where('document_id', $doc->id)->get();
        foreach ($lines as $line) {
            $qty = $this->units($line->quantity);
            if ($doc->kind === 'RECEIPT') {
                $this->adjust($doc->id, $line, $doc->destination_location_id, 'RECEIPT', $qty, $user);
            } elseif ($doc->kind === 'ISSUE') {
                $this->adjust($doc->id, $line, $doc->source_location_id, 'ISSUE', -$qty, $user);
            } elseif ($doc->kind === 'TRANSFER') {
                $this->adjust($doc->id, $line, $doc->source_location_id, 'TRANSFER_OUT', -$qty, $user);
                $this->adjust($doc->id, $line, $doc->destination_location_id, 'TRANSFER_IN', $qty, $user);
            } else {
                $balance = DB::table('acc_inventory_balances')->where('item_id', $line->item_id)->where('location_id', $doc->source_location_id)->lockForUpdate()->first();
                $delta = $this->units($line->counted_quantity) - $this->units($balance->quantity ?? 0);
                $this->adjust($doc->id, $line, $doc->source_location_id, 'STOCK_COUNT', $delta, $user);
            }
        }
    }

    public function transition(string $id, string $action, array $data, array $user): array
    {
        $this->access($user, $action === 'submit' ? 'write:inventory' : 'approve:inventory');

        return DB::transaction(function () use ($id, $action, $data, $user) {
            $doc = DB::table('acc_inventory_documents')->where('id', $id)->lockForUpdate()->first();
            if (! $doc) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen persediaan tidak ditemukan.');
            }
            if ((int) $doc->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Dokumen telah berubah. Muat ulang sebelum melanjutkan.');
            }
            if ($action === 'submit' && ! in_array($doc->status, ['draft', 'correction'], true)) {
                throw new ApiException('VERSION_CONFLICT', 'Hanya draf atau koreksi yang dapat diajukan.');
            }
            if ($action !== 'submit' && $doc->status !== 'submitted') {
                throw new ApiException('VERSION_CONFLICT', 'Dokumen tidak sedang menunggu persetujuan.');
            }
            if ($action !== 'submit' && $doc->created_by === $user['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Pembuat dokumen tidak boleh menyetujui dokumennya sendiri.');
            }
            if ($action === 'correction' && mb_strlen(trim($data['note'] ?? '')) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Alasan koreksi minimal 10 karakter.');
            }
            $this->voucher($doc->kind, $doc->voucher_id);
            if ($action === 'approve') {
                $this->post($doc,$user);
            }
            $status = ['submit' => 'submitted', 'approve' => 'approved', 'correction' => 'correction'][$action];
            DB::table('acc_inventory_documents')->where('id',$id)->update(['status' => $status, 'reviewed_by' => $action === 'submit' ? null : $user['sub'], 'review_note' => $action === 'correction' ? trim($data['note']) : null, 'version' => $doc->version + 1, 'updated_at' => now()]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'AccountingInventoryDocument', 'entityId' => $id, 'divisionCode' => 'ACC', 'action' => 'accounting.inventory.'.$action, 'metadata' => ['from' => $doc->status, 'to' => $status]]);

            return $this->one($id);
        });
    }
}
