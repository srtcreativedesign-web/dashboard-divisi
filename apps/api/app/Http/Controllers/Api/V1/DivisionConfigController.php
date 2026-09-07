<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpsertDivisionConfigRequest;
use App\Http\Resources\DivisionConfigResource;
use App\Services\DivisionConfigService;
use Illuminate\Http\JsonResponse;

class DivisionConfigController extends Controller
{
    public function __construct(
        protected DivisionConfigService $configService
    ) {}

    public function getAll(): JsonResponse
    {
        $data = $this->configService->getAllConfigs();

        return response()->json(DivisionConfigResource::collection($data)->toArray(request()));
    }

    public function getOne(string $divisionCode): JsonResponse
    {
        $cfg = $this->configService->getConfig($divisionCode);
        if (! $cfg) {
            throw new ApiException('RESOURCE_NOT_FOUND', "Division {$divisionCode} not found");
        }

        return response()->json((new DivisionConfigResource($cfg))->toArray(request()));
    }

    public function upsert(UpsertDivisionConfigRequest $request, string $divisionCode): JsonResponse
    {
        $validated = $request->validated();
        $result = $this->configService->upsertConfig($divisionCode, $validated['enabledModules'], $validated['enabledKpis']);

        return response()->json((new DivisionConfigResource($result))->toArray(request()));
    }
}
