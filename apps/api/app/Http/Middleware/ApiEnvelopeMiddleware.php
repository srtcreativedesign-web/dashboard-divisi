<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ApiEnvelopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only wrap successful API responses (200-299)
        if ($response instanceof JsonResponse && $response->isSuccessful()) {
            $traceId = $request->attributes->get('trace_id') ?: (string) Str::uuid();
            $data = $response->getData(true);

            // Check if already wrapped with data & meta
            if (is_array($data) && array_key_exists('data', $data) && array_key_exists('meta', $data)) {
                return $response;
            }

            $selfUri = '/'.ltrim($request->path(), '/');
            $query = $request->getQueryString();
            if ($query) {
                $selfUri .= '?'.$query;
            }

            $wrapped = [
                'data' => $data,
                'meta' => [
                    'trace_id' => $traceId,
                ],
                'links' => [
                    'self' => $selfUri,
                ],
            ];

            $response->setData($wrapped);
        }

        return $response;
    }
}
