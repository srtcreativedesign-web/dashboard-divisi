<?php

namespace App\Http\Requests;

use App\Services\Sobat\Mappers\SobatTenantMapper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncTenantsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'division_code' => [
                'nullable',
                'string',
                Rule::in(SobatTenantMapper::VALID_DIVISIONS),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'division_code.in' => 'Kode divisi harus salah satu dari: WRAP, CELL, REFL, MINI, FNB, FIN, MC.',
            'division_code.string' => 'Kode divisi harus berupa string.',
        ];
    }
}
