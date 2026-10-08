<?php

namespace Tests\Support;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xls;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CellularReportFixture
{
    public static function income(string $extension = 'xlsx'): string
    {
        $book = new Spreadsheet;
        $sheet = $book->getActiveSheet()->setTitle('PENDAPATAN & PENGELUARAN');
        foreach (['A1' => 'REKAP OMSET DAN TRANSFER OMSET', 'D3' => 'DATA CELLULAR T3', 'D4' => '2026-09-01', 'J6' => 'TOTAL', 'L6' => 'EDC', 'M6' => 'QRIS', 'P6' => 'JUMLAH SETORAN', 'D9' => '2026-09-01', 'J9' => 1100, 'L9' => 300, 'M9' => 100, 'N9' => 0, 'P9' => 700, 'T9' => 720, 'V9' => 0, 'S9' => '2026-09-03'] as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        $path = tempnam(sys_get_temp_dir(), 'cel-fixture-');
        $writer = $extension === 'xls' ? new Xls($book) : new Xlsx($book);
        $writer->save($path);
        $book->disconnectWorksheets();

        return $path;
    }
}
