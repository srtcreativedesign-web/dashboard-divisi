import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  status: 'onTrack' | 'warning' | 'critical';
}

export function KpiCard({ label, value, unit = '', IconComponent, status }: KpiCardProps) {
  const statusClasses = {
    onTrack: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    critical: 'bg-danger-light text-danger',
  }[status];

  return (
    <article className="group relative overflow-hidden rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-5 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl bg-primary" />
      <div className="relative flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-card-lg ${statusClasses}`}> 
          <IconComponent className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-navy">{unit}{value}</p>
      <p className={`mt-1 text-xs font-medium ${statusClasses.split(' ')[1]}`}>Status: {status}</p>
    </article>
  );
}
