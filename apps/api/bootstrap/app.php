<?php

use App\Exceptions\ApiException;
use App\Http\Middleware\ApiEnvelopeMiddleware;
use App\Http\Middleware\CapabilityMiddleware;
use App\Http\Middleware\JwtAuthMiddleware;
use App\Http\Middleware\ScopeMiddleware;
use App\Http\Middleware\TraceIdMiddleware;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

if (! defined('GENERIC_INTERNAL_MESSAGE')) {
    define('GENERIC_INTERNAL_MESSAGE', 'Terjadi kesalahan internal. Silakan coba lagi.');
}

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middlewares for trace id and api envelope
        $middleware->append(TraceIdMiddleware::class);
        $middleware->api(append: [
            ApiEnvelopeMiddleware::class,
        ]);

        $middleware->alias([
            'jwt.auth' => JwtAuthMiddleware::class,
            'capability' => CapabilityMiddleware::class,
            'scope' => ScopeMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            $traceId = (string) ($request->attributes->get('trace_id')
                ?: $request->header('X-Trace-Id')
                ?: Str::uuid());

            $httpStatus = 500;
            $code = 'INTERNAL_ERROR';
            $message = GENERIC_INTERNAL_MESSAGE;
            $fields = null;

            if ($e instanceof ApiException) {
                $httpStatus = $e->getHttpStatus();
                $code = $e->getErrorCode();
                $message = $e->getMessage();
                $fields = $e->getFields();
            } elseif ($e instanceof ValidationException) {
                $httpStatus = 400;
                $code = 'VALIDATION_ERROR';
                $message = $e->validator->errors()->first() ?: 'Validation error';
                $fieldErrors = [];
                foreach ($e->validator->errors()->toArray() as $field => $messages) {
                    foreach ($messages as $msg) {
                        $fieldErrors[] = [
                            'field' => $field,
                            'code' => 'INVALID',
                            'message' => $msg,
                        ];
                    }
                }
                $fields = ! empty($fieldErrors) ? $fieldErrors : null;
            } elseif ($e instanceof AuthenticationException) {
                $httpStatus = 401;
                $code = 'AUTH_REQUIRED';
                $message = $e->getMessage() ?: 'Autentikasi diperlukan';
            } elseif ($e instanceof AuthorizationException || $e instanceof AccessDeniedHttpException) {
                $httpStatus = 403;
                $code = 'FORBIDDEN_CAPABILITY';
                $message = $e->getMessage() ?: 'Akses ditolak';
            } elseif ($e instanceof NotFoundHttpException || $e instanceof ModelNotFoundException) {
                $httpStatus = 404;
                $code = 'RESOURCE_NOT_FOUND';
                $message = 'Resource tidak ditemukan';
            } elseif ($e instanceof HttpException) {
                $httpStatus = $e->getStatusCode();
                $statusMap = [
                    400 => 'VALIDATION_ERROR',
                    401 => 'AUTH_REQUIRED',
                    403 => 'FORBIDDEN_CAPABILITY',
                    404 => 'RESOURCE_NOT_FOUND',
                    409 => 'INVALID_STATE_TRANSITION',
                    422 => 'IMPORT_ROW_INVALID',
                    429 => 'RATE_LIMITED',
                    500 => 'INTERNAL_ERROR',
                ];
                $code = $statusMap[$httpStatus] ?? 'INTERNAL_ERROR';
                $message = $httpStatus === 500 ? GENERIC_INTERNAL_MESSAGE : ($e->getMessage() ?: 'HTTP Exception');
            } else {
                $httpStatus = 500;
                $code = 'INTERNAL_ERROR';
                $message = GENERIC_INTERNAL_MESSAGE;
            }

            $errorBody = [
                'code' => $code,
                'message' => $message,
                'trace_id' => $traceId,
            ];

            if ($fields !== null) {
                $errorBody['fields'] = $fields;
            }

            return response()->json(
                ['error' => $errorBody],
                $httpStatus,
                ['X-Trace-Id' => $traceId]
            );
        });
    })->create();
