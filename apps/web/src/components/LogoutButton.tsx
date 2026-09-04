import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onLogout: () => void;
  className?: string;
  compact?: boolean;
}

export default function LogoutButton({ onLogout, className = '', compact = false }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onLogout}
      aria-label="Keluar"
      title="Keluar dari akun"
      className={`flex items-center justify-center gap-1.5 ${className}`.trim()}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!compact && <span>Keluar</span>}
    </button>
  );
}
