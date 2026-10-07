import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText, FolderKanban, Smartphone } from 'lucide-react';
import { MVP_MODULES } from '../../config/mvp';
import { useAuth } from '../../session/AuthContext';
import { canAccessDivision, hasCapability } from '../../session/capability';
import { NoAccessState } from '../../components/states';

const icons = { ACC: BookOpenText, PROJECT: FolderKanban, CELL: Smartphone };

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const modules = MVP_MODULES.filter(module => canAccessDivision(user, module.code) && hasCapability(user.role, module.capability, user.divisionCode));
  return <div className="space-y-6" data-testid="dashboard-page">
    <section className="rounded-card-lg border border-line bg-white p-6 shadow-card">
      <h1 className="text-2xl font-semibold text-navy">Workspace ERP</h1>
      <p className="mt-2 text-sm text-slate-500">Pilih modul sesuai kewenangan Anda.</p>
    </section>
    {modules.length ? <section className="grid gap-4 md:grid-cols-3" aria-label="Modul ERP">
      {modules.map(module => {
        const Icon = icons[module.code];
        return <Link key={module.code} to={module.path} className="rounded-card-lg border border-line bg-white p-6 shadow-card transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary">
          <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-navy">{module.name}</h2>
          <p className="mt-2 text-sm text-slate-500">{module.description}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">Buka modul <ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
        </Link>;
      })}
    </section> : <NoAccessState description="Akun Anda belum ditugaskan ke modul MVP. Hubungi pengelola akses perusahaan." />}
  </div>;
}
