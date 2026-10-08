<?php

use App\Services\Cellular\ReportPreviewReader;

require dirname(__DIR__).'/vendor/autoload.php';

try {
    if ($argc !== 5) {
        throw new InvalidArgumentException('Parameter preview tidak lengkap.');
    }
    $result = (new ReportPreviewReader)->read($argv[1], $argv[2], $argv[3], $argv[4]);
    echo json_encode($result, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (InvalidArgumentException $error) {
    echo json_encode(['error' => $error->getMessage()], JSON_THROW_ON_ERROR);
    exit(2);
} catch (Throwable) {
    echo json_encode(['error' => 'Workbook tidak dapat dibaca dengan adapter ini.'], JSON_THROW_ON_ERROR);
    exit(3);
}
