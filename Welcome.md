# Catatan Perintah Menjalankan — Dashboard Divisi

> Monorepo `npm 11` workspaces `["apps/*","packages/*"]` + **Laravel 13 / PHP 8.3** — `C:\Projects\dashboard-divisi`
> Terverifikasi 2026-09-01: `npm` + `Laravel 13` + `Vite 6` + `74 tests` + `29 tests`

## 1. Prasyarat

```powershell
node -v   # >=22
npm -v    # >=11
php -v    # 8.3+
composer -V
```

## 2. Install

```powershell
npm install                 # root, 330 packages (FE + contracts + db placeholder)
composer install            # dari apps/api
```

## 3. Env & DB

```powershell
# Laravel (apps/api/.env — APP_KEY + JWT_SECRET wajib)
copy apps\api\.env.example apps\api\.env
php artisan key:generate    # dari apps/api
php artisan migrate --seed  # 7 divisi + 7 outlet + 17 akun + division_configs
# File .env/.env.local di root = sisa NestJS, tidak dibaca Laravel
```

## 4. Menjalankan — dua terminal

Terminal A — BE Laravel:
```powershell
cd apps\api
php artisan serve --port 3000   # http://localhost:3000/api/v1
# cek: curl http://localhost:3000/api/v1/health  -> { data: { status: "ok" }, meta: { trace_id } }
```

Terminal B — FE Vite:
```powershell
npm --workspace @dashboard-divisi/web run dev   # http://localhost:5173 (proxy /api/v1 -> :3000)
```

Login E2E (via FE): `bod1@dashboard.test` / `Password123!` → envelope `trace_id` + httpOnly cookie.

## 5. Gate kualitas

```powershell
npm run lint        # eslint . — 0 errors
npm run typecheck   # npm --workspaces typecheck
npm run build       # vite split ~293kB gzip 92kB
npm run test        # vitest 29/29 + contracts 2/2 (FE)

# dari apps/api
php artisan test    # 74 tests, 335 assertions, sqlite :memory:
.\vendor\bin\pint --test   # style, ada di CI gate
```

CI: `.github/workflows/ci.yml` → `npm ci` + `setup-php 8.3` + `pint` + `php artisan test` + `migrate --pretend` + `migrate --force` (pgsql service).

## 6. URL Lokal

- Web: http://localhost:5173
- API: http://localhost:3000/api/v1 — prefix `api` dari `withRouting`

## 7. Catatan

- `packages/db` = **DEPRECATED** peninggalan Prisma — jangan edit, skema kanonik = `apps/api/database/migrations`.
- `apps/api/CLAUDE.md` + `AGENTS.md` stub — jangan jalankan `boost:install`.
- Jika `npm run dev` timeout 120s, itu normal (Vite watch); biarkan berjalan.

---
*Update 2026-09-01 — migrasi pnpm→npm, Laravel 13, rebuild FE real BE + showcase polish (OrgFilters card, Laporan tables, Target run-rate cards)*
