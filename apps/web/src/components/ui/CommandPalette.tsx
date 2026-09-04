import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  TrendingUp,
  Target,
  Award,
  Users,
  Calendar,
  Store,
  Settings,
  BookOpenText,
  Clock,
  DollarSign,
  ShieldCheck,
  Database,
  UploadCloud,
  X,
  CornerDownLeft,
  SlidersHorizontal,
  Layers,
  Sparkles,
  PanelLeft,
  FileSpreadsheet,
  Bell,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Modul Utama' | 'Accounting & Finansial' | 'Aksi Cepat';
  path?: string;
  action?: () => void;
  icon: React.ElementType;
  keywords: string[];
  shortcut?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      // Modul Utama
      {
        id: 'nav-dashboard',
        title: 'Executive Dashboard',
        description: 'Ringkasan performa 7 divisi, KPI revenue, & chart tren',
        category: 'Modul Utama',
        path: '/dashboard',
        icon: LayoutDashboard,
        keywords: ['executive', 'kpi', 'revenue', 'omzet', 'beranda', 'grafik'],
        shortcut: 'G D',
      },
      {
        id: 'nav-omzet',
        title: 'Omzet & Penjualan',
        description: 'Analisis perolehan omzet harian, mingguan, dan bulanan',
        category: 'Modul Utama',
        path: '/omzet',
        icon: TrendingUp,
        keywords: ['penjualan', 'omset', 'sales', 'tren', 'harian'],
      },
      {
        id: 'nav-target',
        title: 'Target & Pencapaian',
        description: 'Pemantauan realisasi target omzet dan gap pencapaian',
        category: 'Modul Utama',
        path: '/target',
        icon: Target,
        keywords: ['target', 'gap', 'pencapaian', 'kuota', 'goal'],
      },
      {
        id: 'nav-penilaian',
        title: 'Penilaian Kinerja',
        description: 'Skoring produktivitas dan evaluasi performa operasional',
        category: 'Modul Utama',
        path: '/penilaian',
        icon: Award,
        keywords: ['evaluasi', 'skor', 'kpi', 'ranking', 'prestasi'],
      },
      {
        id: 'nav-karyawan',
        title: 'Data Karyawan & Workforce',
        description: 'Daftar personel, penugasan divisi, dan shift kerja',
        category: 'Modul Utama',
        path: '/karyawan',
        icon: Users,
        keywords: ['karyawan', 'staf', 'sdm', 'workforce', 'jadwal'],
      },
      {
        id: 'nav-laporan-harian',
        title: 'Laporan Harian Operasional',
        description: 'Catatan rekonsiliasi harian kasir dan setoran',
        category: 'Modul Utama',
        path: '/laporan-harian',
        icon: Calendar,
        keywords: ['laporan', 'harian', 'setoran', 'kasir', 'rekap'],
      },
      {
        id: 'nav-tenant',
        title: 'Rincian Tenant & Sewa',
        description: 'Data persewaan outlet bandara dan rincian tenant',
        category: 'Modul Utama',
        path: '/rincian-tenant',
        icon: Store,
        keywords: ['tenant', 'outlet', 'bandara', 'sewa', 'mall'],
      },
      {
        id: 'nav-konfigurasi',
        title: 'Konfigurasi Sistem',
        description: 'Pengaturan otorisasi, master data, dan parameter aplikasi',
        category: 'Modul Utama',
        path: '/konfigurasi',
        icon: Settings,
        keywords: ['settings', 'konfigurasi', 'pengaturan', 'sistem'],
      },

      // Accounting & Finansial
      {
        id: 'nav-accounting-center',
        title: 'Accounting Center',
        description: 'Pusat kontrol jurnal, buku besar, dan audit akuntansi',
        category: 'Accounting & Finansial',
        path: '/accounting',
        icon: LayoutDashboard,
        keywords: ['accounting', 'akuntansi', 'keuangan', 'buku besar'],
      },
      {
        id: 'nav-jurnal',
        title: 'Jurnal Umum (General Ledger)',
        description: 'Pencatatan dan riwayat transaksi double-entry',
        category: 'Accounting & Finansial',
        path: '/accounting/jurnal',
        icon: BookOpenText,
        keywords: ['jurnal', 'ledger', 'debit', 'kredit', 'transaksi'],
      },
      {
        id: 'nav-outstanding',
        title: 'Aging Bucket & Tagihan Outstanding',
        description: 'Distribusi umur piutang (Current, 1-30, 31-60, 60+ hari)',
        category: 'Accounting & Finansial',
        path: '/accounting/outstanding',
        icon: Clock,
        keywords: ['aging', 'outstanding', 'piutang', 'ar', 'tagihan', 'bucket'],
      },
      {
        id: 'nav-cashflow',
        title: 'Cash Flow Waterfall Chart',
        description: 'Visualisasi jembatan arus kas masuk, keluar, dan saldo neto',
        category: 'Accounting & Finansial',
        path: '/accounting/cashflow',
        icon: DollarSign,
        keywords: ['cashflow', 'waterfall', 'arus kas', 'operasional', 'saldo'],
      },
      {
        id: 'nav-rekonsiliasi',
        title: 'Rekonsiliasi Bank & Match Gauge',
        description: 'Penyamaan mutasi 31 rekening bank dengan buku besar',
        category: 'Accounting & Finansial',
        path: '/accounting/rekonsiliasi',
        icon: ShieldCheck,
        keywords: ['rekonsiliasi', 'bank', 'match', 'gauge', 'mutasi', 'klop'],
      },
      {
        id: 'nav-master-acc',
        title: 'Master Akun & Rekening Bank',
        description: 'Kelola Chart of Accounts (COA) dan 31 akun rekening',
        category: 'Accounting & Finansial',
        path: '/accounting/master',
        icon: Database,
        keywords: ['coa', 'chart of accounts', 'rekening', 'master', 'bank'],
      },
      {
        id: 'nav-impor-transaksi',
        title: 'Impor Jurnal & Transaksi CSV',
        description: 'Unggah berkas mutasi bank dan jurnal transaksi massal',
        category: 'Accounting & Finansial',
        path: '/accounting/impor',
        icon: UploadCloud,
        keywords: ['impor', 'upload', 'csv', 'excel', 'batch'],
      },

      // Aksi Cepat
      {
        id: 'act-open-detail-sheet',
        title: 'Buka Panel Rincian Cepat (Detail Sheet)',
        description: 'Tampilkan drawer inspeksi data kontekstual sisi kanan',
        category: 'Aksi Cepat',
        icon: Layers,
        keywords: ['drawer', 'detail', 'sheet', 'panel', 'inspeksi', 'slideover'],
        shortcut: 'Ctrl+D',
      },
      {
        id: 'act-toggle-sidebar',
        title: 'Ciutkan / Perbesar Sidebar Desktop',
        description: 'Beralih antara mode compact ikonik dan menu penuh',
        category: 'Aksi Cepat',
        icon: PanelLeft,
        keywords: ['sidebar', 'collapse', 'expand', 'ciutkan', 'menu'],
        shortcut: 'Ctrl+B',
      },
      {
        id: 'act-filter-today',
        title: 'Saring Periode: Hari Ini',
        description: 'Fokuskan data operasional untuk transaksi hari berjalan',
        category: 'Aksi Cepat',
        icon: Sparkles,
        keywords: ['filter', 'hari ini', 'today', 'periode'],
      },
      {
        id: 'act-filter-month',
        title: 'Saring Periode: Bulan Ini (Default)',
        description: 'Tampilkan data agregasi sepanjang bulan aktif berjalan',
        category: 'Aksi Cepat',
        icon: SlidersHorizontal,
        keywords: ['filter', 'bulan ini', 'month', 'periode'],
      },
      {
        id: 'act-export-summary',
        title: 'Ekspor Ringkasan Laporan (CSV/Excel)',
        description: 'Unduh rekapitulasi data aktif ke format berkas spreadsheet',
        category: 'Aksi Cepat',
        icon: FileSpreadsheet,
        keywords: ['export', 'ekspor', 'unduh', 'download', 'csv', 'excel'],
      },
      {
        id: 'act-open-scheduled-reports',
        title: 'Buka Pusat Jadwal Laporan Otomatis',
        description: 'Kelola distribusi otomatis flash report harian dan aging mingguan',
        category: 'Aksi Cepat',
        path: '/laporan',
        icon: Clock,
        keywords: ['jadwal', 'schedule', 'cron', 'otomatis', 'distribusi', 'laporan'],
      },
      {
        id: 'act-open-notifications',
        title: 'Lihat Notifikasi & Peringatan Dini',
        description: 'Buka notifikasi tagihan kritis, rekonsiliasi, dan performa divisi',
        category: 'Aksi Cepat',
        icon: Bell,
        keywords: ['notifikasi', 'notification', 'peringatan', 'alert', 'lonceng', 'unread'],
      },
      {
        id: 'act-open-audit-trail',
        title: 'Buka Jejak Audit Sistem (Audit Trail)',
        description: 'Inspeksi riwayat aktivitas kepatuhan, mutasi, ekspor, dan otentikasi',
        category: 'Aksi Cepat',
        icon: ShieldCheck,
        keywords: ['audit', 'trail', 'log', 'keamanan', 'riwayat', 'trace', 'aktivitas'],
      },
    ],
    [],
  );

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return commands;
    return commands.filter((cmd) => {
      const inTitle = cmd.title.toLowerCase().includes(trimmed);
      const inDesc = cmd.description.toLowerCase().includes(trimmed);
      const inCategory = cmd.category.toLowerCase().includes(trimmed);
      const inKeywords = cmd.keywords.some((kw) => kw.toLowerCase().includes(trimmed));
      return inTitle || inDesc || inCategory || inKeywords;
    });
  }, [commands, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle execution of item
  const handleSelectItem = (item: CommandItem) => {
    onClose();
    if (item.path) {
      navigate(item.path);
    }
    if (item.action) {
      item.action();
    }
    if (onSelectAction) {
      onSelectAction(item.id);
    }
  };

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      data-testid="command-palette-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global Command Palette"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-sky-200/80 ring-1 ring-black/5 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Accent top gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-600 via-sky-500 to-sage" />

        {/* Input header */}
        <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3.5 bg-slate-50/50">
          <Search className="h-5 w-5 text-sky-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik nama modul, fitur, atau aksi cepat (misal: 'omzet', 'cashflow', 'sidebar')..."
            aria-label="Cari modul atau perintah"
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
            data-testid="command-palette-input"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Bersihkan pencarian"
              className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 border border-slate-200 shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* List of items */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200"
          data-testid="command-palette-list"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Tidak ada perintah atau modul yang cocok</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Coba gunakan kata kunci lain seperti <span className="font-medium text-sky-700">"jurnal"</span>,{' '}
                <span className="font-medium text-sky-700">"rekening"</span>, atau{' '}
                <span className="font-medium text-sky-700">"waterfall"</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    data-selected={isSelected ? 'true' : 'false'}
                    className={`w-full text-left flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      isSelected
                        ? 'bg-gradient-to-r from-sky-50 to-blue-50/60 text-sky-950 border-l-4 border-sky-600 pl-3 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate leading-tight">{item.title}</p>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${
                              item.category === 'Modul Utama'
                                ? 'bg-sky-100/70 text-sky-800 border-sky-200'
                                : item.category === 'Accounting & Finansial'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.shortcut && (
                        <kbd className="hidden sm:inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 border border-slate-200">
                          {item.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <CornerDownLeft className="h-4 w-4 text-sky-600 animate-in fade-in duration-100" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-line/60 bg-slate-50/80 px-4 py-2.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                ↑↓
              </kbd>{' '}
              Navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                ↵
              </kbd>{' '}
              Pilih
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                ESC
              </kbd>{' '}
              Tutup
            </span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-sky-800">{filteredItems.length}</span> hasil ditemukan
          </div>
        </div>
      </div>
    </div>
  );
}
