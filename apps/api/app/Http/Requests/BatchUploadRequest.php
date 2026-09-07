<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,zip', 'max:10240'],
            'divisionCode' => ['nullable', 'string', 'size:3'],
            'period' => ['nullable', 'string'],
        ];
    }
}
