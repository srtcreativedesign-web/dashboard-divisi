import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  CreditCard,
  ClipboardList,
  Package,
  ShieldAlert,
  Calendar,
  TrendingUp,
  Plus,
  AlertTriangle,
  Banknote,
  FileText,
  Shirt,
  Receipt,
  PieChart,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../session/AuthContext";
import {
  adminApi,
  type ChairUsageAudit,
  type TherapistRevenue,
  type StockCard,
  type Deposit,
  type Voucher,
  type CashlessRecord,
  type LaundryRecord,
  type PnlSupportData,
  type LeaveRecord,
  type AttendanceRealization,
  type BonusRecord,
} from "../../api/admin";

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
  const { user } = useAuth();
  const divCode = user?.divisionCode ?? 'REFL';
  const [activeTab, setActiveTab] = useState<"hrm" | "pos" | "finance" | "payroll">("finance");

  // ==========================================
  // POS TAB STATE
  // ==========================================
  const [chairAuditList, setChairAuditList] = useState<ChairUsageAudit[]>([]);
  const [therapistRevenueList, setTherapistRevenueList] = useState<TherapistRevenue[]>([]);
  const [chairForm, setChairForm] = useState<Partial<ChairUsageAudit>>({ date: new Date().toISOString().slice(0, 10) });
  const [therapistForm, setTherapistForm] = useState<Partial<TherapistRevenue>>({ date: new Date().toISOString().slice(0, 10), shift: 1 });
  const [savingChair, setSavingChair] = useState(false);
  const [savingTherapist, setSavingTherapist] = useState(false);

  // ==========================================
  // FINANCE TAB STATE
  // ==========================================
  const [stockList, setStockList] = useState<StockCard[]>([]);
  const [depositList, setDepositList] = useState<Deposit[]>([]);
  const [cashlessList, setCashlessList] = useState<CashlessRecord[]>([]);
  const [laundryList, setLaundryList] = useState<LaundryRecord[]>([]);
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);
  const [pnlSupport, setPnlSupport] = useState<PnlSupportData | null>(null);

  const [stockForm, setStockForm] = useState<Partial<StockCard>>({ date: new Date().toISOString().slice(0, 10), item_name: "Oil" });
  const [depositForm, setDepositForm] = useState<Partial<Deposit>>({ date: new Date().toISOString().slice(0, 10), shift: 1, bank_destination: "BCA" });
  const [cashlessForm, setCashlessForm] = useState<Partial<CashlessRecord>>({ date: new Date().toISOString().slice(0, 10), shift: 1, nominal_qris: 0, nominal_edc: 0 });
  const [laundryForm, setLaundryForm] = useState<Partial<LaundryRecord>>({ date: new Date().toISOString().slice(0, 10), weight_kg: 0, cost_per_kg: 8000, vendor_name: "Laundry Berkah" });
  const [voucherForm, setVoucherForm] = useState<Partial<Voucher>>({ type: "PURCHASING", status: "DRAFT" });

  const [savingStock, setSavingStock] = useState(false);
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [savingCashless, setSavingCashless] = useState(false);
  const [savingLaundry, setSavingLaundry] = useState(false);
  const [savingVoucher, setSavingVoucher] = useState(false);

  // ==========================================
  // HRM TAB STATE
  // ==========================================
  const [leaveList, setLeaveList] = useState<LeaveRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRealization[]>([]);
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRecord>>({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    leave_type: "TAHUNAN",
    days_taken: 1,
  });
  const [attendanceForm, setAttendanceForm] = useState<Partial<AttendanceRealization>>({
    period_start: new Date().toISOString().slice(0, 8) + "01",
    period_end: new Date().toISOString().slice(0, 10),
    days_scheduled: 26,
    days_present: 24,
    days_absent: 0,
    days_leave: 1,
    days_sick: 1,
    minutes_late: 0,
  });
  const [savingLeave, setSavingLeave] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // ==========================================
  // PAYROLL TAB STATE
  // ==========================================
  const [bonusList, setBonusList] = useState<BonusRecord[]>([]);
  const [bonusForm, setBonusForm] = useState<Partial<BonusRecord>>({
    period_start: new Date().toISOString().slice(0, 8) + "01",
    period_end: new Date().toISOString().slice(0, 10),
    sesi_30m: 0,
    sesi_60m: 0,
    sesi_90m: 0,
    rate_30m: 10000,
    rate_60m: 20000,
    rate_90m: 30000,
    extra_bonus: 0,
  });
  const [savingBonus, setSavingBonus] = useState(false);

  // Live PnL Support Data
  const refreshPnl = async () => {
    try {
      const res = await adminApi.getPnlSupport({ division_code: divCode });
      setPnlSupport(res.data);
    } catch {
      // ignore — non-critical
    }
  };

  // Load Finance tab data
  const loadFinanceData = useCallback(async () => {
    try {
      const [stockRes, depositRes, cashlessRes, laundryRes] = await Promise.all([
        adminApi.getStockCards({ division_code: divCode }),
        adminApi.getDeposits({ division_code: divCode }),
        adminApi.getCashless({ division_code: divCode }),
        adminApi.getLaundry({ division_code: divCode }),
      ]);
      setStockList(stockRes.data || []);
      setDepositList(depositRes.data || []);
      setCashlessList(cashlessRes.data || []);
      setLaundryList(laundryRes.data || []);
    } catch {
      // ignore — lists stay empty
    }
  }, [divCode]);

  useEffect(() => {
    refreshPnl();
    if (activeTab === "finance") loadFinanceData();
  }, [activeTab, loadFinanceData]);

  const loadHrmData = async () => {
    try {
      const [leavesRes, attendanceRes] = await Promise.all([
        adminApi.getLeaves({ division_code: divCode }),
        adminApi.getAttendanceRealizations({ division_code: divCode }),
      ]);
      setLeaveList(leavesRes.data || []);
      setAttendanceList(attendanceRes.data || []);
    } catch {
      // ignore
    }
  };

  // Load Payroll tab data
  const loadPayrollData = useCallback(async () => {
    try {
      const res = await adminApi.getBonusRecords({ division_code: divCode });
      setBonusList(res.data || []);
    } catch {
      // ignore
    }
  }, [divCode]);

  useEffect(() => {
    if (activeTab === "hrm") {
      loadHrmData();
    } else if (activeTab === "payroll") {
      loadPayrollData();
    }
  }, [activeTab, loadPayrollData]);

  const handleUpdateLeaveStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await adminApi.updateLeaveStatus(id, status);
      setLeaveList((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      toast(`Status cuti berhasil diubah ke ${status}`, "success");
    } catch (err: any) {
      toast(err.message || "Gagal mengupdate status cuti", "error");
    }
  };

  const handleUpdateAttendanceStatus = async (id: number, status: 'SUBMITTED' | 'LOCKED') => {
    try {
      const res = await adminApi.updateAttendanceStatus(id, status);
      setAttendanceList((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      toast(`Status absensi berhasil diubah ke ${status}`, "success");
    } catch (err: any) {
      toast(err.message || "Gagal mengupdate status absensi", "error");
    }
  };

  const calculateDeviation = (): number => (chairForm.counter_end ?? 0) - (chairForm.counter_start ?? 0) - (chairForm.pos_used ?? 0);

  // ==========================================
  // POS HANDLERS
  // ==========================================
  const handleSaveChair = async (e: React.FormEvent) => {
    e.preventDefault();
    const deviation = calculateDeviation();
    if (deviation !== 0 && !chairForm.notes?.trim()) {
      toast("Catatan wajib diisi jika ada deviasi", "error");
      return;
    }
    setSavingChair(true);
    try {
      const res = await adminApi.createChairAudit({
        division_code: divCode,
        outlet_id: 1,
        date: chairForm.date!,
        chair_no: Number(chairForm.chair_no!),
        counter_start: Number(chairForm.counter_start!),
        counter_end: Number(chairForm.counter_end!),
        cctv_used: Number(chairForm.cctv_used!),
        pos_used: Number(chairForm.pos_used!),
        notes: chairForm.notes,
      });
      setChairAuditList((prev) => [res.data, ...prev]);
      toast("Audit kursi berhasil disimpan", "success");
      setChairForm({ date: new Date().toISOString().slice(0, 10) });
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan audit", "error");
    } finally {
      setSavingChair(false);
    }
  };

  const handleSaveTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTherapist(true);
    try {
      const res = await adminApi.createTherapistRevenue({
        division_code: divCode,
        outlet_id: Number(therapistForm.outlet_id!) || 1,
        employee_id: Number(therapistForm.employee_id!),
        date: therapistForm.date!,
        shift: Number(therapistForm.shift!) || 1,
        treatments_count: Number(therapistForm.treatments_count!) || 0,
        revenue_share: Number(therapistForm.revenue_share!) || 0,
        tips: Number(therapistForm.tips!) || 0,
      });
      setTherapistRevenueList((prev) => [res.data, ...prev]);
      toast("Pendapatan shift terapis berhasil disimpan", "success");
      setTherapistForm({ date: new Date().toISOString().slice(0, 10), shift: 1 });
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan pendapatan", "error");
    } finally {
      setSavingTherapist(false);
    }
  };

  // ==========================================
  // FINANCE HANDLERS
  // ==========================================
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStock(true);
    try {
      const cogs = (Number(stockForm.qty_out) || 0) * (Number(stockForm.unit_cost) || 0);
      const res = await adminApi.createStockCard({
        division_code: divCode,
        outlet_id: 1,
        item_name: stockForm.item_name!,
        date: stockForm.date!,
        qty_initial: Number(stockForm.qty_initial!) || 0,
        qty_in: Number(stockForm.qty_in!) || 0,
        qty_out: Number(stockForm.qty_out!) || 0,
        qty_actual: Number(stockForm.qty_actual!) || 0,
        unit_cost: Number(stockForm.unit_cost!) || 0,
      });
      setStockList((prev) => [{ ...res.data, cogs }, ...prev]);
      toast("Stok opname & HBP berhasil disimpan", "success");
      setStockForm({ date: new Date().toISOString().slice(0, 10), item_name: "Oil" });
      refreshPnl();
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan stok", "error");
    } finally {
      setSavingStock(false);
    }
  };

  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDeposit(true);
    try {
      const res = await adminApi.createDeposit({
        division_code: divCode,
        outlet_id: 1,
        date: depositForm.date!,
        shift: Number(depositForm.shift!) || 1,
        cash_collected: Number(depositForm.cash_collected!) || 0,
        cash_deposited: Number(depositForm.cash_deposited!) || 0,
        bank_destination: depositForm.bank_destination || "BCA",
      });
      setDepositList((prev) => [res.data, ...prev]);
      toast("Setoran harian berhasil disimpan", "success");
      setDepositForm({ date: new Date().toISOString().slice(0, 10), shift: 1, bank_destination: "BCA" });
      refreshPnl();
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan setoran", "error");
    } finally {
      setSavingDeposit(false);
    }
  };

  const handleSaveCashless = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCashless(true);
    try {
      const res = await adminApi.createCashless({
        division_code: divCode,
        outlet_id: 1,
        date: cashlessForm.date!,
        shift: Number(cashlessForm.shift!) || 1,
        nominal_qris: Number(cashlessForm.nominal_qris!) || 0,
        nominal_edc: Number(cashlessForm.nominal_edc!) || 0,
        no_storan_finance: cashlessForm.no_storan_finance,
      });
      setCashlessList((prev) => [res.data, ...prev]);
      toast("Laporan cashless berhasil disimpan", "success");
      setCashlessForm({ date: new Date().toISOString().slice(0, 10), shift: 1, nominal_qris: 0, nominal_edc: 0 });
      refreshPnl();
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan data cashless", "error");
    } finally {
      setSavingCashless(false);
    }
  };

  const handleSaveLaundry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLaundry(true);
    try {
      const res = await adminApi.createLaundry({
        division_code: divCode,
        outlet_id: 1,
        date: laundryForm.date!,
        weight_kg: Number(laundryForm.weight_kg!) || 0,
        cost_per_kg: Number(laundryForm.cost_per_kg!) || 0,
        vendor_name: laundryForm.vendor_name,
      });
      setLaundryList((prev) => [res.data, ...prev]);
      toast("Catatan biaya laundry berhasil disimpan", "success");
      setLaundryForm({ date: new Date().toISOString().slice(0, 10), weight_kg: 0, cost_per_kg: 8000 });
      refreshPnl();
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan laundry", "error");
    } finally {
      setSavingLaundry(false);
    }
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingVoucher(true);
    try {
      const res = await adminApi.createVoucher({
        division_code: divCode,
        type: voucherForm.type!,
        entity_name: voucherForm.entity_name!,
        amount: Number(voucherForm.amount!) || 0,
        description: voucherForm.description,
      });
      setVoucherList((prev) => [res.data, ...prev]);
      toast("Voucher berhasil disimpan", "success");
      setVoucherForm({ type: "PURCHASING" });
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan voucher", "error");
    } finally {
      setSavingVoucher(false);
    }
  };

  // ==========================================
  // HRM HANDLERS
  // ==========================================
  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLeave(true);
    try {
      const res = await adminApi.createLeave({
        division_code: divCode,
        employee_id: Number(leaveForm.employee_id!) || 1,
        leave_type: leaveForm.leave_type || "TAHUNAN",
        start_date: leaveForm.start_date!,
        end_date: leaveForm.end_date!,
        days_taken: Number(leaveForm.days_taken!) || 1,
        notes: leaveForm.notes,
      });
      setLeaveList((prev) => [res.data, ...prev]);
      toast("Rekap cuti berhasil dicatat", "success");
      setLeaveForm({ start_date: new Date().toISOString().slice(0, 10), end_date: new Date().toISOString().slice(0, 10), leave_type: "TAHUNAN", days_taken: 1 });
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan cuti", "error");
    } finally {
      setSavingLeave(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAttendance(true);
    try {
      const res = await adminApi.createAttendanceRealization({
        division_code: divCode,
        employee_id: Number(attendanceForm.employee_id!) || 1,
        period_start: attendanceForm.period_start!,
        period_end: attendanceForm.period_end!,
        days_scheduled: Number(attendanceForm.days_scheduled!) || 0,
        days_present: Number(attendanceForm.days_present!) || 0,
        days_absent: Number(attendanceForm.days_absent!) || 0,
        days_leave: Number(attendanceForm.days_leave!) || 0,
        days_sick: Number(attendanceForm.days_sick!) || 0,
        minutes_late: Number(attendanceForm.minutes_late!) || 0,
      });
      setAttendanceList((prev) => [res.data, ...prev]);
      toast("Realisasi absensi berhasil disimpan", "success");
    } catch (err: any) {
      toast(err.message || "Gagal menyimpan absensi", "error");
    } finally {
      setSavingAttendance(false);
    }
  };

  // ==========================================
  // PAYROLL HANDLERS
  // ==========================================
  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBonus(true);
    try {
      const res = await adminApi.createBonusRecord({
        division_code: divCode,
        employee_name: bonusForm.employee_name || "Terapis Refleksi",
        period_start: bonusForm.period_start!,
        period_end: bonusForm.period_end!,
        sesi_30m: Number(bonusForm.sesi_30m!) || 0,
        sesi_60m: Number(bonusForm.sesi_60m!) || 0,
        sesi_90m: Number(bonusForm.sesi_90m!) || 0,
        rate_30m: Number(bonusForm.rate_30m!) || 10000,
        rate_60m: Number(bonusForm.rate_60m!) || 20000,
        rate_90m: Number(bonusForm.rate_90m!) || 30000,
        extra_bonus: Number(bonusForm.extra_bonus!) || 0,
      });
      setBonusList((prev) => [res.data, ...prev]);
      toast("Rekap bonus terapis berhasil disimpan", "success");
    } catch (err: any) {
      toast(err.message || "Gagal menghitung bonus", "error");
    } finally {
      setSavingBonus(false);
    }
  };

  const calculatedBasicBonus =
    (Number(bonusForm.sesi_30m) || 0) * (Number(bonusForm.rate_30m) || 10000) +
    (Number(bonusForm.sesi_60m) || 0) * (Number(bonusForm.rate_60m) || 20000) +
    (Number(bonusForm.sesi_90m) || 0) * (Number(bonusForm.rate_90m) || 30000);
  const calculatedGrandBonus = calculatedBasicBonus + (Number(bonusForm.extra_bonus) || 0);

  const deviation = calculateDeviation();
  const hasDeviation = deviation !== 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin Divisi</h1>
          <p className="text-sm text-gray-500">Pusat pencatatan & rekonsiliasi 14 tugas admin operasional outlet.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPnl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "finance", label: "Keuangan & Stok (Finance)", icon: Package },
          { id: "pos", label: "POS & Operasional", icon: CreditCard },
          { id: "hrm", label: "HRM & Absensi", icon: Users },
          { id: "payroll", label: "Payroll & Komisi", icon: ClipboardList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* ========================================== */}
        {/* ========== FINANCE TAB ========== */}
        {/* ========================================== */}
        {activeTab === "finance" && (
          <div className="space-y-10">
            {/* 1. Ringkasan Data Pendukung PnL */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-indigo-600" /> Data Pendukung PnL & Laba Kotor Harian
                </h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-mono">
                  {pnlSupport?.date || new Date().toISOString().slice(0, 10)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Total Pendapatan (Omzet)</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    Rp {(pnlSupport?.total_revenue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Tunai: Rp {(pnlSupport?.revenue_cash ?? 0).toLocaleString()} | QRIS/EDC: Rp {((pnlSupport?.revenue_qris ?? 0) + (pnlSupport?.revenue_edc ?? 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 uppercase tracking-wider">Total HBP (Bahan Terpakai)</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">
                    Rp {(pnlSupport?.total_hbp ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">Akumulasi COGS Oil, Cream, Linens</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
                  <p className="text-xs font-medium text-rose-800 uppercase tracking-wider">Biaya Operasional (Laundry)</p>
                  <p className="text-2xl font-bold text-rose-900 mt-1">
                    Rp {(pnlSupport?.laundry_cost ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-rose-700 mt-1">Tagihan cuci handuk/seragam</p>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-xs font-medium text-indigo-800 uppercase tracking-wider">Estimasi Margin Kotor</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">
                    Rp {(pnlSupport?.gross_margin ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">Omzet dikurangi HBP & Laundry</p>
                </div>
              </div>
            </section>

            {/* 2. Rincian Penerimaan Cashless (QRIS & EDC) */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" /> Rincian Cashless (QRIS & EDC)
              </h2>
              <p className="text-sm text-gray-600">Catat transaksi pembayaran non-tunai (EDC BCA, Mandiri, QRIS) per shift.</p>
              <form onSubmit={handleSaveCashless} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={cashlessForm.date || ""}
                    onChange={(e) => setCashlessForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
                  <select
                    value={cashlessForm.shift || 1}
                    onChange={(e) => setCashlessForm((prev) => ({ ...prev, shift: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="1">Shift 1</option>
                    <option value="2">Shift 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nominal QRIS (Rp)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashlessForm.nominal_qris ?? ""}
                    onChange={(e) => setCashlessForm((prev) => ({ ...prev, nominal_qris: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nominal EDC (Rp)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashlessForm.nominal_edc ?? ""}
                    onChange={(e) => setCashlessForm((prev) => ({ ...prev, nominal_edc: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. Settlement / Storan Finance (Opsional)</label>
                  <input
                    type="text"
                    value={cashlessForm.no_storan_finance || ""}
                    onChange={(e) => setCashlessForm((prev) => ({ ...prev, no_storan_finance: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: SETTLE-BCA-20260928"
                  />
                </div>
                <div className="lg:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={savingCashless}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Cashless
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">QRIS</th>
                      <th className="px-4 py-3">EDC</th>
                      <th className="px-4 py-3">Total Cashless</th>
                      <th className="px-4 py-3">No. Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cashlessList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                          Belum ada data penerimaan cashless
                        </td>
                      </tr>
                    ) : (
                      cashlessList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3">Shift {row.shift}</td>
                          <td className="px-4 py-3">Rp {row.nominal_qris.toLocaleString()}</td>
                          <td className="px-4 py-3">Rp {row.nominal_edc.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-indigo-600">
                            Rp {((row.nominal_qris || 0) + (row.nominal_edc || 0)).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.no_storan_finance || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Stok Opname & HBP */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" /> Stok Opname & HBP (Bahan Habis Pakai)
              </h2>
              <p className="text-sm text-gray-600">Catat mutasi barang outlet (awal, masuk, keluar, fisik) dan hitung otomatis COGS (HBP).</p>
              <form onSubmit={handleSaveStock} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={stockForm.date || ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Barang</label>
                  <select
                    value={stockForm.item_name || ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, item_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {STOCK_ITEMS.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={stockForm.qty_initial ?? ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, qty_initial: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Barang Datang</label>
                  <input
                    type="number"
                    value={stockForm.qty_in ?? ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, qty_in: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pemakaian (Keluar)</label>
                  <input
                    type="number"
                    value={stockForm.qty_out ?? ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, qty_out: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stok Fisik (Opname)</label>
                  <input
                    type="number"
                    value={stockForm.qty_actual ?? ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, qty_actual: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Harga Satuan HBP (Rp)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stockForm.unit_cost ?? ""}
                    onChange={(e) => setStockForm((prev) => ({ ...prev, unit_cost: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={savingStock}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Stok & HBP
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Awal</th>
                      <th className="px-4 py-3">Masuk</th>
                      <th className="px-4 py-3">Keluar</th>
                      <th className="px-4 py-3">Fisik</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Total HBP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                          Belum ada data stok opname
                        </td>
                      </tr>
                    ) : (
                      stockList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3 font-medium">{row.item_name}</td>
                          <td className="px-4 py-3">{row.qty_initial}</td>
                          <td className="px-4 py-3 text-emerald-600">+{row.qty_in}</td>
                          <td className="px-4 py-3 text-rose-600">-{row.qty_out}</td>
                          <td className="px-4 py-3 font-semibold">{row.qty_actual}</td>
                          <td className="px-4 py-3">Rp {row.unit_cost.toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-amber-700">Rp {row.cogs.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Biaya Laundry & Operasional Outlet */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shirt className="w-5 h-5 text-indigo-600" /> Biaya Laundry & Kebersihan Outlet
              </h2>
              <p className="text-sm text-gray-600">Pencatatan kiloan laundry handuk dan kain pelengkap treatment.</p>
              <form onSubmit={handleSaveLaundry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={laundryForm.date || ""}
                    onChange={(e) => setLaundryForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Vendor Laundry</label>
                  <input
                    type="text"
                    value={laundryForm.vendor_name || ""}
                    onChange={(e) => setLaundryForm((prev) => ({ ...prev, vendor_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Berat (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={laundryForm.weight_kg ?? ""}
                    onChange={(e) => setLaundryForm((prev) => ({ ...prev, weight_kg: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Biaya per Kg (Rp)</label>
                  <input
                    type="number"
                    value={laundryForm.cost_per_kg ?? ""}
                    onChange={(e) => setLaundryForm((prev) => ({ ...prev, cost_per_kg: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div className="lg:col-span-4 flex items-center justify-between pt-2">
                  <div className="text-sm font-medium text-gray-700">
                    Estimasi Tagihan:{" "}
                    <span className="text-indigo-600 font-bold">
                      Rp {((Number(laundryForm.weight_kg) || 0) * (Number(laundryForm.cost_per_kg) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={savingLaundry}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Biaya Laundry
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Berat</th>
                      <th className="px-4 py-3">Tarif / Kg</th>
                      <th className="px-4 py-3">Total Biaya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {laundryList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                          Belum ada catatan laundry
                        </td>
                      </tr>
                    ) : (
                      laundryList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3">{row.vendor_name || "-"}</td>
                          <td className="px-4 py-3">{row.weight_kg} kg</td>
                          <td className="px-4 py-3">Rp {row.cost_per_kg.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-rose-600">Rp {row.total_bill.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Setoran Harian (Cash) */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-indigo-600" /> Setoran Harian Kasir
              </h2>
              <p className="text-sm text-gray-600">Rekap uang tunai dari kasir outlet dan bukti transfer ke rekening bank pusat.</p>
              <form onSubmit={handleSaveDeposit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={depositForm.date || ""}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Shift</label>
                  <select
                    value={depositForm.shift || 1}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, shift: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="1">Shift 1</option>
                    <option value="2">Shift 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Tunai Terkumpul</label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositForm.cash_collected ?? ""}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, cash_collected: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah Disetorkan</label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositForm.cash_deposited ?? ""}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, cash_deposited: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bank Tujuan</label>
                  <select
                    value={depositForm.bank_destination || "BCA"}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, bank_destination: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={savingDeposit}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Setoran Kasir
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Tunai Kasir</th>
                      <th className="px-4 py-3">Disetorkan</th>
                      <th className="px-4 py-3">Bank</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {depositList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                          Belum ada data setoran tunai
                        </td>
                      </tr>
                    ) : (
                      depositList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3">Shift {row.shift}</td>
                          <td className="px-4 py-3">Rp {row.cash_collected.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">Rp {row.cash_deposited.toLocaleString()}</td>
                          <td className="px-4 py-3">{row.bank_destination}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {row.status || "VERIFIED"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Voucher Pembelian & Tagihan */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Voucher Pembelian (Restock) & Tagihan
              </h2>
              <p className="text-sm text-gray-600">Buat voucher pengajuan pembelian barang habis pakai atau tagihan vendor luar.</p>
              <form onSubmit={handleSaveVoucher} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Voucher</label>
                  <select
                    value={voucherForm.type || "PURCHASING"}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="PURCHASING">Pembelian / Restock</option>
                    <option value="BILLING">Tagihan (Billing)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Vendor / Penerima</label>
                  <input
                    type="text"
                    value={voucherForm.entity_name || ""}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, entity_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    placeholder="Contoh: Supplier Minyak Prima / CV Laundry"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={voucherForm.amount ?? ""}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi / Detail Barang</label>
                  <input
                    type="text"
                    value={voucherForm.description || ""}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Restock 20 btl minyak lavender & 10 dus aqua"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={savingVoucher}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Voucher
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">No. Voucher</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Entitas</th>
                      <th className="px-4 py-3">Nominal</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {voucherList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                          Belum ada voucher
                        </td>
                      </tr>
                    ) : (
                      voucherList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600">{row.voucher_no}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.type === "PURCHASING" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">{row.entity_name}</td>
                          <td className="px-4 py-3 font-semibold">Rp {row.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{row.description || "-"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-medium">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ========================================== */}
        {/* ========== POS TAB ========== */}
        {/* ========================================== */}
        {activeTab === "pos" && (
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> Audit Kursi Pijat & CCTV (Anti-Leak)
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    hasDeviation ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                  }`}
                >
                  {hasDeviation ? `⚠ Deviasi: ${deviation > 0 ? "+" : ""}${deviation}` : "✓ Cocok"}
                </span>
              </div>
              <p className="text-sm text-gray-600">Cocokkan counter fisik kursi dengan rekaman CCTV dan transaksi POS.</p>
              <form onSubmit={handleSaveChair} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {POS_FIELDS.map((field) => (
                  <div key={field.name} className={field.name === "notes" ? "lg:col-span-4" : ""}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                    {field.type === "date" && (
                      <input
                        type="date"
                        value={chairForm[field.name as keyof ChairUsageAudit] || ""}
                        onChange={(e) => setChairForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    )}
                    {field.type === "number" && (
                      <input
                        type="number"
                        value={chairForm[field.name as keyof ChairUsageAudit] ?? ""}
                        onChange={(e) => setChairForm((prev) => ({ ...prev, [field.name]: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        min="0"
                      />
                    )}
                    {field.type === "text" && (
                      <input
                        type="text"
                        value={chairForm[field.name as keyof ChairUsageAudit] || ""}
                        onChange={(e) => setChairForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={hasDeviation ? "Wajib diisi karena ada deviasi" : "Opsional"}
                        required={hasDeviation}
                      />
                    )}
                  </div>
                ))}
                <div className="lg:col-span-4 flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={savingChair}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Audit Kursi
                  </button>
                  {hasDeviation && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />{" "}
                      <span>Counter selisih {deviation > 0 ? "+" : ""}{deviation} dari POS. Wajib isi catatan.</span>
                    </div>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Kursi</th>
                      <th className="px-4 py-3">Counter</th>
                      <th className="px-4 py-3">CCTV</th>
                      <th className="px-4 py-3">POS</th>
                      <th className="px-4 py-3">Deviasi</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {chairAuditList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                          Belum ada data audit kursi
                        </td>
                      </tr>
                    ) : (
                      chairAuditList.map((row) => (
                        <tr key={row.id} className={row.deviation !== 0 ? "bg-amber-50" : ""}>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3 font-semibold">Kursi #{row.chair_no}</td>
                          <td className="px-4 py-3">{row.counter_end - row.counter_start}</td>
                          <td className="px-4 py-3">{row.cctv_used}</td>
                          <td className="px-4 py-3">{row.pos_used}</td>
                          <td className="px-4 py-3 font-medium text-amber-700">
                            {row.deviation > 0 ? `+${row.deviation}` : row.deviation}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.deviation !== 0 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {row.deviation !== 0 ? "Deviasi" : "OK"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{row.notes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" /> Pendapatan Shift Terapis
              </h2>
              <p className="text-sm text-gray-600">Catat produktivitas terapis per shift untuk dasar perhitungan komisi & bonus.</p>
              <form onSubmit={handleSaveTherapist} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {THERAPIST_FIELDS.map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                    {field.options ? (
                      <select
                        value={therapistForm[field.name as keyof TherapistRevenue] || 1}
                        onChange={(e) => setTherapistForm((prev) => ({ ...prev, [field.name]: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            Shift {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "number" && field.step ? "number" : field.type}
                        step={field.step}
                        value={therapistForm[field.name as keyof TherapistRevenue] ?? ""}
                        onChange={(e) =>
                          setTherapistForm((prev) => ({
                            ...prev,
                            [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        min="0"
                      />
                    )}
                  </div>
                ))}
                <div className="lg:col-span-4 flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={savingTherapist}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Pendapatan Terapis
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Shift</th>
                      <th className="px-4 py-3">Terapis ID</th>
                      <th className="px-4 py-3">Jumlah Treatment</th>
                      <th className="px-4 py-3">Revenue Share</th>
                      <th className="px-4 py-3">Tips</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {therapistRevenueList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                          Belum ada data pendapatan terapis
                        </td>
                      </tr>
                    ) : (
                      therapistRevenueList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3">Shift {row.shift}</td>
                          <td className="px-4 py-3 font-medium">Emp #{row.employee_id}</td>
                          <td className="px-4 py-3">{row.treatments_count} sesi</td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">Rp {row.revenue_share.toLocaleString()}</td>
                          <td className="px-4 py-3">Rp {row.tips.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ========================================== */}
        {/* ========== HRM TAB ========== */}
        {/* ========================================== */}
        {activeTab === "hrm" && (
          <div className="space-y-10">
            {/* 1. Rekap Cuti Karyawan */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Rekap Cuti Karyawan & Terapis
              </h2>
              <p className="text-sm text-gray-600">Catat permohonan cuti tahunan, sakit, dan izin staf outlet.</p>
              <form onSubmit={handleSaveLeave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID Karyawan (Employee ID)</label>
                  <input
                    type="number"
                    value={leaveForm.employee_id ?? ""}
                    onChange={(e) => setLeaveForm((prev) => ({ ...prev, employee_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Cuti</label>
                  <select
                    value={leaveForm.leave_type || "TAHUNAN"}
                    onChange={(e) => setLeaveForm((prev) => ({ ...prev, leave_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="TAHUNAN">Cuti Tahunan</option>
                    <option value="SAKIT">Sakit (Surat Dokter)</option>
                    <option value="IZIN">Izin Tertulis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mulai Cuti</label>
                  <input
                    type="date"
                    value={leaveForm.start_date || ""}
                    onChange={(e) => setLeaveForm((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Selesai Cuti</label>
                  <input
                    type="date"
                    value={leaveForm.end_date || ""}
                    onChange={(e) => setLeaveForm((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah Hari Diambil</label>
                  <input
                    type="number"
                    value={leaveForm.days_taken ?? 1}
                    onChange={(e) => setLeaveForm((prev) => ({ ...prev, days_taken: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Alasan / Catatan</label>
                  <input
                    type="text"
                    value={leaveForm.notes || ""}
                    onChange={(e) => setLeaveForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Keperluan keluarga"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={savingLeave}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Rekap Cuti
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">ID Karyawan</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Periode Cuti</th>
                      <th className="px-4 py-3">Hari</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Catatan</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaveList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                          Belum ada data cuti
                        </td>
                      </tr>
                    ) : (
                      leaveList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-semibold">Emp #{row.employee_id}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {row.leave_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {row.start_date} s/d {row.end_date}
                          </td>
                          <td className="px-4 py-3">{row.days_taken} hari</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : row.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {row.status || "PENDING"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{row.notes || "-"}</td>
                          <td className="px-4 py-3 text-right space-x-1">
                            {row.status !== "APPROVED" && (
                              <button
                                onClick={() => handleUpdateLeaveStatus(row.id, "APPROVED")}
                                className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200"
                              >
                                Setujui
                              </button>
                            )}
                            {row.status !== "REJECTED" && (
                              <button
                                onClick={() => handleUpdateLeaveStatus(row.id, "REJECTED")}
                                className="px-2 py-1 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                              >
                                Tolak
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2. Realisasi Absensi */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" /> Laporan Realisasi Absensi
              </h2>
              <p className="text-sm text-gray-600">Verifikasi kehadiran bulanan sebagai dasar data pendukung perhitungan gaji.</p>
              <form onSubmit={handleSaveAttendance} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID Karyawan</label>
                  <input
                    type="number"
                    value={attendanceForm.employee_id ?? ""}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, employee_id: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Awal Cut-Off</label>
                  <input
                    type="date"
                    value={attendanceForm.period_start || ""}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, period_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Akhir Cut-Off</label>
                  <input
                    type="date"
                    value={attendanceForm.period_end || ""}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, period_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jadwal Kerja (Hari)</label>
                  <input
                    type="number"
                    value={attendanceForm.days_scheduled ?? 26}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, days_scheduled: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hadir (Hari)</label>
                  <input
                    type="number"
                    value={attendanceForm.days_present ?? 24}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, days_present: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mangkir (Hari)</label>
                  <input
                    type="number"
                    value={attendanceForm.days_absent ?? 0}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, days_absent: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cuti (Hari)</label>
                  <input
                    type="number"
                    value={attendanceForm.days_leave ?? 0}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, days_leave: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sakit (Hari)</label>
                  <input
                    type="number"
                    value={attendanceForm.days_sick ?? 0}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, days_sick: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Terlambat (Menit)</label>
                  <input
                    type="number"
                    value={attendanceForm.minutes_late ?? 0}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, minutes_late: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="lg:col-span-4 flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingAttendance}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan Realisasi Absensi
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">ID Karyawan</th>
                      <th className="px-4 py-3">Periode</th>
                      <th className="px-4 py-3">Jadwal</th>
                      <th className="px-4 py-3">Hadir</th>
                      <th className="px-4 py-3">Mangkir</th>
                      <th className="px-4 py-3">Terlambat</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                          Belum ada laporan realisasi absensi
                        </td>
                      </tr>
                    ) : (
                      attendanceList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-semibold">Emp #{row.employee_id}</td>
                          <td className="px-4 py-3 text-xs">
                            {row.period_start} ~ {row.period_end}
                          </td>
                          <td className="px-4 py-3">{row.days_scheduled} hari</td>
                          <td className="px-4 py-3 text-emerald-600 font-medium">{row.days_present} hari</td>
                          <td className="px-4 py-3 text-rose-600">{row.days_absent} hari</td>
                          <td className="px-4 py-3">{row.minutes_late} mnt</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.status === "LOCKED"
                                  ? "bg-slate-200 text-slate-800"
                                  : row.status === "SUBMITTED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {row.status || "DRAFT"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            {row.status !== "SUBMITTED" && row.status !== "LOCKED" && (
                              <button
                                onClick={() => handleUpdateAttendanceStatus(row.id, "SUBMITTED")}
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200"
                              >
                                Submit
                              </button>
                            )}
                            {row.status !== "LOCKED" && (
                              <button
                                onClick={() => handleUpdateAttendanceStatus(row.id, "LOCKED")}
                                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-300"
                              >
                                Kunci
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ========================================== */}
        {/* ========== PAYROLL TAB ========== */}
        {/* ========================================== */}
        {activeTab === "payroll" && (
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" /> Rekap Bonus Terapis & Pendukung Gaji
              </h2>
              <p className="text-sm text-gray-600">Kalkulasi bonus terapis berdasarkan durasi treatment (30m, 60m, 90m) dan pencapaian target.</p>
              <form onSubmit={handleSaveBonus} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nama Terapis / Karyawan</label>
                  <input
                    type="text"
                    value={bonusForm.employee_name || ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, employee_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contoh: Siti Rahmawati"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Awal Periode</label>
                  <input
                    type="date"
                    value={bonusForm.period_start || ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, period_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Akhir Periode</label>
                  <input
                    type="date"
                    value={bonusForm.period_end || ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, period_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sesi 30 Menit (x Rp 10.000)</label>
                  <input
                    type="number"
                    value={bonusForm.sesi_30m ?? ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, sesi_30m: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sesi 60 Menit (x Rp 20.000)</label>
                  <input
                    type="number"
                    value={bonusForm.sesi_60m ?? ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, sesi_60m: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sesi 90 Menit (x Rp 30.000)</label>
                  <input
                    type="number"
                    value={bonusForm.sesi_90m ?? ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, sesi_90m: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bonus Ekstra / Reward (Rp)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bonusForm.extra_bonus ?? ""}
                    onChange={(e) => setBonusForm((prev) => ({ ...prev, extra_bonus: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                </div>

                <div className="lg:col-span-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-indigo-700 font-medium">Ringkasan Total Bonus Terapis:</p>
                    <p className="text-xl font-bold text-indigo-900">
                      Rp {calculatedGrandBonus.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-indigo-600">
                        (Dasar: Rp {calculatedBasicBonus.toLocaleString()} + Ekstra: Rp {(Number(bonusForm.extra_bonus) || 0).toLocaleString()})
                      </span>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={savingBonus}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Simpan & Kunci Rekap Bonus
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Nama Terapis</th>
                      <th className="px-4 py-3">Periode</th>
                      <th className="px-4 py-3">30m</th>
                      <th className="px-4 py-3">60m</th>
                      <th className="px-4 py-3">90m</th>
                      <th className="px-4 py-3">Total Tindakan</th>
                      <th className="px-4 py-3">Grand Total Bonus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bonusList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                          Belum ada rekap bonus terapis
                        </td>
                      </tr>
                    ) : (
                      bonusList.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.employee_name || "Terapis"}</td>
                          <td className="px-4 py-3 text-xs">
                            {row.period_start} ~ {row.period_end}
                          </td>
                          <td className="px-4 py-3">{row.sesi_30m || 0}</td>
                          <td className="px-4 py-3">{row.sesi_60m || 0}</td>
                          <td className="px-4 py-3">{row.sesi_90m || 0}</td>
                          <td className="px-4 py-3 font-medium">
                            {(row.sesi_30m || 0) + (row.sesi_60m || 0) + (row.sesi_90m || 0)} sesi
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600">
                            Rp {(row.grand_total || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
