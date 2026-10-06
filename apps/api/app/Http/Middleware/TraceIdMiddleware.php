<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class TraceIdMiddleware
{
    public const TRACE_ID_HEADER = 'X-Trace-Id';

    public function handle(Request $request, Closure $next): Response
    {
        $incoming = $request->header(self::TRACE_ID_HEADER);
        $traceId = is_string($incoming) && preg_match('/^[a-zA-Z0-9_-]{1,100}$/D', $incoming)
            ? $incoming : (string) Str::uuid();
        $request->attributes->set('trace_id', $traceId);

        $response = $next($request);

        $response->headers->set(self::TRACE_ID_HEADER, $traceId);

        return $response;
    }
}
