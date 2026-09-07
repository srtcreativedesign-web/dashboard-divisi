# Draft: Rebuild Frontend Complete — SOP + Real BE + Modern UI (Struktur Tetap)

**Tujuan:** Selesaikan semua sisa P0 & P1 tanpa henti, hingga `npm run lint/typecheck/test/build` hijau + E2E manual OK, tanpa mock/hardcode.

## Scope
- FE: 10 pages (`Dashboard`, `Omzet`, `Target`, `Penilaian`, `Karyawan`, `Workforce`, `Laporan`, `Konfigurasi`, `Profil`, `Login` + `DemoStates`) — struktur UI tetap (sidebar 64, header glass, main outlet), konten bebas modern, data real BE via `api/client` proxy `/api` + `AuthContext` + TanStack Query.
- BE: sudah real (Laravel 13, 74 tests), hanya polish `AuditService` + `cors` + `KpiCompatibility` config-driven (sudah).

## Task Draft (Eksekusi Berurutan)

### A. P0 — Data Handling & Auth (Anti `Token tidak ditemukan`)
1. **Auth guard final** — `RouteGuard` sudah pakai `useAuth` + `useSession` fallback, `AuthContext` auto-login `manager.wrap` via proxy, `api/client` 401 → redirect `/login?expired=1`. *Sisa:* pastikan `HomeRedirect` loading skeleton, `AppLayout` user fallback test.
2. **Trace_id & toast** — `components/states.tsx` sudah ada `traceId` + Copy + `401 → Masuk`. *Sisa:* pasang di semua pages: `Dashboard`, `Omzet`, `Target`, `Laporan`, `Karyawan`, `Konfigurasi`, `Penilaian`, `Workforce` → `ErrorState traceId={e.traceId}` + `sonner` toast untuk mutation `Omzet upload` & `Target upsert`.
3. **Hapus sisa mock** — `ModulePage` sudah `Daftar data (Real)`, `DemoStates` tetap demo. *Sisa:* `Target` governance card, `Penilaian` executive, `Laporan` katalog — pastikan semua `const` hardcode sudah diganti `useQuery` real (sudah 90%, cek ulang `Workforce`/`Karyawan`).

### B. P1 — Design System Konsisten (Modern tapi Struktur Sama)
4. **Tokens** — `index.css` sudah `radius 12/16`, `shadow-glass`, `glass` blur — *Sisa:* pakai konsisten di 9 pages (sekarang `Dashboard` sudah `rounded-card-lg` + gradient, 9 lain masih `rounded-card`).
5. **Primitives** — `components/ui/Button.tsx` + `Input.tsx` (baru) — *Sisa:* ganti semua `<button className="rounded-input ...">` & `<input className="rounded-input ...">` di `Login`, `Target`, `Omzet`, `Konfigurasi` ke `<Button>`/`<Input>`/`<Select>`.
6. **Layout modern** — `AppLayout.tsx` sudah gradient sidebar + glass header + lucide icons — *Sisa:* tambah **drawer mobile** (sekarang horizontal scroll) — buat `MobileDrawer` dengan `useState` + `Sheet` + `Menu` overlay.
7. **A11y** — `Table` sudah `caption sr-only` + `scope col` di `ModulePage` — *Sisa:* terapkan ke semua `table` di `Dashboard`, `Target`, `Karyawan`, `Omzet`, `Konfigurasi` + `axe` check `eslint-plugin-jsx-a11y` (belum).

### C. QA Final
8. **Lint/Typecheck/Build** — `npm run lint` (fix `StatusPill` unused), `typecheck` (fix `FormData` headers), `build` 119 modules split — *Sisa:* `npm approve-scripts` untuk `esbuild`/`prisma` (warn `allow-scripts`).
9. **Test** — `vitest` 29/29 FE + `php artisan test` 74 BE — *Sisa:* `AppLayout.test` sudah `getAllByText` + `Sinkron real-time`, `setupTests.ts` mock `fetch` untuk `bod/overview` etc. — pastikan tetap hijau setelah P0/P1.
10. **E2E manual** — `http://localhost:5173/login` → `bod1` → `dashboard` 7 divisi → `target` upsert → `omzet` upload → `laporan` → cek `trace_id` di Network + `X-Trace-Id` header.

### D. Dokumen
11. **Vault** — `Dashboard.md` log, `Decisions/*-migrasi-pnpm-ke-npm.md` + `*-rebuild-frontend-real-be.md` sudah, tambah `Lessons/` untuk `AuthContext` + `proxy` + `TanStack enabled`.

## Kriteria Selesai (DoD SOP 3)
- `npm run lint` 0 errors, `npm run typecheck` 0 errors, `npm run build` success, `npm run test` 29/29 + `php artisan test` 74/74, `vite` proxy `/api` 200, login real → dashboard data real (bukan `Failed to fetch`/`Token tidak ditemukan`), UI modern `rounded-card-lg` konsisten, `trace_id` copy di semua `ErrorState`, `Button`/`Input` terpakai di semua form.

## Urutan Eksekusi (Tanpa Henti)
A1 → A2 → A3 → B4 → B5 → B6 → B7 → C8 → C9 → C10 → D11
