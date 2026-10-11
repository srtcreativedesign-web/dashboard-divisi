<?php

namespace Tests\Support;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xls;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CellularReportFixture
{
    private static function save(Spreadsheet $book, string $extension): string
    {
        $path = tempnam(sys_get_temp_dir(), 'cel-fixture-');
        $writer = $extension === 'xls' ? new Xls($book) : new Xlsx($book);
        $writer->save($path);
        $book->disconnectWorksheets();

        return $path;
    }

    public static function income(string $extension = 'xlsx'): string
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet()->setTitle('PENDAPATAN & PENGELUARAN');
        foreach (['A1' => 'REKAP OMSET DAN TRANSFER OMSET', 'D3' => 'DATA CELLULAR T3', 'D4' => '2026-09-01', 'J6' => 'TOTAL', 'L6' => 'EDC', 'M6' => 'QRIS', 'P6' => 'JUMLAH SETORAN', 'D9' => '2026-09-01', 'J9' => 1100, 'L9' => 300, 'M9' => 100, 'N9' => 0, 'P9' => 700, 'T9' => 720, 'V9' => 0, 'S9' => '2026-09-03'] as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        return self::save($book, $extension);
    }

    public static function daily(string $extension = 'xlsx'): string
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet()->setTitle('1');
        foreach (['A1' => 'DATA PENJUALAN DAN STOCK', 'D2' => 'DATA CELLULAR T3', 'D4' => '2026-09-01',
            'A257' => 'TOTAL PENDAPATAN', 'D257' => 1100, 'A258' => 'EDC', 'D258' => 300,
            'A259' => 'QRIS', 'D259' => 100, 'A260' => 'PENDAPATAN CASH', 'D260' => 700,
            'D265' => 0, 'D267' => 700] as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }

        return self::save($book, $extension);
    }

    public static function shift(string $extension = 'xlsx'): string
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet()->setTitle('SALES PER SHIFT');
        foreach (['A1' => 'OMSET PER SHIFT', 'D3' => 'DATA CELLULAR T3', 'D4' => '2026-09-01',
            'J6' => 'JML SHIFT 1', 'P6' => 'JML SHIFT 2', 'V6' => 'JML SHIFT 3', 'W6' => 'TOTAL',
            'D9' => '2026-09-01', 'J9' => 300, 'P9' => 300, 'V9' => 500, 'W9' => 1100] as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }

        return self::save($book, $extension);
    }
}
