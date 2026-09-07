<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertDivisionConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enabledModules' => ['required', 'array'],
            'enabledModules.*' => ['string'],
            'enabledKpis' => ['required', 'array'],
            'enabledKpis.*' => ['string'],
        ];
    }
}
