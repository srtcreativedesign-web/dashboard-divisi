import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-panel border border-line shadow-card',
  elevated: 'bg-panel border border-line shadow-card-hover',
  outlined: 'bg-transparent border-2 border-line hover:border-brand',
  gradient: 'bg-gradient-to-br from-primary-600 to-primary-800 text-white border-transparent shadow-card',
  glass: 'glass border-white/60',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-card-lg transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      onClick={onClick}
      style={{ ...(onClick ? { cursor: 'pointer' } : {}), ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 md:flex-row md:items-center md:justify-between ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-navy dark:text-white">{title}</h2>
        {subtitle ? <p className="text-sm text-subtle">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-4 border-t border-current/10 ${className}`}>
      {children}
    </div>
  );
}
