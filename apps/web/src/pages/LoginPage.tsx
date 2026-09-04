import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../session/AuthContext';

interface QuickRole {
  label: string;
  badge: string;
  email: string;
  password: string;
  role: string;
  division: string | null;
}

const QUICK_ROLES: QuickRole[] = [
  { label: 'BOD (Direksi)', badge: '👑 BOD', email: 'bod1@dashboard.test', password: 'Password123!', role: 'BOD', division: null },
  { label: 'Manager ACC', badge: '⚡ Manager', email: 'manager.acc@dashboard.test', password: 'Password123!', role: 'MANAGER', division: 'ACC' },
  { label: 'Admin ACC', badge: '📘 ACC', email: 'admin.acc@dashboard.test', password: 'Password123!', role: 'ADMIN', division: 'ACC' },
  { label: 'Admin Wrapping', badge: '📦 WRAP', email: 'admin.wrap@dashboard.test', password: 'Password123!', role: 'ADMIN', division: 'WRAP' },
  { label: 'Admin FnB', badge: '🍔 FNB', email: 'admin.fnb@dashboard.test', password: 'Password123!', role: 'ADMIN', division: 'FNB' },
  { label: 'PIC View-Only', badge: '👁️ PIC', email: 'pic.wrap@dashboard.test', password: 'Password123!', role: 'USER', division: 'WRAP' },
];

export default function LoginPage() {
  const { login, error } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Inline Validation States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    if (!val.trim()) {
      setEmailError('Email wajib diisi');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      setEmailError('Format email tidak valid (contoh: nama@perusahaan.com)');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Password wajib diisi');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) validateEmail(e.target.value);
    if (msg) setMsg(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) validatePassword(e.target.value);
    if (msg) setMsg(null);
  };

  const applyQuickRole = (roleItem: QuickRole) => {
    setEmail(roleItem.email);
    setPassword(roleItem.password);
    setEmailError(null);
    setPasswordError(null);
    setMsg(null);

    try {
      localStorage.setItem('dashboard-divisi.role-demo', roleItem.role);
      if (roleItem.division) {
        localStorage.setItem('dashboard-divisi.division-demo', roleItem.division);
      } else {
        localStorage.removeItem('dashboard-divisi.division-demo');
      }
    } catch {
      // ignore
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      await login(email.trim(), password);
      nav('/dashboard', { replace: true });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042f48] via-[#075985] to-[#0c4a6e] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden text-white selection:bg-cyan-400 selection:text-slate-900">
      {/* Decorative ambient glowing orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-sky-400/20 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-[#419cc3]/15 blur-[150px]" />

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-7 sm:p-9 animate-fade-in-up">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-dark text-white font-black text-xl shadow-[0_0_30px_rgba(14,165,233,0.6)] ring-2 ring-white/30">
            DD
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Dashboard Divisi
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-sky-100/80 font-medium">
            Portal Terpadu 7 Divisi Ritel & Accounting
          </p>
        </div>

        {/* Quick Role Switcher Chips */}
        <div className="mb-6 rounded-2xl bg-black/20 border border-white/10 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-200">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Pilih Akun Demo Cepat
            </span>
            <span className="text-[10px] text-sky-200/60 font-medium">Klik untuk isi otomatis</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ROLES.map((item) => {
              const isSelected = email === item.email;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => applyQuickRole(item)}
                  aria-label={`Gunakan akun ${item.label}`}
                  title={`Gunakan akun ${item.label}`}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white shadow-md ring-1 ring-white/40'
                      : 'bg-white/10 text-sky-100 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                >
                  <span>{item.badge}</span>
                  {isSelected && <CheckCircle2 className="h-3 w-3 text-white ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={submit} noValidate className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-sky-100 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sky-200/70">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                placeholder="nama@company.test"
                autoComplete="email"
                aria-invalid={Boolean(emailError || (msg ?? error))}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`w-full rounded-xl bg-white/10 pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-sky-200/50 backdrop-blur-md transition-all focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border border-rose-400/80 focus:ring-rose-400'
                    : 'border border-white/20 focus:border-cyan-300 focus:ring-cyan-300/50'
                }`}
              />
            </div>
            {emailError && (
              <p id="email-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-sky-100 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sky-200/70">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => validatePassword(password)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(passwordError || (msg ?? error))}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`w-full rounded-xl bg-white/10 pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-sky-200/50 backdrop-blur-md transition-all focus:outline-none focus:ring-2 ${
                  passwordError
                    ? 'border border-rose-400/80 focus:ring-rose-400'
                    : 'border border-white/20 focus:border-cyan-300 focus:ring-cyan-300/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-sky-200/80 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          {/* Server / Auth Error Alert */}
          {(msg ?? error) && (
            <div
              id="login-error"
              role="alert"
              className="flex items-center gap-2.5 rounded-xl bg-rose-500/25 border border-rose-400/40 p-3 text-xs sm:text-sm text-rose-100 backdrop-blur-md animate-fade-in"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
              <span className="font-medium">{msg ?? error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 via-primary-600 to-dark text-white font-bold text-sm shadow-[0_4px_20px_rgba(14,165,233,0.4)] hover:shadow-[0_4px_25px_rgba(14,165,233,0.7)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses Masuk...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Badge */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-sky-200/70">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
          <span>Sesi Aman httpOnly · Audit Trace ID · TLS Enkripsi</span>
        </div>
      </div>
    </div>
  );
}

