<?php

namespace App\Services;

class MvpDivisionReadService
{
    public const CODES = ['ACC', 'PROJECT', 'CELL'];

    public function __construct(private OrgReadModelService $organization, private PolicyService $policy) {}

    public function list(array $user): array
    {
        $this->policy->assertCapability($user, 'view:report');

        return array_values(array_filter($this->organization->getDivisionsForUser($user),
            fn ($division) => in_array($division['code'], self::CODES, true)));
    }
}
