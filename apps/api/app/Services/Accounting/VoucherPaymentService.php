<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\Accounting\Voucher;
use App\Models\Accounting\VoucherPayment;
use App\Services\AuditService;
use App\Services\MutationFileRollback;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class VoucherPaymentService
{
    public function __construct(private PolicyService $policy, private AuditService $audit, private VoucherService $vouchers) {}

    public static function cents(string $v): int
    {
        [$whole,$fraction] = array_pad(explode('.', $v, 2), 2, '');

        return (int) $whole * 100 + (int) str_pad($fraction, 2, '0');
    }

    public static function money(int $v): string
    {
        return intdiv($v, 100).'.'.str_pad((string) ($v % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function summary(Voucher $v): array
    {
        $paid = (int) ($v->payments_sum_amount_cents ?? VoucherPayment::where('voucher_id', $v->id)->where('status', 'recorded')->sum('amount_cents'));
        $total = self::cents($v->amount);

        return ['paid_amount' => self::money($paid), 'remaining_amount' => self::money($total - $paid), 'status' => $paid === 0 ? 'UNPAID' : ($paid === $total ? 'PAID' : 'PARTIAL')];
    }

    private function locked(string $id, int $version): Voucher
    {
        $v = Voucher::where('division_code', 'ACC')->lockForUpdate()->findOrFail($id);
        if ($v->version !== $version) {
            throw new ApiException('VERSION_CONFLICT', 'Voucher telah berubah. Muat ulang sebelum mencatat pembayaran.');
        }
        if ($v->status !== 'approved') {
            throw new ApiException('INVALID_STATE_TRANSITION', 'Pembayaran hanya dapat dicatat untuk voucher disetujui.');
        }

        return $v;
    }

    private function event(Voucher $v, VoucherPayment $p, array $u, string $action): void
    {
        $metadata = ['version' => $v->version, 'status' => $v->status, 'payment_id' => $p->id, 'payment_amount' => $p->amount, 'payment_status' => $p->status, 'reason' => $p->void_reason];
        DB::table('acc_voucher_events')->insert(['voucher_id' => $v->id, 'actor_id' => $u['sub'], 'actor_role' => $u['role'], 'action' => $action, 'metadata' => json_encode($metadata + ['snapshot' => $v->toArray()]), 'created_at' => now()]);
        $this->audit->logRequired(['actorId' => $u['sub'], 'actorRole' => $u['role'], 'action' => 'accounting.voucher.'.$action, 'entity' => 'VoucherPayment', 'entityId' => $p->id, 'divisionCode' => 'ACC', 'metadata' => $metadata]);
    }

    public function record(string $id, array $d, UploadedFile $file, array $u): array
    {
        $this->policy->assertCapability($u, 'execute:payment');
        DB::transaction(function () use ($id, $d, $file, $u) {
            $v = $this->locked($id, (int) $d['version']);
            if (in_array($u['sub'], [$v->created_by, $v->reviewed_by, $v->approved_by], true)) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Pelaksana pembayaran harus berbeda dari pembuat, pemeriksa dan pemberi persetujuan.');
            }
            $approved = $v->approved_at ? CarbonImmutable::parse($v->approved_at)->setTimezone('Asia/Jakarta')->toDateString() : null;
            if (! $approved || $d['paid_date'] < $approved || $d['paid_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
                throw new ApiException('VALIDATION_ERROR', 'Tanggal realisasi harus sejak tanggal persetujuan hingga hari ini (WIB).');
            }
            if ($v->payment_method !== 'UNDECIDED' && $v->payment_method !== $d['method']) {
                throw new ApiException('VALIDATION_ERROR', 'Metode realisasi harus sesuai rencana pembayaran yang disetujui.');
            }
            if ($d['method'] === 'BANK' && (! $v->bank_name || ! $v->bank_account_holder || ! $v->bank_account)) {
                throw new ApiException('VALIDATION_ERROR', 'Tujuan rekening pada voucher disetujui belum lengkap.');
            }
            $amount = self::cents($d['amount']);
            $remaining = self::cents(self::summary($v)['remaining_amount']);
            if ($amount > $remaining) {
                throw new ApiException('INVALID_STATE_TRANSITION', 'Nominal realisasi melebihi sisa voucher.');
            }
            if (VoucherPayment::where('voucher_id', $id)->count() >= 100) {
                throw new ApiException('VALIDATION_ERROR', 'Maksimal 100 catatan pembayaran per voucher.');
            }
            if (mb_strlen(trim($d['notes'])) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Catatan realisasi minimal 10 karakter setelah dirapikan.');
            }
            $reference = trim($d['reference']);
            if ($reference === '') {
                throw new ApiException('VALIDATION_ERROR', 'Referensi transaksi wajib diisi.');
            }
            $key = hash('sha256', mb_strtolower(preg_replace('/\s+/u', ' ', $reference)));
            if (VoucherPayment::where('voucher_id', $id)->where('source_key', $key)->exists()) {
                throw new ApiException('IDEMPOTENCY_CONFLICT', 'Referensi pembayaran sudah tercatat untuk voucher ini.');
            }
            $pid = (string) Str::uuid();
            $path = $file->storeAs('voucher_payments/'.$id, $pid.'.'.$file->extension(), 'local');
            if (! is_string($path)) {
                throw new RuntimeException('Penyimpanan bukti gagal');
            }
            MutationFileRollback::register(fn () => Storage::disk('local')->delete($path));
            $name = mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', basename(str_replace('\\', '/', $file->getClientOriginalName()))), 0, 240);
            $p = VoucherPayment::create(['id' => $pid, 'voucher_id' => $id, 'paid_date' => $d['paid_date'], 'amount_cents' => $amount, 'method' => $d['method'], 'reference' => $reference, 'source_key' => $key, 'notes' => trim($d['notes']), 'status' => 'recorded', 'created_by' => $u['sub'], 'original_name' => $name ?: 'bukti', 'file_path' => $path, 'mime_type' => $file->getMimeType(), 'size_bytes' => $file->getSize(), 'sha256' => hash_file('sha256', Storage::disk('local')->path($path))]);
            $v->version++;
            $v->save();
            $this->event($v, $p, $u, 'payment_recorded');
        });

        return $this->vouchers->detail($id, $u);
    }

    public function void(string $id, string $paymentId, array $d, array $u): array
    {
        $this->policy->assertCapability($u, 'approve:voucher');
        DB::transaction(function () use ($id, $paymentId, $d, $u) {
            $v = $this->locked($id, (int) $d['version']);
            $p = VoucherPayment::where('voucher_id', $id)->lockForUpdate()->findOrFail($paymentId);
            if ($p->status !== 'recorded') {
                throw new ApiException('INVALID_STATE_TRANSITION', 'Catatan pembayaran telah dibatalkan.');
            }
            if ($p->created_by === $u['sub']) {
                throw new ApiException('FORBIDDEN_CAPABILITY', 'Pembatalan harus oleh Manager berbeda dari pencatat.');
            }
            $reason = trim($d['reason']);
            if (mb_strlen($reason) < 10) {
                throw new ApiException('VALIDATION_ERROR', 'Alasan pembatalan minimal 10 karakter.');
            }
            $p->status = 'voided';
            $p->voided_by = $u['sub'];
            $p->voided_at = now();
            $p->void_reason = $reason;
            $p->save();
            $v->version++;
            $v->save();
            $this->event($v, $p, $u, 'payment_voided');
        });

        return $this->vouchers->detail($id, $u);
    }

    public function evidence(string $id, string $paymentId): VoucherPayment
    {
        Voucher::where('division_code', 'ACC')->findOrFail($id);
        $p = VoucherPayment::where('voucher_id', $id)->findOrFail($paymentId);
        $disk = Storage::disk('local');
        $prefix = 'voucher_payments/'.$id.'/'.$p->id.'.';
        abort_unless(str_starts_with($p->file_path, $prefix) && preg_match('/^[a-z0-9]+$/D', substr($p->file_path, strlen($prefix))) && $disk->exists($p->file_path) && ! is_link($disk->path($p->file_path)) && ! is_link($disk->path('voucher_payments/'.$id)), 404);
        abort_unless(hash_equals($p->sha256, hash_file('sha256', $disk->path($p->file_path))), 404);

        return $p;
    }
}
