import { EmptyState, ErrorState, LoadingState, NoAccessState } from '../components/states';

export default function DemoStatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">FND-04</p>
        <h1 className="text-2xl lg:text-3xl font-semibold">Demo state dasar</h1>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-card-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Loading</h2>
          <LoadingState label="Memuat dashboard divisi..." />
        </div>

        <div className="rounded-card-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Empty</h2>
          <EmptyState
            title="Belum ada omzet"
            description="Data akan tampil setelah import omzet periode terpilih berhasil diposting."
            action={
              <button type="button" className="mt-2 rounded-input bg-primary px-4 py-2 text-sm text-white">
                Import Omzet
              </button>
            }
          />
        </div>

        <div className="rounded-card-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Error + Retry</h2>
          <ErrorState
            title="Gagal mengambil ringkasan"
            description="Trace ID demo-0001 tersimpan untuk investigasi."
            onRetry={() => undefined}
          />
        </div>

        <div className="rounded-card-lg border border-line bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">No Access</h2>
          <NoAccessState description="Role demo saat ini tidak memiliki scope untuk divisi ini." />
        </div>

        <div className="rounded-card-lg border border-line bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Partial / Stale</h2>
          <EmptyState
            title="Data sebagian tersedia"
            description="Omzet sudah tersedia, tetapi ringkasan workforce belum sinkron. Terakhir diperbarui 10 menit lalu."
          />
        </div>
      </section>
    </div>
  );
}
