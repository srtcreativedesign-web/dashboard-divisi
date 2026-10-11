<?php

namespace Tests\Unit;

use App\Services\Cellular\ReportPreviewReader;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tests\Support\CellularReportFixture;
use ZipArchive;

class CellularReportPreviewReaderTest extends TestCase
{
    private array $files = [];

    private function fixture(string $extension = 'xlsx'): string
    {
        return $this->files[] = CellularReportFixture::income($extension);
    }

    protected function tearDown(): void
    {
        foreach ($this->files as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        parent::tearDown();
    }

    public function test_reads_real_xls_and_xlsx_and_derives_deposit_variance_without_posting(): void
    {
        foreach (['xls', 'xlsx'] as $extension) {
            $result = (new ReportPreviewReader)->read($this->fixture($extension), $extension, 'income', '2026-09');
            $this->assertFalse($result['can_commit']);
            $this->assertSame(1100.0, $result['summary']['gross']);
            $this->assertSame('P9', $result['rows'][0]['values']['expected_deposit']['cell']);
            $issue = array_values(array_filter($result['issues'], fn ($i) => $i['code'] === 'DEPOSIT_VARIANCE'))[0];
            $this->assertSame(20.0, $issue['difference']);
        }
    }

    public function test_rejects_period_mismatch(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Periode sumber');
        (new ReportPreviewReader)->read($this->fixture(), 'xlsx', 'income', '2026-10');
    }

    public function test_changed_metric_header_is_rejected_and_wide_formatting_is_filtered(): void
    {
        $path = $this->fixture();
        $zip = new ZipArchive;
        $zip->open($path);
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $xml = str_replace('</row></sheetData>', '<c r="DQ9"><v>999999</v></c></row></sheetData>', $xml);
        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        $zip->close();
        $result = (new ReportPreviewReader)->read($path, 'xlsx', 'income', '2026-09');
        $this->assertSame(1100.0, $result['summary']['gross']);
        $zip->open($path);
        $zip->addFromString('xl/sharedStrings.xml', str_replace('<t>TOTAL</t>', '<t>TOTAL PAJAK</t>', $zip->getFromName('xl/sharedStrings.xml')));
        $zip->close();
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Posisi kolom berubah');
        (new ReportPreviewReader)->read($path, 'xlsx', 'income', '2026-09');
    }

    public function test_ref_error_is_not_converted_to_zero_or_accepted_as_complete_total(): void
    {
        $path = $this->fixture();
        $zip = new ZipArchive;
        $zip->open($path);
        $xml = preg_replace('~<c\b[^>]*r="J9"[^>]*>.*?</c>~s', '<c r="J9" t="e"><v>#REF!</v></c>', $zip->getFromName('xl/worksheets/sheet1.xml'));
        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        $zip->close();
        $result = (new ReportPreviewReader)->read($path, 'xlsx', 'income', '2026-09');
        $this->assertNull($result['summary']['gross']);
        $this->assertSame('#REF!', $result['rows'][0]['values']['gross']['raw']);
        $this->assertContains('INVALID_VALUE', array_column($result['issues'], 'code'));
    }

    public function test_rejects_fake_xls_instead_of_falling_back_to_html(): void
    {
        $path = $this->fixture();
        file_put_contents($path, '<html><table><tr><td>1100</td></tr></table></html>');
        $this->expectException(InvalidArgumentException::class);
        (new ReportPreviewReader)->read($path, 'xls', 'income', '2026-09');
    }

    public function test_cached_external_formula_is_not_executed_and_blank_remains_null(): void
    {
        $path = $this->fixture();
        $zip = new ZipArchive;
        $zip->open($path);
        $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $xml = preg_replace('~<c\b[^>]*r="J9"[^>]*>.*?</c>~s', '<c r="J9"><f>WEBSERVICE(&quot;https://invalid.example&quot;)</f><v>1100</v></c>', $xml);
        $xml = preg_replace('~<c\b[^>]*r="L9"[^>]*>.*?</c>~s', '', $xml);
        $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
        $zip->close();
        $result = (new ReportPreviewReader)->read($path, 'xlsx', 'income', '2026-09');
        $this->assertSame(1100.0, $result['summary']['gross']);
        $this->assertTrue($result['rows'][0]['values']['gross']['cached']);
        $this->assertNull($result['rows'][0]['values']['edc']['value']);
        $this->assertContains('FORMULA_CACHE', array_column($result['issues'], 'code'));
        $this->assertContains('INVALID_VALUE', array_column($result['issues'], 'code'));
    }

    public function test_rejects_zip_bomb_and_dtd_before_loading_reader(): void
    {
        foreach (['bomb' => str_repeat('x', 9 * 1024 * 1024), 'dtd' => '<!DOCTYPE sheet [<!ENTITY a SYSTEM "file:///sensitive">]><sheet/>'] as $kind => $content) {
            $path = $this->fixture();
            $zip = new ZipArchive;
            $zip->open($path);
            $zip->addFromString('xl/extra.xml', $content);
            $zip->close();
            try {
                (new ReportPreviewReader)->read($path, 'xlsx', 'income', '2026-09');
                $this->fail('Workbook berbahaya diterima: '.$kind);
            } catch (InvalidArgumentException $error) {
                $this->assertNotEmpty($error->getMessage());
            }
        }
    }

    public function test_rejects_wrong_identity_and_duplicate_business_dates(): void
    {
        foreach (['identity', 'duplicate'] as $kind) {
            $path = $this->fixture();
            $zip = new ZipArchive;
            $zip->open($path);
            if ($kind === 'identity') {
                $xml = str_replace('DATA CELLULAR T3', 'OUTLET LAIN', $zip->getFromName('xl/sharedStrings.xml'));
                $zip->addFromString('xl/sharedStrings.xml', $xml);
            } else {
                $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
                preg_match('~<row\b[^>]*r="9"[^>]*>.*?</row>~s', $xml, $m);
                $row = str_replace(['r="9"', '9"'], ['r="10"', '10"'], $m[0]);
                $zip->addFromString('xl/worksheets/sheet1.xml', str_replace('</sheetData>', $row.'</sheetData>', $xml));
            }
            $zip->close();
            try {
                (new ReportPreviewReader)->read($path, 'xlsx', 'income', '2026-09');
                $this->fail('Sumber salah diterima: '.$kind);
            } catch (InvalidArgumentException $error) {
                $this->assertNotEmpty($error->getMessage());
            }
        }
    }
}
