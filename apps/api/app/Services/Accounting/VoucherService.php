<?php

namespace App\Services\Accounting;

use App\Exceptions\ApiException;
use App\Models\Accounting\Voucher;
use App\Models\Accounting\VoucherAttachment;
use App\Models\Accounting\VoucherPayment;
use App\Services\AuditService;
use App\Services\MutationFileRollback;
use App\Services\OrgReadModelService;
use App\Services\PolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class VoucherService
{
    public const FIELDS = ['type', 'outlet_id', 'voucher_date', 'due_date', 'entity_name', 'source_reference', 'amount', 'description', 'company_name', 'priority', 'payment_method', 'bank_name', 'bank_account_holder', 'bank_account', 'invoice_number', 'invoice_date', 'tax_invoice_number', 'billing_period', 'delivery_reference'];

    public function __construct(private OrgReadModelService $org, private PolicyService $policy, private AuditService $audit) {}

    public function outlets(array $user): array
    {
        return $this->org->getAccountingOutlets($user);
    }

    private function query()
    {
        return Voucher::where('division_code', 'ACC');
    }

    public function list(array $filters): array
    {
        $start = CarbonImmutable::createFromFormat('!Y-m', $filters['month'])->startOfMonth();
        $query = $this->query()->whereBetween('voucher_date', [$start->toDateString(), $start->endOfMonth()->toDateString()]);
        foreach (['status', 'type', 'outlet_id'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }
        $page = $query->withSum(['payments' => fn ($q) => $q->where('status', 'recorded')], 'amount_cents')->orderByDesc('voucher_date')->orderByDesc('created_at')->orderBy('id')->paginate(25);

        return ['items' => collect($page->items())->map(function ($record) {
            $data = $record->toArray();
            unset($data['payments_sum_amount_cents']);

            return $data + ['payment_summary' => VoucherPaymentService::summary($record)];
        })->all(), 'total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage()];
    }

    public function detail(string $id, ?array $user = null): array
    {
        $record = $this->query()->findOrFail($id);
        $events = DB::table('acc_voucher_events')->where('voucher_id', $id)->orderBy('id')->get()->map(function ($event) {
            $event->metadata = json_decode($event->metadata, true);

            return $event;
        });

        $data = $record->toArray();
        if ($user && (($this->policy->hasCapability($user, 'write:voucher') && $record->created_by === $user['sub']) || $this->policy->hasCapability($user, 'execute:payment'))) {
            $data['bank_account'] = $record->bank_account;
        }

        return $data + ['payment_summary' => VoucherPaymentService::summary($record), 'payments' => VoucherPayment::where('voucher_id', $id)->orderBy('created_at')->orderBy('id')->get()->toArray(), 'events' => $events, 'attachments' => VoucherAttachment::where('voucher_id', $id)->orderBy('created_at')->orderBy('id')->get()->toArray()];
    }

    public function attach(string $id, int $version, UploadedFile $file, array $user): array
    {
        $this->policy->assertCapability($user, 'attach:voucher');
        DB::transaction(function () use ($id, $version, $file, $user) {
            $record = $this->query()->lockForUpdate()->findOrFail($id);
            $this->assertVersion($record, $version);
            if ($this->policy->hasCapability($user, 'write:voucher')) {
                $this->assertCreator($record, $user);
                $this->assertStatus($record, ['draft', 'correction']);
            } else {
                $this->assertStatus($record, ['submitted']);
                if ($record->created_by === $user['sub']) {
                    throw new ApiException('FORBIDDEN_CAPABILITY', 'Pemeriksa lampiran harus berbeda dari pembuat voucher.');
                }
            }
            if (VoucherAttachment::where('voucher_id', $id)->count() >= 20) {
                throw new ApiException('VALIDATION_ERROR', 'Maksimal 20 lampiran per voucher.');
            }
            $attachmentId = (string) Str::uuid();
            $path = $file->storeAs('voucher_attachments/'.$id, $attachmentId.'.'.$file->extension(), 'local');
            if (! is_string($path)) {
                throw new RuntimeException('Penyimpanan lampiran gagal');
            }
            MutationFileRollback::register(fn () => Storage::disk('local')->delete($path));
            $name = mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', basename(str_replace('\\', '/', $file->getClientOriginalName()))), 0, 240);
            VoucherAttachment::create(['id' => $attachmentId, 'voucher_id' => $id, 'uploaded_by' => $user['sub'],
                'original_name' => $name ?: 'lampiran', 'mime_type' => $file->getMimeType(), 'size_bytes' => $file->getSize(),
                'sha256' => hash_file('sha256', Storage::disk('local')->path($path)), 'file_path' => $path]);
            $record->version++;
            $record->save();
            $this->event($record, 'attachment_uploaded', $user);
        });

        return $this->detail($id, $user);
    }

    public function attachment(string $id, string $attachmentId): VoucherAttachment
    {
        $this->query()->findOrFail($id);
        $attachment = VoucherAttachment::where('voucher_id', $id)->findOrFail($attachmentId);
        $expected = 'voucher_attachments/'.$id.'/'.$attachment->id.'.';
        $disk = Storage::disk('local');
        abort_unless(str_starts_with($attachment->file_path, $expected)
            && preg_match('/^[a-z0-9]+$/D', substr($attachment->file_path, strlen($expected)))
            && $disk->exists($attachment->file_path)
            && ! is_link($disk->path($attachment->file_path))
            && ! is_link($disk->path('voucher_attachments/'.$id)), 404);
        abort_unless(hash_equals($attachment->sha256, hash_file('sha256', $disk->path($attachment->file_path))), 404);

        return $attachment;
    }

    private function assertVersion(Voucher $record, int $version): void
    {
        if ($record->version !== $version) {
            throw new ApiException('VERSION_CONFLICT', 'Voucher sudah berubah. Muat ulang sebelum melanjutkan.');
        }
    }

    private function assertStatus(Voucher $record, array $statuses): void
    {
        if (! in_array($record->status, $statuses, true)) {
            throw new ApiException('INVALID_STATE_TRANSITION', 'Tindakan tidak tersedia pada status voucher ini.');
        }
    }

    private function assertCreator(Voucher $record, array $user): void
    {
        if ($record->created_by !== $user['sub']) {
            throw new ApiException('FORBIDDEN_CAPABILITY', 'Hanya Admin pembuat yang dapat mengubah atau mengajukan voucher.');
        }
    }

    private function event(Voucher $record, string $action, array $user, ?string $reason = null): void
    {
        $metadata = ['version' => $record->version, 'status' => $record->status, 'reason' => $reason];
        DB::table('acc_voucher_events')->insert([
            'voucher_id' => $record->id, 'actor_id' => $user['sub'], 'actor_role' => $user['role'],
            'action' => $action, 'metadata' => json_encode($metadata + ['snapshot' => $record->toArray()]), 'created_at' => now(),
        ]);
        $this->audit->logRequired(['actorId' => $user['sub'], 'actorRole' => $user['role'], 'action' => 'accounting.voucher.'.$action,
            'entity' => 'Voucher', 'entityId' => $record->id, 'divisionCode' => 'ACC', 'metadata' => $metadata]);
    }

    public function save(?string $id, array $data, array $user): array
    {
        $this->policy->assertCapability($user, 'write:voucher');
        $outlet = collect($this->outlets($user))->firstWhere('id', $data['outlet_id']);
        if (! $outlet) {
            throw new ApiException('VALIDATION_ERROR', 'Outlet aktif tidak ditemukan dalam direktori Accounting.');
        }
        if ($data['voucher_date'] > CarbonImmutable::now('Asia/Jakarta')->toDateString()) {
            throw new ApiException('VALIDATION_ERROR', 'Tanggal voucher tidak boleh berada di masa depan.');
        }
        $record = DB::transaction(function () use ($id, $data, $user, $outlet) {
            $record = $id ? $this->query()->lockForUpdate()->findOrFail($id) : new Voucher;
            if ($id) {
                $this->assertVersion($record, $data['version']);
                $this->assertCreator($record, $user);
                $this->assertStatus($record, ['draft', 'correction']);
            }
            $record->fill(array_intersect_key($data, array_flip(self::FIELDS)) + [
                'outlet_name' => $outlet['name'], 'source_division_code' => $outlet['divisionCode'],
            ]);
            if ($record->payment_method !== 'BANK') {
                $record->bank_name = null;
                $record->bank_account_holder = null;
                $record->bank_account = null;
            }
            $normalize = fn (string $value) => mb_strtolower(preg_replace('/\s+/u', ' ', trim($value)));
            $record->source_key = hash('sha256', json_encode([$record->type, $record->outlet_id,
                $normalize($record->entity_name), $normalize($record->source_reference)]));
            if (! $id) {
                $record->id = (string) Str::uuid();
                $record->voucher_no = 'VCH-'.strtoupper($record->id);
                $record->created_by = $user['sub'];
                $record->division_code = 'ACC';
                $record->status = 'draft';
                $record->version = 1;
            } else {
                $record->version++;
                $record->reviewed_by = null;
                $record->reviewed_at = null;
                $record->approved_by = null;
                $record->approved_at = null;
            }
            $record->save();
            $record->refresh();
            $this->event($record, $id ? 'updated' : 'created', $user);

            return $record;
        });

        return $this->detail($record->id, $user);
    }

    public function act(string $id, string $action, array $data, array $user): array
    {
        $capability = match ($action) {
            'submit' => 'write:voucher', 'review' => 'validate:voucher', 'decide' => 'approve:voucher'
        };
        $this->policy->assertCapability($user, $capability);
        DB::transaction(function () use ($id, $action, $data, $user) {
            $record = $this->query()->lockForUpdate()->findOrFail($id);
            $this->assertVersion($record, $data['version']);
            $reason = trim($data['reason'] ?? '');
            if ($action === 'submit') {
                $this->assertCreator($record, $user);
                $this->assertStatus($record, ['draft', 'correction']);
                // Pastikan sumber outlet masih aktif ketika pengajuan dilakukan.
                if (! collect($this->outlets($user))->contains('id', $record->outlet_id)) {
                    throw new ApiException('VALIDATION_ERROR', 'Outlet sumber tidak aktif; perbarui draf terlebih dahulu.');
                }
                $record->status = 'submitted';
                $record->submitted_at = now();
                $record->reviewed_by = null;
                $record->reviewed_at = null;
                $record->approved_by = null;
                $record->approved_at = null;
                $record->review_notes = null;
                $record->decision_notes = null;
            } else {
                $this->assertStatus($record, [$action === 'review' ? 'submitted' : 'pending_approval']);
                if ($record->created_by === $user['sub'] || ($action === 'decide' && $record->reviewed_by === $user['sub'])) {
                    throw new ApiException('FORBIDDEN_CAPABILITY', 'Pembuat, pemeriksa dan pemberi persetujuan harus berbeda.');
                }
                if (mb_strlen($reason) < 10) {
                    throw new ApiException('VALIDATION_ERROR', 'Catatan pemeriksaan atau keputusan minimal 10 karakter.');
                }
                if ($action === 'review') {
                    $record->status = $data['decision'] === 'validate' ? 'pending_approval' : 'correction';
                    $record->reviewed_by = $user['sub'];
                    $record->reviewed_at = now();
                    $record->review_notes = $reason;
                } else {
                    $record->status = $data['decision'] === 'approve' ? 'approved' : 'correction';
                    $record->decision_notes = $reason;
                    if ($data['decision'] === 'approve') {
                        $record->approved_by = $user['sub'];
                        $record->approved_at = now();
                    }
                }
            }
            $record->version++;
            $record->save();
            $this->event($record, $action, $user, $reason ?: null);
        });

        return $this->detail($id, $user);
    }
}
