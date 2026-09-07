<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(App\Services\SobatHrClientService::class);
try {
    $res = $service->fetchTenantSync('WRAP');
    echo json_encode(['ok'=>true, 'data'=>$res]);
} catch (\Throwable $e) {
    echo json_encode(['ok'=>false, 'error'=>$e->getMessage(), 'class'=>get_class($e), 'code'=>$e->getCode()]);
    if (method_exists($e, 'getErrorCode')) {
        echo "\nAPI Code: " . $e->getErrorCode();
    }
}
