<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRevenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outletId' => ['required', 'string'],
            'businessDate' => ['required', 'string', 'date'],
            'grossRevenue' => ['required', 'numeric', 'min:0'],
            'netRevenue' => ['required', 'numeric', 'min:0'],
            'discountAmount' => ['nullable', 'numeric', 'min:0'],
            'returnAmount' => ['nullable', 'numeric', 'min:0'],
            'transactionCount' => ['nullable', 'integer', 'min:0'],
            'note' => ['nullable', 'string', 'max:255'],
            'payments' => ['nullable', 'array'],
            'payments.*.method' => ['required_with:payments', 'string', 'in:CASH,QRIS,TRANSFER,DEBIT,CREDIT,EWALLET'],
            'payments.*.amount' => ['required_with:payments', 'numeric', 'min:0'],
            'payments.*.transactionCount' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
