import { useState, useMemo } from 'react';
import { usePnlComparison, useDivisions, useOutlets } from '../../hooks/useBod';
import { Activity, Filter } from 'lucide-react';
import type { PnlComparisonData } from '../../api/bod';
import type { Division, Outlet } from '../../api/org';

interface Entity {
  id: string;
  name: string;
}

// A custom SVG Line Chart for Time Series Data
function LineChart({ data, entities, colors }: { data: PnlComparisonData[]; entities: Entity[]; colors: string[] }) {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500">No data available</div>;

  const width = 800;
  const height = 300;
  const padding = 40;

  // Find min and max values to scale
  let maxVal = -Infinity;
  let minVal = Infinity;

  data.forEach((month) => {
    month.entities.forEach((e) => {
      if (e.netProfit > maxVal) maxVal = e.netProfit;
      if (e.netProfit < minVal) minVal = e.netProfit;
    });
  });

  if (maxVal === -Infinity) maxVal = 1000;
  if (minVal === Infinity) minVal = 0;
  
  // Add some buffer
  const range = maxVal - minVal || 1000;
  maxVal += range * 0.1;
  minVal = Math.min(0, minVal - range * 0.1); 

  const scaleX = (index: number) => padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
  const scaleY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal)) * (height - 2 * padding);

  return (
    <div className="w-full overflow-x-auto relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px]">
        {/* Y-Axis lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const val = minVal + (maxVal - minVal) * tick;
          const y = scaleY(val);
          return (
            <g key={tick}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={padding - 10} y={y + 4} fontSize="10" textAnchor="end" fill="#64748b">
                {(val / 1e6).toFixed(0)}M
              </text>
            </g>
          );
        })}

        {/* X-Axis labels */}
        {data.map((month, i) => (
          <text key={month.period} x={scaleX(i)} y={height - padding + 20} fontSize="10" textAnchor="middle" fill="#64748b">
            {month.period.slice(-2)}
          </text>
        ))}

        {/* Lines */}
        {entities.map((entity, entityIdx) => {
          const color = colors[entityIdx % colors.length];
          const points = data.map((month, i) => {
            const val = month.entities.find((e) => e.id === entity.id)?.netProfit ?? 0;
            return `${scaleX(i)},${scaleY(val)}`;
          }).join(' ');

          return (
            <polyline
              key={entity.id}
              fill="none"
              stroke={color}
              strokeWidth="3"
              points={points}
              className="transition-all duration-700 animate-fade-in-up hover:stroke-w-[4] cursor-pointer"
            />
          );
        })}
        
        {/* Data Points */}
        {entities.map((entity, entityIdx) => {
          const color = colors[entityIdx % colors.length];
          return data.map((month, i) => {
            const val = month.entities.find((e) => e.id === entity.id)?.netProfit ?? 0;
            return (
              <circle
                key={`${entity.id}-${i}`}
                cx={scaleX(i)}
                cy={scaleY(val)}
                r="4"
                fill={color}
                className="hover:r-[6] transition-all cursor-pointer"
              >
                <title>{`${entity.name}\nPeriod: ${month.period}\nNet Profit: Rp ${val.toLocaleString()}`}</title>
              </circle>
            );
          });
        })}
      </svg>
    </div>
  );
}

export function PnlComparisonChart() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [periodType, setPeriodType] = useState<'monthly' | 'daily'>('monthly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  
  // By default, if selectedDivisions has only 1 division, we can fetch its outlets.
  const divisionForOutlets = selectedDivisions.length === 1 ? selectedDivisions[0] : undefined;

  const { data: divisionsList } = useDivisions();
  const { data: outletsList } = useOutlets(divisionForOutlets);
  const { data: comparisonData, isLoading } = usePnlComparison(
    year, 
    selectedDivisions.length > 0 ? selectedDivisions : undefined, 
    selectedOutlets.length > 0 ? selectedOutlets : undefined,
    periodType,
    periodType === 'daily' ? month : undefined
  );

  const toggleDivision = (code: string) => {
    setSelectedDivisions(prev => {
      const isSelected = prev.includes(code);
      if (isSelected) return prev.filter(c => c !== code);
      return [...prev, code];
    });
    // Reset outlets when division selection changes
    setSelectedOutlets([]);
  };

  const toggleOutlet = (id: string) => {
    setSelectedOutlets(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) return prev.filter(c => c !== id);
      return [...prev, id];
    });
  };

  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const entities = useMemo((): Entity[] => {
    if (!comparisonData || comparisonData.length === 0) return [];
    // Extract unique entities from the first month data that has them
    const monthWithData = comparisonData.find((m) => m.entities.length > 0);
    if (!monthWithData) return [];
    
    return monthWithData.entities.map((e) => ({ id: e.id, name: e.name }));
  }, [comparisonData]);

  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  return (
    <div className="rounded-card-lg border border-line/40 bg-white/80 backdrop-blur-md p-6 shadow-sm mt-8 print:hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-navy flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Analisis Perbandingan Laba Bersih
          </h2>
          <p className="text-xs text-slate-500 mt-1">Perbandingan Net Profit Antar Divisi / Outlet Tahun {year}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex text-sm mr-2">
            <button 
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1 rounded-md transition-colors ${periodType === 'monthly' ? 'bg-white shadow-sm font-semibold text-primary' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Per Bulan
            </button>
            <button 
              onClick={() => setPeriodType('daily')}
              className={`px-3 py-1 rounded-md transition-colors ${periodType === 'daily' ? 'bg-white shadow-sm font-semibold text-primary' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Per Hari
            </button>
          </div>
          
          {periodType === 'daily' && (
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="text-sm rounded-md border-line/40 shadow-sm"
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          )}

          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm rounded-md border-line/40 shadow-sm"
          >
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface/50 p-4 rounded-card border border-line/20">
            <h4 className="text-sm font-bold text-navy flex items-center gap-1.5 mb-3">
              <Filter className="w-4 h-4" /> Filter Divisi
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {divisionsList?.map((d: Division) => (
                <label key={d.code} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={selectedDivisions.includes(d.code)}
                    onChange={() => toggleDivision(d.code)}
                    className="rounded text-primary focus:ring-primary/20"
                  />
                  <span className="truncate">{d.name}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedDivisions.length === 1 && outletsList && (
            <div className="bg-surface/50 p-4 rounded-card border border-line/20 animate-fade-in-up">
              <h4 className="text-sm font-bold text-navy flex items-center gap-1.5 mb-3">
                <Filter className="w-4 h-4" /> Filter Outlet ({selectedDivisions[0]})
              </h4>
              <p className="text-xs text-slate-500 mb-2">Pilih outlet untuk membandingkan performa dalam divisi yang sama.</p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {outletsList.map((o: Outlet) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/50 p-1 rounded">
                    <input 
                      type="checkbox" 
                      checked={selectedOutlets.includes(o.id)}
                      onChange={() => toggleOutlet(o.id)}
                      className="rounded text-info focus:ring-info/20"
                    />
                    <span className="truncate">{o.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <LineChart data={comparisonData ?? []} entities={entities} colors={colors} />
              
              <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs font-semibold">
                {entities.map((entity: Entity, i: number) => (
                  <div key={entity.id} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
                    <span className="text-slate-600">{entity.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

