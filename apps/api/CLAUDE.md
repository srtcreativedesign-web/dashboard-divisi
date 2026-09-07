# apps/api — Laravel 13 (stub)

> File ini menggantikan bootstrap `laravel-boost` bawaan.
> **Jangan jalankan `composer require laravel/boost` / `php artisan boost:install`** tanpa persetujuan owner — akan menimpa `CLAUDE.md` + `AGENTS.md`.

Rujuk sumber kebenaran: `../../CLAUDE.md` (root), `../../SOP.md`, `../../Dashboard.md`, `routes/api.php`.

Perintah kanonik (dari `apps/api`):
```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed   # 7 divisi + 17 akun + division_configs
php artisan serve --port 3000  # http://localhost:3000/api/v1
php artisan test             # 74 tests, sqlite :memory:
./vendor/bin/pint            # formatter, ada di CI gate
```
