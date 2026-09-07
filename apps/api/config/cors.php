<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173'), 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.100.203:5173', 'http://192.168.100.203:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['X-Trace-Id'],
    'max_age' => 0,
    'supports_credentials' => true,
];
