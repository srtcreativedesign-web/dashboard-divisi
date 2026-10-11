<?php

namespace App\Services\Cellular;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryDocumentService
{
    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}

    private function access(array $user, string $capability = 'view:cellular'): array
    {
        $this->policy->assertDivisionScope($user, 'CELL', $capability !== 'view:cellular');
        $this->policy->assertCapability($user, $capability);
        if (($user['divisionCode'] ?? $user['division_code'] ?? null) === 'CELLULAR') {
            $user['divisionCode'] = $user['division_code'] = 'CELL';
        }

        return $this->org->getOutletsForUser($user, 'CELL');
    }

    public function catalog(array $user): array
    {
        $outlets = $this->access($user);
        $ids = array_column($outlets, 'id');

        return [
            'products' => DB::table('cel_products')->where('is_active', true)->orderBy('sku')->get()->map(fn ($row) => (array) $row)->all(),
            'outlets' => $outlets,
            'balances' => DB::table('cel_stock_balances as b')->join('cel_products as p', 'p.id', '=', 'b.product_id')->whereIn('b.outlet_id', $ids)->select('b.*', 'p.sku', 'p.name', 'p.provider', 'p.variant')->orderBy('p.sku')->get()->map(fn ($row) => (array) $row)->all(),
        ];
    }

    public function documents(string $month, array $user): array
    {
        $outlets = $this->access($user);
        $ids = array_column($outlets, 'id');
        $names = collect($outlets)->pluck('name', 'id');
        $start = CarbonImmutable::createFromFormat('!Y-m', $month, 'Asia/Jakarta');
        $rows = DB::table('cel_inventory_documents')->whereBetween('business_date', [$start->toDateString(), $start->endOfMonth()->toDateString()])
            ->where(fn ($query) => $query->whereIn('source_outlet_id', $ids)->orWhereIn('destination_outlet_id', $ids))
            ->orderByDesc('business_date')->orderByDesc('created_at')->get();
        $documentIds = $rows->pluck('id');
        $lines = $documentIds->isEmpty() ? collect() : DB::table('cel_inventory_document_lines as l')->join('cel_products as p', 'p.id', '=', 'l.product_id')->whereIn('l.document_id', $documentIds)->select('l.*', 'p.sku', 'p.name as product_name', 'p.provider', 'p.variant')->orderBy('p.sku')->get()->groupBy('document_id');

        return $rows->map(function ($row) use ($lines, $names) {
            $item = (array) $row;
            $item['source_outlet_name'] = $row->source_outlet_id ? $names->get($row->source_outlet_id) : null;
            $item['destination_outlet_name'] = $row->destination_outlet_id ? $names->get($row->destination_outlet_id) : null;
            $item['lines'] = ($lines[$row->id] ?? collect())->map(fn ($line) => (array) $line)->values()->all();

            return $item;
        })->all();
    }

    private function outlet(?string $id, array $outlets): ?array
    {
        if (! $id) {
            return null;
        }
        $outlet = collect($outlets)->firstWhere('id', $id);
        if (! $outlet) {
            throw new ApiException('SCOPE_VIOLATION', 'Outlet tidak berada dalam cakupan pengguna.');
        }

        return $outlet;
    }

    private function locations(string $kind, ?array $source, ?array $destination): void
    {
        $valid = match ($kind) {
            'RECEIPT' => ! $source && (bool) $destination,
            'ISSUE', 'STOCK_COUNT' => (bool) $source && ! $destination,
            'TRANSFER' => (bool) $source && (bool) $destination && $source['id'] !== $destination['id'],
            default => false,
        };
        if (! $valid) {
            throw new ApiException('VALIDATION_ERROR', 'Outlet asal dan tujuan tidak sesuai jenis dokumen.');
        }
    }

    private function validateLines(string $kind, array $lines): void
    {
        $productIds = array_column($lines, 'product_id');
        if (count($productIds) !== count(array_unique($productIds))) {
            throw new ApiException('VALIDATION_ERROR', 'Satu produk hanya boleh muncul sekali dalam dokumen.');
        }
        if (DB::table('cel_products')->whereIn('id', $productIds)->where('is_active', true)->count() !== count($productIds)) {
            throw new ApiException('VALIDATION_ERROR', 'Salah satu produk tidak aktif atau tidak ditemukan.');
        }
        foreach ($lines as $line) {
            if ($kind === 'STOCK_COUNT' && ! array_key_exists('counted_quantity', $line)) {
                throw new ApiException('VALIDATION_ERROR', 'Opname membutuhkan jumlah hasil hitung.');
            }
            if ($kind !== 'STOCK_COUNT' && empty($line['quantity'])) {
                throw new ApiException('VALIDATION_ERROR', 'Jumlah mutasi harus lebih dari nol.');
            }
        }
    }

    public function create(array $data, array $user): array
    {
        $outlets = $this->access($user, 'write:cellular_stock');
        if ($data['business_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal dokumen tidak boleh di masa depan WIB.');
        }

        return DB::transaction(function () use ($data, $user, $outlets) {
            $source = $this->outlet($data['source_outlet_id'] ?? null, $outlets);
            $destination = $this->outlet($data['destination_outlet_id'] ?? null, $outlets);
            $this->locations($data['kind'], $source, $destination);
            $this->validateLines($data['kind'], $data['lines']);
            $id = (string) Str::uuid();
            $number = 'CEL-INV-'.str_replace('-', '', $data['business_date']).'-'.strtoupper(Str::random(6));
            DB::table('cel_inventory_documents')->insert(['id' => $id, 'document_number' => $number, 'kind' => $data['kind'], 'source_outlet_id' => $source['id'] ?? null, 'destination_outlet_id' => $destination['id'] ?? null, 'business_date' => $data['business_date'], 'reference' => trim($data['reference']), 'notes' => $data['notes'] ?? null, 'status' => 'draft', 'created_by' => $user['sub'], 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
            $this->replaceLines($id, $data['kind'], $data['lines']);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularInventoryDocument', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.inventory.document_created', 'metadata' => ['documentNumber' => $number, 'kind' => $data['kind']]]);

            return $this->one($id, $outlets);
        });
    }

    private function replaceLines(string $documentId, string $kind, array $lines): void
    {
        DB::table('cel_inventory_document_lines')->where('document_id', $documentId)->delete();
        foreach ($lines as $line) {
            DB::table('cel_inventory_document_lines')->insert(['id' => (string) Str::uuid(), 'document_id' => $documentId, 'product_id' => $line['product_id'], 'quantity' => $kind === 'STOCK_COUNT' ? null : $line['quantity'], 'counted_quantity' => $kind === 'STOCK_COUNT' ? $line['counted_quantity'] : null]);
        }
    }

    private function one(string $id, array $outlets): array
    {
        $row = DB::table('cel_inventory_documents')->where('id', $id)->first();
        if (! $row) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen persediaan tidak ditemukan.');
        }
        $this->outlet($row->source_outlet_id ?: $row->destination_outlet_id, $outlets);
        $names = collect($outlets)->pluck('name', 'id');
        $item = (array) $row;
        $item['source_outlet_name'] = $row->source_outlet_id ? $names->get($row->source_outlet_id) : null;
        $item['destination_outlet_name'] = $row->destination_outlet_id ? $names->get($row->destination_outlet_id) : null;
        $item['lines'] = DB::table('cel_inventory_document_lines as l')->join('cel_products as p', 'p.id', '=', 'l.product_id')->where('l.document_id', $id)->select('l.*', 'p.sku', 'p.name as product_name', 'p.provider', 'p.variant')->orderBy('p.sku')->get()->map(fn ($line) => (array) $line)->all();

        return $item;
    }

    public function update(string $id, array $data, array $user): array
    {
        $outlets = $this->access($user, 'write:cellular_stock');
        if ($data['business_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal dokumen tidak boleh di masa depan WIB.');
        }

        return DB::transaction(function () use ($id, $data, $user, $outlets) {
            $document = DB::table('cel_inventory_documents')->where('id', $id)->lockForUpdate()->first();
            if (! $document) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen persediaan tidak ditemukan.');
            }
            $this->one($id, $outlets);
            if (! in_array($document->status, ['draft', 'correction'], true) || $document->created_by !== $user['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pembuat yang dapat memperbaiki draf atau dokumen koreksi.');
            }
            if ((int) $document->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Dokumen telah berubah. Muat ulang sebelum mengedit.');
            }
            $source = $this->outlet($data['source_outlet_id'] ?? null, $outlets);
            $destination = $this->outlet($data['destination_outlet_id'] ?? null, $outlets);
            $this->locations($data['kind'], $source, $destination);
            $this->validateLines($data['kind'], $data['lines']);
            DB::table('cel_inventory_documents')->where('id', $id)->update(['kind' => $data['kind'], 'source_outlet_id' => $source['id'] ?? null, 'destination_outlet_id' => $destination['id'] ?? null, 'business_date' => $data['business_date'], 'reference' => trim($data['reference']), 'notes' => $data['notes'] ?? null, 'reviewed_by' => null, 'review_note' => null, 'version' => $document->version + 1, 'updated_at' => now()]);
            $this->replaceLines($id, $data['kind'], $data['lines']);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularInventoryDocument', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.inventory.document_updated', 'metadata' => ['version' => $document->version + 1]]);

            return $this->one($id, $outlets);
        });
    }

    private function adjust(object $document, object $line, string $outletId, string $kind, int $delta, array $user): void
    {
        $balance = DB::table('cel_stock_balances')->where('product_id', $line->product_id)->where('outlet_id', $outletId)->lockForUpdate()->first();
        $after = (int) ($balance->quantity ?? 0) + $delta;
        if ($after < 0) {
            throw new ApiException('VERSION_CONFLICT', 'Stok tidak mencukupi. Muat ulang saldo lalu koreksi dokumen.');
        }
        if ($delta === 0) {
            return;
        }
        if ($balance) {
            DB::table('cel_stock_balances')->where('id', $balance->id)->update(['quantity' => $after, 'version' => $balance->version + 1, 'updated_at' => now()]);
        } else {
            DB::table('cel_stock_balances')->insert(['id' => (string) Str::uuid(), 'product_id' => $line->product_id, 'outlet_id' => $outletId, 'quantity' => $after, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('cel_stock_movements')->insert(['id' => (string) Str::uuid(), 'product_id' => $line->product_id, 'outlet_id' => $outletId, 'quantity_delta' => $delta, 'quantity_after' => $after, 'kind' => $kind, 'reference' => $document->document_number, 'source_key' => hash('sha256', 'inventory|'.$document->id.'|'.$line->id.'|'.$kind), 'reason' => $document->notes ?: 'Dokumen persediaan disetujui', 'actor_id' => $user['sub'], 'inventory_document_id' => $document->id, 'inventory_line_id' => $line->id, 'created_at' => now()]);
    }

    private function post(object $document, array $user): void
    {
        $lines = DB::table('cel_inventory_document_lines')->where('document_id', $document->id)->get();
        foreach ($lines as $line) {
            $quantity = (int) $line->quantity;
            if ($document->kind === 'RECEIPT') {
                $this->adjust($document, $line, $document->destination_outlet_id, 'RECEIPT', $quantity, $user);
            } elseif ($document->kind === 'ISSUE') {
                $this->adjust($document, $line, $document->source_outlet_id, 'ISSUE', -$quantity, $user);
            } elseif ($document->kind === 'TRANSFER') {
                $this->adjust($document, $line, $document->source_outlet_id, 'TRANSFER_OUT', -$quantity, $user);
                $this->adjust($document, $line, $document->destination_outlet_id, 'TRANSFER_IN', $quantity, $user);
            } else {
                $balance = DB::table('cel_stock_balances')->where('product_id', $line->product_id)->where('outlet_id', $document->source_outlet_id)->lockForUpdate()->first();
                $this->adjust($document, $line, $document->source_outlet_id, 'STOCK_COUNT', (int) $line->counted_quantity - (int) ($balance->quantity ?? 0), $user);
            }
        }
    }

    public function transition(string $id, string $action, array $data, array $user): array
    {
        $outlets = $this->access($user, $action === 'submit' ? 'write:cellular_stock' : 'approve:cellular_stock');

        return DB::transaction(function () use ($id, $action, $data, $user, $outlets) {
            $document = DB::table('cel_inventory_documents')->where('id', $id)->lockForUpdate()->first();
            if (! $document) {
                throw new ApiException('RESOURCE_NOT_FOUND', 'Dokumen persediaan tidak ditemukan.');
            }
            $this->one($id, $outlets);
            if ((int) $document->version !== (int) $data['version']) {
                throw new ApiException('VERSION_CONFLICT', 'Dokumen telah berubah. Muat ulang sebelum melanjutkan.');
            }
            if ($action === 'submit' && (! in_array($document->status, ['draft', 'correction'], true) || $document->created_by !== $user['sub'])) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya pembuat dapat mengajukan draf atau koreksi.');
            }
            if ($action !== 'submit' && $document->status !== 'submitted') {
                throw new ApiException('VERSION_CONFLICT', 'Dokumen tidak sedang menunggu persetujuan.');
            }
            if ($action !== 'submit' && $document->created_by === $user['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Pembuat dokumen tidak boleh memeriksa dokumennya sendiri.');
            }
            if ($action === 'correction' && mb_strlen(trim($data['note'] ?? '')) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Alasan koreksi minimal 10 karakter.');
            }
            if ($action === 'approve') {
                $this->post($document, $user);
            }
            $status = ['submit' => 'submitted', 'approve' => 'approved', 'correction' => 'correction'][$action];
            DB::table('cel_inventory_documents')->where('id', $id)->update(['status' => $status, 'reviewed_by' => $action === 'submit' ? null : $user['sub'], 'review_note' => $action === 'correction' ? trim($data['note']) : null, 'version' => $document->version + 1, 'updated_at' => now()]);
            $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'entity' => 'CellularInventoryDocument', 'entityId' => $id, 'divisionCode' => 'CELL', 'action' => 'cellular.inventory.'.$action, 'metadata' => ['from' => $document->status, 'to' => $status]]);

            return $this->one($id, $outlets);
        });
    }
}
