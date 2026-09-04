<?php

namespace App\Services;

use App\Models\AccountingAccount;
use App\Models\AccountingCategory;
use App\Models\AccountingCategoryAlias;
use App\Models\AccountingPeriod;
use App\Models\AccountingTransaction;
use App\Models\Division;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use SimpleXMLElement;
use ZipArchive;

class AccExcelParserService
{
    /**
     * Preview and stage Excel upload or raw data rows.
     */
    public function preview(Division $division, AccountingPeriod $period, UploadedFile|array $source): array
    {
        $rawRows = is_array($source) ? $source : $this->extractRowsFromXlsx($source);

        $categoryMap = AccountingCategory::where('is_active', true)
            ->pluck('id', 'code')
            ->toArray();

        $aliasMap = AccountingCategoryAlias::pluck('canonical_id', 'normalized_alias')
            ->toArray();

        $accounts = AccountingAccount::where('division_id', $division->id)->get();
        $defaultAccount = $accounts->first();

        $parsedRows = [];
        $validCount = 0;
        $warningCount = 0;
        $errorCount = 0;
        $duplicateCount = 0;
        $totalDebit = 0;
        $totalCredit = 0;

        $seenSignatures = [];

        foreach ($rawRows as $index => $row) {
            $rowNum = $index + 1;
            $errors = [];
            $warnings = [];

            // 1. Date
            $rawDate = $row['transaction_date'] ?? $row['tanggal'] ?? null;
            $parsedDate = $this->parseDate($rawDate);
            if (! $parsedDate) {
                $errors[] = "Format tanggal '{$rawDate}' tidak valid.";
            }

            // 2. Category & Canonicalization
            $rawCategory = trim((string) ($row['category_code'] ?? $row['kategori'] ?? ''));
            $canonicalCategoryCode = $this->canonicalizeCategoryCode($rawCategory);
            $normalizedAlias = strtolower(preg_replace('/\s+/', '', $rawCategory));

            $categoryId = null;
            if (isset($categoryMap[$canonicalCategoryCode])) {
                $categoryId = $categoryMap[$canonicalCategoryCode];
            } elseif (isset($categoryMap[$rawCategory])) {
                $categoryId = $categoryMap[$rawCategory];
            } elseif (isset($aliasMap[$normalizedAlias])) {
                $categoryId = $aliasMap[$normalizedAlias];
            } else {
                $errors[] = "Kode kategori '{$rawCategory}' tidak ditemukan di master data (Impor tidak boleh membuat kategori baru).";
            }

            if ($rawCategory !== $canonicalCategoryCode && ! empty($canonicalCategoryCode)) {
                $warnings[] = "Normalisasi kode kategori dari '{$rawCategory}' ke '{$canonicalCategoryCode}'.";
            }

            // 3. Amounts
            $debit = (int) preg_replace('/[^0-9]/', '', (string) ($row['debit'] ?? 0));
            $credit = (int) preg_replace('/[^0-9]/', '', (string) ($row['credit'] ?? $row['kredit'] ?? 0));

            if ($debit === 0 && $credit === 0) {
                $errors[] = 'Salah satu nilai debit atau kredit harus lebih besar dari 0.';
            }

            // 4. Account
            $rawAccount = trim((string) ($row['account_number'] ?? $row['rekening'] ?? ''));
            $account = null;
            if (! empty($rawAccount)) {
                $cleanAcc = strtolower(preg_replace('/[^0-9A-Za-z]/', '', $rawAccount));
                $account = $accounts->first(function ($acc) use ($cleanAcc, $rawAccount) {
                    return $acc->code === $rawAccount
                        || $acc->id === $rawAccount
                        || str_contains(strtolower(preg_replace('/[^0-9A-Za-z]/', '', $acc->display_name)), $cleanAcc)
                        || str_contains(strtolower(preg_replace('/[^0-9A-Za-z]/', '', $acc->code)), $cleanAcc);
                });
            }
            if (! $account) {
                $account = $defaultAccount;
                if (! empty($rawAccount)) {
                    $warnings[] = "Rekening '{$rawAccount}' tidak cocok dengan master bank, dialokasikan ke rekening default.";
                }
            }

            // 5. Reference & Description
            $ref = trim((string) ($row['reference_no'] ?? $row['ref'] ?? ''));
            $desc = trim((string) ($row['description'] ?? $row['keterangan'] ?? 'Transaksi impor Excel'));

            if (empty($ref)) {
                $warnings[] = 'Nomor referensi kosong; periksa kemungkinan transaksi duplikat.';
            }

            // 6. Duplicate check (intra-batch and database)
            $signature = "{$parsedDate}|{$account?->id}|{$debit}|{$credit}|{$ref}";
            $isDuplicate = false;

            if (isset($seenSignatures[$signature])) {
                $isDuplicate = true;
                $warnings[] = "Kandidat duplikat intra-batch (sama tanggal, rekening, nominal, dan ref baris {$seenSignatures[$signature]}).";
            } else {
                $seenSignatures[$signature] = $rowNum;
            }

            if (! $isDuplicate && $parsedDate && $account) {
                $existsInDb = AccountingTransaction::where('division_id', $division->id)
                    ->whereDate('transaction_date', $parsedDate)
                    ->where('account_id', $account->id)
                    ->where('debit_amount', $debit)
                    ->where('credit_amount', $credit)
                    ->when(! empty($ref), fn ($q) => $q->where('reference_no', $ref))
                    ->whereNull('cancelled_at')
                    ->exists();

                if ($existsInDb) {
                    $isDuplicate = true;
                    $warnings[] = 'Kandidat duplikat terdeteksi pada database buku besar.';
                }
            }

            // Status decision
            $status = 'VALID';
            if (! empty($errors)) {
                $status = 'ERROR';
                $errorCount++;
            } elseif ($isDuplicate) {
                $status = 'DUPLICATE';
                $duplicateCount++;
            } elseif (! empty($warnings)) {
                $status = 'WARNING';
                $warningCount++;
            } else {
                $validCount++;
            }

            $totalDebit += $debit;
            $totalCredit += $credit;

            $parsedRows[] = [
                'row_number' => $rowNum,
                'status' => $status,
                'date' => $parsedDate ?? $rawDate,
                'category_code' => $canonicalCategoryCode,
                'original_category' => $rawCategory,
                'category_id' => $categoryId,
                'account_id' => $account?->id,
                'account_name' => $account?->display_name ?? 'Default Bank',
                'reference_no' => $ref,
                'description' => $desc,
                'debit' => $debit,
                'credit' => $credit,
                'errors' => $errors,
                'warnings' => $warnings,
            ];
        }

        return [
            'summary' => [
                'total_rows' => count($parsedRows),
                'valid_rows' => $validCount,
                'warning_rows' => $warningCount,
                'error_rows' => $errorCount,
                'duplicate_candidates' => $duplicateCount,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'can_commit' => $errorCount === 0 && count($parsedRows) > 0,
            ],
            'rows' => $parsedRows,
        ];
    }

    /**
     * Commit batch of staged rows into AccountingTransaction with all-or-nothing rollback.
     */
    public function commitBatch(Division $division, AccountingPeriod $period, array $rows, User $user, ?string $idempotencyKey = null): array
    {
        return DB::transaction(function () use ($division, $period, $rows, $user, $idempotencyKey) {
            // All-or-nothing verification
            $hasErrors = collect($rows)->contains(fn ($r) => ($r['status'] ?? '') === 'ERROR' || ! empty($r['errors']));
            if ($hasErrors) {
                throw new InvalidArgumentException('Batch mengandung baris error. Seluruh commit dibatalkan untuk menjaga integritas data.');
            }

            $insertedCount = 0;
            $batchId = (string) Str::uuid();

            foreach ($rows as $r) {
                if (empty($r['category_id']) || empty($r['account_id'])) {
                    continue;
                }

                AccountingTransaction::create([
                    'id' => (string) Str::uuid(),
                    'division_id' => $division->id,
                    'period_id' => $period->id,
                    'account_id' => $r['account_id'],
                    'category_id' => $r['category_id'],
                    'transaction_date' => $r['date'] ?? now()->format('Y-m-d'),
                    'description' => $r['description'] ?? 'Transaksi impor',
                    'reference_no' => $r['reference_no'] ?? null,
                    'debit_amount' => (int) ($r['debit'] ?? 0),
                    'credit_amount' => (int) ($r['credit'] ?? 0),
                    'is_draft' => false,
                    'created_by_id' => $user->id,
                    'idempotency_key' => $idempotencyKey ? "{$idempotencyKey}-{$insertedCount}" : null,
                ]);

                $insertedCount++;
            }

            return [
                'batch_id' => $batchId,
                'inserted_count' => $insertedCount,
                'period_id' => $period->id,
                'committed_at' => now()->toIso8601String(),
            ];
        });
    }

    /**
     * Parse date string or Excel serial number.
     */
    private function parseDate(mixed $dateVal): ?string
    {
        if (empty($dateVal)) {
            return null;
        }

        if (is_numeric($dateVal)) {
            // Excel serial date format (days since 1899-12-30)
            try {
                $days = (int) $dateVal;
                $date = Carbon::create(1899, 12, 30)->addDays($days);

                return $date->format('Y-m-d');
            } catch (Exception) {
                return null;
            }
        }

        try {
            $parsed = Carbon::parse($dateVal);

            return $parsed->format('Y-m-d');
        } catch (Exception) {
            return null;
        }
    }

    /**
     * Canonicalize category code (e.g. '2a' -> 'B2a', '2.a' -> 'B2a').
     */
    private function canonicalizeCategoryCode(string $code): string
    {
        $trim = trim($code);
        $upper = strtoupper($trim);

        if (preg_match('/^2\.?([A-Z])$/i', $upper, $m)) {
            return 'B2'.strtolower($m[1]);
        }

        if (preg_match('/^B2\.?([A-Z])$/i', $upper, $m)) {
            return 'B2'.strtolower($m[1]);
        }

        return $trim;
    }

    /**
     * Parse raw rows from .xlsx file using built-in ZipArchive and SimpleXML.
     */
    private function extractRowsFromXlsx(UploadedFile $file): array
    {
        $zip = new ZipArchive;
        if ($zip->open($file->getRealPath()) !== true) {
            throw new InvalidArgumentException('Gagal membuka file Excel (.xlsx). Pastikan berkas valid.');
        }

        // 1. Read shared strings
        $sharedStrings = [];
        $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($stringsXml) {
            $xml = new SimpleXMLElement($stringsXml);
            foreach ($xml->si as $si) {
                $sharedStrings[] = (string) ($si->t ?? '');
            }
        }

        // 2. Read sheet1 or budgeting sheet
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if (! $sheetXml) {
            // Try looking for sheets in workbook
            for ($i = 1; $i <= 10; $i++) {
                $content = $zip->getFromName("xl/worksheets/sheet{$i}.xml");
                if ($content) {
                    $sheetXml = $content;
                    break;
                }
            }
        }

        $zip->close();

        if (! $sheetXml) {
            return [];
        }

        $xml = new SimpleXMLElement($sheetXml);
        $rowsData = [];
        $headerMap = [];

        foreach ($xml->sheetData->row as $row) {
            $rowArr = [];
            foreach ($row->c as $c) {
                $attr = $c->attributes();
                $ref = (string) $attr['r'];
                preg_match('/([A-Z]+)([0-9]+)/', $ref, $m);
                $col = $m[1] ?? 'A';

                $val = (string) $c->v;
                if (isset($attr['t']) && (string) $attr['t'] === 's') {
                    $val = $sharedStrings[(int) $val] ?? $val;
                }
                $rowArr[$col] = trim($val);
            }

            if (empty($headerMap)) {
                // Find headers
                $lowerValues = array_map('strtolower', array_values($rowArr));
                if (in_array('tanggal', $lowerValues) || in_array('date', $lowerValues) || in_array('kategori', $lowerValues)) {
                    foreach ($rowArr as $col => $headerName) {
                        $headerMap[strtolower($headerName)] = $col;
                    }

                    continue;
                }
            }

            if (! empty($headerMap)) {
                $tglCol = $headerMap['tanggal'] ?? $headerMap['date'] ?? 'A';
                $refCol = $headerMap['ref'] ?? $headerMap['no bukti'] ?? 'B';
                $rekCol = $headerMap['rekening'] ?? $headerMap['bank'] ?? 'C';
                $katCol = $headerMap['kategori'] ?? 'D';
                $debCol = $headerMap['debit'] ?? 'E';
                $kreCol = $headerMap['kredit'] ?? $headerMap['credit'] ?? 'F';
                $ketCol = $headerMap['keterangan'] ?? $headerMap['deskripsi'] ?? 'G';

                if (! empty($rowArr[$tglCol]) || ! empty($rowArr[$katCol])) {
                    $rowsData[] = [
                        'transaction_date' => $rowArr[$tglCol] ?? '',
                        'reference_no' => $rowArr[$refCol] ?? '',
                        'account_number' => $rowArr[$rekCol] ?? '',
                        'category_code' => $rowArr[$katCol] ?? '',
                        'debit' => $rowArr[$debCol] ?? 0,
                        'credit' => $rowArr[$kreCol] ?? 0,
                        'description' => $rowArr[$ketCol] ?? '',
                    ];
                }
            }
        }

        return $rowsData;
    }
}
