<?php

namespace App\Services\Cellular;

use DateTimeImmutable;
use InvalidArgumentException;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Reader\Xls;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use ZipArchive;

class ReportPreviewReader
{
    public const PROFILES = ['daily', 'income', 'shift', 'ecsys', 'update'];

    private array $issues = [];

    private int $formulaCount = 0;

    public function read(string $path, string $extension, string $profile, string $month): array
    {
        $this->issues = [];
        $this->formulaCount = 0;
        if (! in_array($profile, self::PROFILES, true) || ! preg_match('/^20\d{2}-(0[1-9]|1[0-2])$/', $month)) {
            throw new InvalidArgumentException('Profil atau periode tidak valid.');
        }
        if (! is_file($path) || filesize($path) > 10 * 1024 * 1024 || ! in_array($extension, ['xls', 'xlsx'], true)) {
            throw new InvalidArgumentException('Gunakan berkas XLS/XLSX maksimal 10 MB.');
        }
        if ($extension === 'xlsx') {
            $this->checkZip($path);
        } else {
            $bytes = file_get_contents($path);
            if (! str_starts_with($bytes, hex2bin('d0cf11e0a1b11ae1')) || str_contains($bytes, '_VBA_PROJECT') || str_contains($bytes, "_\0V\0B\0A\0_\0P\0R\0O\0J\0E\0C\0T")) {
                throw new InvalidArgumentException('XLS harus berformat BIFF tanpa proyek macro.');
            }
        }
        $reader = $extension === 'xls' ? new Xls : new Xlsx;
        if (! $reader->canRead($path)) {
            throw new InvalidArgumentException('Isi berkas tidak sesuai ekstensi XLS/XLSX.');
        }
        $info = $reader->listWorksheetInfo($path);
        if (count($info) > 40) {
            throw new InvalidArgumentException('Workbook melebihi batas 40 worksheet.');
        }
        $names = array_column($info, 'worksheetName');
        $wanted = $profile === 'daily'
            ? array_values(array_filter($names, fn ($name) => preg_match('/^(?:[1-9]|[12]\d|3[01])$/', $name)))
            : [match ($profile) {
                'income' => 'PENDAPATAN & PENGELUARAN', 'shift' => 'SALES PER SHIFT',
                'ecsys' => 'ECSYS', 'update' => 'ALL CELLULAR',
            }];
        if (! $wanted || array_diff($wanted, $names)) {
            throw new InvalidArgumentException('Worksheet profil tidak ditemukan. Pilih profil sesuai laporan.');
        }
        foreach ($info as $sheet) {
            if (in_array($sheet['worksheetName'], $wanted, true) && ($sheet['totalRows'] > 2000 || $sheet['totalColumns'] > 256)) {
                throw new InvalidArgumentException('Dimensi worksheet profil melebihi batas preview.');
            }
        }
        $reader->setReadDataOnly(true)->setReadEmptyCells(false)->setLoadSheetsOnly($wanted);
        $reader->setReadFilter(new class implements IReadFilter
        {
            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                return $row <= 300 && Coordinate::columnIndexFromString($columnAddress) <= 23;
            }
        });
        $workbook = $reader->load($path);
        try {
            if ($workbook->hasMacros() || $workbook->getExcelCalendar() !== Date::CALENDAR_WINDOWS_1900) {
                throw new InvalidArgumentException('Macro atau kalender Excel ini belum didukung.');
            }
            $rows = [];
            foreach ($workbook->getWorksheetIterator() as $sheet) {
                $rows = [...$rows, ...$this->extract($sheet, $profile, $month)];
            }
            if (! $rows) {
                throw new InvalidArgumentException('Tidak ada tanggal bisnis yang dapat dibaca.');
            }
            usort($rows, fn ($a, $b) => strcmp($a['date'], $b['date']));
            $dates = array_column($rows, 'date');
            if (count(array_unique($dates)) !== count($dates)) {
                throw new InvalidArgumentException('Tanggal bisnis duplikat di dalam sumber.');
            }
            if ($this->formulaCount) {
                $this->issue('FORMULA_CACHE', 'Nilai formula memakai cache terakhir; freshness belum terbukti. Formula dan tautan eksternal tidak dijalankan.');
            }
            $days = (int) (new DateTimeImmutable($month.'-01'))->format('t');
            $missing = array_values(array_diff(array_map(fn ($day) => $month.'-'.str_pad((string) $day, 2, '0', STR_PAD_LEFT), range(1, $days)), $dates));
            if ($missing) {
                $this->issue('MISSING_DATES', 'Tanggal belum tersedia: '.implode(', ', $missing));
            }

            return [
                'profile' => $profile, 'profile_version' => 1, 'month' => $month,
                'outlet' => 'DATA CELLULAR T3', 'sha256' => hash_file('sha256', $path),
                'rows' => $rows, 'issues' => $this->issues, 'can_commit' => false,
                'summary' => ['days' => count($rows), 'gross' => count(array_filter($rows, fn ($r) => $r['values']['gross']['value'] === null)) ? null : round(array_sum(array_map(fn ($r) => $r['values']['gross']['value'], $rows)), 2), 'formula_cells' => $this->formulaCount],
                'coverage' => ['loaded_sheets' => $wanted, 'ignored_sheets' => array_values(array_diff($names, $wanted)), 'scope' => 'Ringkasan harian profil v1; sel di luar adapter tidak divalidasi.'],
            ];
        } finally {
            $workbook->disconnectWorksheets();
        }
    }

    private function extract(Worksheet $sheet, string $profile, string $month): array
    {
        $identity = $profile === 'daily' ? 'D2' : ($profile === 'update' ? 'F4' : 'D3');
        if (! str_contains(strtoupper((string) $this->cached($sheet->getCell($identity))), 'DATA CELLULAR T3')) {
            throw new InvalidArgumentException('Identitas outlet harus DATA CELLULAR T3 pada header sumber.');
        }
        $header = $profile === 'ecsys' ? 'E9' : 'A1';
        $expected = match ($profile) {
            'daily' => 'DATA PENJUALAN DAN STOCK', 'income' => 'REKAP OMSET DAN TRANSFER OMSET',
            'shift' => 'OMSET PER SHIFT', 'ecsys' => 'OMSET REAL', 'update' => 'DAILY REPORT CELLULAR',
        };
        if (! str_contains(strtoupper((string) $this->cached($sheet->getCell($header))), $expected)) {
            throw new InvalidArgumentException('Header tidak sesuai adapter profil v1.');
        }
        $labels = match ($profile) {
            'daily' => ['A257' => 'TOTAL PENDAPATAN', 'A258' => 'EDC', 'A259' => 'QRIS', 'A260' => 'PENDAPATAN CASH'],
            'income' => ['J6' => 'TOTAL', 'L6' => 'EDC', 'M6' => 'QRIS', 'P6' => 'JUMLAH SETORAN'],
            'shift' => ['J6' => 'JML SHIFT 1', 'P6' => 'JML SHIFT 2', 'V6' => 'JML SHIFT 3', 'W6' => 'TOTAL'],
            'ecsys' => ['F9' => 'EXC. PPN', 'H9' => 'REALISASI ECSYS', 'I9' => 'TOTAL NET SALES', 'J9' => 'MASUK ECSYS'],
            'update' => ['F5' => 'SHIFT 1', 'G5' => 'SHIFT 2', 'H5' => 'SHIFT 3', 'I5' => 'TOTAL'],
        };
        foreach ($labels as $coordinate => $label) {
            $actual = strtoupper(trim(preg_replace('/\s+/', ' ', (string) $this->cached($sheet->getCell($coordinate)))));
            if ($actual !== $label) {
                throw new InvalidArgumentException('Posisi kolom berubah; header tidak sesuai adapter v1.');
            }
        }
        if ($profile === 'update') {
            $months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
            $label = strtoupper((string) $this->cached($sheet->getCell('A2')));
            if (! str_contains($label, $months[(int) substr($month, 5, 2) - 1].' '.substr($month, 0, 4))) {
                throw new InvalidArgumentException('Periode header tidak sesuai bulan yang dipilih.');
            }
        } else {
            $period = $this->date($this->cached($sheet->getCell($profile === 'daily' ? 'D4' : ($profile === 'ecsys' ? 'D6' : 'D4'))));
            if (! $period || substr($period, 0, 7) !== $month) {
                throw new InvalidArgumentException('Periode sumber tidak sesuai bulan yang dipilih.');
            }
        }
        $rows = [];
        $start = match ($profile) {
            'daily' => 1, 'update' => 6, 'ecsys' => 11, default => 9
        };
        $end = $profile === 'daily' ? 1 : $start + 30;
        foreach (range($start, $end) as $row) {
            $rawDate = $this->cached($sheet->getCell($profile === 'daily' ? 'D4' : ($profile === 'update' ? 'A'.$row : 'D'.$row)));
            if ($rawDate === null || $rawDate === '') {
                continue;
            }
            if ($profile === 'update') {
                if (! is_numeric($rawDate) || (int) $rawDate != $rawDate || $rawDate < 1 || $rawDate > 31) {
                    continue; // Row after the day list may contain the monthly total.
                }
                $date = $month.'-'.str_pad((string) (int) $rawDate, 2, '0', STR_PAD_LEFT);
                if (! checkdate((int) substr($month, 5), (int) $rawDate, (int) substr($month, 0, 4))) {
                    throw new InvalidArgumentException('Nomor hari di luar kalender bulan.');
                }
            } else {
                $date = $this->date($rawDate);
            }
            if (! $date || substr($date, 0, 7) !== $month) {
                throw new InvalidArgumentException('Tanggal baris tidak sesuai periode atau tidak valid.');
            }
            $map = match ($profile) {
                'daily' => ['gross' => 'D257', 'edc' => 'D258', 'qris' => 'D259', 'cash' => 'D260', 'expense' => 'D265', 'expected_deposit' => 'D267'],
                'income' => ['gross' => 'J', 'edc' => 'L', 'qris' => 'M', 'expense' => 'N', 'expected_deposit' => 'P', 'transfer_1' => 'T', 'transfer_2' => 'V'],
                'shift' => ['gross' => 'W', 'shift_1' => 'J', 'shift_2' => 'P', 'shift_3' => 'V'],
                'ecsys' => ['gross' => 'E', 'source_net' => 'F', 'ecsys_realization' => 'H', 'ecsys_net' => 'I', 'ecsys_entered' => 'J'],
                'update' => ['gross' => 'I', 'shift_1' => 'F', 'shift_2' => 'G', 'shift_3' => 'H'],
            };
            $values = [];
            foreach ($map as $metric => $column) {
                $values[$metric] = $this->number($sheet, $profile === 'daily' ? $column : $column.$row, $date);
            }
            if (in_array($profile, ['shift', 'update'], true) && ! in_array(null, array_column($values, 'value'), true)) {
                $diff = round($values['shift_1']['value'] + $values['shift_2']['value'] + $values['shift_3']['value'] - $values['gross']['value'], 2);
                if (abs($diff) >= 0.01) {
                    $this->issue('SHIFT_SUM_MISMATCH', 'Jumlah shift berbeda dari bruto harian.', $date, $sheet->getTitle(), $values['gross']['cell'], $diff);
                }
            }
            if ($profile === 'income' && ! in_array(null, [$values['transfer_1']['value'], $values['transfer_2']['value'], $values['expected_deposit']['value']], true)) {
                $diff = round($values['transfer_1']['value'] + $values['transfer_2']['value'] - $values['expected_deposit']['value'], 2);
                if (abs($diff) >= 0.01) {
                    $this->issue('DEPOSIT_VARIANCE', 'Transfer berbeda dari rencana setoran; bukan omzet tambahan.', $date, $sheet->getTitle(), 'T'.$row.'/V'.$row.'/P'.$row, $diff);
                }
            }
            $references = [];
            if ($profile === 'income') {
                foreach (['S' => 'Tanggal transfer Mandiri', 'U' => 'Tanggal transfer BCA'] as $column => $label) {
                    $raw = $this->cached($sheet->getCell($column.$row));
                    $references[] = ['label' => $label, 'sheet' => $sheet->getTitle(), 'cell' => $column.$row, 'raw' => $this->date($raw) ?? (is_scalar($raw) ? mb_substr((string) $raw, 0, 100) : null)];
                }
            }
            $rows[] = ['date' => $date, 'values' => $values, 'references' => $references];
        }

        return $rows;
    }

    private function cached(Cell $cell): mixed
    {
        return $cell->isFormula() ? $cell->getOldCalculatedValue() : $cell->getValue();
    }

    private function number(Worksheet $sheet, string $coordinate, string $date): array
    {
        $cell = $sheet->getCell($coordinate);
        $raw = $this->cached($cell);
        if ($cell->isFormula()) {
            $this->formulaCount++;
        }
        $value = (is_int($raw) || is_float($raw)) && is_finite((float) $raw) && abs($raw) <= 1e12 ? round((float) $raw, 2) : null;
        if ($value === null) {
            $this->issue('INVALID_VALUE', 'Nilai kosong, error atau bukan angka; tidak dinormalisasi ke nol.', $date, $sheet->getTitle(), $coordinate);
        }

        return ['value' => $value, 'raw' => is_scalar($raw) ? mb_substr((string) $raw, 0, 500) : null, 'sheet' => $sheet->getTitle(), 'cell' => $coordinate, 'formula' => $cell->isFormula() ? mb_substr((string) $cell->getValue(), 0, 1000) : null, 'cached' => $cell->isFormula()];
    }

    private function date(mixed $value): ?string
    {
        if (is_numeric($value) && $value >= 36526 && $value < 73416) {
            return Date::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }
        if (is_string($value) && preg_match('/^(20\d{2}-\d{2}-\d{2})(?: 00:00:00)?$/', $value, $m)) {
            $parts = explode('-', $m[1]);

            return checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0]) ? $m[1] : null;
        }

        return null;
    }

    private function issue(string $code, string $message, ?string $date = null, ?string $sheet = null, ?string $cell = null, ?float $difference = null): void
    {
        $this->issues[] = compact('code', 'message', 'date', 'sheet', 'cell', 'difference');
    }

    private function checkZip(string $path): void
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw new InvalidArgumentException('XLSX bukan arsip ZIP valid.');
        }
        try {
            if ($zip->numFiles > 1000) {
                throw new InvalidArgumentException('Jumlah anggota ZIP melebihi batas.');
            }
            $expanded = 0;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                $expanded += $entry['size'];
                if ($expanded > 40 * 1024 * 1024 || $entry['size'] > 8 * 1024 * 1024 || ($entry['size'] > 1024 * 1024 && $entry['size'] > max(1, $entry['comp_size']) * 200)) {
                    throw new InvalidArgumentException('Batas dekompresi workbook terlampaui.');
                }
                if (preg_match('~(?:^/|(?:^|/)\.\.(?:/|$)|vbaProject|activeX|embeddings)~i', $entry['name'])) {
                    throw new InvalidArgumentException('Konten aktif atau path arsip tidak diizinkan.');
                }
                if (preg_match('/\.(xml|rels)$/i', $entry['name']) && preg_match('/<!\s*(DOCTYPE|ENTITY)/i', $zip->getFromIndex($i))) {
                    throw new InvalidArgumentException('Deklarasi DTD/entity XML tidak diizinkan.');
                }
            }
        } finally {
            $zip->close();
        }
    }
}
