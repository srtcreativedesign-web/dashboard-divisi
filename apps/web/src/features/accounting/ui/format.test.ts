import { describe,it,expect } from 'vitest';
import { formatRupiah, formatDate } from './format';
describe('Format tampilan Accounting',()=>{
 it('mempertahankan sen nominal besar tanpa Number',()=>{expect(formatRupiah('90000000000000.01')).toBe('Rp 90.000.000.000.000,01');expect(formatRupiah('-1000.05')).toBe('-Rp 1.000,05');});
 it('membedakan nol dari nominal yang tidak tersedia',()=>{expect(formatRupiah('0')).toBe('Rp 0,00');expect(formatRupiah('invalid')).toBe('Nominal tidak tersedia');});
 it('menampilkan tanggal bisnis tanpa pergeseran timezone',()=>{expect(formatDate('2026-10-06')).toBe('6 Okt 2026');expect(formatDate('2026-02-30')).toBe('2026-02-30');});
});
