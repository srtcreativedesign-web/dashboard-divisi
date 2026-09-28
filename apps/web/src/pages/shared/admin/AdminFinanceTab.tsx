import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { TableWrap, TableHead } from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import { AccountingQueryState } from '../../../components/accounting/AccountingStates';
import { adminApi, type CashlessRecord, type Deposit, type LaundryRecord, type PnlSupportData, type StockCard, type Voucher } from '../../../api/admin';
import { AdminField, StatusBadge, rupiah, today } from './AdminBits';

const STOCK_ITEMS = ['Oil', 'Cream', 'Aqua', 'Free Drink', 'Tissue', 'Sabun', 'Handuk'];
const BANK_OPTIONS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB', 'Danamon'];

const KPI = [
  { key: 'total_revenue', label: 'Omzet', tone: 'border-emerald-200 bg-emerald-50', value: 'text-emerald-900', note: 'Tunai + QRIS/EDC' },
  { key: 'total_hbp', label: 'HBP', tone: 'border-amber-200 bg-amber-50', value: 'text-amber-900', note: 'Akumulasi COGS bahan' },
  { key: 'laundry_cost', label: 'Laundry', tone: 'border-rose-200 bg-rose-50', value: 'text-rose-900', note: 'Cuci handuk/seragam' },
  { key: 'gross_margin', label: 'Margin Kotor', tone: 'border-indigo-200 bg-indigo-50', value: 'text-indigo-900', note: 'Omzet - HBP - Laundry' },
] as const;

export default function AdminFinanceTab({ divCode }: { divCode: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pnl, setPnl] = useState<PnlSupportData | null>(null);
  const [stockList, setStockList] = useState<StockCard[]>([]);
  const [depositList, setDepositList] = useState<Deposit[]>([]);
  const [cashlessList, setCashlessList] = useState<CashlessRecord[]>([]);
  const [laundryList, setLaundryList] = useState<LaundryRecord[]>([]);
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);

  const [stockForm, setStockForm] = useState<Partial<StockCard>>({ date: today(), item_name: 'Oil' });
  const [depositForm, setDepositForm] = useState<Partial<Deposit>>({ date: today(), shift: 1, bank_destination: 'BCA' });
  const [cashlessForm, setCashlessForm] = useState<Partial<CashlessRecord>>({ date: today(), shift: 1, nominal_qris: 0, nominal_edc: 0 });
  const [laundryForm, setLaundryForm] = useState<Partial<LaundryRecord>>({ date: today(), weight_kg: 0, cost_per_kg: 8000, vendor_name: 'Laundry Berkah' });
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>({ type: 'PURCHASING' });
  const [saving, setSaving] = useState<string | null>(null);

  const refreshPnl = useCallback(async () => {
    try {
      const res = await adminApi.getPnlSupport({ division_code: divCode });
      setPnl(res.data);
    } catch {
      /* non-critical */
    }
  }, [divCode]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [stock, deposit, cashless, laundry] = await Promise.all([
        adminApi.getStockCards({ division_code: divCode }),
        adminApi.getDeposits({ division_code: divCode }),
        adminApi.getCashless({ division_code: divCode }),
        adminApi.getLaundry({ division_code: divCode }),
      ]);
      setStockList(stock.data ?? []);
      setDepositList(deposit.data ?? []);
      setCashlessList(cashless.data ?? []);
      setLaundryList(laundry.data ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal memuat data keuangan', 'error');
    } finally {
      setLoading(false);
    }
  }, [divCode, toast]);

  useEffect(() => {
    void refreshPnl();
    void reload();
  }, [refreshPnl, reload]);

  const err = (e: unknown, fallback: string) => toast(e instanceof Error ? e.message : fallback, 'error');

  const saveCashless = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('cashless');
    try {
      const res = await adminApi.createCashless({
        division_code: divCode,
        outlet_id: 1,
        date: cashlessForm.date!,
        shift: Number(cashlessForm.shift) || 1,
        nominal_qris: Number(cashlessForm.nominal_qris) || 0,
        nominal_edc: Number(cashlessForm.nominal_edc) || 0,
        no_storan_finance: cashlessForm.no_storan_finance,
      });
      setCashlessList((p) => [res.data, ...p]);
      setCashlessForm({ date: today(), shift: 1, nominal_qris: 0, nominal_edc: 0 });
      toast('Rincian cashless tersimpan', 'success');
      void refreshPnl();
    } catch (e) { err(e, 'Gagal menyimpan cashless'); } finally { setSaving(null); }
  };

  const saveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('stock');
    try {
      const qtyOut = Number(stockForm.qty_out) || 0;
      const unitCost = Number(stockForm.unit_cost) || 0;
      const res = await adminApi.createStockCard({
        division_code: divCode,
        outlet_id: 1,
        item_name: stockForm.item_name!,
        date: stockForm.date!,
        qty_initial: Number(stockForm.qty_initial) || 0,
        qty_in: Number(stockForm.qty_in) || 0,
        qty_out: qtyOut,
        qty_actual: Number(stockForm.qty_actual) || 0,
        unit_cost: unitCost,
      });
      setStockList((p) => [{ ...res.data, cogs: qtyOut * unitCost }, ...p]);
      setStockForm({ date: today(), item_name: 'Oil' });
      toast('Stok opname & HBP tersimpan', 'success');
      void refreshPnl();
    } catch (e) { err(e, 'Gagal menyimpan stok'); } finally { setSaving(null); }
  };

  const saveLaundry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('laundry');
    try {
      const res = await adminApi.createLaundry({
        division_code: divCode,
        outlet_id: 1,
        date: laundryForm.date!,
        weight_kg: Number(laundryForm.weight_kg) || 0,
        cost_per_kg: Number(laundryForm.cost_per_kg) || 0,
        vendor_name: laundryForm.vendor_name,
      });
      setLaundryList((p) => [res.data, ...p]);
      setLaundryForm({ date: today(), weight_kg: 0, cost_per_kg: 8000, vendor_name: 'Laundry Berkah' });
      toast('Biaya laundry tersimpan', 'success');
      void refreshPnl();
    } catch (e) { err(e, 'Gagal menyimpan laundry'); } finally { setSaving(null); }
  };

  const saveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('deposit');
    try {
      const res = await adminApi.createDeposit({
        division_code: divCode,
        outlet_id: 1,
        date: depositForm.date!,
        shift: Number(depositForm.shift) || 1,
        cash_collected: Number(depositForm.cash_collected) || 0,
        cash_deposited: Number(depositForm.cash_deposited) || 0,
        bank_destination: depositForm.bank_destination || 'BCA',
      });
      setDepositList((p) => [res.data, ...p]);
      setDepositForm({ date: today(), shift: 1, bank_destination: 'BCA' });
      toast('Setoran kasir tersimpan', 'success');
      void refreshPnl();
    } catch (e) { err(e, 'Gagal menyimpan setoran'); } finally { setSaving(null); }
  };

  const saveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('voucher');
    try {
      const res = await adminApi.createVoucher({
        division_code: divCode,
        type: voucherForm.type!,
        entity_name: voucherForm.entity_name!,
        amount: Number(voucherForm.amount) || 0,
        description: voucherForm.description,
      });
      setVoucherList((p) => [res.data, ...p]);
      setVoucherForm({ type: 'PURCHASING' });
      toast('Voucher tersimpan', 'success');
    } catch (e) { err(e, 'Gagal menyimpan voucher'); } finally { setSaving(null); }
  };

  const laundryEstimate = (Number(laundryForm.weight_kg) || 0) * (Number(laundryForm.cost_per_kg) || 0);

  return (
    <div className="space-y-6">
      {/* Ringkasan PnL */}
      <Card>
        <CardHeader
          title="Data Pendukung PnL & Laba Kotor Harian"
          subtitle={`Tunai Rp ${rupiah(pnl?.revenue_cash)} · QRIS/EDC Rp ${rupiah((pnl?.revenue_qris ?? 0) + (pnl?.revenue_edc ?? 0))}`}
          action={<StatusBadge tone="slate">{pnl?.date ?? today()}</StatusBadge>}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KPI.map((k) => (
            <div key={k.key} className={`rounded-card border p-4 ${k.tone}`}>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">{k.label}</p>
              <p className={`mt-1 text-2xl font-bold ${k.value}`}>Rp {rupiah(pnl?.[k.key])}</p>
              <p className="mt-1 text-xs text-slate-500">{k.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <AccountingQueryState
        loading={loading}
        error={null}
        empty={!stockList.length && !depositList.length && !cashlessList.length && !laundryList.length}
        retry={() => void reload()}
        emptyTitle="Belum ada data keuangan"
        emptyDescription="Catat cashless, stok, laundry, atau setoran kasir untuk mulai membangun angka PnL."
      >
        <div className="space-y-6">
          {/* Cashless */}
          <Card>
            <CardHeader title="Rincian Cashless (QRIS & EDC)" subtitle="Penerimaan non-tunai per shift kasir." />
            <form onSubmit={saveCashless} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Tanggal"><Input type="date" value={cashlessForm.date ?? ''} onChange={(e) => setCashlessForm((p) => ({ ...p, date: e.target.value }))} required /></AdminField>
              <AdminField label="Shift">
                <Select value={cashlessForm.shift ?? 1} onChange={(e) => setCashlessForm((p) => ({ ...p, shift: Number(e.target.value) }))}>
                  <option value={1}>Shift 1</option><option value={2}>Shift 2</option>
                </Select>
              </AdminField>
              <AdminField label="Nominal QRIS (Rp)"><Input type="number" min={0} step="0.01" value={cashlessForm.nominal_qris ?? ''} onChange={(e) => setCashlessForm((p) => ({ ...p, nominal_qris: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Nominal EDC (Rp)"><Input type="number" min={0} step="0.01" value={cashlessForm.nominal_edc ?? ''} onChange={(e) => setCashlessForm((p) => ({ ...p, nominal_edc: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="No. Settlement / Storan Finance" span="sm:col-span-2 lg:col-span-3">
                <Input value={cashlessForm.no_storan_finance ?? ''} onChange={(e) => setCashlessForm((p) => ({ ...p, no_storan_finance: e.target.value }))} placeholder="SETTLE-BCA-20260928" />
              </AdminField>
              <div className="flex items-end">
                <Button type="submit" disabled={saving === 'cashless'} className="w-full">
                  <Plus className="h-4 w-4" /> {saving === 'cashless' ? 'Menyimpan...' : 'Simpan Cashless'}
                </Button>
              </div>
            </form>
            <div className="mt-4">
              <TableWrap minWidth="640px">
                <TableHead>
                  <tr>
                    {['Tanggal', 'Shift', 'QRIS', 'EDC', 'Total', 'Settlement'].map((h) => (
                      <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </TableHead>
                <tbody className="divide-y divide-line">
                  {cashlessList.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-400">Belum ada penerimaan cashless</td></tr>
                  ) : cashlessList.map((row) => (
                    <tr key={row.id} className="hover:bg-surface/50">
                      <td className="p-3 text-sm">{row.date}</td>
                      <td className="p-3 text-sm">Shift {row.shift}</td>
                      <td className="p-3 text-sm">Rp {rupiah(row.nominal_qris)}</td>
                      <td className="p-3 text-sm">Rp {rupiah(row.nominal_edc)}</td>
                      <td className="p-3 text-sm font-semibold text-primary-600">Rp {rupiah((row.nominal_qris ?? 0) + (row.nominal_edc ?? 0))}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{row.no_storan_finance || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </Card>

          {/* Stok */}
          <Card>
            <CardHeader title="Stok Opname & HBP" subtitle="Mutasi bahan habis pakai; COGS dihitung otomatis." />
            <form onSubmit={saveStock} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Tanggal"><Input type="date" value={stockForm.date ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, date: e.target.value }))} required /></AdminField>
              <AdminField label="Nama Barang">
                <Select value={stockForm.item_name ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, item_name: e.target.value }))}>
                  {STOCK_ITEMS.map((i) => <option key={i} value={i}>{i}</option>)}
                </Select>
              </AdminField>
              <AdminField label="Stok Awal"><Input type="number" min={0} value={stockForm.qty_initial ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, qty_initial: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Barang Datang"><Input type="number" min={0} value={stockForm.qty_in ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, qty_in: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Pemakaian (Keluar)"><Input type="number" min={0} value={stockForm.qty_out ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, qty_out: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Stok Fisik (Opname)"><Input type="number" min={0} value={stockForm.qty_actual ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, qty_actual: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Harga Satuan HBP (Rp)"><Input type="number" min={0} step="0.01" value={stockForm.unit_cost ?? ''} onChange={(e) => setStockForm((p) => ({ ...p, unit_cost: Number(e.target.value) }))} required /></AdminField>
              <div className="flex items-end">
                <Button type="submit" disabled={saving === 'stock'} className="w-full">
                  <Plus className="h-4 w-4" /> {saving === 'stock' ? 'Menyimpan...' : 'Simpan Stok & HBP'}
                </Button>
              </div>
            </form>
            <div className="mt-4">
              <TableWrap minWidth="820px">
                <TableHead>
                  <tr>
                    {['Tanggal', 'Item', 'Awal', 'Masuk', 'Keluar', 'Fisik', 'Harga', 'Total HBP'].map((h) => (
                      <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </TableHead>
                <tbody className="divide-y divide-line">
                  {stockList.length === 0 ? (
                    <tr><td colSpan={8} className="p-6 text-center text-sm text-slate-400">Belum ada data stok opname</td></tr>
                  ) : stockList.map((row) => (
                    <tr key={row.id} className="hover:bg-surface/50">
                      <td className="p-3 text-sm">{row.date}</td>
                      <td className="p-3 text-sm font-medium">{row.item_name}</td>
                      <td className="p-3 text-sm">{row.qty_initial}</td>
                      <td className="p-3 text-sm text-emerald-600">+{row.qty_in}</td>
                      <td className="p-3 text-sm text-red-500">-{row.qty_out}</td>
                      <td className="p-3 text-sm font-semibold">{row.qty_actual}</td>
                      <td className="p-3 text-sm">Rp {rupiah(row.unit_cost)}</td>
                      <td className="p-3 text-sm font-bold text-amber-700">Rp {rupiah(row.cogs)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </Card>

          {/* Laundry */}
          <Card>
            <CardHeader title="Biaya Laundry & Kebersihan Outlet" subtitle="Pencatatan kiloan laundry handuk dan kain pelengkap." />
            <form onSubmit={saveLaundry} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Tanggal"><Input type="date" value={laundryForm.date ?? ''} onChange={(e) => setLaundryForm((p) => ({ ...p, date: e.target.value }))} required /></AdminField>
              <AdminField label="Vendor Laundry"><Input value={laundryForm.vendor_name ?? ''} onChange={(e) => setLaundryForm((p) => ({ ...p, vendor_name: e.target.value }))} required /></AdminField>
              <AdminField label="Berat (Kg)"><Input type="number" min={0} step="0.1" value={laundryForm.weight_kg ?? ''} onChange={(e) => setLaundryForm((p) => ({ ...p, weight_kg: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Biaya per Kg (Rp)"><Input type="number" min={0} value={laundryForm.cost_per_kg ?? ''} onChange={(e) => setLaundryForm((p) => ({ ...p, cost_per_kg: Number(e.target.value) }))} required /></AdminField>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-3 rounded-card border border-line bg-surface/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">Estimasi tagihan: <span className="text-base font-bold text-primary-600">Rp {rupiah(laundryEstimate)}</span></p>
                <Button type="submit" disabled={saving === 'laundry'}>
                  <Plus className="h-4 w-4" /> {saving === 'laundry' ? 'Menyimpan...' : 'Simpan Biaya Laundry'}
                </Button>
              </div>
            </form>
            <div className="mt-4">
              <TableWrap minWidth="560px">
                <TableHead>
                  <tr>{['Tanggal', 'Vendor', 'Berat', 'Tarif/Kg', 'Total Biaya'].map((h) => (
                    <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </TableHead>
                <tbody className="divide-y divide-line">
                  {laundryList.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-sm text-slate-400">Belum ada catatan laundry</td></tr>
                  ) : laundryList.map((row) => (
                    <tr key={row.id} className="hover:bg-surface/50">
                      <td className="p-3 text-sm">{row.date}</td>
                      <td className="p-3 text-sm">{row.vendor_name || '-'}</td>
                      <td className="p-3 text-sm">{row.weight_kg} kg</td>
                      <td className="p-3 text-sm">Rp {rupiah(row.cost_per_kg)}</td>
                      <td className="p-3 text-sm font-semibold text-rose-600">Rp {rupiah(row.total_bill)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </Card>

          {/* Setoran kasir */}
          <Card>
            <CardHeader title="Setoran Harian Kasir" subtitle="Rekap uang tunai kasir dan tujuan transfer bank pusat." />
            <form onSubmit={saveDeposit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Tanggal"><Input type="date" value={depositForm.date ?? ''} onChange={(e) => setDepositForm((p) => ({ ...p, date: e.target.value }))} required /></AdminField>
              <AdminField label="Shift">
                <Select value={depositForm.shift ?? 1} onChange={(e) => setDepositForm((p) => ({ ...p, shift: Number(e.target.value) }))}>
                  <option value={1}>Shift 1</option><option value={2}>Shift 2</option>
                </Select>
              </AdminField>
              <AdminField label="Total Tunai Terkumpul"><Input type="number" min={0} step="0.01" value={depositForm.cash_collected ?? ''} onChange={(e) => setDepositForm((p) => ({ ...p, cash_collected: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Jumlah Disetorkan"><Input type="number" min={0} step="0.01" value={depositForm.cash_deposited ?? ''} onChange={(e) => setDepositForm((p) => ({ ...p, cash_deposited: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Bank Tujuan" span="sm:col-span-2">
                <Select value={depositForm.bank_destination ?? 'BCA'} onChange={(e) => setDepositForm((p) => ({ ...p, bank_destination: e.target.value }))}>
                  {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </Select>
              </AdminField>
              <div className="sm:col-span-2 flex items-end">
                <Button type="submit" disabled={saving === 'deposit'} className="w-full">
                  <Plus className="h-4 w-4" /> {saving === 'deposit' ? 'Menyimpan...' : 'Simpan Setoran Kasir'}
                </Button>
              </div>
            </form>
            <div className="mt-4">
              <TableWrap minWidth="680px">
                <TableHead>
                  <tr>{['Tanggal', 'Shift', 'Tunai Kasir', 'Disetorkan', 'Bank', 'Status'].map((h) => (
                    <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </TableHead>
                <tbody className="divide-y divide-line">
                  {depositList.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-400">Belum ada data setoran tunai</td></tr>
                  ) : depositList.map((row) => (
                    <tr key={row.id} className="hover:bg-surface/50">
                      <td className="p-3 text-sm">{row.date}</td>
                      <td className="p-3 text-sm">Shift {row.shift}</td>
                      <td className="p-3 text-sm">Rp {rupiah(row.cash_collected)}</td>
                      <td className="p-3 text-sm font-semibold text-emerald-600">Rp {rupiah(row.cash_deposited)}</td>
                      <td className="p-3 text-sm">{row.bank_destination}</td>
                      <td className="p-3"><StatusBadge tone="green">{row.status || 'VERIFIED'}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </Card>

          {/* Voucher */}
          <Card>
            <CardHeader title="Voucher Pembelian (Restock) & Tagihan" subtitle="Pengajuan pembelian bahan habis pakai atau tagihan vendor luar." />
            <form onSubmit={saveVoucher} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminField label="Jenis Voucher">
                <Select value={voucherForm.type ?? 'PURCHASING'} onChange={(e) => setVoucherForm((p) => ({ ...p, type: e.target.value as Voucher['type'] }))}>
                  <option value="PURCHASING">Pembelian / Restock</option>
                  <option value="BILLING">Tagihan (Billing)</option>
                </Select>
              </AdminField>
              <AdminField label="Nama Vendor / Penerima"><Input value={voucherForm.entity_name ?? ''} onChange={(e) => setVoucherForm((p) => ({ ...p, entity_name: e.target.value }))} placeholder="Supplier Minyak Prima" required /></AdminField>
              <AdminField label="Nominal (Rp)"><Input type="number" min={0} step="0.01" value={voucherForm.amount ?? ''} onChange={(e) => setVoucherForm((p) => ({ ...p, amount: Number(e.target.value) }))} required /></AdminField>
              <AdminField label="Deskripsi / Detail Barang" span="sm:col-span-2 lg:col-span-3">
                <Input value={voucherForm.description ?? ''} onChange={(e) => setVoucherForm((p) => ({ ...p, description: e.target.value }))} placeholder="Restock 20 btl minyak lavender & 10 dus aqua" />
              </AdminField>
              <div className="flex items-end">
                <Button type="submit" disabled={saving === 'voucher'} className="w-full">
                  <Plus className="h-4 w-4" /> {saving === 'voucher' ? 'Menyimpan...' : 'Simpan Voucher'}
                </Button>
              </div>
            </form>
            <div className="mt-4">
              <TableWrap minWidth="760px">
                <TableHead>
                  <tr>{['No. Voucher', 'Jenis', 'Entitas', 'Nominal', 'Keterangan', 'Status'].map((h) => (
                    <th key={h} className="p-3 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </TableHead>
                <tbody className="divide-y divide-line">
                  {voucherList.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-400">Belum ada voucher</td></tr>
                  ) : voucherList.map((row) => (
                    <tr key={row.id} className="hover:bg-surface/50">
                      <td className="p-3 font-mono text-xs font-medium text-primary-600">{row.voucher_no}</td>
                      <td className="p-3"><StatusBadge tone={row.type === 'PURCHASING' ? 'blue' : 'violet'}>{row.type}</StatusBadge></td>
                      <td className="p-3 text-sm">{row.entity_name}</td>
                      <td className="p-3 text-sm font-semibold">Rp {rupiah(row.amount)}</td>
                      <td className="p-3 text-xs text-slate-500">{row.description || '-'}</td>
                      <td className="p-3"><StatusBadge tone="slate">{row.status}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          </Card>
        </div>
      </AccountingQueryState>
    </div>
  );
}
