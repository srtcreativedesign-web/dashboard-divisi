import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full rounded-input border border-line bg-white px-3 py-2 text-sm placeholder:text-slate-400 transition-all duration-200 hover:border-line-2 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-sm outline-none ${className}`} {...props} />;
}
export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`w-full rounded-input border border-line bg-white px-3 py-2 text-sm transition-all duration-200 hover:border-line-2 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-sm outline-none ${className}`} {...props}>{children}</select>;
}
