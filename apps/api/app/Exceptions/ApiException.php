<?php

namespace App\Exceptions;

use Exception;

class ApiException extends Exception
{
    public const HTTP_STATUS = [
        'VALIDATION_ERROR' => 400,
        'AUTH_REQUIRED' => 401,
        'FORBIDDEN_CAPABILITY' => 403,
        'SCOPE_VIOLATION' => 403,
        'RESOURCE_NOT_FOUND' => 404,
        'INVALID_STATE_TRANSITION' => 409,
        'VERSION_CONFLICT' => 409,
        'IDEMPOTENCY_CONFLICT' => 409,
        'IMPORT_ROW_INVALID' => 422,
        'APPROVAL_SELF_ACTION_DENIED' => 422,
        'SOURCE_DATA_UNAVAILABLE' => 422,
        'RATE_LIMITED' => 429,
        'INTERNAL_ERROR' => 500,
        'STAGE_LOCKED' => 422,
        'NOT_IMPLEMENTED' => 501,
    ];

    protected string $errorCode;

    protected int $httpStatus;

    protected ?array $fields;

    public function __construct(string $errorCode, string $message = '', ?array $fields = null)
    {
        $this->errorCode = $errorCode;
        $this->httpStatus = self::HTTP_STATUS[$errorCode] ?? 500;
        $this->fields = $fields;
        parent::__construct($message, $this->httpStatus);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getHttpStatus(): int
    {
        return $this->httpStatus;
    }

    public function getFields(): ?array
    {
        return $this->fields;
    }
}
