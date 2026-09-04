<?php

namespace App\Services;

use App\Models\AccountingMasterHistory;
use Carbon\Carbon;

class AccMasterHistoryService
{
    public function list(array $params = []): array
    {
        $query = AccountingMasterHistory::query();

        if (! empty($params['entity_type'])) {
            $query->where('entity_type', $params['entity_type']);
        }
        if (! empty($params['entity_id'])) {
            $query->where('entity_id', $params['entity_id']);
        }
        if (! empty($params['action'])) {
            $query->where('action', $params['action']);
        }
        if (! empty($params['actor_email'])) {
            $query->where('actor_email', $params['actor_email']);
        }

        $perPage = (int) ($params['per_page'] ?? 50);
        $page = (int) ($params['page'] ?? 1);

        $total = $query->count();
        $items = $query->orderBy('created_at', 'desc')->forPage($page, $perPage)->get();

        return [
            'data' => $items->map(fn ($h) => $this->toResource($h))->toArray(),
            'meta' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
            ],
        ];
    }

    public function toResource(AccountingMasterHistory $history): array
    {
        return [
            'id' => $history->id,
            'entity_type' => $history->entity_type,
            'entity_id' => $history->entity_id,
            'action' => $history->action,
            'changes' => $history->changes,
            'actor_id' => $history->actor_id,
            'actor_email' => $history->actor_email,
            'actor_role' => $history->actor_role,
            'division_code' => $history->division_code,
            'created_at' => $history->created_at instanceof Carbon ? $history->created_at->toISOString() : (string) $history->created_at,
        ];
    }
}
