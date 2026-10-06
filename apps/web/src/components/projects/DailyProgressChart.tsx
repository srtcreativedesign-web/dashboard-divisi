import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { ProjectMilestone } from '../../types/project';

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Kontribusi milestone terhadap progres proyek per tanggal = progres terakhir s.d. tanggal itu x bobot.
function contributionAt(m: ProjectMilestone, day: string) {
  const last = (m.progress_logs ?? []).filter(l => l.log_date <= day).at(-1);
  return ((last?.actual_percentage ?? 0) * (m.weight_percentage || 0)) / 100;
}

export function DailyProgressChart({ milestones, days = 14 }: { milestones: ProjectMilestone[]; days?: number }) {
  const [mode, setMode] = useState<'harian' | 'kumulatif'>('harian');

  const dates = Array.from({ length: days + 1 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    return d;
  });
  const keys = dates.map(toKey);

  const series = milestones.map(m => {
    const cumulative = keys.map(k => contributionAt(m, k));
    const values = mode === 'kumulatif' ? cumulative.slice(1) : cumulative.slice(1).map((v, i) => v - (cumulative[i] ?? 0));
    return { name: m.title, data: values.map(v => Math.round(v * 100) / 100) };
  });

  const options: ApexOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: true }, zoom: { enabled: true }, fontFamily: 'inherit' },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderRadiusApplication: 'end',
        dataLabels: { total: { enabled: true, formatter: v => (v ? `${Number(v).toFixed(1)}%` : ''), style: { fontSize: '11px', fontWeight: 700 } } },
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: dates.slice(1).map(d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: { labels: { formatter: v => `${Math.round(v * 10) / 10}%` } },
    tooltip: { y: { formatter: v => `${v}% bobot proyek` } },
    legend: { position: 'bottom', fontSize: '12px' },
    responsive: [{ breakpoint: 480, options: { legend: { position: 'bottom', offsetX: -10, offsetY: 0 } } }],
    fill: { opacity: 1 },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 3 },
  };

  return (
    <div className="rounded-card-lg border border-line bg-white p-5 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-base font-bold text-navy">Progres Fisik Harian per Pekerjaan</h2>
          <p className="text-xs text-slate-500">
            {mode === 'harian'
              ? `Tambahan progres proyek per hari, ${days} hari terakhir`
              : `Akumulasi progres proyek per hari, ${days} hari terakhir`}
          </p>
        </div>
        <div className="flex rounded-input border border-line p-0.5 text-xs font-semibold">
          {(['harian', 'kumulatif'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-input capitalize transition-colors ${mode === m ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-surface'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {milestones.length > 0 ? (
        <ReactApexChart key={mode} options={options} series={series} type="bar" height={350} />
      ) : (
        <p className="py-16 text-center text-sm text-slate-500">Belum ada tahapan pekerjaan.</p>
      )}
    </div>
  );
}
