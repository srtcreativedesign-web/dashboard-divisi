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

    public function logRequired(array $params): void
    {
        $id = $params['id'] ?? (string) Str::uuid();
        $this->log($params + ['id' => $id], true);
        request()->attributes->set('required_audit_written', $id);
    }

    public function hasRequiredRecord(): bool
    {
        $id = request()->attributes->get('required_audit_written');

        return is_string($id) && AuditEvent::whereKey($id)->exists();
    }

    public function log(array $params, bool $required = false): void
    {
        $sanitizedMetadata = isset($params['metadata']) ? $this->sanitizeMetadata((array) $params['metadata']) : null;

        $trace = $params['traceId'] ?? $params['trace_id'] ?? request()->attributes->get('trace_id');
        $traceId = is_string($trace) && preg_match('/^[a-zA-Z0-9_-]{1,100}$/D', $trace) ? $trace : (string) Str::uuid();
        $record = [
            'id' => $params['id'] ?? (string) Str::uuid(),
            'actor_id' => $params['actorId'] ?? $params['actor_id'] ?? null,
            'actor_email' => $params['actorEmail'] ?? $params['actor_email'] ?? null,
            'actor_role' => $params['actorRole'] ?? $params['actor_role'] ?? null,
            'action' => $params['action'] ?? 'unknown',
            'entity' => $params['entity'] ?? 'unknown',
            'entity_id' => $params['entityId'] ?? $params['entity_id'] ?? null,
            'division_code' => $params['divisionCode'] ?? $params['division_code'] ?? null,
            'trace_id' => $traceId,
            'metadata' => $sanitizedMetadata,
            'created_at' => now(),
        ];

        if (! $required) {
            self::$memoryLogs[] = $record;
        }

        try {
            AuditEvent::create($record);
        } catch (Throwable $e) {
            if ($required) {
                throw $e;
            }
            // In test environment or offline DB, keep in-memory
            if (app()->environment() !== 'testing') {
                report($e);
            }
        }
    }

    public function findAll(int $limit = 50): array
    {
        return AuditEvent::orderBy('created_at', 'desc')->limit($limit)->get()->toArray();
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
