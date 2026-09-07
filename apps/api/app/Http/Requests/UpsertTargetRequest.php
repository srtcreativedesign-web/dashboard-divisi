<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertTargetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outletId' => ['required', 'string'],
            'periodMonth' => ['required', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'metricType' => ['nullable', 'string', 'in:GROSS,NET'],
            'amount' => ['required', 'numeric', 'min:0'],
            'action' => ['nullable', 'string', 'in:draft,submit'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
