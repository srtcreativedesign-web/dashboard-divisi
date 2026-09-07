<?php

namespace App\Services;

use App\Models\AuditEvent;
use Illuminate\Support\Str;
use Throwable;

class AuditService
{
    protected const SENSITIVE_KEYS = [
        'password',
        'passwordhash',
        'password_hash',
        'refresh_token',
        'refreshtoken',
        'token',
        'access_token',
        'accesstoken',
        'authorization',
        'cookie',
        'secret',
        'jwt',
        'jwt_secret',
        'pin',
    ];

    /**
     * In-memory storage for test assertions & DB-less testing
     *
     * @var array<int, array>
     */
    protected static array $memoryLogs = [];

    public function sanitizeMetadata(?array $input): ?array
    {
        if ($input === null) {
            return null;
        }

        $out = [];
        foreach ($input as $key => $val) {
            $lowerKey = strtolower((string) $key);
            $isSensitive = false;
            foreach (self::SENSITIVE_KEYS as $s) {
                if (str_contains($lowerKey, $s)) {
                    $isSensitive = true;
                    break;
                }
            }
            if ($isSensitive) {
                continue;
            }

            if (is_array($val)) {
                $sanitized = $this->sanitizeMetadata($val);
                if (! empty($sanitized)) {
                    $out[$key] = $sanitized;
                }
            } else {
                $out[$key] = $val;
            }
        }

        return ! empty($out) ? $out : null;
    }

    public function log(array $params): void
    {
        $sanitizedMetadata = isset($params['metadata']) ? $this->sanitizeMetadata((array) $params['metadata']) : null;

        $record = [
            'id' => $params['id'] ?? (string) Str::uuid(),
            'actor_id' => $params['actorId'] ?? $params['actor_id'] ?? null,
            'actor_email' => $params['actorEmail'] ?? $params['actor_email'] ?? null,
            'actor_role' => $params['actorRole'] ?? $params['actor_role'] ?? null,
            'action' => $params['action'] ?? 'unknown',
            'entity' => $params['entity'] ?? 'unknown',
            'entity_id' => $params['entityId'] ?? $params['entity_id'] ?? null,
            'division_code' => $params['divisionCode'] ?? $params['division_code'] ?? null,
            'trace_id' => $params['traceId'] ?? $params['trace_id'] ?? null,
            'metadata' => $sanitizedMetadata,
            'created_at' => now(),
        ];

        self::$memoryLogs[] = $record;

        try {
            AuditEvent::create([
                'id' => $record['id'],
                'actor_id' => $record['actor_id'],
                'actor_email' => $record['actor_email'],
                'actor_role' => $record['actor_role'],
                'action' => $record['action'],
                'entity' => $record['entity'],
                'entity_id' => $record['entity_id'],
                'division_code' => $record['division_code'],
                'trace_id' => $record['trace_id'],
                'metadata' => $record['metadata'],
                'created_at' => $record['created_at'],
            ]);
        } catch (Throwable $e) {
            // In test environment or offline DB, keep in-memory
            if (app()->environment() !== 'testing') {
                report($e);
            }
        }
    }

    public function findAll(int $limit = 50): array
    {
        try {
            return AuditEvent::orderBy('created_at', 'desc')->limit($limit)->get()->toArray();
        } catch (Throwable) {
            return array_slice(array_reverse(self::$memoryLogs), 0, $limit);
        }
    }

    public static function getMemoryLogs(): array
    {
        return self::$memoryLogs;
    }

    public static function clearMemory(): void
    {
        self::$memoryLogs = [];
    }
}
