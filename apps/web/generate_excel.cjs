const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../../dummy_data');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function createSheetData(divisionCode, outletCode, multiplier) {
    // Generate transactions specific to the division
    return [
        ['tanggal', 'kategori', 'rekening', 'debit', 'kredit', 'keterangan'],
        ['2026-09-01', 'PNJL', '1101', 5000000 * multiplier, 0, `Pendapatan Penjualan ${divisionCode} - ${outletCode}`],
        ['2026-09-02', 'BIAYA', '1101', 0, 1500000 * multiplier, `Biaya Operasional ${divisionCode} - ${outletCode}`],
        ['2026-09-03', 'PNJL', '1102', 3000000 * multiplier, 0, `Pendapatan Jasa ${divisionCode}`],
        ['2026-09-05', 'BIAYA', '1102', 0, 500000 * multiplier, `Biaya Promosi ${divisionCode}`],
        ['2026-09-10', 'PNJL', '1101', 7500000 * multiplier, 0, `Pendapatan Proyek Khusus ${divisionCode}`],
    ];
}

// Generate data for WRAP (Wrapping)
const wrapData = createSheetData('WRAP', 'T3-A', 1);
// Generate data for MINI (Minimarket)
const miniData = createSheetData('MINI', 'T3I', 0.8);
// Generate data for FNB (Food and Beverage)
const fnbData = createSheetData('FNB', 'T3INT', 1.5);

function writeExcel(filename, data) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fullPath = path.join(outDir, filename);
    XLSX.writeFile(wb, fullPath);
    console.log('Created: ' + fullPath);
}

writeExcel('Seed_WRAP_Sep2026.xlsx', wrapData);
writeExcel('Seed_MINI_Sep2026.xlsx', miniData);
writeExcel('Seed_FNB_Sep2026.xlsx', fnbData);

console.log('Selesai membuat data seed Excel!');
