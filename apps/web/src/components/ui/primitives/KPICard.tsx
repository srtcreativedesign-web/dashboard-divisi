import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type Variant = 'default' | 'elevated' | 'gradient' | 'outlined';
type Size = 'sm' | 'md' | 'lg';

interface KPICardProps {
  label: string;
  value: ReactNode;
  note?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    label: string;
    positive?: boolean;
  };
  variant?: Variant;
  size?: Size;
  action?: ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<Variant, string> = {
  default: 'bg-panel border border-line shadow-card hover:shadow-card-hover',
  elevated: 'bg-panel border border-line shadow-card-hover',
  gradient: 'bg-gradient-to-br from-primary-600 to-primary-800 text-white border-transparent shadow-card hover:shadow-card-hover',
  outlined: 'bg-transparent border-2 border-line hover:border-brand',
};

const sizeStyles: Record<Size, string> = {
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function KPICard({
  label,
  value,
  note,
  icon,
  trend,
  variant = 'default',
  size = 'md',
  action,
  className = '',
  onClick,
}: KPICardProps) {
  const isGradient = variant === 'gradient';
  const textColor = isGradient ? 'text-white' : 'text-navy';
  const subtleColor = isGradient ? 'text-primary-100' : 'text-subtle';
  const mutedColor = isGradient ? 'text-primary-200' : 'text-muted';

  return (
    <article
      className={`group relative overflow-hidden rounded-card-lg transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {variant === 'gradient' && (
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform group-hover:scale-110" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${subtleColor}`}>{label}</p>
          <p className={`mt-1.5 ${size === 'sm' ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold tabular-nums ${textColor}`}>
            {value}
          </p>
          {note && <p className={`mt-2 text-xs leading-relaxed ${mutedColor}`}>{note}</p>}
          {trend && (
            <p className={`mt-2.5 flex items-center gap-1.5 text-xs font-semibold ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-card ${isGradient ? 'bg-white/20 backdrop-blur-sm' : 'bg-surface border border-line'}`}>
            {isValidElement(icon)
              ? cloneElement(icon as ReactElement<{ className?: string }>, { className: `h-6 w-6 ${isGradient ? 'text-white' : 'text-primary-600 dark:text-primary-300'}` })
              : icon}
          </div>
        )}
      </div>
      {action && (
        <div className="relative mt-4 pt-4 border-t border-current/10">
          {action}
        </div>
      )}
    </article>
  );
}

export function KPICardGrid({
  children,
  className = '',
  columns = 4,
}: {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}) {
  const responsiveColumns = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  }[columns];

  return (
    <div className={`grid gap-5 ${responsiveColumns} ${className}`}>
      {children}
    </div>
  );
}
