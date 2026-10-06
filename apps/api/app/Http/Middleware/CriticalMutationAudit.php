<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Services\AuditService;
use App\Services\MutationFileRollback;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class CriticalMutationAudit
{
    public function __construct(private AuditService $audit) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) || $request->is('api/v1/auth/*')) {
            return $next($request);
        }
        $request->attributes->remove('required_audit_written');
        $request->attributes->set('mutation_file_rollback', []);
        $level = DB::transactionLevel();
        DB::beginTransaction();
        try {
            $response = $next($request);
            if ($response->getStatusCode() >= 400) {
                DB::rollBack();
                MutationFileRollback::run($request);
                $code = $response instanceof JsonResponse ? ($response->getData(true)['error']['code'] ?? null) : null;
                if (in_array($code, ['UPLOAD_REJECTED', 'SCANNER_UNAVAILABLE', 'SCANNER_BUSY'], true)) {
                    $user = $request->attributes->get('user', []);
                    $this->audit->log(['actorId' => $user['sub'] ?? null, 'actorRole' => $user['role'] ?? null,
                        'action' => 'upload.scan.denied', 'entity' => $request->route()->uri(),
                        'metadata' => ['method' => $request->method(), 'code' => $code]]);
                }

                return $response;
            }
            if (! $this->audit->hasRequiredRecord()) {
                $user = $request->attributes->get('user');
                $parameters = array_filter($request->route()->parameters(), fn ($value) => is_string($value) || is_int($value));
                $result = $response instanceof JsonResponse ? $response->getData(true) : [];
                $result = is_array($result) ? ($result['data'] ?? $result) : [];
                $entityId = $result['id'] ?? $request->route('documentId') ?? $request->route('id');
                $this->audit->logRequired(['entityId' => is_string($entityId) || is_int($entityId) ? (string) $entityId : null, 'actorId' => $user['sub'], 'actorEmail' => $user['email'] ?? null,
                    'actorRole' => $user['role'], 'divisionCode' => $user['divisionCode'] ?? null,
                    'action' => 'api.mutation', 'entity' => $request->route()->uri(),
                    'metadata' => ['method' => $request->method(), 'route_parameters' => $parameters, 'status' => $response->getStatusCode(), 'file_scan' => $request->attributes->get('file_scan')]]);
            }
            DB::commit();
            $request->attributes->remove('mutation_file_rollback');

            return $response;
        } catch (Throwable $error) {
            try {
                if (DB::transactionLevel() > $level) {
                    DB::rollBack();
                }
            } finally {
                MutationFileRollback::run($request);
            }
            if ($error instanceof ApiException && ($error->getHttpStatus() === 403
                || in_array($error->getErrorCode(), ['UPLOAD_REJECTED', 'SCANNER_UNAVAILABLE', 'SCANNER_BUSY'], true))) {
                $user = $request->attributes->get('user', []);
                $this->audit->log(['actorId' => $user['sub'] ?? null, 'actorRole' => $user['role'] ?? null,
                    'action' => in_array($error->getErrorCode(), ['UPLOAD_REJECTED', 'SCANNER_UNAVAILABLE', 'SCANNER_BUSY'], true) ? 'upload.scan.denied' : 'api.mutation.denied', 'entity' => $request->route()->uri(),
                    'metadata' => ['method' => $request->method(), 'code' => $error->getErrorCode()]]);
            }
            throw $error;
        }
    }
}
