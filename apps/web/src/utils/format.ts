export function formatRupiah(value: string | number): string {
 const source = typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : String(value);
 const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(source);
 if (!match) return 'Nominal tidak tersedia';
 const [, sign, whole, fraction = ''] = match;
 return `${sign}Rp ${new Intl.NumberFormat('id-ID').format(BigInt(whole!))},${fraction.padEnd(2,'0')}`;
}
export function formatDate(value: string): string {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
 const date = new Date(`${value}T00:00:00Z`);
 if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) return value;
 return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(date);
}
