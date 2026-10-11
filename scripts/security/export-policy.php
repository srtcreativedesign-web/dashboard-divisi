<?php

use App\Services\PolicyService;

require dirname(__DIR__, 2).'/apps/api/vendor/autoload.php';

echo json_encode([
    'schemaVersion' => 1,
    'domains' => PolicyService::DOMAIN_CAPABILITIES,
    'bod' => PolicyService::BOD_CAPABILITIES,
], JSON_THROW_ON_ERROR);
