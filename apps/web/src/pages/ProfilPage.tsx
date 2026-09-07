import { StatusPill } from '../components/StatusPill';
import { roleDisplay } from '../mocks/session';
import { useAuth } from '../session/AuthContext';
import { useOrgContext } from '../hooks/useBod';

const selfService = [
  { label: 'Jadwal hari ini', value: 'Shift pagi · 08:00-16:00', visibility: 'Hanya data sendiri' },
  { label: 'Absensi terakhir', value: 'Check-in 07:54 · Normal', visibility: 'Tanpa data rekan kerja' },
  { label: 'Cuti', value: '1 pending · 0 aktif', visibility: 'Riwayat pribadi' },
  { label: 'Lembur minggu ini', value: '4 jam', visibility: 'Tanpa nominal payroll' },
];

const securityItems = [
  { title: 'Password', detail: 'Reset via POST /auth/reset (BE real) — terverifikasi di AuthTest.', status: 'Ready' },
  { title: 'Session', detail: 'Logout server-side mem-blokir JWT via TokenRevocationService (httpOnly cookie).', status: 'Ready' },
  { title: 'Scope', detail: 'Menu & halaman guarded Capability + DivisionScope server-side (BOD lintas, MANAGER 1:1).', status: 'Ready' },
];

export default function ProfilPage() {
  const { user } = useAuth();
  const ctx = useOrgContext();
  if (!user) return <div className="p-6 text-sm">Belum login — <a href="/login" className="text-primary underline">Masuk</a></div>;
  const scope = (ctx.data as unknown as { scope?: string } | undefined)?.scope ?? user.divisionCode ?? '—';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <section className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Akun — Real BE</p>
            <h1 className="mt-1 text-2xl lg:text-3xl font-bold tracking-tight text-navy">Profil Saya</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Self-view real via `GET /auth/me` + `GET /org/me/context` — scope `{scope}`, trace_id envelope. Tanpa membuka payroll nominal rekan.</p>
          </div>
          <span className="rounded-pill bg-success-light border border-success/20 px-3 py-1 text-xs font-medium text-success">Scope: {scope}</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white">
            {user.name.slice(0, 1)}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-navy">{user.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{roleDisplay(user.role)} · {user.email}</p>
          <p className="mt-1 text-sm font-mono text-xs text-slate-500">{user.divisionCode ?? 'Semua divisi'} · ID {user.id.slice(0,8)}</p>
          <div className="mt-4 rounded-card-lg bg-surface p-4 text-sm text-slate-600">
            {ctx.isLoading ? 'Memuat konteks...' : ctx.data ? `Scope real: ${scope} · Divisi ${(ctx.data as unknown as { divisions:{code:string}[] }).divisions.length} · Outlet ${(ctx.data as unknown as { outlets:{code:string}[] }).outlets.length}` : 'Konteks via /org/me/context'}
          </div>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-semibold text-navy">Self-service pribadi</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {selfService.map((item) => (
              <div key={item.label} className="rounded-card-lg border border-line/40 p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 font-semibold text-navy">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.visibility}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-semibold text-navy">Keamanan akun</h2>
          <div className="mt-4 space-y-3">
            {securityItems.map((item) => (
              <div key={item.title} className="rounded-card-lg border border-line/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-card-lg border border-line/40 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-all duration-300">
          <h2 className="text-lg font-semibold text-navy">Privacy guard</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p className="rounded-card-lg border border-line/40 p-4">Admin hanya melihat profil, jadwal, absensi, cuti, dan lembur milik sendiri.</p>
            <p className="rounded-card-lg border border-line/40 p-4">Payroll detail dan data karyawan lain tidak ditampilkan di self-view.</p>
            <p className="rounded-card-lg border border-line/40 p-4">Menu mengikuti capability role aktif, bukan hardcode halaman.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
