<?php

return [
    'scanner_binary' => env('UPLOAD_SCANNER_BINARY', ''),
    'scanner_database' => env('UPLOAD_SCANNER_DATABASE', ''),
    'scanner_timeout' => 60,
    'scanner_lock_store' => env('UPLOAD_SCANNER_LOCK_STORE', 'file'),
    'max_bytes' => 10 * 1024 * 1024,
];
