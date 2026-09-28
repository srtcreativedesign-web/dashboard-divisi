import React, { useState } from "react";
import { Users, CreditCard, ClipboardList, Package, ShieldAlert, Calendar, User, TrendingUp, Plus, AlertTriangle, CheckCircle, DollarSign, Banknote, FileText } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { adminApi, type ChairUsageAudit, type TherapistRevenue, type StockCard, type Deposit, type Voucher } from "../../api/admin";

const POS_FIELDS = [
  { label: "Tanggal", name: "date", type: "date" },
  { label: "No. Kursi", name: "chair_no", type: "number" },
  { label: "Counter Awal", name: "counter_start", type: "number" },
  { label: "Counter Akhir", name: "counter_end", type: "number" },
  { label: "Jumlah CCTV", name: "cctv_used", type: "number" },
  { label: "Jumlah POS", name: "pos_used", type: "number" },
  { label: "Catatan (wajib jika deviasi)", name: "notes", type: "text" },
];

const THERAPIST_FIELDS = [
  { label: "Tanggal", name: "date", type: "date" },
  { label: "Shift", name: "shift", type: "number", options: [1, 2] },
  { label: "Terapis (Employee ID)", name: "employee_id", type: "number" },
  { label: "Outlet ID", name: "outlet_id", type: "number" },
  { label: "Jumlah Treatment", name: "treatments_count", type: "number" },
  { label: "Revenue Share", name: "revenue_share", type: "number", step: "0.01" },
  { label: "Tips", name: "tips", type: "number", step: "0.01" },
];

const STOCK_ITEMS = ["Oil", "Cream", "Aqua", "Free Drink", "Tissue", "Sabun", "Handuk"];
const BANK_OPTIONS = ["BCA", "Mandiri", "BNI", "BRI", "CIMB", "Danamon"];

export default function DivisionAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"hrm" | "pos" | "finance" | "payroll">("pos");

  // POS Tab State
  const [chairAuditList, setChairAuditList] = useState<ChairUsageAudit[]>([]);
  const [therapistRevenueList, setTherapistRevenueList] = useState<TherapistRevenue[]>([]);
  const [chairForm, setChairForm] = useState<Partial<ChairUsageAudit>>({ date: new Date().toISOString().slice(0, 10) });
  const [therapistForm, setTherapistForm] = useState<Partial<TherapistRevenue>>({ date: new Date().toISOString().slice(0, 10), shift: 1 });
  const [savingChair, setSavingChair] = useState(false);
  const [savingTherapist, setSavingTherapist] = useState(false);

  // Finance Tab State
  const [stockList, setStockList] = useState<StockCard[]>([]);
  const [depositList, setDepositList] = useState<Deposit[]>([]);
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);
  const [stockForm, setStockForm] = useState<Partial<StockCard>>({ date: new Date().toISOString().slice(0, 10), item_name: "Oil" });
  const [depositForm, setDepositForm] = useState<Partial<Deposit>>({ date: new Date().toISOString().slice(0, 10), shift: 1, bank_destination: "BCA" });
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>({ type: "PURCHASING", status: "DRAFT" });
  const [savingStock, setSavingStock] = useState(false);
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [savingVoucher, setSavingVoucher] = useState(false);

  // Handlers
  const handleChairChange = (name: string, value: any) => setChairForm(prev => ({ ...prev, [name]: value }));
  const handleTherapistChange = (name: string, value: any) => setTherapistForm(prev => ({ ...prev, [name]: value }));
  const handleStockChange = (name: string, value: any) => setStockForm(prev => ({ ...prev, [name]: value }));
  const handleDepositChange = (name: string, value: any) => setDepositForm(prev => ({ ...prev, [name]: value }));
  const handleVoucherChange = (name: string, value: any) => setVoucherForm(prev => ({ ...prev, [name]: value }));

  const calculateDeviation = (): number => (chairForm.counter_end ?? 0) - (chairForm.counter_start ?? 0) - (chairForm.pos_used ?? 0);

  // ========== POS HANDLERS ==========
  const handleSaveChair = async (e: React.FormEvent) => {
    e.preventDefault();
    const deviation = calculateDeviation();
    if (deviation !== 0 && !chairForm.notes?.trim()) { toast("Catatan wajib diisi jika ada deviasi", "error"); return; }
    setSavingChair(true);
    try {
      const res = await adminApi.createChairAudit({ division_code: "REFL", outlet_id: 1, date: chairForm.date!, chair_no: Number(chairForm.chair_no!), counter_start: Number(chairForm.counter_start!), counter_end: Number(chairForm.counter_end!), cctv_used: Number(chairForm.cctv_used!), pos_used: Number(chairForm.pos_used!), notes: chairForm.notes });
      setChairAuditList(prev => [res.data, ...prev]);
      toast("Audit kursi berhasil disimpan", "success");
      setChairForm({ date: new Date().toISOString().slice(0, 10) });
    } catch (err: any) { toast(err.message || "Gagal menyimpan audit", "error"); } finally { setSavingChair(false); }
  };

  const handleSaveTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTherapist(true);
    try {
      const res = await adminApi.createTherapistRevenue({ division_code: "REFL", outlet_id: Number(therapistForm.outlet_id!), employee_id: Number(therapistForm.employee_id!), date: therapistForm.date!, shift: Number(therapistForm.shift!), treatments_count: Number(therapistForm.treatments_count!), revenue_share: Number(therapistForm.revenue_share!), tips: Number(therapistForm.tips!) });
      setTherapistRevenueList(prev => [res.data, ...prev]);
      toast("Pendapatan shift terapis berhasil disimpan", "success");
      setTherapistForm({ date: new Date().toISOString().slice(0, 10), shift: 1 });
    } catch (err: any) { toast(err.message || "Gagal menyimpan pendapatan", "error"); } finally { setSavingTherapist(false); }
  };

  // ========== FINANCE HANDLERS ==========
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStock(true);
    try {
      const cogs = (Number(stockForm.qty_out) || 0) * (Number(stockForm.unit_cost) || 0);
      const res = await adminApi.createStockCard({ division_code: "REFL", outlet_id: 1, item_name: stockForm.item_name!, date: stockForm.date!, qty_initial: Number(stockForm.qty_initial!) || 0, qty_in: Number(stockForm.qty_in!) || 0, qty_out: Number(stockForm.qty_out!) || 0, qty_actual: Number(stockForm.qty_actual!) || 0, unit_cost: Number(stockForm.unit_cost!) || 0 });
      const saved = { ...res.data, cogs };
      setStockList(prev => [saved, ...prev]);
      toast("Stok opname berhasil disimpan", "success");
      setStockForm({ date: new Date().toISOString().slice(0, 10), item_name: "Oil" });
    } catch (err: any) { toast(err.message || "Gagal menyimpan stok", "error"); } finally { setSavingStock(false); }
  };

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDeposit(true);
    try {
      const res = await adminApi.createDeposit({ division_code: "REFL", outlet_id: 1, date: depositForm.date!, shift: Number(depositForm.shift!), cash_collected: Number(depositForm.cash_collected!) || 0, cash_deposited: Number(depositForm.cash_deposited!) || 0, bank_destination: depositForm.bank_destination! });
      setDepositList(prev => [res.data, ...prev]);
      toast("Setoran harian berhasil disimpan", "success");
      setDepositForm({ date: new Date().toISOString().slice(0, 10), shift: 1, bank_destination: "BCA" });
    } catch (err: any) { toast(err.message || "Gagal menyimpan setoran", "error"); } finally { setSavingDeposit(false); }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVoucher(true);
    try {
      const res = await adminApi.createVoucher({ division_code: "REFL", type: voucherForm.type!, entity_name: voucherForm.entity_name!, amount: Number(voucherForm.amount!) || 0, description: voucherForm.description });
      setVoucherList(prev => [res.data, ...prev]);
      toast("Voucher berhasil disimpan", "success");
      setVoucherForm({ type: "PURCHASING" });
    } catch (err: any) { toast(err.message || "Gagal menyimpan voucher", "error"); } finally { setSavingVoucher(false); }
  };

  const deviation = calculateDeviation();
  const hasDeviation = deviation !== 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin Divisi</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "hrm", label: "HRM & Absensi", icon: Users },
          { id: "pos", label: "POS & Operasional", icon: CreditCard },
          { id: "finance", label: "Keuangan & Stok", icon: Package },
          { id: "payroll", label: "Payroll & Komisi", icon: ClipboardList },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        {/* ========== POS TAB ========== */}
        {activeTab === "pos" && (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> Audit Kursi Pijat & CCTV (Anti-Leak)</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${hasDeviation ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                  {hasDeviation ? `⚠ Deviasi: ${deviation > 0 ? '+' : ''}${deviation}` : "✓ Cocok"}
                </span>
              </div>
              <p className="text-sm text-gray-600">Cocokkan counter fisik kursi dengan rekaman CCTV dan transaksi POS.</p>
              <form onSubmit={handleSaveChair} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {POS_FIELDS.map((field) => (
                  <div key={field.name} className={field.name === "notes" ? "lg:col-span-4" : ""}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                    {field.type === "date" && <input type="date" value={chairForm[field.name] || ""} onChange={e => handleChairChange(field.name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />}
                    {field.type === "number" && <input type="number" value={chairForm[field.name] ?? ""} onChange={e => handleChairChange(field.name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required min="0" />}
                    {field.type === "text" && <input type="text" value={chairForm[field.name] || ""} onChange={e => handleChairChange(field.name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={hasDeviation ? "Wajib diisi karena ada deviasi" : "Opsional"} required={hasDeviation} />}
                  </div>
                ))}
                <div className="lg:col-span-4 flex items-center gap-4 pt-2">
                  <button type="submit" disabled={savingChair} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Plus className="w-4 h-4" /> Simpan Audit</button>
                  {hasDeviation && <div className="flex items-center gap-1 text-amber-600 text-sm"><AlertTriangle className="w-4 h-4" /> <span>Counter selisih {deviation > 0 ? '+' : ''}{deviation} dari POS. Wajib isi catatan.</span></div>}
                </div>
              </form>
              <div><h3 className="text-sm font-medium text-gray-700 mb-2">Riwayat Audit</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kursi</th><th className="px-4 py-3">Counter</th><th className="px-4 py-3">CCTV</th><th className="px-4 py-3">POS</th><th className="px-4 py-3">Deviasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Catatan</th></tr></thead><tbody className="divide-y divide-gray-200">
                  {chairAuditList.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Belum ada data audit</td></tr> : chairAuditList.map((row) => <tr key={row.id} className={row.deviation !== 0 ? "bg-amber-50" : ""}><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.chair_no}</td><td className="px-4 py-3">{(row.counter_end - row.counter_start)}</td><td className="px-4 py-3">{row.cctv_used}</td><td className="px-4 py-3">{row.pos_used}</td><td className="px-4 py-3 font-medium">{row.deviation > 0 ? `+${row.deviation}` : row.deviation}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${row.deviation !== 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>{row.deviation !== 0 ? "Deviasi" : "OK"}</span></td><td className="px-4 py-3 text-gray-600">{row.notes || "-"}</td></tr>)}
                </tbody></table></div></div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500" /> Pendapatan Shift Terapis</h2>
              <p className="text-sm text-gray-600">Catat produktivitas terapis per shift untuk dasar komisi.</p>
              <form onSubmit={handleSaveTherapist} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {THERAPIST_FIELDS.map((field) => (
                  <div key={field.name}><label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                    {field.options ? <select value={therapistForm[field.name] || ""} onChange={e => handleTherapistChange(field.name, Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required><option value="">-- Pilih --</option>{field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select> : <input type={field.type === "number" && field.step ? "number" : field.type} step={field.step} value={therapistForm[field.name] ?? ""} onChange={e => handleTherapistChange(field.name, field.type === "number" ? Number(e.target.value) : e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required min="0" />}
                  </div>
                ))}
                <div className="lg:col-span-4 flex items-center gap-4 pt-2"><button type="submit" disabled={savingTherapist} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Plus className="w-4 h-4" /> Simpan Pendapatan</button></div>
              </form>
              <div><h3 className="text-sm font-medium text-gray-700 mb-2">Riwayat Pendapatan</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Terapis ID</th><th className="px-4 py-3">Treatment</th><th className="px-4 py-3">Revenue Share</th><th className="px-4 py-3">Tips</th></tr></thead><tbody className="divide-y divide-gray-200">
                {therapistRevenueList.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada data pendapatan</td></tr> : therapistRevenueList.map((row) => <tr key={row.id}><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.shift}</td><td className="px-4 py-3">{row.employee_id}</td><td className="px-4 py-3">{row.treatments_count}</td><td className="px-4 py-3">Rp {row.revenue_share.toLocaleString()}</td><td className="px-4 py-3">Rp {row.tips.toLocaleString()}</td></tr>)}
              </tbody></table></div></div>
            </section>
          </div>
        )}

        {/* ========== FINANCE TAB ========== */}
        {activeTab === "finance" && (
          <div className="space-y-8">
            {/* --- Stok Opname --- */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" /> Stok Opname & HBP</h2>
              <p className="text-sm text-gray-600">Catat stok awal, masuk, keluar, opname fisik, dan hitung HBP (COGS).</p>
              <form onSubmit={handleSaveStock} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={stockForm.date || ""} onChange={e => handleStockChange("date", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Item</label><select value={stockForm.item_name || ""} onChange={e => handleStockChange("item_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required>{STOCK_ITEMS.map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Stok Awal</label><input type="number" value={stockForm.qty_initial ?? ""} onChange={e => handleStockChange("qty_initial", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Barang Datang</label><input type="number" value={stockForm.qty_in ?? ""} onChange={e => handleStockChange("qty_in", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Pemakaian (Keluar)</label><input type="number" value={stockForm.qty_out ?? ""} onChange={e => handleStockChange("qty_out", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Stok Opname Fisik</label><input type="number" value={stockForm.qty_actual ?? ""} onChange={e => handleStockChange("qty_actual", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Harga Satuan (HBP)</label><input type="number" step="0.01" value={stockForm.unit_cost ?? ""} onChange={e => handleStockChange("unit_cost", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" /></div>
                <div className="lg:col-span-4 flex items-center gap-4 pt-2"><button type="submit" disabled={savingStock} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Plus className="w-4 h-4" /> Simpan Stok</button></div>
              </form>
              <div><h3 className="text-sm font-medium text-gray-700 mb-2">Riwayat Stok Opname</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Awal</th><th className="px-4 py-3">Masuk</th><th className="px-4 py-3">Keluar</th><th className="px-4 py-3">Fisik</th><th className="px-4 py-3">Harga</th><th className="px-4 py-3">COGS</th></tr></thead><tbody className="divide-y divide-gray-200">
                {stockList.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Belum ada data stok</td></tr> : stockList.map((row) => <tr key={row.id}><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.item_name}</td><td className="px-4 py-3">{row.qty_initial}</td><td className="px-4 py-3">{row.qty_in}</td><td className="px-4 py-3">{row.qty_out}</td><td className="px-4 py-3">{row.qty_actual}</td><td className="px-4 py-3">Rp {row.unit_cost.toLocaleString()}</td><td className="px-4 py-3">Rp {row.cogs.toLocaleString()}</td></tr>)}
              </tbody></table></div></div>
            </section>

            {/* --- Setoran Harian --- */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Banknote className="w-5 h-5 text-indigo-500" /> Setoran Harian (Cash & Transfer)</h2>
              <p className="text-sm text-gray-600">Catat setoran uang tunai/transfer dari kasir ke rekening pusat.</p>
              <form onSubmit={handleSaveDeposit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label><input type="date" value={depositForm.date || ""} onChange={e => handleDepositChange("date", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Shift</label><select value={depositForm.shift || ""} onChange={e => handleDepositChange("shift", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required><option value="1">Shift 1</option><option value="2">Shift 2</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Total Tunai Terkumpul</label><input type="number" step="0.01" value={depositForm.cash_collected ?? ""} onChange={e => handleDepositChange("cash_collected", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" required /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Jumlah Disetorkan</label><input type="number" step="0.01" value={depositForm.cash_deposited ?? ""} onChange={e => handleDepositChange("cash_deposited", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" required /></div>
                <div className="lg:col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Bank Tujuan</label><select value={depositForm.bank_destination || ""} onChange={e => handleDepositChange("bank_destination", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required>{BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                <div className="lg:col-span-4 flex items-center gap-4 pt-2"><button type="submit" disabled={savingDeposit} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Plus className="w-4 h-4" /> Simpan Setoran</button></div>
              </form>
              <div><h3 className="text-sm font-medium text-gray-700 mb-2">Riwayat Setoran</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Tunai Terkumpul</th><th className="px-4 py-3">Disetorkan</th><th className="px-4 py-3">Bank</th></tr></thead><tbody className="divide-y divide-gray-200">
                {depositList.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada data setoran</td></tr> : depositList.map((row) => <tr key={row.id}><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{row.shift}</td><td className="px-4 py-3">Rp {row.cash_collected.toLocaleString()}</td><td className="px-4 py-3">Rp {row.cash_deposited.toLocaleString()}</td><td className="px-4 py-3">{row.bank_destination}</td></tr>)}
              </tbody></table></div></div>
            </section>

            {/* --- Voucher Pembelian / Tagihan --- */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Voucher Pembelian & Tagihan</h2>
              <p className="text-sm text-gray-600">Buat voucher pembelian (restock) atau tagihan ke vendor/partner.</p>
              <form onSubmit={handleSaveVoucher} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Jenis Voucher</label><select value={voucherForm.type || ""} onChange={e => handleVoucherChange("type", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required><option value="PURCHASING">Pembelian (Restock)</option><option value="BILLING">Tagihan (Billing)</option></select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Nama Entitas / Vendor</label><input type="text" value={voucherForm.entity_name || ""} onChange={e => handleVoucherChange("entity_name", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required placeholder="Contoh: Supplier Minyak Prima / EDC BCA" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Nominal</label><input type="number" step="0.01" value={voucherForm.amount ?? ""} onChange={e => handleVoucherChange("amount", Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min="0" required /></div>
                <div className="lg:col-span-3"><label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi / Keterangan</label><textarea value={voucherForm.description || ""} onChange={e => handleVoucherChange("description", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Detail item pembelian / keterangan tagihan" /></div>
                <div className="lg:col-span-4 flex items-center gap-4 pt-2"><button type="submit" disabled={savingVoucher} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Plus className="w-4 h-4" /> Simpan Voucher</button></div>
              </form>
              <div><h3 className="text-sm font-medium text-gray-700 mb-2">Riwayat Voucher</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">No. Voucher</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Entitas</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-gray-200">
                {voucherList.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada voucher</td></tr> : voucherList.map((row) => <tr key={row.id}><td className="px-4 py-3 font-mono">{row.voucher_no}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${row.type === "PURCHASING" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>{row.type}</span></td><td className="px-4 py-3">{row.entity_name}</td><td className="px-4 py-3">Rp {row.amount.toLocaleString()}</td><td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{row.status}</span></td></tr>)}
              </tbody></table></div></div>
            </section>
          </div>
        )}

        {/* ========== HRM TAB ========== */}
        {activeTab === "hrm" && <div className="space-y-6"><h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> HRM & Absensi</h2><p className="text-sm text-gray-600">Modul Rekap Cuti & Realisasi Absensi.</p><div className="text-center text-gray-400 py-10">Form input Cuti & Absensi sedang dibangun.</div></div>}

        {/* ========== PAYROLL TAB ========== */}
        {activeTab === "payroll" && <div className="space-y-6"><h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-500" /> Payroll & Komisi</h2><p className="text-sm text-gray-600">Modul Rekap Bonus Terapis & Slip Gaji.</p><div className="text-center text-gray-400 py-10">Form input Bonus sedang dibangun.</div></div>}
      </div>
    </div>
  );
}