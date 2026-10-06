<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'oldPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'max:128', Password::min(12)->mixedCase()->numbers()->symbols()],
        ];
    }
}
