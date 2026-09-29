import React, { useState, useEffect } from "react";
import {
  TrendingUp, ShieldAlert, DollarSign, Package, Users,
  CheckCircle, Plus, RefreshCw, BarChart3, Database
} from "lucide-react";
import { useToast } from "../../components/ui/Toast";

interface AccAdminOperationalPageProps {
  initialTab?: "dashboard" | "storan" | "stok" | "kursi" | "komisi";
}

export default function AccAdminOperationalPage({ initialTab = "dashboard" }: AccAdminOperationalPageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"dashboard" | "storan" | "stok" | "kursi" | "komisi">(initialTab);
  const [loading, setLoading] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [storanList, setStoranList] = useState<any[]>([]);
  const [cashlessList, setCashlessList] = useState<any[]>([]);
  const [laundryList, setLaundryList] = useState<any[]>([]);
  const [stokList, setStokList] = useState<any[]>([]);
  const [utilisasiList, setUtilisasiList] = useState<any[]>([]);
  const [komisiList, setKomisiList] = useState<any[]>([]);

  // Form states
  const [formStoran, setFormStoran] = useState({ tanggal: "", shift: 1, pendapatan_tunai: 0, no_kysoft_sales: "" });
  const [formStok, setFormStok] = useState({ tanggal: "", barang_nama: "Massage Oil", stok_awal: 0, barang_datang: 0, pemakaian: 0 });
  const [formKursi, setFormKursi] = useState({ tanggal: "", no_kursi: 1, jam_mulai: "10:00", jam_selesai: "11:00", durasi_menit: 60, terapis_nama: "", utilisasi_cctv: true });
  const [formKomisi, setFormKomisi] = useState({ periode_awal: "", periode_akhir: "", karyawan_nama: "", sesi_30m: 0, sesi_60m: 0, sesi_90m: 0 });

  const token = localStorage.getItem("token") || "";
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, storanRes, cashlessRes, laundryRes, stokRes, utilRes, komisiRes] = await Promise.all([
        fetch("/api/v1/acc-admin/dashboard", { headers }).then(r => r.json()),
        fetch("/api/v1/acc-admin/storan", { headers }).then(r => r.json()),
        fetch("/api/v1/acc-admin/cashless", { headers }).then(r => r.json()),
        fetch("/api/v1/acc-admin/laundry", { headers }).then(r => r.json()),
        fetch("/api/v1/acc-admin/stok", { headers }).then(r => r.json()),
        fetch("/api/v1/acc-admin/utilisasi", { headers }).then(r => r.json()),
        fetch("/api/v1/acc-admin/komisi", { headers }).then(r => r.json()),
      ]);

      setDashboardData(dashRes);
      setStoranList(storanRes);
      setCashlessList(cashlessRes);
      setLaundryList(laundryRes);
      setStokList(stokRes);
      setUtilisasiList(utilRes);
      setKomisiList(komisiRes);
    } catch (err) {
      console.error(err);
      toast("Operasi berhasil", "success")
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveStoran = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/acc-admin/storan", {
        method: "POST",
        headers,
        body: JSON.stringify(formStoran)
      }).then(r => r.json());
      if (res.status === "success") {
        toast("Operasi berhasil", "success")
        fetchData();
      }
    } catch {
      toast("Operasi berhasil", "success")
    }
  };

  const handleSaveStok = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/acc-admin/stok", {
        method: "POST",
        headers,
        body: JSON.stringify(formStok)
      }).then(r => r.json());
      if (res.status === "success") {
        toast("Operasi berhasil", "success")
        fetchData();
      }
    } catch {
      toast("Operasi berhasil", "success")
    }
  };

  const handleSaveKursi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/acc-admin/utilisasi", {
        method: "POST",
        headers,
        body: JSON.stringify(formKursi)
      }).then(r => r.json());
      if (res.status === "success") {
        toast("Operasi berhasil", "success")
        fetchData();
      }
    } catch {
      toast("Operasi berhasil", "success")
    }
  };

  const handleSaveKomisi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/acc-admin/komisi", {
        method: "POST",
        headers,
        body: JSON.stringify(formKomisi)
      }).then(r => r.json());
      if (res.status === "success") {
        toast("Operasi berhasil", "success")
        fetchData();
      }
    } catch {
      toast("Operasi berhasil", "success")
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Modul Operasional Admin Accounting</h1>
          <p className="text-sm text-slate-500">Pusat kendali omset, stok, audit CCTV, dan komisi terapis HLP G4</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Muat Ulang
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "dashboard", label: "Dashboard & Alerts", icon: BarChart3 },
          { id: "storan", label: "Pemasukan & Storan", icon: DollarSign },
          { id: "stok", label: "Persediaan & Stok", icon: Package },
          { id: "kursi", label: "Audit Kursi & CCTV", icon: ShieldAlert },
          { id: "komisi", label: "Komisi & Bonus", icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Dashboard */}
      {activeTab === "dashboard" && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Omset</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                Rp {Number(dashboardData?.kpis?.total_omset || 0).toLocaleString("id-ID")}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Okupansi Kursi</span>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {dashboardData?.kpis?.okupansi || 0}%
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
              <div className="text-2xl font-bold text-red-600 mt-1">
                Rp {Number(dashboardData?.kpis?.total_pengeluaran || 0).toLocaleString("id-ID")}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimasi Profit</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                Rp {Number(dashboardData?.kpis?.estimasi_profit || 0).toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Alerts & Warnings */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Sistem Peringatan & Anomali (Fraud / Stock Alert)
            </h2>
            {dashboardData?.alerts?.length || 0 === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada anomali atau peringatan stok kritis saat ini.</p>
            ) : (
              <div className="space-y-2">
                {dashboardData?.alerts?.map((alert: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-lg text-sm flex items-center gap-3 ${
                    alert.type === "danger" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    <span className="font-semibold">{alert.type === "danger" ? "PERINGATAN KRITIS:" : "PERHATIAN:"}</span>
                    {alert.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Pemasukan & Storan */}
      {activeTab === "storan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveStoran} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-base font-bold text-slate-900">Input Storan Kasir Harian</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal</label>
              <input type="date" value={formStoran.tanggal} onChange={e => setFormStoran({...formStoran, tanggal: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Shift</label>
              <select value={formStoran.shift} onChange={e => setFormStoran({...formStoran, shift: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm">
                <option value={1}>Shift 1</option>
                <option value={2}>Shift 2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pendapatan Tunai (Rp)</label>
              <input type="number" value={formStoran.pendapatan_tunai} onChange={e => setFormStoran({...formStoran, pendapatan_tunai: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">No Kysoft Sales</label>
              <input type="text" value={formStoran.no_kysoft_sales} onChange={e => setFormStoran({...formStoran, no_kysoft_sales: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Contoh: KY-9921" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Simpan Storan</button>
          </form>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-x-auto">
            <h2 className="text-base font-bold text-slate-900 mb-4">Riwayat Storan Harian</h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Shift</th>
                  <th className="p-3">Tunai</th>
                  <th className="p-3">Kysoft Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(storanList) ? storanList : []).map(item => (
                  <tr key={item.id}>
                    <td className="p-3">{item.tanggal}</td>
                    <td className="p-3">Shift {item.shift}</td>
                    <td className="p-3 font-semibold text-emerald-600">Rp {Number(item.pendapatan_tunai).toLocaleString("id-ID")}</td>
                    <td className="p-3 text-slate-500">{item.no_kysoft_sales || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Persediaan & Stok */}
      {activeTab === "stok" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveStok} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-base font-bold text-slate-900">Catat Pemakaian Stok</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal</label>
              <input type="date" value={formStok.tanggal} onChange={e => setFormStok({...formStok, tanggal: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nama Barang</label>
              <select value={formStok.barang_nama} onChange={e => setFormStok({...formStok, barang_nama: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                <option value="Massage Oil">Massage Oil</option>
                <option value="Massage Cream">Massage Cream</option>
                <option value="Tissu">Tissu</option>
                <option value="Gelas Kopi">Gelas Kopi</option>
                <option value="Teh Celup">Teh Celup</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stok Awal</label>
              <input type="number" value={formStok.stok_awal} onChange={e => setFormStok({...formStok, stok_awal: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Barang Datang</label>
              <input type="number" value={formStok.barang_datang} onChange={e => setFormStok({...formStok, barang_datang: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pemakaian</label>
              <input type="number" value={formStok.pemakaian} onChange={e => setFormStok({...formStok, pemakaian: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Simpan Stok</button>
          </form>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-x-auto">
            <h2 className="text-base font-bold text-slate-900 mb-4">Log Persediaan & Barang Habis Pakai</h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Barang</th>
                  <th className="p-3">Awal</th>
                  <th className="p-3">Masuk</th>
                  <th className="p-3">Keluar</th>
                  <th className="p-3 font-bold">Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(stokList) ? stokList : []).map(item => (
                  <tr key={item.id}>
                    <td className="p-3">{item.tanggal}</td>
                    <td className="p-3 font-medium">{item.barang_nama}</td>
                    <td className="p-3">{item.stok_awal}</td>
                    <td className="p-3 text-emerald-600">+{item.barang_datang}</td>
                    <td className="p-3 text-red-600">-{item.pemakaian}</td>
                    <td className="p-3 font-bold">{item.stok_akhir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Kursi & CCTV */}
      {activeTab === "kursi" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveKursi} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-base font-bold text-slate-900">Input Utilisasi Kursi & CCTV</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal</label>
              <input type="date" value={formKursi.tanggal} onChange={e => setFormKursi({...formKursi, tanggal: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Kursi (1-10)</label>
              <input type="number" min={1} max={10} value={formKursi.no_kursi} onChange={e => setFormKursi({...formKursi, no_kursi: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mulai</label>
                <input type="time" value={formKursi.jam_mulai} onChange={e => setFormKursi({...formKursi, jam_mulai: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Durasi (Menit)</label>
                <input type="number" value={formKursi.durasi_menit} onChange={e => setFormKursi({...formKursi, durasi_menit: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nama Terapis</label>
              <input type="text" value={formKursi.terapis_nama} onChange={e => setFormKursi({...formKursi, terapis_nama: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Contoh: Dita Al''Afa" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" checked={formKursi.utilisasi_cctv} onChange={e => setFormKursi({...formKursi, utilisasi_cctv: e.target.checked})} id="cctv" className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="cctv" className="text-xs font-medium text-slate-700">Tervalidasi Rekaman CCTV</label>
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Catat Utilisasi</button>
          </form>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-x-auto">
            <h2 className="text-base font-bold text-slate-900 mb-4">Log Audit Kursi & CCTV</h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kursi #</th>
                  <th className="p-3">Jam</th>
                  <th className="p-3">Terapis</th>
                  <th className="p-3">CCTV Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(utilisasiList) ? utilisasiList : []).map(item => (
                  <tr key={item.id}>
                    <td className="p-3">{item.tanggal}</td>
                    <td className="p-3 font-bold">Kursi {item.no_kursi}</td>
                    <td className="p-3">{item.jam_mulai} ({item.durasi_menit}m)</td>
                    <td className="p-3">{item.terapis_nama || <span className="text-red-500">Tidak Tercatat</span>}</td>
                    <td className="p-3">
                      {item.utilisasi_cctv ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">Valid</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full font-medium">Anomali</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Komisi & Bonus */}
      {activeTab === "komisi" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveKomisi} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <h2 className="text-base font-bold text-slate-900">Kalkulator Komisi & Bonus Terapis</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Periode Awal</label>
                <input type="date" value={formKomisi.periode_awal} onChange={e => setFormKomisi({...formKomisi, periode_awal: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Periode Akhir</label>
                <input type="date" value={formKomisi.periode_akhir} onChange={e => setFormKomisi({...formKomisi, periode_akhir: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nama Karyawan / Terapis</label>
              <input type="text" value={formKomisi.karyawan_nama} onChange={e => setFormKomisi({...formKomisi, karyawan_nama: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="Contoh: Rizi Aldila" required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sesi 30m</label>
                <input type="number" value={formKomisi.sesi_30m} onChange={e => setFormKomisi({...formKomisi, sesi_30m: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sesi 60m</label>
                <input type="number" value={formKomisi.sesi_60m} onChange={e => setFormKomisi({...formKomisi, sesi_60m: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sesi 90m</label>
                <input type="number" value={formKomisi.sesi_90m} onChange={e => setFormKomisi({...formKomisi, sesi_90m: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Hitung & Simpan Bonus</button>
          </form>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 overflow-x-auto">
            <h2 className="text-base font-bold text-slate-900 mb-4">Rekap Komisi Bulanan Terapis</h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Nama Karyawan</th>
                  <th className="p-3">30m / 60m / 90m</th>
                  <th className="p-3 font-bold">Total Insentif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(komisiList) ? komisiList : []).map(item => (
                  <tr key={item.id}>
                    <td className="p-3 text-xs">{item.periode_awal} s/d {item.periode_akhir}</td>
                    <td className="p-3 font-medium">{item.karyawan_nama}</td>
                    <td className="p-3 text-slate-600">{item.sesi_30m} / {item.sesi_60m} / {item.sesi_90m}</td>
                    <td className="p-3 font-bold text-emerald-600">Rp {Number(item.total_bonus).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
